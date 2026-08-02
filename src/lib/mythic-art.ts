// GRAVIERTES FABELWESEN — eigene Illustration für den Seitenkopf.
//
// AUFTRAG AUS DER VORLAGE: Gross, oben, wie in den Hintergrund eingraviert. Ein
// Drachenwesen im Profil mit geoeffnetem Rachen, gefaechertem Kamm,
// Energiefilamenten und konzentrischen Ringen.
//
// WAS HIER NICHT PASSIERT: Nichts davon ist nachgezeichnet. Es gibt kein
// Vorbild, dessen Kontur uebernommen waere — die Form entsteht aus geometrisch
// gesetzten Punkten, so wie man eine Wappenfigur konstruiert. Ein Drache ist
// ein Motiv der Menschheit, keine Marke; ein BESTIMMTER Drache waere eine.
//
// WARUM GESCHLOSSENE FLAECHEN UND NICHT NUR LINIEN — das war der Fehler des
// ersten Entwurfs: Ober- und Unterkiefer lagen dort als zwei lange offene
// Kurven. Isoliert betrachtet stimmte die Form; auf der Seite las sich das
// Ganze als Buendel schraeger Striche, weil das Auge eine Figur an ihrer
// UMRISSFLAECHE erkennt, nicht an einzelnen Bogen. Jetzt sind Schaedel,
// Kiefer, Hals und Kammzacken geschlossene Pfade mit sehr schwacher Fuellung.
// Die Fuellung ist so gering, dass die Gravur-Anmutung bleibt — sie gibt dem
// Umriss aber die Flaeche, die ihn lesbar macht.
//
// Feld: 720 × 640. Das Wesen blickt nach links.

/** Konzentrische Ringe im Hintergrund. Jeweils [cx, cy, r, Bogenanteil 0–1]. */
export const MYTHIC_RINGS: Array<[number, number, number, number]> = [
  [508, 430, 64, 0.72],
  [508, 430, 96, 0.56],
  [508, 430, 136, 0.42],
  [508, 430, 184, 0.28],
];

/** Energiefilamente — lange Kurven vom Kamm nach aussen. */
export const MYTHIC_FILAMENTS: string[] = [
  'M 540 92 C 604 60, 664 44, 716 42',
  'M 548 132 C 612 108, 672 98, 718 100',
  'M 536 178 C 598 164, 656 160, 706 166',
  'M 520 62 C 570 26, 626 6, 690 0',
  'M 516 214 C 570 208, 622 210, 668 220',
  'M 470 470 C 546 486, 616 476, 676 448',
  'M 486 512 C 560 534, 632 528, 692 500',
];

/**
 * Geschlossene Umrissflaechen — Schaedel, Kiefer, Hals.
 *
 * Reihenfolge = Zeichenreihenfolge. Der Hals liegt hinten, dann der
 * Unterkiefer, zuletzt der Schaedel; so ueberdeckt das Vordere das Hintere,
 * wie bei einer echten Ansicht von der Seite.
 */
export const MYTHIC_SILHOUETTE: string[] = [
  // Hals — laeuft nach unten rechts aus dem Bild
  'M 396 236 C 432 288, 468 356, 486 432 C 500 490, 508 546, 504 600 L 566 616 C 558 548, 540 472, 510 400 C 482 332, 446 274, 414 230 Z',
  // Unterkiefer, geoeffnet
  'M 382 258 C 376 304, 350 338, 300 352 C 232 370, 142 372, 84 358 L 72 340 C 140 348, 228 344, 294 328 C 338 318, 368 298, 380 258 Z',
  // Schaedel mit Schnauze und Rachendach
  'M 420 148 C 372 156, 320 176, 288 204 C 226 226, 132 254, 66 282 L 54 298 C 126 310, 214 304, 286 288 C 332 280, 366 266, 386 238 C 402 204, 428 174, 420 148 Z',
];

/** Kammzacken, nach hinten gefaechert — ebenfalls geschlossen. */
export const MYTHIC_CREST: string[] = [
  'M 416 146 C 452 106, 502 74, 558 54 L 530 106 C 488 124, 452 146, 426 168 Z',
  'M 408 170 C 446 140, 496 116, 552 104 L 528 148 C 486 158, 450 176, 420 194 Z',
  'M 400 196 C 436 174, 484 158, 536 152 L 516 190 C 472 196, 436 210, 410 222 Z',
  'M 392 222 C 424 208, 466 200, 510 200 L 494 228 C 458 232, 426 240, 402 250 Z',
];

/** Auge und Pupille — geschlossen, damit der Blick entsteht. */
export const MYTHIC_EYE: string[] = [
  'M 272 238 C 286 222, 310 217, 328 226 C 314 244, 290 249, 272 238 Z',
  'M 293 231 C 300 226, 310 226, 315 232 C 308 239, 299 239, 293 231 Z',
];

/** Zaehne — kleine geschlossene Dreiecke an beiden Kiefern. */
export const MYTHIC_TEETH: string[] = [
  'M 94 298 L 103 320 L 112 300 Z',
  'M 138 294 L 147 316 L 156 296 Z',
  'M 184 290 L 193 310 L 202 291 Z',
  'M 230 284 L 239 302 L 248 285 Z',
  'M 108 352 L 117 332 L 126 353 Z',
  'M 156 358 L 165 338 L 174 358 Z',
  'M 204 360 L 213 340 L 222 359 Z',
  'M 252 354 L 261 336 L 270 352 Z',
];

/** Schraffur — erzeugt Volumen durch Dichte, nicht durch Flaechen. */
export const MYTHIC_HATCH: string[] = [
  // Schaedeldecke
  'M 300 202 C 322 190, 348 180, 374 176',
  'M 314 216 C 336 202, 362 192, 388 188',
  'M 330 230 C 350 216, 374 206, 398 202',
  // Kiefermuskel
  'M 336 296 C 352 286, 364 270, 370 250',
  'M 348 308 C 362 296, 372 280, 378 260',
  // Halsplatten, quer
  'M 406 274 C 424 284, 438 298, 448 316',
  'M 424 316 C 442 326, 456 340, 466 358',
  'M 442 362 C 460 372, 474 386, 484 404',
  'M 458 410 C 476 420, 490 434, 500 452',
  'M 472 462 C 490 472, 502 486, 512 504',
  // Schnauzenrippen
  'M 130 268 L 137 288', 'M 176 260 L 183 280', 'M 222 250 L 229 270',
  // Nuestern
  'M 96 286 C 105 280, 116 280, 123 287',
];

/** Streufunken. Jeweils [cx, cy, r]. Von Hand gesetzt, damit sie ruhig liegen. */
export const MYTHIC_SPARKS: Array<[number, number, number]> = [
  [604, 40, 2.2], [660, 84, 1.4], [572, 150, 1.8], [694, 168, 1.5],
  [520, 26, 1.3], [612, 214, 2], [668, 262, 1.4], [560, 268, 1.6],
  [512, 316, 1.3], [628, 340, 1.8], [696, 316, 1.2], [468, 96, 1.5],
  [596, 400, 1.4], [666, 424, 1.7], [540, 476, 1.3], [614, 512, 1.5],
  [452, 560, 1.4], [688, 546, 1.2],
];
