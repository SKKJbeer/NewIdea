import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  rankSets,
  splitMovers,
  computePmi,
  computeFearGreed,
  marketBreadth,
  hasRealTrend,
  MIN_SET_SAMPLE,
  PMI_MIN_CARDS,
} from '@/lib/market-metrics';
import type { PokemonCard } from '@/types';

// ANLASS: Ein externer Blick auf die Live-Seite fand zwei Aussagen, die so
// nicht stimmen durften: „151 — stärkstes Set · 1 Karten im Datensatz" (eine
// Rangliste aus einer einzigen Karte) und „50 Karten · 4 Sets" neben dem
// Marktindex, gelesen als gesamter Datenbestand statt als Stichprobe EINER
// Kennzahl.

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), 'utf8');

function karte(
  id: string,
  { set = 'tst', preis = 10, trend, gemessen = true }: {
    set?: string; preis?: number; trend?: number; gemessen?: boolean;
  } = {},
): PokemonCard {
  return {
    id,
    name: `Karte ${id}`,
    set: `Set ${set}`,
    setCode: set,
    rarity: 'Rare',
    imageUrl: `https://images.pokemontcg.io/${set}/${id}.png`,
    prices: { market: preis },
    trendPercent: trend ?? 0,
    realData: trend !== undefined ? gemessen : false,
  } as PokemonCard;
}

const vieleAus = (set: string, n: number, trend = 1) =>
  Array.from({ length: n }, (_, i) => karte(`${set}-${i}`, { set, trend, preis: 10 + i }));

