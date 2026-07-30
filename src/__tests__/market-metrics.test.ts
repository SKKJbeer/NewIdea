import { describe, it, expect } from 'vitest';
import {
  splitMovers,
  computePmi,
  computeFearGreed,
  fearGreedLabel,
  validateMarketData,
  PMI_MIN_CARDS,
  FEAR_GREED_WEIGHTS,
  MAX_PLAUSIBLE_TREND,
  MAX_PLAUSIBLE_PRICE,
} from '@/lib/market-metrics';
import type { PokemonCard } from '@/types';

// ANLASS: Die Rankings der Startseite waren logisch falsch. Dieselbe Liste
// wurde zweimal sortiert und jeweils oben abgeschnitten — ohne Vorzeichenfilter.
// Bei nur einer gestiegenen Karte standen unter „Top Gewinner" gefallene
// Karten, und dieselbe Karte konnte in beiden Listen auftauchen.

function card(id: string, trend: number | undefined, price = 10, extra: Partial<PokemonCard> = {}): PokemonCard {
  return {
    id,
    name: `Karte ${id}`,
    set: 'Testset',
    setCode: 'tst',
    rarity: 'Rare',
    imageUrl: `https://images.pokemontcg.io/tst/${id}.png`,
    prices: { market: price },
    trendPercent: trend,
    ...extra,
  } as PokemonCard;
}

