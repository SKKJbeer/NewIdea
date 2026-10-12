import { getSupabase } from './supabase';
import { schreibeJson, leseJson } from './social-speicher';
import { ladeSetListe } from './set-liste';
import { dexKandidaten, dexSetFuer, type DexSet } from './tcgdex';
import { dexSetsVorgehalten } from './frischpreis-karte';
import { SuchMotor, type SuchErgebnis, type SuchKarte } from './such-motor';

// SUCHINDEX — Datei im Speicher-Eimer, täglich gebaut (`/api/cron/suchindex`),
// zur Laufzeit je Instanz in den Arbeitsspeicher geladen (such-motor.ts).
//
// Inhalt je Karte: englischer Name, DEUTSCHE Namen (Kartenindex + TCGdex —
// TCGdex führt jede Karte auf Deutsch, auch Trainer: „Forschung des
// Professors", „Supertrank"), Set englisch + deutsch („Drachenwandel"),
// Set-Code, Nummer, gedruckte Gesamtzahl, Seltenheit, Preis (nur Rangfolge —
// angezeigt wird immer der frische Indexpreis).
//
// Schranke (`suchIndexPruefen`): Eine Datei ersetzt die alte nur, wenn sie
// praktisch den ganzen Kartenindex enthält und die deutschen Namen für den
// größten Teil gefunden wurden. Sonst bleibt die alte — eine halbe Suche wäre
// schlimmer als eine einen Tag alte.

export const PFAD_SUCHINDEX = 'suche/index.json';
/** Mindestens so viele Karten (gemessen 12.10.2026: 19.848 im Index). */
export const MIN_KARTEN = 15_000;
/** Mindestanteil mit deutschem Namen von TCGdex (Rest: Sets ohne TCGdex-Zuordnung). */
export const MIN_DE_ANTEIL = 0.6;
/** Älter als das → Suche fällt auf die Datenbank-Suche zurück. */
export const SUCHINDEX_MAX_TAGE = 3;

const DEX = 'https://api.tcgdex.net/v2';
const KOPF = { 'User-Agent': 'CardBeacon/1.0 (+https://cardbeacon.de)' };

/** Kompakte Zeile: [id, name, de (mit | getrennt), set, setDe, setCode, nummer, gesamt, seltenheit, preis]. */
type Zeile = [string, string, string, string, string, string, string, number, string, number];

export interface SuchIndexDatei {
  erstellt: string;
  karten: Zeile[];
  deAnteil: number;
}

// ── Rein ────────────────────────────────────────────────────────────────────

export function zuZeile(k: SuchKarte): Zeile {
  return [k.id, k.name, k.de.join('|'), k.set, k.setDe ?? '', k.setCode, k.nummer ?? '', k.gesamt ?? 0, k.seltenheit ?? '', Math.round(k.preis * 100) / 100];
}

export function ausZeile(z: Zeile): SuchKarte {
  return {
    id: z[0], name: z[1], de: z[2] ? z[2].split('|') : [], set: z[3], setDe: z[4] || null, setCode: z[5],
    nummer: z[6] || null, gesamt: z[7] || null, seltenheit: z[8] || null, preis: z[9],
  };
}

/** Deutsche Namen einer Karte, ohne Dubletten und ohne den englischen Namen. */
export function deutscheNamen(en: string, ...kandidaten: Array<string | null | undefined>): string[] {
  const gesehen = new Set([en.toLowerCase()]);
  const aus: string[] = [];
  for (const k of kandidaten) {
    const t = k?.trim();
    if (!t || gesehen.has(t.toLowerCase())) continue;
    gesehen.add(t.toLowerCase());
    aus.push(t);
  }
  return aus;
}

