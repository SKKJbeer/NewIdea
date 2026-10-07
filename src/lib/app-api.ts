import type { PokemonCard, PriceDataPoint } from '@/types';
import type { MarketIndexPoint } from './market-index-store';

// ÖFFENTLICHE APP-SCHNITTSTELLE v1 (seit v6.22.0) — Grundlage der iOS-App.
//
// WARUM EINE EIGENE, VERSIONIERTE SCHNITTSTELLE: Eine installierte App lässt
// sich nicht zurückrollen. Ändert sich das Format einer Website-Route, wäre
// jede alte App-Version auf den Telefonen sofort kaputt. Deshalb:
//   - feste Pfade unter /api/v1, Felder werden nur ERGÄNZT, nie umbenannt
//   - eigene, schmale Datenformen (DTO) statt der internen Typen
//   - `status.minAppBuild` erzwingt bei Bedarf ein Update, statt still zu brechen
//
// WAHRHEITSPFLICHT GILT HIER WIE AUF DER SEITE: Jeder Preis trägt seinen
// Quellstand (`preisStand`) und ob er frisch ist (≤ 3 Tage). Die App zeigt den
// Stand an — ein alter Preis darf nie wie ein heutiger aussehen.
//
// Alles hier ist rein (keine Netz-, keine Datenbankzugriffe) und getestet.

export const APP_API_VERSION = 1;
/** Ältere App-Builds müssen aktualisieren (0 = keiner). */
export const MIN_APP_BUILD = 0;
/** So alt darf ein Preis höchstens sein, um als frisch zu gelten — wie im Marktindex. */
export const APP_FRISCH_MAX_TAGE = 3;
/** Bewegungen erst ab diesem Preis — darunter erzeugen Cent-Beträge riesige Prozentwerte. */
export const BEWEGUNG_MIN_PREIS = 2;

export interface KarteDto {
  id: string;
  name: string;
  nameDe: string | null;
  set: string;
  setCode: string;
  nummer: string | null;
  seltenheit: string | null;
  bild: string;
  /** Cardmarket-Preis-Trend in EUR. `null` = kein Preis. */
  preis: number | null;
  /** Preis gegen Ø 30 Tage in Prozent. `null` = nicht gemessen. */
  trend30: number | null;
  /** Quellstand des Preises (ISO-Datum). `null` = unbekannt. */
  preisStand: string | null;
  /** Quellstand höchstens `APP_FRISCH_MAX_TAGE` alt. */
  frisch: boolean;
  url: string;
}

export interface KartenDetailDto extends KarteDto {
  /** Cardmarket-Aufschlüsselung, nur Felder, die die Quelle geliefert hat. */
  aufschluesselung: { trend: number | null; ab: number | null; durchschnittVerkauf: number | null; durchschnitt30: number | null };
  /** Echte Tageswerte (keine Interpolation). Weniger als 2 Punkte = kein Verlauf anzeigen. */
  verlauf: Array<{ datum: string; preis: number }>;
}

export interface MarktDto {
  index: { wert: number; datum: string; karten: number; sets: number; fensterTage: number } | null;
  indexVerlauf: Array<{ datum: string; wert: number }>;
  aufwaerts: KarteDto[];
  abwaerts: KarteDto[];
  datenStand: string | null;
}

