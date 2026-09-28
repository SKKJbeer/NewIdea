// KALENDERWOCHE NACH ISO 8601 — Woche 1 ist die mit dem ersten Donnerstag.
//
// Befund 28.09.2026: `currentWeek` zählte ab dem 1. Januar in Siebener-
// Schritten. 2026 beginnt an einem Donnerstag — die Zählung lag deshalb das
// ganze Jahr eine Woche zurück: Der Bericht vom 28.09. (ISO-KW 40) hieß
// „KW 39", ebenso wie der der Vorwoche in Wahrheit KW 39 war.

/** ISO-Kalenderwoche eines Datums (`YYYY-MM-DD` oder Date, UTC). */
export function isoKalenderwoche(datum: string | Date): number {
  const d0 = typeof datum === 'string' ? new Date(`${datum.slice(0, 10)}T00:00:00Z`) : datum;
  const d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate()));
  const tag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - tag); // Donnerstag derselben Woche
  const jahresbeginn = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - jahresbeginn) / 86_400_000 + 1) / 7);
}