describe('splitMovers', () => {
  it('nimmt in die Gewinner ausschließlich gestiegene Karten', () => {
    const { gainers } = splitMovers([card('a', 5), card('b', -3), card('c', -9)]);
    expect(gainers.map((c) => c.id)).toEqual(['a']);
  });

  it('füllt die Gewinnerliste NICHT mit gefallenen Karten auf', () => {
    // Das war der eigentliche Fehler: slice(0, 8) auf einer ungefilterten Liste.
    const cards = [card('gut', 4), ...Array.from({ length: 10 }, (_, i) => card(`schlecht${i}`, -i - 1))];
    const { gainers } = splitMovers(cards, 8);
    expect(gainers).toHaveLength(1);
    expect(gainers[0].id).toBe('gut');
  });

  it('sortiert Gewinner absteigend', () => {
    const { gainers } = splitMovers([card('a', 2), card('b', 9), card('c', 5)]);
    expect(gainers.map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('sortiert Verlierer mit dem größten Verlust zuerst', () => {
    const { losers } = splitMovers([card('a', -2), card('b', -9), card('c', -5)]);
    expect(losers.map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('lässt keine Karte in beiden Listen auftauchen', () => {
    const cards = [card('a', 5), card('b', -5), card('c', 1), card('d', -1)];
    const { gainers, losers } = splitMovers(cards);
    const doppelt = gainers.filter((g) => losers.some((l) => l.id === g.id));
    expect(doppelt).toEqual([]);
  });

  it('zählt eine unveränderte Karte weder als Gewinner noch als Verlierer', () => {
    const { gainers, losers } = splitMovers([card('null', 0)]);
    expect(gainers).toEqual([]);
    expect(losers).toEqual([]);
  });

  it('ignoriert Karten ohne oder mit ungültigem Trendwert', () => {
    const { gainers, losers } = splitMovers([
      card('ohne', undefined),
      card('nan', NaN),
      card('gut', 3),
    ]);
    expect(gainers.map((c) => c.id)).toEqual(['gut']);
    expect(losers).toEqual([]);
  });

  it('hält die Obergrenze ein', () => {
    const { gainers } = splitMovers(Array.from({ length: 20 }, (_, i) => card(`g${i}`, i + 1)), 5);
    expect(gainers).toHaveLength(5);
  });

  it('kommt mit einer leeren Eingabe klar', () => {
    expect(splitMovers([])).toEqual({ gainers: [], losers: [] });
  });
});

describe('computePmi', () => {
  const viele = (trend: number, anzahl = PMI_MIN_CARDS) =>
    Array.from({ length: anzahl }, (_, i) => card(`c${i}`, trend));

  it('weist bei zu wenigen Karten keinen belastbaren Wert aus', () => {
    const pmi = computePmi([card('a', 5), card('b', 3)]);
    expect(pmi.sufficient).toBe(false);
    expect(pmi.cardCount).toBe(2);
    expect(pmi.minCards).toBe(PMI_MIN_CARDS);
  });

  it('gilt ab der Mindestanzahl als belastbar', () => {
    expect(computePmi(viele(2)).sufficient).toBe(true);
  });

  it('gewichtet teure Karten stärker', () => {
    // Eine teure Karte mit −10 % gegen eine billige mit +10 %: Der Index muss
    // der teuren folgen, sonst bestimmen Cent-Karten den Markt.
    const pmi = computePmi([card('teuer', -10, 1000), card('billig', 10, 1)]);
    expect(pmi.value).toBeLessThan(0);
  });

  it('zählt die vertretenen Sets', () => {
    const pmi = computePmi([
      card('a', 1, 10, { setCode: 'sv1' }),
      card('b', 1, 10, { setCode: 'sv2' }),
      card('c', 1, 10, { setCode: 'sv2' }),
    ]);
    expect(pmi.setCount).toBe(2);
  });

  it('nennt den betrachteten Zeitraum', () => {
    expect(computePmi(viele(1)).windowDays).toBe(30);
  });

  it('liefert kein NaN ohne Daten', () => {
    const pmi = computePmi([]);
    expect(Number.isFinite(pmi.value)).toBe(true);
    expect(pmi.sufficient).toBe(false);
  });
});

describe('computeFearGreed', () => {
  const gemischt = (plus: number, minus: number) => [
    ...Array.from({ length: plus }, (_, i) => card(`p${i}`, 5)),
    ...Array.from({ length: minus }, (_, i) => card(`m${i}`, -5)),
  ];

  it('verweigert eine Aussage bei zu dünner Datenlage', () => {
    const fg = computeFearGreed([card('a', 5)]);
    expect(fg.sufficient).toBe(false);
    expect(fg.components).toEqual([]);
  });

  it('legt alle Teilwerte offen', () => {
    const fg = computeFearGreed(gemischt(15, 15));
    expect(fg.components.map((k) => k.label)).toEqual([
      'Marktbreite',
      'Momentum',
      'Gewinner zu Verlierer',
    ]);
    for (const k of fg.components) {
      expect(k.detail.length, k.label).toBeGreaterThan(5);
    }
  });

  it('die Gewichte ergeben zusammen genau 1', () => {
    const summe = Object.values(FEAR_GREED_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(summe).toBeCloseTo(1, 6);
  });

  it('der Wert ist die gewichtete Summe seiner Teilwerte', () => {
    // Nachrechenbarkeit ist der Kern: Wer die Teilwerte sieht, muss auf den
    // angezeigten Wert kommen.
    const fg = computeFearGreed(gemischt(20, 10));
    const nachgerechnet = Math.round(
      fg.components.reduce((s, k) => s + k.score * k.weight, 0),
    );
    expect(fg.value).toBe(nachgerechnet);
  });

  it('steigt, wenn mehr Karten im Plus sind', () => {
    const wenig = computeFearGreed(gemischt(5, 25)).value;
    const viel = computeFearGreed(gemischt(25, 5)).value;
    expect(viel).toBeGreaterThan(wenig);
  });

  it('bleibt im Bereich 0 bis 100', () => {
    for (const [p, m] of [[30, 0], [0, 30], [15, 15]]) {
      const v = computeFearGreed(gemischt(p, m)).value;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('fearGreedLabel', () => {
  it.each([
    [90, 'Extreme Gier'],
    [65, 'Gier'],
    [50, 'Neutral'],
    [30, 'Angst'],
    [10, 'Extreme Angst'],
  ])('%i ist „%s"', (wert, label) => {
    expect(fearGreedLabel(wert)).toBe(label);
  });
});

describe('validateMarketData', () => {
  it('lässt saubere Karten durch', () => {
    const r = validateMarketData([card('a', 5), card('b', -2)]);
    expect(r.clean).toHaveLength(2);
    expect(r.usablePct).toBe(100);
  });

  it('entfernt Karten ohne Preis', () => {
    const r = validateMarketData([card('a', 5, 0)]);
    expect(r.clean).toHaveLength(0);
    expect(r.issues[0].kind).toBe('kein_preis');
  });

  it('entfernt doppelte Karten', () => {
    const r = validateMarketData([card('a', 5), card('a', 5)]);
    expect(r.clean).toHaveLength(1);
    expect(r.issues.map((i) => i.kind)).toContain('doppelte_id');
  });

  it('entfernt unplausible Preise', () => {
    const r = validateMarketData([card('a', 5, MAX_PLAUSIBLE_PRICE + 1)]);
    expect(r.clean).toHaveLength(0);
    expect(r.issues[0].kind).toBe('unplausibler_preis');
  });

  it('entfernt absurde Trendwerte', () => {
    // Ein einzelner Ausreißer verschiebt einen gewichteten Index spürbar.
    const r = validateMarketData([card('a', MAX_PLAUSIBLE_TREND + 50)]);
    expect(r.clean).toHaveLength(0);
    expect(r.issues[0].kind).toBe('extremer_trend');
  });

  it('entfernt Karten ohne Bild', () => {
    const r = validateMarketData([card('a', 5, 10, { imageUrl: '' })]);
    expect(r.clean).toHaveLength(0);
    expect(r.issues[0].kind).toBe('kein_bild');
  });

  it('behält Karten ohne Trendwert, meldet sie aber', () => {
    // Für Preislisten brauchbar, für Trendkennzahlen nicht — die
    // Trendfunktionen filtern selbst.
    const r = validateMarketData([card('a', undefined)]);
    expect(r.clean).toHaveLength(1);
    expect(r.issues.map((i) => i.kind)).toContain('kein_trend');
  });

  it('ein Ausreißer verzerrt den Index nach der Prüfung nicht mehr', () => {
    const echte = Array.from({ length: 25 }, (_, i) => card(`c${i}`, -2, 10));
    const kaputt = card('boese', 5000, 90_000);
    const ohnePruefung = computePmi([...echte, kaputt]).value;
    const mitPruefung = computePmi(validateMarketData([...echte, kaputt]).clean).value;
    expect(ohnePruefung).toBeGreaterThan(100);
    expect(mitPruefung).toBeCloseTo(-2, 5);
  });

  it('meldet den Anteil verwertbarer Karten', () => {
    const r = validateMarketData([card('a', 5), card('b', 5, 0)]);
    expect(r.usablePct).toBe(50);
  });
});
