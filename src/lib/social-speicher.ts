import { getSupabase } from './supabase';

// ABLAGE FUER INSTAGRAM-DATEIEN.
//
// Instagram holt Bilder und Videos SELBST ueber eine Adresse ab. Die Dateien
// liegen deshalb in Supabase Storage und werden mit einer signierten Adresse
// (zwei Stunden) uebergeben — der Eimer selbst bleibt privat.
//
// Aufgeraeumt wird bei jedem Lauf: Ein Reel hat rund 5 MB, vier pro Woche sind
// ueber ein Jahr ein Gigabyte — genau die Grenze des kostenlosen Supabase-
// Speichers. Nach der Veroeffentlichung braucht niemand die Datei mehr.

const EIMER = 'social';
const ORDNER = 'instagram';
/** Wie lange Dateien liegen bleiben — genug, um einen Fehlschlag nachzusehen. */
export const AUFBEWAHRUNG_TAGE = 14;

export interface Ablage {
  pfad: string;
  url: string;
}

// 40 MB, nicht mehr: Der kostenlose Supabase-Tarif erlaubt hoechstens 50 MB je
// Datei, und ein Eimer mit hoeherer Grenze laesst sich gar nicht anlegen
// („The object exceeded the maximum allowed size" — erster Lauf auf
// Produktion). Ein Reel hat rund 3 MB.
const EIMER_OPTIONEN = {
  public: false,
  fileSizeLimit: 40 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'video/mp4', 'application/json'],
};

let eimerGeprueft = false;

async function eimerSicherstellen(): Promise<void> {
  if (eimerGeprueft) return;
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.storage.createBucket(EIMER, EIMER_OPTIONEN);
  if (error && /already exists|duplicate/i.test(error.message)) {
    // Existiert schon: Einstellungen angleichen, sonst bliebe ein frueher
    // angelegter Eimer z. B. ohne JSON-Erlaubnis.
    const { error: upd } = await sb.storage.updateBucket(EIMER, EIMER_OPTIONEN);
    if (upd) console.warn('[social-speicher] Eimer-Einstellungen nicht angeglichen:', upd.message);
  } else if (error) {
    throw new Error(`Speicher-Eimer nicht anlegbar: ${error.message}`);
  }
  eimerGeprueft = true;
}

export async function ablegen(
  datum: string,
  name: string,
  daten: Buffer,
  typ: 'image/jpeg' | 'video/mp4',
): Promise<Ablage> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert — ohne Ablage kann Instagram die Datei nicht abholen');
  await eimerSicherstellen();

  const pfad = `${ORDNER}/${datum}/${name}`;
  const { error } = await sb.storage.from(EIMER).upload(pfad, daten, { contentType: typ, upsert: true });
  if (error) throw new Error(`Hochladen fehlgeschlagen (${pfad}): ${error.message}`);

  const { data, error: signFehler } = await sb.storage.from(EIMER).createSignedUrl(pfad, 7200);
  if (signFehler || !data?.signedUrl) {
    throw new Error(`Signierte Adresse fehlgeschlagen (${pfad}): ${signFehler?.message ?? 'leer'}`);
  }
  return { pfad, url: data.signedUrl };
}

/** Loescht Tagesordner, die aelter als die Aufbewahrungsfrist sind. Gibt die Anzahl geloeschter Dateien zurueck. */
export async function aufraeumen(heute: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  const grenze = new Date(`${heute}T00:00:00Z`);
  grenze.setUTCDate(grenze.getUTCDate() - AUFBEWAHRUNG_TAGE);
  const grenzeStr = grenze.toISOString().slice(0, 10);

  const { data: tage, error } = await sb.storage.from(EIMER).list(ORDNER, { limit: 1000 });
  if (error || !tage) return 0;

  let geloescht = 0;
  for (const tag of tage) {
    // Nur Ordner mit Datumsnamen; alles andere wird nicht angefasst.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tag.name) || tag.name >= grenzeStr) continue;
    const { data: dateien } = await sb.storage.from(EIMER).list(`${ORDNER}/${tag.name}`, { limit: 100 });
    const pfade = (dateien ?? []).map((d) => `${ORDNER}/${tag.name}/${d.name}`);
    if (pfade.length === 0) continue;
    const { error: lf } = await sb.storage.from(EIMER).remove(pfade);
    if (lf) console.warn('[social-speicher] Aufraeumen fehlgeschlagen:', lf.message);
    else geloescht += pfade.length;
  }
  return geloescht;
}

// ── Offene Veroeffentlichung ────────────────────────────────────────────────
//
// Meta braucht fuer ein Reel 30 bis 170 Sekunden Verarbeitung. Zusammen mit
// dem Rendern passt das nicht immer in die 300 s einer Funktion. Wird Meta
// nicht rechtzeitig fertig, merkt sich der Lauf den Container hier; der
// Nachhol-Cron eine Stunde spaeter veroeffentlicht ihn. Ein Container gilt
// bei Meta 24 Stunden.
//
// Als Datei im Eimer statt als Tabellenzeile — keine neue Tabelle, die still
// fehlen koennte (Stolperstelle 21).

