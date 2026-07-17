import { describe, it, expect } from 'vitest';
import {
  normalizeHolding,
  computePnl,
  computeChartData,
  filterByRange,
  formatEur,
  shortEur,
  setCodeFromId,
  livePriceOf,
  median,
  RANGE_DAYS,
  type PortfolioHolding,
  type LiveCardData,
} from '@/lib/portfolio';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeHolding(overrides: Partial<PortfolioHolding> & { cardId: string }): PortfolioHolding {
  return {
    cardId: overrides.cardId,
    cardName: 'Test Card',
    setName: 'Test Set',
    setCode: 'sv1',
    imageUrl: 'https://example.com/img.png',
    quantity: 1,
    purchasePrice: 50,
    purchaseDate: '2024-01-10',
    language: 'EN',
    addedAt: '2024-01-10',
    ...overrides,
  };
}

// ─── median ─────────────────────────────────────────────────────────────────

describe('median', () => {
  it('returns null for an empty list', () => {
    expect(median([])).toBeNull();
  });

  it('returns the single value for one element', () => {
    expect(median([42])).toBe(42);
  });

  it('returns the middle value for an odd-length list', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('averages the two middle values for an even-length list', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('is robust against a single low outlier (Fake-Listing)', () => {
    // Ein Cent-Listing darf den repräsentativen Preis nicht nach unten ziehen.
    const withOutlier = median([0.01, 95, 100, 105, 110]);
    expect(withOutlier).toBe(100);
  });

  it('ignores NaN entries', () => {
    expect(median([NaN, 10, 20, NaN, 30])).toBe(20);
  });
});

// ─── normalizeHolding ─────────────────────────────────────────────────────────

describe('normalizeHolding', () => {
  it('fills in missing fields with safe defaults', () => {
    const result = normalizeHolding({ cardId: 'abc-1' });
    expect(result.language).toBe('EN');
    expect(result.quantity).toBe(1);
    expect(result.purchasePrice).toBe(0);
    expect(result.purchaseDate).toBe('');
    expect(result.setCode).toBe('');
    expect(result.cardName).toBe('');
    expect(result.imageUrl).toBe('');
  });

  it('preserves provided values', () => {
    const result = normalizeHolding({
      cardId: 'sv3-5',
      language: 'JP',
      quantity: 3,
      purchasePrice: 120,
      purchaseDate: '2024-06-01',
    });
    expect(result.language).toBe('JP');
    expect(result.quantity).toBe(3);
    expect(result.purchasePrice).toBe(120);
    expect(result.purchaseDate).toBe('2024-06-01');
  });

  it('always keeps the provided cardId', () => {
    const result = normalizeHolding({ cardId: 'sv5-99' });
    expect(result.cardId).toBe('sv5-99');
  });

  it('normalizes legacy entries without a language field', () => {
    // Simulate old localStorage entry: no `language` key at all
    const legacy = { cardId: 'old-1', cardName: 'Pikachu' } as Parameters<typeof normalizeHolding>[0];
    expect(normalizeHolding(legacy).language).toBe('EN');
  });
});

// ─── livePriceOf ─────────────────────────────────────────────────────────────

describe('livePriceOf', () => {
  it('returns live price when available', () => {
    const h = makeHolding({ cardId: 'x', purchasePrice: 50 });
    const live: Record<string, LiveCardData> = { x: { price: 80, priceHistory: [] } };
    expect(livePriceOf(h, live)).toBe(80);
  });

  it('falls back to purchasePrice when live data is missing', () => {
    const h = makeHolding({ cardId: 'missing', purchasePrice: 45 });
    expect(livePriceOf(h, {})).toBe(45);
  });

  it('falls back when live price is 0', () => {
    const h = makeHolding({ cardId: 'zero', purchasePrice: 30 });
    const live: Record<string, LiveCardData> = { zero: { price: 0, priceHistory: [] } };
    expect(livePriceOf(h, live)).toBe(30);
  });
});

// ─── computePnl ──────────────────────────────────────────────────────────────

describe('computePnl', () => {
  it('returns zeros for empty holdings', () => {
    const result = computePnl([], {});
    expect(result.totalCost).toBe(0);
    expect(result.totalValue).toBe(0);
    expect(result.pnl).toBe(0);
    expect(result.pnlPct).toBe(0);
  });

  it('calculates P&L with live prices', () => {
    const holdings = [makeHolding({ cardId: 'a', purchasePrice: 100, quantity: 2 })];
    const live: Record<string, LiveCardData> = { a: { price: 130, priceHistory: [] } };
    const { totalCost, totalValue, pnl, pnlPct } = computePnl(holdings, live);
    expect(totalCost).toBe(200);
    expect(totalValue).toBe(260);
    expect(pnl).toBeCloseTo(60);
    expect(pnlPct).toBeCloseTo(30);
  });

  it('uses purchasePrice when no live data', () => {
    const holdings = [makeHolding({ cardId: 'b', purchasePrice: 50, quantity: 1 })];
    const { totalCost, totalValue, pnl } = computePnl(holdings, {});
    expect(totalCost).toBe(50);
    expect(totalValue).toBe(50);
    expect(pnl).toBe(0);
  });

  it('sums multiple holdings correctly', () => {
    const holdings = [
      makeHolding({ cardId: 'c1', purchasePrice: 10, quantity: 5 }),
      makeHolding({ cardId: 'c2', purchasePrice: 200, quantity: 1 }),
    ];
    const live: Record<string, LiveCardData> = {
      c1: { price: 15, priceHistory: [] },
      c2: { price: 180, priceHistory: [] },
    };
    const { totalCost, totalValue } = computePnl(holdings, live);
    expect(totalCost).toBe(250);      // 10*5 + 200*1
    expect(totalValue).toBe(255);     // 15*5 + 180*1
  });

  it('shows negative P&L when value dropped', () => {
    const holdings = [makeHolding({ cardId: 'd', purchasePrice: 100, quantity: 1 })];
    const live: Record<string, LiveCardData> = { d: { price: 70, priceHistory: [] } };
    const { pnl, pnlPct } = computePnl(holdings, live);
    expect(pnl).toBe(-30);
    expect(pnlPct).toBeCloseTo(-30);
  });
});

// ─── computeChartData ─────────────────────────────────────────────────────────

describe('computeChartData', () => {
  const TODAY = '2024-06-15';

  it('returns empty array for empty holdings', () => {
    expect(computeChartData([], {}, TODAY)).toHaveLength(0);
  });

  it('returns a continuous flat daily line at purchasePrice when no live history', () => {
    const h = makeHolding({ cardId: 'no-hist', purchasePrice: 50, quantity: 1, purchaseDate: '2024-06-10' });
    const result = computeChartData([h], {}, TODAY);
    // 10.–15. Juni = 6 lückenlose Tage, alle auf Kaufpreis
    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ date: '2024-06-10', value: 50 });
    expect(result[5]).toEqual({ date: TODAY, value: 50 });
    expect(result.every((p) => p.value === 50)).toBe(true);
  });

  it('renders a flat 2-point line when purchaseDate equals today', () => {
    const h = makeHolding({ cardId: 'today', purchasePrice: 80, quantity: 1, purchaseDate: TODAY });
    const result = computeChartData([h], {}, TODAY);
    // Ein einzelner Punkt ergäbe keine Linie → synthetischer flacher Vortagespunkt
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(80);
    expect(result[1]).toEqual({ date: TODAY, value: 80 });
  });

  it('carry-forwards history prices between data points (no gap dips)', () => {
    const h = makeHolding({ cardId: 'live', quantity: 2, purchaseDate: '2024-06-01' });
    const live: Record<string, LiveCardData> = {
      live: {
        price: 70,
        priceHistory: [
          { date: '2024-06-01', price: 50 },
          { date: '2024-06-08', price: 60 },
          { date: '2024-06-15', price: 70 },
        ],
      },
    };
    const result = computeChartData([h], live, TODAY);
    // 1.–15. Juni = 15 lückenlose Tage
    expect(result).toHaveLength(15);
    expect(result[0]).toEqual({ date: '2024-06-01', value: 100 });  // 50*2
    expect(result[6]).toEqual({ date: '2024-06-07', value: 100 });  // Carry-Forward, kein Dip
    expect(result[7]).toEqual({ date: '2024-06-08', value: 120 });  // 60*2
    expect(result[14]).toEqual({ date: TODAY, value: 140 });        // Live-Preis 70*2
  });

  it('chart endpoint equals the live total value shown in the header', () => {
    const h = makeHolding({ cardId: 'sync', quantity: 1, purchaseDate: '2024-06-10', purchasePrice: 50 });
    const live: Record<string, LiveCardData> = {
      sync: {
        price: 99, // Live-Preis weicht vom letzten History-Punkt ab
        priceHistory: [{ date: '2024-06-14', price: 60 }],
      },
    };
    const result = computeChartData([h], live, TODAY);
    const { totalValue } = computePnl([h], live);
    expect(result[result.length - 1].value).toBe(totalValue); // 99, nicht 60
  });

  it('filters out price history before purchaseDate', () => {
    const h = makeHolding({ cardId: 'filter', quantity: 1, purchaseDate: '2024-06-10' });
    const live: Record<string, LiveCardData> = {
      filter: {
        price: 60,
        priceHistory: [
          { date: '2024-06-01', price: 40 }, // before purchase → excluded
          { date: '2024-06-05', price: 45 }, // before purchase → excluded
          { date: '2024-06-10', price: 50 }, // on purchase date → included
          { date: '2024-06-15', price: 60 }, // after → included
        ],
      },
    };
    const result = computeChartData([h], live, TODAY);
    expect(result[0].date).toBe('2024-06-10'); // beginnt am Kaufdatum, nicht früher
    expect(result[0].value).toBe(50);
    expect(result[result.length - 1].value).toBe(60);
  });

  it('aggregates multiple holdings on every day (no missing-card dips)', () => {
    const h1 = makeHolding({ cardId: 'h1', quantity: 1, purchaseDate: '2024-06-01' });
    const h2 = makeHolding({ cardId: 'h2', quantity: 2, purchaseDate: '2024-06-01' });
    const live: Record<string, LiveCardData> = {
      h1: { price: 100, priceHistory: [{ date: '2024-06-01', price: 100 }] },
      h2: { price: 30,  priceHistory: [{ date: '2024-06-01', price: 30 }] },
    };
    const result = computeChartData([h1, h2], live, TODAY);
    expect(result).toHaveLength(15);
    // Beide Karten tragen an JEDEM Tag bei — konstant 160, kein Einbruch
    expect(result.every((p) => p.value === 160)).toBe(true);
  });

  it('sorts output chronologically even with unsorted history', () => {
    const h = makeHolding({ cardId: 'sort', quantity: 1, purchaseDate: '2024-06-01' });
    const live: Record<string, LiveCardData> = {
      sort: {
        price: 30,
        priceHistory: [
          { date: '2024-06-10', price: 30 },
          { date: '2024-06-01', price: 10 },
          { date: '2024-06-05', price: 20 },
        ],
      },
    };
    const result = computeChartData([h], live, TODAY);
    const dates = result.map((p) => p.date);
    expect(dates).toEqual([...dates].sort());
    expect(result[0].value).toBe(10);
  });

  it('rounds values to 2 decimal places', () => {
    const h = makeHolding({ cardId: 'round', purchasePrice: 33.333, quantity: 3, purchaseDate: TODAY });
    const result = computeChartData([h], {}, TODAY);
    // 33.333 * 3 = 99.999 → rounds to 100.00
    expect(result[result.length - 1].value).toBe(100);
  });

  it('caps the series at 365 days', () => {
    const h = makeHolding({ cardId: 'old', purchasePrice: 10, quantity: 1, purchaseDate: '2020-01-01' });
    const result = computeChartData([h], {}, TODAY);
    expect(result.length).toBeLessThanOrEqual(365);
    expect(result[result.length - 1].date).toBe(TODAY);
  });
});

