import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  realObservationDates,
  assessDataQuality,
  computeChartData,
  investedAfter,
  computeRangePerformance,
  hasLivePrice,
  DENSE_THRESHOLD,
  type PortfolioHolding,
  type LiveCardData,
} from '@/lib/portfolio';
import { mergePriceHistory } from '@/lib/price-history';

// ANLASS: Die Portfolio-Kurve wirkte, als steckten kaum Preisdaten dahinter —
// und das stimmte. Das Portfolio bekam ausschließlich die Cardmarket-Anker
// (höchstens vier Punkte je Karte), während zehntausende echte Tageswerte
// ungenutzt in der Datenbank lagen. Diese Prüfungen sichern beides ab: dass
// alle echten Quellen genutzt werden UND dass die Oberfläche nicht mehr
// Messung behauptet, als stattgefunden hat.

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), 'utf8');

function holding(cardId: string, felder: Partial<PortfolioHolding> = {}): PortfolioHolding {
  return {
    cardId,
    cardName: cardId,
    setName: 'Set',
    setCode: 'tst',
    imageUrl: '',
    quantity: 1,
    purchasePrice: 10,
    purchaseDate: '2026-07-01',
    language: 'EN',
    addedAt: '2026-07-01',
    ...felder,
  };
}

describe('mergePriceHistory', () => {
  it('führt Anker und Tages-Snapshots zusammen', () => {
    const zusammen = mergePriceHistory(
      [{ date: '2026-07-01', price: 10 }, { date: '2026-07-30', price: 14 }],
      [{ date: '2026-07-15', price: 12 }],
    );
    expect(zusammen.map((p) => p.date)).toEqual(['2026-07-01', '2026-07-15', '2026-07-30']);
  });

  it('lässt bei gleichem Datum den echten Snapshot gewinnen', () => {
    // Der Anker ist ein Durchschnitt, der Snapshot eine Messung an genau
    // diesem Tag — die Messung ist die belastbarere Angabe.
    const zusammen = mergePriceHistory(
      [{ date: '2026-07-15', price: 99 }],
      [{ date: '2026-07-15', price: 12 }],
    );
    expect(zusammen).toEqual([{ date: '2026-07-15', price: 12 }]);
  });

  it('gibt eine nach Datum sortierte Reihe zurück', () => {
    const zusammen = mergePriceHistory(
      [{ date: '2026-07-30', price: 3 }, { date: '2026-07-01', price: 1 }],
      [{ date: '2026-07-15', price: 2 }],
    );
    expect(zusammen.map((p) => p.price)).toEqual([1, 2, 3]);
  });

  it('wirft unbrauchbare Punkte weg statt sie einzurechnen', () => {
    const zusammen = mergePriceHistory(
      [{ date: '2026-07-01', price: 0 }, { date: '', price: 5 }],
      [{ date: '2026-07-02', price: -3 }],
    );
    expect(zusammen).toEqual([]);
  });

  it('verträgt leere Eingaben', () => {
    expect(mergePriceHistory([], [])).toEqual([]);
  });
});

describe('realObservationDates', () => {
  it('sammelt die Messtage aller Karten ohne Doppelungen', () => {
    const live: Record<string, LiveCardData> = {
      a: { price: 10, priceHistory: [{ date: '2026-07-01', price: 9 }, { date: '2026-07-10', price: 10 }] },
      b: { price: 20, priceHistory: [{ date: '2026-07-10', price: 19 }, { date: '2026-07-20', price: 20 }] },
    };
    expect(realObservationDates([holding('a'), holding('b')], live)).toEqual([
      '2026-07-01', '2026-07-10', '2026-07-20',
    ]);
  });

  it('zählt keine Karte ohne Historie mit', () => {
    expect(realObservationDates([holding('a')], { a: { price: 10, priceHistory: [] } })).toEqual([]);
  });

  it('ignoriert Punkte ohne gültigen Preis', () => {
    const live: Record<string, LiveCardData> = {
      a: { price: 10, priceHistory: [{ date: '2026-07-01', price: 0 }] },
    };
    expect(realObservationDates([holding('a')], live)).toEqual([]);
  });
});