describe('Set-Ranking braucht eine Mindest-Stichprobe', () => {
  it('nimmt ein Set mit einer einzigen Karte NICHT auf', () => {
    // GENAU DER LIVE-BEFUND: „151 — stärkstes Set nach Durchschnittspreis —
    // 1 Karten im Datensatz". Der Durchschnitt einer Karte ist ihr Preis.
    const cards = [karte('teuer', { set: 'sv3pt5', preis: 900, trend: 5 }), ...vieleAus('sv2', 8)];
    const rang = rankSets(cards);
    expect(rang.map((s) => s.code)).not.toContain('sv3pt5');
  });

  it('nimmt ein Set unter der Mindest-Stichprobe NICHT auf', () => {
    const cards = [...vieleAus('klein', MIN_SET_SAMPLE - 1), ...vieleAus('gross', MIN_SET_SAMPLE)];
    expect(rankSets(cards).map((s) => s.code)).toEqual(['gross']);
  });

  it('nimmt ein Set ab der Mindest-Stichprobe auf', () => {
    const rang = rankSets(vieleAus('gross', MIN_SET_SAMPLE));
    expect(rang).toHaveLength(1);
    expect(rang[0].count).toBe(MIN_SET_SAMPLE);
  });

  it('liefert eine LEERE Liste, wenn kein Set die Schwelle erreicht', () => {
    // Die Oberfläche zeigt dann „Noch nicht genügend Daten für ein belastbares
    // Set-Ranking" — besser als eine irreführende Rangliste.
    expect(rankSets([...vieleAus('a', 2), ...vieleAus('b', 3)])).toEqual([]);
  });

  it('lässt sich von einer einzelnen teuren Karte nicht bestimmen', () => {
    // Der Grund für den Median: Ein Mittelwert bleibt auch oberhalb der
    // Mindest-Stichprobe von einem Ausreißer bestimmt — fünf Karten zu 5 €
    // plus eine zu 5.000 € ergäben 837 €, was keine der sechs Karten kostet.
    const guenstigMitAusreisser = [
      ...vieleAus('a', 5).map((c) => ({ ...c, prices: { market: 5 } })),
      karte('spitze', { set: 'a', preis: 5000, trend: 1 }),
    ];
    const teuerDurchgehend = vieleAus('b', 6).map((c) => ({ ...c, prices: { market: 300 } }));
    const rang = rankSets([...guenstigMitAusreisser, ...teuerDurchgehend] as PokemonCard[]);
    expect(rang[0].code).toBe('b');
  });

  it('zählt für den Trend nur gemessene Karten', () => {
    const cards = [
      ...vieleAus('x', 5, 10),
      // Ohne Messung: `trendPercent = 0` ist hier eine Lücke, keine Beobachtung.
      ...Array.from({ length: 5 }, (_, i) => karte(`leer${i}`, { set: 'x' })),
    ];
    expect(rankSets(cards)[0].avgTrend).toBeCloseTo(10);
  });

  it('wird nirgends zweitimplementiert', () => {
    // Die Startseite hatte die Aggregation inline — genau dort entstand der
    // Ein-Karten-Sieger. Set-Ranglisten laufen ab jetzt über EINE Funktion.
    const seite = lies('src/app/page.tsx');
    expect(seite).toContain('rankSets(');
    expect(seite).not.toMatch(/setMap\.set\(/);
  });
});

describe('Datenbestand und auswertbare Stichprobe sind zweierlei', () => {
  it('eine heute neu erfasste Karte zählt NICHT in den 30-Tage-Index', () => {
    // Ihr eine 30-Tage-Entwicklung anzudichten, damit die Stichprobe größer
    // aussieht, wäre eine erfundene Kennzahl.
    const neu = karte('neu', { gemessen: false });
    expect(hasRealTrend(neu)).toBe(false);
    expect(computePmi([...vieleAus('a', 25), neu]).cardCount).toBe(25);
  });

  it('dieselbe Karte hat trotzdem einen gültigen aktuellen Preis', () => {
    // Sie gehört damit in die Datenabdeckung — nur eben nicht in den Index.
    const neu = karte('neu', { preis: 42, gemessen: false });
    expect(neu.prices.market).toBe(42);
  });

  it('sobald echte Historie vorliegt, zählt sie mit — ohne Zutun', () => {
    const mitHistorie = karte('reif', { trend: 3.5 });
    expect(hasRealTrend(mitHistorie)).toBe(true);
    expect(computePmi([...vieleAus('a', 25), mitHistorie]).cardCount).toBe(26);
  });

  it('die Oberfläche nennt die Stichprobe beim Namen', () => {
    const seite = lies('src/app/page.tsx');
    expect(seite).toContain('auswertbare Karten');
    expect(seite).toContain('Datenabdeckung');
  });
});

describe('Gewinner und Verlierer bleiben vorzeichenrein', () => {
  const gemischt = [
    karte('a', { trend: 5 }), karte('b', { trend: -3 }),
    karte('c', { trend: 0, gemessen: true }), karte('d', { trend: 12 }),
  ];

  it('Gewinner ausschließlich über null', () => {
    expect(splitMovers(gemischt).gainers.every((c) => (c.trendPercent as number) > 0)).toBe(true);
  });

  it('Verlierer ausschließlich unter null', () => {
    expect(splitMovers(gemischt).losers.every((c) => (c.trendPercent as number) < 0)).toBe(true);
  });

  it('keine Karte steht in beiden Listen', () => {
    const { gainers, losers } = splitMovers(gemischt);
    const doppelt = gainers.filter((g) => losers.some((l) => l.id === g.id));
    expect(doppelt).toEqual([]);
  });

  it('auch die Berichts-Routen nutzen die zentrale Trennung', () => {
    // Diese drei sortierten dieselbe Liste zweimal und schnitten oben bzw.
    // unten ab — der auf der Startseite längst behobene Fehler, der hier
    // weiterlief und den Marktbericht speiste.
    for (const datei of [
      'src/app/api/cron/route.ts',
      'src/app/api/market/route.ts',
      'src/app/api/generate/route.ts',
      'src/lib/market-report-generator.ts',
    ]) {
      expect(lies(datei), datei).toContain('splitMovers(');
      expect(lies(datei), datei).not.toMatch(/sorted\.slice\(-5\)\.reverse\(\)/);
    }
  });

  it('der Marktbericht nutzt dieselbe Datenquelle wie die Startseite', () => {
    // Vorher: 20 Karten aus EINER Set-Abfrage — daher „6 Karten" aus einem
    // einzigen Set als „wertvollste Karten des Marktes".
    const bericht = lies('src/lib/market-report-generator.ts');
    expect(bericht).toContain('getHomepageCards(');
    // Nur die tatsächliche Verwendung prüfen — der Kommentar nennt den alten
    // Aufruf absichtlich, damit der Grund am Code steht.
    expect(bericht).not.toMatch(/^\s*const cards = await fetchTrendingCards/m);
  });
});

describe('PMI und Angst & Gier an den Rändern', () => {
  it('unter der Mindestmenge kein Indexwert', () => {
    const wenige = vieleAus('a', PMI_MIN_CARDS - 1);
    expect(computePmi(wenige).sufficient).toBe(false);
  });

  it('genau an der Mindestmenge zählt der Wert', () => {
    expect(computePmi(vieleAus('a', PMI_MIN_CARDS)).sufficient).toBe(true);
  });

  it('ohne Daten keine Stimmung', () => {
    const leer = computeFearGreed([]);
    expect(leer.sufficient).toBe(false);
    expect(leer.components).toEqual([]);
  });

  it('nur Gewinner ergibt nicht mehr als 100', () => {
    const fg = computeFearGreed(vieleAus('a', 30, 50));
    expect(fg.value).toBeLessThanOrEqual(100);
    expect(fg.value).toBeGreaterThan(50);
  });

  it('nur Verlierer ergibt nicht weniger als 0', () => {
    const fg = computeFearGreed(vieleAus('a', 30, -50));
    expect(fg.value).toBeGreaterThanOrEqual(0);
    expect(fg.value).toBeLessThan(50);
  });

  it('die Teilwerte ergeben exakt den angezeigten Wert', () => {
    const fg = computeFearGreed(vieleAus('a', 30, 4));
    const summe = fg.components.reduce((s, k) => s + k.score * k.weight, 0);
    expect(Math.round(summe)).toBe(fg.value);
  });

  it('Marktbreite und Index nutzen dieselbe Grundmenge', () => {
    const cards = [...vieleAus('a', 20, 3), karte('ohne', { gemessen: false })];
    expect(marketBreadth(cards).total).toBe(computePmi(cards).cardCount);
  });
});
