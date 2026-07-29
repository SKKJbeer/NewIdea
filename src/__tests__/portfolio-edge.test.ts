import { describe, it, expect } from 'vitest';
import {
  normalizeHolding,
  livePriceOf,
  computePnl,
  computeChartData,
  filterByRange,
  median,
  setCodeFromId,
  formatShortDate,
  RANGE_DAYS,
  LANG_FLAG,
  LANG_LABEL,
  type PortfolioHolding,
  type LiveCardData,
} from '@/lib/portfolio';

// Ergänzung zu portfolio.test.ts: Dort stehen die normalen Abläufe. Hier geht
// es um das, was in echten gespeicherten Daten vorkommt — kaputte Felder,
// Grenzwerte, Geschenke ohne Kaufpreis — und um das Zusammenspiel der
// Funktionen, so wie die Portfolio-Seite sie nacheinander aufruft.

function holding(over: Partial<PortfolioHolding> & { cardId: string }): PortfolioHolding {
  return normalizeHolding({
    cardName: 'Karte',
    setName: 'Set',
    setCode: 'st',
    imageUrl: 'https://images.pokemontcg.io/st/1.png',
    quantity: 1,
    purchasePrice: 100,
    purchaseDate: '2026-07-01',
    language: 'EN',
    addedAt: '2026-07-01T10:00:00Z',
    ...over,
  });
}

describe('normalizeHolding — beschädigte gespeicherte Daten', () => {
  it('ersetzt ausdrücklich gesetztes undefined durch den Vorgabewert', () => {
    // Ein reiner Spread würde den Schlüssel auf undefined setzen und den
    // Vorgabewert überschreiben — aus purchasePrice * quantity würde NaN.
    const h = normalizeHolding({ cardId: 'x', quantity: undefined, purchasePrice: undefined });
    expect(h.quantity).toBe(1);
    expect(h.purchasePrice).toBe(0);
  });

  it('ersetzt null durch den Vorgabewert', () => {
    // JSON kennt kein undefined — aus localStorage kommt null.
    const h = normalizeHolding({
      cardId: 'x',
      quantity: null as never,
      purchasePrice: null as never,
      language: null as never,
    });
    expect(h.quantity).toBe(1);
    expect(h.purchasePrice).toBe(0);
    expect(h.language).toBe('EN');
  });

  it('ersetzt NaN und Infinity durch den Vorgabewert', () => {
    // Entsteht aus einer nicht parsebaren Eingabe im Kauf-Dialog.
    const h = normalizeHolding({ cardId: 'x', purchasePrice: NaN, quantity: Infinity });
    expect(h.purchasePrice).toBe(0);
    expect(h.quantity).toBe(1);
  });

  it('behält eine ausdrückliche Null als Wert', () => {
    // 0 ist ein gültiger Kaufpreis (Geschenk, selbst gezogen) und darf NICHT
    // durch den Vorgabewert ersetzt werden.
    const h = normalizeHolding({ cardId: 'x', purchasePrice: 0, quantity: 0 });
    expect(h.purchasePrice).toBe(0);
    expect(h.quantity).toBe(0);
  });

  it('übernimmt keine fremden Felder', () => {
    const h = normalizeHolding({ cardId: 'x', hackerField: 'böse' } as never);
    expect(Object.keys(h).sort()).toEqual([
      'addedAt', 'cardId', 'cardName', 'imageUrl', 'language',
      'purchaseDate', 'purchasePrice', 'quantity', 'setCode', 'setName',
    ]);
  });

  it('lässt die cardId nicht überschreiben', () => {
    const h = normalizeHolding({ cardId: 'echt' } as never);
    expect(h.cardId).toBe('echt');
  });

  it('erzeugt aus beschädigten Daten keinen NaN-Gesamtwert', () => {
    // Der eigentliche Zweck der Normalisierung: Die Seite darf nie „NaN €" zeigen.
    const kaputt = [
      normalizeHolding({ cardId: 'a', quantity: undefined, purchasePrice: 50 }),
      normalizeHolding({ cardId: 'b', purchasePrice: NaN, quantity: 2 }),
    ];
    const { totalCost, totalValue, pnl, pnlPct } = computePnl(kaputt, {});
    for (const wert of [totalCost, totalValue, pnl, pnlPct]) {
      expect(Number.isFinite(wert)).toBe(true);
    }
  });
});

