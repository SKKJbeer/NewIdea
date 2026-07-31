import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');
const ohneKommentare = (p: string) =>
  lies(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// GETEILTER ZWISCHENSPEICHER FUER DIE SUCHE
//
// GEMESSEN: Dieselbe Suche nach „charizard" brauchte in drei Laeufen
// hintereinander 7,1 s, 4,3 s und 15,7 s. Zwischen zwei identischen Anfragen
// wurde nichts wiederverwendet — der vorhandene Zwischenspeicher liegt im
// Arbeitsspeicher einer Instanz, und auf Vercel beantwortet praktisch jede
// Anfrage eine andere.

describe('Suchtreffer werden instanzuebergreifend wiederverwendet', () => {
  const cache = ohneKommentare('src/lib/search-cache.ts');

  it('nutzt den geteilten Datenspeicher, nicht nur den Arbeitsspeicher', () => {
    expect(cache).toContain('unstable_cache');
    expect(cache).toMatch(/revalidate: FRIST_SEKUNDEN/);
  });

  it('speichert KEINE leeren Ergebnisse', () => {
    // Ein einzelner Aussetzer der Quelle waere sonst zehn Minuten lang als
    // „keine Treffer" festgeschrieben — fuer alle Besucher gleichzeitig.
    // Ein Zwischenspeicher, der Fehler festhaelt, ist schlimmer als keiner.
    expect(cache).toMatch(/if \(cards\.length === 0\)[\s\S]{0,120}throw/);
  });

  it('der Schluessel unterscheidet Begriff und Anzahl', () => {
    expect(cache).toMatch(/\['suche', normalisiert, String\(limit\)\]/);
  });

  it('normalisiert den Begriff, damit Gross- und Kleinschreibung denselben Treffer findet', () => {
    expect(cache).toMatch(/query\.trim\(\)\.toLowerCase\(\)/);
  });

  it('die Suchseite und die Vorschlaege nutzen beide den Zwischenspeicher', () => {
    // Die Vorschlaege sind der meistgenutzte Weg zur Kartendatenbank ueberhaupt
    // — sie feuern nach jeder Tipp-Pause.
    for (const datei of ['src/app/suche/page.tsx', 'src/app/api/search/suggestions/route.ts']) {
      expect(ohneKommentare(datei), datei).toContain('cachedSearchCards');
    }
  });

  it('die Wiederholungen in der Quelle bleiben bestehen', () => {
    // Der Zwischenspeicher ersetzt sie nicht: Beim ERSTEN Aufruf eines Begriffs
    // gibt es nichts zu holen, und genau dort schlagen die Aussetzer zu.
    const api = ohneKommentare('src/lib/pokemon-api.ts');
    const block = api.slice(api.indexOf('export async function searchCards'));
    expect(block.slice(0, 1500)).toMatch(/retries: 3/);
  });
});

describe('Set-Markt verbindet Set und Markt', () => {
  const mod = ohneKommentare('src/components/MarketModules.tsx');
  const metrics = ohneKommentare('src/lib/market-metrics.ts');

  it('zeigt den Abstand zum Index — mit demselben Massstab wie ueberall', () => {
    expect(mod).toMatch(/\(s\.avgTrend as number\) - cbi/);
    expect(mod).toContain('formatPp(gegenMarkt)');
  });

  it('nennt die staerkste Bewegung des Sets', () => {
    // Eine Set-Zeile laesst sonst offen, ob sich das ganze Set bewegt oder
    // eine einzelne Karte.
    expect(mod).toContain('s.topMover');
    expect(mod).toContain('stärkste Bewegung');
  });

  it('waehlt die staerkste Bewegung nach BETRAG, nicht nach Gewinn', () => {
    // Nach dem groessten Gewinn zu suchen waere eine Auswahl zugunsten guter
    // Nachrichten — ein Set kann ebenso von einem Einbruch getragen sein.
    expect(metrics).toMatch(/Math\.abs\(trend\) > Math\.abs\(eintrag\.spitze\.trend\)/);
  });

  it('steht als Text da, nicht nur beim Ueberfahren', () => {
    // Auf einem Telefon gibt es kein Ueberfahren.
    expect(mod).not.toMatch(/group-hover:[^\s'"`]*\btopMover/);
  });
});
