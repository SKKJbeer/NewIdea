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
};

// Die Töne sind absichtlich alle gleich schwach. Der Unterschied zwischen Feuer
// und Wasser soll auffallen, wenn man zwei Karten nacheinander öffnet — nicht
// beim ersten Blick auf eine.
const TOENE: Record<string, Ambient> = {
  Fire:     { glow: 'bg-orange-500/[0.08]',  ring: 'ring-orange-400/10',  text: 'text-orange-300',  quelle: 'Feuer' },
  Water:    { glow: 'bg-sky-500/[0.08]',     ring: 'ring-sky-400/10',     text: 'text-sky-300',     quelle: 'Wasser' },
  Grass:    { glow: 'bg-emerald-500/[0.07]', ring: 'ring-emerald-400/10', text: 'text-emerald-300', quelle: 'Pflanze' },
  Lightning:{ glow: 'bg-amber-400/[0.08]',   ring: 'ring-amber-300/10',   text: 'text-amber-200',   quelle: 'Elektro' },
  Psychic:  { glow: 'bg-fuchsia-500/[0.08]', ring: 'ring-fuchsia-400/10', text: 'text-fuchsia-300', quelle: 'Psycho' },
  Fighting: { glow: 'bg-red-600/[0.07]',     ring: 'ring-red-400/10',     text: 'text-red-300',     quelle: 'Kampf' },
  Darkness: { glow: 'bg-slate-400/[0.05]',   ring: 'ring-slate-300/10',   text: 'text-slate-300',   quelle: 'Finsternis' },
  Metal:    { glow: 'bg-zinc-300/[0.05]',    ring: 'ring-zinc-200/10',    text: 'text-zinc-300',    quelle: 'Metall' },
  Dragon:   { glow: 'bg-yellow-600/[0.07]',  ring: 'ring-yellow-400/10',  text: 'text-yellow-200',  quelle: 'Drache' },
  Fairy:    { glow: 'bg-pink-500/[0.07]',    ring: 'ring-pink-400/10',    text: 'text-pink-300',    quelle: 'Fee' },
  Colorless:{ glow: 'bg-stone-300/[0.05]',   ring: 'ring-stone-200/10',   text: 'text-stone-300',   quelle: 'Farblos' },
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
