import { preisGate, leseDurchlaufStand, type DurchlaufStand } from './preis-durchlauf';
import { sprachpreisGate, leseSprachStand } from './sprachpreise';
import { leseNeuheiten, type NeuheitenDatei } from './neuheiten';
import { leseFrischpreise, type FrischStand } from './frischpreise';
import { loadLatestMarketIndex } from './market-index-store';
import { listMarketReportMeta } from './market-report-storage';
import { loadArticle } from './article-storage';
import { listGeneratedGuideMeta } from './guide-storage';
import { currentWeek } from './market-report-generator';
import { getArticleType, artikelPreiseVeraltet } from './article-generator';
import { schreibeJson, leseJson } from './social-speicher';

// TÄGLICHE GESUNDHEITSPRÜFUNG ALLER DATEN — seit v6.16.0.
//
// Nutzer-Auftrag 29.09.2026: „damit wir uns wirklich auf die Daten immer
// verlassen können". Jede Pipeline hat ihre eigene Schranke; diese Prüfung
// hält sie alle zusammen, einmal am Tag NACH dem letzten Lauf (12:30 UTC).
// Scheitert eine, antwortet der Cron mit HTTP 500 — sichtbar als roter Cron
// bei Vercel — und der Befund steht im Monitoring ganz oben.
//
// Zeitbewusst: Ein Punkt zählt erst, wenn sein Cron gelaufen sein SOLLTE
// (Fehlalarm vor dem geplanten Lauf, Audit 29.09.2026).

export interface Pruefpunkt {
  name: string;
  ok: boolean;
  befund: string;
}

export interface Gesundheit {
  geprueft: string;
  ok: boolean;
  punkte: Pruefpunkt[];
}

export interface Eingaben {
  preisStand: DurchlaufStand | null;
  sprachGate: { ok: boolean; befund: string } | null;
  neuheiten: NeuheitenDatei | null;
  frisch: FrischStand | null;
  indexTag: string | null;
  berichtWoche: string | null;
  artikel: { vorhanden: boolean; ersatz: boolean; altePreise: boolean } | null;
  letzterGuide: string | null;
}

const minuten = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();
const tag = (d: Date) => d.toISOString().slice(0, 10);
const vorTagen = (d: Date, n: number) => tag(new Date(d.getTime() - n * 86_400_000));