describe('livePriceOf — Grenzfälle', () => {
  it('nimmt den Kaufpreis, wenn der Live-Preis 0 ist', () => {
    expect(livePriceOf({ cardId: 'a', purchasePrice: 42 }, { a: { price: 0, priceHistory: [] } })).toBe(42);
  });

  it('nimmt den Kaufpreis bei unbekannter Karte', () => {
    expect(livePriceOf({ cardId: 'unbekannt', purchasePrice: 42 }, {})).toBe(42);
  });

  it('gibt 0 zurück, wenn weder Live- noch Kaufpreis vorliegt', () => {
    expect(livePriceOf({ cardId: 'a', purchasePrice: 0 }, {})).toBe(0);
  });
});

describe('computePnl — Grenzfälle', () => {
  it('meldet bei Kaufpreis 0 keine unendliche Rendite', () => {
    // Geschenkte oder selbst gezogene Karten: Einstand 0, aber echter Wert.
    // Prozentual wäre das unendlich — deshalb 0 statt Infinity.
    const h = [holding({ cardId: 'a', purchasePrice: 0 })];
    const { totalCost, totalValue, pnl, pnlPct } = computePnl(h, {
      a: { price: 80, priceHistory: [] },
    });
    expect(totalCost).toBe(0);
    expect(totalValue).toBe(80);
    expect(pnl).toBe(80);
    expect(pnlPct).toBe(0);
    expect(Number.isFinite(pnlPct)).toBe(true);
  });

  it('berücksichtigt die Stückzahl auf beiden Seiten', () => {
    const h = [holding({ cardId: 'a', purchasePrice: 10, quantity: 7 })];
    const r = computePnl(h, { a: { price: 12, priceHistory: [] } });
    expect(r.totalCost).toBe(70);
    expect(r.totalValue).toBe(84);
    expect(r.pnl).toBe(14);
    expect(r.pnlPct).toBeCloseTo(20, 6);
  });

  it('zählt eine Position mit Stückzahl 0 nicht mit', () => {
    const h = [holding({ cardId: 'a', quantity: 0 }), holding({ cardId: 'b', quantity: 1 })];
    const r = computePnl(h, {});
    expect(r.totalCost).toBe(100);
  });

  it('bleibt bei einem Totalverlust bei -100 Prozent', () => {
    const h = [holding({ cardId: 'a', purchasePrice: 100 })];
    const r = computePnl(h, { a: { price: 0.01, priceHistory: [] } });
    expect(r.pnlPct).toBeCloseTo(-99.99, 2);
    expect(r.pnlPct).toBeGreaterThan(-100);
  });
});

