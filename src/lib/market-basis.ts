import type { PokemonCard } from '@/types';
import { indexKartenFuerIndex } from './card-index';
import { getHomepageCards } from './homepage-data';
import { PMI_MIN_CARDS } from './market-metrics';

// WORAUF DER MARKTINDEX RECHNET — an EINER Stelle.
//
// Vorher stand `getHomepageCards(250)` an vier Stellen: im Tages-Cron, in der
// Studio-Route, in `/api/market/pmi` und im Rückfall des Marktkontexts. Vier
// Stellen, die dieselbe Frage beantworten, sind vier Gelegenheiten, sie
// unterschiedlich zu beantworten — genau die Doppel-Umsetzung, die in diesem
// Projekt schon einmal wochenlang widersprüchliche Zahlen erzeugt hat.
//
// GEMESSEN am 05.08.2026: Die alte Stichprobe ergab 204 auswertbare Karten aus
// 15 Sets. Der erfasste Bestand hat 19.690 Karten aus 155 Sets. Die Stichprobe
// bestand ausserdem ausschliesslich aus den obersten Seltenheitsstufen
// („Special Illustration Rare", „Hyper Rare") — eine Marktaussage aus einem
// Prozent des Bestands, und aus dem unrepraesentativsten Prozent.

export type MarktQuelle = 'index' | 'stichprobe' | 'keine';

export interface MarktBasis {
  karten: PokemonCard[];
  quelle: MarktQuelle;
}

/**
 * Karten, auf denen Index und Marktbreite gerechnet werden.
 *
 * Erst der eigene Bestand, dann die alte Stichprobe als Rückfall. Der Rückfall
 * bleibt, weil eine Datenbank ausfallen kann — aber er ist erkennbar: `quelle`
 * geht in die Cron-Antwort, damit „Index steht auf der kleinen Stichprobe" nie
 * unbemerkt der Normalzustand wird.
 */
export async function getMarketBasis(): Promise<MarktBasis> {
  const ausIndex = await indexKartenFuerIndex().catch((err) => {
    console.warn('[Marktbasis] Bestand nicht lesbar:', err);
    return [] as PokemonCard[];
  });

  // Die Schwelle ist die des Index selbst: Was für eine Aussage nicht reicht,
  // ist auch kein Grund, den Rückfall zu überspringen.
  if (ausIndex.length >= PMI_MIN_CARDS) return { karten: ausIndex, quelle: 'index' };

  const stichprobe = await getHomepageCards(250).catch(() => [] as PokemonCard[]);
  if (stichprobe.length > 0) return { karten: stichprobe, quelle: 'stichprobe' };

  return { karten: [], quelle: 'keine' };
}
