import type { PokemonCard } from '@/types';
import { displayPrice } from '@/lib/pokemon-api';

// THEMENWAHL FÜR GENERIERTE INHALTE — gegen die Wiederholung.
//
// BEFUND AUS DER VERÖFFENTLICHTEN SEITE, gezählt statt vermutet:
//
//   KW 31  Pikachu zieht die Kabel, der Rest von Surging Sparks …
//   30.07. Pikachu ex zieht an, Surging Sparks kühlt ab
//   KW 30  Wenn die Krone wackelt und die Spinne klettert
//   KW 29  Die Spinne klettert, die Krone rutscht
//   16.07. Pikachu ex zieht an, Surging Sparks bröckelt
//   KW 28  Pikachu tanzt allein, der Rest von Surging Sparks …
//
// Fünf von acht Beiträgen über dieselbe Karte, zwei weitere über dasselbe
// zweite Motiv. Für jemanden, der die Seite abonniert, ist das kein Angebot,
// sondern eine Endlosschleife.
//
// ZWEI URSACHEN, beide struktureller Natur:
//
//   1. DERSELBE KANDIDATENPOOL. Die Erzeugung bekam immer die sechs
//      wertvollsten Karten der Stichprobe. Die ändern sich über Wochen kaum —
//      und die auffälligste Bewegung darin ist entsprechend oft dieselbe.
//
//   2. DIE LETZTEN TITEL WURDEN ALS ANKNÜPFUNG GEREICHT. Wörtlich stand im
//      Prompt „nur bei thematischem Bezug natürlich darauf anspielen". Das
//      Modell tat genau das. Die Absicht war ein roter Faden; herausgekommen
//      ist eine Wiederholung.
//
// Diese Datei ist die Gegenmaßnahme, und sie ist bewusst rein: Was ein Beitrag
// behandeln darf, ist eine Auswahlfrage und keine Frage an das Sprachmodell.
// Ein Modell, das man bittet, sich nicht zu wiederholen, tut es trotzdem —
// eine Kandidatenliste, in der das Thema nicht mehr vorkommt, kann es nicht.

/** Wie viele der zuletzt erschienenen Beiträge gesperrt werden. */
export const SPERRFRIST = 6;

/**
 * Namensbestandteile aus Titeln lösen.
 *
 * Absichtlich grob: Ein Titel nennt „Pikachu ex" mal so, mal als „Pikachu".
 * Verglichen wird deshalb auf Wortstamm-Ebene, nicht auf Gleichheit — lieber
 * ein Thema zu viel gesperrt als eines zu wenig. Sechs Wochen Pause für eine
 * Karte kosten nichts; sechs Wochen dieselbe Karte kosten Leser.
 */