/** Rein: bewertet alle Pipelines zum Zeitpunkt `jetzt`. */
export function bewerte(e: Eingaben, jetzt: Date): Pruefpunkt[] {
  const heute = tag(jetzt);
  const m = minuten(jetzt);
  const p: Pruefpunkt[] = [];

  // Tagespreise (Etappen ab 02:05 UTC).
  if (m >= 2 * 60 + 30) {
    const g = preisGate(e.preisStand, heute);
    const offen = e.preisStand?.nachholen?.length ?? 0;
    p.push({ name: 'Tagespreise', ok: g.ok, befund: `${g.befund}${offen ? ` · ${offen} Karten warten auf Nachholung` : ''}` });
  }
  // Sprachpreise JP/KR (01:35 UTC).
  if (m >= 2 * 60) {
    p.push({ name: 'Sprachpreise', ok: e.sprachGate?.ok ?? false, befund: e.sprachGate?.befund ?? 'Kein Stand gefunden' });
  }
  // Trends & Neuheiten (01:50 UTC) — Stand = Datum des Cardmarket-Preisverzeichnisses.
  if (m >= 2 * 60 + 10) {
    const stand = e.neuheiten?.stand?.slice(0, 10) ?? null;
    const ok = stand !== null && stand >= vorTagen(jetzt, 1);
    p.push({ name: 'Trends & Neuheiten', ok, befund: stand ? `Preisverzeichnis vom ${stand}` : 'Keine Themen-Datei' });
  }
  // Top 400 mit bestätigten Bewegungen (10:15 UTC).
  if (m >= 10 * 60 + 45) {
    const ok = e.frisch?.datum === heute && (e.frisch?.karten.length ?? 0) >= 100;
    p.push({ name: 'Frischpreise Top 400', ok, befund: e.frisch ? `Stand ${e.frisch.datum}, ${e.frisch.karten.length} Karten` : 'Keine Datei' });
  }
  // Marktindex (08:00 UTC).
  if (m >= 8 * 60 + 30) {
    p.push({ name: 'Marktindex', ok: e.indexTag === heute, befund: e.indexTag ? `Letzter Stand ${e.indexTag}` : 'Kein Indexstand' });
  }
  // Wochenbericht (Montag 07:00 UTC) — ab Montag 07:45 muss die laufende Woche stehen.
  const wochentag = jetzt.getUTCDay();
  if (wochentag !== 1 || m >= 7 * 60 + 45) {
    const soll = currentWeek(jetzt).weekStart;
    p.push({ name: 'Marktbericht', ok: e.berichtWoche === soll, befund: e.berichtWoche ? `Letzter Bericht für die Woche ab ${e.berichtWoche} (erwartet ${soll})` : 'Kein Bericht' });
  }
  // Artikel (So/Do 08:00 UTC).
  if (getArticleType(heute) && m >= 8 * 60 + 30) {
    const a = e.artikel;
    const ok = !!a && a.vorhanden && !a.ersatz && !a.altePreise;
    const befund = !a || !a.vorhanden ? 'Heute fällig, nicht vorhanden' : a.ersatz ? 'Nur Ersatztext (Erzeugung oder Qualitätsschranke gescheitert)' : 'Erschienen';
    p.push({ name: 'Artikel', ok, befund });
  }
  // Guide (Di/Fr 08:00 UTC).
  if ((wochentag === 2 || wochentag === 5) && m >= 8 * 60 + 30) {
    const ok = e.letzterGuide !== null && e.letzterGuide.slice(0, 10) === heute;
    p.push({ name: 'Guide', ok, befund: e.letzterGuide ? `Letzter Guide vom ${e.letzterGuide.slice(0, 10)}` : 'Noch kein Guide' });
  }
  return p;
}

export const PFAD_GESUNDHEIT = 'gesundheit/letzte.json';

/** Lädt alle Eingaben (wirft nie), bewertet, legt das Ergebnis ab. */
export async function pruefeGesundheit(jetzt = new Date()): Promise<Gesundheit> {
  const heute = tag(jetzt);
  const [preisStand, sprach, neuheiten, frisch, index, berichte, artikel, guides] = await Promise.all([
    leseDurchlaufStand().catch(() => null),
    leseSprachStand().catch(() => ({ zuordnung: null, preise: null })),
    leseNeuheiten().catch(() => null),
    leseFrischpreise(jetzt).catch(() => null),
    loadLatestMarketIndex(7).catch(() => null),
    listMarketReportMeta().catch(() => []),
    getArticleType(heute) ? loadArticle(heute).catch(() => null) : Promise.resolve(null),
    listGeneratedGuideMeta().catch(() => []),
  ]);
  const letzterGuide = guides.map((g) => g.createdAt).filter((c): c is string => !!c).sort().pop() ?? null;
  const punkte = bewerte(
    {
      preisStand,
      sprachGate: sprachpreisGate(sprach.zuordnung, sprach.preise, jetzt.getTime()),
      neuheiten,
      frisch,
      indexTag: index?.date?.slice(0, 10) ?? null,
      berichtWoche: berichte[0]?.weekStart ?? null,
      artikel: artikel
        ? { vorhanden: true, ersatz: artikel.isStatic === true, altePreise: artikelPreiseVeraltet(artikel) }
        : { vorhanden: false, ersatz: false, altePreise: false },
      letzterGuide,
    },
    jetzt,
  );
  const g: Gesundheit = { geprueft: jetzt.toISOString(), ok: punkte.every((x) => x.ok), punkte };
  await Promise.all([
    schreibeJson(PFAD_GESUNDHEIT, g),
    schreibeJson(`gesundheit/${heute}.json`, g),
  ]).catch((err) => console.warn('[Gesundheit] nicht abgelegt:', err instanceof Error ? err.message : err));
  return g;
}

export async function leseGesundheit(): Promise<Gesundheit | null> {
  return leseJson<Gesundheit>(PFAD_GESUNDHEIT).catch(() => null);
}
