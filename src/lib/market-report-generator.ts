// Wochen-Marktbericht: erzeugen, prüfen, speichern.
//
// Ausgelagert aus dem Cron, damit derselbe Weg auch manuell auslösbar ist —
// und damit jeder Schritt seine echte Ursache zurückgibt statt eines stillen
// `false`. Vorgeschichte: Auf der Seite stand über Wochen ein Bericht, dessen
// gesamter Inhalt das Wort „test" war, während der Cron Erfolg meldete.

import { generateMarketSummary, berichtKartenDaten } from './ai-generator';
import { mitQualitaetsschranke, berichtVerstoesse, type Verstoss } from './qualitaet';
import { saveMarketReport } from './market-report-storage';
import { isoKalenderwoche } from './kalenderwoche';
import { describeAiError } from './ai-error';
import { recordAiUsage } from './ai-usage';
import type { PokemonCard, MarketSummary } from '@/types';
import { relevanteBerichtsGewinner, ladeMarktLage, marktLageText, type MarktLage } from './markt-lage';
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
  | 'rejected_quality'
  | 'save_failed'
  | 'failed';

export interface MarketReportResult {
  status: MarketReportStatus;
  weekStart?: string;
  weekNumber?: number;
  reportChars?: number;
  cards?: number;
  /** Erzeugungsversuche bis zum Bestehen (oder Aufgeben) der Qualitätsschranke. */
  versuche?: number;
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
export async function berichtErzeugen(
  lage: MarktLage,
): Promise<{ summary: MarketSummary | null; reportText: string; daten: string; verstoesse: Verstoss[]; versuche: number }> {
  // Gewinner/Verlierer bevorzugt aus den BESTÄTIGTEN Bewegungen — ein
  // Einzelangebot soll nicht als Wochengewinner auf der Seite stehen.
  const cards = lage.pool;
  const ausBestaetigt = splitMovers(lage.bestaetigt.map((b) => b.karte), 5);
  const ausPool = splitMovers(cards, 5);
  const gainers = ausBestaetigt.gainers.length >= 3 ? ausBestaetigt.gainers : ausPool.gainers;
  const losers = ausBestaetigt.losers.length >= 3 ? ausBestaetigt.losers : ausPool.losers;
  const daten = marktLageText(lage, { preise: true, gedaechtnis: true });
  // Geprüft wird gegen ALLES, was das Modell gesehen hat: Faktenblock + Kartenzeilen.
  const belege = `${daten}\n${berichtKartenDaten(cards)}`;

  // QUALITÄTSSCHRANKE mit Wiederholung (qualitaet.ts): Länge, Pflicht-
  // Abschnitte, Inhaltsregeln und — vor allem — jede Zahl belegt. Hält sie
  // nach drei Versuchen nicht, wird NICHT veröffentlicht.
  const r = await mitQualitaetsschranke(
    (hinweis) => generateMarketSummary(cards, gainers, losers, daten, hinweis),
    (s) => berichtVerstoesse((s.weeklyReport || '').trim(), belege, MIN_REPORT_CHARS),
  );
  return {
    summary: r.ergebnis,
    reportText: (r.ergebnis?.weeklyReport || '').trim(),
    daten: belege,
    verstoesse: r.verstoesse,
    versuche: r.versuche,
  };
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
    const { summary, reportText, verstoesse, versuche } = await berichtErzeugen(lage);

    // Qualitätsgate: lieber kein neuer Bericht als ein falscher oder ein Platzhalter.
    if (!summary || verstoesse.length > 0) {
      const grund = verstoesse.map((v) => `${v.regel}: ${v.detail}`).join('; ');
      console.error(`Marktbericht KW ${weekNumber} nach ${versuche} Versuchen verworfen: ${grund}`);
      return {
        status: verstoesse.some((v) => v.regel === 'zu-kurz') && verstoesse.length === 1 ? 'rejected_too_short' : 'rejected_quality',
        weekStart,
        weekNumber,
        reportChars: reportText.length,
        cards: cards.length,
        versuche,
        error: `Qualitätsschranke nach ${versuche} Versuchen nicht bestanden — nicht veröffentlicht (${grund.slice(0, 400)})`,
      };
    }

    const saved = await saveMarketReport({
      weekStart,
      weekNumber,
      reportText,
      topGainers: (await relevanteBerichtsGewinner(summary.topGainers)).slice(0, 6),
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
