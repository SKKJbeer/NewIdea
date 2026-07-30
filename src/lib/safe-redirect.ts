// Weiterleitungs-Ziele prüfen.
//
// ANLASS: Die Anmelde-Rückkehr (`/auth/callback?next=…`) prüfte nur, ob das
// Ziel mit einem einzelnen `/` beginnt. Das reicht NICHT — der URL-Parser
// verändert die Zeichenkette, bevor der Browser sie sieht:
//
//   /\boese.de       → https://boese.de/   (Rückstrich zählt wie Schrägstrich)
//   /<TAB>/boese.de  → https://boese.de/   (Steuerzeichen werden entfernt)
//
// Beide Ziele bestanden die alte Prüfung. Damit ließ sich ein Link auf die
// echte Domain bauen, der nach erfolgreicher Anmeldung auf einer fremden Seite
// endet — der klassische Baustein für Phishing.
//
// LEHRE: Eine Zeichenkette gegen Muster zu prüfen genügt bei URLs nie. Es zählt
// nur, was nach dem Auflösen herauskommt — deshalb wird hier am Ende die
// Herkunft der fertigen URL verglichen.

/** Standard-Ziel, wenn nichts Gültiges übergeben wurde. */
export const DEFAULT_REDIRECT = '/portfolio';

/**
 * Gibt einen sicheren, seiteneigenen Pfad zurück — oder das Standard-Ziel.
 *
 * `origin` ist die eigene Herkunft; nur Ziele, die dorthin auflösen, kommen
 * durch.
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  origin: string,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) return fallback;

  // Steuerzeichen entfernt der URL-Parser stillschweigend — also vorher prüfen
  // und ablehnen statt bereinigen. Bereinigen würde ein bösartiges Ziel in ein
  // gültig aussehendes verwandeln.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;

  // Rückstrich zählt für den Parser wie ein Schrägstrich.
  if (raw.includes('\\')) return fallback;

  // Muss ein absoluter Pfad der eigenen Seite sein — kein Schema, kein Host.
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;

  // Letzte Instanz: auflösen und die Herkunft vergleichen.
  try {
    const aufgeloest = new URL(raw, origin);
    const eigen = new URL(origin);
    if (aufgeloest.origin !== eigen.origin) return fallback;
    return aufgeloest.pathname + aufgeloest.search + aufgeloest.hash;
  } catch {
    // catch erlaubt: ein nicht auflösbares Ziel wird nicht angesteuert.
    return fallback;
  }
}
