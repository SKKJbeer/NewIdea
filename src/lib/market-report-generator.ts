// Wochen-Marktbericht: erzeugen, prüfen, speichern.
//
// Ausgelagert aus dem Cron, damit derselbe Weg auch manuell auslösbar ist —
// und damit jeder Schritt seine echte Ursache zurückgibt statt eines stillen
// `false`. Vorgeschichte: Auf der Seite stand über Wochen ein Bericht, dessen
// gesamter Inhalt das Wort „test" war, während der Cron Erfolg meldete.

import { generateMarketSummary } from './ai-generator';
import { saveMarketReport } from './market-report-storage';
import { isoKalenderwoche } from './kalenderwoche';
import { describeAiError } from './ai-error';
import { recordAiUsage } from './ai-usage';
import type { PokemonCard, MarketSummary } from '@/types';
import { ladeMarktLage, marktLageText, type MarktLage } from './markt-lage';
import { splitMovers } from './market-metrics';

/**
 * Mindestlänge für einen veröffentlichungswürdigen Bericht. Ein Platzhalter wie
 * „test" darf niemals als Wochenanalyse auf der Seite landen.
 */
export const MIN_REPORT_CHARS = 300;

export type MarketReportStatus =
  | 'created'
  | 'no_cards'
  | 'rejected_too_short'
  | 'save_failed'
  | 'failed';

export interface MarketReportResult {
  status: MarketReportStatus;
  weekStart?: string;
  weekNumber?: number;
  reportChars?: number;
  cards?: number;
  error?: string;
}

/** Montag der laufenden Woche (UTC) + Kalenderwoche. */
export function currentWeek(now: Date = new Date()): { weekStart: string; weekNumber: number } {
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)),
  );
  return { weekStart: monday.toISOString().split('T')[0], weekNumber: isoKalenderwoche(monday) };
}

/** Wertvollste Karten nach Marktpreis. */
function topValueCards(cards: PokemonCard[], max = 6): PokemonCard[] {
  return [...cards]
    .sort((a, b) => {
      const pa = a.prices.market || a.prices.holofoil?.market || 0;
      const pb = b.prices.market || b.prices.holofoil?.market || 0;
      return pb - pa;
    })
    .slice(0, max);
}

/**
 * Erzeugt den Bericht der laufenden Woche und speichert ihn.
 * Wirft nicht — der Aufrufer bekommt den Status samt Klartext-Ursache.
 */
/**
 * Erzeugt den Berichtstext aus der Marktlage — speichert NICHTS. Gemeinsam
 * für den Wochen-Cron und den Probelauf im Studio.
 */
export async function berichtErzeugen(lage: MarktLage): Promise<{ summary: MarketSummary; reportText: string; daten: string }> {
  // Gewinner/Verlierer bevorzugt aus den BESTÄTIGTEN Bewegungen — ein
  // Einzelangebot soll nicht als Wochengewinner auf der Seite stehen.
  const cards = lage.pool;
  const ausBestaetigt = splitMovers(lage.bestaetigt.map((b) => b.karte), 5);
  const ausPool = splitMovers(cards, 5);
  const gainers = ausBestaetigt.gainers.length >= 3 ? ausBestaetigt.gainers : ausPool.gainers;
  const losers = ausBestaetigt.losers.length >= 3 ? ausBestaetigt.losers : ausPool.losers;
  const daten = marktLageText(lage, { preise: true, gedaechtnis: true });
  const summary = await generateMarketSummary(cards, gainers, losers, daten);
  return { summary, reportText: (summary.weeklyReport || '').trim(), daten };
}

export async function generateAndSaveMarketReport(): Promise<MarketReportResult> {
  const { weekStart, weekNumber } = currentWeek();

  try {
    // DIESELBE QUELLE WIE DIE STARTSEITE.
    //
    // Vorher: `fetchTrendingCards(20)` — 20 Karten aus EINER Set-Abfrage. Der
    // Bericht sprach damit über den Markt, sah aber nur ein einziges Set, und
    // die „wertvollsten Karten" waren sechs Karten aus ebendiesem Set. Zwei
    // Seiten, zwei Datengrundlagen, zwei Wahrheiten.
    //
    // Seit v6.14.0 dazu die ganze Marktlage (markt-lage.ts): Index, Breite,
    // BESTÄTIGTE Bewegungen, Set-Bewegung, Neuheiten, Japan, Angekündigtes.
    // Vorher sah der Prompt zehn Karten — und schrieb entsprechend steril.
    const lage = await ladeMarktLage();
    const cards = lage.pool;
    if (cards.length === 0) {
      return { status: 'no_cards', weekStart, weekNumber, error: 'Keine Kartendaten von der TCG-API erhalten' };
    }

    // Vorzeichen-Trennung zentral — dieselbe Regel wie auf der Startseite.
    const { summary, reportText } = await berichtErzeugen(lage);

    // Qualitätsgate: lieber kein neuer Bericht als ein Platzhalter auf der Startseite.
    if (reportText.length < MIN_REPORT_CHARS) {
      console.error(
        `Marktbericht KW ${weekNumber} verworfen: nur ${reportText.length} Zeichen (Minimum ${MIN_REPORT_CHARS})`,
      );
      return {
        status: 'rejected_too_short',
        weekStart,
        weekNumber,
        reportChars: reportText.length,
        cards: cards.length,
        error: `Berichtstext zu kurz (${reportText.length} Zeichen) — nicht veröffentlicht`,
      };
    }

    const saved = await saveMarketReport({
      weekStart,
      weekNumber,
      reportText,
      topGainers: summary.topGainers.slice(0, 6),
      topValue: topValueCards(cards),
      createdAt: new Date().toISOString(),
    });

    if (!saved.ok) {
      console.error(`Marktbericht KW ${weekNumber} konnte nicht gespeichert werden: ${saved.error}`);
      return { status: 'save_failed', weekStart, weekNumber, reportChars: reportText.length, error: saved.error };
    }

    return {
      status: 'created',
      weekStart,
      weekNumber,
      reportChars: reportText.length,
      cards: cards.length,
    };
  } catch (err) {
    const info = describeAiError(err);
    console.error(`Marktbericht KW ${weekNumber} fehlgeschlagen: ${info.message} :: ${info.raw}`);
    await recordAiUsage({
      purpose: 'marktbericht',
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
      ok: false,
      error: info.message,
    });
    return { status: 'failed', weekStart, weekNumber, error: info.message };
  }
}
