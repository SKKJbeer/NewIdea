import { getSupabase } from './supabase';
import { ladeDexSets, pruefeFrischenPreis, bewegung, type DexSet, type Fehlgrund } from './tcgdex';
import { standFrisch } from './frischpreis-karte';
import { schreibeJson, leseJson } from './social-speicher';
import { mitWiederholung } from './qualitaet';

// TAEGLICHER PREISDURCHLAUF — ALLE KARTEN, FRISCHE QUELLE.
//
// DAS HERZSTUECK DER SEITE. Bis v6.8.7 kamen die Preise im Kartenindex (Suche,
// Listen, CardBeacon Index) von pokemontcg.io — deren Cardmarket-Werte sind
// 3 bis 10 Monate alt (gemessen 27.09.2026). Der alte Durchlauf schrieb sie
// trotzdem jeden Tag neu, mit heutigem Datum, und legte sie als Tageswert in
// die Preishistorie. Das sah aus wie ein taeglich gepflegter Markt und war
// derselbe alte Wert, jeden Tag neu datiert.
//
// Dieser Durchlauf holt fuer JEDE Karte im Index den Cardmarket-Stand von
// TCGdex (Vortag), prueft die Zuordnung per Namensprobe und schreibt:
//   - den Preis in den Kartenindex, `updated_at` = QUELLSTAND (nicht „jetzt"),
//   - einen Tageswert in `price_snapshots`, `captured_on` = Tag des Quellstands.
//
// `updated_at` bedeutet damit ab v6.8.8 „wie alt ist dieser Preis" — genau die
// Frage, die Stolperstelle 53 verlangt. Der Marktindex rechnet nur noch aus
// Zeilen mit jungem Stand.
//
// Laeuft in Etappen: Der Stand liegt als Datei im Speicher-Eimer (keine neue
// Tabelle, Stolperstelle 21). Mehrere Crons am Morgen setzen fort, wo der
// vorige aufgehoert hat. Jede Etappe ist idempotent.

const STAND_PFAD = 'marktdaten/durchlauf.json';
/** Zeilen je Lesezugriff — PostgREST liefert hoechstens 1.000. */
const LESE_SEITE = 1000;
/** Karten je Schreibschritt. Danach wird der Stand gesichert. */
const SCHRITT = 200;
/** Gleichzeitige Abrufe bei TCGdex. Gemessen ~120/s bei 16; 8 ist hoeflich und reicht. */
const GLEICHZEITIG = 8;
/** Zeitlimit je TCGdex-Abruf. */
const ABRUF_MS = 8_000;

/**
 * QUALITAETSSCHRANKE: Mindestanteil frischer Preise nach einem vollstaendigen
 * Durchlauf. Gemessen am 27.09.2026 bei den 400 wertvollsten: 72 % — TCGdex hat
 * fuer viele Sonderkarten keinen Cardmarket-Preis (Stolperstelle 58). Faellt
 * der Anteil darunter, stimmt etwas mit der Quelle oder der Zuordnung nicht.
 */
export const MIN_FRISCH_ANTEIL = 0.5;
/** Ein Durchlauf, der laenger als das zurueckliegt, gilt als ausgefallen. */
export const MAX_DURCHLAUF_ALTER_TAGE = 1;

/** Grund, aus dem eine Karte keinen Tagespreis bekam. */
export type Grund = Fehlgrund | 'veraltet' | 'unplausibel';

/** Höchstzahl gespeicherter Belege je Grund — die Stand-Datei bleibt klein. */
export const BEISPIELE_JE_GRUND = 10;

/** Zählt eine Karte ohne Tagespreis und merkt sich die ersten Belege (rein, getestet). */
export function verbucheOhne(stand: DurchlaufStand, grund: Grund, detail?: string): void {
  stand.ohneFrischpreis++;
  stand.gruende[grund] = (stand.gruende[grund] ?? 0) + 1;
  if (!detail) return;
  const liste = ((stand.beispiele ??= {})[grund] ??= []);
  if (liste.length < BEISPIELE_JE_GRUND) liste.push(detail.slice(0, 200));
}

