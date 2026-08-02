import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { marketStory } from '@/lib/market-story';
import { verteileBaender, deuteVerteilung, BAENDER } from '@/lib/market-distribution';
import type { PmiResult, Breadth, SetRank } from '@/lib/market-metrics';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');

// DIE STARTSEITE ERZAEHLT, BEVOR SIE MISST.
//
// Ausgangslage: Der erste Bildschirm zeigte „−0,2 %", „32 %", „37". Wer
// Pokemon sammelt und nicht aus der Finanzwelt kommt, liest darin nichts —
// drei Zahlen ohne Bezug sind eine Bringschuld an den Leser.
//
// Diese Tests sichern zwei Dinge: dass die Story aus GEMESSENEN Werten kommt
// (und nichts behauptet, was daneben nicht steht), und dass sie der Grafik
// darunter nicht widerspricht.

const pmi = (value: number, sufficient = true): PmiResult => ({
  value, sufficient, cardCount: 204, setCount: 15, windowDays: 30, minCards: 20,
});
const breadth = (up: number, total: number): Breadth => ({
  up, down: total - up, total, pct: total > 0 ? (up / total) * 100 : 0,
});
const set = (code: string, name: string, avgTrend: number | null): SetRank => ({
  code, name, avgTrend, medianPrice: 10, count: 20,
} as SetRank);

