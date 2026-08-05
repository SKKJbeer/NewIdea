import { getSupabase } from './supabase';
import type { PokemonCard } from '@/types';
import { nachRelevanz } from './such-relevanz';

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
 * Sortiert nach RANG, dann nach Preis — siehe `such-relevanz.ts`. Nur nach
 * Preis war es eine Liste der teuersten passenden Karten, keine Liste der
 * gemeinten: Bei „mew" stand die Karte, die genau so heißt, an sechster Stelle.
 */
export async function searchCardIndex(query: string, limit = 40): Promise<IndexTreffer[]> {
  const sb = getSupabase();
  if (!sb) return [];

  // Platzhalter der Suchsprache entschärfen: `%` und `_` würden sonst als
  // Muster wirken und eine Eingabe wie „%" die ganze Tabelle zurückgeben.
  const begriff = query.trim().replace(/[%_\\]/g, '');
  if (begriff.length < 2) return [];

  // MEHR HOLEN, ALS ANGEZEIGT WIRD — sonst wirkt die Rangfolge nicht.
  //
  // Die Datenbank kann nur nach Preis sortieren. Wer genau passt, entscheidet
  // sich erst hier. Holten wir nur `limit` Zeilen, waere die beste Antwort
  // moeglicherweise gar nicht dabei: Bei „mew" stand die Karte, die genau so
  // heisst, an sechster Stelle NACH PREIS — bei einem engeren Fenster haette
  // sie auch dahinter liegen koennen.
  //
  // Fuenffach, gedeckelt: Das kostet in derselben Abfrage ein paar Millisekunden
  // mehr und bleibt server-seitig — nach aussen geht weiterhin nur `limit`.
  const fenster = Math.min(limit * 5, 200);

  const { data, error } = await sb
    .from('cards_index')
    .select('*')
    .or(`name.ilike.%${begriff}%,name_de.ilike.%${begriff}%`)
    .order('price', { ascending: false })
    .limit(fenster);

  if (error) {
    console.warn('[Kartenindex] Suche fehlgeschlagen:', error.message);
    return [];
  }

  const karten = (data as unknown as IndexZeile[]).map(zuKarte);
  return nachRelevanz(karten, begriff, (k) => ({ name: k.name, nameDe: k.nameDe })).slice(
    0,
    limit,
  );
}

/**
 * Der GESAMTE erfasste Bestand als Kartenliste — Grundlage des Marktindex.
 *
 * WARUM ES DAS GIBT: Der Index rechnete auf einer Stichprobe von rund 250
 * Karten aus drei Seltenheits-Abfragen. Das waren 204 auswertbare Karten aus
 * 15 Sets — bei 19.690 erfassten Karten aus 155 Sets. Eine Marktaussage aus
 * einem Prozent des Bestands, und ausgerechnet aus dem obersten
 * Seltenheitsband.
 *
 * Die Daten lagen längst hier. Der tägliche Durchlauf schreibt sie ohnehin.
 *
 * NUR FÜR KENNZAHLEN: Die Zeilen tragen absichtlich keine Namen und Bilder —
 * es geht um Preis, Trend und Set. Wer Karten ANZEIGEN will, nimmt
 * `searchCardIndex` oder den Live-Abruf.
 */
export async function indexKartenFuerIndex(): Promise<PokemonCard[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const SEITE = 1000;
  const MAX_SEITEN = 40;
  const karten: PokemonCard[] = [];

  for (let seite = 0; seite < MAX_SEITEN; seite++) {
    const von = seite * SEITE;
    const { data, error } = await sb
      .from('cards_index')
      .select('set_code,price,trend,real_data')
      .range(von, von + SEITE - 1);
    if (error) {
      console.warn('[Kartenindex] Bestand für Index nicht lesbar:', error.message);
      // Was schon gelesen wurde, ist echt und darf gezählt werden — ob es für
      // eine Aussage reicht, entscheidet `computePmi` selbst.
      return karten;
    }
    const stapel = (data ?? []) as Pick<IndexZeile, 'set_code' | 'price' | 'trend' | 'real_data'>[];
    for (const z of stapel) {
      karten.push({
        id: '',
        name: '',
        set: '',
        setCode: z.set_code,
        rarity: '',
        imageUrl: '',
        prices: { market: Number(z.price) },
        trendPercent: z.trend === null ? undefined : Number(z.trend),
        realData: z.real_data,
      } as PokemonCard);
    }
    if (stapel.length < SEITE) break;
  }
  return karten;
}

export interface SetTreffer {
  setCode: string;
  setName: string;
  hoechsterPreis: number;
}

