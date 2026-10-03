import { randomBytes } from 'crypto';
import { isValidEmail } from './rate-limit';
import { schreibeJson, leseJson, listeOrdner, loescheDateien } from './social-speicher';

// RÜCKMELDUNGEN VON BESUCHERN (seit v6.17.0).
//
// Nutzer-Auftrag (03.10.2026): „dass ich auch mal feedback bekomme". Bis
// hierhin gab es keinen einzigen Weg, der Seite etwas mitzuteilen, außer einer
// Mail-Adresse im Impressum.
//
// ABLAGE OHNE TABELLE — wie die Reichweitenmessung (Stolperstelle 21: eine
// Tabelle, die erst per SQL angelegt werden muss, fehlt still). Je Meldung
// eine Datei `feedback/<tag>/<zeit>-<zufall>.json`; neue Dateien überschreiben
// nie eine andere.
//
// GESPEICHERT WIRD NUR, WAS DER BESUCHER SELBST EINTRÄGT: Text, freiwillig eine
// Mail-Adresse, die Seite, auf der er war, und die Art. Keine IP, kein
// User-Agent, kein Cookie. Die Datenschutzerklärung (Abschnitt 8) zählt genau
// diese Felder auf — kommt eines dazu, gehört es dort hinein.

const ORDNER = 'feedback';
/** Aufbewahrung: Die Datenschutzerklärung nennt dieselbe Frist. */
export const FEEDBACK_AUFBEWAHRUNG_TAGE = 365;
export const FEEDBACK_MIN_ZEICHEN = 3;
export const FEEDBACK_MAX_ZEICHEN = 2000;

export const FEEDBACK_ARTEN = ['idee', 'fehler', 'lob', 'sonstiges'] as const;
export type FeedbackArt = (typeof FEEDBACK_ARTEN)[number];

export interface FeedbackEintrag {
  zeit: string;
  art: FeedbackArt;
  text: string;
  mail: string | null;
  pfad: string | null;
}

export type FeedbackPruefung =
  | { ok: true; eintrag: FeedbackEintrag }
  | { ok: false; fehler: 'zu-kurz' | 'zu-lang' | 'mail-ungueltig' | 'ungueltig' };

/** Prüft eine eingehende Meldung (rein, getestet). Wirft nie. */
export function pruefeFeedback(koerper: unknown, jetzt = new Date()): FeedbackPruefung {
  if (!koerper || typeof koerper !== 'object') return { ok: false, fehler: 'ungueltig' };
  const d = koerper as Record<string, unknown>;
  // Honigtopf: Das Feld ist für Menschen unsichtbar. Ist es gefüllt, war es
  // ein Formular-Roboter — die Antwort sieht trotzdem nach Erfolg aus.
  if (typeof d.website === 'string' && d.website.trim() !== '') return { ok: false, fehler: 'ungueltig' };
  const text = typeof d.text === 'string' ? d.text.replace(/\u0000/g, '').trim() : '';
  if (text.length < FEEDBACK_MIN_ZEICHEN) return { ok: false, fehler: 'zu-kurz' };
  if (text.length > FEEDBACK_MAX_ZEICHEN) return { ok: false, fehler: 'zu-lang' };
  const mailRoh = typeof d.mail === 'string' ? d.mail.trim() : '';
  if (mailRoh && !isValidEmail(mailRoh)) return { ok: false, fehler: 'mail-ungueltig' };
  const art = FEEDBACK_ARTEN.includes(d.art as FeedbackArt) ? (d.art as FeedbackArt) : 'sonstiges';
  const pfad = typeof d.pfad === 'string' && /^\/[^\s]{0,200}$/.test(d.pfad) ? d.pfad.split('?')[0] : null;
  return { ok: true, eintrag: { zeit: jetzt.toISOString(), art, text, mail: mailRoh || null, pfad } };
}

export async function speichereFeedback(e: FeedbackEintrag): Promise<void> {
  const tag = e.zeit.slice(0, 10);
  const name = `${e.zeit.replace(/[:.]/g, '-')}-${randomBytes(4).toString('hex')}.json`;
  await schreibeJson(`${ORDNER}/${tag}/${name}`, e);
}

/** Die neuesten Rückmeldungen, neueste zuerst. Wirft bei Speicherfehlern. */
export async function ladeFeedback(max = 50): Promise<FeedbackEintrag[]> {
  const tage = (await listeOrdner(ORDNER)).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t)).sort().reverse();
  const aus: FeedbackEintrag[] = [];
  for (const tag of tage) {
    const namen = (await listeOrdner(`${ORDNER}/${tag}`)).sort().reverse();
    const stapel = await Promise.all(namen.slice(0, max - aus.length).map((n) => leseJson<FeedbackEintrag>(`${ORDNER}/${tag}/${n}`)));
    aus.push(...stapel.filter((x): x is FeedbackEintrag => x !== null));
    if (aus.length >= max) break;
  }
  return aus;
}

/** Löscht Tagesordner älter als die Aufbewahrungsfrist. Wirft nie. */
export async function feedbackAufraeumen(heute = new Date().toISOString().slice(0, 10)): Promise<number> {
  try {
    const grenze = new Date(Date.parse(`${heute}T00:00:00Z`) - FEEDBACK_AUFBEWAHRUNG_TAGE * 86_400_000).toISOString().slice(0, 10);
    const alt = (await listeOrdner(ORDNER)).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t) && t < grenze);
    let n = 0;
    for (const tag of alt) {
      const namen = await listeOrdner(`${ORDNER}/${tag}`);
      n += await loescheDateien(namen.map((x) => `${ORDNER}/${tag}/${x}`));
    }
    return n;
  } catch (err) {
    console.warn('[feedback] Aufräumen fehlgeschlagen:', err instanceof Error ? err.message : err);
    return 0;
  }
}
