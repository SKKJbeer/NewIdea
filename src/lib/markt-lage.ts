import type { PokemonCard } from '@/types';
import { getHomepageCards } from './homepage-data';
import { getMarketBasis } from './market-basis';
import { cardsFromIndex, bestandFuerSets, type BestandZeile } from './card-index';
import { leseFrischpreise } from './frischpreise';
import { leseNeuheiten, neuheitenAktuell, type NeuheitenDatei, type ProduktPreis } from './neuheiten';
import { bewegung30, ohneCases } from './neuheiten-zuordnung';
import { computePmi, marketBreadth, validateMarketData } from './market-metrics';
import { median } from './portfolio';
import { ladeSetListe } from './set-liste';
import { loadMarketIndexHistory } from './market-index-store';
import { loadLatestMarketReport } from './market-report-storage';
import { fetchTrendingCards } from './pokemon-api';

// MARKTLAGE — EIN Faktenblock für alle automatisch erzeugten Texte.
//
// Befund 28.09.2026 (Nutzer: Berichte „zu steril", ohne echte aktuelle Trends):
//  - Artikel, Newsletter, Studio-Texte und Reels holten ihre Karten über
//    `fetchTrendingCards` — eine feste Set-Liste von 2023/24 (sv3pt5 … sv8)
//    mit pokemontcg.io-Preisen, die Monate alt sind (Stolperstelle 62).
//  - Der Marktbericht hatte frische Karten, bekam im Prompt aber nur zehn
//    davon: kein Index, keine Marktbreite, keine Set-Bewegung, keine neuen
//    Sets, kein Japan-Vorlauf.
//
// Zweite Runde (Probelauf 28.09.2026, v6.14.0): Der Bericht bestand fast nur
// aus Klassikern mit +130 … +190 % (Mew Southern Islands, Pikachu δ) — dünn
// gehandelte Karten, bei denen wenige Verkäufe den Trend drehen. Die
// Set-Bewegung stützte sich auf 5–11 Karten je Set. Deshalb jetzt:
//  - Bewegungen getrennt nach MODERN (Set ≤ 3 Jahre) und KLASSIKER; extreme
//    Klassiker-Ausschläge ausdrücklich als „wenige Verkäufe" gekennzeichnet.
//  - Set-Bewegung aus dem GANZEN frischen Bestand, echter Median, ≥ 20 Karten,
//    Pfennigkarten ausgenommen.
//  - Gedächtnis: Index vor 7 Tagen und der Aufhänger des letzten Berichts —
//    damit nicht jede Woche derselbe Text entsteht.
// Was keine Quelle belegt, steht nicht im Block — und darf deshalb auch nicht
// im Text stehen (die Prompts sagen das ausdrücklich).

/** Kleinere Bewegungen sind Rauschen, keine Nachricht. */
export const MIN_TREND_BEWEGUNG = 5;
/** Unter diesem Preis bewegt ein einzelner Verkauf den Trend um zweistellige Prozente. */
export const MIN_TREND_PREIS = 2;
/** Sets bis zu diesem Alter gelten als „modern" (aktuelle Ära, aktiv gesammelt). */
export const MODERN_TAGE = 3 * 365;
/** Klassiker-Ausschläge darüber: Hinweis auf dünnen Handel. */
export const AUSREISSER_PROZENT = 100;
/** Set-Bewegung nur mit genug Karten — darunter bestimmt eine Karte das Set. */
export const SET_MIN_KARTEN = 20;
/** Karten darunter zählen für die Set-Bewegung nicht (ein Verkauf = ±50 %). */
export const SET_MIN_PREIS = 0.5;
/** Spitzenkarte eines Sets nur bis zu diesem Ausschlag (Index-Trend ist unbestätigt). */
export const SPITZE_MAX_PROZENT = 150;

