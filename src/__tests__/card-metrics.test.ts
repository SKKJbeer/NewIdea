import { describe, it, expect } from 'vitest';
import {
  performanceWindows,
  cardMarketStats,
  pmiScore,
  PERFORMANCE_WINDOWS,
  MIN_POINTS_FOR_SCORE,
  MIN_POINTS_FOR_VOLATILITY,
} from '@/lib/card-metrics';
import type { PriceDataPoint } from '@/types';

// GRUNDSATZ, DEN DIESE TESTS ABSICHERN: Kein Zeitraum wird ausgewiesen, für den
// es keine Messung gibt. Ein „24 h: 0,0 %" aus einer Reihe ohne gestrigen Wert
// wäre eine erfundene Aussage.

const HEUTE = '2026-07-30';

function tage(von: string, bis: string, startPreis: number, endPreis: number): PriceDataPoint[] {
  const out: PriceDataPoint[] = [];
  const d0 = new Date(von + 'T00:00:00Z');
  const d1 = new Date(bis + 'T00:00:00Z');
  const n = Math.round((d1.getTime() - d0.getTime()) / 86_400_000);
  for (let i = 0; i <= n; i++) {
    const d = new Date(d0);
    d.setUTCDate(d.getUTCDate() + i);
    out.push({
      date: d.toISOString().slice(0, 10),
      price: startPreis + ((endPreis - startPreis) * i) / n,
    });
  }
  return out;
}

describe('performanceWindows', () => {
  it('rechnet die Veränderung gegen den Preis am Anfang des Zeitraums', () => {
    const h = tage('2026-06-30', HEUTE, 100, 110);
    const w30 = performanceWindows(h, 110, HEUTE).find((w) => w.label === '30T')!;
    expect(w30.changePct).toBeCloseTo(10, 1);
    expect(w30.fromPrice).toBeCloseTo(100, 1);
  });

  it('lässt Zeiträume ohne Messpunkt einfach weg', () => {
    // Nur 10 Tage Historie — 90T und 1J dürfen NICHT erscheinen.
    const h = tage('2026-07-20', HEUTE, 50, 55);
    const labels = performanceWindows(h, 55, HEUTE).map((w) => w.label);
    expect(labels).not.toContain('90T');
    expect(labels).not.toContain('1J');
    expect(labels).toContain('7T');
  });

  it('nimmt für 24 h keinen drei Wochen alten Punkt', () => {
    // Ohne Abstandsgrenze hieße das Ergebnis „24 h" und wäre eine
    // Monatsveränderung.
    const h: PriceDataPoint[] = [
      { date: '2026-07-01', price: 100 },
      { date: '2026-07-30', price: 130 },
    ];
    const labels = performanceWindows(h, 130, HEUTE).map((w) => w.label);
    expect(labels).not.toContain('24H');
  });

  it('gibt nichts zurück, wenn die Reihe zu kurz ist', () => {
    expect(performanceWindows([{ date: HEUTE, price: 10 }], 10, HEUTE)).toEqual([]);
    expect(performanceWindows([], 10, HEUTE)).toEqual([]);
  });

  it('gibt nichts zurück ohne aktuellen Preis', () => {
    expect(performanceWindows(tage('2026-06-01', HEUTE, 10, 12), 0, HEUTE)).toEqual([]);
  });

  it('ignoriert unbrauchbare Punkte', () => {
    const h = [
      ...tage('2026-06-30', HEUTE, 100, 110),
      { date: '', price: 5 } as PriceDataPoint,
      { date: '2026-07-10', price: 0 } as PriceDataPoint,
    ];
    const w = performanceWindows(h, 110, HEUTE);
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((x) => Number.isFinite(x.changePct))).toBe(true);
  });

  it('bietet genau die dokumentierten Zeitfenster an', () => {
    expect(PERFORMANCE_WINDOWS.map((w) => w.label)).toEqual(['24H', '7T', '30T', '90T', '1J']);
  });
});