/** Schranke vor dem Ersetzen der Datei (rein). */
export function suchIndexPruefen(d: Pick<SuchIndexDatei, 'karten' | 'deAnteil'>, imKartenindex: number): { ok: boolean; befund: string } {
  const n = d.karten.length;
  const anteil = `${Math.round(d.deAnteil * 100)}\u00A0% mit deutschem Namen`;
  if (n < MIN_KARTEN) return { ok: false, befund: `Nur ${n} Karten (mindestens ${MIN_KARTEN})` };
  if (imKartenindex > 0 && n < imKartenindex * 0.98) return { ok: false, befund: `${n} von ${imKartenindex} Karten — unvollständig` };
  if (d.deAnteil < MIN_DE_ANTEIL) return { ok: false, befund: `${n} Karten, nur ${anteil} (mindestens ${Math.round(MIN_DE_ANTEIL * 100)}\u00A0%)` };
  return { ok: true, befund: `${n} Karten, ${anteil}` };
}

export function suchIndexAktuell(d: Pick<SuchIndexDatei, 'erstellt'> | null, jetzt = Date.now()): boolean {
  const t = d ? Date.parse(d.erstellt) : NaN;
  return Number.isFinite(t) && jetzt - t <= SUCHINDEX_MAX_TAGE * 86_400_000;
}

// ── Bauen ───────────────────────────────────────────────────────────────────

async function holeJson<T>(url: string, ms = 60_000): Promise<T> {
  let letzter: unknown = null;
  for (let v = 0; v < 3; v++) {
    try {
      const r = await fetch(url, { headers: KOPF, signal: AbortSignal.timeout(ms), cache: 'no-store' });
      if (r.ok) return (await r.json()) as T;
      letzter = new Error(`HTTP ${r.status}`);
    } catch (err) {
      letzter = err;
    }
    await new Promise((r) => setTimeout(r, 1_000 * 2 ** v));
  }
  throw new Error(`${url}: ${letzter instanceof Error ? letzter.message : String(letzter)}`);
}

interface IndexZeileSlim { id: string; name: string; name_de: string | null; set_name: string; set_code: string; number: string | null; rarity: string | null; price: number | null }

async function kartenindexKomplett(): Promise<IndexZeileSlim[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert');
  const { count, error: e0 } = await sb.from('cards_index').select('id', { count: 'exact', head: true });
  if (e0 || count === null) throw new Error(`Kartenindex zählen: ${e0?.message ?? 'keine Zahl'}`);
  const seiten = Math.ceil(count / 1000);
  const aus: IndexZeileSlim[] = [];
  // Je fünf Seiten gleichzeitig — PostgREST kappt jede Anfrage bei 1.000 Zeilen.
  for (let s = 0; s < seiten; s += 5) {
    const teile = await Promise.all(Array.from({ length: Math.min(5, seiten - s) }, async (_, k) => {
      const von = (s + k) * 1000;
      const { data, error } = await sb
        .from('cards_index')
        .select('id,name,name_de,set_name,set_code,number,rarity,price')
        .order('id', { ascending: true })
        .range(von, von + 999);
      if (error) throw new Error(`Kartenindex Seite ${s + k}: ${error.message}`);
      return (data ?? []) as IndexZeileSlim[];
    }));
    for (const t of teile) aus.push(...t);
  }
  return aus;
}

