// MARKT-KENNZAHLEN — eine Stelle, an der aus Kartendaten Aussagen werden.
//
// Warum ein eigenes Modul: Die Berechnungen standen inline in der Startseite.
// Dort waren sie weder prüfbar noch wiederverwendbar, und genau dort ist der
// Ranking-Fehler entstanden, den niemand bemerkt hat (siehe `splitMovers`).
//
// GRUNDSATZ (CLAUDE.md → Preise: absolute Wahrheitspflicht): Aus zu wenigen
// oder fehlerhaften Datenpunkten wird KEINE Kennzahl abgeleitet. Lieber ein
// ehrliches „noch nicht genug Daten" als eine Zahl, die Genauigkeit vortäuscht.

import type { PokemonCard } from '@/types';
import { displayPrice } from './pokemon-api';
import { median } from './portfolio';
import { formatCount } from './format';

/**
 * Hat diese Karte einen ECHTEN Trendwert?
 *
 * WARUM DAS NÖTIG IST: Karten ohne Cardmarket-30-Tage-Schnitt bekommen in
 * `mapAndFilter` den Startwert `trendPercent = 0` — nicht weil sie sich nicht
 * bewegt haben, sondern weil nichts gemessen wurde. Als „nicht gestiegen"
 * mitgezählt drücken sie die Marktbreite, ohne dass es irgendwo auffällt.
 *
 * `realData` wird an derselben Stelle genau dann gesetzt, wenn ein echter
 * 30-Tage-Schnitt vorlag — also exakt die Bedingung, die hier gebraucht wird.
 */
export function hasRealTrend(card: PokemonCard): boolean {
  if (typeof card.trendPercent !== 'number' || !Number.isFinite(card.trendPercent)) return false;
  // Ein Trend von exakt 0 OHNE echte Datengrundlage ist keine Messung.
  if (card.trendPercent === 0 && card.realData !== true) return false;
  return true;
}

// ── Gewinner und Verlierer ──────────────────────────────────────────────────

export interface Movers {
  gainers: PokemonCard[];
  losers: PokemonCard[];
}

/**
 * Teilt die Karten in Gewinner und Verlierer.
 *
 * DER FEHLER, DEN DAS BEHEBT: Vorher wurde dieselbe Liste zweimal sortiert und
 * jeweils oben abgeschnitten — einmal absteigend, einmal aufsteigend. Ohne
 * Vorzeichen-Filter. Bei nur einer gestiegenen Karte standen unter „Top
 * Gewinner" sieben GEFALLENE Karten, und dieselbe Karte konnte gleichzeitig
 * Gewinner und Verlierer sein.
 *
 * Regeln:
 * - Gewinner: ausschließlich `trendPercent > 0`, absteigend
 * - Verlierer: ausschließlich `trendPercent < 0`, aufsteigend (größter Verlust zuerst)
 * - Karten ohne Bewegung (genau 0) gehören in keine der beiden Listen
 * - Keine künstliche Auffüllung: Gibt es einen Gewinner, steht dort einer
 */
export function splitMovers(cards: PokemonCard[], limit = 8): Movers {
  const mitTrend = cards.filter(hasRealTrend);

  const gainers = mitTrend
    .filter((c) => (c.trendPercent as number) > 0)
    .sort((a, b) => (b.trendPercent as number) - (a.trendPercent as number))
    .slice(0, limit);

  const losers = mitTrend
    .filter((c) => (c.trendPercent as number) < 0)
    .sort((a, b) => (a.trendPercent as number) - (b.trendPercent as number))
    .slice(0, limit);

  return { gainers, losers };
}

// ── Marktbreite ─────────────────────────────────────────────────────────────

export interface Breadth {
  /** Karten über ihrem 30-Tage-Schnitt. */
  up: number;
  /** Karten darunter. */
  down: number;
  /** Karten mit echter Messung — die Bezugsgröße. */
  total: number;
  /** Anteil gestiegener Karten in Prozent. */
  pct: number;
}

