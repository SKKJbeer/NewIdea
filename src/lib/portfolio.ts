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
}

export interface ChartPoint {
  date: string;
  value: number;
}

/** Fills in missing fields from persisted data — handles old localStorage entries without `language`. */
export function normalizeHolding(
  h: Partial<PortfolioHolding> & { cardId: string },
): PortfolioHolding {
  return {
    language: 'EN',
    purchaseDate: '',
    setCode: '',
    addedAt: '',
    quantity: 1,
    purchasePrice: 0,
    cardName: '',
    setName: '',
    imageUrl: '',
    ...h,
    cardId: h.cardId,
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

export function formatEur(n: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

export function shortEur(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k€`;
  return `${v.toFixed(0)}€`;
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit',
  });
}

export function setCodeFromId(cardId: string): string {
  const parts = cardId.split('-');
  return parts.slice(0, -1).join('-');
}
