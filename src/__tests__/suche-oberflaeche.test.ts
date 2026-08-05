import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';

// BEFUNDE AUS DEM SUCH-DURCHLAUF (04.08.2026, gemessen auf 1536×900).
//
// Drei davon waren im Betrieb sichtbar:
//   1. Das Aufklappfeld war 1015 Pixel hoch (16 Treffer, kein Deckel) und lief
//      unten aus dem Bild.
//   2. Das Suchfeld stand bei 24 Pixeln, der Seiteninhalt darunter bei 64 —
//      es hing sichtbar links neben allem anderen.
//   3. Die ersten Vorschläge kamen nach 1876 ms.
//
// Zwei weitere waren nur im Code zu sehen, hätten aber falsche Treffer zeigen
// können: kein Abbruch laufender Abfragen (eine langsame frühere Antwort
// überschreibt eine neuere) und keine Tastaturbedienung.

const WURZEL = process.cwd();
const lies = (datei: string) => readFileSync(join(WURZEL, datei), 'utf8');

// Die Prüfungen unten suchen nach verbotenen Zeichenfolgen. Ohne diesen
// Schritt fänden sie sie in den ERKLÄRUNGEN darüber wieder — der Test wäre
// dann gegen sich selbst gerichtet. (Fünfter Fall dieser Art im Projekt.)
function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const box = lies('src/components/SearchBox.tsx');
const boxCode = ohneKommentare(box);
const shell = ohneKommentare(lies('src/components/AppShell.tsx'));
const route = ohneKommentare(lies('src/app/api/search/suggestions/route.ts'));