export function themenAusTiteln(titel: string[]): Set<string> {
  const gesperrt = new Set<string>();
  for (const t of titel) {
    for (const wort of t.split(/[^A-Za-zÄÖÜäöüß0-9'&-]+/)) {
      const w = wort.toLowerCase();
      // Kurze und allgemeine Wörter taugen nicht als Thema — „der", „markt",
      // „woche" würden sonst alles sperren.
      if (w.length < 4 || STOPPWOERTER.has(w)) continue;
      gesperrt.add(w);
    }
  }
  return gesperrt;
}

const STOPPWOERTER = new Set([
  'wochenrückblick', 'wochenrueckblick', 'marktanalyse', 'marktausblick', 'marktbericht',
  'analyse', 'ausblick', 'check', 'markt', 'woche', 'rest', 'zieht', 'kühlt', 'kuehlt',
  'bröckelt', 'broeckelt', 'klettert', 'rutscht', 'tanzt', 'wackelt', 'allein', 'während',
  'waehrend', 'wenn', 'sitzt', 'rand', 'nachgibt', 'preisentwicklung', 'karte', 'fokus',
  'karten', 'pokémon', 'pokemon', 'sammler', 'preis', 'preise', 'trends', 'trend',
  'januar', 'februar', 'märz', 'maerz', 'april', 'juni', 'juli', 'august', 'september',
  'oktober', 'november', 'dezember',
]);

/** Trägt diese Karte ein Thema, das zuletzt schon dran war? */
export function istVerbraucht(card: PokemonCard, gesperrt: Set<string>): boolean {
  const felder = [card.name, card.nameDe ?? '', card.set].join(' ').toLowerCase();
  for (const begriff of gesperrt) {
    if (felder.includes(begriff)) return true;
  }
  return false;
}

export interface Themenwahl {
  /** Karten, über die geschrieben werden darf — bereits gefiltert und gemischt. */
  kandidaten: PokemonCard[];
  /** Was gesperrt wurde. Gehört in den Prompt UND ins Log. */
  gesperrteThemen: string[];
  /**
   * Wurde die Sperre aufgehoben, weil sonst nichts übrig bliebe?
   *
   * Das kommt vor und ist kein Fehler — es muss nur sichtbar sein. Lieber ein
   * Beitrag über eine schon behandelte Karte als gar keiner.
   */
  sperreGelockert: boolean;
}

/**
 * Wählt die Karten aus, über die ein neuer Beitrag geschrieben werden darf.
 *
 * DREI SCHRITTE:
 *
 *   1. Sperren, was zuletzt dran war.
 *   2. Mischen statt nach Wert sortieren. Die wertvollsten Karten sind über
 *      Wochen dieselben; wer immer die ersten sechs nimmt, bekommt immer
 *      dasselbe Thema. Gemischt wird deterministisch nach Datum — derselbe
 *      Tag ergibt dieselbe Auswahl (sonst brächte jeder Seitenaufruf einen
 *      anderen Artikel), verschiedene Tage verschiedene.
 *   3. Auffächern: nicht nur Gewinner. Ein Beitrag, der ausschließlich
 *      Steigerungen zeigt, ist eine Auswahl zugunsten guter Nachrichten.
 */
export function waehleThemen(
  cards: PokemonCard[],
  letzteTitel: string[],
  datum: string,
  anzahl = 6,
): Themenwahl {
  const gesperrt = themenAusTiteln(letzteTitel.slice(0, SPERRFRIST));
  const frei = cards.filter((c) => !istVerbraucht(c, gesperrt));

  // Bleibt zu wenig übrig, gilt die Sperre nicht — ein Beitrag über eine
  // bekannte Karte ist besser als keiner. Sichtbar gemacht, nicht verschwiegen.
  const sperreGelockert = frei.length < Math.min(anzahl, 3);
  const pool = sperreGelockert ? cards : frei;

  const gemischt = deterministischMischen(pool, datum);

  // Auffächern: die stärkste Aufwärts- und die stärkste Abwärtsbewegung des
  // Pools zuerst, dann auffüllen. So steht am Anfang etwas Konkretes, ohne
  // dass es immer die teuerste Karte ist.
  const mitTrend = gemischt.filter((c) => typeof c.trendPercent === 'number');
  const hoch = [...mitTrend].sort((a, b) => (b.trendPercent ?? 0) - (a.trendPercent ?? 0))[0];
  const runter = [...mitTrend].sort((a, b) => (a.trendPercent ?? 0) - (b.trendPercent ?? 0))[0];

  const gewaehlt: PokemonCard[] = [];
  for (const c of [hoch, runter]) {
    if (c && !gewaehlt.some((g) => g.id === c.id)) gewaehlt.push(c);
  }
  for (const c of gemischt) {
    if (gewaehlt.length >= anzahl) break;
    if (!gewaehlt.some((g) => g.id === c.id)) gewaehlt.push(c);
  }

  return {
    kandidaten: gewaehlt,
    gesperrteThemen: [...gesperrt].slice(0, 40),
    sperreGelockert,
  };
}

/**
 * Mischt reproduzierbar.
 *
 * KEIN `Math.random()`: Der Beitrag eines Tages muss bei jedem Aufruf derselbe
 * sein — sonst zeigt ein zweiter Seitenaufruf einen anderen Artikel, und
 * gespeichert würde der zuerst erzeugte. Das Datum als Startwert liefert
 * genau das: gleich innerhalb eines Tages, verschieden zwischen Tagen.
 */
export function deterministischMischen<T>(liste: T[], startwert: string): T[] {
  let z = 0;
  for (let i = 0; i < startwert.length; i++) z = (z * 31 + startwert.charCodeAt(i)) >>> 0;

  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    z = (z * 1664525 + 1013904223) >>> 0;
    const j = z % (i + 1);
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/** Kandidaten als Prompt-Text — dieselbe Form wie bisher. */
export function alsPromptText(cards: PokemonCard[]): string {
  return cards
    .map(
      (c) =>
        // toFixed erlaubt: Prompt-Text für die KI, wird nie angezeigt
        `${c.name} (${c.set}): ${displayPrice(c).toFixed(2)}€, Trend: ${(c.trendPercent ?? 0).toFixed(1)}%`,
    )
    .join('\n');
}