function zahl(x: unknown): number | null {
  const n = typeof x === 'number' ? x : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

/** Datumsteil eines Zeitstempels; ungültig → null (Stolperstelle 46). */
export function standTag(roh: string | undefined | null): string | null {
  if (!roh) return null;
  const t = roh.replace(/\//g, '-').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) && Number.isFinite(Date.parse(`${t}T00:00:00Z`)) ? t : null;
}

export function istFrisch(stand: string | null, jetzt = Date.now(), maxTage = APP_FRISCH_MAX_TAGE): boolean {
  if (!stand) return false;
  const alter = (jetzt - Date.parse(`${stand}T00:00:00Z`)) / 86_400_000;
  return Number.isFinite(alter) && alter <= maxTage + 1;
}

type MitStand = PokemonCard & { indexStand?: string };

export function karteDto(c: MitStand, basis: string, jetzt = Date.now()): KarteDto {
  const preis = zahl(c.prices?.market);
  const stand = standTag(c.indexStand ?? c.cmPrices?.updatedAt);
  return {
    id: c.id,
    name: c.name,
    nameDe: c.nameDe ?? null,
    set: c.set,
    setCode: c.setCode,
    nummer: c.number ?? null,
    seltenheit: c.rarity || null,
    bild: c.imageUrl,
    preis: preis !== null && preis > 0 ? preis : null,
    trend30: zahl(c.trendPercent),
    preisStand: stand,
    frisch: istFrisch(stand, jetzt),
    url: `${basis}/karten/${encodeURIComponent(c.id)}`,
  };
}

export function detailDto(c: MitStand, verlauf: PriceDataPoint[], basis: string, jetzt = Date.now()): KartenDetailDto {
  const cm = c.cmPrices ?? {};
  return {
    ...karteDto(c, basis, jetzt),
    aufschluesselung: {
      trend: zahl(cm.trend),
      ab: zahl(cm.low),
      durchschnittVerkauf: zahl(cm.avgSell),
      durchschnitt30: zahl(cm.avg30),
    },
    verlauf: verlauf
      .filter((p) => Number.isFinite(p.price) && p.price > 0 && standTag(p.date))
      .map((p) => ({ datum: standTag(p.date) as string, preis: p.price })),
  };
}

/**
 * Stärkste Bewegungen — NUR frische, gemessene Preise ab `BEWEGUNG_MIN_PREIS`.
 * Ein alter Preis mit großer Bewegung wäre eine Aussage über einen Markt, der
 * so nicht mehr existiert.
 */
export function bewegungen(karten: KarteDto[], anzahl = 10): { aufwaerts: KarteDto[]; abwaerts: KarteDto[] } {
  const tauglich = karten.filter((k) => k.frisch && k.preis !== null && k.preis >= BEWEGUNG_MIN_PREIS && k.trend30 !== null);
  const sortiert = [...tauglich].sort((a, b) => (b.trend30 as number) - (a.trend30 as number));
  return {
    aufwaerts: sortiert.filter((k) => (k.trend30 as number) > 0).slice(0, anzahl),
    abwaerts: sortiert.filter((k) => (k.trend30 as number) < 0).reverse().slice(0, anzahl),
  };
}

export function indexDto(p: MarketIndexPoint | null): MarktDto['index'] {
  if (!p || !Number.isFinite(p.value) || p.cardCount <= 0) return null;
  return { wert: p.value, datum: p.date, karten: p.cardCount, sets: p.setCount, fensterTage: p.windowDays };
}

/** Suchbegriff begrenzen: 2–60 Zeichen, sonst null. */
export function suchbegriff(roh: string | null): string | null {
  const q = (roh ?? '').trim().slice(0, 60);
  return q.length >= 2 ? q : null;
}

/** Kopfzeilen für alle v1-Antworten: kurz im CDN, bei Ausfall alter Stand. */
export const APP_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600, stale-if-error=86400';

// ── Portfolio (seit v6.23.0) ────────────────────────────────────────────────
// Das Portfolio liegt auf dem Gerät; die App fragt nur Preise und echte
// Tageswerte für ihre Karten ab. Nichts über den Bestand verlässt das Gerät
// außer den Karten-IDs.

/** Höchstens so viele Karten je Abfrage. */
export const PORTFOLIO_MAX_IDS = 100;
/** Längster abrufbarer Verlauf in Tagen. */
export const VERLAUF_MAX_TAGE = 365;
/** PostgREST kappt jede Antwort still bei 1.000 Zeilen (Stolperstelle in sitemap-karten). */
export const DB_ZEILEN_GRENZE = 1000;

/** `ids=a,b,c` → gültige, eindeutige IDs (rein). Ungültige fallen still weg, zu viele werden gekappt. */
export function idsAusParam(roh: string | null, max = PORTFOLIO_MAX_IDS): string[] {
  const ids = (roh ?? '').split(',').map((s) => s.trim()).filter((s) => /^[A-Za-z0-9._-]{1,40}$/.test(s));
  return [...new Set(ids)].slice(0, max);
}

/** Tage auf 1 … VERLAUF_MAX_TAGE begrenzen, Standard 90. */
export function tageAusParam(roh: string | null): number {
  const n = Number.parseInt(roh ?? '', 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), VERLAUF_MAX_TAGE) : 90;
}

/**
 * IDs so in Gruppen teilen, dass ids × tage unter der Zeilengrenze bleibt —
 * sonst schneidet die Datenbank den Verlauf still ab und die Kurve endet
 * mitten im Zeitraum, ohne dass es jemand merkt.
 */
export function idGruppen(ids: string[], tage: number, grenze = DB_ZEILEN_GRENZE): string[][] {
  const je = Math.max(1, Math.floor(grenze / Math.max(1, tage)));
  const gruppen: string[][] = [];
  for (let i = 0; i < ids.length; i += je) gruppen.push(ids.slice(i, i + je));
  return gruppen;
}