export interface BestaetigteBewegung {
  karte: PokemonCard;
  /** Trend gegen Ø 30 in Prozent, durch Ø 7 bestätigt. */
  bewegung: number;
  preis: number;
  /** Set ≤ 3 Jahre alt; `null` = Erscheinungsdatum unbekannt. */
  modern: boolean | null;
}

export interface SetBewegung {
  setCode: string;
  name: string;
  /** Erscheinungsjahr, soweit bekannt. */
  jahr: string | null;
  /** Erscheinungsdatum (YYYY-MM-DD), soweit bekannt. */
  datum: string | null;
  karten: number;
  /** Median der 30-Tage-Bewegung der Karten des Sets. */
  median: number;
  spitze: { name: string; trend: number } | null;
}

export interface MarktLage {
  /** Quellstand der Preise (YYYY-MM-DD), soweit bekannt. */
  stand: string | null;
  /** Frische Karten aus dem eigenen Index (wertvollste zuerst). */
  pool: PokemonCard[];
  bestaetigt: BestaetigteBewegung[];
  sets: SetBewegung[];
  cbi: { wert: number; karten: number } | null;
  /** Indexwert rund eine Woche vorher (echter Wochenvergleich). */
  vorwoche: { wert: number; datum: string } | null;
  breite: { steigend: number; fallend: number; gesamt: number } | null;
  neuheiten: NeuheitenDatei | null;
  /** Anfang des letzten gespeicherten Berichts — gegen Wiederholung. */
  letzterBericht: { woche: number; anfang: string } | null;
}

export const LEERE_LAGE: MarktLage = {
  stand: null, pool: [], bestaetigt: [], sets: [], cbi: null, vorwoche: null, breite: null, neuheiten: null, letzterBericht: null,
};

// ── rein, getestet ──────────────────────────────────────────────────────────

