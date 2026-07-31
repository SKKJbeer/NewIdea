// FORMATE DER MARKTBILDER — bewusst OHNE Abhängigkeiten.
//
// Diese Datei enthält nur Zahlen. Sie ist von `story-frames.tsx` getrennt, weil
// die Oberfläche im Studio dieselben Maße braucht: Importiert ein
// Client-Bauteil sie aus der Renderdatei, zieht es `next/og` und `fs/promises`
// in das Browser-Paket — der Bau bricht dann mit „module not found" ab, und
// zwar erst beim Bündeln, nicht bei der Typprüfung.
//
// Eine Konstante, die auf beiden Seiten gebraucht wird, gehört in eine Datei,
// die auf keiner Seite etwas voraussetzt.

export const STORY_FORMATE = {
  /** Instagram Reel / Story — hochkant, volle Höhe. */
  reel: { width: 1080, height: 1920 },
  /** Instagram Beitrag / Karussell — das Format mit der größten Reichweite. */
  post: { width: 1080, height: 1350 },
  /** Teilen-Vorschau für Verlinkungen (OpenGraph, X). */
  og: { width: 1200, height: 630 },
} as const;

export type StoryFormat = keyof typeof STORY_FORMATE;
