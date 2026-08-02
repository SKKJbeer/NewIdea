// SAMMLER-EBENE — Farbe, die aus der Karte kommt, nicht aus der Oberfläche.
//
// AUSGANGSLAGE: CardBeacon war fachlich richtig und emotional tot. Ein dunkles
// Terminal mit Zahlen. Sammeln ist aber keine Tabellenkalkulation — es geht um
// Artwork, Seltenheit, Sets, Wiedererkennung.
//
// DER GRUNDSATZ, der beides zusammenhält:
//
//   DATEN ZUERST. ARTWORK RESPEKTIERT.
//
// Farbe kommt aus der KARTE, nie aus der Oberfläche. Die Oberfläche bleibt
// zurückhaltend und dunkel; sie stellt die Karte aus, statt mit ihr zu
// konkurrieren. Deshalb gibt es hier keine Markenfarbpalette in Pokémon-Gelb
// und keine bunten Verläufe, sondern genau eine Ableitung: vom Energietyp der
// Karte zu einem sehr gedeckten Schimmer hinter ihr.
//
// WARUM NICHT AUS DEM BILD GERECHNET: Eine Farbanalyse des Kartenbilds klingt
// naheliegend und ist in der Praxis teuer (Bild laden, dekodieren, Pixel
// auswerten) und unzuverlässig (Hologrammfolie liefert je nach Kompression
// andere Mittelwerte). Der Energietyp steht in der Kartendatenbank, kostet
// nichts und ist bei jedem Aufruf derselbe. Er ist damit auch prüfbar — eine
// Farbe, die man aus einem JPEG mittelt, ist es nicht.

/** Ein Ambient-Ton. Alle Werte sind Tailwind-Klassen, keine Inline-Farben. */
export interface Ambient {
  /** Schimmer hinter der Karte. Sehr niedrige Deckkraft — nie eine Fläche. */
  glow: string;
  /** Randlicht auf dem Kartenrahmen. */
  ring: string;
  /** Akzentfarbe für Text, sparsam. */
  text: string;
  /** Woher der Ton stammt — für die Offenlegung in der Oberfläche. */
  quelle: string;
  /**
   * Derselbe Ton als rgba für den Umgebungshof im Hintergrund.
   *
   * Getrennt von den Tailwind-Klassen, weil ein radialer Verlauf einen echten
   * Farbwert braucht — eine Klasse lässt sich nicht in `radial-gradient()`
   * einsetzen. Die Deckkraft ist hier bewusst noch niedriger als bei `glow`:
   * Der Hof liegt über der ganzen oberen Seitenhälfte, nicht nur hinter der
   * Karte.
   */
  ambient: string;
}

/**
 * Rückfallton.
 *
 * Bewusst der Violettton der Marke: Wo kein Typ bekannt ist, zeigt CardBeacon
 * sich selbst statt eine Eigenschaft zu erfinden.
 */
export const AMBIENT_FALLBACK: Ambient = {
  glow: 'bg-violet-500/[0.07]',
  ring: 'ring-violet-400/10',
  text: 'text-violet-300',
  quelle: 'CardBeacon',
  ambient: 'rgba(124,58,237,0.09)',
};

// Die Töne sind absichtlich alle gleich schwach. Der Unterschied zwischen Feuer
// und Wasser soll auffallen, wenn man zwei Karten nacheinander öffnet — nicht
// beim ersten Blick auf eine.
const TOENE: Record<string, Ambient> = {
  Fire:     { glow: 'bg-orange-500/[0.08]',  ring: 'ring-orange-400/10',  text: 'text-orange-300',  quelle: 'Feuer' , ambient: 'rgba(249,115,22,0.09)' },
  Water:    { glow: 'bg-sky-500/[0.08]',     ring: 'ring-sky-400/10',     text: 'text-sky-300',     quelle: 'Wasser' , ambient: 'rgba(14,165,233,0.09)' },
  Grass:    { glow: 'bg-emerald-500/[0.07]', ring: 'ring-emerald-400/10', text: 'text-emerald-300', quelle: 'Pflanze' , ambient: 'rgba(16,185,129,0.08)' },
  Lightning:{ glow: 'bg-amber-400/[0.08]',   ring: 'ring-amber-300/10',   text: 'text-amber-200',   quelle: 'Elektro' , ambient: 'rgba(251,191,36,0.09)' },
  Psychic:  { glow: 'bg-fuchsia-500/[0.08]', ring: 'ring-fuchsia-400/10', text: 'text-fuchsia-300', quelle: 'Psycho' , ambient: 'rgba(217,70,239,0.09)' },
  Fighting: { glow: 'bg-red-600/[0.07]',     ring: 'ring-red-400/10',     text: 'text-red-300',     quelle: 'Kampf' , ambient: 'rgba(220,38,38,0.08)' },
  Darkness: { glow: 'bg-slate-400/[0.05]',   ring: 'ring-slate-300/10',   text: 'text-slate-300',   quelle: 'Finsternis' , ambient: 'rgba(100,116,139,0.09)' },
  Metal:    { glow: 'bg-zinc-300/[0.05]',    ring: 'ring-zinc-200/10',    text: 'text-zinc-300',    quelle: 'Metall' , ambient: 'rgba(161,161,170,0.08)' },
  Dragon:   { glow: 'bg-yellow-600/[0.07]',  ring: 'ring-yellow-400/10',  text: 'text-yellow-200',  quelle: 'Drache' , ambient: 'rgba(129,140,248,0.09)' },
  Fairy:    { glow: 'bg-pink-500/[0.07]',    ring: 'ring-pink-400/10',    text: 'text-pink-300',    quelle: 'Fee' , ambient: 'rgba(236,72,153,0.08)' },
  Colorless:{ glow: 'bg-stone-300/[0.05]',   ring: 'ring-stone-200/10',   text: 'text-stone-300',   quelle: 'Farblos' , ambient: 'rgba(168,162,158,0.07)' },
};

