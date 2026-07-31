import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { formatPp } from '@/lib/format';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');

// SET-BIBLIOTHEK UND BEWEGUNGEN
//
// Beide Flaechen duerfen visueller sein als die Marktuebersicht — die Grenze
// ist ueberall dieselbe: Es darf nichts dastehen, was nicht gemessen ist.

describe('Bewegungen zeigen den Abstand zum Markt', () => {
  const mod = lies('src/components/MarketModules.tsx');

  it('rechnet den Abstand in Prozentpunkten, nicht in Prozent', () => {
    // Die Differenz zweier Prozentwerte ist kein Prozentwert. Wer das
    // vermischt, rechnet falsch und merkt es nie.
    expect(mod).toMatch(/trend - cbi/);
    // Die Einheit kommt aus format.ts, nicht aus einer Zeichenkette im Bauteil.
    expect(mod).toMatch(/formatPp\(/);
  });

  it('zeigt den Abstand NUR, wenn beide Werte gemessen sind', () => {
    // Ohne Indexwert waere jede Differenz eine Rechnung gegen eine erfundene
    // Null.
    expect(mod).toMatch(/gemessen && cbi !== null \? trend - cbi : null/);
    expect(mod).toMatch(/gegenMarkt === null \? '—'/);
  });

  it('gibt der Liste eine Rangfolge', () => {
    expect(mod).toMatch(/String\(rang\)\.padStart\(2, '0'\)/);
  });

  it('haelt das Kartenbild klein', () => {
    // Grosse Kartenkacheln machen aus Marktdaten einen Katalog.
    expect(mod).toContain('THUMB');
    expect(mod).not.toMatch(/aspect-\[63\/88\]/);
  });

  it('der Folienschimmer laeuft auf jeder Zeile', () => {
    // ZURUECKGENOMMEN: Zuerst haing er an der Seltenheit — als Auskunft
    // gedacht, in der Praxis nur als Ungleichmaessigkeit wahrgenommen.
    expect(mod).toMatch(/lift foil/);
    expect(mod).not.toContain('hatFolie');
  });
});

describe('Set-Bibliothek erfindet nichts', () => {
  const bib = lies('src/components/SetLibrary.tsx');
  const seite = lies('src/app/sets/page.tsx');

  it('leitet die Epochen aus den Daten ab statt aus einer Liste im Code', () => {
    // Eine fest verdrahtete Aera-Liste waere erfundene Metadaten und veraltet
    // beim naechsten Set.
    expect(bib).toMatch(/for \(const s of sets\) if \(s\.series\)/);
    expect(bib).not.toMatch(/'Scarlet & Violet'|'Sword & Shield'|'Mega Evolution'/);
  });

  it('unterscheidet „bewegt sich nicht" von „nicht gemessen"', () => {
    expect(bib).toMatch(/set\.trend === null \? '—'/);
    expect(bib).toMatch(/keine Stichprobe/);
    // DREI Zustaende: keine Stichprobe / Stichprobe ohne gemessene Bewegung /
    // gemessen. Die erste Fassung kannte nur zwei und schrieb neben einen
    // gemessenen Medianpreis „keine Stichprobe" — ein Widerspruch im selben
    // Bildschirmbereich.
    expect(bib).toMatch(/set\.gemessen === 0/);
    expect(bib).toMatch(/Bewegung nicht gemessen/);
    // Und beim Sortieren wandern ungemessene Sets ans Ende statt als Null
    // mitten in die Rangfolge.
    expect(bib).toMatch(/const hinten = \(wert: number \| null\)/);
  });

  it('holt die Bewegung aus der gemeinsamen Stichprobe, nicht je Set einzeln', () => {
    // 24 Einzelabrufe bei einer Quelle, die regelmaessig aussetzt, waeren
    // Minuten und mehrere Fehlschlaege.
    expect(seite).toContain('getHomepageCards(250)');
    expect(seite).toContain('rankSets(');
    expect(seite).not.toMatch(/fetchCardsBySet/);
  });

  it('prueft die Marktdaten vor dem Rechnen', () => {
    expect(seite).toContain('validateMarketData');
  });

  it('ein Ausfall der Marktdaten laesst die Seite trotzdem stehen', () => {
    // Die Set-Liste ist der Zweck der Seite; die Bewegung ist die Zugabe.
    expect(seite).toMatch(/getHomepageCards\(250\)\.catch\(\(\) => \[\]\)/);
  });
});

describe('Prozentpunkte sind eine eigene Einheit', () => {
  it('formatPp haengt kein Prozentzeichen an', () => {
    // BEFUND aus dem Bildschirmfoto: In der Movers-Spalte stand „+55,9 % pp".
    // Der erste Anlauf baute den Wert als formatPercent(x).replace(' %', '') —
    // und Intl setzt vor das Prozentzeichen ein GESCHUETZTES Leerzeichen
    // (U+00A0), kein gewoehnliches. Die Ersetzung lief ins Leere.
    expect(formatPp(22.4)).not.toContain('%');
    expect(formatPp(22.4)).toBe('+22,4 pp');
    expect(formatPp(-3.05)).toBe('-3,1 pp');
    expect(formatPp(0)).toBe('0,0 pp');
  });

  it('haelt Zahl und Einheit zusammen', () => {
    // In schmalen Spalten faellt der Umbruch sonst zwischen Zahl und Einheit.
    expect(formatPp(1.2)).toContain(' ');
    expect(formatPp(1.2)).not.toMatch(/ pp$/);
  });

  it('die Movers nutzen den Formatierer statt selbst zu basteln', () => {
    const mod = lies('src/components/MarketModules.tsx');
    expect(mod).toContain('formatPp(gegenMarkt)');
    expect(mod).not.toMatch(/replace\(' %', ''\)/);
  });
});