export interface OffeneVeroeffentlichung {
  containerId: string;
  art: 'reel' | 'karussell' | 'story';
  erstellt: string;
}

const offenPfad = (datum: string) => `${ORDNER}/${datum}/offen.json`;

export async function merkeOffen(datum: string, offen: OffeneVeroeffentlichung[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert');
  await eimerSicherstellen();
  const { error } = await sb.storage
    .from(EIMER)
    .upload(offenPfad(datum), Buffer.from(JSON.stringify(offen)), { contentType: 'application/json', upsert: true });
  if (error) throw new Error(`Offene Veroeffentlichung nicht gemerkt: ${error.message}`);
}

export async function leseOffen(datum: string): Promise<OffeneVeroeffentlichung[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.storage.from(EIMER).download(offenPfad(datum));
  // Keine Datei ist der Normalfall.
  if (error || !data) return [];
  try {
    const roh = JSON.parse(await data.text()) as unknown;
    return Array.isArray(roh) ? (roh as OffeneVeroeffentlichung[]) : [];
  } catch (err) {
    console.warn('[social-speicher] offen.json unlesbar:', (err as Error).message);
    return [];
  }
}

export async function vergissOffen(datum: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.storage.from(EIMER).remove([offenPfad(datum)]);
  if (error) console.warn('[social-speicher] offen.json nicht geloescht:', error.message);
}

// ── Allgemeine JSON-Ablage ──────────────────────────────────────────────────
// Fuer Tagesstaende, die kein eigene Tabelle rechtfertigen (Stolperstelle 21:
// jede neue Tabelle ist eine Stelle, die still fehlen kann).

export async function schreibeJson(pfad: string, daten: unknown): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert');
  await eimerSicherstellen();
  const { error } = await sb.storage
    .from(EIMER)
    .upload(pfad, Buffer.from(JSON.stringify(daten)), { contentType: 'application/json', upsert: true });
  if (error) throw new Error(`${pfad} nicht gespeichert: ${error.message}`);
}

export async function leseJson<T>(pfad: string): Promise<T | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.storage.from(EIMER).download(pfad);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as T;
  } catch (err) {
    console.warn(`[social-speicher] ${pfad} unlesbar:`, (err as Error).message);
    return null;
  }
}

// ── Allgemeine Ablage (seit v6.10.0) ────────────────────────────────────────
//
// Fuer Daten, die sonst eine eigene Tabelle braeuchten — und eine eigene
// Tabelle braucht einen Handgriff im SQL-Editor, der nachweislich vergessen
// wird (Reichweitenmessung: von v6.5.0 bis v6.9.0 kein einziger Aufruf
// gezaehlt, weil `page_views` nie angelegt wurde). Der Eimer legt sich selbst an.

/** Legt eine kleine Datei ab (ueberschreibt nie etwas anderes als sich selbst). */
export async function legeAb(pfad: string, inhalt: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nicht konfiguriert');
  await eimerSicherstellen();
  const { error } = await sb.storage
    .from(EIMER)
    .upload(pfad, Buffer.from(inhalt), { contentType: 'application/json', upsert: true });
  if (error) throw new Error(`${pfad} nicht abgelegt: ${error.message}`);
}

/**
 * ALLE Eintraege eines Ordners — seitenweise. Der Speicher liefert hoechstens
 * 1.000 je Abfrage; ohne Weiterblaettern fiele der Rest still weg (dieselbe
 * Falle wie bei PostgREST, Stolperstelle 54).
 */
export async function listeOrdner(ordner: string, maxEintraege = 200_000): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const namen: string[] = [];
  for (let offset = 0; offset < maxEintraege; offset += 1000) {
    const { data, error } = await sb.storage.from(EIMER).list(ordner, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(`${ordner} nicht lesbar: ${error.message}`);
    const stapel = (data ?? []).map((d) => d.name).filter((n) => n && n !== '.emptyFolderPlaceholder');
    namen.push(...stapel);
    if ((data ?? []).length < 1000) break;
  }
  return namen;
}

/** Loescht Dateien in Stapeln zu 1.000. Gibt die Zahl geloeschter Dateien zurueck. */
export async function loescheDateien(pfade: string[]): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  let n = 0;
  for (let i = 0; i < pfade.length; i += 1000) {
    const teil = pfade.slice(i, i + 1000);
    const { error } = await sb.storage.from(EIMER).remove(teil);
    if (error) throw new Error(`Loeschen fehlgeschlagen: ${error.message}`);
    n += teil.length;
  }
  return n;
}