export interface DurchlaufStand {
  /** Tag (UTC), fuer den dieser Durchlauf zaehlt. */
  datum: string;
  /** Naechste zu lesende Zeile im Index (sortiert nach ID). */
  offset: number;
  fertig: boolean;
  geprueft: number;
  frisch: number;
  /** TCGdex hat die Karte, aber keinen Preis — oder er ist aelter als die Frist. */
  ohneFrischpreis: number;
  gruende: Partial<Record<Grund, number>>;
  /** Netz- oder Serverfehler bei TCGdex — zaehlen NICHT als „kein Preis". */
  fehler: number;
  /**
   * Karten mit Netz-/Serverfehler, die spätere Etappen desselben Tages erneut
   * prüfen. Befund 29.09.2026: 1.000 Karten fielen so aus und wurden nie
   * nachgeholt — der Durchlauf war nach drei Minuten „fertig", die fünf
   * übrigen Etappen des Tages taten nichts.
   */
  nachholen?: string[];
  /**
   * Bis zu `BEISPIELE_JE_GRUND` Belege je Grund (Karte + Detail), damit eine
   * steigende Zahl in `gruende` ohne Nachrechnen erklärbar ist (seit v6.16.1).
   */
  beispiele?: Partial<Record<Grund, string[]>>;
  schreibFehler: string | null;
  begonnen: string;
  aktualisiert: string;
  etappen: number;
}

export function neuerStand(datum: string, jetzt = new Date()): DurchlaufStand {
  return {
    datum, offset: 0, fertig: false, geprueft: 0, frisch: 0, ohneFrischpreis: 0,
    gruende: {}, fehler: 0, schreibFehler: null,
    begonnen: jetzt.toISOString(), aktualisiert: jetzt.toISOString(), etappen: 0,
  };
}

export async function leseDurchlaufStand(): Promise<DurchlaufStand | null> {
  return leseJson<DurchlaufStand>(STAND_PFAD);
}

/** Zeile des Kartenindex, wie sie gelesen und zurueckgeschrieben wird. */
interface IndexZeile {
  id: string;
  name: string;
  set_code: string;
  set_name: string;
  number: string | null;
  price: number;
  trend: number | null;
  real_data: boolean;
  updated_at: string;
  [weitere: string]: unknown;
}

export interface Aktualisierung {
  zeile: IndexZeile;
  snapshot: { card_id: string; card_name: string; price: number; source: string; captured_on: string };
}

/**
 * Rein: aus einer Indexzeile und einem frischen Preis die neue Zeile und den
 * Tageswert bilden. Die Bewegung ist dieselbe Groesse wie ueberall auf der
 * Seite: Preistrend gegen den 30-Tage-Schnitt.
 */
export function aktualisierung(
  z: IndexZeile,
  p: { trend: number; avg30: number | null; updated: string },
): Aktualisierung {
  const b = bewegung(p);
  return {
    zeile: {
      ...z,
      price: p.trend,
      trend: b === null ? null : Math.round(b * 10) / 10,
      real_data: p.avg30 !== null,
      updated_at: new Date(Date.parse(p.updated)).toISOString(),
    },
    snapshot: {
      card_id: z.id,
      card_name: z.name,
      price: p.trend,
      source: 'cardmarket',
      captured_on: p.updated.slice(0, 10),
    },
  };
}

async function mitBegrenzung<T, E>(liste: T[], n: number, f: (t: T) => Promise<E>): Promise<E[]> {
  const aus: E[] = new Array(liste.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, liste.length) }, async () => {
    while (i < liste.length) {
      const k = i++;
      aus[k] = await f(liste[k]);
    }
  }));
  return aus;
}

type Ergebnis =
  | { art: 'frisch'; a: Aktualisierung }
  | { art: 'ohne'; grund: Grund; detail?: string }
  | { art: 'fehler' };

