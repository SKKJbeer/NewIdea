import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  positionPerformances,
  topPositions,
  setAllocation,
  comparePerformance,
  type PortfolioHolding,
  type LiveCardData,
} from '@/lib/portfolio';

// Ein Gesamtwert beantwortet nicht, WARUM sich der Bestand so entwickelt.
// Diese Auswertung zeigt die Treiber — und muss dabei denselben Grundsätzen
// folgen wie die Marktkennzahlen: strikte Trennung nach Vorzeichen, und keine
// Zeile, die einen fehlenden Abruf wie eine Messung aussehen lässt.

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), 'utf8');

function holding(id: string, felder: Partial<PortfolioHolding> = {}): PortfolioHolding {
  return {
    cardId: id,
    cardName: `Karte ${id}`,
    setName: 'Testset',
    setCode: 'tst',
    imageUrl: '',
    quantity: 1,
    purchasePrice: 100,
    purchaseDate: '2026-07-01',
    language: 'EN',
    addedAt: '2026-07-01',
    ...felder,
  };
}

const live = (preise: Record<string, number>): Record<string, LiveCardData> =>
  Object.fromEntries(Object.entries(preise).map(([id, p]) => [id, { price: p, priceHistory: [] }]));

describe('positionPerformances', () => {
  it('rechnet Wert, Einstand und Ergebnis je Position', () => {
    const [p] = positionPerformances([holding('a', { quantity: 2, purchasePrice: 50 })], live({ a: 80 }));
    expect(p.value).toBe(160);
    expect(p.cost).toBe(100);
    expect(p.pnl).toBe(60);
    expect(p.pnlPct).toBeCloseTo(60, 5);
    expect(p.live).toBe(true);
  });

  it('kennzeichnet Positionen ohne Marktpreis', () => {
    const [p] = positionPerformances([holding('a')], {});
    expect(p.live).toBe(false);
    // Rechnet mit dem Kaufpreis weiter — deshalb muss `live` die Zeile
    // kennzeichnen, sonst sieht der Ausfall wie „unverändert" aus.
    expect(p.pnl).toBe(0);
  });

  it('erzeugt kein NaN bei einem Einstand von 0', () => {
    const [p] = positionPerformances([holding('a', { purchasePrice: 0 })], live({ a: 10 }));
    expect(Number.isFinite(p.pnlPct)).toBe(true);
  });
});

describe('topPositions', () => {
  const bestand = [
    holding('gut', { purchasePrice: 100 }),
    holding('mittel', { purchasePrice: 100 }),
    holding('schlecht', { purchasePrice: 100 }),
  ];
  const preise = live({ gut: 150, mittel: 110, schlecht: 60 });

  it('trennt strikt nach Vorzeichen', () => {
    const { winners, losers } = topPositions(positionPerformances(bestand, preise));
    expect(winners.map((w) => w.holding.cardId)).toEqual(['gut', 'mittel']);
    expect(losers.map((l) => l.holding.cardId)).toEqual(['schlecht']);
  });

  it('lässt keine Position in beiden Listen auftauchen', () => {
    const { winners, losers } = topPositions(positionPerformances(bestand, preise));
    const doppelt = winners.filter((w) => losers.some((l) => l.holding.cardId === w.holding.cardId));
    expect(doppelt).toEqual([]);
  });

  it('füllt die Gewinnerliste nicht mit Verlierern auf', () => {
    const nurVerlierer = [holding('a'), holding('b'), holding('c')];
    const { winners } = topPositions(positionPerformances(nurVerlierer, live({ a: 50, b: 40, c: 30 })));
    expect(winners).toEqual([]);
  });

  it('nimmt keine Position ohne Marktpreis in die Ranglisten', () => {
    // Ohne Abruf stünde sie mit 0,0 % da — nicht zu unterscheiden von einer
    // Karte, die sich wirklich nicht bewegt hat.
    const { winners, losers } = topPositions(positionPerformances([holding('a')], {}));
    expect(winners).toEqual([]);
    expect(losers).toEqual([]);
  });

  it('sortiert die stärksten zuerst und die schwächsten zuerst', () => {
    const { winners, losers } = topPositions(
      positionPerformances(
        [holding('a'), holding('b'), holding('c'), holding('d')],
        live({ a: 120, b: 200, c: 90, d: 40 }),
      ),
    );
    expect(winners[0].holding.cardId).toBe('b');
    expect(losers[0].holding.cardId).toBe('d');
  });

  it('hält die Obergrenze ein', () => {
    const viele = Array.from({ length: 10 }, (_, i) => holding(`g${i}`));
    const preiseViele = live(Object.fromEntries(viele.map((h, i) => [h.cardId, 110 + i])));
    expect(topPositions(positionPerformances(viele, preiseViele), 3).winners).toHaveLength(3);
  });
});

