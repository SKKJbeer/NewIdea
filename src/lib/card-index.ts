import { getSupabase } from './supabase';
import type { PokemonCard } from '@/types';

// EIGENER KARTENINDEX — damit die Suche nicht mehr nach außen geht.
//
// DAS PROBLEM, das damit endet: Jede Suche fragte die Kartendatenbank von
// außen. Gemessen kostet das beim ersten Aufruf eines Begriffs 6 bis 13
// Sekunden, und die Quelle antwortet auf zwei von drei gleichen Anfragen
// zeitweise mit einem Fehler. Zwischenspeicher haben das gemildert — sie helfen
// aber erst ab dem ZWEITEN Aufruf. Der erste Besucher zahlt weiterhin voll.
//
// DIE DATEN LIEGEN LÄNGST VOR. Der tägliche Durchlauf (`price-sweep.ts`) holt
// ohnehin JEDE Seite der Kartendatenbank — rund 20.500 Karten — und wirft
// davon alles außer dem Preis weg. Diese Tabelle behält den Rest: Name,
// deutscher Name, Set, Nummer, Seltenheit, Bild, Preis, Trend.
//
// Damit wird aus einem Netzaufruf über mehrere Sekunden eine Datenbankabfrage
// über wenige Millisekunden — und sie kann nicht mehr ausfallen, weil eine
// fremde Schnittstelle gerade streikt.
//
// WAS DAS NICHT ÄNDERT: Die Preise stammen weiterhin aus derselben Quelle und
// sind so aktuell wie der letzte Durchlauf. Der Index ist eine Kopie, kein
// zweiter Wahrheitsanspruch — deshalb steht sein Alter im Monitoring, und
// deshalb bleibt der Abruf von außen als Rückfall bestehen.

export interface IndexTreffer extends PokemonCard {
  /** Wann dieser Eintrag zuletzt aus der Quelle aufgefrischt wurde. */
  indexStand?: string;
}

/** Nur handelbare, vollständige Karten — dieselbe Regel wie in der Anzeige. */
function istIndexierbar(c: PokemonCard): boolean {
  return !!c.imageUrl && (c.prices?.market ?? 0) > 0;
}

/**
 * Schreibt Karten in den Index.
 *
 * Wird vom Tages-Durchlauf je Seite aufgerufen. `upsert` auf den Primärschlüssel:
 * Eine Karte, die es schon gibt, wird aufgefrischt statt verdoppelt.
 */
export async function upsertCardIndex(cards: PokemonCard[]): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Supabase nicht konfiguriert';

  const zeilen = cards.filter(istIndexierbar).map((c) => ({
    id: c.id,
    name: c.name,
    name_de: c.nameDe ?? null,
    set_name: c.set,
    set_code: c.setCode,
    number: c.number ?? null,
    rarity: c.rarity,
    image_url: c.imageUrl,
    price: c.prices.market ?? 0,
    trend: typeof c.trendPercent === 'number' ? c.trendPercent : null,
    real_data: c.realData === true,
    types: c.types ?? null,
    updated_at: new Date().toISOString(),
  }));
  if (zeilen.length === 0) return null;

  const { error } = await sb.from('cards_index').upsert(zeilen, { onConflict: 'id' });
  // Die ECHTE Meldung zurückgeben — ein `return false` hat in diesem Projekt
  // schon einmal wochenlang eine Diagnose verschluckt.
  return error ? error.message : null;
}

interface IndexZeile {
  id: string;
  name: string;
  name_de: string | null;
  set_name: string;
  set_code: string;
  number: string | null;
  rarity: string;
  image_url: string;
  price: number;
  trend: number | null;
  real_data: boolean;
  types: string[] | null;
  updated_at: string;
}

function zuKarte(z: IndexZeile): IndexTreffer {
  return {
    id: z.id,
    name: z.name,
    nameDe: z.name_de ?? undefined,
    set: z.set_name,
    setCode: z.set_code,
    number: z.number ?? undefined,
    rarity: z.rarity,
    imageUrl: z.image_url,
    types: z.types ?? undefined,
    prices: { market: Number(z.price) },
    trendPercent: z.trend === null ? undefined : Number(z.trend),
    realData: z.real_data,
    priceSource: 'cardmarket',
    indexStand: z.updated_at,
  };
}

/**
 * Sucht im eigenen Index.
 *
 * Sucht in BEIDEN Namensspalten. Der deutsche Name steht mit im Index, damit
 * „Glurak" nicht erst über eine Übersetzungstabelle laufen und dann als
 * „Charizard" nach außen gehen muss — die Übersetzung bleibt trotzdem als
 * Rückfall bestehen, weil der Index nicht jeden deutschen Namen kennt.
 *
 * Sortiert nach Preis absteigend, wie überall sonst.
 */
export async function searchCardIndex(query: string, limit = 40): Promise<IndexTreffer[]> {
  const sb = getSupabase();
  if (!sb) return [];

  // Platzhalter der Suchsprache entschärfen: `%` und `_` würden sonst als
  // Muster wirken und eine Eingabe wie „%" die ganze Tabelle zurückgeben.
  const begriff = query.trim().replace(/[%_\\]/g, '');
  if (begriff.length < 2) return [];

  const { data, error } = await sb
    .from('cards_index')
    .select('*')
    .or(`name.ilike.%${begriff}%,name_de.ilike.%${begriff}%`)
    .order('price', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[Kartenindex] Suche fehlgeschlagen:', error.message);
    return [];
  }
  return (data as unknown as IndexZeile[]).map(zuKarte);
}

/** Zeilenzahl und Datenstand — für das Monitoring. */
export async function cardIndexStand(): Promise<{ zeilen: number; stand: string | null }> {
  const sb = getSupabase();
  if (!sb) return { zeilen: 0, stand: null };

  const { count } = await sb.from('cards_index').select('*', { count: 'exact', head: true });
  const { data } = await sb
    .from('cards_index')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  return {
    zeilen: count ?? 0,
    stand: (data?.[0] as { updated_at?: string } | undefined)?.updated_at ?? null,
  };
}