describe('computeChartData — Grenzfälle', () => {
  const TODAY = '2026-07-29';

  it('verkraftet ein Kaufdatum in der Zukunft', () => {
    // Vertipper im Datumsfeld. Die Karte gehört an keinem Tag der Serie zum
    // Bestand — es darf trotzdem eine renderbare Linie herauskommen.
    const h = [holding({ cardId: 'a', purchaseDate: '2027-01-01' })];
    const serie = computeChartData(h, {}, TODAY);
    expect(serie.length).toBeGreaterThanOrEqual(2);
    expect(serie.every((p) => Number.isFinite(p.value))).toBe(true);
    expect(serie.at(-1)!.value).toBe(0);
  });

  it('endet exakt auf dem Wert, den die Kopfzeile zeigt', () => {
    // Die wichtigste Zusicherung der Grafik: Kurvenende und Gesamtwert müssen
    // identisch sein, sonst widersprechen sich zwei Zahlen auf demselben Schirm.
    const h = [
      holding({ cardId: 'a', purchasePrice: 100, quantity: 2, purchaseDate: '2026-07-20' }),
      holding({ cardId: 'b', purchasePrice: 50, quantity: 1, purchaseDate: '2026-07-25' }),
    ];
    const live: Record<string, LiveCardData> = {
      a: { price: 130, priceHistory: [{ date: '2026-07-22', price: 110 }] },
      b: { price: 45, priceHistory: [] },
    };
    const serie = computeChartData(h, live, TODAY);
    expect(serie.at(-1)!.value).toBeCloseTo(computePnl(h, live).totalValue, 2);
  });

  it('liefert eine lückenlose Tagesfolge ohne Sprünge', () => {
    const h = [holding({ cardId: 'a', purchaseDate: '2026-07-20' })];
    const serie = computeChartData(h, {}, TODAY);
    for (let i = 1; i < serie.length; i++) {
      const vorher = new Date(serie[i - 1].date + 'T00:00:00Z');
      vorher.setUTCDate(vorher.getUTCDate() + 1);
      expect(serie[i].date).toBe(vorher.toISOString().split('T')[0]);
    }
  });

  it('ignoriert Preispunkte aus der Zukunft', () => {
    // Ein fehlerhafter Datenpunkt darf den heutigen Wert nicht bestimmen.
    const h = [holding({ cardId: 'a', purchasePrice: 100, purchaseDate: '2026-07-27' })];
    const serie = computeChartData(h, {
      a: { price: 0, priceHistory: [{ date: '2030-01-01', price: 9999 }] },
    }, TODAY);
    expect(serie.every((p) => p.value < 9999)).toBe(true);
  });

  it('rechnet mit einem leeren liveData-Objekt', () => {
    const serie = computeChartData([holding({ cardId: 'a' })], {}, TODAY);
    expect(serie.length).toBeGreaterThan(0);
    expect(serie.every((p) => p.value === 100)).toBe(true);
  });

  it('deckelt die Serie auf ein Jahr, auch bei sehr altem Kaufdatum', () => {
    const h = [holding({ cardId: 'a', purchaseDate: '2010-01-01' })];
    const serie = computeChartData(h, {}, TODAY);
    expect(serie).toHaveLength(365);
    expect(serie.at(-1)!.date).toBe(TODAY);
  });
});

