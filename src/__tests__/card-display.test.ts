import { describe, it, expect } from 'vitest';
import { displayPrice, isDisplayableCard, isValidSetCode } from '@/lib/pokemon-api';
import type { PokemonCard } from '@/types';

function makeCard(overrides: Partial<PokemonCard>): PokemonCard {
  return {
    id: 'sv1-1',
    name: 'Test Card',
    set: 'Test Set',
    setCode: 'sv1',
    rarity: 'Rare',
    imageUrl: 'https://images.pokemontcg.io/sv1/1.png',
    prices: { market: 10 },
    trendPercent: 0,
    priceSource: 'cardmarket',
    realData: true,
    ...overrides,
  } as PokemonCard;
}

describe('displayPrice', () => {
  it('uses the market price when present', () => {
    expect(displayPrice(makeCard({ prices: { market: 12.5 } }))).toBe(12.5);
  });

  it('falls back to holofoil market price', () => {
    expect(displayPrice(makeCard({ prices: { market: 0, holofoil: { market: 8 } } }))).toBe(8);
  });

  it('returns 0 when no price data exists', () => {
    expect(displayPrice(makeCard({ prices: { market: 0 } }))).toBe(0);
  });
});

describe('isDisplayableCard', () => {
  it('accepts a card with price and image', () => {
    expect(isDisplayableCard(makeCard({}))).toBe(true);
  });

  it('rejects a preview card without price (e.g. unreleased set)', () => {
    expect(isDisplayableCard(makeCard({ prices: { market: 0 } }))).toBe(false);
  });

  it('rejects a card without an image', () => {
    expect(isDisplayableCard(makeCard({ imageUrl: '' }))).toBe(false);
  });

  it('rejects a card missing both price and image', () => {
    expect(isDisplayableCard(makeCard({ prices: { market: 0 }, imageUrl: '' }))).toBe(false);
  });

  it('accepts a card priced only via holofoil', () => {
    expect(isDisplayableCard(makeCard({ prices: { market: 0, holofoil: { market: 3 } } }))).toBe(true);
  });
});

describe('isValidSetCode', () => {
  it('accepts real set codes', () => {
    for (const code of ['sv3pt5', 'swsh7', 'cel25', 'base1', 'sm3.5', 'sv8']) {
      expect(isValidSetCode(code), code).toBe(true);
    }
  });

  it('rejects Lucene injection attempts and malformed input', () => {
    for (const code of ['sv3 OR set.id:*', 'a"b', 'x', '', 'sv3)!(', '../etc', 'a'.repeat(30)]) {
      expect(isValidSetCode(code), JSON.stringify(code)).toBe(false);
    }
  });
});
