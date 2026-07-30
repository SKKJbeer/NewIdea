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
    // Verläufe statt Flächenfarbe — geprüft wird die Farbfamilie, nicht der
    // genaue Ton.
    expect(bars).toMatch(/emerald-\d{3}/);
    expect(bars).toMatch(/rose-\d{3}/);
    expect(bars).not.toMatch(/\b(green|red)-\d{3}\b/);
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

// ── Aufbau beim Scrollen ────────────────────────────────────────────────────
//
// Eine Zahl, die fertig dasteht, wird überblättert. Eine, die sich aufbaut,
// wird gelesen. Beides muss aber ohne JavaScript und bei „Reduced Motion"
// sofort vollständig sichtbar sein — eine Grafik darf nie unsichtbar bleiben,
// nur weil eine Animation nicht laufen kann.

describe('Die Grafiken bauen sich beim Hereinscrollen auf', () => {
  const bars = lies('src/components/DataBars.tsx');
  const stats = lies('src/components/ArticleStats.tsx');
  const hook = lies('src/lib/use-in-view.ts');

  it('nutzen dieselbe Sichtbarkeits-Erkennung wie Reveal', () => {
    // Code-Regel 10: eine Umsetzung, nicht drei.
    for (const [name, src] of [
      ['DataBars', bars],
      ['ArticleStats', stats],
      ['Reveal', lies('src/components/Reveal.tsx')],
      ['CountUp', lies('src/components/CountUp.tsx')],
    ] as const) {
      expect(src, name).toContain('useInView');
    }
  });

  it('lassen die Balken von null auf ihren Wert wachsen', () => {
    expect(bars).toMatch(/sichtbar \? `\$\{anteil\}%` : '0%'/);
  });

  it('setzen die Zeilen versetzt ein', () => {
    expect(bars).toContain('STUFE_MS');
    expect(bars).toMatch(/i \* STUFE_MS/);
  });

  it('respektieren die Systemeinstellung für weniger Bewegung', () => {
    expect(hook).toContain('prefers-reduced-motion');
    expect(lies('src/components/CountUp.tsx')).toContain('prefers-reduced-motion');
  });

  it('zeigen ohne IntersectionObserver sofort alles', () => {
    expect(hook).toMatch(/typeof IntersectionObserver === 'undefined'/);
    expect(hook).toMatch(/setInView\(true\)/);
  });

  it('beenden das Hochzählen exakt auf dem echten Wert', () => {
    // Der Endwert ist nie ein gerundeter Zwischenschritt — sonst stünde dort
    // eine Zahl, die es nicht gibt (Preis-Wahrheitspflicht).
    expect(lies('src/components/CountUp.tsx')).toMatch(/else setWert\(value\)/);
  });
});

describe('Gestaltung hebt sich von einem Standard-Plot ab', () => {
  const bars = lies('src/components/DataBars.tsx');

  it('nutzt Verläufe und Schein statt flacher Flächen', () => {
    expect(bars).toMatch(/bg-gradient-to-r/);
    expect(bars).toMatch(/shadow-\[0_0_12px/);
  });

  it('legt die Balken in eine vertiefte Spur', () => {
    expect(bars).toMatch(/ring-1 ring-inset/);
  });

  it('gibt der Fläche einen Maßstab', () => {
    expect(bars).toMatch(/\[25, 50, 75\]/);
  });
});

describe('Die Guides-Liste hat keine durchscheinende Kachel mehr', () => {
  const seite = lies('src/app/guides/page.tsx');

  it('legt eine deckende Fläche unter den Verlauf', () => {
    // Die halbtransparente erste Kachel ließ die Unterkante des Kopfbereichs
    // durchscheinen — es sah aus, als kreuze eine Linie die Karte.
    expect(seite).toMatch(/bg-\[#13131e\][^"]*p-5/);
    expect(seite).not.toMatch(/i === 0\s*\?\s*'border-violet-500\/30 bg-gradient-to-r/);
  });
});

// ── Startseite: keine bildlose Liste, keine nackte Kennzahl ────────────────
//
// ANLASS: Die Set-Tabelle bestand ausschließlich aus Text — kein einziges Bild,
// obwohl dort vier Sets aufgeführt sind. Die Kennzahlen-Kacheln zeigten reine
// Prozentzahlen ohne jeden Maßstab, und die „Investor Insights" waren vier
// Aufzählungspunkte.

describe('Startseite zeigt Bilder und Grafiken statt reiner Tabellen', () => {
  const seite = lies('src/app/page.tsx');

  it('zeigt zu jedem Set ein Bild', () => {
    expect(seite, 'Regel: Boosterpack-Bild überall dort wo Karten/Sets erscheinen').toContain(
      'BoosterPackImage',
    );
  });

  it('macht aus der Preisspalte eine sichtbare Rangfolge', () => {
    expect(seite).toContain('RowBar');
    expect(seite).toContain('maxSetPreis');
  });

  it('verlinkt die Set-Zeilen auf die Set-Seite', () => {
    expect(seite).toMatch(/href=\{`\/sets\/\$\{s\.code\}`\}/);
  });

  it('gibt PMI und Marktbreite einen Maßstab', () => {
    expect(seite).toContain('<ZeroMeter');
    expect(seite).toContain('<RatioBar');
  });

  it('baut die Insights als Karten mit Kennzahl, nicht als Textzeilen', () => {
    // Vorher: `const insights: string[]` und eine Liste mit ▸-Zeichen.
    expect(seite).not.toMatch(/const insights: string\[\]/);
    expect(seite).toMatch(/const insights: Insight\[\]/);
    expect(seite).toContain('insight.kennzahl');
  });

  it('leitet die Insights weiterhin nur aus echten Daten ab', () => {
    // Stolperstelle 29: keine Kennzahl ohne Datengrundlage.
    expect(seite).toMatch(/if \(withTrend\.length > 0\)/);
    expect(seite).toMatch(/if \(topSets\[0\]\)/);
  });
});

describe('Die neuen Grafik-Bausteine bauen sich ebenfalls auf', () => {
  const bars = lies('src/components/DataBars.tsx');

  it.each(['ZeroMeter', 'RatioBar', 'RowBar'])('%s wächst beim Hereinscrollen', (name) => {
    const block = bars.slice(bars.indexOf(`export function ${name}`));
    expect(block.slice(0, 1600)).toContain('useInView');
    expect(block.slice(0, 1600)).toMatch(/sichtbar \?/);
  });

  it('ZeroMeter verträgt einen Wert von null ohne Division durch null', () => {
    const block = bars.slice(bars.indexOf('export function ZeroMeter'));
    expect(block.slice(0, 900)).toMatch(/Math\.max\(Math\.abs\(value\), max, 0\.01\)/);
  });

  it('RatioBar zeigt nichts, wenn es nichts zu teilen gibt', () => {
    const block = bars.slice(bars.indexOf('export function RatioBar'));
    expect(block.slice(0, 700)).toMatch(/if \(total <= 0\) return null;/);
  });
});
