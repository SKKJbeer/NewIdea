import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');
const ohneKommentare = (p: string) =>
  lies(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// BILDLAST UND LAYOUT-VERSATZ
//
// GEMESSEN am 31.07.2026 an der gebauten Anwendung:
//   Startseite  2.596 KB (davon 2.211 KB Bilder fuer ZWOELF 26-Pixel-Miniaturen)
//   /sets       2.278 KB, Layout-Versatz 0,41 — das Vierfache der Grenze
//
// Ursache war ein Muster, kein Einzelfall: Miniaturen und Set-Logos waren rohe
// <img>-Tags mit der Zwischenspeicher-Adresse des Bild-Proxys. Der Proxy
// speichert nur zwischen; er verkleinert nichts und wandelt kein Format um.
// Der Bildoptimierer kam nie zum Zug.

describe('Kleine Bilder werden auch klein geladen', () => {
  it('die Miniatur-Komponente nutzt den Bildoptimierer', () => {
    const thumb = ohneKommentare('src/components/CardThumb.tsx');
    expect(thumb).toContain("from 'next/image'");
    // Feste Masse reservieren den Platz, bevor das Bild da ist.
    expect(thumb).toMatch(/width=\{width\}/);
    expect(thumb).toMatch(/height=\{height\}/);
  });

  it('gibt dem Optimierer die ROHE Quelladresse, nicht die des Proxys', () => {
    // Der Optimierer lehnt lokale Proxy-Adressen mit verschachtelter Abfrage
    // mit HTTP 400 ab — das hat hier schon einmal ein Kartenbild verschwinden
    // lassen (Stolperstelle 18).
    const thumb = ohneKommentare('src/components/CardThumb.tsx');
    expect(thumb).not.toContain('cachedImg');
  });

  it('Bewegungen, Suche und Sammlung nutzen die Komponente', () => {
    for (const datei of [
      'src/components/MarketModules.tsx',
      'src/components/SearchResultRows.tsx',
      'src/components/CollectionGallery.tsx',
    ]) {
      const q = ohneKommentare(datei);
      expect(q, datei).toContain('CardThumb');
      // Kein rohes <img src={cachedImg(...)}> mehr in diesen Listen.
      expect(q, datei).not.toMatch(/<img[\s\S]{0,120}cachedImg/);
    }
  });

  it('Set-Logos laufen ebenfalls ueber den Optimierer und reservieren Platz', () => {
    // Ohne feste Masse waechst die Zeile, sobald jedes Logo eintrifft — Logos
    // haben sehr unterschiedliche Seitenverhaeltnisse.
    const logo = ohneKommentare('src/components/BoosterPackImage.tsx');
    expect(logo).toContain("from 'next/image'");
    expect(logo).not.toContain('cachedImg');
    expect(logo).toMatch(/width=\{400\}/);
    expect(logo).toMatch(/height=\{140\}/);
  });

  it('die Rueckfallkette der Set-Logos bleibt erhalten', () => {
    // Es darf NIE ein kaputtes Bild-Icon erscheinen.
    const logo = ohneKommentare('src/components/BoosterPackImage.tsx');
    expect(logo).toContain('onError');
    expect(logo).toContain('ImageOff');
  });
});

describe('Trefferflaechen', () => {
  it('die Wortmarke ist 44 Pixel hoch anklickbar', () => {
    // Gemessen: 25 px in der Kopfzeile, 17 px im Fuss. Als Verweis auf die
    // Startseite ist sie eines der meistgenutzten Ziele ueberhaupt.
    for (const datei of ['src/components/NavBar.tsx', 'src/components/SiteFooter.tsx']) {
      const q = lies(datei);
      const stelle = q.indexOf('CardBeacon — Startseite');
      expect(stelle, datei).toBeGreaterThan(0);
      expect(q.slice(Math.max(0, stelle - 260), stelle), datei).toContain('min-h-[44px]');
    }
  });
});

describe('Die Methodik erklaert, was neu hinzugekommen ist', () => {
  const seite = lies('src/app/methodik/page.tsx');

  it('dokumentiert die Stufen der Markttemperatur', () => {
    // Bringschuld: Das Vokabular wurde eingefuehrt, ohne die Zuordnung
    // offenzulegen — bei einer Seite, deren Zweck Offenlegung ist.
    for (const stufe of ['Kalt', 'Abkühlend', 'Ruhig', 'Anziehend', 'Heiß']) {
      expect(seite, stufe).toContain(stufe);
    }
    expect(seite).toMatch(/0–24|25–39|40–59|60–74|75–100/);
  });

  it('sagt ausdruecklich, dass die Temperatur keine Bewertung ist', () => {
    expect(seite).toContain('Kalt heißt nicht schlecht');
  });

  it('erklaert Prozentpunkte als eigene Einheit', () => {
    expect(seite).toContain('Prozentpunkt');
    expect(seite).toMatch(/nicht 22,4 Prozent/);
  });

  it('nennt zu jeder neuen Kennzahl auch ihre Grenze', () => {
    // Die vierte Frage der Offenlegung: Was sagt sie NICHT?
    expect(seite).toMatch(/Was der Abstand NICHT sagt/);
    expect(seite).toMatch(/Fehlt eine Seite, entfällt der Vergleich/);
  });

  it('haelt fest, dass nur gleiche Zeitraeume verglichen werden', () => {
    expect(seite).toMatch(/30 Tage gegen 30 Tage|dreißig/);
  });
});

describe('Vorwaermen der Suche', () => {
  const cache = ohneKommentare('src/lib/search-cache.ts');
  const cron = ohneKommentare('src/app/api/cron/daily/route.ts');

  it('die Frist ist an die der Kartenseite gekoppelt', () => {
    // Waere die Suche laenger gueltig, koennten Suchliste und Kartenseite
    // unterschiedliche Preise derselben Karte zeigen.
    expect(cache).toMatch(/FRIST_SEKUNDEN = 3600/);
  });

  it('waermt nacheinander, nicht parallel', () => {
    // Der Zweck ist, die Quelle zu entlasten — nicht sie mit zwanzig
    // gleichzeitigen Abfragen zu belegen.
    expect(cache).toMatch(/for \(const b of begriffe\)/);
    expect(cache).not.toMatch(/Promise\.all\([\s\S]{0,80}begriffe/);
  });

  it('nimmt die Begriffe aus den Daten, nicht aus einer Liste im Code', () => {
    expect(cron).toContain('getHomepageCards(60)');
    expect(cron).not.toMatch(/\['Charizard', 'Pikachu'/);
  });

  it('ein Fehlschlag reisst den Cron nicht mit', () => {
    expect(cron).toMatch(/suchVorwaermungFehler/);
  });
});
