import { getSupabase } from './supabase';
import { ladeDexSets, holeFrischenPreis, bewegung } from './tcgdex';
import { schreibeJson, leseJson } from './social-speicher';

// FRISCHPREISE — tagesaktuelle Cardmarket-Werte der wertvollsten Karten.
//
// Einmal am Tag: die N wertvollsten Karten aus dem eigenen Index nehmen, bei
// TCGdex den heutigen Cardmarket-Stand holen, gegen den Namen pruefen, und
// das Ergebnis als datierte Datei ablegen. Instagram und die Marktbilder
// lesen NUR diese Datei — sie ist das Einzige, dessen Aktualitaet belegt ist.
//
// Bewusst eine Datei im Speicher-Eimer statt Spalten im Kartenindex: Der
// Tagesdurchlauf ueberschreibt den Index jeden Morgen mit den alten Werten
// aus pokemontcg.io, und eine neue Spalte braeuchte eine Datenbankaenderung,
// die nur der Nutzer ausfuehren kann.

/** Wie viele Karten taeglich. ~400 Abrufe bei TCGdex — vertretbare Last. */
export const FRISCH_ANZAHL = 400;
/** Aelter als das gilt ein Preis nicht als frisch. */
export const FRISCH_MAX_TAGE = 3;
const GLEICHZEITIG = 4;

export interface FrischEintrag {
  id: string;
  /** Cardmarket-Preistrend in EUR. */
  preis: number;
  /** Aktueller Trend gegen Ø 30 Tage, in Prozent. `null` ohne 30-Tage-Wert. */
  bewegung: number | null;
  avg30: number | null;
  avg7: number | null;
  low: number | null;
  avg: number | null;
  /** Stand bei Cardmarket (ISO). */
  updated: string;
  dexId: string;
}

export interface FrischStand {
  /** Tag der Erhebung (YYYY-MM-DD, UTC). */
  datum: string;
  erzeugt: string;
  quelle: 'tcgdex';
  karten: FrischEintrag[];
}

export interface FrischErgebnis {
  datum: string;
  geprueft: number;
  frisch: number;
  nichtZuordenbar: number;
  veraltet: number;
  fehler: number;
  ersterFehler: string | null;
  dauerMs: number;
}

const pfadFuer = (datum: string) => `marktdaten/${datum}.json`;

interface IndexZeile {
  id: string;
  name: string;
  set_name: string;
  set_code: string;
  number: string | null;
}

export async function erfasseFrischpreise(anzahl = FRISCH_ANZAHL, jetzt = new Date()): Promise<FrischErgebnis> {
  const start = Date.now();
  const datum = jetzt.toISOString().slice(0, 10);
  const erg: FrischErgebnis = {
    datum, geprueft: 0, frisch: 0, nichtZuordenbar: 0, veraltet: 0, fehler: 0, ersterFehler: null, dauerMs: 0,
  };

  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert');
  const { data, error } = await sb
    .from('cards_index')
    .select('id, name, set_name, set_code, number')
    .gt('price', 0)
    .order('price', { ascending: false })
    .order('id', { ascending: true })
    .limit(Math.min(anzahl, 1000));
  if (error) throw new Error(`Kartenindex nicht lesbar: ${error.message}`);
  const zeilen = (data ?? []) as IndexZeile[];

  const dexSets = await ladeDexSets();
  const grenze = jetzt.getTime() - FRISCH_MAX_TAGE * 86_400_000;
  const karten: FrischEintrag[] = [];

  // Kleiner Pool statt Promise.all ueber 400 Abrufe — rueksichtsvoll gegenueber
  // einer freien Schnittstelle, und schnell genug (gemessen ~200 ms je Abruf).
  let naechster = 0;
  async function arbeiter() {
    while (naechster < zeilen.length) {
      const z = zeilen[naechster++];
      erg.geprueft++;
      try {
        const p = await holeFrischenPreis(
          { name: z.name, setCode: z.set_code, set: z.set_name, number: z.number ?? undefined },
          dexSets,
        );
        if (!p) { erg.nichtZuordenbar++; continue; }
        const t = Date.parse(p.updated);
        // Stolperstelle 46: eine Altersgrenze, die bei NaN durchwinkt, ist keine.
        if (!Number.isFinite(t) || t < grenze) { erg.veraltet++; continue; }
        karten.push({
          id: z.id, preis: p.trend, bewegung: bewegung(p), avg30: p.avg30, avg7: p.avg7,
          low: p.low, avg: p.avg, updated: p.updated, dexId: p.dexId,
        });
      } catch (err) {
        erg.fehler++;
        erg.ersterFehler ??= (err as Error).message;
      }
    }
  }
  await Promise.all(Array.from({ length: GLEICHZEITIG }, arbeiter));

  erg.frisch = karten.length;
  if (karten.length > 0) {
    await schreibeJson(pfadFuer(datum), {
      datum, erzeugt: new Date().toISOString(), quelle: 'tcgdex', karten,
    } satisfies FrischStand);
  }
  erg.dauerMs = Date.now() - start;
  return erg;
}

/** Juengster Frischstand: heute, sonst gestern. `null`, wenn keiner da ist. */
export async function leseFrischpreise(jetzt = new Date()): Promise<FrischStand | null> {
  for (let tage = 0; tage <= 1; tage++) {
    const datum = new Date(jetzt.getTime() - tage * 86_400_000).toISOString().slice(0, 10);
    const stand = await leseJson<FrischStand>(pfadFuer(datum));
    if (stand && Array.isArray(stand.karten) && stand.karten.length > 0) return stand;
  }
  return null;
}