/**
 * Anteil der Karten über ihrem 30-Tage-Schnitt.
 *
 * DER FEHLER, DEN DAS BEHEBT: Die Startseite zählte die Gewinner aus der
 * ANZEIGE-Liste (`splitMovers(cards, 8)`) — die ist bei acht Einträgen
 * abgeschnitten. Sobald mehr als acht Karten gestiegen waren, war der Zähler
 * auf 8 festgenagelt, während der Nenner mit dem Datensatz wuchs. Live standen
 * deshalb auf EINER Seite zwei verschiedene Marktbreiten: die Kachel zeigte
 * „16 % · 8/50", die Erklärung zu Angst & Gier gleichzeitig „16 von 50" (32 %).
 *
 * Eine Anzeige-Begrenzung darf nie in eine Kennzahl geraten. Deshalb gibt es
 * die Zählung hier einmal — für Kachel, Erklärtext und Angst & Gier.
 */
export function marketBreadth(cards: PokemonCard[]): Breadth {
  // DIESELBE Zulassung wie beim Index — nicht nur `hasRealTrend`.
  //
  // BEFUND, live auf einer Seite: „Median aus 14.985 gemessenen Karten" und
  // zwei Absaetze weiter „9505 von 19060 gemessenen Karten im Plus". Zwei
  // Zahlen fuer dieselbe Menge, weil `computePmi` die Cent-Karten ausschliesst
  // und diese Funktion nicht. Genau derselbe Widerspruch wie damals bei
  // „16 % · 8/50" gegen „16 von 50" — nur mit einer anderen Ursache.
  const mitTrend = cards.filter(istIndexKarte);
  const up = mitTrend.filter((c) => (c.trendPercent as number) > 0).length;
  const down = mitTrend.filter((c) => (c.trendPercent as number) < 0).length;
  return {
    up,
    down,
    total: mitTrend.length,
    pct: mitTrend.length > 0 ? (up / mitTrend.length) * 100 : 0,
  };
}

// ── Set-Rangliste ───────────────────────────────────────────────────────────

/**
 * Mindestanzahl auswertbarer Karten, damit ein Set in einer Rangliste
 * erscheinen darf.
 *
 * DER FEHLER, DEN DAS BEHEBT: Auf der Startseite stand „151 — stärkstes Set
 * nach Durchschnittspreis · 1 Karten im Datensatz". Der Durchschnitt einer
 * einzigen Karte ist kein Set-Durchschnitt, sondern der Preis dieser Karte.
 * Mit einer teuren Einzelkarte gewinnt so jedes beliebige Set die Rangliste.
 *
 * Fünf ist die untere Grenze, ab der ein Median überhaupt etwas beschreibt.
 * Lieber gar keine Rangliste als eine, die in die Irre führt.
 */
export const MIN_SET_SAMPLE = 5;

export interface SetRank {
  code: string;
  name: string;
  /** Auswertbare Karten dieses Sets in der Stichprobe. */
  count: number;
  /**
   * MEDIAN, nicht Mittelwert.
   *
   * Ein Mittelwert bleibt auch oberhalb der Mindest-Stichprobe von einer
   * einzelnen teuren Karte bestimmt: Fünf Karten zu 5 € plus eine zu 5.000 €
   * ergeben 837 € — ein „Durchschnittspreis", den keine der sechs Karten
   * auch nur annähernd hat. Der Median beschreibt, was eine Karte dieses Sets
   * typischerweise kostet. Dieselbe Regel gilt im Projekt bereits für
   * Marktpreise aus Einzelangeboten.
   */
  medianPrice: number;
  /**
   * Mittlerer Trend aus Karten mit echter Messung — `null`, wenn KEINE Karte
   * des Sets gemessen ist.
   *
   * BEFUND AUS DER LIVE-ANSICHT: Vorher stand hier in diesem Fall 0. Im
   * Set-Markt erschienen dadurch Sets mit „0,0 %", als hätten sie sich nicht
   * bewegt — tatsächlich war für keine ihrer Karten etwas gemessen. Genau die
   * Verwechslung von „unverändert" und „nicht gemessen", die diese Datei sonst
   * überall vermeidet.
   */
  avgTrend: number | null;

  /**
   * Die am stärksten bewegte Karte des Sets — nach BETRAG, nicht nach Vorzeichen.
   *
   * Sie beantwortet die Frage, die eine Set-Zeile sonst offen lässt: Trägt die
   * Bewegung das ganze Set oder eine einzelne Karte? Nach dem größten GEWINN zu
   * suchen wäre eine Auswahl zugunsten guter Nachrichten — ein Set kann ebenso
   * von einem Einbruch getragen sein.
   *
   * `null`, wenn keine Karte des Sets eine gemessene Bewegung hat.
   */
  topMover: { name: string; trend: number } | null;
}

