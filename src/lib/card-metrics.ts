// KENNZAHLEN EINER EINZELNEN KARTE.
//
// Die Karten-Detailseite soll eine Frage beantworten: Was ist diese Karte wert
// und wie entwickelt sie sich? Alle Antworten hier stammen ausschließlich aus
// der echten Preisreihe.
//
// DURCHGÄNGIGER GRUNDSATZ: Jede Funktion gibt `null` zurück, wenn die Datenlage
// nicht reicht. Kein Zeitraum wird angezeigt, für den es keine Messung gibt —
// ein „24 h: 0,0 %" aus einer Reihe ohne gestrigen Wert wäre eine erfundene
// Aussage (CLAUDE.md → Preise: absolute Wahrheitspflicht).

import type { PriceDataPoint } from '@/types';

export interface PerformanceWindow {
  /** Kennung des Zeitraums, etwa `30T`. */
  label: string;
  days: number;
  changePct: number;
  /** Preis am Anfang des Zeitraums — die Bezugsgröße. */
  fromPrice: number;
  fromDate: string;
}

/** Angebotene Zeitfenster. `1J` bewusst als 365 Tage. */
export const PERFORMANCE_WINDOWS: Array<{ label: string; days: number }> = [
  { label: '24H', days: 1 },
  { label: '7T', days: 7 },
  { label: '30T', days: 30 },
  { label: '90T', days: 90 },
  { label: '1J', days: 365 },
];

/**
 * Wie weit ein Messpunkt vom gesuchten Datum entfernt sein darf.
 *
 * Ohne diese Grenze würde für „24 h" der nächstbeste Punkt genommen — und der
 * kann drei Wochen alt sein. Das Ergebnis hieße dann „24 h" und wäre eine
 * Monatsveränderung.
 */
const MAX_ABWEICHUNG_TAGE: Record<number, number> = { 1: 2, 7: 3, 30: 7, 90: 15, 365: 45 };

function tageDifferenz(a: string, b: string): number {
  const t1 = new Date(a + 'T00:00:00Z').getTime();
  const t2 = new Date(b + 'T00:00:00Z').getTime();
  return Math.abs(t1 - t2) / 86_400_000;
}

