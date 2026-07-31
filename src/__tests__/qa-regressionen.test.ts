import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';
import { APP_VERSION } from '@/lib/app-version';

// Befunde aus dem systematischen Durchlauf über 14 Seiten × 5 Breiten
// (375/390/430/768/1280). Jeder Befund bekommt hier eine Prüfung, damit er
// nicht unbemerkt zurückkehrt.

const WURZEL = process.cwd();
const lies = (datei: string) => readFileSync(join(WURZEL, datei), 'utf8');

describe('Bild-Hosts: Proxy-Liste und Richtlinie passen zusammen', () => {
  const proxy = lies('src/lib/cached-image.ts');
  const route = lies('src/app/api/img/route.ts');

  it('kennt den Host der neueren Set-Logos', () => {
    // Auf /sets blieben vier Logos leer: Die Kartendatenbank liefert sie von
    // images.scrydex.com, und die Inhaltsrichtlinie blockierte den Fremdhost.
    expect(proxy).toContain('images.scrydex.com');
    expect(route).toContain('images.scrydex.com');
  });

  it('führt in beiden Dateien dieselben Hosts', () => {
    // Stimmen sie nicht überein, erzeugt die eine Seite Proxy-URLs, die die
    // andere ablehnt — das Bild bleibt leer, ohne dass jemand etwas merkt.
    const hosts = (src: string) =>
      [...src.matchAll(/'([a-z0-9.-]+\.(?:io|com))'/g)].map((m) => m[1]).sort();
    expect(hosts(proxy)).toEqual(hosts(route));
  });

  it('weicht die Inhaltsrichtlinie nicht auf', () => {
    // Der Proxy löst das Problem als gleiche Herkunft. Die Richtlinie darf
    // deshalb so eng bleiben wie bisher.
    expect(lies('next.config.ts')).not.toContain('scrydex');
  });
});

describe('Navigation ordnet, statt aufzuzählen', () => {
  const nav = lies('src/components/NavBar.tsx');

  it('führt fünf Ziele, nicht acht', () => {
    // Vorher standen Einsteiger, Suche, Sets, Marktbericht, Blog, Guides,
    // Merkliste und Portfolio gleichrangig nebeneinander. Acht Punkte sind
    // keine Ordnung, sondern ein Inhaltsverzeichnis — und bei 768 px ragte die
    // Leiste über den Rand.
    const eintraege = [...nav.matchAll(/\{ href: '[^']+', label: '[^']+' \}/g)];
    expect(eintraege).toHaveLength(5);
  });

  it('führt die interne Studio-Seite gar nicht mehr', () => {
    expect(nav).not.toContain('/studio');
  });

  it('zeigt den aktiven Punkt mit einer Linie, nicht mit einer Pille', () => {
    // DESIGN.md §4: `rounded-full` ist Punkten vorbehalten.
    expect(nav).toContain('after:h-px');
    expect(nav).not.toContain('rounded-full');
  });
});

describe('Tippziele erreichen Fingergröße', () => {
  it.each([
    ['src/components/LangPicker.tsx', 'Sprachauswahl'],
    ['src/components/SiteFooter.tsx', 'Footer-Links'],
    ['src/components/AffiliateBar.tsx', 'Partner-Links'],
    ['src/components/NavBar.tsx', 'Kopfzeilen-Links'],
  ])('%s hat eine Mindesthöhe (%s)', (datei) => {
    // Entweder eine ausdrückliche Mindesthöhe oder eine feste Höhe ab 44 px
    // (h-11 = 44 px) — die Vorgabe für Tippziele auf Berührungsbildschirmen.
    const src = lies(datei);
    const hoehe = /min-h-\[(3[26]|4[48])px\]/.test(src) || /\bh-1[12]\b/.test(src);
    expect(hoehe, `${datei}: keine Mindesthöhe für Tippziele`).toBe(true);
  });
});

describe('Ein Trend von genau null ist neutral', () => {
  it('die zentrale Farbregel färbt 0 nicht rot', () => {
    // Vorher: `trend >= 0 ? gruen : rot` an mehreren Stellen — jede
    // unveränderte Karte war rot. Die Regel steht jetzt einmal in `ui.ts`.
    const ui = lies('src/lib/ui.ts');
    expect(ui).toContain('if (value > 0)');
    expect(ui).toContain('if (value < 0)');
    // Und fehlende Messung ist noch einmal etwas anderes als null.
    expect(ui).toMatch(/value === null \|\| value === undefined/);
  });

  it('CardGrid nutzt weiterhin keine >= 0-Abkürzung', () => {
    expect(lies('src/components/CardGrid.tsx')).not.toMatch(/const (up|isPositive) = trend >= 0;/);
  });
});

describe('Das Diagramm lädt erst, wenn es gebraucht wird', () => {
  const lazy = lies('src/components/PriceChartLazy.tsx');

  it('lädt die Diagramm-Bibliothek nach', () => {
    // Die Kartenseite lud rund 659 kB JavaScript; der größte Teil war die
    // Diagramm-Bibliothek im ersten Bündel.
    expect(lazy).toContain('dynamic(');
    expect(lazy).toContain("ssr: false");
  });

  it('hält die Höhe frei, damit nichts springt', () => {
    // Ohne gleich hohen Platzhalter wäre der gemessene Wert für
    // Layoutverschiebung (0) sofort dahin.
    expect(lazy).toMatch(/h-\[200px\]/);
  });

  it('die Kartenseite nutzt die nachladende Fassung', () => {
    const seite = lies('src/app/karten/[id]/page.tsx');
    expect(seite).toContain('PriceChartLazy');
    expect(seite).not.toMatch(/import \{ PriceChart \} from/);
  });
});