/** Faktor, ab dem ein Wert gegen seinen Vergleichswert als Sprung gilt. */
export const SPRUNG_FAKTOR = 3;

const sprung = (a: number, b: number | null | undefined) =>
  typeof b === 'number' && b > 0 && a > 0 && (a / b > SPRUNG_FAKTOR || b / a > SPRUNG_FAKTOR);

/**
 * PLAUSIBILITÄTSSCHRANKE (seit v6.16.0). Rein, getestet.
 *
 * Ein neuer Preis-Trend, der mehr als das Dreifache von BEIDEN eigenen
 * Schnitten der Quelle (Ø 7 und Ø 30) abweicht, ist fast nie eine Markt-
 * bewegung, sondern ein Datenfehler — ein Einzelangebot, eine falsch
 * zugeordnete Variante. Steht bei uns ein frischer Vortagswert, muss der neue
 * Wert zusätzlich auch von DEM um das Dreifache abweichen. Dann bleibt der
 * alte Wert stehen, statt dass eine Fehlmessung Suche, Index und Verlauf
 * verzerrt.
 */
export function preisUnplausibel(
  neu: { trend: number; avg7: number | null; avg30: number | null },
  alt: { price: number; updated_at: string } | null,
  jetzt = Date.now(),
): boolean {
  if (!sprung(neu.trend, neu.avg7) || !sprung(neu.trend, neu.avg30)) return false;
  const altFrisch = alt && alt.price > 0 && jetzt - Date.parse(alt.updated_at) <= 3 * 86_400_000;
  return altFrisch ? sprung(neu.trend, alt.price) : true;
}

/** Beleg einer zurückgehaltenen Messung: neuer Trend gegen die Vergleichswerte. */
export function unplausibelBeleg(
  z: { id: string; name: string; price: number | string | null },
  p: { trend: number; avg7: number | null; avg30: number | null },
): string {
  const w = (x: number | string | null | undefined) => (x === null || x === undefined || x === '' ? '—' : String(x));
  return `${z.id} ${z.name}: Trend ${p.trend}, Ø7 ${w(p.avg7)}, Ø30 ${w(p.avg30)}, bisher ${w(z.price)}`;
}

async function pruefe(z: IndexZeile, dexSets: DexSet[], jetzt: number): Promise<Ergebnis> {
  try {
    // Ein Netz-/Serverfehler bekommt SOFORT einen zweiten Versuch; erst danach
    // landet die Karte auf der Nachholliste (Tagesfehler vom 29.09.: 1.000 Karten).
    const e = await mitWiederholung(
      () => pruefeFrischenPreis({ name: z.name, setCode: z.set_code, set: z.set_name, number: z.number ?? undefined }, dexSets, ABRUF_MS),
      { max: 2, warteMs: 800 },
    );
    if (!e.ok) return { art: 'ohne', grund: e.grund, detail: `${z.id}: ${e.detail}` };
    if (!standFrisch(e.preis.updated, jetzt)) {
      return { art: 'ohne', grund: 'veraltet', detail: `${z.id}: Quellstand ${e.preis.updated.slice(0, 10)}` };
    }
    if (preisUnplausibel(e.preis, { price: Number(z.price), updated_at: z.updated_at }, jetzt)) {
      return { art: 'ohne', grund: 'unplausibel', detail: unplausibelBeleg(z, e.preis) };
    }
    return { art: 'frisch', a: aktualisierung(z, e.preis) };
  } catch {
    return { art: 'fehler' };
  }
}

async function schreibe(akt: Aktualisierung[]): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Supabase nicht konfiguriert';
  if (akt.length === 0) return null;
  // Ganze Zeilen zurueckschreiben: `upsert` verlangt alle Pflichtspalten, und
  // sie liegen ohnehin vor (select *). So bleibt es EINE Anfrage je Schritt.
  const { error: e1 } = await sb.from('cards_index').upsert(akt.map((a) => a.zeile), { onConflict: 'id' });
  if (e1) return `Kartenindex: ${e1.message}`;
  const { error: e2 } = await sb.from('price_snapshots').upsert(akt.map((a) => a.snapshot), { onConflict: 'card_id,captured_on' });
  if (e2) return `Preisverlauf: ${e2.message}`;
  return null;
}

