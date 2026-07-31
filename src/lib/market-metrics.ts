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
  const mitTrend = cards.filter(hasRealTrend);
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
}

/**
 * Set-Rangliste nach typischem Kartenpreis (Median).
 *
 * EINE Stelle für ALLE Ranglisten (Startseite, Marktbericht, künftige).
 * Sets unter `MIN_SET_SAMPLE` werden ausgeschlossen — nicht nach hinten
 * sortiert, sondern gar nicht aufgenommen.
 */
export function rankSets(cards: PokemonCard[], limit = 5): SetRank[] {
  const proSet = new Map<string, { name: string; preise: number[]; trends: number[] }>();

  for (const card of cards) {
    if (!card.setCode) continue;
    const preis = displayPrice(card);
    if (!(preis > 0)) continue;

    const eintrag = proSet.get(card.setCode) ?? { name: card.set || card.setCode, preise: [], trends: [] };
    eintrag.preise.push(preis);
    if (hasRealTrend(card)) eintrag.trends.push(card.trendPercent as number);
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
  /** Preisgewichteter Durchschnittstrend in Prozent. Nur gültig, wenn `sufficient`. */
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
 * Preisgewichteter Markttrend.
 *
 * Der CBI ist preisgewichtet. Dadurch erhalten höherpreisige Karten ein
 * größeres Gewicht im Index, und eine große Anzahl sehr günstiger Karten
 * dominiert die Kennzahl nicht.
 *
 * BEWUSST NICHT BEHAUPTET: Ein höherer Preis heißt nicht, dass eine Karte den
 * Markt stärker bewegt oder häufiger gehandelt wird. Genau das stand hier
 * vorher („eine 400-€-Karte bewegt den Markt stärker als eine 2-€-Karte") —
 * eine Aussage über Marktbedeutung und Liquidität, für die es in den Daten
 * keinen Beleg gibt. Die Gewichtung ist eine Entscheidung über die Konstruktion
 * des Index, keine Erkenntnis über den Markt.
 */
export function computePmi(cards: PokemonCard[]): PmiResult {
  const mitTrend = cards.filter(hasRealTrend);
  const setCount = new Set(mitTrend.map((c) => c.setCode).filter(Boolean)).size;

  let gewichtSumme = 0;
  let trendSumme = 0;
  for (const c of mitTrend) {
    const gewicht = displayPrice(c) || 1;
    trendSumme += (c.trendPercent as number) * gewicht;
    gewichtSumme += gewicht;
  }

  return {
    value: gewichtSumme > 0 ? trendSumme / gewichtSumme : 0,
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
 * - Momentum (30 %): preisgewichteter Trend, abgebildet von −15 % bis +15 %.
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
      detail: `${breite.up} von ${breite.total} Karten über ihrem 30-Tage-Schnitt`,
    },
    {
      label: 'Momentum',
      score: skalieren(pmi, -15, 15),
      weight: FEAR_GREED_WEIGHTS.momentum,
      detail: `Preisgewichteter Trend ${pmi >= 0 ? '+' : ''}${pmi.toFixed(1)} %, abgebildet von −15 % bis +15 %`, // toFixed erlaubt: Erklärtext, keine Preisangabe
    },
    {
      label: 'Gewinner zu Verlierer',
      score: verhaeltnis,
      weight: FEAR_GREED_WEIGHTS.ratio,
      detail: `${breite.up} gestiegen, ${breite.down} gefallen`,
    },
  ];

  const value = Math.round(components.reduce((s, k) => s + k.score * k.weight, 0));
  return { value, label: fearGreedLabel(value), sufficient: true, components };
}

export function fearGreedLabel(value: number): string {
  if (value >= 75) return 'Extreme Gier';
  if (value >= 60) return 'Gier';
  if (value >= 40) return 'Neutral';
  if (value >= 25) return 'Angst';
  return 'Extreme Angst';
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
