// SAMMELKARTEN-MOTIVE — eigene Geometrie, eigene Zeichen.
//
// WO DIE GRENZE JETZT LIEGT (bewusst weiter als vorher):
//
//   ERLAUBT, weil es kein fremdes Material ist:
//     · Die FORM einer Sammelkarte. 63×88 mm ist ein Format, kein Werk —
//       niemandem gehört ein Rechteck mit runden Ecken.
//     · Aufgefächerte Kartenstapel, Boosterhüllen-Umrisse, Folienschlieren.
//       Das ist die Bildsprache des Sammelns an sich, nicht die einer Marke.
//     · EIGENE Elementzeichen: Flamme, Tropfen, Blatt, Blitz. Elemente sind
//       Allgemeingut — Feuer gehört niemandem. Gezeichnet wird hier neu.
//
//   ERLAUBT, weil die Seite es ohnehin zeigt:
//     · Das Artwork DER Karte auf DEREN eigener Seite, stark unscharf als
//       Raumfarbe. Das ist kein zusätzliches Material: dasselbe Bild steht
//       zwanzig Zentimeter darüber in voller Größe, und ohne Kartenbilder
//       gäbe es dieses Produkt nicht.
//
//   WEITERHIN AUSGESCHLOSSEN, und daran ändert die Lockerung nichts:
//     · Charaktere nachzeichnen, auch als Silhouette.
//     · Der Pokéball. Das ist ein geschütztes Kennzeichen, kein Symbol.
//     · Die offizielle Kartenrückseite — eine konkrete gestaltete Fläche.
//     · Die offiziellen Energie-Symbole als unsere Markenzeichen. Ein eigenes
//       Flammenzeichen ist etwas anderes als DAS Feuer-Symbol des Spiels.
//     · Fremdes Artwork als seitenweite Tapete, losgelöst von der Karte,
//       zu der es gehört.
//
// Der Unterschied, an dem sich alles entscheidet: Ein Bild ZU EINER KARTE auf
// DEREN Seite ist Gegenstand der Auskunft. Dasselbe Bild als Hintergrund einer
// beliebigen anderen Seite ist Dekoration mit fremdem Eigentum.

/**
 * Aufgefächerte Kartenumrisse.
 *
 * Fünf Rechtecke im echten Kartenformat (63:88), gegeneinander gedreht wie ein
 * aufgefächertes Blatt auf dem Tisch. Bewusst nur Umrisse: Gefüllte Flächen
 * lesen sich als Kacheln, offene Linien als Zeichnung.
 *
 * Die Drehwinkel sind von Hand gesetzt und ungleichmäßig — gleichmäßige
 * Abstände sehen aus wie ein Diagramm, nicht wie hingelegte Karten.
 */
export const CARD_FAN: Array<{ x: number; y: number; rot: number }> = [
  { x: 40, y: 150, rot: -22 },
  { x: 132, y: 118, rot: -11 },
  { x: 228, y: 104, rot: -2 },
  { x: 322, y: 116, rot: 9 },
  { x: 412, y: 146, rot: 19 },
];

/** Maße eines Umrisses im Fächer — echtes Kartenverhältnis. */
export const CARD_W = 126;
export const CARD_H = 176;

/**
 * Elementzeichen je Energietyp — eigene Zeichnungen.
 *
 * NICHT die Symbole des Spiels. Die sind Kennzeichen und dürfen keine
 * Markenelemente von CardBeacon werden. Hier steht die zugrunde liegende
 * Naturform: eine Flamme ist eine Flamme, seit es Feuer gibt.
 *
 * Alle Pfade liegen in einem 24×24-Feld, damit sie sich beliebig skalieren
 * lassen und untereinander gleich groß wirken.
 */
export const ELEMENT_GLYPHS: Record<string, string[]> = {
  // Flamme — zwei ineinanderliegende Zungen
  Fire: [
    'M12 3 C 14.5 7, 18 8.5, 18 13 A 6 6 0 0 1 6 13 C 6 9.5, 9 8, 12 3 Z',
    'M12 10 C 13.2 11.8, 14 12.6, 14 14 A 2 2 0 0 1 10 14 C 10 12.6, 11 11.8, 12 10 Z',
  ],
  // Tropfen
  Water: [
    'M12 3 C 15.5 8, 18 10.6, 18 13.6 A 6 6 0 0 1 6 13.6 C 6 10.6, 8.5 8, 12 3 Z',
    'M9.5 14.4 A 2.5 2.5 0 0 0 12 16.9',
  ],
  // Blatt mit Mittelrippe
  Grass: [
    'M19 5 C 11 5, 5 9, 5 15 C 5 17.6, 6.4 19, 9 19 C 15 19, 19 13, 19 5 Z',
    'M17 7 C 13 9, 10.5 12, 9 17',
  ],
  // Blitz
  Lightning: ['M13.5 2 L 6 13 L 11 13 L 10.5 22 L 18 11 L 13 11 Z'],
  // Spirale — Psycho
  Psychic: [
    'M12 4 A 8 8 0 1 1 4.6 15 A 5.2 5.2 0 1 0 12 8.6 A 2.6 2.6 0 1 1 14 12.4',
  ],
  // Faust/Schlagform — Kampf
  Fighting: [
    'M5 9 L 11 3.5 L 19 8 L 15.5 20.5 L 6.5 19 Z',
    'M11 3.5 L 10 12 L 15.5 20.5',
  ],
  // Abnehmender Mond — Finsternis
  Darkness: ['M16.5 3.5 A 9 9 0 1 0 16.5 20.5 A 7.2 7.2 0 0 1 16.5 3.5 Z'],
  // Zahnrad-Kern — Metall
  Metal: [
    'M12 4.5 L 14.4 7 L 17.8 6.6 L 17.4 10 L 19.9 12 L 17.4 14 L 17.8 17.4 L 14.4 17 L 12 19.5 L 9.6 17 L 6.2 17.4 L 6.6 14 L 4.1 12 L 6.6 10 L 6.2 6.6 L 9.6 7 Z',
    'M12 9.6 A 2.4 2.4 0 1 0 12 14.4 A 2.4 2.4 0 1 0 12 9.6 Z',
  ],
  // Geschliffener Kristall — Drache
  Dragon: [
    'M12 2.5 L 19.5 9 L 12 21.5 L 4.5 9 Z',
    'M4.5 9 L 19.5 9',
    'M12 2.5 L 9 9 L 12 21.5 L 15 9 Z',
  ],
  // Vierzackiger Stern — Fee
  Fairy: ['M12 2.5 C 12.9 8.6, 15.4 11.1, 21.5 12 C 15.4 12.9, 12.9 15.4, 12 21.5 C 11.1 15.4, 8.6 12.9, 2.5 12 C 8.6 11.1, 11.1 8.6, 12 2.5 Z'],
  // Offener Ring — Farblos
  Colorless: [
    'M12 3.5 A 8.5 8.5 0 1 1 4.6 8',
    'M12 8 A 4 4 0 1 0 16 12',
  ],
};

/** Zeichen zum Energietyp. `null`, wenn keins hinterlegt ist — nichts erfinden. */
export function glyphFor(typ: string | undefined): string[] | null {
  if (!typ) return null;
  return ELEMENT_GLYPHS[typ] ?? null;
}