describe('Vorschlagsfeld bleibt im Bild', () => {
  it('deckelt die Höhe der Liste', () => {
    // Ohne Deckel wächst das Feld mit der Trefferzahl — bei 16 Treffern auf
    // 1015 Pixel. Alles darunter ist unerreichbar.
    expect(boxCode).toMatch(/max-h-\[min\(/);
    expect(boxCode).toContain('overflow-y-auto');
  });

  it('zeigt höchstens acht Zeilen', () => {
    expect(boxCode).toMatch(/ANZEIGE_MAX\s*=\s*8\b/);
    expect(boxCode).toContain('suggestions.slice(0, ANZEIGE_MAX)');
  });

  it('hält den Weg zur vollständigen Suche außerhalb des Rollbereichs', () => {
    // Stünde die Zeile INNERHALB der Liste, wäre sie beim Rollen weg — also
    // genau dann nicht da, wenn jemand merkt, dass acht Vorschläge zu wenig
    // sind.
    const listeEnde = boxCode.indexOf('</ul>');
    const alleErgebnisse = boxCode.indexOf('Alle Ergebnisse');
    expect(listeEnde).toBeGreaterThan(0);
    expect(alleErgebnisse).toBeGreaterThan(listeEnde);
  });
});

describe('Abruf kann keine veraltete Antwort anzeigen', () => {
  it('bricht die vorherige Abfrage ab', () => {
    expect(boxCode).toContain('AbortController');
    expect(boxCode).toMatch(/signal:\s*controller\.signal/);
  });

  it('verwirft eine Antwort, die den Abbruch überholt hat', () => {
    expect(boxCode).toContain('controller.signal.aborted');
  });

  it('verschluckt echte Fehler nicht stumm', () => {
    // Projektregel: kein `catch {}` um einen Netzaufruf. Ein abgebrochener
    // Abruf ist der Normalfall und wird unterschieden, alles andere geht ins
    // Log.
    expect(boxCode).toContain("'AbortError'");
    expect(boxCode).toContain('console.warn');
  });
});

describe('Wartezeit ist gemessen, nicht geraten', () => {
  it('wartet höchstens 200 ms nach dem letzten Anschlag', () => {
    const treffer = boxCode.match(/WARTE_MS\s*=\s*(\d+)/);
    expect(treffer).not.toBeNull();
    expect(Number(treffer![1])).toBeLessThanOrEqual(200);
  });

  it('beantwortet Verlängerungen eines bekannten Begriffs ohne Netzweg', () => {
    // „char" → „chari" ist eine Teilmenge der bereits geholten Liste. Ohne
    // diesen Weg zahlt jeder weitere Buchstabe erneut den vollen Netzweg.
    expect(boxCode).toContain('function ausSpeicher');
    expect(boxCode).toMatch(/q\.slice\(0, i\)/);
  });

  it('lässt Preise im Browser-Speicher nicht veralten', () => {
    // Die Liste enthält Preise. Der serverseitige Speicher hält eine Stunde,
    // gekoppelt an die Kartenseite; ein unbefristeter Speicher im Browser
    // würde denselben Widerspruch wieder erzeugen.
    const treffer = boxCode.match(/FRIST_MS\s*=\s*(\d+)\s*\*\s*60\s*\*\s*1000/);
    expect(treffer).not.toBeNull();
    expect(Number(treffer![1])).toBeLessThanOrEqual(60);
  });
});

describe('Bedienung ohne Maus', () => {
  it('führt mit den Pfeiltasten durch die Vorschläge', () => {
    expect(boxCode).toContain("'ArrowDown'");
    expect(boxCode).toContain("'ArrowUp'");
  });

  it('meldet die ausgewählte Zeile an Hilfstechnik', () => {
    expect(boxCode).toContain('aria-activedescendant');
    expect(boxCode).toContain('role="combobox"');
    expect(boxCode).toContain('aria-selected');
  });

  it('macht die Auswahl auch ohne Mauszeiger sichtbar', () => {
    // Der reine Zeiger-Ton (`hover:bg-…`) reicht nicht: Bei Tastaturbedienung
    // gibt es keinen Zeiger.
    expect(boxCode).toContain('shadow-[inset_2px_0_0_0_#8b5cf6]');
  });
});

describe('Breite bestimmt die aufrufende Seite', () => {
  it('bringt keine eigene Maximalbreite mit', () => {
    // `max-w-xl mx-auto` in der Komponente stand im Widerspruch zu jedem
    // Aufrufer, der eine andere Breite vorgibt — die Kopfleiste gibt 640 vor.
    const wurzel = boxCode.match(/<div ref=\{wrapperRef\} className="([^"]+)"/);
    expect(wurzel).not.toBeNull();
    expect(wurzel![1]).not.toMatch(/max-w-/);
    expect(wurzel![1]).not.toContain('mx-auto');
  });

  it('richtet die Kopfleiste an den Innenabständen des Seiteninhalts aus', () => {
    // Der Seiteninhalt darunter nutzt px-6 sm:px-10 lg:px-14 xl:px-16.
    // Weicht die Leiste davon ab, hängt das Suchfeld neben allem anderen.
    expect(shell).toMatch(/px-6[^"]*sm:px-10[^"]*lg:px-14[^"]*xl:px-16/);
  });
});

describe('Kopfleiste steht genau einmal', () => {
  // GEFUNDEN beim Nachmessen der Suche auf 390 Pixel: Die Seite trug ZWEI
  // identische Kopfleisten uebereinander. Die Huelle bringt seit v5.5.0 eine
  // mit (`lg:hidden`), jede der achtzehn Seiten brachte weiterhin ihre eigene.
  // Auf dem Telefon kostete das rund sechzig Pixel Hoehe an der wertvollsten
  // Stelle der Seite — und es sah aus wie ein Fehler, weil es einer war.
  it('wird von keiner Seite selbst gerendert', () => {
    const seiten = globSync('src/app/**/page.tsx', { cwd: WURZEL });
    expect(seiten.length).toBeGreaterThan(10);
    const doppelt = seiten.filter((d) => /<NavBar\s*\/>/.test(lies(d)));
    expect(doppelt).toEqual([]);
  });

  it('steht in der Huelle und nur dort', () => {
    expect(lies('src/components/AppShell.tsx')).toContain('<NavBar />');
  });

  it('wird von keinem Ladezustand wiederholt oder angedeutet', () => {
    // Eine Ebene tiefer derselbe Fehler. Die Lade-Umrisse liegen INNERHALB der
    // Ladegrenze, die Navigation liegt ausserhalb davon — sie verschwindet
    // beim Navigieren gar nicht. Ein Umriss, der sie nachzeichnet (grauer
    // Streifen) oder sie sogar echt rendert, legt sie ein zweites Mal unter
    // die erste.
    const umrisse = [
      ...globSync('src/app/**/loading.tsx', { cwd: WURZEL }),
      'src/components/RouteSkeleton.tsx',
    ];
    expect(umrisse.length).toBeGreaterThan(2);
    for (const datei of umrisse) {
      const src = ohneKommentare(lies(datei));
      expect(src, `${datei} rendert die Navigation erneut`).not.toContain('<NavBar');
      expect(src, `${datei} deutet eine Kopfleiste an`).not.toMatch(/sticky top-0/);
    }
  });
});

describe('Vorschlagsroute begrenzt, was sie herausgibt', () => {
  it('deckelt die angeforderte Menge', () => {
    // Ohne Deckel wäre `?n=5000` ein Weg, über die Vorschlagsroute die halbe
    // Datenbank abzuziehen.
    expect(route).toMatch(/N_MAX\s*=\s*20\b/);
    expect(route).toContain('Math.min(Math.max(n, N_MIN), N_MAX)');
  });

  it('fällt bei unbrauchbarer Angabe auf den Höchstwert zurück', () => {
    expect(route).toContain('Number.isFinite(n)');
  });
});
