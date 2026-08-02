import type { AccessoryType } from '@/components/AccessoryLink';

// ZUBEHÖR IM FLIESSTEXT ERKENNEN — und höchstens sparsam verlinken.
//
// AUFGABE: Wo ein Guide oder Bericht Sleeves, Toploader oder ein Sammelalbum
// erwähnt, darf dort ein Kauflink stehen. Er soll aber NICHT dominant sein.
//
// WARUM ALS RENDER-EBENE UND NICHT IM GESPEICHERTEN TEXT: Die Beiträge liegen
// als reiner Text in der Datenbank. Sie mit Markup anzureichern hieße, jeden
// bestehenden Beitrag umzuschreiben und jedem Sprachmodell zuzutrauen, korrekt
// ausgezeichnete Links zu erzeugen — beides fehleranfällig und beides
// unumkehrbar. Erkennt stattdessen die Anzeige die Stellen, gilt die Regel
// rückwirkend für alle bestehenden Beiträge und automatisch für jeden neuen,
// ohne dass die Erzeugung etwas davon wissen muss.
//
// „NICHT DOMINANT" IST HIER EINE ZAHL, KEINE HALTUNG:
//
//   · höchstens EIN Link je Zubehörart und Beitrag — die erste Erwähnung
//   · höchstens `MAX_LINKS` Links im ganzen Beitrag
//   · nur im Fließtext, nie in Überschriften, nie in Kernpunkten
//
// Ohne die erste Regel bekäme ein Lagerungs-Guide, der zwölfmal „Toploader"
// schreibt, zwölf Links — und läse sich wie eine Anzeige. Mit ihr ist es ein
// Hinweis an der Stelle, an der die Frage zum ersten Mal auftaucht.

/** Obergrenze je Beitrag. Vier Links auf 1.500 Wörter sind ein Hinweis, zehn sind Werbung. */
export const MAX_LINKS = 4;

interface Muster {
  type: AccessoryType;
  /**
   * Wortformen, die diese Zubehörart benennen.
   *
   * Absichtlich eng gefasst: „Box" allein trifft auch „Booster-Box" und
   * „Displaybox" und wäre damit falsch verlinkt. Lieber eine Erwähnung
   * übersehen als eine falsch zuordnen.
   */
  woerter: string[];
}

const MUSTER: Muster[] = [
  { type: 'sleeve', woerter: ['Sleeves', 'Kartenhüllen', 'Schutzhüllen', 'Penny Sleeves'] },
  { type: 'toploader', woerter: ['Toploader', 'Toploadern', 'Hartplastikhüllen'] },
  { type: 'binder', woerter: ['Sammelalbum', 'Sammelalben', 'Binder', 'Ringbuch'] },
  { type: 'storage', woerter: ['Aufbewahrungsbox', 'Aufbewahrungsboxen', 'Kartenbox', 'Kartenboxen'] },
];

export interface Segment {
  text: string;
  /** Gesetzt, wenn dieses Segment verlinkt werden soll. */
  type?: AccessoryType;
}

/**
 * Zerlegt einen Absatz in Segmente und markiert die zu verlinkenden.
 *
 * `bereits` wird MITGEFÜHRT und verändert — der Aufrufer reicht dieselbe Menge
 * durch alle Absätze eines Beitrags. Nur so lässt sich „einmal je Art und
 * Beitrag" durchsetzen; absatzweise gezählt käme in jedem Absatz ein neuer
 * Link dazu.
 */
export function findeZubehoer(absatz: string, bereits: Set<AccessoryType>): Segment[] {
  if (bereits.size >= MAX_LINKS) return [{ text: absatz }];

  // Frühester Treffer im Absatz gewinnt — sonst hinge die Reihenfolge an der
  // Reihenfolge der Musterliste statt am Text.
  let treffer: { index: number; laenge: number; type: AccessoryType } | null = null;

  for (const m of MUSTER) {
    if (bereits.has(m.type)) continue;
    for (const wort of m.woerter) {
      // Wortgrenzen: „Sleeves" soll nicht in „Sleevesammlung" anschlagen.
      const re = new RegExp(`(?<![\\p{L}])${wort}(?![\\p{L}])`, 'iu');
      const gefunden = re.exec(absatz);
      if (gefunden && (treffer === null || gefunden.index < treffer.index)) {
        treffer = { index: gefunden.index, laenge: gefunden[0].length, type: m.type };
      }
    }
  }

  if (!treffer) return [{ text: absatz }];

  bereits.add(treffer.type);
  const vor = absatz.slice(0, treffer.index);
  const wort = absatz.slice(treffer.index, treffer.index + treffer.laenge);
  const nach = absatz.slice(treffer.index + treffer.laenge);

  // Der Rest wird erneut geprüft: In einem Absatz können zwei verschiedene
  // Zubehörarten stehen, und beide dürfen je einmal verlinkt werden.
  return [
    ...(vor ? [{ text: vor }] : []),
    { text: wort, type: treffer.type },
    ...findeZubehoer(nach, bereits),
  ];
}

/** Enthält der Beitrag überhaupt Zubehör? Entscheidet über den Pflichthinweis. */
export function hatZubehoer(texte: string[]): boolean {
  const bereits = new Set<AccessoryType>();
  for (const t of texte) {
    if (findeZubehoer(t, bereits).some((s) => s.type)) return true;
  }
  return false;
}