/**
 * Set-Rangliste nach typischem Kartenpreis (Median).
 *
 * EINE Stelle für ALLE Ranglisten (Startseite, Marktbericht, künftige).
 * Sets unter `MIN_SET_SAMPLE` werden ausgeschlossen — nicht nach hinten
 * sortiert, sondern gar nicht aufgenommen.
 */
export function rankSets(cards: PokemonCard[], limit = 5): SetRank[] {
  interface Sammlung {
    name: string;
    preise: number[];
    trends: number[];
    /** Die am stärksten bewegte Karte des Sets — aus DENSELBEN Daten. */
    spitze: { name: string; trend: number } | null;
  }
  const proSet = new Map<string, Sammlung>();

  for (const card of cards) {
    if (!card.setCode) continue;
    const preis = displayPrice(card);
    if (!(preis > 0)) continue;

    const eintrag = proSet.get(card.setCode) ?? {
      name: card.set || card.setCode,
      preise: [],
      trends: [],
      spitze: null,
    };
    eintrag.preise.push(preis);
    if (hasRealTrend(card)) {
      const trend = card.trendPercent as number;
      eintrag.trends.push(trend);
      // Stärkste Bewegung nach BETRAG: Ein Set kann von einem Einbruch
      // getragen sein, und den zu verschweigen wäre eine Auswahl zugunsten
      // guter Nachrichten.
      if (!eintrag.spitze || Math.abs(trend) > Math.abs(eintrag.spitze.trend)) {
        eintrag.spitze = { name: card.nameDe ?? card.name, trend };
      }
    }
    proSet.set(card.setCode, eintrag);
  }

  return [...proSet.entries()]
    .filter(([, d]) => d.preise.length >= MIN_SET_SAMPLE)
    .map(([code, d]) => ({
      code,
      name: d.name,
      count: d.preise.length,
      medianPrice: median(d.preise) ?? 0,
      avgTrend: d.trends.length > 0 ? d.trends.reduce((s, t) => s + t, 0) / d.trends.length : null,
      topMover: d.spitze,
    }))
    .sort((a, b) => b.medianPrice - a.medianPrice)
    .slice(0, limit);
}

// ── CardBeacon Index (CBI) ──────────────────────────────────────────────────

/**
 * Mindestanzahl auswertbarer Karten für einen belastbaren Index.
 *
 * Unterhalb dieser Schwelle wird KEIN Indexwert ausgewiesen. Ein „Marktindex"
 * aus fünf Karten ist keine Marktaussage, sondern der Mittelwert von fünf
 * Karten — und sieht in der Oberfläche trotzdem aus wie ein Index.
 */
export const PMI_MIN_CARDS = 20;

export interface PmiResult {
  /** MEDIAN der gemessenen Bewegungen in Prozent. Nur gültig, wenn `sufficient`. */
  value: number;
  /** Liegen genügend Datenpunkte für eine Aussage vor? */
  sufficient: boolean;
  cardCount: number;
  setCount: number;
  minCards: number;
  /** Betrachteter Zeitraum in Tagen — der Trend stammt aus dem 30-Tage-Vergleich. */
  windowDays: number;
}

/**
 * Untergrenze für Karten, die in den Index eingehen.
 *
 * Unterhalb von zehn Cent steht der Preis auf dem Cardmarket-Boden. Eine
 * Bewegung von 0,02 auf 0,03 € sind fünfzig Prozent, ohne dass irgendetwas
 * geschehen ist — und weil sehr viele Karten dort liegen, ziehen sie jeden
 * Kennwert an sich. GEMESSEN: Über ALLE 19.063 gemessenen Karten ist der Median
 * exakt 0,00 %; ab zehn Cent sind es +3,50 %. Die erste Zahl beschreibt nicht
 * den Markt, sondern die Preisstufung an seinem unteren Rand.
 *
 * Das schließt diese Karten NICHT von der Seite aus — sie sind such- und
 * auffindbar wie alle anderen. Sie tragen nur keine Marktaussage.
 */
export const INDEX_MIN_PREIS = 0.1;

