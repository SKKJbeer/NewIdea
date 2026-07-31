// DESIGN-TOKENS — die Klassenketten aus DESIGN.md an einer Stelle.
//
// WARUM: In der Vorgängerfassung stand `rounded-2xl border border-[#2a2a3a]
// bg-[#13131e] p-5` an über sechzig Stellen. Jede Abweichung davon war ein
// stiller Bruch im Erscheinungsbild, und eine Änderung am Grundton hätte
// sechzig Suchen-und-Ersetzen-Schritte gebraucht.
//
// Hier stehen nur Ketten, die MEHRFACH vorkommen. Einzelfälle bleiben in ihrer
// Komponente — ein Token-Verzeichnis, das jede Sonderform aufnimmt, ist wieder
// nur eine zweite Stelle für dasselbe Problem.

/** Flächen. Siehe DESIGN.md §5 — Kanten statt Radien. */
export const SURFACE = {
  page: 'bg-[#08080b]',
  raised: 'bg-[#0e0e13]',
  line: 'border-[#1c1c24]',
  lineStrong: 'border-[#2a2a35]',
  hover: 'hover:bg-white/[0.02]',
} as const;

/** Abschnittsmarke — steht über jedem Block statt einer Überschrift in Kachel. */
export const SECTION_LABEL =
  'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500';

/** Nummerierung der Abschnitte (01, 02 …) — gibt der Seite eine Ordnung. */
export const SECTION_NUM = 'text-[10px] font-mono tabular-nums text-slate-700';

/** Kennzahlen. Genau EINE `hero` pro Seite. */
export const NUM = {
  hero: 'text-5xl sm:text-7xl font-semibold tabular-nums tracking-tight leading-none',
  large: 'text-2xl font-semibold tabular-nums leading-none',
  row: 'text-[13px] tabular-nums',
  small: 'text-[11px] tabular-nums',
} as const;

/** Tabellen. Zeilen tragen eine Linie, keine Fläche und keinen Rahmen. */
export const TABLE = {
  head: 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600',
  row: 'border-b border-[#1c1c24]/70 transition-colors hover:bg-white/[0.02]',
  cell: 'py-2.5',
  num: 'text-right tabular-nums',
} as const;

/** Kartenbild in einer Datenzeile — Miniatur, nicht Blickfang. */
export const THUMB = 'h-9 w-[26px] shrink-0 object-contain';

/**
 * Richtung einer Zahl.
 *
 * Farbe ist NIE das einzige Signal (DESIGN.md §6) — deshalb liefert diese
 * Funktion nur die Farbe, und das Vorzeichen kommt aus `formatPercent`.
 * `null` bedeutet: nicht gemessen. Das ist etwas anderes als null Prozent.
 */
export function toneClass(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'text-slate-600';
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-rose-400';
  return 'text-slate-400';
}

/** Balkenfarbe in Verlaufsgrafiken — gedeckter als Textfarbe, damit Zahlen führen. */
export function barClass(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'bg-slate-700';
  if (value > 0) return 'bg-emerald-500/70';
  if (value < 0) return 'bg-rose-500/70';
  return 'bg-slate-600';
}

/** Platzhalter für Ladezustände — immer in der Höhe des fertigen Inhalts. */
export const SKELETON = 'animate-pulse bg-[#14141a]';
