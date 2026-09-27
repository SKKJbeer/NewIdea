import { getSupabase } from './supabase';

// KARTENSEITEN FUER DIE SUCHMASCHINE.
//
// Bis v6.5.0 meldete die Sitemap 40 Kartenseiten — die 40 teuersten, live aus
// der Kartendatenbank. Jede der rund 20.000 Kartenseiten ist aber ein eigener
// Sucheinstieg („glurak ex 151 preis", „mew ex 151 wert"), und genau solche
// langen Suchanfragen sind der Weg, auf dem eine neue Seite ueberhaupt
// gefunden wird. Die Ids liegen laengst im eigenen Kartenindex.
//
// Reihenfolge: nach Preis absteigend. Google arbeitet eine neue Sitemap nicht
// auf einmal ab; die wertvollsten Karten sind auch die meistgesuchten und
// sollen zuerst drankommen.

/** Adressen je Teil-Sitemap. Google erlaubt 50.000 — kleiner ist schneller erzeugt und robuster. */
export const KARTEN_JE_TEIL = 5000;

/**
 * PostgREST liefert je Anfrage hoechstens 1.000 Zeilen (Server-Einstellung
 * `max-rows`), egal was `range` verlangt. Ohne Seitenweise-Abruf enthielte
 * jede Teil-Sitemap still nur 1.000 statt 5.000 Karten — dieselbe Art
 * stiller Kuerzung wie beim Kartenindex der Startseite.
 */
const SEITE = 1000;

export interface KartenEintrag {
  id: string;
  updated_at: string | null;
}

/**
 * Anzahl indexierter Karten. `null` = unbekannt (Datenbank nicht erreichbar,
 * Tabelle fehlt) — NICHT 0, siehe Stolperstelle 45.
 */
export async function kartenAnzahl(): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  // Mit Antwortkoerper statt `head: true`: Eine HEAD-Anfrage verschluckt
  // „Tabelle fehlt" und liefert still eine leere Zaehlung (Stolperstelle 45).
  const { count, error } = await sb.from('cards_index').select('id', { count: 'exact' }).limit(1);
  if (error) {
    console.warn('[sitemap-karten] Anzahl nicht lesbar:', error.message);
    return null;
  }
  return count ?? null;
}

export async function kartenTeil(teil: number): Promise<KartenEintrag[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const start = teil * KARTEN_JE_TEIL;
  const ende = start + KARTEN_JE_TEIL; // exklusiv
  const alle: KartenEintrag[] = [];

  for (let von = start; von < ende; von += SEITE) {
    const bis = Math.min(von + SEITE, ende) - 1;
    const { data, error } = await sb
      .from('cards_index')
      .select('id, updated_at')
      // Zweites Sortierkriterium: Bei gleichem Preis waere die Reihenfolge
      // sonst nicht stabil, und Karten koennten zwischen zwei Teilen
      // verrutschen — doppelt in einem, fehlend im anderen.
      .order('price', { ascending: false })
      .order('id', { ascending: true })
      .range(von, bis);
    if (error) {
      console.warn(`[sitemap-karten] Teil ${teil} ab ${von}:`, error.message);
      break;
    }
    const zeilen = (data ?? []) as KartenEintrag[];
    alle.push(...zeilen);
    if (zeilen.length < bis - von + 1) break; // Ende der Tabelle
  }
  return alle;
}

/** Anzahl der Teil-Sitemaps. Mindestens einer, damit die Adresse nie 404 liefert. */
export function teileFuer(anzahl: number | null): number {
  if (!anzahl || anzahl <= 0) return 1;
  return Math.ceil(anzahl / KARTEN_JE_TEIL);
}
