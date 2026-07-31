import { getHomepageCards } from './homepage-data';
import { fetchCardsBySet } from './pokemon-api';
import { computePmi, rankSets, hasRealTrend, MIN_SET_SAMPLE } from './market-metrics';
import type { PokemonCard } from '@/types';

// MARKTKONTEXT — der Gedanke, der das Produkt trägt.
//
// Eine Karte ist −13,6 % — ist das viel? Die Zahl allein sagt es nicht. Erst
// im Verhältnis zu ihrem Set und zum Gesamtmarkt wird daraus eine Aussage:
// Fällt die ganze Kategorie, oder fällt diese eine Karte?
//
// Genau diese Verbindung zieht sich durch das ganze Produkt:
//
//   Markt → Set → Karte → eigener Bestand
//
// alle vier am SELBEN Maßstab gemessen.
//
// ZWEI REGELN, die nicht verhandelbar sind:
//
// 1. NUR GLEICHE ZEITRÄUME. Der Kartentrend stammt aus dem 30-Tage-Vergleich
//    von Cardmarket; Set und Index werden aus derselben Größe gebildet. Ein
//    Vergleich von 30 Tagen gegen 7 Tage sähe aus wie eine Erkenntnis und wäre
//    ein Rechenfehler.
//
// 2. FEHLT EINE SEITE, ENTFÄLLT DER VERGLEICH. Kein Ersatzwert, keine
//    Schätzung, kein „ungefähr". Hat das Set zu wenige messbare Karten, steht
//    dort nichts — nicht 0 %.

/** Zeitraum aller hier verglichenen Werte. */
export const CONTEXT_WINDOW_DAYS = 30;

/**
 * Obergrenze für den gesamten Marktkontext.
 *
 * Die Einzelabrufe haben eigene Zeitlimits und Wiederholungen — zusammengenommen
 * könnten sie im ungünstigsten Fall fast eine Minute laufen. Für einen Abschnitt,
 * der unterhalb der Kartendaten steht, ist das jenseits von allem, was jemand
 * abwartet. Nach dieser Grenze entfällt der Vergleich einfach; die Karte selbst
 * ist längst da.
 */
const BUDGET_MS = 6000;

/** Bricht ein Versprechen nach `ms` ab und liefert stattdessen `null`. */
function mitZeitgrenze<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((auf) => setTimeout(() => auf(null), ms)),
  ]);
}

export interface MarketBenchmark {
  /** Indexwert über `CONTEXT_WINDOW_DAYS`. */
  value: number;
  cardCount: number;
  setCount: number;
}

// Zwischenspeicher im Arbeitsspeicher.
//
// WARUM: Die Kartenseite wird bei jedem Aufruf serverseitig erzeugt. Ohne
// Zwischenspeicher würde jeder Kartenaufruf die vollständige Marktstichprobe
// nachladen — ein Abruf von 250 Karten, gemessen 9 bis 17 Sekunden. Der Index
// ändert sich stündlich, nicht sekündlich; ein Wert dieser Stunde ist derselbe
// Wert.
let cache: { wert: MarketBenchmark | null; zeit: number } | null = null;
const CACHE_MS = 60 * 60 * 1000;

/** Indexstand als Vergleichsmaßstab. `null`, wenn die Datenlage nicht reicht. */
export async function getMarketBenchmark(): Promise<MarketBenchmark | null> {
  if (cache && Date.now() - cache.zeit < CACHE_MS) return cache.wert;

  try {
    const cards = await mitZeitgrenze(getHomepageCards(250), BUDGET_MS);
    if (cards === null) {
      console.warn('[Marktkontext] Index nicht rechtzeitig verfügbar');
      return null;
    }
    const cbi = computePmi(cards);
    const wert = cbi.sufficient
      ? { value: cbi.value, cardCount: cbi.cardCount, setCount: cbi.setCount }
      : null;
    cache = { wert, zeit: Date.now() };
    return wert;
  } catch (err) {
    console.warn('[Marktkontext] Index nicht ermittelbar:', err);
    // NICHT zwischenspeichern: Ein Fehlschlag darf nicht eine Stunde lang
    // gelten. Der nächste Aufruf versucht es erneut.
    return null;
  }
}

export interface SetBenchmark {
  code: string;
  name: string;
  /** Mittlere gemessene Bewegung der Karten dieses Sets. */
  value: number;
  /** Karten des Sets mit echter Messung. */
  measured: number;
  medianPrice: number;
}

/**
 * Vergleichswert eines Sets.
 *
 * Gibt `null` zurück, wenn zu wenige Karten des Sets eine echte Messung haben —
 * dieselbe Schwelle wie in der Set-Rangliste. Ein Set-Trend aus zwei Karten
 * wäre der Mittelwert zweier Karten, nicht die Bewegung eines Sets.
 */
export async function getSetBenchmark(setCode: string): Promise<SetBenchmark | null> {
  try {
    const cards = await mitZeitgrenze(fetchCardsBySet(setCode), BUDGET_MS);
    if (cards === null) return null;
    const gemessen = cards.filter(hasRealTrend);
    if (gemessen.length < MIN_SET_SAMPLE) return null;

    const rang = rankSets(cards, 1);
    // Ohne gemessenen Set-Trend gibt es keine Vergleichszeile — kein Ersatzwert.
    if (rang.length === 0 || rang[0].avgTrend === null) return null;

    return {
      code: rang[0].code,
      name: rang[0].name,
      value: rang[0].avgTrend,
      measured: gemessen.length,
      medianPrice: rang[0].medianPrice,
    };
  } catch (err) {
    console.warn(`[Marktkontext] Set ${setCode} nicht auswertbar:`, err);
    return null;
  }
}

export interface ContextRow {
  label: string;
  value: number;
  /** Zusatz, z. B. Stichprobengröße. */
  meta?: string;
  /** Hebt die Zeile hervor — die Karte selbst. */
  primary?: boolean;
}

export interface MarketContext {
  rows: ContextRow[];
  /**
   * Abstand der Karte zum Index in Prozentpunkten.
   *
   * Prozentpunkte, NICHT Prozent: Der Unterschied zwischen −13,6 % und −0,2 %
   * ist eine Differenz zweier Prozentwerte. Als „Prozent" bezeichnet wäre er
   * eine andere Größe und schlicht falsch.
   */
  relativeToMarket: number | null;
  windowDays: number;
}

/**
 * Setzt Karte, Set und Index zu einer Tabelle zusammen.
 *
 * Reine Funktion — die Abrufe passieren außerhalb, damit die Regeln hier
 * prüfbar bleiben.
 */
export function buildMarketContext(
  card: PokemonCard,
  set: SetBenchmark | null,
  markt: MarketBenchmark | null,
): MarketContext | null {
  // Ohne gemessene Kartenbewegung gibt es nichts zu vergleichen.
  if (!hasRealTrend(card)) return null;
  const kartenwert = card.trendPercent as number;

  const rows: ContextRow[] = [
    { label: card.nameDe ?? card.name, value: kartenwert, primary: true },
  ];

  if (set) {
    rows.push({
      label: set.name,
      value: set.value,
      meta: `${set.measured} gemessene Karten`,
    });
  }

  if (markt) {
    rows.push({
      label: 'CardBeacon Index',
      value: markt.value,
      meta: `${markt.cardCount} Karten · ${markt.setCount} Sets`,
    });
  }

  // Eine Tabelle mit nur der Karte selbst ist kein Kontext.
  if (rows.length < 2) return null;

  return {
    rows,
    relativeToMarket: markt ? kartenwert - markt.value : null,
    windowDays: CONTEXT_WINDOW_DAYS,
  };
}