/**
 * Zaehlt diese Karte fuer eine Marktaussage?
 *
 * EINE Regel fuer Index UND Marktbreite. Zwei getrennte Filter waren live als
 * Widerspruch auf derselben Seite zu sehen: „Median aus 14.985 gemessenen
 * Karten" oben, „9505 von 19060 gemessenen Karten im Plus" zwei Absaetze
 * weiter. Beide Zahlen richtig gerechnet, beide fuer eine andere Menge.
 */
export function istIndexKarte(card: PokemonCard): boolean {
  return hasRealTrend(card) && displayPrice(card) >= INDEX_MIN_PREIS;
}

/**
 * Markttrend als MEDIAN der gemessenen Bewegungen.
 *
 * WAS SICH GEÄNDERT HAT UND WARUM — gemessen am 05.08.2026 auf dem gesamten
 * erfassten Bestand (19.063 auswertbare Karten):
 *
 *   heutige Formel, preisgewichtetes Mittel   +28,69 %
 *   dieselbe Formel, Ränder gestutzt (P1/P99) +26,15 %
 *   dieselbe Formel, Gewichtsdeckel 0,5 %     +23,71 %
 *   MEDIAN                                     +3,50 %
 *
 * Auf der früheren Stichprobe von 250 gleichartigen Karten fiel der Unterschied
 * nie auf — dort lagen Mittel und Median dicht beieinander. Über den ganzen
 * Bestand ist die Verteilung stark rechtsschief: P90 bei +40 %, P99 bei +100 %,
 * Maximum bei +1191 %. Ein Mittelwert daraus ist rechnerisch richtig und als
 * Satz falsch — „der Markt ist in 30 Tagen um 28 % gestiegen" würde niemand
 * wiedererkennen.
 *
 * AUSGESCHLOSSEN als Erklärung: veraltete oder anders gerechnete Werte im
 * Bestand. Für dieselben 250 Karten stimmen Live-Abruf und gespeicherter Wert
 * in 250 von 250 Fällen exakt überein (Abweichung 0,00 Prozentpunkte). Die
 * hohen Werte kommen von ANDEREN Karten — alten und selten gehandelten, bei
 * denen der Cardmarket-Trendpreis strukturell über dem 30-Tage-Schnitt liegt.
 *
 * Der Median beantwortet die Frage, die jemand tatsächlich hat: Wie hat sich
 * eine typische Karte bewegt? Er ist gegen diese Schiefe unempfindlich, ohne
 * dass ein einziger Messwert verworfen oder gekappt werden muss.
 *
 * KEINE PREISGEWICHTUNG MEHR. Sie war eine Entscheidung über die Konstruktion
 * des Index, nie eine Erkenntnis über den Markt — ein höherer Preis heißt
 * nicht, dass eine Karte häufiger gehandelt wird.
 */
export function computePmi(cards: PokemonCard[]): PmiResult {
  const mitTrend = cards.filter(istIndexKarte);
  const setCount = new Set(mitTrend.map((c) => c.setCode).filter(Boolean)).size;

  // `median` gibt bei leerer Liste `null` — hier wird daraus 0, weil
  // `sufficient: false` in dem Fall ohnehin verhindert, dass der Wert
  // irgendwo als Aussage erscheint.
  const value = median(mitTrend.map((c) => c.trendPercent as number)) ?? 0;

  return {
    value,
    sufficient: mitTrend.length >= PMI_MIN_CARDS,
    cardCount: mitTrend.length,
    setCount,
    minCards: PMI_MIN_CARDS,
    windowDays: 30,
  };
}

// ── Angst & Gier ────────────────────────────────────────────────────────────

export interface FearGreedComponent {
  label: string;
  /** Beitrag auf der Skala 0–100. */
  score: number;
  /** Gewicht in der Gesamtrechnung (Summe = 1). */
  weight: number;
  /** Klartext, woraus dieser Teilwert entsteht. */
  detail: string;
}

export interface FearGreedResult {
  value: number;
  label: string;
  sufficient: boolean;
  components: FearGreedComponent[];
}

/** Gewichte der Teilwerte — offengelegt, damit die Zahl nachvollziehbar bleibt. */
export const FEAR_GREED_WEIGHTS = { breadth: 0.5, momentum: 0.3, ratio: 0.2 } as const;

function skalieren(wert: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((wert - min) / (max - min)) * 100));
}