/**
 * Eine Etappe des Durchlaufs. Setzt fort, wo die vorige aufgehoert hat;
 * beginnt an einem neuen Tag von vorn. Wirft nur, wenn weder Index noch
 * Stand lesbar sind.
 */
export async function preisEtappe({
  budgetMs = 240_000,
  jetzt = () => Date.now(),
}: { budgetMs?: number; jetzt?: () => number } = {}): Promise<DurchlaufStand> {
  const start = jetzt();
  const datum = new Date(start).toISOString().slice(0, 10);
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert');

  const alt = await leseDurchlaufStand();
  const stand = alt && alt.datum === datum ? alt : neuerStand(datum, new Date(start));
  if (stand.fertig && !stand.nachholen?.length) return stand;
  stand.etappen += 1;

  const dexSets = await ladeDexSets();
  if (stand.fertig) return nachholRunde(stand, dexSets, start, budgetMs, jetzt);

  while (jetzt() - start < budgetMs) {
    const { data, error } = await sb
      .from('cards_index')
      .select('*')
      .order('id', { ascending: true })
      .range(stand.offset, stand.offset + LESE_SEITE - 1);
    if (error) throw new Error(`Kartenindex nicht lesbar: ${error.message}`);
    const zeilen = (data ?? []) as IndexZeile[];
    if (zeilen.length === 0) { stand.fertig = true; break; }

    let alleVerarbeitet = true;
    for (let i = 0; i < zeilen.length; i += SCHRITT) {
      if (jetzt() - start >= budgetMs) { alleVerarbeitet = false; break; }
      const teil = zeilen.slice(i, i + SCHRITT);
      const ergebnisse = await mitBegrenzung(teil, GLEICHZEITIG, (z) => pruefe(z, dexSets, jetzt()));

      const frisch: Aktualisierung[] = [];
      ergebnisse.forEach((e, k) => {
        if (e.art === 'frisch') frisch.push(e.a);
        else if (e.art === 'ohne') verbucheOhne(stand, e.grund, e.detail);
        else {
          stand.fehler++;
          (stand.nachholen ??= []).push(teil[k].id);
        }
      });
      const sf = await schreibe(frisch);
      if (sf) {
        // Nicht weiterzaehlen: Der Schritt wird in der naechsten Etappe
        // wiederholt, statt als erledigt zu gelten.
        stand.schreibFehler = sf;
        stand.aktualisiert = new Date(jetzt()).toISOString();
        await schreibeJson(STAND_PFAD, stand);
        return stand;
      }
      stand.schreibFehler = null;
      stand.frisch += frisch.length;
      stand.geprueft += teil.length;
      stand.offset += teil.length;
      stand.aktualisiert = new Date(jetzt()).toISOString();
      await schreibeJson(STAND_PFAD, stand);
    }
    // Eine unvollstaendige Seite, ganz verarbeitet: Das Ende des Index ist erreicht.
    if (alleVerarbeitet && zeilen.length < LESE_SEITE) { stand.fertig = true; break; }
  }

  // Restzeit gleich für einen ersten Nachholversuch nutzen.
  if (stand.fertig && stand.nachholen?.length && jetzt() - start < budgetMs) {
    return nachholRunde(stand, dexSets, start, budgetMs, jetzt);
  }
  stand.aktualisiert = new Date(jetzt()).toISOString();
  await schreibeJson(STAND_PFAD, stand);
  return stand;
}

/**
 * Prüft Karten mit Netz-/Serverfehler erneut. Was jetzt einen Preis (oder
 * einen belegten Grund ohne Preis) bekommt, verlässt die Liste; echte Fehler
 * bleiben für die nächste Etappe stehen.
 */
