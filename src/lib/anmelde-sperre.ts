import { createHash, randomBytes } from 'crypto';
import { legeAb, listeOrdner, loescheDateien } from './social-speicher';

// VERSUCHSGRENZE FUER DIE STUDIO-ANMELDUNG — ueber alle Instanzen hinweg.
//
// Befund 27.09.2026 (Produktion): Die Grenze im Arbeitsspeicher griff nicht.
// 26 falsche Versuche hintereinander, keiner abgewiesen — Vercel verteilt die
// Anfragen auf mehrere Instanzen, und jede zaehlte fuer sich.
//
// Jetzt: je Fehlversuch eine leere Datei im Speicher-Eimer, Ordner = Hash der
// Adresse (die Adresse selbst wird nicht gespeichert), Dateiname = Zeitpunkt.
// Gezaehlt wird ueber die Ordnerliste. Keine Tabelle, kein Handgriff.

export const MAX_FEHLVERSUCHE = 10;
export const FENSTER_MS = 15 * 60_000;

function ordner(ip: string): string {
  const h = createHash('sha256').update(`cardbeacon-anmeldung:${ip}`).digest('hex').slice(0, 32);
  return `sicherheit/anmeldung/${h}`;
}

/** Zeitpunkte aus Dateinamen `<ms>-<zufall>`; Fremdes zaehlt nicht. Rein, testbar. */
export function fehlversucheImFenster(namen: string[], jetzt: number, fensterMs = FENSTER_MS): number {
  return namen
    .map((n) => Number(n.split('-')[0]))
    .filter((t) => Number.isFinite(t) && t > jetzt - fensterMs && t <= jetzt + 60_000).length;
}

/** Ist die Adresse gesperrt? Faellt der Speicher aus, gilt sie als NICHT gesperrt (Anmeldung bleibt moeglich). */
export async function istGesperrt(ip: string, jetzt = Date.now()): Promise<boolean> {
  try {
    const namen = await listeOrdner(ordner(ip), 2_000);
    // Nebenbei aufraeumen: abgelaufene Eintraege loeschen.
    const alt = namen.filter((n) => Number(n.split('-')[0]) <= jetzt - FENSTER_MS);
    if (alt.length > 0) loescheDateien(alt.map((n) => `${ordner(ip)}/${n}`)).catch(() => undefined);
    return fehlversucheImFenster(namen, jetzt) >= MAX_FEHLVERSUCHE;
  } catch (err) {
    console.warn('[anmelde-sperre] nicht pruefbar:', err instanceof Error ? err.message : err);
    return false;
  }
}

/** Diagnose fuer das Studio: Schluessel-Kurzform und Zaehlerstand. */
export async function sperrDiagnose(ip: string, jetzt = Date.now()): Promise<{ schluessel: string; fehlversuche: number | null; fehler: string | null }> {
  const schluessel = ordner(ip).split('/').pop()!.slice(0, 8);
  try {
    const namen = await listeOrdner(ordner(ip), 2_000);
    return { schluessel, fehlversuche: fehlversucheImFenster(namen, jetzt), fehler: null };
  } catch (err) {
    return { schluessel, fehlversuche: null, fehler: err instanceof Error ? err.message : 'unbekannt' };
  }
}

export async function merkeFehlversuch(ip: string, jetzt = Date.now()): Promise<void> {
  try {
    await legeAb(`${ordner(ip)}/${jetzt}-${randomBytes(4).toString('hex')}`, '1');
  } catch (err) {
    console.warn('[anmelde-sperre] Fehlversuch nicht gemerkt:', err instanceof Error ? err.message : err);
  }
}