describe('Die Startseite führt durch die Produktlogik', () => {
  const seite = lies('src/app/page.tsx');

  // Neue Reihenfolge: Markt → Einordnung → Bewegungen → Set-Markt → Bestand →
  // Research. Erst der Markt, dann seine Teile, dann der eigene Bestand.
  const REIHENFOLGE = [
    '<MarketHeader',
    'aria-labelledby="einordnung"',
    'aria-labelledby="bewegungen"',
    'aria-labelledby="setmarkt"',
    'aria-labelledby="bestand"',
    'aria-labelledby="research"',
  ];

  it('beginnt mit dem Marktstand, nicht mit einem Suchfeld', () => {
    // Der Blickfang war ein leeres Eingabefeld. Die erste Aussage der Seite
    // ist jetzt der Marktstand; die Suche steht in der Kopfzeile.
    expect(seite.indexOf('<MarketHeader')).toBeGreaterThan(0);
    expect(seite).not.toContain('<SearchBox');
  });

  it('hält die Abschnitte in der Produktreihenfolge', () => {
    const positionen = REIHENFOLGE.map((m) => seite.indexOf(m));
    expect(positionen.every((p) => p > 0), REIHENFOLGE.join(', ')).toBe(true);
    expect([...positionen].sort((a, b) => a - b)).toEqual(positionen);
  });

  it('bleibt bei sechs Abschnitten', () => {
    // Zehn Abschnitte waren der Grund, warum keiner wichtig aussah.
    const abschnitte = (seite.match(/<section aria-labelledby=/g) ?? []).length;
    expect(abschnitte).toBeLessThanOrEqual(6);
  });
});

describe('Die Fußzeile zeigt in Produktion eine Version', () => {
  const footer = lies('src/components/SiteFooter.tsx');

  it('die Konstante stimmt mit package.json überein', () => {
    // DER EIGENTLICHE ZWECK DIESES TESTS: Er ist der Preis dafür, dass die
    // Version als Konstante im Code steht. Wird beim Versionssprung nur
    // package.json angefasst, bricht hier der Build — und nicht erst die
    // Live-Seite, auf der es monatelang niemandem auffiel.
    expect(APP_VERSION).toBe(JSON.parse(lies('package.json')).version);
  });

  it('kommt ohne Umgebungsvariable aus', () => {
    // BEFUND: Live stand in der Fußzeile ein nacktes „v" ohne Nummer. Damit war
    // der Pflicht-Schritt „Live-Seite verifizieren: Fußzeile zeigt vX.Y.Z" auf
    // Produktion nie durchführbar. Zwei Wege über die Umgebung sind lautlos
    // gescheitert (npm_package_version; `env` in next.config.ts) — beide sahen
    // im Code korrekt aus und lieferten nichts.
    expect(footer).toContain('v{APP_VERSION}');
    expect(footer).not.toContain('process.env.');
  });
});

describe('Ein Aussetzer der Kartendatenbank bricht nicht das Deployment', () => {
  const seite = lies('src/app/sets/page.tsx');

  it('fängt den Fehler nur während des Builds ab', () => {
    // Der Abruf soll zur LAUFZEIT durchschlagen (dann behält Next.js die
    // zuletzt erfolgreiche Seite). Während des Builds gibt es keine solche
    // Seite — dort brach ein einzelner Aussetzer den gesamten Export ab und
    // hätte alle übrigen Änderungen mit blockiert.
    expect(seite).toContain("process.env.NEXT_PHASE === 'phase-production-build'");
    expect(seite).toContain('throw err;');
  });

  it('schluckt den Fehler nicht pauschal', () => {
    // `.catch(() => [])` hätte den Leerzustand einen ganzen Tag gecacht.
    expect(seite).not.toMatch(/fetchRecentSets\([^)]*\)\.catch\(\(\) => \[\]\)/);
  });
});

describe('Anzeige-Begrenzungen fließen in keine Kennzahl', () => {
  const seite = lies('src/app/page.tsx');

  it('die Marktbreite kommt aus der geteilten Zählung', () => {
    // Vorher: Zähler aus `splitMovers(cards, 8).gainers.length` (bei acht
    // gekappt), Nenner aus dem vollen Datensatz. Ergebnis waren zwei
    // verschiedene Marktbreiten auf derselben Seite: „8/50" und „16 von 50".
    expect(seite).toContain('marketBreadth(');
    expect(seite).not.toMatch(/gainCount/);
  });

  it('die gekürzten Listen dienen nur der Anzeige', () => {
    // `gainers`/`losers` dürfen nur noch in Bedingungen und beim Ausgeben
    // vorkommen — nie als Zähler einer Quote.
    expect(seite).not.toMatch(/\((?:gainers|losers)\.length\s*\/\s*/);
  });
});

describe('Jede Seite hat einen Titel und eine Beschreibung', () => {
  it('keine Seite ohne Metadaten', () => {
    const ohne: string[] = [];
    for (const datei of globSync('src/app/**/page.tsx', { cwd: WURZEL })) {
      // Interne Seiten brauchen keine Suchmaschinen-Metadaten.
      if (/studio|monitoring/.test(datei)) continue;
      const src = lies(datei);
      if (/export const metadata|export async function generateMetadata/.test(src)) continue;
      // Client-Komponenten können keine Metadaten exportieren — dann muss ein
      // `layout.tsx` daneben liegen, das sie trägt.
      const layout = datei.replace(/page\.tsx$/, 'layout.tsx');
      try {
        if (/export const metadata/.test(lies(layout))) continue;
      } catch {
        // catch erlaubt: kein Layout vorhanden — zählt als fehlend.
      }
      ohne.push(datei);
    }
    expect(ohne, `Seiten ohne Metadaten:\n${ohne.join('\n')}`).toEqual([]);
  });
});
