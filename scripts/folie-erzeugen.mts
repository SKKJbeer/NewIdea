// ERZEUGT DEN HINTERGRUND als statische Datei: public/hintergrund-folie.svg
//
// DIE KOMPOSITION: drei aufgefächerte Sammelkarten, die Licht fangen.
//
// Was eine seltene Karte optisch ausmacht, sind drei Dinge — und keines davon
// ist eine Figur: das Kartenformat (63:88), die Kosmos-Folie (das
// Sternen-Bläschen-Muster unter dem Bild) und die Regenbogenbrechung beim
// Kippen. Zusammen liest man sie sofort als Sammelkarte. Genau das soll der
// Hintergrund sagen — die Seite handelt von Karten, nicht von Kreaturen.
//
// BEWUSST KEINE FIGUR. Eine erkennbare Pokémon-Gestalt wäre eine
// Schutzrechtsverletzung; die Seite nennt sich selbst eine inoffizielle
// Fan-Seite. Kartenformat, Folie und Licht sind frei.
//
// AUFBAU, von hinten nach vorn:
//   1. Guilloche — feine Gravur, weit ausgreifend (die Prägung)
//   2. Drei Kartenflächen, gefächert, teils außerhalb des Bildes
//   3. Kosmos-Folie in jeder Karte
//   4. Regenbogenbrechung quer über die Karten
//   5. Kantenlicht an den Kartenrändern
//
// WARUM ALS DATEI und nicht im Markup: Die Rosette allein besteht aus
// zehntausenden Koordinaten. Im Markup würde sie die Seitenantwort
// vervielfachen — doppelt sogar, weil Next die Struktur zusätzlich als
// RSC-Nutzlast mitschickt.
//
// AUFRUF: npm run folie — die erzeugte Datei mit committen.

import { writeFileSync } from 'node:fs';
import { rosette, spiro, kartenPfad, kosmos } from '../src/lib/foil-art.ts';

const W = 1536;
const H = 900;

// ── 1 · GRAVUR ─────────────────────────────────────────────────────────────
// Mittelpunkt außerhalb des Bildes: Sichtbar bleibt nur der äußere Teil, die
// Prägung wirkt dadurch groß und angeschnitten statt wie ein Objekt in der Ecke.
const gx = 1560;
const gy = -220;
const SCHRITTE = 120;

const gravur =
  `<g stroke="#a78bfa" stroke-width="0.6" opacity="0.13">`
  + rosette({ cx: gx, cy: gy, radius: 980, zacken: 9, tiefe: 0.24, linien: 10, schritte: SCHRITTE })
      .map((d) => `<path d="${d}"/>`).join('')
  + '</g>'
  + `<g stroke="#7dd3fc" stroke-width="0.5" opacity="0.09">`
  + rosette({ cx: gx, cy: gy, radius: 760, zacken: 15, tiefe: 0.16, linien: 7, schritte: SCHRITTE })
      .map((d) => `<path d="${d}"/>`).join('')
  + '</g>'
  + `<g stroke="#fcd34d" stroke-width="0.5" opacity="0.07">`
  + `<path d="${spiro({ cx: gx, cy: gy, R: 700, r: 151, d: 330, umlaeufe: 151, schritte: 1200 })}"/>`
  + '</g>';

// ── 2 · DIE KARTEN ─────────────────────────────────────────────────────────
// Gefächert wie in der Hand gehalten, nach rechts aus dem Bild laufend. Die
// Winkel steigen nach hinten an — bei gleichem Winkel sähe es aus wie ein
// Stapel, nicht wie ein Fächer.
interface Karte { x: number; y: number; breite: number; winkel: number; tiefe: number }
const karten: Karte[] = [
  { x: 690,  y: 250, breite: 430, winkel: -26, tiefe: 0.55 },
  { x: 985,  y: 140, breite: 470, winkel: -14, tiefe: 0.80 },
  { x: 1290, y: 210, breite: 450, winkel:  -4, tiefe: 1.00 },
];

