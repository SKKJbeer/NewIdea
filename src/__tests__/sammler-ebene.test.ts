import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ambientFor, dominantAmbient, AMBIENT_FALLBACK } from '@/lib/collector';
import { glyphFor, ELEMENT_GLYPHS, CARD_W, CARD_H } from '@/lib/card-motifs';
import { findViolations, CAUSAL_CLAIM, HYPOTHESIS_MARKER } from '@/lib/content-rules';
import { fearGreedLabel } from '@/lib/market-metrics';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');
const existiert = (p: string) => existsSync(join(process.cwd(), p));

/**
 * Entfernt Kommentare vor der Pruefung.
 *
 * ZUM VIERTEN MAL noetig: Eine Waechter-Regel, die nach verbotenen Begriffen
 * sucht, findet sie zuverlaessig in der Begruendung, warum sie verboten sind.
 * Der Kommentar „kein WebGL, keine Leinwand" liess genau den Test scheitern,
 * der WebGL und Leinwand verbietet.
 */
const ohneKommentare = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

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
  const backdrop = lies('src/components/AmbientBackdrop.tsx');
  const linienkunst = lies('src/lib/creature-art.ts');

  it('ist fuer Hilfsmittel unsichtbar und nicht anklickbar', () => {
    expect(backdrop).toContain('aria-hidden');
    expect(backdrop).toContain('pointer-events-none');
  });

  it('bleibt weit unter der Lesbarkeitsgrenze', () => {
    // Vorgabe: Beim ersten Blick eine hochwertige dunkle Oberflaeche, erst beim
    // genaueren Hinsehen die Struktur. Alles ueber 5 % waere Tapete.
    const deckkraefte = [...backdrop.matchAll(/opacity-\[0\.(\d+)\]/g)]
      .map((m) => Number(`0.${m[1]}`));
    expect(deckkraefte.length).toBeGreaterThan(0);
    for (const d of deckkraefte) expect(d).toBeLessThanOrEqual(0.05);

    // Die Lichthoefe kommen als rgba aus collector.ts — auch die bleiben schwach.
    const hoefe = [...lies('src/lib/collector.ts').matchAll(/rgba\([\d,\s]+,(0\.\d+)\)/g)]
      .map((m) => Number(m[1]));
    expect(hoefe.length).toBeGreaterThan(0);
    for (const h of hoefe) expect(h).toBeLessThanOrEqual(0.1);
  });

  it('zeichnet keine Kreaturen nach', () => {
    // Ein erkennbarer Charakter im Hintergrund waere genau die Fan-Seiten-
    // Anmutung, die dieses Produkt nicht haben soll — unabhaengig von der
    // Rechtslage. Die Linienkunst ist eigenstaendig gezeichnet.
    const verboten = /pokeball|pokéball|charizard|glurak|pikachu|rayquaza|arceus|mewtwo|creature-silhouette/i;
    expect(ohneKommentare(backdrop)).not.toMatch(verboten);
    expect(ohneKommentare(linienkunst)).not.toMatch(verboten);
  });

  it('haelt Research frei von Kreaturen', () => {
    // Hinter 1.500 Woertern ist jede Struktur eine Stoerung. Lesbarkeit zuerst.
    const stufen = backdrop.slice(backdrop.indexOf('const STAERKE'), backdrop.indexOf('export function AmbientBackdrop'));
    expect(stufen).toMatch(/research:\s*\{[^}]*kreatur: null/);
    expect(stufen).toMatch(/markt:\s*\{[^}]*kreatur: '/);
  });

  it('die Hintergrund-Ebene selbst laedt kein Bild und animiert nicht dauerhaft', () => {
    // Leistungsvorgabe fuer diesen Baustein: nur CSS-Verlaeufe und SVG.
    // `url(#…)` ist erlaubt — seiteninterne SVG-Referenz (Maske, Verlauf).
    //
    // Das Kartenbild als Raumfarbe steht bewusst NICHT hier, sondern auf der
    // Kartenseite: Es gehoert zu EINER Karte und darf deshalb nicht in einen
    // Baustein wandern, den jede Seite einsetzt (siehe eigener Test unten).
    const code = ohneKommentare(backdrop);
    expect(code).not.toMatch(/<img|background-image|<video|<canvas|requestAnimationFrame|WebGL/i);
    expect(code).not.toMatch(/url\(['"]?(https?:|\/|\.)|\.(png|jpe?g|webp|gif)\b/i);
    expect(code).not.toMatch(/animate-(pulse|spin|bounce|ping)/);
  });

  it('gibt es nur EINMAL — keine zweite Hintergrund-Umsetzung', () => {
    // Code-Regel 10: eine Quelle pro UI-Baustein.
    expect(existiert('src/components/CollectorBackdrop.tsx')).toBe(false);
    expect(lies('src/components/MarketHeader.tsx')).toContain('AmbientBackdrop');
  });
});

describe('Set-Ton ist gezaehlt, nicht gesetzt', () => {
  const karte = (typ?: string) => ({ types: typ ? [typ] : undefined });

  it('nimmt den haeufigsten Energietyp der Kartenmenge', () => {
    const ton = dominantAmbient([karte('Fire'), karte('Fire'), karte('Water')]);
    expect(ton.ambient.quelle).toBe('Feuer');
    expect(ton.gezaehlt).toBe(3);
    expect(ton.anteil).toBeCloseTo(2 / 3);
  });

  it('zaehlt Karten ohne Typ gar nicht mit', () => {
    // Sonst waere der Anteil ein Anteil an etwas anderem, als er behauptet.
    const ton = dominantAmbient([karte('Water'), karte(), karte()]);
    expect(ton.gezaehlt).toBe(1);
    expect(ton.anteil).toBe(1);
  });

  it('behauptet ohne Datenlage keinen Typ', () => {
    const ton = dominantAmbient([karte(), karte()]);
    expect(ton.gezaehlt).toBe(0);
    expect(ton.ambient).toBe(AMBIENT_FALLBACK);
  });

  it('die Set-Seite verschweigt den Ton, wenn nichts gezaehlt wurde', () => {
    // Eine Farbe ohne Erklaerung ist Dekoration; eine Erklaerung ohne Messung
    // waere eine Behauptung. Beides ist hier ausgeschlossen.
    const seite = lies('src/app/sets/[setCode]/page.tsx');
    expect(seite).toMatch(/setTon\.gezaehlt > 0 && \(/);
    expect(seite).toMatch(/setTon\.gezaehlt > 0 \? setTon\.ambient\.ambient : undefined/);
  });
});

describe('Sammler-Motive: was erlaubt ist und was nicht', () => {
  const motive = lies('src/lib/card-motifs.ts');
  const kartenseite = lies('src/app/karten/[id]/page.tsx');

  // DIE GRENZE WURDE BEWUSST VERSCHOBEN. Vorher galt pauschal „keine
  // Pokemon-Bilder im Hintergrund"; das war einfach zu pruefen und liess das
  // Produkt kuehler aussehen, als es muss. Jetzt gilt eine Unterscheidung, die
  // schwerer zu pruefen, aber sachlich die richtige ist:
  //
  //   · EIGENE Formen (Kartenformat, Elementzeichen) — immer erlaubt.
  //   · Das Bild EINER Karte auf DEREN Seite — erlaubt, weil es dort ohnehin
  //     in voller Groesse steht und Gegenstand der Auskunft ist.
  //   · Fremdes Artwork als Tapete beliebiger Seiten — weiterhin verboten.
  //
  // Diese Tests halten genau diese drei Zeilen fest.

  it('das Kartenformat ist echt — 63:88, kein gerundetes Rechteck', () => {
    // Ein Rechteck im falschen Verhaeltnis liest sich als Kachel. Erst das
    // echte Format macht daraus eine Karte.
    expect(CARD_W / CARD_H).toBeCloseTo(63 / 88, 2);
  });

  it('die Elementzeichen sind eigene Pfade, keine fremden Dateien', () => {
    for (const [typ, pfade] of Object.entries(ELEMENT_GLYPHS)) {
      expect(pfade.length, typ).toBeGreaterThan(0);
      for (const d of pfade) expect(d, typ).toMatch(/^M[\s\d.-]/);
    }
    expect(ohneKommentare(motive)).not.toMatch(/<img|https?:|\.(png|svg|jpe?g|webp)\b/i);
  });

  it('erfindet kein Zeichen fuer einen unbekannten Typ', () => {
    // Ein beliebiges Zeichen waere eine Behauptung ueber die Karte.
    expect(glyphFor('Fire')).not.toBeNull();
    expect(glyphFor('Gibtsnicht')).toBeNull();
    expect(glyphFor(undefined)).toBeNull();
  });

  it('greift geschuetzte Kennzeichen NICHT auf', () => {
    // Das bleibt ausgeschlossen, auch nach der Lockerung: Der Pokeball ist ein
    // Kennzeichen, kein Symbol; die Kartenrueckseite ist eine konkrete
    // gestaltete Flaeche; ein nachgezeichneter Charakter macht aus einem
    // Marktprodukt eine Fanseite.
    const verboten = /pokeball|poké?ball|monsterball|kartenrueckseite|card-?back|charizard|glurak|pikachu|rayquaza|mewtwo|arceus|eevee|evoli/i;
    for (const datei of [
      'src/lib/card-motifs.ts',
      'src/lib/creature-art.ts',
      'src/components/AmbientBackdrop.tsx',
    ]) {
      expect(ohneKommentare(lies(datei)), datei).not.toMatch(verboten);
    }
  });

  it('das Kartenbild als Raumfarbe steht NUR auf der Seite dieser Karte', () => {
    // Der entscheidende Unterschied: `card.imageUrl` ist auf DIESER Seite die
    // Karte, um die es geht. Derselbe Griff in einem seitenweiten Baustein
    // waere fremdes Artwork als Tapete.
    expect(kartenseite).toMatch(/card\.imageUrl && \(/);
    expect(kartenseite).toMatch(/blur-\[\d+px\]/);

    // Unkenntlich UND schwach. Beides zusammen, nicht eins von beidem.
    const deckkraft = Number(kartenseite.match(/opacity-\[0\.(\d+)\][^>]*blur/)?.[1] ?? '99');
    expect(deckkraft).toBeLessThanOrEqual(12);

    // Und nirgendwo sonst: Kein seitenweiter Baustein darf ein Kartenbild als
    // Hintergrund einsetzen.
    for (const datei of ['src/components/AmbientBackdrop.tsx', 'src/components/NavBar.tsx', 'src/components/SiteFooter.tsx']) {
      expect(ohneKommentare(lies(datei)), datei).not.toMatch(/imageUrl/);
    }
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