describe('filterByRange — Grenzfälle', () => {
  function serie(tage: number) {
    const punkte = [];
    for (let i = tage - 1; i >= 0; i--) {
      const d = new Date('2026-07-29T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - i);
      punkte.push({ date: d.toISOString().split('T')[0], value: 100 + i });
    }
    return punkte;
  }

  it('liefert für jeden Bereich höchstens die vorgesehene Tageszahl', () => {
    const daten = serie(400);
    for (const [bereich, tage] of Object.entries(RANGE_DAYS)) {
      const gefiltert = filterByRange(daten, bereich as keyof typeof RANGE_DAYS);
      expect(gefiltert.length, bereich).toBeLessThanOrEqual(tage);
      expect(gefiltert.at(-1), bereich).toEqual(daten.at(-1));
    }
  });

  it('gibt bei einem einzigen Punkt diesen zurück statt zu werfen', () => {
    const einer = serie(1);
    expect(() => filterByRange(einer, '1M')).not.toThrow();
    expect(filterByRange(einer, '1M')).toHaveLength(1);
  });

  it('behält die chronologische Reihenfolge', () => {
    const gefiltert = filterByRange(serie(100), '1M');
    const daten = gefiltert.map((p) => p.date);
    expect(daten).toEqual([...daten].sort());
  });
});

describe('median — Grenzfälle', () => {
  it('kommt mit negativen Werten zurecht', () => {
    expect(median([-5, -1, -3])).toBe(-3);
  });

  it('verwirft Infinity nicht als Zahl, bleibt aber berechenbar', () => {
    // Dokumentiert das tatsächliche Verhalten: Infinity landet am Ende der
    // Sortierung und beeinflusst den Median nur bei gerader Anzahl.
    expect(median([1, 2, 3, Infinity])).toBe(2.5);
  });

  it('verändert die übergebene Liste nicht', () => {
    const werte = [5, 1, 3];
    median(werte);
    expect(werte).toEqual([5, 1, 3]);
  });

  it('ist gegen ein einzelnes Cent-Listing robust', () => {
    // Der Grund für den Median statt des Minimums: Ein Bot-Angebot zu 0,02 €
    // würde sonst den ganzen Portfoliowert nach unten ziehen.
    expect(median([0.02, 118, 120, 122, 125])).toBe(120);
  });
});

describe('Hilfsfunktionen', () => {
  it('leitet den Set-Code aus einer Karten-ID ab', () => {
    expect(setCodeFromId('sv3pt5-25')).toBe('sv3pt5');
    expect(setCodeFromId('sm-base-12')).toBe('sm-base');
  });

  it('gibt bei einer ID ohne Bindestrich einen leeren Code zurück', () => {
    expect(setCodeFromId('nurset')).toBe('');
    expect(setCodeFromId('')).toBe('');
  });

  it('formatiert Datumsangaben deutsch mit führender Null', () => {
    expect(formatShortDate('2026-07-05')).toBe('05.07.');
    expect(formatShortDate('2026-12-31')).toBe('31.12.');
  });

  it('kennt für jede Sprache Flagge und Bezeichnung', () => {
    for (const sprache of ['EN', 'DE', 'JP', 'KR'] as const) {
      expect(LANG_FLAG[sprache]).toBeTruthy();
      expect(LANG_LABEL[sprache]).toBeTruthy();
    }
  });
});

describe('Zusammenspiel — der Ablauf der Portfolio-Seite', () => {
  it('führt von gespeicherten Rohdaten bis zur gefilterten Grafik', () => {
    // Genau die Reihenfolge, in der die Seite die Funktionen aufruft:
    // localStorage lesen → normalisieren → Live-Preise → Kennzahlen → Grafik.
    const roh = [
      { cardId: 'a', cardName: 'Glurak ex', purchasePrice: 100, quantity: 2, purchaseDate: '2026-07-20' },
      { cardId: 'b', cardName: 'Pikachu ex', purchasePrice: null as never, quantity: 1, purchaseDate: '2026-07-22' },
      { cardId: 'c', cardName: 'Alt-Eintrag ohne Sprache', purchasePrice: 30, purchaseDate: '2026-07-25' },
    ];
    const bestand = roh.map(normalizeHolding);
    expect(bestand.every((h) => h.language === 'EN')).toBe(true);

    const live: Record<string, LiveCardData> = {
      a: { price: 130, priceHistory: [{ date: '2026-07-24', price: 115 }] },
      b: { price: 20, priceHistory: [] },
      c: { price: 28, priceHistory: [] },
    };

    const kennzahlen = computePnl(bestand, live);
    expect(kennzahlen.totalCost).toBe(230); // 100*2 + 0 + 30
    expect(kennzahlen.totalValue).toBe(308); // 130*2 + 20 + 28
    expect(kennzahlen.pnl).toBe(78);

    const serie = computeChartData(bestand, live, '2026-07-29');
    expect(serie.at(-1)!.value).toBeCloseTo(kennzahlen.totalValue, 2);

    const woche = filterByRange(serie, '1W');
    expect(woche.length).toBeLessThanOrEqual(7);
    expect(woche.at(-1)).toEqual(serie.at(-1));
    expect(woche.every((p) => Number.isFinite(p.value))).toBe(true);
  });

  it('zeigt ein leeres Portfolio als leer, nicht als Fehler', () => {
    expect(computePnl([], {})).toEqual({ totalCost: 0, totalValue: 0, pnl: 0, pnlPct: 0 });
    expect(computeChartData([], {}, '2026-07-29')).toEqual([]);
    expect(filterByRange([], '1M')).toEqual([]);
  });
});
