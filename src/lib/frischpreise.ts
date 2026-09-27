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
  /**
   * Aktueller Trend gegen Ø 30 Tage, in Prozent — NUR wenn plausibel und durch
   * die Verkaeufe der letzten sieben Tage bestaetigt (`bestaetigteBewegung`).
   * Sonst `null`: Die Karte zaehlt dann nicht als Bewegung.
   */
  bewegung: number | null;
  /** Dieselbe Rechnung ohne Pruefung — nur zur Nachvollziehbarkeit. */
  bewegungRoh: number | null;
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
  /** Zwei Karten mit identischen Preisdaten — nicht eindeutig zugeordnet, beide verworfen. */
  mehrdeutig: number;
  /** Davon mit plausibler, durch die Verkaeufe bestaetigter Bewegung. */
  bestaetigt: number;
  fehler: number;
  ersterFehler: string | null;
  dauerMs: number;
}

const pfadFuer = (datum: string) => `marktdaten/${datum}.json`;

/** Ausreisser-Band der Seite (CLAUDE.md, Preis-Wahrheitspflicht): ⅓ bis 3× des Schnitts. */
function imBand(wert: number | null, bezug: number): boolean {
  return wert !== null && wert >= bezug / 3 && wert <= bezug * 3;
}

/**
 * Bewegung nur, wenn die Verkaeufe sie tragen.
 *
 * BEFUND beim ersten Lauf (27.09.2026): Ein Reel haette „Dark Dragoran
 * +1.459,1 %" gezeigt. Rohwerte: Trend 2.133 €, aber Ø 30 Tage 137 €,
 * Ø 7 Tage 100 €, Ø gestern 175 €. Kein Verkaufsschnitt stuetzt den Trend —
 * der 7-Tage-Schnitt zeigt sogar nach unten. Cardmarkets Trendwert reagiert
 * bei Karten mit wenigen Verkaeufen auf einzelne Angebote; gegen einen duennen
 * 30-Tage-Schnitt entstehen so Sprunge, die kein Markt sind.
 *
 * Regeln: (1) Trend und Ø 7 Tage liegen im Band ⅓–3× des 30-Tage-Schnitts —
 * dieselbe Ausreisser-Grenze, die die Seite fuer Ø 1 Tag verwendet;
 * (2) Ø 7 Tage zeigt in dieselbe Richtung und traegt mindestens die Haelfte
 * der Bewegung. Die ZAHL bleibt die Kennzahl der Seite (Trend gegen Ø 30) —
 * die Regeln entscheiden nur, ob sie gezeigt wird.
 */
export function bestaetigteBewegung(p: { trend: number; avg30: number | null; avg7: number | null }): number | null {
  if (p.avg30 === null || p.avg30 <= 0) return null;
  if (!imBand(p.trend, p.avg30) || !imBand(p.avg7, p.avg30)) return null;
  const mTrend = (p.trend - p.avg30) / p.avg30;
  const m7 = ((p.avg7 as number) - p.avg30) / p.avg30;
  if (mTrend === 0) return 0;
  if (Math.sign(m7) !== Math.sign(mTrend)) return null;
  if (Math.abs(m7) < Math.abs(mTrend) / 2) return null;
  return mTrend * 100;
}

/**
 * Karten mit identischen Preisdaten sind nicht eindeutig zugeordnet.
 *
 * Gemessen: `base5-5` und `base5-22` (Dark Dragoran, Holo und Nicht-Holo)
 * tragen bei TCGdex dieselben Werte — die Quelle legt zwei Karten auf eine
 * Cardmarket-Seite. Mindestens eine Zahl ist dann falsch; welche, laesst sich
 * nicht sagen. Beide fallen heraus.
 */
export function ohneMehrdeutige<T extends { preis: number; avg30: number | null; avg7: number | null; low: number | null }>(liste: T[]): T[] {
  const schluessel = (e: T) => `${e.preis}|${e.avg30}|${e.avg7}|${e.low}`;
  const anzahl = new Map<string, number>();
  for (const e of liste) anzahl.set(schluessel(e), (anzahl.get(schluessel(e)) ?? 0) + 1);
  return liste.filter((e) => anzahl.get(schluessel(e)) === 1);
}

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
    datum, geprueft: 0, frisch: 0, nichtZuordenbar: 0, veraltet: 0, mehrdeutig: 0, bestaetigt: 0,
    fehler: 0, ersterFehler: null, dauerMs: 0,
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
          id: z.id, preis: p.trend, bewegung: bestaetigteBewegung(p), bewegungRoh: bewegung(p),
          avg30: p.avg30, avg7: p.avg7, low: p.low, avg: p.avg, updated: p.updated, dexId: p.dexId,
        });
      } catch (err) {
        erg.fehler++;
        erg.ersterFehler ??= (err as Error).message;
      }
    }
  }
  await Promise.all(Array.from({ length: GLEICHZEITIG }, arbeiter));

  const eindeutig = ohneMehrdeutige(karten);
  erg.mehrdeutig = karten.length - eindeutig.length;
  erg.frisch = eindeutig.length;
  erg.bestaetigt = eindeutig.filter((k) => k.bewegung !== null).length;
  if (eindeutig.length > 0) {
    await schreibeJson(pfadFuer(datum), {
      datum, erzeugt: new Date().toISOString(), quelle: 'tcgdex', karten: eindeutig,
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