// ─── filterByRange ────────────────────────────────────────────────────────────

describe('filterByRange', () => {
  // Lückenlose Tagesserie über 400 Tage, endet am 2024-06-15
  const points = Array.from({ length: 400 }, (_, i) => {
    const d = new Date('2024-06-15T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - (399 - i));
    return { date: d.toISOString().split('T')[0], value: i };
  });

  it('filters by real DAYS for each range (daily series)', () => {
    expect(filterByRange(points, '1D')).toHaveLength(RANGE_DAYS['1D']);
    expect(filterByRange(points, '1W')).toHaveLength(RANGE_DAYS['1W']);
    expect(filterByRange(points, '1M')).toHaveLength(RANGE_DAYS['1M']);
    expect(filterByRange(points, '3M')).toHaveLength(RANGE_DAYS['3M']);
    expect(filterByRange(points, '1Y')).toHaveLength(RANGE_DAYS['1Y']);
  });

  it('filters by date, not point count — sparse series shows only the real window', () => {
    // Nur 5 Punkte, aber über 5 Monate verteilt: "1W" darf davon nicht einfach 5 nehmen
    const sparse = ['2024-02-01', '2024-03-01', '2024-04-01', '2024-06-10', '2024-06-15']
      .map((date, i) => ({ date, value: i }));
    const week = filterByRange(sparse, '1W');
    expect(week.map((p) => p.date)).toEqual(['2024-06-10', '2024-06-15']);
  });

  it('always keeps at least 2 points for rendering', () => {
    const sparse = [
      { date: '2024-01-01', value: 1 },
      { date: '2024-06-15', value: 2 },
    ];
    // Im 1D-Fenster liegt nur der letzte Punkt — Fallback auf die letzten 2
    expect(filterByRange(sparse, '1D')).toHaveLength(2);
  });

  it('returns empty array unchanged', () => {
    expect(filterByRange([], '1Y')).toHaveLength(0);
  });

  it('returns the most recent points (end of array)', () => {
    const result = filterByRange(points, '1W');
    const last   = points[points.length - 1];
    expect(result[result.length - 1]).toEqual(last);
  });
});

// ─── formatEur ────────────────────────────────────────────────────────────────

describe('formatEur', () => {
  it('formats zero', () => {
    expect(formatEur(0)).toBe('0,00 €');
  });

  it('formats whole numbers with two decimal places', () => {
    expect(formatEur(100)).toBe('100,00 €');
  });

  it('uses German decimal comma', () => {
    expect(formatEur(1234.56)).toContain('1.234,56');
  });

  it('formats negative values', () => {
    // Node.js Intl may use hyphen-minus or Unicode minus — both are acceptable
    const result = formatEur(-50);
    expect(result).toMatch(/-?50,00/);
    expect(result).toContain('€');
  });
});

// ─── shortEur ────────────────────────────────────────────────────────────────

describe('shortEur', () => {
  it('shows plain value below 1000', () => {
    expect(shortEur(520)).toBe('520€');
    expect(shortEur(0)).toBe('0€');
    expect(shortEur(999)).toBe('999€');
  });

  it('uses k suffix for 1000 and above', () => {
    expect(shortEur(1000)).toBe('1.0k€');
    expect(shortEur(2500)).toBe('2.5k€');
    expect(shortEur(12000)).toBe('12.0k€');
  });
});

// ─── setCodeFromId ────────────────────────────────────────────────────────────

describe('setCodeFromId', () => {
  it('strips the card number from a standard ID', () => {
    expect(setCodeFromId('sv3pt5-45')).toBe('sv3pt5');
    expect(setCodeFromId('sv8-101')).toBe('sv8');
  });

  it('handles multi-segment set IDs', () => {
    expect(setCodeFromId('swsh12pt5-200')).toBe('swsh12pt5');
  });

  it('returns the single segment if there is no hyphen', () => {
    // edge case: malformed ID
    expect(setCodeFromId('nohyphen')).toBe('');
  });
});
