import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildCardmarketHistory } from '@/lib/pokemon-api';

// „Preise: absolute Wahrheitspflicht" (CLAUDE.md) — das Herzstück der Seite.
// Hier wird festgenagelt, dass ein Preisverlauf NUR aus echten Cardmarket-
// Feldern entsteht: keine Interpolation, keine synthetische Kurve, kein
// Ausreißer, und lieber gar kein Verlauf als ein erfundener.

const DAY = 86400000;
function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY).toISOString().split('T')[0];
}

describe('buildCardmarketHistory — nur echte Ankerpunkte', () => {
  it('gibt genau die realen Felder zurück, nicht mehr', () => {
    const points = buildCardmarketHistory({ avg30: 100, avg7: 110, avg1: 115, trendPrice: 120 });
    // Vier reale Felder → höchstens vier Punkte. Alles darüber wäre erfunden.
    expect(points).toHaveLength(4);
    expect(points.map((p) => p.price)).toEqual([100, 110, 115, 120]);
  });

  it('datiert die Punkte auf ihr nominales Alter', () => {
    const points = buildCardmarketHistory({ avg30: 100, avg7: 110, avg1: 115, trendPrice: 120 });
    expect(points[0].date).toBe(daysAgo(30));
    expect(points[1].date).toBe(daysAgo(7));
    expect(points[2].date).toBe(daysAgo(1));
    expect(points[3].date).toBe(daysAgo(0));
  });

  it('interpoliert NICHT zwischen den Ankern', () => {
    // 30 Tage Abstand, aber nur zwei echte Werte → genau zwei Punkte.
    // Ein Verlauf mit 31 Tagespunkten wäre eine erfundene Kurve.
    const points = buildCardmarketHistory({ avg30: 50, trendPrice: 200 });
    expect(points).toHaveLength(2);
  });

  it('liefert die Punkte aufsteigend nach Datum', () => {
    const points = buildCardmarketHistory({ trendPrice: 120, avg30: 100, avg7: 110 });
    const dates = points.map((p) => p.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('rundet auf zwei Nachkommastellen', () => {
    const points = buildCardmarketHistory({ avg30: 12.3456, trendPrice: 99.99999 });
    expect(points.map((p) => p.price)).toEqual([12.35, 100]);
  });
});

describe('buildCardmarketHistory — zu wenig Daten heißt KEIN Verlauf', () => {
  it('gibt bei nur einem echten Wert ein leeres Array zurück', () => {
    expect(buildCardmarketHistory({ trendPrice: 120 })).toEqual([]);
    expect(buildCardmarketHistory({ avg30: 100 })).toEqual([]);
  });

  it('gibt ohne jeden Wert ein leeres Array zurück', () => {
    expect(buildCardmarketHistory({})).toEqual([]);
    expect(buildCardmarketHistory({ avg30: 0, avg7: 0, avg1: 0, trendPrice: 0 })).toEqual([]);
  });

  it('ignoriert negative und ungültige Werte', () => {
    expect(buildCardmarketHistory({ avg30: -5, trendPrice: 120 })).toEqual([]);
  });

  it('fällt für den heutigen Punkt auf averageSellPrice zurück', () => {
    const points = buildCardmarketHistory({ avg30: 100, averageSellPrice: 130 });
    expect(points).toHaveLength(2);
    expect(points[1]).toEqual({ date: daysAgo(0), price: 130 });
  });

  it('bevorzugt trendPrice gegenüber averageSellPrice', () => {
    const points = buildCardmarketHistory({ avg30: 100, trendPrice: 120, averageSellPrice: 130 });
    expect(points[1].price).toBe(120);
  });
});

describe('buildCardmarketHistory — Ausreißerschutz für avg1', () => {
  // avg1 (Ø gestern) ist verrauscht: Ein einzelnes Fake-Listing (echter Fund:
  // Base-Glurak mit avg1 = 14.950 €) darf die Kurve nicht verzerren.

  it('verwirft avg1 oberhalb des Dreifachen der stabilen Schnitte', () => {
    const points = buildCardmarketHistory({ avg30: 300, avg7: 300, avg1: 14950, trendPrice: 310 });
    expect(points.map((p) => p.price)).not.toContain(14950);
    expect(points).toHaveLength(3); // avg30, avg7, heute
  });

  it('verwirft avg1 unterhalb eines Drittels', () => {
    const points = buildCardmarketHistory({ avg30: 300, avg7: 300, avg1: 1, trendPrice: 310 });
    expect(points.map((p) => p.price)).not.toContain(1);
  });

  it('akzeptiert avg1 genau an der oberen Grenze', () => {
    const points = buildCardmarketHistory({ avg7: 100, avg30: 100, avg1: 300, trendPrice: 110 });
    expect(points.map((p) => p.price)).toContain(300);
  });

  it('akzeptiert avg1 knapp innerhalb der unteren Grenze', () => {
    const points = buildCardmarketHistory({ avg7: 99, avg30: 99, avg1: 33.5, trendPrice: 100 });
    expect(points.map((p) => p.price)).toContain(33.5);
  });

  it('misst gegen avg7, nicht gegen den Tagespreis', () => {
    // avg7 ist der stabilste verfügbare Bezug. Ein bereits verzerrter
    // trendPrice darf den Ausreißerschutz nicht aushebeln.
    const points = buildCardmarketHistory({ avg7: 100, avg1: 900, trendPrice: 800 });
    expect(points.map((p) => p.price)).not.toContain(900);
  });

  it('verwirft avg1, wenn es gar keinen Bezugswert gibt', () => {
    expect(buildCardmarketHistory({ avg1: 500 })).toEqual([]);
  });
});

describe('Keine synthetischen Preisverläufe im Code', () => {
  // v2.19.1 hat die Zufalls-Kurve `generatePriceHistory` entfernt. Dieser Test
  // verhindert, dass sie in irgendeiner Form zurückkommt — der Kommentar im
  // Quelltext allein hat schon einmal nicht gereicht.
  const files = [
    'src/lib/pokemon-api.ts',
    'src/lib/price-history.ts',
    'src/lib/portfolio.ts',
    'src/lib/homepage-data.ts',
  ];

  it('verwendet nirgends Math.random für Preisdaten', () => {
    for (const file of files) {
      const src = readFileSync(join(process.cwd(), file), 'utf8');
      expect(src, `${file} darf keine Zufallszahlen für Preise nutzen`).not.toMatch(/Math\.random/);
    }
  });

  it('enthält keine Funktion, die einen Verlauf erzeugt statt ihn zu lesen', () => {
    for (const file of files) {
      const src = readFileSync(join(process.cwd(), file), 'utf8');
      expect(src, `${file}: generatePriceHistory wurde v2.19.1 entfernt`).not.toMatch(
        /function\s+generatePriceHistory/,
      );
    }
  });

  it('beschreibt buildCardmarketHistory nicht als interpolierend', () => {
    // Ein Kommentar, der Interpolation behauptet, führt beim nächsten Umbau
    // in die Irre — und widerspricht der Wahrheitspflicht.
    const src = readFileSync(join(process.cwd(), 'src/lib/pokemon-api.ts'), 'utf8');
    expect(src).not.toMatch(/wird linear interpoliert/);
  });
});