async function nachholRunde(
  stand: DurchlaufStand,
  dexSets: DexSet[],
  start: number,
  budgetMs: number,
  jetzt: () => number,
): Promise<DurchlaufStand> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert');
  const offen = [...(stand.nachholen ?? [])];
  const bleibt: string[] = [];
  for (let i = 0; i < offen.length; i += SCHRITT) {
    const ids = offen.slice(i, i + SCHRITT);
    if (jetzt() - start >= budgetMs) { bleibt.push(...ids); continue; }
    const { data, error } = await sb.from('cards_index').select('*').in('id', ids);
    if (error) { bleibt.push(...ids); continue; }
    const zeilen = (data ?? []) as IndexZeile[];
    const ergebnisse = await mitBegrenzung(zeilen, GLEICHZEITIG, (z) => pruefe(z, dexSets, jetzt()));
    const frisch = ergebnisse.flatMap((e) => (e.art === 'frisch' ? [e.a] : []));
    // Erst schreiben, dann verbuchen: Scheitert das Schreiben, bleibt der
    // ganze Schritt offen und zählt unverändert als Fehler.
    const sf = await schreibe(frisch);
    if (sf) {
      stand.schreibFehler = sf;
      bleibt.push(...ids);
      continue;
    }
    stand.schreibFehler = null;
    ergebnisse.forEach((e, k) => {
      if (e.art === 'fehler') { bleibt.push(zeilen[k].id); return; }
      stand.fehler = Math.max(0, stand.fehler - 1);
      if (e.art === 'frisch') stand.frisch++;
      else verbucheOhne(stand, e.grund, e.detail);
    });
    // Nicht mehr im Index vorhandene Karten gelten als erledigt.
    const gefunden = new Set(zeilen.map((z) => z.id));
    stand.fehler = Math.max(0, stand.fehler - ids.filter((id) => !gefunden.has(id)).length);
  }
  stand.nachholen = bleibt;
  stand.aktualisiert = new Date(jetzt()).toISOString();
  await schreibeJson(STAND_PFAD, stand);
  return stand;
}

export interface PreisGate {
  ok: boolean;
  /** Klartext fuer Monitoring und Cron-Antwort. */
  befund: string;
  anteil: number | null;
}

/**
 * QUALITAETSSCHRANKE „Preise von heute". Rein, damit sie testbar ist.
 * Nicht bestanden, wenn der Durchlauf fehlt, zu alt ist, nicht fertig wurde,
 * beim Schreiben scheiterte oder zu wenige frische Preise brachte.
 */
export function preisGate(stand: DurchlaufStand | null, heute: string): PreisGate {
  if (!stand) return { ok: false, befund: 'Kein Preisdurchlauf gefunden', anteil: null };
  const alter = (Date.parse(`${heute}T00:00:00Z`) - Date.parse(`${stand.datum}T00:00:00Z`)) / 86_400_000;
  if (!Number.isFinite(alter) || alter > MAX_DURCHLAUF_ALTER_TAGE) {
    return { ok: false, befund: `Letzter Preisdurchlauf vom ${stand.datum} — seitdem keine neuen Preise`, anteil: null };
  }
  if (stand.schreibFehler) return { ok: false, befund: `Schreiben fehlgeschlagen: ${stand.schreibFehler}`, anteil: null };
  const anteil = stand.geprueft > 0 ? stand.frisch / stand.geprueft : 0;
  if (!stand.fertig) {
    return { ok: alter < 1, befund: `Durchlauf ${stand.datum} laeuft: ${stand.geprueft} geprueft, ${stand.frisch} frisch`, anteil };
  }
  if (anteil < MIN_FRISCH_ANTEIL) {
    return { ok: false, befund: `Nur ${Math.round(anteil * 100)}\u00A0% frische Preise (Schwelle ${Math.round(MIN_FRISCH_ANTEIL * 100)}\u00A0%)`, anteil };
  }
  return { ok: true, befund: `${stand.frisch} von ${stand.geprueft} Karten mit Preis vom Vortag (${Math.round(anteil * 100)}\u00A0%)`, anteil };
}