describe('setAllocation', () => {
  const bestand = [
    holding('a', { setCode: 'sv1', setName: 'Set A', purchasePrice: 100 }),
    holding('b', { setCode: 'sv1', setName: 'Set A', purchasePrice: 100 }),
    holding('c', { setCode: 'sv2', setName: 'Set B', purchasePrice: 100 }),
  ];

  it('fasst Positionen je Set zusammen', () => {
    const a = setAllocation(positionPerformances(bestand, live({ a: 100, b: 100, c: 100 })));
    expect(a).toHaveLength(2);
    expect(a[0].setCode).toBe('sv1');
    expect(a[0].cards).toBe(2);
  });

  it('berechnet den Anteil am Gesamtwert', () => {
    const a = setAllocation(positionPerformances(bestand, live({ a: 100, b: 100, c: 200 })));
    const gesamt = a.reduce((s, e) => s + e.sharePct, 0);
    expect(gesamt).toBeCloseTo(100, 5);
  });

  it('berechnet die Entwicklung je Set', () => {
    const a = setAllocation(positionPerformances(bestand, live({ a: 150, b: 150, c: 50 })));
    expect(a.find((e) => e.setCode === 'sv1')!.pnlPct).toBeCloseTo(50, 5);
    expect(a.find((e) => e.setCode === 'sv2')!.pnlPct).toBeCloseTo(-50, 5);
  });

  it('sortiert nach Wert, größtes Set zuerst', () => {
    const a = setAllocation(positionPerformances(bestand, live({ a: 10, b: 10, c: 500 })));
    expect(a[0].setCode).toBe('sv2');
  });

  it('verträgt Positionen ohne Set-Angabe', () => {
    const a = setAllocation(positionPerformances([holding('x', { setCode: '', setName: '' })], live({ x: 10 })));
    expect(a[0].setCode).toBe('unbekannt');
    expect(a[0].setName).toBe('Ohne Set');
  });

  it('kommt mit einem leeren Bestand klar', () => {
    expect(setAllocation([])).toEqual([]);
  });
});

describe('comparePerformance', () => {
  it('rechnet den Unterschied in Prozentpunkten', () => {
    const v = comparePerformance(4.8, 1.7)!;
    expect(v.deltaPoints).toBeCloseTo(3.1, 5);
  });

  it('entfällt, wenn eine Seite keine belastbare Zahl hat', () => {
    // Eine Outperformance gegen einen Index, den es nicht gibt, wäre erfunden.
    expect(comparePerformance(5, null)).toBeNull();
    expect(comparePerformance(null, 2)).toBeNull();
    expect(comparePerformance(NaN, 2)).toBeNull();
  });
});

describe('Die Portfolio-Seite nutzt die Auswertung', () => {
  const seite = lies('src/app/portfolio/page.tsx');

  it('zeigt Treiber statt nur eines Gesamtwerts', () => {
    expect(seite).toContain('<PortfolioInsights');
    expect(seite).toContain('topPositions');
    expect(seite).toContain('setAllocation');
  });

  it('vergleicht nur bei gleichem Zeitraum gegen den Markt', () => {
    // Der PMI ist ein 30-Tage-Wert — ein Vergleich gegen „1 Woche" wäre falsch.
    expect(seite).toMatch(/timeRange === '1M' \? comparePerformance/);
  });
});

describe('Der PMI-Endpunkt kann kein Guthaben verbrauchen', () => {
  const route = lies('src/app/api/market/pmi/route.ts');

  it('löst keine Generierung aus', () => {
    // `/api/market` war offen UND startete eine vollständige Opus-Generierung.
    // Diese Route liest nur vorhandene Daten und rechnet.
    expect(route).not.toMatch(/generate|anthropic|Anthropic/i);
  });

  it('nutzt dieselbe Prüfung wie die Startseite', () => {
    expect(route).toContain('validateMarketData');
    expect(route).toContain('computePmi');
  });

  it('gibt bei zu dünner Datenlage keinen Wert aus', () => {
    expect(route).toMatch(/pmi\.sufficient \? /);
  });

  it('reicht keine internen Fehlerdetails nach außen', () => {
    expect(route).not.toMatch(/String\(err/);
  });
});
