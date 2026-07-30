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
  const mitTrend = cards.filter((c) => typeof c.trendPercent === 'number' && Number.isFinite(c.trendPercent));

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

// ── PokéMarket Index (PMI) ──────────────────────────────────────────────────

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
 * Gewichtet nach Preis, weil eine 400-€-Karte den Markt stärker bewegt als eine
 * 2-€-Karte. Ohne Gewichtung würde eine große Zahl billiger Karten den Index
 * bestimmen.
 */
export function computePmi(cards: PokemonCard[]): PmiResult {
  const mitTrend = cards.filter(
    (c) => typeof c.trendPercent === 'number' && Number.isFinite(c.trendPercent),
  );
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
  const mitTrend = cards.filter(
    (c) => typeof c.trendPercent === 'number' && Number.isFinite(c.trendPercent),
  );
  if (mitTrend.length < PMI_MIN_CARDS) {
    return { value: 0, label: 'Zu wenig Daten', sufficient: false, components: [] };
  }

  const { gainers, losers } = splitMovers(mitTrend, mitTrend.length);
  const breadthPct = (gainers.length / mitTrend.length) * 100;
  const pmi = computePmi(mitTrend).value;
  const verhaeltnis =
    gainers.length + losers.length > 0
      ? (gainers.length / (gainers.length + losers.length)) * 100
      : 50;

  const components: FearGreedComponent[] = [
    {
      label: 'Marktbreite',
      score: breadthPct,
      weight: FEAR_GREED_WEIGHTS.breadth,
      detail: `${gainers.length} von ${mitTrend.length} Karten über ihrem 30-Tage-Schnitt`,
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
      detail: `${gainers.length} gestiegen, ${losers.length} gefallen`,
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