describe('cardMarketStats', () => {
  it('findet den Höchstwert der Reihe und den Abstand dazu', () => {
    const h: PriceDataPoint[] = [
      { date: '2026-07-01', price: 100 },
      { date: '2026-07-10', price: 200 },
      { date: '2026-07-30', price: 150 },
    ];
    const s = cardMarketStats(h, 150, HEUTE);
    expect(s.ath?.price).toBe(200);
    expect(s.ath?.date).toBe('2026-07-10');
    expect(s.ath?.distancePct).toBeCloseTo(-25, 1);
  });

  it('bestimmt Hoch und Tief der letzten 30 Tage', () => {
    const h: PriceDataPoint[] = [
      { date: '2026-05-01', price: 500 }, // außerhalb des Fensters
      { date: '2026-07-10', price: 90 },
      { date: '2026-07-20', price: 130 },
    ];
    const s = cardMarketStats(h, 130, HEUTE);
    expect(s.high30).toBe(130);
    expect(s.low30).toBe(90);
  });

  it('berechnet keine Schwankungsbreite aus zu wenigen Punkten', () => {
    const h = tage('2026-07-28', HEUTE, 10, 11); // 3 Punkte
    expect(h.length).toBeLessThan(MIN_POINTS_FOR_VOLATILITY);
    expect(cardMarketStats(h, 11, HEUTE).volatilityPct).toBeNull();
  });

  it('eine ruhige Reihe hat eine kleinere Schwankungsbreite als eine unruhige', () => {
    const ruhig = tage('2026-07-01', HEUTE, 100, 105);
    const unruhig: PriceDataPoint[] = ruhig.map((p, i) => ({
      ...p,
      price: i % 2 === 0 ? 100 : 140,
    }));
    const a = cardMarketStats(ruhig, 105, HEUTE).volatilityPct!;
    const b = cardMarketStats(unruhig, 100, HEUTE).volatilityPct!;
    expect(b).toBeGreaterThan(a);
  });

  it('kommt mit einer leeren Reihe klar', () => {
    const s = cardMarketStats([], 0, HEUTE);
    expect(s).toMatchObject({ ath: null, high30: null, low30: null, volatilityPct: null, points: 0 });
  });

  it('nennt die Zahl der echten Messpunkte', () => {
    expect(cardMarketStats(tage('2026-07-01', HEUTE, 10, 12), 12, HEUTE).points).toBe(30);
  });
});

describe('pmiScore', () => {
  it('verweigert einen Score bei zu dünner Datenlage', () => {
    const s = pmiScore([{ date: HEUTE, price: 10 }], 10, 5);
    expect(s.sufficient).toBe(false);
    expect(s.factors).toEqual([]);
  });

  it('legt alle vier Faktoren offen', () => {
    const s = pmiScore(tage('2026-06-01', HEUTE, 100, 120), 120, 12);
    expect(s.factors.map((f) => f.label)).toEqual([
      'Momentum',
      'Stabilität',
      'Nachfrage',
      'Datenlage',
    ]);
    for (const f of s.factors) expect(f.detail.length, f.label).toBeGreaterThan(5);
  });

  it('der Gesamtwert ist der Mittelwert der Faktoren', () => {
    // Nachrechenbarkeit: Wer die Faktoren sieht, muss auf den Score kommen.
    const s = pmiScore(tage('2026-06-01', HEUTE, 100, 120), 120, 12);
    const mittel = Math.round(s.factors.reduce((a, f) => a + f.value, 0) / s.factors.length);
    expect(s.total).toBe(mittel);
  });

  it('bleibt zwischen 0 und 100', () => {
    for (const trend of [-90, -5, 0, 5, 90]) {
      const s = pmiScore(tage('2026-05-01', HEUTE, 100, 120), 120, trend);
      expect(s.total).toBeGreaterThanOrEqual(0);
      expect(s.total).toBeLessThanOrEqual(100);
    }
  });

  it('bewertet eine ruhige Karte stabiler als eine schwankende', () => {
    const ruhig = tage('2026-06-01', HEUTE, 100, 105);
    const unruhig: PriceDataPoint[] = ruhig.map((p, i) => ({ ...p, price: i % 2 === 0 ? 60 : 150 }));
    const a = pmiScore(ruhig, 105, 5).factors.find((f) => f.label === 'Stabilität')!.value;
    const b = pmiScore(unruhig, 150, 5).factors.find((f) => f.label === 'Stabilität')!.value;
    expect(a).toBeGreaterThan(b);
  });

  it('belohnt teure Karten NICHT allein für ihren Preis', () => {
    // Der frühere Score vergab „> 100 € = +20 Punkte". Das ist eine Meinung in
    // Zahlenform. Gleiche Kurvenform, anderer Preis: gleicher Score.
    const guenstig = tage('2026-06-01', HEUTE, 5, 6);
    const teuer = guenstig.map((p) => ({ ...p, price: p.price * 200 }));
    const a = pmiScore(guenstig, 6, 20).total;
    const b = pmiScore(teuer, 1200, 20).total;
    expect(a).toBe(b);
  });

  it('gibt einer dünn belegten Karte eine schlechtere Datenlage', () => {
    const wenig = pmiScore(tage('2026-07-25', HEUTE, 10, 11), 11, 5);
    const viel = pmiScore(tage('2026-05-01', HEUTE, 10, 11), 11, 5);
    const a = wenig.factors.find((f) => f.label === 'Datenlage')!.value;
    const b = viel.factors.find((f) => f.label === 'Datenlage')!.value;
    expect(b).toBeGreaterThan(a);
  });

  it('braucht mindestens die dokumentierte Punktzahl', () => {
    const knappZuWenig = tage('2026-07-28', HEUTE, 10, 11);
    expect(knappZuWenig.length).toBeLessThan(MIN_POINTS_FOR_SCORE);
    expect(pmiScore(knappZuWenig, 11, 5).sufficient).toBe(false);
  });
});