/** Set-Bewegung aus dem Bestand: echter Median, Mindestmenge, ohne Pfennigkarten. */
export function setBewegungen(zeilen: BestandZeile[], setDatum: ReadonlyMap<string, string>): SetBewegung[] {
  const jeSet = new Map<string, { name: string; trends: number[]; spitze: { name: string; trend: number } | null }>();
  for (const z of zeilen) {
    if (!(z.preis >= SET_MIN_PREIS) || !Number.isFinite(z.trend)) continue;
    const e = jeSet.get(z.setCode) ?? { name: z.setName || z.setCode, trends: [], spitze: null };
    e.trends.push(z.trend);
    // Spitzenkarte nur ab MIN_TREND_PREIS — sonst gewinnt immer eine 60-Cent-Karte.
    // Und nur bis SPITZE_MAX_PROZENT: Die Index-Bewegung ist UNBESTÄTIGT —
    // „Poliwrath +892,9 %" (Probelauf) war ein Einzelverkauf, kein Signal.
    if (z.preis >= MIN_TREND_PREIS && Math.abs(z.trend) <= SPITZE_MAX_PROZENT && (!e.spitze || Math.abs(z.trend) > Math.abs(e.spitze.trend))) {
      e.spitze = { name: z.name, trend: z.trend };
    }
    jeSet.set(z.setCode, e);
  }
  return [...jeSet.entries()]
    .filter(([, e]) => e.trends.length >= SET_MIN_KARTEN)
    .map(([setCode, e]) => ({
      setCode,
      name: e.name,
      jahr: setDatum.get(setCode)?.slice(0, 4) ?? null,
      datum: setDatum.get(setCode)?.replace(/\//g, '-').slice(0, 10) ?? null,
      karten: e.trends.length,
      median: median(e.trends) ?? 0,
      spitze: e.spitze,
    }));
}

/** Modern = Set höchstens `MODERN_TAGE` alt. */
export function istModern(setCode: string | undefined, setDatum: ReadonlyMap<string, string>, jetzt = Date.now()): boolean | null {
  const d = setCode ? setDatum.get(setCode) : undefined;
  if (!d) return null;
  const t = Date.parse(d.replace(/\//g, '-'));
  return Number.isFinite(t) ? jetzt - t <= MODERN_TAGE * 86_400_000 : null;
}

/** Versiegelte Produkte für den Text: ohne Cases. */
export function versiegeltFuerText(produkte: ProduktPreis[], max = 4): ProduktPreis[] {
  return ohneCases(produkte, max);
}

/** Indexwert, der 6–9 Tage vor dem jüngsten liegt. */
export function wertVorWoche(punkte: Array<{ date: string; value: number }>): { wert: number; datum: string } | null {
  if (punkte.length < 2) return null;
  const sortiert = [...punkte].sort((a, b) => a.date.localeCompare(b.date));
  const juengst = Date.parse(sortiert[sortiert.length - 1].date.slice(0, 10));
  const kandidat = sortiert
    .filter((p) => {
      const tage = (juengst - Date.parse(p.date.slice(0, 10))) / 86_400_000;
      return tage >= 6 && tage <= 9;
    })
    .pop();
  return kandidat ? { wert: kandidat.value, datum: kandidat.date.slice(0, 10) } : null;
}

/**
 * Bewegungen für Bilder und Beiträge, nach RELEVANZ statt nach Größe:
 * moderne Karten zuerst, Klassiker nur bis `AUSREISSER_PROZENT` (darüber
 * bestimmen wenige Verkäufe den Wert), bereits gezeigte Karten ausgenommen.
 * Befund 28.09.2026: Das Karussell nahm schlicht die drei größten Ausschläge —
 * Tag für Tag dieselben dünn gehandelten Klassiker (Mew Southern Islands +193 %).
 */
export function relevanteBewegungen(
  karten: PokemonCard[],
  setDatum: ReadonlyMap<string, string>,
  ausschliessen: ReadonlySet<string> = new Set(),
  jetzt = Date.now(),
): { gainers: PokemonCard[]; losers: PokemonCard[] } {
  const bewertet = karten
    .filter((k) => k.realData && typeof k.trendPercent === 'number' && Math.abs(k.trendPercent) >= MIN_TREND_BEWEGUNG)
    .filter((k) => !ausschliessen.has(k.id))
    .map((k) => ({ k, t: k.trendPercent as number, modern: istModern(k.setCode, setDatum, jetzt) === true }))
    .filter((x) => x.modern || Math.abs(x.t) <= AUSREISSER_PROZENT);
  const ordnen = (liste: typeof bewertet, richtung: 1 | -1) =>
    liste
      .filter((x) => x.t * richtung > 0)
      .sort((a, b) => Number(b.modern) - Number(a.modern) || (b.t - a.t) * richtung)
      .map((x) => x.k);
  return { gainers: ordnen(bewertet, 1), losers: ordnen(bewertet, -1) };
}

/** Entfernt Klassiker mit Ausschlag über `AUSREISSER_PROZENT` (wenige Verkäufe). Für Reels. */
export function ohneDuenneAusreisser(karten: PokemonCard[], setDatum: ReadonlyMap<string, string>, jetzt = Date.now()): PokemonCard[] {
  return karten.filter(
    (k) => typeof k.trendPercent !== 'number' || Math.abs(k.trendPercent) <= AUSREISSER_PROZENT || istModern(k.setCode, setDatum, jetzt) === true,
  );
}

/**
 * Gewinner eines Wochenberichts ohne dünn gehandelte Klassiker — für Speichern UND
 * Anzeige (Altbestände). Gemessen 08.10.2026: alle fünf gespeicherten Gewinner der
 * KW 41 waren Klassiker über 100 % (Mew Southern Islands +191 %). Wirft nie.
 */
export async function relevanteBerichtsGewinner(karten: PokemonCard[], jetzt = Date.now()): Promise<PokemonCard[]> {
  const liste = await ladeSetListe(250).catch(() => null);
  const setDatum = new Map<string, string>((liste?.sets ?? []).map((s) => [s.id, s.releaseDate]));
  return ohneDuenneAusreisser(karten, setDatum, jetzt);
}

// ── laden ───────────────────────────────────────────────────────────────────

/** Lädt die Marktlage. Wirft nie — fehlende Teile bleiben leer und fehlen im Text. */
export async function ladeMarktLage(jetzt = Date.now()): Promise<MarktLage> {
  const [pool, basis, frisch, neuheiten, setListe, bestand, verlauf, bericht] = await Promise.all([
    getHomepageCards(250).catch(() => [] as PokemonCard[]),
    getMarketBasis().catch(() => null),
    leseFrischpreise().catch(() => null),
    leseNeuheiten().catch(() => null),
    ladeSetListe(250).catch(() => null),
    bestandFuerSets().catch((err) => {
      console.warn('[Marktlage] Bestand für Set-Bewegung nicht lesbar:', err instanceof Error ? err.message : err);
      return [] as BestandZeile[];
    }),
    loadMarketIndexHistory(14).catch(() => []),
    loadLatestMarketReport().catch(() => null),
  ]);
  const lage: MarktLage = { ...LEERE_LAGE, pool, neuheiten: neuheitenAktuell(neuheiten) ? neuheiten : null };

  const setDatum = new Map<string, string>((setListe?.sets ?? []).map((s) => [s.id, s.releaseDate]));

  if (basis && basis.quelle === 'index') {
    const sauber = validateMarketData(basis.karten).clean;
    const pmi = computePmi(sauber);
    if (pmi.sufficient) lage.cbi = { wert: pmi.value, karten: pmi.cardCount };
    const b = marketBreadth(sauber);
    if (b.total > 0) lage.breite = { steigend: b.up, fallend: b.down, gesamt: b.total };
    lage.stand = basis.stand ?? null;
  }
  lage.vorwoche = wertVorWoche(verlauf);
  lage.sets = setBewegungen(bestand, setDatum);

  if (bericht?.reportText) {
    lage.letzterBericht = { woche: bericht.weekNumber, anfang: bericht.reportText.split(/\n\n+/)[0].slice(0, 500) };
  }

  if (frisch) {
    lage.stand = lage.stand ?? frisch.datum;
    const kandidaten = frisch.karten.filter(
      (k) => k.bewegung !== null && Math.abs(k.bewegung) >= MIN_TREND_BEWEGUNG && k.preis >= MIN_TREND_PREIS,
    );
    // Stammdaten (Name, Set, Bild) aus dem Index — in Stücken, cardsFromIndex
    // kappt bei 200 (Stolperstelle 54).
    const ids = kandidaten.map((k) => k.id);
    const karten = new Map<string, PokemonCard>();
    for (let i = 0; i < ids.length; i += 200) {
      const m = await cardsFromIndex(ids.slice(i, i + 200)).catch(() => new Map<string, PokemonCard>());
      for (const [id, k] of m) karten.set(id, k);
    }
    lage.bestaetigt = kandidaten
      .flatMap((k) => {
        const karte = karten.get(k.id);
        if (!karte) return [];
        const bewegung = k.bewegung as number;
        return [{ karte: { ...karte, trendPercent: bewegung, realData: true }, bewegung, preis: k.preis, modern: istModern(karte.setCode, setDatum, jetzt) }];
      })
      .sort((a, b) => Math.abs(b.bewegung) - Math.abs(a.bewegung));
  }
  return lage;
}

/**
 * Karten für Themenwahl, Newsletter, Reels: bestätigte Bewegungen moderner
 * Karten zuerst, dann Klassiker, dann die wertvollsten frischen Karten.
 * Ersetzt `fetchTrendingCards` (alte Set-Liste, alte Preise).
 */
export function trendKarten(lage: MarktLage, anzahl: number): PokemonCard[] {
  const aus: PokemonCard[] = [];
  const gesehen = new Set<string>();
  const modern = lage.bestaetigt.filter((b) => b.modern === true);
  const rest = lage.bestaetigt.filter((b) => b.modern !== true);
  for (const k of [...modern.map((b) => b.karte), ...rest.map((b) => b.karte), ...lage.pool]) {
    if (aus.length >= anzahl) break;
    if (gesehen.has(k.id)) continue;
    gesehen.add(k.id);
    aus.push(k);
  }
  return aus;
}

export async function aktuelleTrendKarten(anzahl = 30): Promise<PokemonCard[]> {
  const karten = trendKarten(await ladeMarktLage(), anzahl);
  if (karten.length > 0) return karten;
  console.warn('[Marktlage] Eigener Index ohne Karten — Rückfall auf pokemontcg.io (alte Preise)');
  return fetchTrendingCards(anzahl);
}

// ── Text für die Prompts ────────────────────────────────────────────────────

// toFixed erlaubt: Prompt-Text für die KI, wird nie angezeigt (deutsches Komma trotzdem,
// damit das Modell die Zahlen so übernimmt, wie die Seite sie schreibt).
const pz = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')} %`;
// toFixed erlaubt: Prompt-Text für die KI, wird nie angezeigt
const eur = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
const tageSeit = (iso: string, jetzt: number) => Math.max(0, Math.floor((jetzt - Date.parse(iso.slice(0, 10))) / 86_400_000));

export interface TextOptionen {
  /** Euro-Beträge in den Block aufnehmen. Artikel: nein (keine Preise im Fließtext). */
  preise: boolean;
  /** Anfang des letzten Berichts mitgeben (nur Marktbericht). */
  gedaechtnis?: boolean;
  jetzt?: number;
}

/**
 * Die Marktlage als Prompt-Block. Rein — getestet. Jede Zeile nennt ihre
 * Messgröße, damit das Modell „30-Tage-Bewegung" nicht zu „diese Woche" macht.
 */
export function marktLageText(lage: MarktLage, opt: TextOptionen): string {
  const jetzt = opt.jetzt ?? Date.now();
  const z: string[] = [];
  const mitPreis = (p: number) => (opt.preise ? `, ${eur(p)}` : '');

  if (lage.cbi) {
    const vw = lage.vorwoche ? `; eine Woche zuvor (${lage.vorwoche.datum}) stand er bei ${pz(lage.vorwoche.wert)}` : '';
    z.push(`- Marktindex (Median der 30-Tage-Bewegung über ${lage.cbi.karten} Karten): ${pz(lage.cbi.wert)}${vw}`);
  }
  if (lage.breite) {
    const anteil = Math.round((lage.breite.steigend / lage.breite.gesamt) * 100);
    z.push(`- Marktbreite: ${anteil} % der Karten liegen über ihrem 30-Tage-Schnitt (${lage.breite.steigend} steigend, ${lage.breite.fallend} fallend)`);
  }

  const zeile = (b: BestaetigteBewegung) => `${b.karte.name} (${b.karte.set}) ${pz(b.bewegung)}${mitPreis(b.preis)}`;
  const modern = lage.bestaetigt.filter((b) => b.modern === true);
  const klassik = lage.bestaetigt.filter((b) => b.modern !== true);
  const mHoch = modern.filter((b) => b.bewegung > 0).slice(0, 6);
  const mRunter = modern.filter((b) => b.bewegung < 0).slice(0, 6);
  if (mHoch.length) z.push(`- Moderne Sets (letzte 3 Jahre), bestätigte Aufwärtsbewegungen (Preis-Trend gegen Ø 30 Tage, durch die Verkäufe der letzten 7 Tage gedeckt): ${mHoch.map(zeile).join('; ')}`);
  if (mRunter.length) z.push(`- Moderne Sets, bestätigte Abwärtsbewegungen (gleiche Messung): ${mRunter.map(zeile).join('; ')}`);
  const kZeile = (b: BestaetigteBewegung) => `${zeile(b)}${Math.abs(b.bewegung) > AUSREISSER_PROZENT ? ' [dünn gehandelt — wenige Verkäufe können den Wert bestimmen]' : ''}`;
  const kHoch = klassik.filter((b) => b.bewegung > 0).slice(0, 4);
  const kRunter = klassik.filter((b) => b.bewegung < 0).slice(0, 3);
  if (kHoch.length) z.push(`- Klassiker (ältere Sets), bestätigte Aufwärtsbewegungen: ${kHoch.map(kZeile).join('; ')}`);
  if (kRunter.length) z.push(`- Klassiker, bestätigte Abwärtsbewegungen: ${kRunter.map(kZeile).join('; ')}`);

  const setZeile = (s: SetBewegung) => {
    const alter = s.datum ? tageSeit(s.datum, jetzt) : null;
    // Ein Set unter 30 Tagen hat keinen echten 30-Tage-Schnitt — er enthält
    // die ersten Verkaufstage (Probelauf: „30th Celebration -41 %" nach 12 Tagen).
    const jung = alter !== null && alter < 30 ? ` [erst ${alter} Tage im Handel — der 30-Tage-Schnitt enthält die ersten Verkaufstage, die Bewegung ist vor allem die Normalisierung nach dem Start]` : '';
    return `${s.name}${s.jahr ? ` (${s.jahr})` : ''} ${pz(s.median)} über ${s.karten} Karten${s.spitze ? `, stärkste Karte ${s.spitze.name} ${pz(s.spitze.trend)}` : ''}${jung}`;
  };
  const setModern = (s: SetBewegung) => s.datum !== null && jetzt - Date.parse(s.datum) <= MODERN_TAGE * 86_400_000;
  const nachMedian = (liste: SetBewegung[], richtung: 1 | -1, max: number) =>
    liste.filter((s) => s.median * richtung > 0).sort((a, b) => (b.median - a.median) * richtung).slice(0, max);
  const mSets = lage.sets.filter(setModern);
  const kSets = lage.sets.filter((s) => !setModern(s));
  const MESSUNG = `Median aller Karten ohne Pfennigkarten unter 50 Cent, mind. ${SET_MIN_KARTEN} Karten`;
  const msHoch = nachMedian(mSets, 1, 4);
  const msRunter = nachMedian(mSets, -1, 4);
  if (msHoch.length) z.push(`- Moderne Sets mit der stärksten 30-Tage-Bewegung (${MESSUNG}): ${msHoch.map(setZeile).join('; ')}`);
  if (msRunter.length) z.push(`- Moderne Sets mit der schwächsten 30-Tage-Bewegung (gleiche Messung): ${msRunter.map(setZeile).join('; ')}`);
  const ksHoch = nachMedian(kSets, 1, 2);
  const ksRunter = nachMedian(kSets, -1, 1);
  if (ksHoch.length || ksRunter.length) {
    z.push(`- Ältere Sets, auffälligste Bewegung (gleiche Messung, oft dünner Handel): ${[...ksHoch, ...ksRunter].map(setZeile).join('; ')}`);
  }

  const n = lage.neuheiten;
  const neu: string[] = [];
  if (n) {
    for (const s of n.sets.slice(0, 4)) {
      const produkte = versiegeltFuerText(s.versiegelt).map((p) => {
        const b = bewegung30(p.preis);
        return `${p.name}${mitPreis(p.preis.trend)}${b !== null ? ` (30 Tage ${pz(b)})` : ''}`;
      });
      neu.push(`- Neues Set „${s.name}“ (${s.setCode}), erschienen am ${s.datum}, vor ${tageSeit(s.datum, jetzt)} Tagen, ${s.gesamt} Karten${produkte.length ? `; versiegelte Produkte: ${produkte.join('; ')}` : ''}`);
    }
    for (const j of n.japan.slice(0, 2)) {
      const karten = j.karten.slice(0, 3).map((k) => `${k.nameEn ?? k.name}${mitPreis(k.preis.trend)}`).join('; ');
      neu.push(`- Bereits in Japan erschienen: „${j.nameEn ?? j.name}“ (${j.id}) am ${j.datum}; eine englische Ausgabe führen die Quellen noch nicht. Teuerste japanische Karten: ${karten}`);
    }
    if (n.kommend.length) {
      neu.push(`- Angekündigte englische Sets mit Erscheinungsdatum: ${n.kommend.map((k) => `„${k.name}“ am ${k.datum}`).join('; ')}`);
    } else {
      neu.push('- Angekündigte englische Sets mit Erscheinungsdatum: keine in den Quellen');
    }
  }

  if (z.length === 0 && neu.length === 0) return '';
  const teile = [`MARKTLAGE (Cardmarket, Quellstand ${lage.stand ?? 'unbekannt'} — NUR diese Fakten verwenden, nichts dazu erfinden):`];
  if (z.length) teile.push(...z);
  if (neu.length) teile.push('', 'NEUHEITEN UND AUSBLICK-FAKTEN:', ...neu);
  if (opt.gedaechtnis && lage.letzterBericht) {
    teile.push(
      '',
      `LETZTER BERICHT (KW ${lage.letzterBericht.woche}) begann so: „${lage.letzterBericht.anfang}“`,
      'Wähle einen ANDEREN Aufhänger. Laufen dieselben Bewegungen weiter, benenne das ausdrücklich als Fortsetzung — nicht als Neuigkeit.',
    );
  }
  return teile.join('\n');
}

/** Regeln für Trend- und Ausblick-Abschnitte — in jedem Prompt dieselben. */
export const AUSBLICK_REGELN = `TRENDS UND AUSBLICK — Pflicht, wenn die MARKTLAGE Fakten dazu liefert:
- Trends: Schwerpunkt sind die MODERNEN Sets — dort sammeln die meisten Leser. Benenne bestätigte Bewegungen und Set-Bewegungen konkret (Kartenname, Set, Prozentwert, Messgröße „gegen den 30-Tage-Schnitt"). Klassiker gehören als eigener, kurzer Punkt dazu; ist ein Ausschlag als „dünn gehandelt" markiert, sag das so — ein paar Verkäufe sind kein Markttrend.
- Ordne ein, WARUM — nur mit belegbaren Gründen aus den Fakten: Set-Alter (neu erschienen / seit Jahren im Umlauf), Jubiläum, versiegelte Produkte, japanischer Vorlauf, Gegenbewegung eines ganzen Sets.
- Ausblick: Was in den nächsten Wochen Beobachtung verdient — ausschließlich abgeleitet aus den Fakten (Sets kurz nach Erscheinen, in Japan bereits erschienene Sets, angekündigte Sets, laufende Bewegungen) und aus allgemein belegten Marktmustern (z. B. „Preise neuer Sets finden ihren Boden historisch einige Wochen nach Erscheinen").
- VERBOTEN im Ausblick: Preisprognosen („wird steigen", Zielpreise), erfundene Erscheinungstermine oder Ankündigungen, Kaufempfehlungen. Neutrale Formulierungen: „verdient Beobachtung", „historisch folgte darauf", „bleibt abzuwarten".
- Titel und Einstieg NIE mit einem als „dünn gehandelt" markierten Ausschlag — das ist kein Trend, und ein Aufhänger darauf wäre irreführend. Aufhänger kommen aus den modernen Sets, den Set-Bewegungen oder den Neuheiten.
- Kein Zubehör (Sleeves, Toploader, Sammelalbum …) in Markt-, Trend-, Neuheiten- oder Ausblick-Abschnitten — dort ist es Werbung, keine Analyse.
- Ein Zeitraum heißt nur so, wie er gemessen ist: „gegen den 30-Tage-Schnitt", nie „diese Woche". Einen echten Wochenvergleich gibt es nur beim Marktindex, wenn der Wert der Vorwoche genannt ist.`;
