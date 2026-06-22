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
 * Builds the aggregated portfolio value time series.
 * - Uses live price history when available (filtered to dates >= purchaseDate).
 * - Falls back to a flat line at purchasePrice when no live data is available yet.
 * `today` is injectable for deterministic testing.
 */
export function computeChartData(
  holdings: PortfolioHolding[],
  liveData: Record<string, LiveCardData>,
  today: string = new Date().toISOString().split('T')[0],
): ChartPoint[] {
  if (holdings.length === 0) return [];
  const dateMap = new Map<string, number>();

  for (const h of holdings) {
    const hist = liveData[h.cardId]?.priceHistory ?? [];
    if (hist.length > 0) {
      for (const { date, price } of hist) {
        if (h.purchaseDate && date < h.purchaseDate) continue;
        dateMap.set(date, (dateMap.get(date) ?? 0) + price * h.quantity);
      }
    } else {
      const from = h.purchaseDate || today;
      dateMap.set(from, (dateMap.get(from) ?? 0) + h.purchasePrice * h.quantity);
      if (from !== today) {
        dateMap.set(today, (dateMap.get(today) ?? 0) + h.purchasePrice * h.quantity);
      }
    }
  }

  if (dateMap.size === 0) return [];
  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }));
}

/** Slices chart data to the last N days for the chosen time range. */
export function filterByRange(
  data: ChartPoint[],
  range: keyof typeof RANGE_DAYS,
): ChartPoint[] {
  return data.slice(-RANGE_DAYS[range]);
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
