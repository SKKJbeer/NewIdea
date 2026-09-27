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

export async function ladeSetListe(limit = 24): Promise<{ sets: SetMeta[]; quelle: 'live' | 'gesichert' | 'keine' }> {
  try {
    const sets = await fetchRecentSets(limit);
    if (sets.length > 0) {
      // Sichern darf den Seitenaufbau nicht aufhalten oder scheitern lassen.
      schreibeJson(PFAD, { gesichert: new Date().toISOString(), sets } satisfies Gesichert).catch((err) =>
        console.warn('[set-liste] nicht gesichert:', err instanceof Error ? err.message : err),
      );
      return { sets, quelle: 'live' };
    }
  } catch (err) {
    console.warn('[set-liste] Live-Abruf fehlgeschlagen, nehme gesicherte Liste:', err instanceof Error ? err.message : err);
  }
  const alt = await leseJson<Gesichert>(PFAD).catch(() => null);
  if (alt && alt.sets.length > 0) return { sets: alt.sets.slice(0, limit), quelle: 'gesichert' };
  return { sets: [], quelle: 'keine' };
}