/**
 * Sets im eigenen Index suchen.
 *
 * WARUM ES DAS BRAUCHT: Das Suchfeld verspricht „Suche Karten, Sets, …", und
 * die Startseite nennt Sets beim Namen („Black Bolt +6,7 %"). Wer das las und
 * „black bolt" eintippte, bekam „Keine Karten gefunden" und darunter den
 * Hinweis, es doch mit dem englischen Namen zu versuchen — der Name WAR
 * englisch, er gehört nur zu einem Set und nicht zu einer Karte. Eine Suche,
 * die etwas verspricht und dann in eine Sackgasse führt, ist schlimmer als
 * eine, die nichts verspricht.
 *
 * KEINE eigene Tabelle: Die Set-Namen stehen bereits in jeder Zeile des
 * Kartenindex. Eine zweite Tabelle wäre eine zweite Stelle, an der etwas
 * veralten kann — dieselbe Falle wie bei den ableitbaren Diagnosen
 * (Stolperstelle 21).
 *
 * Die Gruppierung passiert hier und nicht in der Datenbank: `distinct` gibt es
 * über den Supabase-Client nicht, und die Menge ist gedeckelt. Sortiert wird
 * nach dem höchsten Kartenpreis des Sets — wer einen Set-Namen tippt, meint
 * fast immer das bekanntere Set, und Bekanntheit schlägt sich im Preis nieder.
 */
export async function searchSetIndex(query: string, limit = 3): Promise<SetTreffer[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const begriff = query.trim().replace(/[%_\\]/g, '');
  if (begriff.length < 2) return [];

  // 400 Zeilen reichen: Ein Set hat höchstens ein paar hundert Karten, und die
  // teuersten stehen vorn. Ohne Deckel wäre das eine Volltabellen-Abfrage bei
  // jedem Tastendruck.
  const { data, error } = await sb
    .from('cards_index')
    .select('set_name,set_code,price')
    .ilike('set_name', `%${begriff}%`)
    .order('price', { ascending: false })
    .limit(400);

  if (error) {
    console.warn('[Kartenindex] Set-Suche fehlgeschlagen:', error.message);
    return [];
  }

  // BEWUSST OHNE KARTENZAHL. Sie liesse sich aus diesen Zeilen zaehlen — aber
  // nur die, die innerhalb der 400er-Grenze liegen. Bei einem grossen Set oder
  // zwei gleichzeitigen Treffern waere die Zahl zu niedrig, ohne dass man ihr
  // das ansieht. Eine stille Untertreibung ist genau die Sorte Zahl, die diese
  // Seite nicht anzeigt (siehe Preis-Wahrheitspflicht). Die genaue Zahl steht
  // auf der Set-Seite, die einen Klick entfernt ist.
  const proSet = new Map<string, SetTreffer>();
  for (const z of (data ?? []) as { set_name: string; set_code: string; price: number }[]) {
    if (proSet.has(z.set_code)) continue;
    proSet.set(z.set_code, {
      setCode: z.set_code,
      setName: z.set_name,
      // Die Zeilen kommen absteigend sortiert — die erste je Set ist die
      // teuerste.
      hoechsterPreis: Number(z.price),
    });
  }

  return [...proSet.values()]
    .sort((a, b) => b.hoechsterPreis - a.hoechsterPreis)
    .slice(0, limit);
}

/**
 * Karten anhand ihrer IDs aus dem eigenen Index holen.
 *
 * WOZU: Das Portfolio fragte jede Position einzeln bei der Kartendatenbank an.
 * Schlug ein Abruf fehl — und die Quelle antwortet dokumentiert auf etwa jede
 * dritte Anfrage mit einem Fehler (Stolperstelle 28) —, fiel die Position
 * komplett aus und die Oberfläche zeigte „Kein Marktpreis geladen". Bei sechs
 * Positionen traf es regelmäßig zwei bis drei.
 *
 * Der Index enthält dieselben Karten samt Preis, liegt in unserer eigenen
 * Datenbank und kann nicht aussetzen. Er ist damit der richtige Rückfall —
 * KEIN Ersatz: Sein Preis ist so aktuell wie der letzte Durchlauf, und genau
 * das muss die Oberfläche auch sagen.
 *
 * EINE Abfrage für alle IDs, nicht eine je Karte — sonst wäre der Rückfall
 * langsamer als das, was er ersetzt.
 */
export async function cardsFromIndex(ids: string[]): Promise<Map<string, IndexTreffer>> {
  const sb = getSupabase();
  const treffer = new Map<string, IndexTreffer>();
  if (!sb || ids.length === 0) return treffer;

  const { data, error } = await sb.from('cards_index').select('*').in('id', ids.slice(0, 200));
  if (error) {
    console.warn('[Kartenindex] Abruf nach IDs fehlgeschlagen:', error.message);
    return treffer;
  }
  for (const zeile of (data as unknown as IndexZeile[]) ?? []) {
    treffer.set(zeile.id, zuKarte(zeile));
  }
  return treffer;
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