export async function baueSuchIndex(): Promise<{ ok: boolean; befund: string; karten: number }> {
  const [zeilen, deKarten, deSets, dexSets, setListe] = await Promise.all([
    kartenindexKomplett(),
    holeJson<Array<{ id: string; name: string }>>(`${DEX}/de/cards`),
    holeJson<Array<{ id: string; name: string }>>(`${DEX}/de/sets`),
    dexSetsVorgehalten(),
    ladeSetListe(250).catch(() => ({ sets: [] as Array<{ id: string; printedTotal?: number }> })),
  ]);
  const deName = new Map(deKarten.map((c) => [c.id, c.name]));
  const deSet = new Map(deSets.map((s) => [s.id, s.name]));
  const gedruckt = new Map(setListe.sets.map((s) => [s.id, s.printedTotal ?? 0]));
  const dexSetFuerCode = new Map<string, string | null>();

  let mitDe = 0;
  const karten: SuchKarte[] = zeilen.map((z) => {
    if (!dexSetFuerCode.has(z.set_code)) dexSetFuerCode.set(z.set_code, dexSetFuer(z.set_code, z.set_name, dexSets as DexSet[]));
    const dexSet = dexSetFuerCode.get(z.set_code) ?? null;
    const dexDe = dexSet && z.number ? dexKandidaten(dexSet, z.number).map((id) => deName.get(id)).find(Boolean) ?? null : null;
    if (dexDe) mitDe++;
    const setDe = dexSet ? deSet.get(dexSet) ?? null : null;
    return {
      id: z.id,
      name: z.name,
      de: deutscheNamen(z.name, z.name_de, dexDe),
      set: z.set_name,
      setDe: setDe && setDe.toLowerCase() !== z.set_name.toLowerCase() ? setDe : null,
      setCode: z.set_code,
      nummer: z.number,
      gesamt: gedruckt.get(z.set_code) || null,
      seltenheit: z.rarity || null,
      preis: Number(z.price) || 0,
    };
  });

  const datei: SuchIndexDatei = {
    erstellt: new Date().toISOString(),
    karten: karten.map(zuZeile),
    deAnteil: karten.length ? mitDe / karten.length : 0,
  };
  const pruefung = suchIndexPruefen(datei, zeilen.length);
  if (pruefung.ok) {
    await schreibeJson(PFAD_SUCHINDEX, datei);
    vorgehalten = null; // diese Instanz lädt beim nächsten Mal neu
  }
  return { ...pruefung, karten: karten.length };
}

// ── Laden & Suchen ──────────────────────────────────────────────────────────

let vorgehalten: { zeit: number; motor: SuchMotor | null; erstellt: string | null } | null = null;
let laedt: Promise<void> | null = null;
const NEU_LADEN_MS = 60 * 60_000;

function laden(): Promise<void> {
  laedt ??= (async () => {
    try {
      const d = await leseJson<SuchIndexDatei>(PFAD_SUCHINDEX);
      vorgehalten = suchIndexAktuell(d)
        ? { zeit: Date.now(), motor: new SuchMotor(d!.karten.map(ausZeile)), erstellt: d!.erstellt }
        : { zeit: Date.now(), motor: null, erstellt: d?.erstellt ?? null };
    } catch (err) {
      console.warn('[suchindex] nicht geladen:', err instanceof Error ? err.message : err);
      vorgehalten = { zeit: Date.now() - NEU_LADEN_MS + 60_000, motor: null, erstellt: null }; // in einer Minute erneut
    } finally {
      laedt = null;
    }
  })();
  return laedt;
}

/**
 * Suchmotor dieser Instanz — höchstens `wartenMs` warten. Ein veralteter Motor
 * antwortet sofort und lädt im Hintergrund neu. null = (noch) keiner → der
 * Aufrufer nimmt die Datenbank-Suche.
 */
export async function suchMotor(wartenMs = 1_500): Promise<SuchMotor | null> {
  if (vorgehalten && Date.now() - vorgehalten.zeit < NEU_LADEN_MS) return vorgehalten.motor;
  const l = laden();
  if (vorgehalten?.motor) return vorgehalten.motor; // veraltet, aber brauchbar
  await Promise.race([l, new Promise((r) => setTimeout(r, wartenMs))]);
  return vorgehalten?.motor ?? null;
}

/** Suche über den Motor — null, wenn keiner geladen ist (wirft nie). */
export async function sucheImMotor(eingabe: string, limit = 40): Promise<SuchErgebnis | null> {
  try {
    const m = await suchMotor();
    return m ? m.suche(eingabe, limit) : null;
  } catch (err) {
    console.warn('[suchindex] Suche fehlgeschlagen:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Stand für Diagnose und Gesundheitsprüfung (wirft nie). */
export async function suchIndexStand(): Promise<{ erstellt: string; karten: number; deAnteil: number } | null> {
  const d = await leseJson<SuchIndexDatei>(PFAD_SUCHINDEX).catch(() => null);
  return d ? { erstellt: d.erstellt, karten: d.karten.length, deAnteil: d.deAnteil } : null;
}
