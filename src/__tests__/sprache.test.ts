import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';

// ANLASS: Die Live-Seite versprach im selben Atemzug „Pokémon Kartenmarkt in
// Echtzeit" und „Cardmarket-Preise · täglich aktualisiert". Beides kann nicht
// stimmen. Die Preisquelle liefert einen täglich aktualisierten Stand — bei
// vielen Karten sogar älter. „Echtzeit" ist damit ein Versprechen, das die
// Daten nicht halten, und es untergräbt genau die Glaubwürdigkeit, für die es
// eingesetzt wurde.

const WURZEL = process.cwd();
const lies = (datei: string) => readFileSync(join(WURZEL, datei), 'utf8');

/** Alle Dateien, die sichtbaren Text erzeugen — ohne Tests. */
function quellen(): string[] {
  return globSync('src/**/*.{ts,tsx}', { cwd: WURZEL }).filter((f) => !f.includes('__tests__'));
}

/**
 * Entfernt Kommentare, bevor gesucht wird.
 *
 * Zeilenweise zu prüfen reicht nicht: Ein Blockkommentar über mehrere Zeilen
 * beginnt nur in der ERSTEN Zeile mit einem Kommentarzeichen. Genau dort
 * schlug die Prüfung zuerst an — auf Kommentaren, die den behobenen Befund
 * beschreiben. Die gehören ausdrücklich in den Code.
 */
function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('Kein Versprechen von Echtzeit-Daten', () => {
  const verboten = /Echtzeit|Realtime|Real-Time|Live-Daten/;

  it('kommt in keiner Quelldatei vor', () => {
    const treffer: string[] = [];
    for (const datei of quellen()) {
      for (const zeile of ohneKommentare(lies(datei)).split('\n')) {
        if (verboten.test(zeile)) treffer.push(`${datei}  ${zeile.trim().slice(0, 90)}`);
      }
    }
    expect(treffer, `„Echtzeit" ohne Echtzeit-Daten:\n${treffer.join('\n')}`).toEqual([]);
  });

  it('die Startseite sagt stattdessen, was zutrifft', () => {
    const seite = lies('src/app/page.tsx');
    expect(seite).toContain('datenbasiert verstehen');
    expect(seite).toContain('auf Basis aktueller Cardmarket-Daten');
    // Der Hinweis auf die tägliche Aktualisierung bleibt — er ist die Wahrheit.
    expect(seite).toContain('täglich aktualisiert');
  });
});

describe('Positionierung: Marktanalyse statt Anlage-Vokabular', () => {
  it('keine Investment-Begriffe in sichtbaren Texten', () => {
    // Die Plattform analysiert einen Markt; sie berät nicht bei Geldanlagen.
    // „Investment-Score" und „Investor Insights" lasen sich wie das Gegenteil.
    const treffer: string[] = [];
    for (const datei of quellen()) {
      // Der Verlauf hält fest, was ausgeliefert wurde — er wird nicht umgeschrieben.
      if (datei.includes('changelog')) continue;
      for (const zeile of ohneKommentare(lies(datei)).split('\n')) {
        // Interne Bezeichner bleiben — ein Datenfeld umzubenennen wäre eine
        // Umbaumaßnahme ohne sichtbaren Nutzen.
        const ohneBezeichner = zeile.replace(/investmentScore|calculateInvestmentScore|card_investment_score/g, '');
        if (/Investment|Investor/.test(ohneBezeichner)) {
          treffer.push(`${datei}  ${zeile.trim().slice(0, 90)}`);
        }
      }
    }
    expect(treffer, `Anlage-Vokabular in sichtbarem Text:\n${treffer.join('\n')}`).toEqual([]);
  });

  it('der Score bleibt als Marktkennzahl erklärt, nicht als Empfehlung', () => {
    // Die Umbenennung darf den Haftungshinweis nicht verlieren.
    const panel = lies('src/components/CardMetricPanels.tsx');
    expect(panel).toContain('keine Anlageberatung');
  });

  it('ändert keine Adressen', () => {
    // Umbenennen von Begriffen darf keine URL kosten — jede geänderte Adresse
    // wäre ein verlorenes Suchmaschinen-Ergebnis.
    const sitemap = lies('src/app/sitemap.ts');
    for (const pfad of ['/artikel', '/guides', '/marktbericht', '/sets', '/methodik']) {
      expect(sitemap, pfad).toContain(pfad);
    }
  });
});