describe('Markt-Story', () => {
  it('nennt in der Schlagzeile die Spannung, nicht den Wert', () => {
    // Ein flacher Index bei schmaler Breite ist die interessanteste Lage
    // ueberhaupt — und genau die, die eine einzelne Prozentzahl verschweigt.
    const s = marketStory(pmi(-0.2), breadth(66, 204), []);
    expect(s.schlagzeile).toBe('Ruhig an der Oberfläche, schwach darunter');
    expect(s.schlagzeile).not.toMatch(/%/);
  });

  it('unterscheidet gleiche Indexwerte nach Marktbreite', () => {
    // Derselbe Index, zwei voellig verschiedene Maerkte. Wenn die Story das
    // nicht trennt, ist sie nur eine Vorlesefunktion fuer die Zahl.
    const schmal = marketStory(pmi(0.4), breadth(50, 204), []);
    const breit = marketStory(pmi(0.4), breadth(140, 204), []);
    expect(schmal.schlagzeile).not.toBe(breit.schlagzeile);
  });

  it('nennt Sets beim Namen — das macht aus einer Kennzahl einen Ort', () => {
    const s = marketStory(pmi(-0.2), breadth(66, 204), [
      set('sv8', 'Black Bolt', 6.7),
      set('sv3pt5', '151', -6.5),
      set('sv6', 'Twilight', null),
    ]);
    expect(s.absatz).toContain('Black Bolt');
    expect(s.absatz).toContain('151');
    // Ein Set ohne gemessenen Trend darf nicht auftauchen — es hat keinen
    // Wert, auch nicht den Wert null.
    expect(s.absatz).not.toContain('Twilight');
  });

  it('behauptet weder Ursache noch Zukunft noch Handlung', () => {
    const alle = [
      marketStory(pmi(-8), breadth(30, 204), [set('a', 'A', -9), set('b', 'B', 2)]),
      marketStory(pmi(0.1), breadth(140, 204), [set('a', 'A', 3), set('b', 'B', -1)]),
      marketStory(pmi(6), breadth(120, 204), []),
    ];
    const verboten = /\bweil\b|getrieben|dürfte|wird sich|Prognose|setzt sich fort|lohnt|kaufen|verkaufen|empfehl/i;
    for (const s of alle) {
      expect(`${s.schlagzeile} ${s.absatz}`, s.schlagzeile).not.toMatch(verboten);
    }
  });

  it('zeigt bei zu duenner Datenlage den Mangel statt einer Story', () => {
    const s = marketStory(pmi(0, false), breadth(0, 0), []);
    expect(s.belastbar).toBe(false);
    expect(s.absatz).toMatch(/fehlen Messwerte/);
  });

  it('jede Zahl im Absatz steht auch in den Belegen oder stammt aus den Sets', () => {
    // Kein Wert darf im Text auftauchen, den man nicht danebenstehen sieht.
    const s = marketStory(pmi(-0.2), breadth(66, 204), [set('a', 'Black Bolt', 6.7), set('b', '151', -6.5)]);
    for (const teil of ['0,2', '32', '204', '66', '138', '6,7', '6,5']) {
      const imText = s.absatz.includes(teil);
      const imBeleg = s.belege.some((b) => b.wert.includes(teil));
      if (imText) expect(imText || imBeleg, teil).toBe(true);
    }
    expect(s.belege.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Verteilung in fuenf Baendern', () => {
  it('deckt die Zahlenachse luecken- und ueberschneidungsfrei ab', () => {
    // Eine Karte muss in genau ein Band fallen. Sonst stimmt die Summe nicht
    // mit der Stichprobe ueberein, und beide stehen auf derselben Seite.
    const werte = [-99, -10.1, -10, -2.1, -2, -0.001, 0, 1.9, 2, 9.9, 10, 250];
    const b = verteileBaender(werte);
    expect(b.reduce((s, x) => s + x.anzahl, 0)).toBe(werte.length);
    for (let i = 0; i < BAENDER.length - 1; i++) {
      expect(BAENDER[i].bis).toBe(BAENDER[i + 1].von);
    }
  });

  it('nennt jedes Band mit Worten, nicht mit Grenzen', () => {
    for (const b of BAENDER) {
      expect(b.label).not.toMatch(/[<>%]|\d/);
      expect(b.label.length).toBeGreaterThan(6);
    }
  });

  it('die Deutung widerspricht der Verteilung NICHT', () => {
    // DER FEHLER, DER DIESEN TEST AUSGELOEST HAT: Bei 115 Karten unten gegen
    // 52 oben stand unter der Grafik „Gewinner und Verlierer halten sich
    // ungefaehr die Waage" — direkt unter einer Schlagzeile, die das Gegenteil
    // sagte. Ursache war eine feste 60-%-Marke, gemessen an der GESAMTZAHL
    // inklusive der unbewegten Karten.
    const echt = [
      ...Array(22).fill(-15), ...Array(93).fill(-5),
      ...Array(37).fill(0),
      ...Array(40).fill(5), ...Array(12).fill(15),
    ];
    const satz = deuteVerteilung(verteileBaender(echt));
    expect(satz).toMatch(/Verlustseite/);
    expect(satz).not.toMatch(/Waage|ähnlich stark/);
  });

  it('nennt eine Waage nur, wenn es wirklich eine ist', () => {
    const ausgeglichen = [
      ...Array(40).fill(-5), ...Array(30).fill(0), ...Array(42).fill(5),
    ];
    expect(deuteVerteilung(verteileBaender(ausgeglichen))).toMatch(/Waage/);
  });

  it('erkennt einen stillstehenden Markt', () => {
    const still = [...Array(60).fill(0.4), ...Array(20).fill(-5), ...Array(20).fill(5)];
    expect(deuteVerteilung(verteileBaender(still))).toMatch(/steht weitgehend still/);
  });

  it('sagt bei fehlender Messung nichts ueber den Markt', () => {
    expect(deuteVerteilung(verteileBaender([]))).toMatch(/Noch keine gemessenen/);
  });
});

describe('Die Startseite beginnt mit der Geschichte', () => {
  const kopf = lies('src/components/MarketHeader.tsx');

  it('die Story steht vor dem Indexwert', () => {
    expect(kopf.indexOf('MarketStoryBlock')).toBeLessThan(kopf.indexOf('NUM.hero'));
  });

  it('die Kennzahlen sind als Stuetze ausgewiesen, nicht als Einstieg', () => {
    expect(kopf).toContain('Die Zahlen dahinter');
    expect(kopf.indexOf('MarketStoryBlock')).toBeLessThan(kopf.indexOf('Die Zahlen dahinter'));
  });

  it('erklaert den Index, statt sein Kuerzel vorauszusetzen', () => {
    // „CBI" ist ein Kuerzel, das man nachschlagen muesste — und niemand
    // schlaegt nach.
    expect(kopf).toMatch(/nach Kartenwert gewichtet/);
    expect(kopf).toContain('/methodik');
  });
});
