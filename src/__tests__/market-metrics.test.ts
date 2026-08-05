import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  splitMovers,
  marketBreadth,
  hasRealTrend,
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

describe('hasRealTrend', () => {
  it('erkennt einen gemessenen Trend', () => {
    expect(hasRealTrend(card('a', 4.2))).toBe(true);
    expect(hasRealTrend(card('b', -4.2))).toBe(true);
  });

  it('verwirft die Null ohne Datengrundlage', () => {
    // `mapAndFilter` startet mit `trendPercent = 0` und setzt `realData` erst,
    // wenn ein echter 30-Tage-Schnitt vorlag. Ohne diesen Filter zählt eine
    // NICHT GEMESSENE Karte als „nicht gestiegen" und drückt die Marktbreite.
    expect(hasRealTrend(card('a', 0))).toBe(false);
  });

  it('lässt eine gemessene Null zu', () => {
    expect(hasRealTrend(card('a', 0, 10, { realData: true }))).toBe(true);
  });

  it('verwirft fehlende und ungültige Werte', () => {
    expect(hasRealTrend(card('a', undefined))).toBe(false);
    expect(hasRealTrend(card('b', NaN))).toBe(false);
  });
});

describe('marketBreadth', () => {
  it('zählt über den GANZEN Datensatz, nicht über die Anzeige-Liste', () => {
    // DER FEHLER: Die Startseite nahm `splitMovers(cards, 8).gainers.length`
    // als Zähler. Ab neun gestiegenen Karten blieb der bei 8 stehen, während
    // der Nenner weiterwuchs — live standen deshalb „8/50" (16 %) und
    // gleichzeitig „16 von 50" (32 %) auf derselben Seite.
    const cards = [
      ...Array.from({ length: 12 }, (_, i) => card(`up${i}`, i + 1)),
      ...Array.from({ length: 8 }, (_, i) => card(`down${i}`, -(i + 1))),
    ];
    const breite = marketBreadth(cards);
    expect(breite.up).toBe(12);
    expect(breite.down).toBe(8);
    expect(breite.total).toBe(20);
    expect(breite.pct).toBeCloseTo(60);

    // Die Anzeige-Liste ist gekürzt — genau der Unterschied, um den es geht.
    expect(splitMovers(cards, 8).gainers).toHaveLength(8);
  });

  it('bezieht sich nur auf gemessene Karten', () => {
    const breite = marketBreadth([card('a', 5), card('b', -5), card('c', 0)]);
    expect(breite.total).toBe(2);
    expect(breite.pct).toBeCloseTo(50);
  });

  it('erfindet ohne Daten keinen Wert', () => {
    expect(marketBreadth([])).toMatchObject({ up: 0, down: 0, total: 0, pct: 0 });
  });

  it('stimmt mit der Erklärung zu Angst & Gier überein', () => {
    // Beide Zahlen stehen auf derselben Seite. Laufen sie auseinander, ist
    // mindestens eine falsch — und der Besucher sieht es sofort.
    const cards = [
      ...Array.from({ length: 16 }, (_, i) => card(`up${i}`, i + 1)),
      ...Array.from({ length: 34 }, (_, i) => card(`down${i}`, -(i + 1))),
    ];
    const breite = marketBreadth(cards);
    const fg = computeFearGreed(cards);
    const marktbreite = fg.components.find((k) => k.label === 'Marktbreite');
    expect(marktbreite?.detail).toBe(`${breite.up} von ${breite.total} Karten über ihrem 30-Tage-Schnitt`);
    expect(marktbreite?.score).toBeCloseTo(breite.pct);
  });
});

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

  it('laesst sich von einer einzelnen teuren Karte nicht bestimmen', () => {
    // FRUEHER forderte diese Pruefung das GEGENTEIL: Der preisgewichtete Index
    // MUSSTE der teuren Karte folgen. Gemessen am Gesamtbestand war genau das
    // der Fehler — zehn Karten von 19.063 trugen 12 von 28,7 Prozentpunkten.
    // Der Median folgt der Mehrheit, nicht dem Preisschild.
    const guenstig = Array.from({ length: 24 }, (_, i) => card(`g${i}`, 2, 5));
    const pmi = computePmi([...guenstig, card('teuer', -400, 9000)]);
    expect(pmi.value).toBeCloseTo(2, 5);
  });

  it('nimmt Karten unter zehn Cent nicht in die Marktaussage', () => {
    // Am Cardmarket-Boden sind zwei auf drei Cent fuenfzig Prozent, ohne dass
    // etwas passiert ist. Ueber ALLE Karten war der Median deshalb exakt
    // 0,00 %, ab zehn Cent +3,50 %.
    const boden = Array.from({ length: 30 }, (_, i) => card(`b${i}`, 50, 0.02));
    const echte = Array.from({ length: 25 }, (_, i) => card(`e${i}`, 3, 4));
    const pmi = computePmi([...boden, ...echte]);
    expect(pmi.cardCount).toBe(25);
    expect(pmi.value).toBeCloseTo(3, 5);
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

describe('fearGreedLabel — Markttemperatur', () => {
  // Umbenannt von „Angst & Gier": Gemessen werden drei Preisgroessen, nicht
  // Gefuehle. Aus Preisen auf Gefuehle zu schliessen ist eine Behauptung, die
  // die Daten nicht hergeben — und „Extreme Gier" klingt wie eine
  // Handlungsaufforderung. Die RECHNUNG ist unveraendert, nur das Wort nicht.
  it.each([
    [90, 'Heiß'],
    [65, 'Anziehend'],
    [50, 'Ruhig'],
    [30, 'Abkühlend'],
    [10, 'Kalt'],
  ])('%i ist „%s"', (wert, label) => {
    expect(fearGreedLabel(wert)).toBe(label);
  });

  it('kein Begriff bewertet den Markt oder fordert zum Handeln auf', () => {
    for (const wert of [0, 10, 30, 50, 65, 90, 100]) {
      expect(fearGreedLabel(wert)).not.toMatch(/Gier|Angst|kaufen|verkaufen|stark|schwach/i);
    }
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
    // Der Median haelt den Ausreisser schon von sich aus draussen — die
    // Pruefung bleibt trotzdem noetig, weil sie ihn AUCH aus Marktbreite,
    // Set-Rangliste und Bewegungslisten entfernt.
    const ohnePruefung = computePmi([...echte, kaputt]).value;
    const mitPruefung = computePmi(validateMarketData([...echte, kaputt]).clean).value;
    expect(ohnePruefung).toBeCloseTo(-2, 5);
    expect(mitPruefung).toBeCloseTo(-2, 5);
    expect(validateMarketData([...echte, kaputt]).clean).toHaveLength(25);
  });

  it('meldet den Anteil verwertbarer Karten', () => {
    const r = validateMarketData([card('a', 5), card('b', 5, 0)]);
    expect(r.usablePct).toBe(50);
  });
});

describe('Index-Zeilen überleben die Qualitätsprüfung', () => {
  // BEFUND, LIVE SICHTBAR: Nach der Umstellung auf den Gesamtbestand stand auf
  // der Startseite „Keine Messung" und ein Gedankenstrich statt einer Zahl.
  //
  // URSACHE: Die Zeilen aus dem Kartenindex trugen weder `id` noch `imageUrl`
  // — sie waren ja nur fuer Kennzahlen gedacht. `validateMarketData` verwirft
  // aber Zeilen ohne Bild UND behandelt jede weitere Zeile mit derselben ID als
  // Dublette. Von 19.690 Karten blieb damit genau EINE uebrig, und eine Karte
  // reicht nicht fuer eine Aussage.
  //
  // Die Lehre ist allgemeiner als der Fehler: Wer Daten fuer eine Kennzahl
  // erzeugt, muss sie durch DIESELBE Pruefung schicken, die sie spaeter
  // durchlaufen — sonst prueft man etwas anderes, als man ausliefert.
  function indexZeile(i: number, trend: number, preis = 5) {
    return {
      id: `idx-${i}`,
      name: '',
      set: '',
      setCode: 'sv1',
      rarity: '',
      imageUrl: 'https://images.pokemontcg.io/sv1/1.png',
      prices: { market: preis },
      trendPercent: trend,
      realData: true,
    } as PokemonCard;
  }

  it('kommen vollzaehlig durch die Pruefung', () => {
    const zeilen = Array.from({ length: 50 }, (_, i) => indexZeile(i, 2));
    expect(validateMarketData(zeilen).clean).toHaveLength(50);
  });

  it('ergeben danach eine belastbare Kennzahl', () => {
    const zeilen = Array.from({ length: 50 }, (_, i) => indexZeile(i, i - 25));
    const pmi = computePmi(validateMarketData(zeilen).clean);
    expect(pmi.sufficient).toBe(true);
    expect(pmi.cardCount).toBe(50);
  });

  it('ohne ID bleibt genau eine Zeile uebrig — der Fehler von v6.0.0', () => {
    // Diese Pruefung haelt die URSACHE fest, nicht nur die Behebung.
    const ohneId = Array.from({ length: 50 }, (_, i) => ({ ...indexZeile(i, 2), id: '' }));
    expect(validateMarketData(ohneId).clean).toHaveLength(1);
  });

  it('ohne Bild bleibt nichts uebrig', () => {
    const ohneBild = Array.from({ length: 50 }, (_, i) => ({ ...indexZeile(i, 2), imageUrl: '' }));
    expect(validateMarketData(ohneBild).clean).toHaveLength(0);
  });

  it('der Bestandslader liefert beide Felder mit', () => {
    const quelle = readFileSync(join(process.cwd(), 'src/lib/card-index.ts'), 'utf8');
    const abschnitt = quelle.slice(quelle.indexOf('indexKartenFuerIndex'));
    expect(abschnitt).toContain('id,set_code,price,trend,real_data,image_url');
    expect(abschnitt).toContain('id: z.id');
    expect(abschnitt).toContain('imageUrl: z.image_url');
  });
});