/** Sortierte, bereinigte Reihe — Grundlage aller Berechnungen hier. */
function reihe(history: PriceDataPoint[]): PriceDataPoint[] {
  return history
    .filter((p) => p && p.date && Number.isFinite(p.price) && p.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Veränderung über die angebotenen Zeitfenster.
 *
 * Nur Fenster, für die ein Messpunkt in vertretbarer Nähe existiert, werden
 * zurückgegeben. Fehlt er, fehlt das Fenster — statt einer Null.
 */
export function performanceWindows(
  history: PriceDataPoint[],
  currentPrice: number,
  today: string = new Date().toISOString().slice(0, 10),
): PerformanceWindow[] {
  const punkte = reihe(history);
  if (punkte.length < 2 || !(currentPrice > 0)) return [];

  const ergebnis: PerformanceWindow[] = [];
  for (const { label, days } of PERFORMANCE_WINDOWS) {
    const ziel = new Date(today + 'T00:00:00Z');
    ziel.setUTCDate(ziel.getUTCDate() - days);
    const zielDatum = ziel.toISOString().slice(0, 10);

    let bester: PriceDataPoint | null = null;
    let besteDistanz = Infinity;
    for (const p of punkte) {
      // Die Bezugsgröße MUSS in der Vergangenheit liegen. Ohne diese Bedingung
      // wählt „24 h" bei dünner Reihe den heutigen Punkt — also den aktuellen
      // Preis gegen sich selbst, was immer 0,0 % ergibt und wie eine Messung
      // aussieht.
      if (p.date >= today) continue;
      const d = tageDifferenz(p.date, zielDatum);
      if (d < besteDistanz) {
        besteDistanz = d;
        bester = p;
      }
    }
    const grenze = MAX_ABWEICHUNG_TAGE[days] ?? 7;
    if (!bester || besteDistanz > grenze || bester.price <= 0) continue;

    ergebnis.push({
      label,
      days,
      changePct: ((currentPrice - bester.price) / bester.price) * 100,
      fromPrice: bester.price,
      fromDate: bester.date,
    });
  }
  return ergebnis;
}

export interface CardMarketStats {
  ath: { price: number; date: string; distancePct: number } | null;
  high30: number | null;
  low30: number | null;
  /** Standardabweichung der Tagesveränderungen in Prozent. */
  volatilityPct: number | null;
  /** Anzahl echter Messpunkte, auf denen diese Werte beruhen. */
  points: number;
}

/** Ab so vielen Punkten ist eine Schwankungsbreite überhaupt aussagekräftig. */
export const MIN_POINTS_FOR_VOLATILITY = 5;

/**
 * Marktkennzahlen aus der Preisreihe.
 *
 * Das Allzeithoch ist bewusst „das Hoch der vorliegenden Reihe" und nicht „das
 * Hoch aller Zeiten" — die Datenbasis reicht nicht weiter zurück, und ein als
 * ATH bezeichneter Wert aus 90 Tagen wäre irreführend. Die Oberfläche
 * beschriftet es entsprechend.
 */
export function cardMarketStats(
  history: PriceDataPoint[],
  currentPrice: number,
  today: string = new Date().toISOString().slice(0, 10),
): CardMarketStats {
  const punkte = reihe(history);
  if (punkte.length === 0) {
    return { ath: null, high30: null, low30: null, volatilityPct: null, points: 0 };
  }

  const hoechster = punkte.reduce((a, b) => (b.price > a.price ? b : a));
  const ath =
    currentPrice > 0
      ? {
          price: hoechster.price,
          date: hoechster.date,
          distancePct: ((currentPrice - hoechster.price) / hoechster.price) * 100,
        }
      : null;

  const grenze = new Date(today + 'T00:00:00Z');
  grenze.setUTCDate(grenze.getUTCDate() - 30);
  const letzte30 = punkte.filter((p) => p.date >= grenze.toISOString().slice(0, 10));
  const high30 = letzte30.length > 0 ? Math.max(...letzte30.map((p) => p.price)) : null;
  const low30 = letzte30.length > 0 ? Math.min(...letzte30.map((p) => p.price)) : null;

  let volatilityPct: number | null = null;
  if (punkte.length >= MIN_POINTS_FOR_VOLATILITY) {
    const veraenderungen: number[] = [];
    for (let i = 1; i < punkte.length; i++) {
      const vorher = punkte[i - 1].price;
      if (vorher > 0) veraenderungen.push(((punkte[i].price - vorher) / vorher) * 100);
    }
    if (veraenderungen.length >= 2) {
      const mittel = veraenderungen.reduce((a, b) => a + b, 0) / veraenderungen.length;
      const varianz =
        veraenderungen.reduce((s, v) => s + (v - mittel) ** 2, 0) / veraenderungen.length;
      volatilityPct = Math.sqrt(varianz);
    }
  }

  return { ath, high30, low30, volatilityPct, points: punkte.length };
}

// ── Markt-Score ───────────────────────────────────────────────────────────────

export interface ScoreFactor {
  label: string;
  value: number;
  detail: string;
}

export interface PmiScore {
  total: number;
  factors: ScoreFactor[];
  /** Reicht die Datenlage für einen Score? */
  sufficient: boolean;
}

/** Ohne diese Mindestmenge an Messpunkten gibt es keinen Score. */
export const MIN_POINTS_FOR_SCORE = 4;

function begrenzen(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/**
 * Datenbasierte Marktkennzahl je Karte — KEINE Kaufempfehlung.
 *
 * Der frühere Score vergab Punkte nach Preisstufen und Seltenheitsnamen
 * („> 100 € = +20"). Das ist eine Meinung in Zahlenform: teuer wurde
 * automatisch als besser bewertet. Der Score entsteht jetzt aus vier
 * offengelegten Faktoren, die alle aus der Preisreihe stammen — und jeder
 * Faktor wird in der Oberfläche einzeln ausgewiesen.
 */
export function pmiScore(
  history: PriceDataPoint[],
  currentPrice: number,
  trendPercent: number | undefined,
): PmiScore {
  const stats = cardMarketStats(history, currentPrice);
  const punkte = reihe(history);

  if (punkte.length < MIN_POINTS_FOR_SCORE || !(currentPrice > 0)) {
    return { total: 0, factors: [], sufficient: false };
  }

  // Momentum: 30-Tage-Trend, abgebildet von −20 % bis +20 %.
  const trend = Number.isFinite(trendPercent) ? (trendPercent as number) : 0;
  const momentum = begrenzen(((trend + 20) / 40) * 100);

  // Stabilität: wenig Schwankung ist ein hoher Wert. 8 % Tagesschwankung = 0.
  const vola = stats.volatilityPct ?? 0;
  const stabilitaet = begrenzen(100 - (vola / 8) * 100);

  // Nachfrage: Abstand zum Hoch der Reihe. Am Hoch = 100.
  const abstand = stats.ath ? Math.abs(stats.ath.distancePct) : 0;
  const nachfrage = begrenzen(100 - abstand * 2);

  // Datenlage: Wie gut ist diese Karte überhaupt belegt? Ein Score aus vier
  // Punkten verdient weniger Vertrauen als einer aus neunzig.
  const datenlage = begrenzen((punkte.length / 60) * 100);

  const factors: ScoreFactor[] = [
    {
      label: 'Momentum',
      value: Math.round(momentum),
      detail: `30-Tage-Trend ${trend >= 0 ? '+' : ''}${Math.round(trend * 10) / 10} %`,
    },
    {
      label: 'Stabilität',
      value: Math.round(stabilitaet),
      detail:
        stats.volatilityPct !== null
          ? `Mittlere Tagesschwankung ${Math.round(vola * 10) / 10} %`
          : 'Zu wenige Punkte für eine Schwankungsbreite',
    },
    {
      label: 'Nachfrage',
      value: Math.round(nachfrage),
      detail: stats.ath
        ? `${Math.round(Math.abs(stats.ath.distancePct))} % unter dem Höchstwert der Reihe`
        : 'Kein Höchstwert bestimmbar',
    },
    {
      label: 'Datenlage',
      value: Math.round(datenlage),
      detail: `${punkte.length} echte Messpunkte`,
    },
  ];

  const total = Math.round(factors.reduce((s, f) => s + f.value, 0) / factors.length);
  return { total, factors, sufficient: true };
}