function karteAlsGruppe(karte: Karte, i: number): string {
  const { x, y, breite, winkel, tiefe } = karte;
  const hoehe = (breite * 88) / 63;
  const mx = x + breite / 2;
  const my = y + hoehe / 2;
  const id = `k${i}`;
  const pfad = kartenPfad(x, y, breite);

  // Die Bläschen werden im lokalen Kartenraster erzeugt und danach an ihren
  // Platz geschoben — so bleibt die Streuung je Karte unabhängig.
  const blasen = kosmos(4711 + i * 977, 300, breite, hoehe)
    // toFixed erlaubt: SVG-Koordinate, kein sichtbarer Zahlenwert.
    .map((p) => `<circle cx="${Math.round(x + p.cx)}" cy="${Math.round(y + p.cy)}" r="${p.r.toFixed(1)}" opacity="${(p.licht * 0.85).toFixed(2)}"/>`)
    .join('');

  return `<g transform="rotate(${winkel} ${mx.toFixed(1)} ${my.toFixed(1)})" opacity="${tiefe.toFixed(2)}">
  <clipPath id="c${id}"><path d="${pfad}"/></clipPath>
  <path d="${pfad}" fill="url(#kartengrund)"/>
  <g clip-path="url(#c${id})">
    <g fill="#e9d5ff">${blasen}</g>
    <rect x="${x}" y="${y}" width="${breite}" height="${hoehe}" fill="url(#regenbogen)" opacity="1"/>
    <rect x="${x}" y="${y}" width="${breite}" height="${hoehe}" fill="url(#kippLicht)" opacity="0.7"/>
  </g>
  <path d="${pfad}" fill="none" stroke="url(#kante)" stroke-width="1.4" opacity="0.75"/>
</g>`;
}

const kartenSvg = karten.map(karteAlsGruppe).join('');

// ── 3 · VERLÄUFE ───────────────────────────────────────────────────────────
// Der Regenbogen ist bewusst ENTSÄTTIGT. Volle Sättigung sieht nach
// Spielzeug aus; eine echte Folie zeigt die Farben nur als Schimmer.
const defs = `<defs>
<linearGradient id="kartengrund" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%" stop-color="#1a1b3a" stop-opacity="0.55"/>
  <stop offset="55%" stop-color="#12142c" stop-opacity="0.40"/>
  <stop offset="100%" stop-color="#0c0d1e" stop-opacity="0.30"/>
</linearGradient>
<linearGradient id="regenbogen" x1="0" y1="1" x2="1" y2="0">
  <stop offset="0%"  stop-color="#f0abfc" stop-opacity="0.30"/>
  <stop offset="20%" stop-color="#818cf8" stop-opacity="0.34"/>
  <stop offset="40%" stop-color="#22d3ee" stop-opacity="0.26"/>
  <stop offset="58%" stop-color="#5eead4" stop-opacity="0.12"/>
  <stop offset="74%" stop-color="#fcd34d" stop-opacity="0.32"/>
  <stop offset="90%" stop-color="#fb7185" stop-opacity="0.26"/>
  <stop offset="100%" stop-color="#c084fc" stop-opacity="0.22"/>
</linearGradient>
<linearGradient id="kippLicht" x1="0.1" y1="0" x2="0.9" y2="1">
  <stop offset="0%"  stop-color="#ffffff" stop-opacity="0"/>
  <stop offset="38%" stop-color="#ffffff" stop-opacity="0.09"/>
  <stop offset="52%" stop-color="#ffffff" stop-opacity="0.16"/>
  <stop offset="66%" stop-color="#ffffff" stop-opacity="0.05"/>
  <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="kante" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%"  stop-color="#fde68a" stop-opacity="0.75"/>
  <stop offset="45%" stop-color="#c4b5fd" stop-opacity="0.35"/>
  <stop offset="100%" stop-color="#7dd3fc" stop-opacity="0.20"/>
</linearGradient>
<radialGradient id="gravurWeich" cx="${((gx / W) * 100).toFixed(1)}%" cy="${((gy / H) * 100).toFixed(1)}%" r="78%">
  <stop offset="30%" stop-color="#fff" stop-opacity="1"/>
  <stop offset="72%" stop-color="#fff" stop-opacity="0.5"/>
  <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<mask id="gravurMaske"><rect width="${W}" height="${H}" fill="url(#gravurWeich)"/></mask>
<linearGradient id="ausblenden" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0%"  stop-color="#fff" stop-opacity="0"/>
  <stop offset="34%" stop-color="#fff" stop-opacity="0.35"/>
  <stop offset="70%" stop-color="#fff" stop-opacity="1"/>
  <stop offset="100%" stop-color="#fff" stop-opacity="1"/>
</linearGradient>
<mask id="nachLinksAus"><rect width="${W}" height="${H}" fill="url(#ausblenden)"/></mask>
</defs>`;

// Die Karten blenden nach links aus: Dort steht die Überschrift, und ein
// harter Kartenrand mitten im Fließtext wäre Konkurrenz statt Hintergrund.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">`
  + defs
  + `<g mask="url(#gravurMaske)">${gravur}</g>`
  + `<g mask="url(#nachLinksAus)">${kartenSvg}</g>`
  + '</svg>';

writeFileSync(new URL('../public/hintergrund-folie.svg', import.meta.url), svg);
console.log(`hintergrund-folie.svg — ${(svg.length / 1024).toFixed(0)} KB`);