/**
 * Stimmungsindikator aus drei offengelegten Teilwerten.
 *
 * ANLASS DER ÜBERARBEITUNG: Die frühere Formel mischte Marktbreite und ein
 * „Momentum" mit fest gewählten Grenzen, ohne dass irgendwo stand, wie der Wert
 * zustande kommt. Ein Indikator, den niemand nachrechnen kann, ist eine
 * Behauptung. Jeder Teilwert wird jetzt einzeln zurückgegeben und in der
 * Oberfläche erklärt.
 *
 * - Marktbreite (50 %): Anteil der Karten über ihrem 30-Tage-Schnitt.
 * - Momentum (30 %): Median-Trend, abgebildet von −15 % bis +15 %.
 * - Verhältnis (20 %): Gewinner gegen Verlierer.
 */
export function computeFearGreed(cards: PokemonCard[]): FearGreedResult {
  const mitTrend = cards.filter(hasRealTrend);
  if (mitTrend.length < PMI_MIN_CARDS) {
    return { value: 0, label: 'Zu wenig Daten', sufficient: false, components: [] };
  }

  // Dieselbe Zählung wie die Kachel auf der Startseite — nicht die
  // abgeschnittene Anzeige-Liste (siehe `marketBreadth`).
  const breite = marketBreadth(mitTrend);
  const pmi = computePmi(mitTrend).value;
  const verhaeltnis =
    breite.up + breite.down > 0 ? (breite.up / (breite.up + breite.down)) * 100 : 50;

  const components: FearGreedComponent[] = [
    {
      label: 'Marktbreite',
      score: breite.pct,
      weight: FEAR_GREED_WEIGHTS.breadth,
      detail: `${formatCount(breite.up)} von ${formatCount(breite.total)} Karten über ihrem 30-Tage-Schnitt`,
    },
    {
      label: 'Momentum',
      score: skalieren(pmi, -15, 15),
      weight: FEAR_GREED_WEIGHTS.momentum,
      detail: `Median-Trend ${pmi >= 0 ? '+' : ''}${pmi.toFixed(1)} %, abgebildet von −15 % bis +15 %`, // toFixed erlaubt: Erklärtext, keine Preisangabe
    },
    {
      label: 'Gewinner zu Verlierer',
      score: verhaeltnis,
      weight: FEAR_GREED_WEIGHTS.ratio,
      detail: `${formatCount(breite.up)} gestiegen, ${formatCount(breite.down)} gefallen`,
    },
  ];

  const value = Math.round(components.reduce((s, k) => s + k.score * k.weight, 0));
  return { value, label: fearGreedLabel(value), sufficient: true, components };
}

/**
 * MARKTTEMPERATUR statt „Angst & Gier".
 *
 * WARUM UMBENANNT: „Angst" und „Gier" beschreiben Gefühle von Anlegern. Gemessen
 * werden aber drei Preisgrößen — Marktbreite, Momentum, Verhältnis von Gewinnern
 * zu Verlierern. Aus Preisen auf Gefühle zu schließen ist eine Behauptung, die
 * die Daten nicht hergeben, und der Begriff stammt erkennbar aus dem
 * Krypto-Umfeld. Nebenbei klingt „Extreme Gier" wie eine Handlungsaufforderung,
 * und Handlungsaufforderungen gibt dieses Produkt nicht.
 *
 * „Temperatur" beschreibt genau das, was tatsächlich gemessen wird: wie viel
 * Bewegung im Markt ist. Kalt heißt nicht schlecht und heiß nicht gut.
 *
 * DIE RECHNUNG IST UNVERÄNDERT. Gewichte, Teilwerte und Skala 0–100 sind
 * dieselben wie vorher — geändert hat sich, wie das Ergebnis heißt.
 */
export function fearGreedLabel(value: number): string {
  if (value >= 75) return 'Heiß';
  if (value >= 60) return 'Anziehend';
  if (value >= 40) return 'Ruhig';
  if (value >= 25) return 'Abkühlend';
  return 'Kalt';
}

/** Klartext zur Temperatur — ohne Handlungsempfehlung, nur Beschreibung. */
export function temperaturErklaerung(value: number): string {
  if (value >= 75) return 'Breite Aufwärtsbewegung über viele Karten hinweg.';
  if (value >= 60) return 'Mehr Karten steigen als fallen, die Bewegung nimmt zu.';
  if (value >= 40) return 'Steigende und fallende Karten halten sich weitgehend die Waage.';
  if (value >= 25) return 'Mehr Karten fallen als steigen, die Bewegung lässt nach.';
  return 'Breite Abwärtsbewegung über viele Karten hinweg.';
}

