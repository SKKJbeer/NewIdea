import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ambientFor, AMBIENT_FALLBACK } from '@/lib/collector';
import { findViolations, CAUSAL_CLAIM, HYPOTHESIS_MARKER } from '@/lib/content-rules';
import { fearGreedLabel } from '@/lib/market-metrics';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');

// SAMMLER-EBENE — „Daten zuerst, Artwork respektiert".
//
// Das Produkt war fachlich richtig und emotional tot: ein dunkles Terminal mit
// Zahlen, austauschbar mit jedem Krypto-Dashboard. Diese Tests sichern die
// Gegenmaßnahmen ab — und vor allem ihre GRENZEN. Der Fehler in die andere
// Richtung (bunte Fan-Seite) wäre genauso schlimm.

describe('Ambient-Farbe kommt aus der Karte', () => {
  it('leitet den Ton aus dem Energietyp ab', () => {
    expect(ambientFor(['Fire']).quelle).toBe('Feuer');
    expect(ambientFor(['Water']).quelle).toBe('Wasser');
    expect(ambientFor(['Psychic']).quelle).toBe('Psycho');
  });

  it('nimmt bei Doppeltypen den ersten statt zu mischen', () => {
    // Ein gemischter Ton gehört zu keiner der beiden Karten — und die Aufgabe
    // ist Wiedererkennung, nicht Genauigkeit.
    expect(ambientFor(['Fire', 'Water'])).toEqual(ambientFor(['Fire']));
  });

  it('faellt ohne Typ auf den Markenton zurueck statt zu raten', () => {
    expect(ambientFor(undefined)).toBe(AMBIENT_FALLBACK);
    expect(ambientFor([])).toBe(AMBIENT_FALLBACK);
    expect(ambientFor(['Gibtsnicht'])).toBe(AMBIENT_FALLBACK);
  });

  it('bleibt in jedem Ton sehr schwach', () => {
    // Die Karte ist der Blickfang. Ein kraeftiger Schimmer waere Dekoration,
    // die mit dem Artwork konkurriert.
    for (const t of ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting',
                     'Darkness', 'Metal', 'Dragon', 'Fairy', 'Colorless']) {
      const deckkraft = Number(ambientFor([t]).glow.match(/\/\[0\.(\d+)\]/)?.[1] ?? '99');
      expect(deckkraft, t).toBeLessThanOrEqual(8);
    }
  });

  it('rechnet NICHT aus dem Kartenbild', () => {
    // Bildanalyse waere teuer (Bild laden, dekodieren, Pixel mitteln) und
    // unzuverlaessig (Folie liefert je nach Kompression andere Mittelwerte).
    const quelle = lies('src/lib/collector.ts');
    expect(quelle).not.toMatch(/canvas|getImageData|createImageBitmap|sharp|jimp/i);
  });
});

