// FOLIEN-ARTWORK — mathematisch erzeugt, nicht von Hand gezeichnet.
//
// WARUM DIESER BRUCH MIT DEM VORGÄNGER: Das bisherige Artwork war ein
// Drachenkopf aus von Hand gesetzten Bézier-Punkten (`mythic-art.ts`). Genau
// das war der Befund — „sieht aus wie von einem Kind gemalt". Das lag nicht an
// zu wenig Mühe, sondern an der Technik: Anatomie entsteht aus tausenden
// Entscheidungen über Kontur, Volumen und Licht. Wer sie als Zahlenreihe in
// eine Datei tippt, bekommt Striche, keine Kreatur — beliebig viele Anläufe
// ändern daran nichts.
//
// WAS STATTDESSEN PROFESSIONELL AUSSIEHT, weil es BERECHNET ist: Guilloche.
// Das sind die ineinander verschlungenen Linienrosetten auf Banknoten,
// Wertpapieren und den Rückseiten hochwertiger Sammelkarten. Sie wirken kostbar
// und handwerklich, weil sie aus präziser Interferenz entstehen — und sie
// können gar nicht kindlich aussehen, weil keine Hand sie setzt.
//
// UND SIE GEHÖRT HIERHER: Die Seite handelt von Sammelkarten. Die Bildsprache
// einer veredelten Karte — Folie, Prägung, Lichtbrechung — ist die des
// Gegenstands selbst. Kein fremdes Motiv, das man sich ausleihen müsste.
//
// RECHTLICH: Hier wird bewusst KEINE Kreatur und keine Figur dargestellt. Die
// Seite ist eine inoffizielle Fan-Seite; eine erkennbare Pokémon-Figur wäre
// eine Schutzrechtsverletzung, und daran ändert auch eine gelockerte Hausregel
// nichts. Muster, Licht und Folie sind frei.
//
// DETERMINISTISCH: kein `Math.random()`. Dieselben Eingaben ergeben dasselbe
// Bild — sonst flackerte der Hintergrund bei jedem Seitenaufbau.

/** Ein Punkt auf 2 Nachkommastellen — kürzt die Pfadangaben deutlich. */
// toFixed erlaubt: SVG-Koordinate, kein sichtbarer Zahlenwert.
const k = (n: number) => n.toFixed(2);

function alsPfad(punkte: Array<[number, number]>): string {
  if (punkte.length === 0) return '';
  const [start, ...rest] = punkte;
  return `M ${k(start[0])} ${k(start[1])} ` + rest.map((p) => `L ${k(p[0])} ${k(p[1])}`).join(' ');
}

export interface RosettenWahl {
  /** Mittelpunkt. */
  cx: number;
  cy: number;
  /** Äußerer Radius. */
  radius: number;
  /** Zacken der Rosette — bestimmt den Charakter des Musters. */
  zacken: number;
  /** Tiefe der Zacken, als Anteil des Radius (0…1). */
  tiefe: number;
  /** Wieviele gegeneinander verdrehte Linien. Mehr = dichter, kostbarer. */
  linien: number;
  /** Auflösung je Linie. */
  schritte?: number;
}

/**
 * Guilloche-Rosette — ineinander verdrehte Linien, die durch Interferenz ein
 * Muster ergeben.
 *
 * Jede einzelne Linie ist eine Epitrochoide: ein Radius, der beim Umlauf
 * sinusförmig atmet. Verdreht man viele davon gegeneinander, entstehen genau
 * die Moiré-Bänder, die Prägedruck ausmacht. Der Effekt kommt aus der
 * Überlagerung — eine einzelne Linie sieht nach nichts aus.
 */
