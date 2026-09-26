import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { rosette, spiro } from '@/lib/foil-art';

const WURZEL = process.cwd();
const lies = (d: string) => readFileSync(join(WURZEL, d), 'utf8');

/**
 * Kommentare entfernen, bevor nach verbotenen Zeichenfolgen gesucht wird.
 *
 * SECHSTER FALL DIESER ART im Projekt: Die Pruefung „kein `Math.random`" fand
 * den Ausdruck in der ERKLAERUNG darueber, die genau begruendet, warum es ihn
 * nicht geben darf. Der Test war damit gegen sich selbst gerichtet.
 */
function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('Das Hintergrund-Artwork wird berechnet, nicht gezeichnet', () => {
  // BEFUND: Das vorherige Artwork war ein Drachenkopf aus von Hand gesetzten
  // Bezier-Punkten — „sieht aus wie von einem Kind gemalt". Das lag an der
  // Technik, nicht an der Muehe: Anatomie als Zahlenreihe in einer Datei ergibt
  // Striche. Eine Guilloche entsteht dagegen aus Interferenz und kann gar nicht
  // kindlich wirken, weil keine Hand sie setzt.
  it('das von Hand gezeichnete Artwork ist weg und kommt nicht zurueck', () => {
    expect(existsSync(join(WURZEL, 'src/lib/mythic-art.ts'))).toBe(false);
    const hero = lies('src/components/HeroAtmosphere.tsx');
    expect(ohneKommentare(hero)).not.toContain('MYTHIC');
  });

  it('erzeugt aus denselben Eingaben dasselbe Bild', () => {
    // Ohne das flackerte der Hintergrund bei jedem Seitenaufbau. Kein
    // `Math.random()` im Generator.
    const a = rosette({ cx: 100, cy: 100, radius: 80, zacken: 7, tiefe: 0.3, linien: 4, schritte: 40 });
    const b = rosette({ cx: 100, cy: 100, radius: 80, zacken: 7, tiefe: 0.3, linien: 4, schritte: 40 });
    expect(a).toEqual(b);
    expect(ohneKommentare(lies('src/lib/foil-art.ts'))).not.toContain('Math.random');
  });

  it('liefert geschlossene Rosettenlinien in der bestellten Zahl', () => {
    const r = rosette({ cx: 0, cy: 0, radius: 50, zacken: 5, tiefe: 0.2, linien: 6, schritte: 30 });
    expect(r).toHaveLength(6);
    for (const d of r) {
      expect(d.startsWith('M ')).toBe(true);
      // Geschlossen — sonst ist es ein Strich, keine Figur.
      expect(d.endsWith(' Z')).toBe(true);
    }
  });

  it('bleibt innerhalb des gezeichneten Radius', () => {
    // Eine Rosette, die ueber ihren Radius hinauslaeuft, sprengt die Maske und
    // erzeugt harte Kanten am Bildrand.
    const [d] = rosette({ cx: 0, cy: 0, radius: 100, zacken: 6, tiefe: 0.25, linien: 1, schritte: 200 });
    const zahlen = d.match(/-?\d+\.\d+/g)!.map(Number);
    for (let i = 0; i < zahlen.length; i += 2) {
      expect(Math.hypot(zahlen[i], zahlen[i + 1])).toBeLessThanOrEqual(100.01);
    }
  });

  it('die Spirographen-Figur ist ein durchgehender Zug', () => {
    const d = spiro({ cx: 0, cy: 0, R: 90, r: 23, d: 40, umlaeufe: 3, schritte: 120 });
    expect((d.match(/M /g) ?? []).length).toBe(1);
  });
});

describe('Die Folie belastet die Seitenantwort nicht', () => {
  // Die Rosette besteht aus zehntausenden Koordinaten. Im Markup wuerde sie die
  // Seitenantwort vervielfachen — doppelt sogar, weil Next die Struktur
  // zusaetzlich als RSC-Nutzlast mitschickt. Kurz zuvor war die Startseite
  // gerade erst entlastet worden (v6.2.0); das hier waere der Rueckschritt.
  it('liegt als eigene Datei vor, nicht im Markup', () => {
    const hero = lies('src/components/HeroAtmosphere.tsx');
    expect(hero).toContain('/hintergrund-folie.svg');
    expect(ohneKommentare(hero)).not.toMatch(/<path\s+d=/);
    expect(existsSync(join(WURZEL, 'public/hintergrund-folie.svg'))).toBe(true);
  });

  it('bleibt unter dem Gewichtsdeckel', () => {
    // 150 KB roh sind rund 55 KB ueber die Leitung — vertretbar fuer eine
    // Datei, die einmal laedt und dann zwischengespeichert bleibt. Wer die
    // Parameter aufdreht, merkt es hier und nicht erst am Ladebalken.
    const kb = statSync(join(WURZEL, 'public/hintergrund-folie.svg')).size / 1024;
    expect(kb).toBeLessThan(150);
  });

  it('der Generator ist mitgeliefert, damit die Datei nachvollziehbar bleibt', () => {
    // Eine erzeugte Datei ohne ihren Generator ist ein Fundstueck: Niemand
    // kann sie spaeter aendern, ohne sie neu zu erfinden.
    expect(existsSync(join(WURZEL, 'scripts/folie-erzeugen.mts'))).toBe(true);
    expect(JSON.parse(lies('package.json')).scripts.folie).toContain('folie-erzeugen');
  });
});

describe('Suchfeld steht genau einmal auf der Seite', () => {
  // GEMESSEN am 26.09.2026 auf 1536 px: Auf `/suche` und `/einsteiger` standen
  // ZWEI sichtbare Suchfelder — eines bei y=20 (Kopfleiste), eines bei y≈274
  // (Seitenkopf). Die Kopfleiste steht auf jeder Seite; Seiten mit eigenem Feld
  // bekamen dadurch zwei.
  const topbar = lies('src/components/TopbarSearch.tsx');

  it('die Kopfleiste weicht auf Seiten mit eigenem Feld', () => {
    expect(topbar).toContain("'/suche'");
    expect(topbar).toContain("'/einsteiger'");
    expect(topbar).toContain('usePathname');
  });

  it('die Huelle rendert das Feld nur ueber diesen Umweg', () => {
    // Direkt eingebunden waere die Ausnahme wirkungslos.
    const huelle = lies('src/components/AppShell.tsx');
    expect(huelle).toContain('<TopbarSearch />');
    expect(huelle).not.toContain('<SearchBox');
  });

  it('jede Seite mit eigenem Feld steht in der Liste', () => {
    // Kommt eine dritte Seite mit eigenem Suchfeld dazu, schlaegt das hier an —
    // sonst faellt die Dopplung erst wieder jemandem im Betrieb auf.
    const seiten = ['src/app/suche/page.tsx', 'src/app/einsteiger/page.tsx'];
    for (const s of seiten) {
      const route = '/' + s.replace('src/app/', '').replace('/page.tsx', '');
      expect(lies(s)).toContain('<SearchBox');
      expect(topbar, `${route} fehlt in TopbarSearch`).toContain(`'${route}'`);
    }
  });
});
