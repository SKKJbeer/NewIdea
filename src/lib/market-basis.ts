import type { PokemonCard } from '@/types';
import { indexKartenFuerIndex, indexStandTag } from './card-index';
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
  /** Tag des Kartenindex, wenn er die Grundlage ist. */
  stand?: string | null;
}

/** Wie alt der Kartenindex hoechstens sein darf, um als Tagesgrundlage zu gelten. */
export const MAX_BESTANDSALTER_TAGE = 2;

function heuteIso(): string {
  return new Date().toISOString().slice(0, 10);
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

  // VERALTETER BESTAND IST KEIN BESTAND.
  //
  // BEFUND (27.09.2026): Der Preisdurchlauf stand vom 05.08. an still. Der
  // Index wurde trotzdem jeden Tag aus diesem Bestand gerechnet und mit
  // HEUTIGEM Datum gespeichert — 53 Tage lang eine Tageszahl aus Preisen von
  // Anfang August. Das ist dieselbe erfundene Aktualitaet, die Stolperstelle 23
  // fuer Texte verbietet. Ist der Bestand aelter als die Frist, gilt er nicht;
  // dann rechnet die Stichprobe, die tatsaechlich von heute ist.
  const stand = ausIndex.length > 0 ? await indexStandTag().catch(() => null) : null;
  const alterTage = stand ? (Date.parse(`${heuteIso()}T00:00:00Z`) - Date.parse(`${stand}T00:00:00Z`)) / 86_400_000 : NaN;
  const frisch = Number.isFinite(alterTage) && alterTage <= MAX_BESTANDSALTER_TAGE;

  // Die Schwelle ist die des Index selbst: Was für eine Aussage nicht reicht,
  // ist auch kein Grund, den Rückfall zu überspringen.
  if (frisch && ausIndex.length >= PMI_MIN_CARDS) return { karten: ausIndex, quelle: 'index', stand };
  if (ausIndex.length >= PMI_MIN_CARDS) {
    console.warn(`[Marktbasis] Kartenindex veraltet (Stand ${stand ?? 'unbekannt'}) — rechne auf der Stichprobe`);
  }

  const stichprobe = await getHomepageCards(250).catch(() => [] as PokemonCard[]);
  if (stichprobe.length > 0) return { karten: stichprobe, quelle: 'stichprobe' };

  return { karten: [], quelle: 'keine' };
}
