import { describe, it, expect } from 'vitest';
import { parseWatchlist, isWatched, toggleWatch, watchChange, type WatchlistItem } from '@/lib/watchlist';

function makeItem(cardId: string, priceAtAdd = 10): WatchlistItem {
  return {
    cardId,
    cardName: 'Test Card',
    setName: 'Test Set',
    setCode: 'sv1',
    imageUrl: 'https://example.com/img.png',
    priceAtAdd,
    addedAt: '2026-07-01',
  };
}

describe('parseWatchlist', () => {
  it('returns empty list for null/invalid/corrupt input', () => {
    expect(parseWatchlist(null)).toEqual([]);
    expect(parseWatchlist('not json')).toEqual([]);
    expect(parseWatchlist('{"a":1}')).toEqual([]);
    expect(parseWatchlist('[{"broken":true}]')).toEqual([]);
  });

  it('parses valid items and drops malformed entries', () => {
    const raw = JSON.stringify([makeItem('a'), { broken: true }, makeItem('b')]);
    const result = parseWatchlist(raw);
    expect(result.map((i) => i.cardId)).toEqual(['a', 'b']);
  });
});

describe('toggleWatch', () => {
  it('adds a new item at the front', () => {
    const list = toggleWatch([makeItem('a')], makeItem('b'));
    expect(list.map((i) => i.cardId)).toEqual(['b', 'a']);
  });

  it('removes an already-watched item', () => {
    const list = toggleWatch([makeItem('a'), makeItem('b')], makeItem('a'));
    expect(list.map((i) => i.cardId)).toEqual(['b']);
  });
});

describe('isWatched', () => {
  it('detects membership by cardId', () => {
    expect(isWatched([makeItem('a')], 'a')).toBe(true);
    expect(isWatched([makeItem('a')], 'b')).toBe(false);
  });
});

describe('watchChange', () => {
  it('computes absolute and percentage change', () => {
    expect(watchChange(10, 12)).toEqual({ abs: 2, pct: 20 });
  });

  it('handles negative change', () => {
    const result = watchChange(10, 8)!;
    expect(result.abs).toBeCloseTo(-2);
    expect(result.pct).toBeCloseTo(-20);
  });

  it('returns null when no comparison is possible', () => {
    expect(watchChange(0, 12)).toBeNull();
    expect(watchChange(10, 0)).toBeNull();
  });
});