export function rosette({
  cx, cy, radius, zacken, tiefe, linien, schritte = 720,
}: RosettenWahl): string[] {
  const pfade: string[] = [];
  for (let i = 0; i < linien; i++) {
    // Die Phase wandert über die Linien hinweg einmal ganz herum. Ein
    // gleichmäßiger Versatz ist entscheidend: Bei zufälligen Phasen wird aus
    // dem Muster Rauschen.
    const phase = (Math.PI * 2 * i) / linien;
    // Der Radius schrumpft leicht nach innen — sonst liegen alle Linien
    // aufeinander und die Rosette wirkt flach statt geschichtet.
    const r0 = radius * (1 - (i / linien) * 0.16);
    const punkte: Array<[number, number]> = [];
    for (let s = 0; s <= schritte; s++) {
      const t = (Math.PI * 2 * s) / schritte;
      const r = r0 * (1 - tiefe + tiefe * Math.cos(zacken * t + phase));
      punkte.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    pfade.push(alsPfad(punkte) + ' Z');
  }
  return pfade;
}

export interface SpiroWahl {
  cx: number;
  cy: number;
  /** Radius des festen Kreises. */
  R: number;
  /** Radius des rollenden Kreises — bestimmt die Zahl der Schleifen. */
  r: number;
  /** Abstand des zeichnenden Punktes vom Mittelpunkt des rollenden Kreises. */
  d: number;
  /** Umläufe, bis sich die Figur schließt. */
  umlaeufe?: number;
  schritte?: number;
}

/**
 * Hypotrochoide — die klassische Spirographen-Figur.
 *
 * Sie liefert die verschlungene Mitte, die eine Rosette erst wertvoll aussehen
 * lässt. `R`, `r` und `d` bestimmen das Muster vollständig; teilerfremde Werte
 * für `R` und `r` ergeben die dichtesten Figuren.
 */
export function spiro({ cx, cy, R, r, d, umlaeufe = 12, schritte = 2400 }: SpiroWahl): string {
  const punkte: Array<[number, number]> = [];
  const ende = Math.PI * 2 * umlaeufe;
  for (let s = 0; s <= schritte; s++) {
    const t = (ende * s) / schritte;
    const q = (R - r) / r;
    punkte.push([
      cx + (R - r) * Math.cos(t) + d * Math.cos(q * t),
      cy + (R - r) * Math.sin(t) - d * Math.sin(q * t),
    ]);
  }
  return alsPfad(punkte);
}

// ── KARTEN UND FOLIE ───────────────────────────────────────────────────────
//
// Was eine seltene Karte optisch ausmacht, sind drei Dinge — und keines davon
// ist eine Figur: das KARTENFORMAT (63:88, seit Jahrzehnten unverändert), die
// KOSMOS-FOLIE (das Sternen-Bläschen-Muster unter dem Bild) und die
// REGENBOGENBRECHUNG beim Kippen. Zusammen liest man sie sofort als
// Sammelkarte, ohne dass irgendwo ein geschütztes Motiv auftaucht.

/** Abgerundetes Kartenrechteck im echten Seitenverhältnis 63:88. */
export function kartenPfad(x: number, y: number, breite: number, radius = 18): string {
  const hoehe = (breite * 88) / 63;
  const r = Math.min(radius, breite / 2, hoehe / 2);
  return [
    `M ${k(x + r)} ${k(y)}`,
    `H ${k(x + breite - r)}`, `A ${k(r)} ${k(r)} 0 0 1 ${k(x + breite)} ${k(y + r)}`,
    `V ${k(y + hoehe - r)}`, `A ${k(r)} ${k(r)} 0 0 1 ${k(x + breite - r)} ${k(y + hoehe)}`,
    `H ${k(x + r)}`, `A ${k(r)} ${k(r)} 0 0 1 ${k(x)} ${k(y + hoehe - r)}`,
    `V ${k(y + r)}`, `A ${k(r)} ${k(r)} 0 0 1 ${k(x + r)} ${k(y)}`,
    'Z',
  ].join(' ');
}

/**
 * Ein linearer Kongruenzgenerator.
 *
 * KEIN `Math.random()`: Der Hintergrund muss bei jedem Aufbau identisch sein,
 * sonst flackert er. Ein Startwert erzeugt immer dieselbe Streuung — und wer
 * eine andere Verteilung will, ändert den Startwert und sieht das im Diff.
 */
function streuung(startwert: number): () => number {
  let z = startwert >>> 0;
  return () => {
    z = (z * 1664525 + 1013904223) >>> 0;
    return z / 4294967296;
  };
}

export interface KosmosPunkt {
  cx: number;
  cy: number;
  r: number;
  /** 0…1 — wie hell dieses Bläschen leuchtet. */
  licht: number;
}

/**
 * Kosmos-Folie: unregelmäßige Bläschen in wechselnder Größe.
 *
 * Das Muster lebt davon, dass die Größen WEIT auseinanderliegen — wenige große
 * Bläschen zwischen vielen winzigen. Gleich große Punkte ergeben ein Raster,
 * und ein Raster sieht nach Bildschirm aus, nicht nach Folie.
 */
export function kosmos(
  startwert: number, anzahl: number, breite: number, hoehe: number,
): KosmosPunkt[] {
  const z = streuung(startwert);
  const punkte: KosmosPunkt[] = [];
  for (let i = 0; i < anzahl; i++) {
    const roh = z();
    // Vierte Potenz: die allermeisten Bläschen bleiben klein, einzelne werden
    // deutlich groß. Linear verteilt sähe alles gleich aus.
    const r = 0.6 + roh * roh * roh * roh * 9;
    punkte.push({ cx: z() * breite, cy: z() * hoehe, r, licht: 0.25 + z() * 0.75 });
  }
  return punkte;
}
