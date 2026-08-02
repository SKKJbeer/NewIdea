// EIGENE LINIENKUNST — kein nachgezeichnetes Artwork.
//
// WORUM ES GEHT: Der Hintergrund soll beim zweiten Hinsehen erkennen lassen,
// dass hier Sammelkarten und keine Anleihen gehandelt werden. Der naheliegende
// Weg — eine bekannte Kreatur nachzeichnen — ist aus zwei Gründen ausgeschlossen:
//
//   1. RECHTLICH. Eine nachgezeichnete Silhouette ist eine Bearbeitung des
//      Originals, auch wenn nur Linien übrig bleiben.
//   2. GESTALTERISCH, und das wiegt hier schwerer. Ein erkennbarer Charakter im
//      Hintergrund macht aus einem Marktprodukt eine Fanseite. Genau die
//      Grenze, die dieses Projekt nicht überschreiten soll.
//
// WAS STATTDESSEN ENTSTEHT: Formen aus der Bildsprache von Energie und Folie —
// aufsteigende Bögen, kantige Bahnen, Umrisse, die an ein Flügelwesen erinnern
// können, ohne eines darzustellen. Kein Gesicht, keine Augen, keine
// Comic-Kontur. Näher an einer Bauzeichnung als an einer Illustration.
//
// Die Pfade sind von Hand gesetzt. Erzeugte Kurven wirken gleichmäßig, und
// Gleichmäßigkeit liest sich als Muster statt als Zeichnung.

/**
 * Höhenlinien für den Grund.
 *
 * Ungleichmäßig gesetzt: Berechnete Abstände ergeben ein Raster, und ein Raster
 * wirkt technisch statt sammlerhaft.
 */
export const CREATURE_LINES: string[] = [
  'M-40 470 C 180 430, 320 500, 520 452 S 900 372, 1240 424',
  'M-40 424 C 170 386, 330 452, 528 404 S 906 328, 1240 378',
  'M-40 372 C 200 342, 316 400, 510 356 S 892 288, 1240 330',
  'M-40 312 C 190 288, 344 342, 534 300 S 884 240, 1240 276',
  'M-40 246 C 210 228, 330 274, 516 238 S 900 186, 1240 216',
  'M-40 174 C 186 162, 352 200, 540 170 S 890 128, 1240 152',
];

/**
 * Flügel- und Energieform für den Seitenkopf.
 *
 * Aufgebaut aus vier Gruppen, die zusammen eine Silhouette andeuten, einzeln
 * aber abstrakt bleiben:
 *   · ein langgezogener Bogen (Hals/Rücken)
 *   · zwei aufgefächerte Flügelbahnen mit Streben
 *   · kantige Energiebahnen, die den Bogen kreuzen
 *   · offene Konturfragmente, die bewusst nicht schließen
 *
 * Die unvollständigen Linien sind Absicht: Eine geschlossene Kontur liest sich
 * als Figur, eine offene als Struktur.
 */
export const ENERGY_ARC: string[] = [
  // Rücken- und Halsbogen
  'M 120 640 C 150 520, 210 430, 300 372 S 452 268, 486 168',
  'M 150 648 C 182 534, 236 452, 322 396 S 466 292, 500 196',
  // Oberer Flügel — aufgefächert, nach außen offen
  'M 300 372 C 336 300, 402 246, 486 214 L 560 190',
  'M 300 372 C 344 316, 414 274, 500 250 L 574 234',
  'M 300 372 C 350 334, 420 306, 508 292 L 578 284',
  // Streben zwischen den Flügelbahnen
  'M 396 262 L 372 322',
  'M 452 234 L 428 300',
  'M 508 214 L 486 286',
  // Unterer Flügel, kürzer und flacher
  'M 268 452 C 318 428, 392 420, 470 430',
  'M 268 452 C 322 444, 396 448, 468 468',
  'M 372 424 L 366 456',
  'M 430 424 L 424 462',
  // Kantige Energiebahnen — der technische Gegenpol zu den weichen Bögen
  'M 96 520 L 176 470 L 168 540 L 246 496',
  'M 132 700 L 214 640 L 206 706 L 284 656',
  'M 486 168 L 520 118 L 512 176 L 566 140',
  // Offene Fragmente
  'M 214 560 C 258 546, 312 548, 356 566',
  'M 250 616 C 300 600, 358 602, 406 622',
];
