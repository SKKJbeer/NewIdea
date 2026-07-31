import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');

/**
 * Quelltext ohne Kommentare.
 *
 * Noetig, weil die Begruendungen die verbotenen Muster beim Namen nennen —
 * genau das sollen sie ja. Ein Test, der ueber seinen eigenen Kommentar
 * stolpert, hat das schon dreimal in diesem Projekt getan.
 */
const ohneKommentare = (p: string) =>
  lies(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// SUCHE UND SAMMLUNG
//
// Zwei Flaechen, auf denen ein Sammler die meiste Zeit verbringt. Beide hatten
// dasselbe Grundproblem: Sie zeigten Karten, aber keinen Marktbezug — und an
// mehreren Stellen eine fehlende Messung als Null.

describe('Suchergebnisse vergleichen statt katalogisieren', () => {
  const rows = lies('src/components/SearchResultRows.tsx');
  const seite = lies('src/app/suche/page.tsx');

  it('zeigt den Abstand zum Markt in derselben Zeile', () => {
    // Das unterscheidet eine Suche mit Marktkontext von einer Preisabfrage.
    expect(rows).toMatch(/trend - cbi/);
    expect(rows).toContain('formatPp(gegenMarkt)');
  });

  it('holt den Indexwert aus der gespeicherten Zeile statt 250 Karten', () => {
    // Genau dafuer wurde der Tagesstand in die Datenbank gelegt.
    expect(seite).toContain('getMarketBenchmark()');
    expect(seite).not.toContain('getHomepageCards');
  });

  it('laesst die Spalte leer, wenn der Index fehlt', () => {
    expect(seite).toMatch(/getMarketBenchmark\(\)\.catch\(\(\) => null\)/);
    expect(rows).toMatch(/gegenMarkt === null \? '—'/);
  });

  it('unterscheidet „keine Bewegung" von „nicht gemessen"', () => {
    expect(rows).toContain('hasRealTrend(card)');
    expect(rows).toMatch(/trend === null \? '—'/);
    expect(rows).not.toMatch(/trendPercent \|\| 0/);
  });

  it('nutzt das echte Kartenformat', () => {
    expect(rows).toContain('aspect-[63/88]');
    expect(rows).not.toContain('aspect-[3/4]');
  });

  it('ist mit der Tastatur bedienbar', () => {
    // Zeilen sind Links (natuerliche Tab-Reihenfolge) mit sichtbarem Fokus.
    expect(rows).toContain('focus-visible:outline');
  });
});

describe('Das Kartenraster behauptet keine Messung', () => {
  const grid = ohneKommentare('src/components/CardGrid.tsx');

  it('rechnet eine fehlende Messung nicht auf null Prozent', () => {
    // `card.trendPercent || 0` wies jede ungemessene Karte als „0,0 %" aus —
    // optisch nicht von einer wirklich unbewegten Karte zu unterscheiden.
    expect(grid).not.toMatch(/trendPercent \|\| 0/);
    expect(grid).toContain('hasRealTrend(card)');
  });

  it('zeigt keine unerklaerte Bewertung auf jeder Kachel', () => {
    // Eine farbcodierte Zahl ohne Erklaerung liest sich als Kauf-Ampel.
    expect(grid).not.toMatch(/score >= 70/);
    expect(grid).not.toContain('Details &amp; Kaufen');
  });

  it('nutzt das echte Kartenformat', () => {
    expect(grid).not.toContain('aspect-[3/4]');
    expect(grid).toContain('aspect-[63/88]');
  });

  it('schreibt Leerstellen auf Deutsch', () => {
    expect(grid).not.toContain("'N/A'");
  });
});

describe('Sammlungsansicht', () => {
  const galerie = lies('src/components/CollectionGallery.tsx');
  const seite = lies('src/app/portfolio/page.tsx');

  it('ist keine nachgebaute Sammelmappe', () => {
    // Ringe, Seitenraender und Umblaettern sehen auf einem Telefon immer nach
    // Spielzeug aus — und waeren die Anmutung eines anderen Produkts.
    // Kein `ring` in der Suche: Das ist eine Tailwind-Klasse fuer eine
    // Umrandung und hat mit Sammelmappen nichts zu tun. Ein Test, der ueber
    // ein Wort stolpert statt ueber eine Sache, misst nichts.
    expect(galerie).not.toMatch(/\bbinder\b|page-?flip|umblaett|skeuomorph|sammelmappe(?!\s+mit)/i);
  });

  it('fuehrt von der Sammlung zurueck in den Marktkontext', () => {
    // Sammlung → Karte → Markt. Ohne diesen Weg waere die Galerie nur Deko.
    expect(galerie).toMatch(/href=\{`\/karten\/\$\{h\.cardId\}`\}/);
  });

  it('zeigt ohne Live-Preis einen Strich statt einer Nullbewegung', () => {
    expect(galerie).toContain('hasLivePrice(h, liveData)');
    expect(galerie).toMatch(/bewegung === null \? '—'/);
  });

  it('sortiert ungemessene Karten ans Ende', () => {
    expect(galerie).toMatch(/if \(x === null\) return 1;/);
  });

  it('ist als zweite Sicht neben der Auswertung erreichbar', () => {
    expect(seite).toContain('CollectionGallery');
    expect(seite).toMatch(/setAnsicht\('sammlung'\)|setAnsicht\(wert\)/);
    expect(seite).toContain("'auswertung' | 'sammlung'");
  });
});
