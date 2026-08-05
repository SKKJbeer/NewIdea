// RANGFOLGE DER SUCHTREFFER.
//
// BEFUND an der Produktion (05.08.2026), Eingabe „mew":
//
//   1. Mewtwo ★            1599,66 €
//   2. Mew δ                882,47 €
//   3. Mew ★ δ              633,76 €
//   4. Team Rocket's Mewtwo ex
//   5. Rocket's Mewtwo ex
//   6. Mew                  512,81 €
//
// Die Karte, die genau so heißt wie das Getippte, stand an sechster Stelle —
// hinter zwei Mewtwo und einem „Team Rocket's Mewtwo ex". Der Grund: Der Index
// sortiert ausschließlich nach Preis absteigend. Das ist eine Liste der
// teuersten passenden Karten, keine Liste der gemeinten.
//
// Der Preis bleibt trotzdem das zweite Kriterium, und zwar bewusst: Wer
// „charizard" tippt, will unter zwanzig Charizard-Karten zuerst die sehen, über
// die gesprochen wird — und das ist fast immer die teuerste. Preis ist hier ein
// Näherungswert für Bekanntheit, nicht für Wichtigkeit.

/** Je kleiner, desto besser der Treffer. `NICHT_GEFUNDEN` steht ganz hinten. */
export const NICHT_GEFUNDEN = 9;

/**
 * Wie gut passt ein Name auf die Eingabe?
 *
 * 0 — heißt genau so („mew" → „Mew")
 * 1 — fängt genau so an („mew" → „Mew ex", „Mew δ")
 * 2 — ein WORT fängt so an („mew" → „Shining Mew", „Team Rocket's Mew")
 * 3 — kommt irgendwo vor („mew" → „Mewtwo", „Amewtwo")
 *
 * Die Stufe 2 ist der eigentliche Gewinn: Sie trennt „Shining Mew" (ein Mew)
 * von „Mewtwo" (kein Mew). Ohne sie stünde beides gleichauf, und die
 * Reihenfolge entschiede wieder allein der Preis.
 */
export function namensRang(name: string, q: string): number {
  const n = name.trim().toLowerCase();
  const s = q.trim().toLowerCase();
  if (!n || !s) return NICHT_GEFUNDEN;

  if (n === s) return 0;
  if (n.startsWith(s)) return 1;

  // Wortanfang: Dem Treffer geht ein Zeichen voraus, das kein Buchstabe und
  // keine Ziffer ist. `\b` reicht dafür nicht — es kennt „δ" oder „é" nicht als
  // Buchstaben, und Kartennamen sind voll davon.
  let ab = 0;
  for (;;) {
    const i = n.indexOf(s, ab);
    if (i === -1) break;
    if (i === 0 || !/[\p{L}\p{N}]/u.test(n[i - 1])) return 2;
    ab = i + 1;
  }

  return n.includes(s) ? 3 : NICHT_GEFUNDEN;
}

/**
 * Bester Rang über beide Namensfelder.
 *
 * Beide zählen gleich: Wer „Glurak" tippt, meint die Karte genauso genau wie
 * jemand, der „Charizard" tippt. Ein Vorrang für den englischen Namen wäre eine
 * Aussage darüber, welche Sprache die richtige ist.
 */
export function trefferRang(
  name: string,
  nameDe: string | null | undefined,
  q: string,
): number {
  const a = namensRang(name, q);
  const b = nameDe ? namensRang(nameDe, q) : NICHT_GEFUNDEN;
  return Math.min(a, b);
}

/**
 * Kandidaten nach Rang, dann nach Preis ordnen.
 *
 * ERWARTET eine bereits nach Preis absteigend sortierte Liste — dann genügt ein
 * STABILER Sortiervorgang nach dem Rang allein, und die Preisordnung bleibt
 * innerhalb jeder Stufe erhalten. (`Array.prototype.sort` ist seit ES2019
 * garantiert stabil.) Ein zweites Sortierkriterium wäre hier nicht falsch, aber
 * es würde vortäuschen, dass die Eingangsreihenfolge egal ist — ist sie nicht:
 * Sie kommt aus der Datenbank und ist der Grund, warum diese Funktion so
 * einfach sein darf.
 */
export function nachRelevanz<T>(
  kandidaten: T[],
  q: string,
  namen: (t: T) => { name: string; nameDe?: string | null },
): T[] {
  return [...kandidaten].sort((a, b) => {
    const ra = namen(a);
    const rb = namen(b);
    return trefferRang(ra.name, ra.nameDe, q) - trefferRang(rb.name, rb.nameDe, q);
  });
}