describe('assessDataQuality', () => {
  const live: Record<string, LiveCardData> = {
    a: {
      price: 10,
      dailyPoints: 20,
      priceHistory: Array.from({ length: 20 }, (_, i) => ({
        date: `2026-07-${String(i + 1).padStart(2, '0')}`,
        price: 10 + i,
      })),
    },
    b: { price: 5, dailyPoints: 0, priceHistory: [{ date: '2026-07-30', price: 5 }] },
  };

  it('zählt nur Messtage innerhalb des Zeitraums', () => {
    const q = assessDataQuality([holding('a'), holding('b')], live, '2026-07-15');
    // 15.–20. Juli aus Karte a, plus der 30. aus Karte b
    expect(q.observations).toBe(7);
  });

  it('nennt, für wie viele Karten eine echte Tages-Historie vorliegt', () => {
    const q = assessDataQuality([holding('a'), holding('b')], live, '2026-07-01');
    expect(q.cardsWithDailyHistory).toBe(1);
    expect(q.totalCards).toBe(2);
  });

  it('gilt erst ab genügend Messpunkten als dicht', () => {
    expect(assessDataQuality([holding('a')], live, '2026-07-01').dense).toBe(true);
    expect(assessDataQuality([holding('b')], live, '2026-07-01').dense).toBe(false);
  });

  it('hat eine Schwelle, die eine Aussage trägt', () => {
    // Bei zu niedriger Schwelle würde schon eine Dreipunkt-Linie als belastbar
    // durchgehen — genau der Eindruck, der behoben werden sollte.
    expect(DENSE_THRESHOLD).toBeGreaterThanOrEqual(10);
  });

  it('kommt mit einem leeren Portfolio klar', () => {
    const q = assessDataQuality([], {}, '2026-07-01');
    expect(q).toMatchObject({ observations: 0, totalCards: 0, dense: false });
  });
});

describe('Kurve und Messpunkte passen zusammen', () => {
  it('die Reihe ist lückenlos, die Messpunkte sind es nicht', () => {
    // Das ist der Kern des Problems: eine tägliche Reihe aus wenigen
    // Messungen. Beides ist richtig — es muss nur sichtbar sein.
    const live: Record<string, LiveCardData> = {
      a: {
        price: 14,
        priceHistory: [
          { date: '2026-07-01', price: 10 },
          { date: '2026-07-20', price: 12 },
        ],
      },
    };
    const reihe = computeChartData([holding('a')], live, '2026-07-30');
    expect(reihe.length).toBe(30);
    expect(realObservationDates([holding('a')], live).length).toBe(2);
  });

  it('trägt zwischen zwei Messungen den letzten bekannten Preis weiter', () => {
    const live: Record<string, LiveCardData> = {
      a: { price: 14, priceHistory: [{ date: '2026-07-01', price: 10 }, { date: '2026-07-20', price: 12 }] },
    };
    const reihe = computeChartData([holding('a')], live, '2026-07-30');
    const am10 = reihe.find((p) => p.date === '2026-07-10')!;
    const am25 = reihe.find((p) => p.date === '2026-07-25')!;
    expect(am10.value).toBe(10);
    expect(am25.value).toBe(12);
    // Der letzte Punkt ist der Live-Wert — die Kurve endet auf dem Betrag,
    // der oben in der Seite steht.
    expect(reihe[reihe.length - 1].value).toBe(14);
  });
});

