import { fetchRecentSets, type SetMeta } from './pokemon-api';
import { schreibeJson, leseJson } from './social-speicher';

// SET-LISTE MIT GESICHERTEM RUECKFALL.
//
// Befund 27.09.2026: `/sets` zeigte auf Produktion „Noch keine Sets geladen".
// Die Liste kam nur live von pokemontcg.io; faellt der Abruf beim Build aus,
// wird der Leerzustand eingebacken und bleibt bis zur naechsten
// Neuvalidierung (24 h) stehen — bei jedem Deploy, der in einen Aussetzer
// faellt. Die Quelle antwortet regelmaessig mit 500/502 (Stolperstelle 28).
//
// Jetzt: Jede erfolgreich geladene Liste wird im Speicher-Eimer gesichert.
// Faellt die Quelle aus, kommt die letzte gesicherte Liste. Sets aendern sich
// hoechstens alle paar Wochen — ein Stand von gestern ist hier vollwertig.

const PFAD = 'daten/sets.json';

interface Gesichert {
  gesichert: string;
  sets: SetMeta[];
}

/**
 * Darf eine frisch geladene Liste die Sicherung ersetzen? (rein, getestet)
 *
 * Befund 03.10.2026: Die Sitemap führte nur 24 statt ~176 Sets. `/sets` lädt
 * mit `limit = 24` und überschrieb damit die Sicherung; fiel pokemontcg.io
 * danach aus, bekam die Sitemap (limit 250) aus der Sicherung nur noch 24.
 * Eine kürzere Liste ersetzt deshalb nie eine längere — außer die alte ist
 * älter als eine Woche (dann könnten Sets darin stehen, die es so nicht mehr gibt).
 */
export function sollSichern(neu: SetMeta[], alt: Gesichert | null, jetzt = Date.now()): boolean {
  if (neu.length === 0) return false;
  if (!alt || alt.sets.length === 0) return true;
  if (neu.length >= alt.sets.length) return true;
  const alter = jetzt - Date.parse(alt.gesichert);
  return Number.isFinite(alter) && alter > 7 * 86_400_000;
}

export async function ladeSetListe(limit = 24): Promise<{ sets: SetMeta[]; quelle: 'live' | 'gesichert' | 'keine' }> {
  try {
    const sets = await fetchRecentSets(limit);
    if (sets.length > 0) {
      // Sichern darf den Seitenaufbau nicht aufhalten oder scheitern lassen.
      leseJson<Gesichert>(PFAD)
        .catch(() => null)
        .then((alt) => (sollSichern(sets, alt)
          ? schreibeJson(PFAD, { gesichert: new Date().toISOString(), sets } satisfies Gesichert)
          : undefined))
        .catch((err) => console.warn('[set-liste] nicht gesichert:', err instanceof Error ? err.message : err));
      return { sets, quelle: 'live' };
    }
  } catch (err) {
    console.warn('[set-liste] Live-Abruf fehlgeschlagen, nehme gesicherte Liste:', err instanceof Error ? err.message : err);
  }
  const alt = await leseJson<Gesichert>(PFAD).catch(() => null);
  if (alt && alt.sets.length > 0) return { sets: alt.sets.slice(0, limit), quelle: 'gesichert' };
  return { sets: [], quelle: 'keine' };
}