describe('Folienschimmer', () => {
  it('laeuft auf jedem Kartenbild', () => {
    // ZURUECKGENOMMEN: Zuerst lief er nur bei Folien-Seltenheiten, damit er
    // eine Auskunft sei statt Dekoration. Am laufenden Produkt nahm das niemand
    // als Auskunft wahr — es sah nur aus, als flimmerten manche Zeilen und
    // andere nicht.
    for (const datei of [
      'src/components/MarketModules.tsx',
      'src/components/SearchResultRows.tsx',
      'src/components/CollectionGallery.tsx',
    ]) {
      expect(lies(datei), datei).not.toContain('hatFolie');
    }
    expect(lies('src/lib/collector.ts')).not.toMatch(/export function hatFolie/);
  });

  it('laeuft nur auf Zeigerkontakt und respektiert Reduced-Motion', () => {
    const css = lies('src/app/globals.css');
    const block = css.slice(css.indexOf('FOLIENSCHIMMER'));
    // Diese Bedingungen sind KEINE Geschmacksfrage und bleiben: Ohne sie wird
    // aus einem Zitat des physischen Objekts ein Werbebanner.
    expect(block).toContain('prefers-reduced-motion: no-preference');
    expect(block).toMatch(/\.foil:hover::after/);
    expect(block).not.toMatch(/foil-sweep[^;]*infinite/);
    expect(block).not.toMatch(/hsl\(|rainbow|conic-gradient/i);
  });
});

describe('Hintergrund-Identitaet bleibt Hintergrund', () => {
  const backdrop = lies('src/components/CollectorBackdrop.tsx');

  it('ist fuer Hilfsmittel unsichtbar und nicht anklickbar', () => {
    expect(backdrop).toContain('aria-hidden');
    expect(backdrop).toContain('pointer-events-none');
  });

  it('bleibt weit unter der Lesbarkeitsgrenze', () => {
    // Vorgabe: Beim ersten Blick eine hochwertige dunkle Oberflaeche, erst beim
    // genaueren Hinsehen die Struktur.
    const deckkraefte = [...backdrop.matchAll(/opacity(?:=\{|: )([0-9.]+)/g)].map((m) => Number(m[1]));
    for (const d of deckkraefte) expect(d).toBeLessThanOrEqual(0.9);
    const flaechen = [...backdrop.matchAll(/fill-\w+-\d+\/\[0\.(\d+)\]/g)].map((m) => Number(m[1]));
    for (const f of flaechen) expect(f).toBeLessThanOrEqual(6);
  });

  it('zeichnet keine Kreaturen nach', () => {
    // Ein angedeuteter Kreatur-Umriss waere genau die Fan-Seiten-Anmutung, die
    // dieses Produkt nicht haben soll — unabhaengig von der Rechtslage.
    expect(backdrop).not.toMatch(/pokeball|pokéball|charizard|pikachu|creature-silhouette/i);
  });

  it('liegt nur im Seitenkopf, nicht ueber der ganzen Seite', () => {
    const seite = lies('src/app/page.tsx');
    expect(seite).not.toContain('CollectorBackdrop');
    expect(lies('src/components/MarketHeader.tsx')).toContain('CollectorBackdrop');
  });
});

describe('Markttemperatur statt Angst und Gier', () => {
  it('benennt Zustaende ohne Bewertung', () => {
    for (const wert of [0, 24, 25, 39, 40, 59, 60, 74, 75, 100]) {
      expect(fearGreedLabel(wert)).not.toMatch(/gier|angst|gut|schlecht|stark|schwach/i);
    }
  });

  it('die Temperaturfarbe ist keine Ampel', () => {
    // Gruen und Rot bleiben ausschliesslich der RICHTUNG von Preisen
    // vorbehalten — sonst bedeuten dieselben Farben auf einer Seite zweierlei.
    const panel = lies('src/components/FearGreedPanel.tsx');
    const farbfunktion = panel.slice(panel.indexOf('function farbeZu'), panel.indexOf('function farbeZu') + 400);
    expect(farbfunktion).not.toMatch(/#ef4444|#34d399|#86efac|#fb7185/);
  });
});

describe('Beobachtung und Deutung sind getrennt', () => {
  const behauptung = 'Team Rocket\'s Moltres ex legt zu. Der Grund liegt in der frühen Set-Phase.';
  const gekennzeichnet =
    'Team Rocket\'s Moltres ex legt zu. Eine mögliche Erklärung ist die frühe Set-Phase; historisch bewegen sich Karten dort staerker.';

  it('erkennt eine als Tatsache behauptete Ursache', () => {
    const v = findViolations([['content', behauptung]]);
    expect(v.map((x) => x.rule)).toContain('behauptete-ursache');
  });

  it('laesst dieselbe Aussage als gekennzeichnete Deutung durch', () => {
    // Ohne diese Ausnahme wuerde die Regel genau die Formulierung bestrafen, zu
    // der sie hinfuehren soll.
    const v = findViolations([['content', gekennzeichnet]]);
    expect(v.map((x) => x.rule)).not.toContain('behauptete-ursache');
  });

  it('faengt die konkreten Formulierungen aus dem Bericht KW 30', () => {
    for (const satz of [
      'das Angebot deckt die Nachfrage',
      'Die Häufung bestätigt, wo aktuell die Aufmerksamkeit liegt',
      'Der Preis steigt, weil die Nachfrage anzieht',
      'getrieben von Sammlerinteresse',
    ]) {
      expect(CAUSAL_CLAIM.test(satz), satz).toBe(true);
    }
  });

  it('haelt reine Messaussagen fuer unbedenklich', () => {
    for (const satz of [
      'Umbreon ex bewegt sich diese Woche nicht.',
      'Mew ex steigt um 11,8 Prozent.',
      'Auf der Verliererseite stehen vier Karten aus demselben Set.',
    ]) {
      expect(findViolations([['content', satz]])).toHaveLength(0);
    }
  });

  it('die Regel steht in den Erzeugungs-Vorgaben, nicht nur in der Pruefung', () => {
    // Eine Regel, die erst nach der Erzeugung greift, verwirft den Text —
    // sie verhindert ihn nicht.
    const regeln = lies('src/lib/article-generator.ts');
    expect(regeln).toMatch(/BEOBACHTUNG UND DEUTUNG TRENNEN/);
    expect(regeln).toMatch(/Eine mögliche Erklärung/);
  });

  it('Kennzeichen und Verbot ueberschneiden sich nicht', () => {
    // Sonst hebt sich die Regel selbst auf.
    expect(HYPOTHESIS_MARKER.test('der grund liegt')).toBe(false);
  });
});
