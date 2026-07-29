// Wochen-Marktbericht: erzeugen, prüfen, speichern.
//
// Ausgelagert aus dem Cron, damit derselbe Weg auch manuell auslösbar ist —
// und damit jeder Schritt seine echte Ursache zurückgibt statt eines stillen
// `false`. Vorgeschichte: Auf der Seite stand über Wochen ein Bericht, dessen
// gesamter Inhalt das Wort „test" war, während der Cron Erfolg meldete.

import { fetchTrendingCards } from './pokemon-api';
import { generateMarketSummary } from './ai-generator';
import { saveMarketReport } from './market-report-storage';
import type { PokemonCard } from '@/types';

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
  const jan1 = new Date(Date.UTC(monday.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((monday.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return { weekStart: monday.toISOString().split('T')[0], weekNumber };
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
export async function generateAndSaveMarketReport(): Promise<MarketReportResult> {
  const { weekStart, weekNumber } = currentWeek();

  try {
    const cards = await fetchTrendingCards(20);
    if (cards.length === 0) {
      return { status: 'no_cards', weekStart, weekNumber, error: 'Keine Kartendaten von der TCG-API erhalten' };
    }

    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));
    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    const reportText = (summary.weeklyReport || '').trim();

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
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Marktbericht KW ${weekNumber} fehlgeschlagen:`, message);
    return { status: 'failed', weekStart, weekNumber, error: message };
  }
}
