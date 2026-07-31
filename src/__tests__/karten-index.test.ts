import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');
const ohneKommentare = (p: string) =>
  lies(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// EIGENER KARTENINDEX
//
// GEMESSEN: Der erste Aufruf eines Suchbegriffs kostete 6 bis 13 Sekunden, weil
// jede Suche die Kartendatenbank von aussen fragte. Zwischenspeicher helfen erst
// ab dem ZWEITEN Aufruf — der erste Besucher zahlt weiterhin voll.

describe('Die Suche fragt zuerst den eigenen Index', () => {
  const cache = ohneKommentare('src/lib/search-cache.ts');

  it('der Index kommt VOR dem Abruf von aussen', () => {
    // Im FUNKTIONSRUMPF vergleichen, nicht im ganzen Text: Die Import-Zeile
    // von `unstable_cache` steht ganz oben und wuerde jeden Vergleich gewinnen.
    const rumpf = cache.slice(cache.indexOf('export async function cachedSearchCards'));
    const vorIndex = rumpf.indexOf('searchCardIndex');
    const vorAussen = rumpf.indexOf('unstable_cache(');
    expect(vorIndex).toBeGreaterThan(0);
    expect(vorAussen).toBeGreaterThan(0);
    expect(vorIndex).toBeLessThan(vorAussen);
  });

  it('der Abruf von aussen bleibt als Rueckfall bestehen', () => {
    // Der Index kennt nicht jeden Begriff — vor allem nicht, solange der
    // Durchlauf noch nicht durch ist.
    expect(cache).toContain('searchCards(normalisiert, limit)');
  });

  it('ein Fehler im Index laesst die Suche weiterlaufen', () => {
    expect(cache).toMatch(/searchCardIndex\(normalisiert, limit\)\.catch\(\(\) => \[\]\)/);
  });
});

describe('Der Index entsteht ohne zusaetzliche Abrufe', () => {
  const sweep = ohneKommentare('src/lib/price-sweep.ts');

  it('wird vom taeglichen Durchlauf nebenbei gefuellt', () => {
    // Die Seite ist ohnehin geholt; ihre Karten wegzuwerfen war die Ursache
    // der langen Wartezeiten.
    expect(sweep).toContain('upsertCardIndex(cards)');
  });

  it('ein Fehler im Index haelt den Preis-Durchlauf nicht auf', () => {
    // Der Preis ist der Pflichtteil, der Index die Zugabe.
    expect(sweep).toMatch(/upsertCardIndex\(cards\)\.catch\(/);
  });
});

describe('Der Index behauptet nichts', () => {
  const idx = ohneKommentare('src/lib/card-index.ts');

  it('nimmt nur handelbare, vollstaendige Karten auf', () => {
    // Dieselbe Regel wie in der Anzeige: Preis UND Bild.
    expect(idx).toContain('c.imageUrl');
    expect(idx).toContain("c.prices?.market ?? 0) > 0");
  });

  it('entschaerft Platzhalter in der Eingabe', () => {
    // Ohne das wuerde eine Eingabe wie „%" die ganze Tabelle zurueckgeben.
    expect(idx).toContain("replace(/[%_");
  });

  it('gibt die echte Fehlermeldung zurueck', () => {
    expect(idx).toMatch(/return error \? error\.message : null/);
  });

  it('meldet seinen Datenstand fuers Monitoring', () => {
    // Der Index ist eine Kopie, kein zweiter Wahrheitsanspruch — sein Alter
    // muss sichtbar sein.
    expect(idx).toContain('export async function cardIndexStand');
    expect(ohneKommentare('src/lib/system-health.ts')).toMatch(/table: 'cards_index'/);
  });

  it('das Anlege-SQL enthaelt die Suchindizes', () => {
    // Ohne sie durchsucht jede Anfrage die gesamte Tabelle.
    const health = lies('src/lib/system-health.ts');
    expect(health).toContain('pg_trgm');
    expect(health).toContain('gin_trgm_ops');
  });
});