// ── Datenqualität ───────────────────────────────────────────────────────────

export interface DataIssue {
  kind:
    | 'kein_preis'
    | 'kein_bild'
    | 'doppelte_id'
    | 'extremer_trend'
    | 'unplausibler_preis'
    | 'kein_trend';
  cardId: string;
  detail: string;
}

export interface DataQualityReport {
  /** Karten, die für Kennzahlen verwendet werden dürfen. */
  clean: PokemonCard[];
  issues: DataIssue[];
  total: number;
  /** Anteil verwertbarer Karten in Prozent. */
  usablePct: number;
}

/** Jenseits dieser Grenze ist eine 30-Tage-Bewegung kein Marktvorgang mehr. */
export const MAX_PLAUSIBLE_TREND = 300;
/** Über diesem Betrag ist ein Kartenpreis mit hoher Wahrscheinlichkeit ein Datenfehler. */
export const MAX_PLAUSIBLE_PRICE = 100_000;

/**
 * Prüft den Datensatz, bevor daraus Kennzahlen werden.
 *
 * WARUM: Ein einzelner Ausreißer verschiebt einen preisgewichteten Index
 * spürbar — und zwar unbemerkt, weil die fehlerhafte Karte in der Oberfläche
 * nirgends auffällt. Erkannte Probleme werden protokolliert, damit sie
 * nachvollziehbar bleiben, statt still eingerechnet zu werden.
 */
export function validateMarketData(cards: PokemonCard[]): DataQualityReport {
  const issues: DataIssue[] = [];
  const gesehen = new Set<string>();
  const clean: PokemonCard[] = [];

  for (const card of cards) {
    const preis = displayPrice(card);
    const trend = card.trendPercent;

    if (gesehen.has(card.id)) {
      issues.push({ kind: 'doppelte_id', cardId: card.id, detail: `${card.name} mehrfach im Datensatz` });
      continue;
    }
    gesehen.add(card.id);

    if (!(preis > 0)) {
      issues.push({ kind: 'kein_preis', cardId: card.id, detail: `${card.name} ohne Marktpreis` });
      continue;
    }
    if (preis > MAX_PLAUSIBLE_PRICE) {
      issues.push({
        kind: 'unplausibler_preis',
        cardId: card.id,
        detail: `${card.name}: ${preis} € übersteigt die Plausibilitätsgrenze`,
      });
      continue;
    }
    if (!card.imageUrl) {
      issues.push({ kind: 'kein_bild', cardId: card.id, detail: `${card.name} ohne Bild` });
      continue;
    }
    if (typeof trend === 'number' && Number.isFinite(trend) && Math.abs(trend) > MAX_PLAUSIBLE_TREND) {
      issues.push({
        kind: 'extremer_trend',
        cardId: card.id,
        detail: `${card.name}: ${trend} % in 30 Tagen ist kein Marktvorgang`,
      });
      continue;
    }
    if (typeof trend !== 'number' || !Number.isFinite(trend)) {
      // Kein Ausschluss — die Karte ist für Preislisten brauchbar, nur nicht
      // für Trendkennzahlen. Die Trendfunktionen filtern selbst.
      issues.push({ kind: 'kein_trend', cardId: card.id, detail: `${card.name} ohne Trendwert` });
    }

    clean.push(card);
  }

  return {
    clean,
    issues,
    total: cards.length,
    usablePct: cards.length > 0 ? (clean.length / cards.length) * 100 : 0,
  };
}

/** Schreibt auffällige Datensätze ins Server-Log — gruppiert, nicht als Flut. */
export function logDataIssues(report: DataQualityReport, quelle: string): void {
  if (report.issues.length === 0) return;
  const nachArt = new Map<string, number>();
  for (const i of report.issues) nachArt.set(i.kind, (nachArt.get(i.kind) ?? 0) + 1);
  const zusammenfassung = [...nachArt.entries()].map(([k, n]) => `${k}=${n}`).join(' ');
  console.warn(
    `[Datenqualität/${quelle}] ${report.clean.length}/${report.total} verwertbar (${zusammenfassung}). ` +
      `Beispiele: ${report.issues.slice(0, 3).map((i) => i.detail).join(' | ')}`,
  );
}
