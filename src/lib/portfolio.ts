// Pure portfolio business logic — no React, no server dependencies, fully testable.

export type CardLanguage = 'EN' | 'DE' | 'JP' | 'KR';

export const LANG_FLAG: Record<CardLanguage, string> = {
  EN: '🇬🇧', DE: '🇩🇪', JP: '🇯🇵', KR: '🇰🇷',
};
export const LANG_LABEL: Record<CardLanguage, string> = {
  EN: 'Englisch', DE: 'Deutsch', JP: 'Japanisch', KR: 'Koreanisch',
};

export const RANGE_DAYS: Record<'1D' | '1W' | '1M' | '3M' | '1Y', number> = {
  '1D': 2, '1W': 7, '1M': 30, '3M': 90, '1Y': 365,
};

export interface PortfolioHolding {
  cardId: string;
  cardName: string;
  setName: string;
  setCode: string;
  imageUrl: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  language: CardLanguage;
  addedAt: string;
}

export interface LiveCardData {
  price: number;
  priceHistory: Array<{ date: string; price: number }>;
  /** Wie viele davon echte Tages-Snapshots sind (Rest: Cardmarket-Ankerpunkte). */
  dailyPoints?: number;
  /**
   * Woher der Preis stammt: direkt von der Kartendatenbank (`live`) oder aus
   * dem eigenen Index (`index`), weil der Abruf ausfiel. Ein Preis vom Vortag
   * ist brauchbar, darf aber nicht aussehen wie einer von jetzt.
   */
  quelle?: 'live' | 'index';
  /** Datenstand des Index — nur bei `quelle: 'index'`. */
  indexStand?: string | null;
}

export interface ChartPoint {
  date: string;
  value: number;
}

/**
 * Fills in missing fields from persisted data — handles old localStorage entries
 * without `language`.
 *
 * Wichtig: Ein reiner Spread reicht NICHT. `{...{ quantity: undefined }}` setzt
 * den Schlüssel auf `undefined` und überschreibt damit den Vorgabewert; aus
 * `purchasePrice * quantity` wird dann `NaN` und der Portfoliowert zeigt nichts
 * mehr an. Gespeicherte Daten können außerdem `null` enthalten (JSON kennt kein
 * `undefined`) oder `NaN`, wenn eine Eingabe nicht parsebar war. Deshalb wird
 * jedes Feld einzeln geprüft.
 */
function firstValid<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && !Number.isFinite(value)) return fallback;
  return value as T;
}

export function normalizeHolding(
  h: Partial<PortfolioHolding> & { cardId: string },
): PortfolioHolding {
  return {
    cardId: h.cardId,
    cardName: firstValid(h.cardName, ''),
    setName: firstValid(h.setName, ''),
    setCode: firstValid(h.setCode, ''),
    imageUrl: firstValid(h.imageUrl, ''),
    quantity: firstValid(h.quantity, 1),
    purchasePrice: firstValid(h.purchasePrice, 0),
    purchaseDate: firstValid(h.purchaseDate, ''),
    language: firstValid(h.language, 'EN'),
    addedAt: firstValid(h.addedAt, ''),
  };
}

/** Current price for a holding — live if available, otherwise falls back to purchasePrice. */
export function livePriceOf(
  holding: Pick<PortfolioHolding, 'cardId' | 'purchasePrice'>,
  liveData: Record<string, LiveCardData>,
): number {
  return liveData[holding.cardId]?.price || holding.purchasePrice;
}

/** Aggregated P&L for all holdings. */
export function computePnl(
  holdings: PortfolioHolding[],
  liveData: Record<string, LiveCardData>,
) {
  const totalCost  = holdings.reduce((s, h) => s + h.purchasePrice * h.quantity, 0);
  const totalValue = holdings.reduce((s, h) => s + livePriceOf(h, liveData) * h.quantity, 0);
  const pnl    = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  return { totalCost, totalValue, pnl, pnlPct };
}

/**
 * Builds the aggregated portfolio value time series as a CONTINUOUS daily series.
 *
 * Warum lückenlos: Karten haben unterschiedlich dichte Preis-Historien. Würde jede
 * Karte nur an "ihren" Datenpunkten summiert, bricht die Kurve an allen anderen Tagen
 * ein (fehlender Kartenwert) — die Grafik zeigt dann Dips, die nie passiert sind.
 *
 * Regeln pro Karte und Tag:
 * - vor dem Kaufdatum: trägt nichts bei (Portfolio besaß die Karte nicht)
 * - sonst: letzter bekannter History-Preis ≤ Tag (Carry-Forward), Fallback Kaufpreis
 * - am heutigen Tag: Live-Preis — damit endet die Kurve exakt auf dem Gesamtwert,
 *   der oben im Portfolio angezeigt wird
 *
 * `today` is injectable for deterministic testing.
 */
