import { listeOrdner } from './social-speicher';

// SCHUTZ FÜR OFFENE SCHREIBWEGE (seit v6.21.0).
//
// Vier Routen nehmen Daten von außen an, ohne Anmeldung: Feedback, Seitenzähler,
// Newsletter-Anmeldung, Portfolio-Preise. Security-Review 04.10.2026:
//   1. Der Körper wurde ohne Größengrenze gelesen (`request.json()`).
//   2. Jede fremde Webseite konnte die Routen ansprechen (kein Herkunfts-Check,
//      kein Inhaltstyp-Zwang — ein Formular mit text/plain reichte).
//   3. Die Mengenbremse zählte nur im Arbeitsspeicher EINER Instanz; Vercel
//      verteilt auf viele (dieselbe Falle wie Stolperstelle 66). Für Wege, die
//      Dateien anlegen, braucht es eine Grenze über alle Instanzen.
//
// Alles hier ist rein oder wirft nie — die Routen entscheiden über die Antwort.

/** Eigene Hosts. Andere Herkunft (Origin) wird abgewiesen. */
const EIGENE_HOSTS = new Set(['cardbeacon.de', 'www.cardbeacon.de', 'new-idea-livid.vercel.app', 'localhost']);

/**
 * Stammt die Anfrage von der eigenen Seite? (rein, getestet)
 *
 * Browser setzen bei POST immer `Origin`; fehlt er, schauen wir auf
 * `Sec-Fetch-Site`. Fehlt beides, ist es kein Browser (curl, Skript) — die
 * lassen sich ohnehin nicht über Kopfzeilen aufhalten, dafür gibt es die
 * Mengengrenzen. Was wir hier verhindern: dass FREMDE SEITEN die Browser
 * ihrer Besucher als Schleuder benutzen.
 */
export function herkunftErlaubt(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (EIGENE_HOSTS.has(host)) return true;
      // Vorschau-Deployments des eigenen Projekts
      return /^new-idea-[a-z0-9-]+\.vercel\.app$/.test(host);
    } catch {
      // catch erlaubt: unlesbarer Origin = fremd
      return false;
    }
  }
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';
  return true;
}

export type KoerperErgebnis =
  | { ok: true; daten: unknown }
  | { ok: false; status: 413 | 415 | 400; fehler: 'zu-gross' | 'typ' | 'ungueltig' };

/**
 * Liest einen JSON-Körper mit harter Größengrenze — auch wenn
 * `content-length` fehlt oder lügt. Verlangt `application/json`: Das kann ein
 * fremdes HTML-Formular nicht senden, ohne dass der Browser vorher nachfragt.
 */
export async function leseJsonBegrenzt(request: Request, maxBytes: number): Promise<KoerperErgebnis> {
  const typ = request.headers.get('content-type') || '';
  if (!/^application\/json\b/i.test(typ)) return { ok: false, status: 415, fehler: 'typ' };
  const angegeben = Number(request.headers.get('content-length') || 0);
  if (angegeben > maxBytes) return { ok: false, status: 413, fehler: 'zu-gross' };
  if (!request.body) return { ok: false, status: 400, fehler: 'ungueltig' };
  const leser = request.body.getReader();
  const teile: Uint8Array[] = [];
  let summe = 0;
  try {
    for (;;) {
      const { done, value } = await leser.read();
      if (done) break;
      summe += value.byteLength;
      if (summe > maxBytes) {
        await leser.cancel().catch(() => undefined);
        return { ok: false, status: 413, fehler: 'zu-gross' };
      }
      teile.push(value);
    }
    return { ok: true, daten: JSON.parse(Buffer.concat(teile).toString('utf8')) };
  } catch {
    // catch erlaubt: abgebrochener Stream oder kaputtes JSON = ungültig
    return { ok: false, status: 400, fehler: 'ungueltig' };
  }
}

/**
 * Tagesgrenze über ALLE Instanzen: zählt die Dateien im Tagesordner.
 * `true` = noch Platz. Ist der Speicher nicht lesbar, wird abgewiesen
 * (fail-closed) — lieber eine verlorene Meldung als ein volllaufender Speicher.
 */
export async function tagesKontingentFrei(ordner: string, max: number): Promise<boolean> {
  try {
    const namen = await listeOrdner(ordner, max + 1);
    return namen.length < max;
  } catch {
    // catch erlaubt: fail-closed, Ursache steht im Speicher-Log
    return false;
  }
}

/**
 * Tagesgrenze je Instanz — für Wege mit sehr vielen Aufrufen (Seitenzähler),
 * bei denen ein Ordner-Zählen je Aufruf zu teuer wäre. Begrenzt den Schaden
 * einer Flut auf `max × Instanzen` Dateien pro Tag statt unbegrenzt.
 */
export function instanzTagesgrenze(max: number) {
  let tag = '';
  let zaehler = 0;
  return (jetzt = new Date()): boolean => {
    const heute = jetzt.toISOString().slice(0, 10);
    if (heute !== tag) { tag = heute; zaehler = 0; }
    zaehler++;
    return zaehler <= max;
  };
}

/**
 * Text aus fremder Hand säubern (rein, getestet): Steuerzeichen außer
 * Zeilenumbruch/Tab, Richtungs-Überschreibungen (U+202A–202E, U+2066–2069)
 * und unsichtbare Zeichen (U+200B–200F, U+FEFF) raus, Unicode normalisiert,
 * höchstens zwei Leerzeilen am Stück.
 */
export function textSaeubern(roh: string): string {
  return roh
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Anzahl Links in einem Text (rein). */
export function anzahlLinks(text: string): number {
  return (text.match(/https?:\/\/|www\.[a-z0-9-]+\./gi) ?? []).length;
}
