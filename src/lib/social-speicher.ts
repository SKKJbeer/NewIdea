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

async function eimerSicherstellen(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.storage.createBucket(EIMER, {
    public: false,
    fileSizeLimit: 100 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'video/mp4'],
  });
  // „existiert schon" ist der Normalfall und kein Fehler.
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`Speicher-Eimer nicht anlegbar: ${error.message}`);
  }
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