/**
 * Ambient-Ton einer Karte.
 *
 * Nimmt den ERSTEN Typ. Doppeltypen zu mischen ergäbe einen matschigen Ton, der
 * zu keiner der beiden Karten gehört — und die Aufgabe ist Wiedererkennung,
 * nicht Genauigkeit.
 */
export function ambientFor(types: string[] | undefined): Ambient {
  const erster = types?.[0];
  return (erster && TOENE[erster]) || AMBIENT_FALLBACK;
}

/**
 * Vorherrschender Ton einer Kartenmenge — für Set-Seiten.
 *
 * GEZÄHLT, NICHT GERATEN: Ein Set bekommt den Ton des Typs, der in seinen
 * handelbaren Karten am häufigsten an erster Stelle steht. Damit ist die Farbe
 * eine Auskunft über das Set und keine Zuweisung aus einer Tabelle.
 *
 * Gleichstand entscheidet die Reihenfolge des ersten Auftretens; das ist
 * beliebig, aber stabil — und eine stabile Farbe ist wichtiger als eine
 * begründete Reihenfolge unter gleich häufigen Typen.
 *
 * Reicht die Datenlage nicht (keine Karte hat einen Typ), gibt es den
 * Markenton und `gezaehlt: 0` — die Oberfläche darf dann keine Aussage über
 * einen Energietyp treffen.
 */
export function dominantAmbient(
  cards: Array<{ types?: string[] }>,
): { ambient: Ambient; anteil: number; gezaehlt: number; typ: string | null } {
  const zaehler = new Map<string, number>();
  let gezaehlt = 0;
  for (const c of cards) {
    const t = c.types?.[0];
    if (!t || !TOENE[t]) continue;
    zaehler.set(t, (zaehler.get(t) ?? 0) + 1);
    gezaehlt++;
  }
  if (gezaehlt === 0) return { ambient: AMBIENT_FALLBACK, anteil: 0, gezaehlt: 0, typ: null };

  let bester = '';
  let beste = 0;
  for (const [typ, n] of zaehler) {
    if (n > beste) { bester = typ; beste = n; }
  }
  return { ambient: TOENE[bester], anteil: beste / gezaehlt, gezaehlt, typ: bester };
}

// FRÜHER STAND HIER `hatFolie(rarity)`.
//
// Der Folienschimmer lief nur auf Karten, deren Seltenheit tatsächlich glänzt.
// Die Begründung war stimmig — auf jeder Karte sei der Effekt Dekoration, auf
// den glänzenden eine Auskunft. In der Praxis fiel dabei aber nicht auf, dass
// etwas eine Auskunft IST; es sah nur so aus, als flimmerten manche Zeilen und
// andere nicht. Eine Regel, die niemand als Regel wahrnimmt, ordnet nichts —
// sie erzeugt Ungleichmäßigkeit.
//
// Der Schimmer läuft jetzt auf jedem Kartenbild. Was ihn davor bewahrt,
// Dekoration zu werden, sind die übrigen Bedingungen (`.foil` in globals.css):
// Er läuft EINMAL und nur bei Zeigerkontakt, er ist weiß statt bunt, und er
// liegt vollständig im `prefers-reduced-motion`-Block. Die sind keine
// Geschmacksfrage und bleiben.
