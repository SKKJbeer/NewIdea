// ERZEUGT DIE HINTERGRUND-FOLIE als statische Datei: public/hintergrund-folie.svg
//
// WARUM ALS DATEI und nicht im Seiten-Markup: Die Guilloche besteht aus
// zehntausenden Koordinaten. Direkt in der Seite wuerde sie das HTML vielfach
// aufblaehen — und zwar DOPPELT, weil Next die gerenderte Struktur zusaetzlich
// als RSC-Nutzlast mitschickt. Als eigene Datei laedt sie einmal, wird vom
// Browser und vom Netz zwischengespeichert und taucht in keiner Seitenantwort
// mehr auf.
//
// AUFRUF: npm run folie
// Danach die erzeugte Datei mit committen — sie ist Teil der Gestaltung, kein
// Build-Artefakt. Wer die Parameter aendert, sieht das Ergebnis im Diff.

import { writeFileSync } from 'node:fs';
import { rosette, spiro } from '../src/lib/foil-art.ts';

const W = 1536;
const H = 900;

// Der Mittelpunkt liegt AUSSERHALB des Bildes. Sichtbar bleibt nur der aeussere
// Teil der Praegung — dadurch wirkt sie gross und angeschnitten statt wie eine
// Scheibe, die jemand in die Ecke gelegt hat.
const cx = 1820;
const cy = 120;

// SCHRITTWEITE IST EIN GESTALTUNGS- UND EIN GEWICHTSPARAMETER.
//
// GEMESSEN: 720 Punkte je Linie ergaben 573 KB, 240 noch 183 KB (71 KB
// gezippt). Sichtbar unterscheiden sich die Stufen nicht — bei diesem Radius
// liegen aufeinanderfolgende Punkte unter einem Pixel auseinander, der Browser
// zeichnet ohnehin dieselbe Kurve. Fuer reine Dekoration ist das Gewicht das
// staerkere Argument.
const SCHRITTE = 150;

const teile = [
  { pfade: rosette({ cx, cy, radius: 980, zacken: 9, tiefe: 0.24, linien: 16, schritte: SCHRITTE }),
    farbe: '#a78bfa', breite: 0.6, deckung: 0.26 },
  { pfade: rosette({ cx, cy, radius: 760, zacken: 15, tiefe: 0.16, linien: 11, schritte: SCHRITTE }),
    farbe: '#7dd3fc', breite: 0.5, deckung: 0.17 },
  { pfade: [spiro({ cx, cy, R: 700, r: 151, d: 330, umlaeufe: 151, schritte: 1700 })],
    farbe: '#fcd34d', breite: 0.5, deckung: 0.13 },
];

const gruppen = teile
  .map((t) => `<g stroke="${t.farbe}" stroke-width="${t.breite}" opacity="${t.deckung}">`
    + t.pfade.map((d) => `<path d="${d}"/>`).join('')
    + '</g>')
  .join('');

// KEIN STRAHLENFAECHER MEHR.
//
// Er lag zuerst quer ueber dem Bild und sollte gebrochenes Licht andeuten.
// Im Seitenkontext betrachtet war er das einzige GERADE Element zwischen lauter
// Kurven — und kreuzte die Rosette so, dass oben links ein Netz entstand.
// Ein Fischernetz ist das Gegenteil von Praegung.
const fächer = '';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">`
  + '<defs>'
  + `<radialGradient id="w" cx="${((cx / W) * 100).toFixed(1)}%" cy="${((cy / H) * 100).toFixed(1)}%" r="78%">`
  + '<stop offset="30%" stop-color="#fff" stop-opacity="1"/>'
  + '<stop offset="72%" stop-color="#fff" stop-opacity="0.5"/>'
  + '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>'
  + '</radialGradient>'
  + `<mask id="m"><rect width="${W}" height="${H}" fill="url(#w)"/></mask>`
  + '</defs>'
  + `<g mask="url(#m)">${gruppen}</g>`
  + fächer
  + '</svg>';

writeFileSync(new URL('../public/hintergrund-folie.svg', import.meta.url), svg);
console.log(`hintergrund-folie.svg geschrieben — ${(svg.length / 1024).toFixed(0)} KB`);