export function computeChartData(
  holdings: PortfolioHolding[],
  liveData: Record<string, LiveCardData>,
  today: string = new Date().toISOString().split('T')[0],
): ChartPoint[] {
  if (holdings.length === 0) return [];

  const MAX_DAYS = 365;

  const prepared = holdings.map((h) => {
    const hist = (liveData[h.cardId]?.priceHistory ?? [])
      .filter((p) => (!h.purchaseDate || p.date >= h.purchaseDate) && p.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    const ownedFrom = h.purchaseDate || hist[0]?.date || today;
    return { h, hist, ownedFrom };
  });

  let start = prepared.reduce((min, p) => (p.ownedFrom < min ? p.ownedFrom : min), today);
  const cap = new Date(today + 'T00:00:00Z');
  cap.setUTCDate(cap.getUTCDate() - (MAX_DAYS - 1));
  const capStr = cap.toISOString().split('T')[0];
  if (start < capStr) start = capStr;

  const series: ChartPoint[] = [];
  const cursor = new Date(start + 'T00:00:00Z');
  const end = new Date(today + 'T00:00:00Z');

  while (cursor.getTime() <= end.getTime()) {
    const day = cursor.toISOString().split('T')[0];
    let value = 0;
    for (const { h, hist, ownedFrom } of prepared) {
      if (day < ownedFrom) continue;
      // Carry-Forward: letzter History-Preis bis zu diesem Tag, sonst Kaufpreis
      let carry = h.purchasePrice;
      for (const p of hist) {
        if (p.date <= day) carry = p.price;
        else break;
      }
      const live = liveData[h.cardId]?.price || 0;
      const price = day === today && live > 0 ? live : carry;
      value += price * h.quantity;
    }
    series.push({ date: day, value: Math.round(value * 100) / 100 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Alles heute gekauft → nur 1 Punkt. Flachen Vortagespunkt ergänzen, damit eine Linie rendert.
  if (series.length === 1) {
    const prev = new Date(today + 'T00:00:00Z');
    prev.setUTCDate(prev.getUTCDate() - 1);
    series.unshift({ date: prev.toISOString().split('T')[0], value: series[0].value });
  }

  return series;
}

/**
 * Filtert die Serie auf die letzten N TAGE (echte Datums-Differenz, nicht Punktanzahl —
 * sonst zeigt "1W" bei lückenhaften Daten Monate an). Mindestens 2 Punkte fürs Rendering.
 */
export function filterByRange(
  data: ChartPoint[],
  range: keyof typeof RANGE_DAYS,
): ChartPoint[] {
  if (data.length === 0) return data;
  const last = data[data.length - 1].date;
  const cutoff = new Date(last + 'T00:00:00Z');
  cutoff.setUTCDate(cutoff.getUTCDate() - (RANGE_DAYS[range] - 1));
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const filtered = data.filter((p) => p.date >= cutoffStr);
  return filtered.length >= 2 ? filtered : data.slice(-2);
}

/**
 * Einstand aller Karten, die NACH einem Stichtag gekauft wurden.
 *
 * WOZU: Ohne das zählt jeder Zukauf als Wertzuwachs. Beobachtet an einem
 * echten Bestand: Der Jahreswert wies +636,90 € aus, während der tatsächliche
 * Gewinn +216,90 € betrug — die Differenz von 420 € waren exakt zwei später
 * gekaufte Positionen. Wer Karten nachkauft, hat dadurch nichts verdient.
 *
 * Käufe GENAU am Stichtag zählen nicht mit: Sie stecken bereits im Startwert
 * des Zeitraums.
 */
export function investedAfter(
  holdings: PortfolioHolding[],
  afterDate: string,
  untilDate?: string,
): number {
  if (!afterDate) return 0;
  return holdings
    .filter(
      (h) =>
        h.purchaseDate &&
        h.purchaseDate > afterDate &&
        (!untilDate || h.purchaseDate <= untilDate),
    )
    .reduce((s, h) => s + h.purchasePrice * h.quantity, 0);
}

export interface RangePerformance {
  /** Wertveränderung ohne Zukäufe — das, was der Markt gemacht hat. */
  pnl: number;
  pnlPct: number;
  /** Im Zeitraum zusätzlich investiert (erklärt die Stufen in der Kurve). */
  invested: number;
}

/**
 * Wertentwicklung eines Zeitraums, bereinigt um Zukäufe.
 *
 * Die Bezugsgröße für den Prozentwert ist Startwert + Zukäufe: Wer im Zeitraum
 * nachgelegt hat, hat auch mehr Kapital im Risiko — sonst fiele der Prozentwert
 * allein durch einen Zukauf.
 */
export function computeRangePerformance(
  holdings: PortfolioHolding[],
  endValue: number,
  startValue: number | null,
  startDate: string,
  fallback: { pnl: number; pnlPct: number },
): RangePerformance {
  if (startValue === null) {
    return { pnl: fallback.pnl, pnlPct: fallback.pnlPct, invested: 0 };
  }
  const invested = investedAfter(holdings, startDate);
  const pnl = endValue - startValue - invested;
  const basis = startValue + invested;
  return { pnl, pnlPct: basis > 0 ? (pnl / basis) * 100 : 0, invested };
}

/**
 * Liegt für diese Karte ein echter Marktpreis vor?
 *
 * WARUM DAS SICHTBAR SEIN MUSS: Fehlt der Live-Preis, rechnet die Seite mit dem
 * Kaufpreis weiter. Die Position zeigt dann „+0,00 € · 0,0 %" — nicht zu
 * unterscheiden von einer Karte, die sich tatsächlich nicht bewegt hat. Ein
 * ausgefallener Abruf sieht so aus wie eine Messung.
 */
export function hasLivePrice(
  holding: Pick<PortfolioHolding, 'cardId'>,
  liveData: Record<string, LiveCardData>,
): boolean {
  return (liveData[holding.cardId]?.price ?? 0) > 0;
}

/**
 * Tage, an denen mindestens eine Karte einen ECHTEN Messwert hat.
 *
 * WOZU: Die Portfolio-Kurve ist eine lückenlose Tagesreihe — zwischen zwei
 * Messungen wird der letzte bekannte Preis weitergetragen. Das ist richtig
 * (siehe `computeChartData`), erzeugt aber eine glatte Linie, die nach viel
 * mehr Messung aussieht, als stattgefunden hat. Mit dieser Liste kann die
 * Oberfläche die echten Punkte markieren und ihre Anzahl nennen, statt den
 * Eindruck einer durchgehenden Messung zu erwecken.
 */
export function realObservationDates(
  holdings: PortfolioHolding[],
  liveData: Record<string, LiveCardData>,
): string[] {
  const dates = new Set<string>();
  for (const h of holdings) {
    for (const p of liveData[h.cardId]?.priceHistory ?? []) {
      if (p?.date && p.price > 0) dates.add(p.date);
    }
  }
  return [...dates].sort();
}

export interface DataQuality {
  /** Echte Messtage im gewählten Zeitraum. */
  observations: number;
  /** Karten, für die eine echte Tages-Historie vorliegt. */
  cardsWithDailyHistory: number;
  totalCards: number;
  /** Reicht die Dichte, damit die Linie nicht mehr erklärungsbedürftig ist? */
  dense: boolean;
}

/** Ab so vielen Messtagen im Zeitraum gilt die Kurve als dicht genug. */
export const DENSE_THRESHOLD = 12;

/**
 * Beurteilt, wie belastbar die Kurve im gewählten Zeitraum ist.
 *
 * Bewusst KEINE Schönfärberei: Liegen nur drei Messpunkte vor, sagt die
 * Oberfläche das. Der Gegenentwurf — eine glatte Linie ohne Hinweis — wäre
 * eine Aussage über Kursverläufe, die niemand gemessen hat.
 */
export function assessDataQuality(
  holdings: PortfolioHolding[],
  liveData: Record<string, LiveCardData>,
  fromDate: string,
): DataQuality {
  const observations = realObservationDates(holdings, liveData).filter((d) => d >= fromDate).length;
  const cardsWithDailyHistory = holdings.filter(
    (h) => (liveData[h.cardId]?.dailyPoints ?? 0) >= 2,
  ).length;
  return {
    observations,
    cardsWithDailyHistory,
    totalCards: holdings.length,
    dense: observations >= DENSE_THRESHOLD,
  };
}

/**
 * Median einer Zahlenliste — robust gegen Ausreißer (z.B. einzelne Fake-/Cent-Listings
 * auf Cardmarket, die den Minimumpreis verfälschen würden). Gibt null bei leerer Liste.
 */
export function median(values: number[]): number | null {
  const sorted = values.filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Formatierung liegt zentral in @/lib/format — hier nur re-exportiert, damit
// bestehende Importe weiter funktionieren und es KEINE zweite Umsetzung gibt
// (CLAUDE.md, Code-Regel 10: keine doppelten Implementierungen).
export { formatEur, formatCompactEur as shortEur } from './format';

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit',
  });
}

export function setCodeFromId(cardId: string): string {
  const parts = cardId.split('-');
  return parts.slice(0, -1).join('-');
}

// ── Auswertung des Bestands ─────────────────────────────────────────────────
//
// Die Portfolio-Seite soll zwei Fragen sofort beantworten: Was ist meine
// Sammlung wert, und wie entwickelt sie sich? Ein Gesamtwert allein reicht
// dafür nicht — es braucht die Treiber dahinter.

export interface PositionPerformance {
  holding: PortfolioHolding;
  value: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  /** Marktpreis vorhanden? Ohne ihn ist die Zeile keine Messung. */
  live: boolean;
}

/** Wertentwicklung je Position — Grundlage für Gewinner, Verlierer und Größe. */
export function positionPerformances(
  holdings: PortfolioHolding[],
  liveData: Record<string, LiveCardData>,
): PositionPerformance[] {
  return holdings.map((h) => {
    const live = hasLivePrice(h, liveData);
    const preis = livePriceOf(h, liveData);
    const value = preis * h.quantity;
    const cost = h.purchasePrice * h.quantity;
    return {
      holding: h,
      value,
      cost,
      pnl: value - cost,
      pnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0,
      live,
    };
  });
}

/**
 * Beste und schwächste Positionen.
 *
 * Nur Positionen MIT Marktpreis: Ohne ihn rechnet die Zeile mit dem Kaufpreis
 * weiter und stünde mit 0,0 % in der Mitte — als hätte sie sich nicht bewegt.
 * Strikt nach Vorzeichen getrennt, wie bei den Marktkennzahlen: Eine Position
 * kann nicht gleichzeitig bester und schwächster Wert sein.
 */
export function topPositions(
  performances: PositionPerformance[],
  limit = 3,
): { winners: PositionPerformance[]; losers: PositionPerformance[] } {
  const bewertbar = performances.filter((p) => p.live && p.cost > 0);
  return {
    winners: bewertbar.filter((p) => p.pnl > 0).sort((a, b) => b.pnlPct - a.pnlPct).slice(0, limit),
    losers: bewertbar.filter((p) => p.pnl < 0).sort((a, b) => a.pnlPct - b.pnlPct).slice(0, limit),
  };
}

export interface SetAllocation {
  setCode: string;
  setName: string;
  value: number;
  cost: number;
  pnlPct: number;
  cards: number;
  /** Anteil am Gesamtwert in Prozent. */
  sharePct: number;
}

/** Aufteilung des Bestands nach Set — zeigt Klumpenrisiko und Treiber. */
export function setAllocation(performances: PositionPerformance[]): SetAllocation[] {
  const gesamt = performances.reduce((s, p) => s + p.value, 0);
  const nachSet = new Map<string, SetAllocation>();

  for (const p of performances) {
    const code = p.holding.setCode || 'unbekannt';
    const eintrag = nachSet.get(code) ?? {
      setCode: code,
      setName: p.holding.setName || 'Ohne Set',
      value: 0,
      cost: 0,
      pnlPct: 0,
      cards: 0,
      sharePct: 0,
    };
    eintrag.value += p.value;
    eintrag.cost += p.cost;
    eintrag.cards += p.holding.quantity;
    nachSet.set(code, eintrag);
  }

  return [...nachSet.values()]
    .map((e) => ({
      ...e,
      pnlPct: e.cost > 0 ? ((e.value - e.cost) / e.cost) * 100 : 0,
      sharePct: gesamt > 0 ? (e.value / gesamt) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Vergleich der eigenen Entwicklung gegen den Gesamtmarkt.
 *
 * Gibt `null` zurück, wenn eine der beiden Seiten keine belastbare Zahl hat —
 * eine Outperformance gegen einen Index, den es nicht gibt, wäre eine
 * erfundene Aussage.
 */
export function comparePerformance(
  portfolioPct: number | null,
  marketPct: number | null,
): { portfolioPct: number; marketPct: number; deltaPoints: number } | null {
  if (portfolioPct === null || marketPct === null) return null;
  if (!Number.isFinite(portfolioPct) || !Number.isFinite(marketPct)) return null;
  return { portfolioPct, marketPct, deltaPoints: portfolioPct - marketPct };
}
