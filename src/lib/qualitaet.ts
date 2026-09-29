import { findViolations } from './content-rules';

// QUALITÄTSSCHRANKEN FÜR ERZEUGTE TEXTE — rein, getestet, EINE Quelle.
//
// Nutzer-Auftrag 29.09.2026: „arbeite qualifying gates und retries ein, damit
// wir uns wirklich auf die Daten immer verlassen können."
//
// Die wichtigste Schranke ist die ZAHLENPROBE: Jede Prozent- und Euro-Angabe
// im erzeugten Text muss im Faktenblock stehen, den das Modell bekommen hat.
// Ein Sprachmodell rechnet, rundet und erinnert sich gern „plausibel" — genau
// das darf auf einer Seite, deren Kern Preise sind, nicht passieren. Scheitert
// eine Schranke, wird mit einem konkreten Korrekturhinweis neu erzeugt; hält
// sie nach den Wiederholungen immer noch nicht, wird NICHT veröffentlicht.

export interface Zahl {
  wert: number;
  einheit: '%' | '€';
  /** Nachkommastellen, wie im Text geschrieben — für die Rundungstoleranz. */
  stellen: number;
  roh: string;
}

// Zahl + Einheit. Tausenderpunkt, Dezimalkomma, normales/geschütztes/schmales
// Leerzeichen, „Prozent"/„EUR"/„Euro" als Wort, Vorzeichen (auch „−").
const ZAHL = /([+\-−]?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?\s?(%|Prozent\b|€|EUR\b|Euro\b)/g;

/** Alle Prozent- und Euro-Angaben eines Textes. */
export function zahlenImText(text: string): Zahl[] {
  const aus: Zahl[] = [];
  const norm = text.replace(/[   ]/g, ' ');
  for (const m of norm.matchAll(ZAHL)) {
    const ganz = m[2].replace(/\./g, '');
    const dez = m[3] ?? '';
    const betrag = Number(`${ganz}${dez ? `.${dez}` : ''}`);
    if (!Number.isFinite(betrag)) continue;
    const negativ = m[1] === '-' || m[1] === '−';
    aus.push({
      wert: negativ ? -betrag : betrag,
      einheit: /%|Prozent/.test(m[4]) ? '%' : '€',
      stellen: dez.length,
      roh: m[0].trim(),
    });
  }
  return aus;
}

/**
 * Zahlen im Text, die im Faktenblock NICHT vorkommen. Vergleich über den
 * BETRAG (ein Text darf „ein Minus von 16,6 %" schreiben, wo die Daten
 * „-16,6 %" sagen) und mit Rundung auf die im Text geschriebenen Stellen
 * („+29,7 %" in den Daten deckt „30 %" im Text).
 */
export function unbelegteZahlen(text: string, daten: string): Zahl[] {
  const belegt = zahlenImText(daten);
  const passt = (z: Zahl) =>
    belegt.some((b) => {
      if (b.einheit !== z.einheit) return false;
      const faktor = 10 ** z.stellen;
      return Math.round(Math.abs(b.wert) * faktor) === Math.round(Math.abs(z.wert) * faktor);
    });
  const offen = zahlenImText(text).filter((z) => !passt(z));
  // Dieselbe Zahl nur einmal melden.
  const gesehen = new Set<string>();
  return offen.filter((z) => (gesehen.has(z.roh) ? false : (gesehen.add(z.roh), true)));
}

export interface Verstoss {
  regel: string;
  detail: string;
}

/** Inhaltsregeln (Ich-Form, Kaufempfehlung, KI-Floskel, Emoji, unbelegte Ursache) — Preise im Text sind hier erlaubt. */
function regelVerstoesse(felder: Array<[string, string]>): Verstoss[] {
  return findViolations(felder)
    .filter((v) => v.rule !== 'preis-im-fliesstext')
    .map((v) => ({ regel: v.rule, detail: `${v.field}: „${v.match}"` }));
}

/** Pflicht-Abschnitte des Marktberichts (Neuheiten ist optional). */
export const BERICHT_ABSCHNITTE = ['## Marktlage', '## Trends', '## Ausblick'] as const;

/** Schranke für den Wochen-Marktbericht. Leer = veröffentlichungsfähig. */
export function berichtVerstoesse(text: string, daten: string, minZeichen: number): Verstoss[] {
  const v: Verstoss[] = [];
  if (text.trim().length < minZeichen) v.push({ regel: 'zu-kurz', detail: `${text.trim().length} von mindestens ${minZeichen} Zeichen` });
  for (const a of BERICHT_ABSCHNITTE) {
    if (!text.includes(a)) v.push({ regel: 'abschnitt-fehlt', detail: a });
  }
  for (const z of unbelegteZahlen(text, daten)) v.push({ regel: 'unbelegte-zahl', detail: z.roh });
  v.push(...regelVerstoesse([['bericht', text]]));
  return v;
}

/** Schranke für einen erzeugten Artikel (Zahlen gegen die gelieferten Daten + Inhaltsregeln). */
export function artikelVerstoesse(
  a: { title?: string; intro?: string; sections?: Array<{ heading: string; content: string }>; keyPoints?: string[] },
  daten: string,
): Verstoss[] {
  const felder: Array<[string, string]> = [
    ['titel', a.title ?? ''],
    ['intro', a.intro ?? ''],
    ...(a.sections ?? []).map((s, i): [string, string] => [`abschnitt ${i + 1}`, `${s.heading}\n${s.content}`]),
    ...(a.keyPoints ?? []).map((k, i): [string, string] => [`kernpunkt ${i + 1}`, k]),
  ];
  const v: Verstoss[] = [];
  for (const [feld, text] of felder) {
    for (const z of unbelegteZahlen(text, daten)) v.push({ regel: 'unbelegte-zahl', detail: `${feld}: ${z.roh}` });
  }
  v.push(...regelVerstoesse(felder));
  return v;
}

/** Korrekturhinweis für den nächsten Versuch — konkret, damit er wirkt. */
export function korrekturHinweis(v: Verstoss[]): string {
  if (v.length === 0) return '';
  const zeilen = v.slice(0, 12).map((x) => `- ${x.regel}: ${x.detail}`);
  return `\n\nKORREKTUR — der vorige Entwurf wurde abgelehnt:\n${zeilen.join('\n')}\nNenne ausschließlich Zahlen, die wörtlich in den gelieferten Daten stehen (keine eigenen Berechnungen, Differenzen oder Rundungen auf neue Werte). Halte alle Pflicht-Abschnitte und Inhaltsregeln ein.`;
}

export interface Versuchsergebnis<T> {
  ergebnis: T | null;
  verstoesse: Verstoss[];
  versuche: number;
}

/**
 * Erzeugt bis zu `max` Mal, bis die Schranke hält. Jeder Folgeversuch bekommt
 * den Korrekturhinweis des vorigen. Wirft der Erzeuger, zählt das als
 * Fehlversuch (mit Wartezeit), beim letzten Versuch wird weitergeworfen.
 */
export async function mitQualitaetsschranke<T>(
  erzeuge: (hinweis: string, versuch: number) => Promise<T>,
  pruefe: (t: T) => Verstoss[],
  { max = 3, warteMs = 2_000 }: { max?: number; warteMs?: number } = {},
): Promise<Versuchsergebnis<T>> {
  let hinweis = '';
  let letzte: Verstoss[] = [];
  for (let versuch = 1; versuch <= max; versuch++) {
    let t: T;
    try {
      t = await erzeuge(hinweis, versuch);
    } catch (err) {
      if (versuch === max) throw err;
      letzte = [{ regel: 'fehler', detail: err instanceof Error ? err.message.slice(0, 200) : 'unbekannt' }];
      await new Promise((r) => setTimeout(r, warteMs * versuch));
      continue;
    }
    letzte = pruefe(t);
    if (letzte.length === 0) return { ergebnis: t, verstoesse: [], versuche: versuch };
    console.warn(`[Qualitätsschranke] Versuch ${versuch}/${max} abgelehnt: ${letzte.map((v) => `${v.regel} (${v.detail})`).join('; ')}`);
    hinweis = korrekturHinweis(letzte);
  }
  return { ergebnis: null, verstoesse: letzte, versuche: max };
}

/** Allgemeine Wiederholung für Abrufe/Läufe mit wachsender Wartezeit. */
export async function mitWiederholung<T>(f: (versuch: number) => Promise<T>, { max = 3, warteMs = 1_000 } = {}): Promise<T> {
  let letzter: unknown;
  for (let versuch = 1; versuch <= max; versuch++) {
    try {
      return await f(versuch);
    } catch (err) {
      letzter = err;
      if (versuch < max) await new Promise((r) => setTimeout(r, warteMs * 2 ** (versuch - 1)));
    }
  }
  throw letzter;
}
