import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';

// ANLASS: Das Preisdiagramm im Artikel wirkte unprofessionell — und das hatte
// konkrete Gründe, keine Geschmacksfrage:
//
//  - Die Balkenfarbe kam aus der Akzentfarbe des Artikeltyps. Beim
//    Wochenrückblick ist das GRAU, also wurde ein Kursanstieg grau gezeichnet,
//    während direkt darunter eine Legende „akzentuiert = Aufwärtstrend" stand.
//  - Senkrechte Balken zwangen die Kartennamen auf 13 Zeichen („Terapagos …").
//  - Der Wert stand nur im Tooltip — auf einem Telefon gibt es kein Hover.
//  - Unter jeder der vier Karten stand dasselbe Set-Logo in voller Größe.

const WURZEL = process.cwd();
const lies = (datei: string) => readFileSync(join(WURZEL, datei), 'utf8');

describe('Datenfarben sind semantisch, nicht dekorativ', () => {
  const bars = lies('src/components/DataBars.tsx');

  it('färbt steigend grün und fallend rot', () => {
    expect(bars).toContain('bg-emerald-400');
    expect(bars).toContain('bg-rose-400');
  });

  it('leitet keine Datenfarbe aus einer Akzentfarbe ab', () => {
    // Genau das war der Fehler: ACCENT[accentColor] als „Aufwärts"-Farbe.
    expect(bars).not.toMatch(/ACCENT/);
    expect(bars).not.toMatch(/accentColor/);
  });

  it('braucht keine Legende, die die Farben erklärt', () => {
    // Eine Grafik, die eine Farberklärung braucht, ist noch nicht fertig.
    expect(bars).not.toMatch(/Balkenfarbe|akzentuiert = Auf/);
    expect(lies('src/components/ArticleCardGallery.tsx')).not.toMatch(/Balkenfarbe/);
  });

  it('schreibt den Wert an den Balken statt nur in einen Tooltip', () => {
    expect(bars).toContain('formatEur(card.price)');
  });

  it('kürzt keine Kartennamen auf eine feste Zeichenzahl', () => {
    // `name.slice(0, 13)` war nötig, weil senkrechte Balken keinen Platz hatten.
    expect(bars).not.toMatch(/slice\(0,\s*1[0-9]\)/);
    expect(lies('src/components/ArticleCardGallery.tsx')).not.toMatch(/slice\(0,\s*1[0-9]\)/);
  });

  it('hält auch den kleinsten Balken sichtbar', () => {
    expect(bars).toContain('BAR_MIN_PCT');
  });
});

describe('Die Grafiken gibt es nur einmal', () => {
  it('Artikel und Marktbericht nutzen dieselben Bausteine', () => {
    // Code-Regel 10: keine zweite Umsetzung derselben Darstellung.
    for (const datei of ['src/components/ArticleCardGallery.tsx', 'src/app/marktbericht/page.tsx']) {
      expect(lies(datei), datei).toMatch(/from '@?\/?.*DataBars'/);
    }
  });

  it('niemand baut die Balken noch einmal selbst', () => {
    const eigenbau: string[] = [];
    for (const datei of globSync('src/{app,components}/**/*.tsx', { cwd: WURZEL })) {
      if (datei.endsWith('DataBars.tsx')) continue;
      const src = lies(datei);
      // Kennzeichen einer zweiten Umsetzung: eigene Nulllinie plus eigene
      // Trendfärbung im selben Block.
      if (/left-1\/2 w-px/.test(src) && /bg-(emerald|rose)-400/.test(src)) eigenbau.push(datei);
    }
    expect(eigenbau, `Zweite Balken-Umsetzung gefunden:\n${eigenbau.join('\n')}`).toEqual([]);
  });
});

describe('Kennzahlen-Kacheln', () => {
  const stats = lies('src/components/ArticleStats.tsx');

  it('zeigen nichts, wenn es nichts zu vergleichen gibt', () => {
    // Stolperstelle 29: aus fehlenden Daten keine Kennzahlen ableiten.
    expect(stats).toMatch(/if \(mitPreis\.length < 2\) return null;/);
  });

  it('rechnen nur mit Karten, für die ein Preis vorliegt', () => {
    expect(stats).toContain('cards.filter((c) => c.price > 0)');
  });

  it('werden auf beiden Inhaltsseiten eingesetzt', () => {
    expect(lies('src/app/artikel/[date]/page.tsx')).toContain('<ArticleStats');
    expect(lies('src/app/marktbericht/page.tsx')).toContain('<ArticleStats');
  });
});

describe('Der Marktbericht zeigt Marktzahlen, keine Listenlängen', () => {
  const seite = lies('src/app/marktbericht/page.tsx');

  it('nennt nicht mehr die Anzahl der Listeneinträge als Kennzahl', () => {
    // Vorher: „Top Gewinner: 6", „Wertvollste Karten: 6", „Marktbericht: Live".
    expect(seite).not.toMatch(/value: `\$\{report\.topGainers\.length\}`/);
    expect(seite).not.toMatch(/value: 'Live'/);
  });

  it('leitet die Grafiken aus den echten Kartenpreisen ab', () => {
    expect(seite).toContain('displayPrice(c)');
    expect(seite).toContain('trendPercent');
  });

  it('zeigt jede Karte nur einmal, auch wenn sie in beiden Listen steht', () => {
    expect(seite).toMatch(/new Map\(/);
  });
});

describe('Kartenbilder statt wiederholter Set-Logos', () => {
  const galerie = lies('src/components/ArticleCardGallery.tsx');

  it('zeigt das Set-Logo einmal, wenn alle Karten aus einem Set stammen', () => {
    expect(galerie).toContain('einSet');
  });

  it('behält das Boosterpack-Bild als Herkunftshinweis', () => {
    // Pflichtregel aus CLAUDE.md — nur die Größe ist kontextgerecht.
    expect(galerie).toContain('BoosterPackImage');
  });

  it('gibt dem Kartenbild das Kartenformat statt einer festen Höhe', () => {
    expect(galerie).toContain('aspect-[63/88]');
  });
});

describe('Der Preisverlauf spricht dieselbe Farbsprache', () => {
  const chart = lies('src/components/PriceChart.tsx');

  it('färbt nach Richtung statt fest violett', () => {
    expect(chart).toContain('verlaufsFarbe');
    expect(chart).not.toMatch(/stroke="#7c3aed"/);
  });

  it('zeigt bei wenigen Punkten die echten Messungen', () => {
    expect(chart).toMatch(/chartData\.length <= \d+ \? \{ r:/);
  });
});