describe('Die Portfolio-Route nutzt alle echten Quellen', () => {
  const src = lies('src/app/api/portfolio/prices/route.ts');

  it('mischt gespeicherte Tages-Snapshots dazu', () => {
    // Vorher gab die Route nur `card.priceHistory` zurück — die
    // Cardmarket-Anker, also höchstens vier Punkte je Karte.
    expect(src).toContain('getStoredPriceHistories');
    expect(src).toContain('mergePriceHistory');
    expect(src).not.toMatch(/priceHistory:\s*card\.priceHistory\s*\?\?\s*\[\]/);
  });

  it('holt die Historie in EINER Abfrage statt einer je Karte', () => {
    expect(src).toMatch(/getStoredPriceHistories\(\s*cards\.map/);
  });

  it('schreibt die Preise der Portfolio-Karten mit', () => {
    // Ohne das bauen genau die Karten, die jemanden interessieren, nie eine
    // Tages-Historie auf: Sie stehen weder im Cron-Lauf noch werden ihre
    // Detailseiten zwangsläufig aufgerufen.
    expect(src).toContain('recordPriceSnapshots');
    expect(src, 'nach der Antwort, damit es nichts verzögert').toContain('after(');
  });

  it('meldet, wie viele Punkte echte Tageswerte sind', () => {
    expect(src).toContain('dailyPoints');
  });
});

describe('Die Zusammenführung liegt an genau einer Stelle', () => {
  it('die Kartenseite baut sie nicht ein zweites Mal', () => {
    // Code-Regel 10: keine doppelte Umsetzung derselben Logik.
    const seite = lies('src/app/karten/[id]/page.tsx');
    expect(seite).toContain('mergePriceHistory');
    expect(seite, 'die frühere Inline-Zusammenführung ist entfallen').not.toMatch(
      /for \(const p of stored\) byDate\.set/,
    );
  });
});

describe('Die Oberfläche behauptet keine Messung, die es nicht gab', () => {
  const seite = lies('src/app/portfolio/page.tsx');

  it('nennt die Zahl der echten Messpunkte', () => {
    expect(seite).toContain('rangeObservations');
    expect(seite).toMatch(/echte? Messpunkt/);
  });

  it('erklärt das Fortschreiben zwischen den Messungen', () => {
    expect(seite).toContain('fortgeschrieben');
  });

  it('markiert die echten Punkte im Chart', () => {
    expect(seite).toContain('observationDates={rangeObservations}');
  });

  it('beschriftet die Wertachse', () => {
    expect(seite).toContain('formatValue={shortEur}');
  });
});

describe('Der Chart bleibt bei dichter Datenlage ruhig', () => {
  const chart = lies('src/components/PortfolioChart.tsx');

  it('markiert Messpunkte nur, solange sie zählbar sind', () => {
    // Bei einem Jahr Tageswerten wären es hunderte Marker — dann ist die
    // Linie selbst schon die ehrliche Darstellung.
    expect(chart).toMatch(/beobachtet\.size <= 30/);
  });

  it('zeichnet keine Marker während des Ziehens', () => {
    expect(chart).toMatch(/\{!scrubbing &&\s*\n\s*marker\.map/);
  });
});

// ── Zukäufe sind kein Gewinn ────────────────────────────────────────────────
//
// BEOBACHTET AN EINEM ECHTEN BESTAND: Der Jahreswert wies +636,90 € (+19,90 %)
// aus, während der tatsächliche Gewinn +216,90 € betrug. Die Differenz von
// exakt 420 € waren zwei später gekaufte Positionen (2×120 € + 3×60 €). Die
// Kurve zeigte diese Käufe als Stufen — und die Kennzahl las sie als Rendite.

describe('investedAfter', () => {
  const bestand = [
    holding('alt',  { purchaseDate: '2026-05-02', purchasePrice: 3200, quantity: 1 }),
    holding('mitte',{ purchaseDate: '2026-06-10', purchasePrice: 120,  quantity: 2 }),
    holding('neu',  { purchaseDate: '2026-07-01', purchasePrice: 60,   quantity: 3 }),
  ];

  it('summiert nur Käufe nach dem Stichtag', () => {
    expect(investedAfter(bestand, '2026-05-02')).toBe(240 + 180);
  });

  it('zählt einen Kauf GENAU am Stichtag nicht mit', () => {
    // Der steckt bereits im Startwert des Zeitraums — sonst würde er doppelt
    // abgezogen und der Zeitraum sähe schlechter aus, als er war.
    expect(investedAfter(bestand, '2026-07-01')).toBe(0);
  });

  it('kann bis zu einem Enddatum begrenzen (fürs Ziehen über die Kurve)', () => {
    expect(investedAfter(bestand, '2026-05-02', '2026-06-30')).toBe(240);
  });

  it('ignoriert Positionen ohne Kaufdatum', () => {
    expect(investedAfter([holding('x', { purchaseDate: '' })], '2026-01-01')).toBe(0);
  });

  it('gibt ohne Stichtag 0 zurück statt alles zu zählen', () => {
    expect(investedAfter(bestand, '')).toBe(0);
  });
});

describe('computeRangePerformance', () => {
  const bestand = [
    holding('alt',  { purchaseDate: '2026-05-02', purchasePrice: 3200, quantity: 1 }),
    holding('mitte',{ purchaseDate: '2026-06-10', purchasePrice: 120,  quantity: 2 }),
    holding('neu',  { purchaseDate: '2026-07-01', purchasePrice: 60,   quantity: 3 }),
  ];

  it('rechnet den beobachteten Fall korrekt', () => {
    // Genau die Zahlen vom echten Bestand.
    const p = computeRangePerformance(bestand, 3836.9, 3200, '2026-05-02', { pnl: 0, pnlPct: 0 });
    expect(p.pnl).toBeCloseTo(216.9, 2);
    expect(p.invested).toBe(420);
    // Bezugsgröße ist Startwert + Zukäufe = 3620
    expect(p.pnlPct).toBeCloseTo(5.99, 2);
  });

  it('ändert nichts, wenn im Zeitraum nicht zugekauft wurde', () => {
    const p = computeRangePerformance(bestand, 3836.9, 3925.46, '2026-07-01', { pnl: 0, pnlPct: 0 });
    expect(p.invested).toBe(0);
    expect(p.pnl).toBeCloseTo(-88.56, 2);
  });

  it('ein reiner Zukauf erzeugt keinen Gewinn', () => {
    // Wert steigt um exakt den Einstand der neuen Karte — Rendite bleibt 0.
    const nur = [holding('neu', { purchaseDate: '2026-07-15', purchasePrice: 100, quantity: 1 })];
    const p = computeRangePerformance(nur, 1100, 1000, '2026-07-01', { pnl: 0, pnlPct: 0 });
    expect(p.pnl).toBe(0);
    expect(p.pnlPct).toBe(0);
  });

  it('fällt ohne Startwert auf die Gesamtzahlen zurück', () => {
    const p = computeRangePerformance(bestand, 100, null, '2026-01-01', { pnl: 7, pnlPct: 3 });
    expect(p).toEqual({ pnl: 7, pnlPct: 3, invested: 0 });
  });

  it('liefert kein NaN bei einem Startwert von 0', () => {
    const p = computeRangePerformance([], 0, 0, '2026-01-01', { pnl: 0, pnlPct: 0 });
    expect(Number.isFinite(p.pnlPct)).toBe(true);
  });
});

describe('hasLivePrice', () => {
  it('erkennt einen geladenen Marktpreis', () => {
    expect(hasLivePrice({ cardId: 'a' }, { a: { price: 12, priceHistory: [] } })).toBe(true);
  });

  it('erkennt einen fehlenden Abruf', () => {
    // Sonst zeigt die Position „+0,00 € · 0,0 %" — ein ausgefallener Abruf
    // sieht dann aus wie eine Messung.
    expect(hasLivePrice({ cardId: 'a' }, {})).toBe(false);
    expect(hasLivePrice({ cardId: 'a' }, { a: { price: 0, priceHistory: [] } })).toBe(false);
  });
});

describe('Die Seite weist beides aus', () => {
  const seite = lies('src/app/portfolio/page.tsx');

  it('rechnet Zukäufe aus der Wertentwicklung heraus', () => {
    expect(seite).toContain('computeRangePerformance');
    expect(seite, 'auch beim Ziehen über die Kurve').toContain('scrubInvested');
  });

  it('benennt die Zukäufe als Ursache der Stufen', () => {
    expect(seite).toContain('durch Zukäufe');
  });

  it('markiert Positionen ohne geladenen Marktpreis', () => {
    expect(seite).toContain('hasLivePrice');
    expect(seite).toContain('Kein Marktpreis geladen');
  });
});
