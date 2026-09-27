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
/**
 * GLOBALE GRENZE ueber alle Adressen. Gemessen 27.09.2026: Anfragen aus einem
 * Adress-Pool kamen bei Vercel mit jedesmal anderer Absenderadresse an — die
 * Grenze je Adresse greift dann nie. Mehr als 100 Fehlversuche in 15 Minuten
 * sind kein Vertippen; dann ist die Anmeldung fuer alle gesperrt. Eine
 * bestehende Studio-Sitzung (Cookie) bleibt davon unberuehrt.
 */
export const MAX_FEHLVERSUCHE_GESAMT = 100;
const ALLE = 'sicherheit/anmeldung-alle';
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
    if (fehlversucheImFenster(namen, jetzt) >= MAX_FEHLVERSUCHE) return true;
    const alle = await listeOrdner(ALLE, 5_000);
    const altAlle = alle.filter((n) => Number(n.split('-')[0]) <= jetzt - FENSTER_MS);
    if (altAlle.length > 0) loescheDateien(altAlle.map((n) => `${ALLE}/${n}`)).catch(() => undefined);
    return fehlversucheImFenster(alle, jetzt) >= MAX_FEHLVERSUCHE_GESAMT;
  } catch (err) {
    console.warn('[anmelde-sperre] nicht pruefbar:', err instanceof Error ? err.message : err);
    return false;
  }
}

/** Diagnose fuer das Studio: Schluessel-Kurzform und Zaehlerstand. */
export async function sperrDiagnose(ip: string, jetzt = Date.now()): Promise<{ schluessel: string; fehlversuche: number | null; gesamt: number | null; fehler: string | null }> {
  const schluessel = ordner(ip).split('/').pop()!.slice(0, 8);
  try {
    const [namen, alle] = await Promise.all([listeOrdner(ordner(ip), 2_000), listeOrdner(ALLE, 5_000)]);
    return { schluessel, fehlversuche: fehlversucheImFenster(namen, jetzt), gesamt: fehlversucheImFenster(alle, jetzt), fehler: null };
  } catch (err) {
    return { schluessel, fehlversuche: null, gesamt: null, fehler: err instanceof Error ? err.message : 'unbekannt' };
  }
}

export async function merkeFehlversuch(ip: string, jetzt = Date.now()): Promise<void> {
  try {
    const name = `${jetzt}-${randomBytes(4).toString('hex')}`;
    await Promise.all([legeAb(`${ordner(ip)}/${name}`, '1'), legeAb(`${ALLE}/${name}`, '1')]);
  } catch (err) {
    console.warn('[anmelde-sperre] Fehlversuch nicht gemerkt:', err instanceof Error ? err.message : err);
  }
}
