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

// ── Inhalte: Marktbericht, Artikel, Guides (seit v6.24.0) ───────────────────
// Dieselben Texte wie auf der Website, als schlichte Datenform. Die App rendert
// `## ` im Bericht als Zwischenüberschrift. `archiv: true` = Zahlen im Text
// können veraltet sein (Ersatztext oder vor dem frischen Tagesindex erzeugt) —
// die App zeigt dann denselben Hinweis wie die Seite.

/** Bildkarte in Lese-Inhalten. Preis = Stand bei Erstellung des Textes (`stand`), nie als aktuell ausgeben. */
export interface InhaltKarteDto {
  name: string;
  bild: string;
  preis: number | null;
  trend30: number | null;
  seltenheit: string | null;
  set: string | null;
  setCode: string | null;
  /** Karten-ID für die Kartenseite (aktueller Preis), wenn bekannt. */
  id: string | null;
  /** Kurze Begründung (Guides). */
  warum: string | null;
}

const httpsBild = (u: unknown): string | null => (typeof u === 'string' && /^https:\/\//.test(u) ? u : null);

/** Karten aus Artikeln/Berichten/Guides — ohne Bild keine Karte (rein). */
export function inhaltKarte(c: {
  id?: string; name?: string; imageUrl?: string; price?: number; trend?: number; trendPercent?: number; rarity?: string;
  set?: string; setCode?: string; setId?: string; why?: string; prices?: { market?: number };
} | null | undefined): InhaltKarteDto | null {
  if (!c) return null;
  const bild = httpsBild(c.imageUrl);
  if (!bild || !c.name) return null;
  const preis = zahl(c.price ?? c.prices?.market);
  return {
    name: c.name,
    bild,
    preis: preis !== null && preis > 0 ? preis : null,
    trend30: zahl(c.trend ?? c.trendPercent),
    seltenheit: c.rarity || null,
    set: c.set || null,
    setCode: c.setCode || c.setId || null,
    id: c.id && /^[A-Za-z0-9._-]{1,40}$/.test(c.id) ? c.id : null,
    warum: c.why || null,
  };
}

const karten = (liste: unknown[] | undefined, max = 12): InhaltKarteDto[] =>
  (liste ?? []).map((c) => inhaltKarte(c as Parameters<typeof inhaltKarte>[0])).filter((c): c is InhaltKarteDto => c !== null).slice(0, max);

export interface ArtikelDto {
  datum: string;
  typ: string;
  kategorie: string;
  titel: string;
  intro: string;
  abschnitte: Array<{ ueberschrift: string; text: string; karte?: InhaltKarteDto | null }>;
  /** Seit v6.27.0: Karten des Artikels mit Bild. */
  karten?: InhaltKarteDto[];
  kernpunkte: string[];
  quellen: Array<{ label: string; url: string }>;
  lesezeit: number;
  archiv: boolean;
  url: string;
}

export interface GuideDto {
  slug: string;
  titel: string;
  beschreibung: string;
  intro: string;
  abschnitte: Array<{ ueberschrift: string; text: string; tipp: string | null; karten?: InhaltKarteDto[] }>;
  kernpunkte: string[];
  lesezeit: number;
  url: string;
  /** Seit v6.27.0: Lucide-Schlüssel des Guides (App setzt ein passendes Symbol). */
  icon?: string | null;
  badge?: string | null;
}

const text = (x: unknown): string => (typeof x === 'string' ? x : '');

export function artikelDto(
  a: { title?: string; intro?: string; sections?: Array<{ heading?: string; content?: string; highlight?: unknown }>; keyPoints?: string[];
       sources?: Array<{ label: string; url: string }>; readingTimeMin?: number; featuredCards?: unknown[] },
  meta: { datum: string; typ: string; kategorie: string; archiv: boolean },
  basis: string,
): ArtikelDto {
  const abschnitte = (a.sections ?? [])
    .map((s) => ({ ueberschrift: text(s.heading), text: text(s.content), karte: inhaltKarte(s.highlight as Parameters<typeof inhaltKarte>[0]) }))
    .filter((s) => s.text);
  const woerter = [a.intro ?? '', ...abschnitte.map((s) => s.text)].join(' ').split(/\s+/).filter(Boolean).length;
  return {
    datum: meta.datum,
    typ: meta.typ,
    kategorie: meta.kategorie,
    titel: text(a.title),
    intro: text(a.intro),
    abschnitte,
    karten: karten(a.featuredCards),
    kernpunkte: (a.keyPoints ?? []).filter((k) => typeof k === 'string' && k.trim()),
    quellen: (a.sources ?? []).filter((q) => q && /^https:\/\//.test(q.url)),
    lesezeit: a.readingTimeMin && a.readingTimeMin > 0 ? a.readingTimeMin : Math.max(1, Math.round(woerter / 200)),
    archiv: meta.archiv,
    url: `${basis}/artikel/${meta.datum}`,
  };
}

export function guideDto(
  g: { slug: string; title: string; metaDescription?: string; intro?: string; readingTimeMin?: number; keyPoints?: string[];
       sections?: Array<{ heading?: string; content?: string; tip?: string; cards?: unknown[] }>; icon?: string; badge?: string },
  basis: string,
): GuideDto {
  return {
    slug: g.slug,
    titel: g.title,
    beschreibung: text(g.metaDescription),
    intro: text(g.intro),
    abschnitte: (g.sections ?? []).map((s) => ({ ueberschrift: text(s.heading), text: text(s.content), tipp: s.tip ? s.tip : null, karten: karten(s.cards, 6) }))
      .filter((s) => s.text),
    icon: g.icon || null,
    badge: g.badge || null,
    kernpunkte: (g.keyPoints ?? []).filter((k) => typeof k === 'string' && k.trim()),
    lesezeit: g.readingTimeMin && g.readingTimeMin > 0 ? g.readingTimeMin : 5,
    url: `${basis}/guides/${g.slug}`,
  };
}

/** Datum im Format JJJJ-MM-TT, nicht in der Zukunft (rein). */
export function gueltigesDatum(roh: string, heute = new Date().toISOString().slice(0, 10)): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(roh) && Number.isFinite(Date.parse(`${roh}T00:00:00Z`)) && roh <= heute ? roh : null;
}

// ── Ausbau (seit v6.25.0): Marktbreite, Set-Bewegung, Neuheiten, Sets, Sprachpreise ──
// Alles additiv — ältere App-Builds ignorieren die neuen Felder.

export interface SetEintragDto {
  setCode: string;
  name: string;
  serie: string;
  datum: string | null;
  karten: number;
  logo: string | null;
  symbol: string | null;
}

export function setEintragDto(s: { id: string; name: string; series?: string; releaseDate?: string; total?: number; logoUrl?: string; symbolUrl?: string }): SetEintragDto {
  return {
    setCode: s.id,
    name: s.name,
    serie: s.series ?? '',
    datum: standTag(s.releaseDate ?? null),
    karten: Number.isFinite(s.total) ? (s.total as number) : 0,
    logo: s.logoUrl && /^https:\/\//.test(s.logoUrl) ? s.logoUrl : null,
    symbol: s.symbolUrl && /^https:\/\//.test(s.symbolUrl) ? s.symbolUrl : null,
  };
}

export type SprachDto =
  | { sprache: 'JP' | 'KR'; ok: true; trend: number; ab: number | null; durchschnitt30: number | null; stand: string | null; gegenstueck: { name: string; set: string } }
  | { sprache: 'JP' | 'KR'; ok: false; grund: string };

/** Klartext für fehlende Sprachpreise — nie ein geratener Wert. */
export const SPRACH_GRUND: Record<string, string> = {
  'keine-zuordnung': 'Keine eindeutige Zuordnung zu einer Karte dieser Sprache',
  'kein-preis': 'Kein Cardmarket-Preis für diese Ausgabe',
  veraltet: 'Preis älter als erlaubt — nicht angezeigt',
  'nicht-geladen': 'Sprachpreise gerade nicht verfügbar',
};

export function sprachDto(
  a: { sprache: 'JP' | 'KR'; ok: true; preis: { trend: number; low: number | null; avg30: number | null }; stand: string; gegenstueck: { name: string; set: string } }
   | { sprache: 'JP' | 'KR'; ok: false; grund: string },
): SprachDto {
  if (!a.ok) return { sprache: a.sprache, ok: false, grund: SPRACH_GRUND[a.grund] ?? 'Nicht verfügbar' };
  return {
    sprache: a.sprache,
    ok: true,
    trend: a.preis.trend,
    ab: zahl(a.preis.low),
    durchschnitt30: zahl(a.preis.avg30),
    stand: standTag(a.stand),
    gegenstueck: { name: a.gegenstueck.name, set: a.gegenstueck.set },
  };
}

export interface MarktZusatzDto {
  breite: { steigend: number; fallend: number; gesamt: number } | null;
  vorwoche: { wert: number; datum: string } | null;
  setBewegung: Array<{ setCode: string; name: string; median: number; karten: number; datum: string | null }>;
  neuheiten: {
    neu: Array<{ setCode: string; name: string; datum: string; logo: string | null }>;
    kommend: Array<{ setCode: string; name: string; datum: string; logo: string | null }>;
    japan: Array<{ name: string; nameEn: string | null; datum: string; karten: number }>;
  } | null;
}

export function marktZusatz(l: {
  breite: { steigend: number; fallend: number; gesamt: number } | null;
  vorwoche: { wert: number; datum: string } | null;
  sets: Array<{ setCode: string; name: string; median: number; karten: number; datum: string | null }>;
  neuheiten: { sets: Array<{ setCode: string; name: string; datum: string; logo: string | null }>;
               kommend: Array<{ setCode: string; name: string; datum: string; logo: string | null }>;
               japan: Array<{ name: string; nameEn: string | null; datum: string; gesamt: number }> } | null;
}): MarktZusatzDto {
  const sicher = (u: string | null) => (u && /^https:\/\//.test(u) ? u : null);
  return {
    breite: l.breite && l.breite.gesamt > 0 ? l.breite : null,
    vorwoche: l.vorwoche,
    setBewegung: [...l.sets].filter((s) => Number.isFinite(s.median)).sort((a, b) => b.median - a.median)
      .map((s) => ({ setCode: s.setCode, name: s.name, median: s.median, karten: s.karten, datum: s.datum })),
    neuheiten: l.neuheiten ? {
      neu: l.neuheiten.sets.map((s) => ({ setCode: s.setCode, name: s.name, datum: s.datum, logo: sicher(s.logo) })),
      kommend: l.neuheiten.kommend.map((s) => ({ setCode: s.setCode, name: s.name, datum: s.datum, logo: sicher(s.logo) })),
      japan: l.neuheiten.japan.map((s) => ({ name: s.name, nameEn: s.nameEn, datum: s.datum, karten: s.gesamt })),
    } : null,
  };
}

export interface KaufDto {
  cardmarket: string;
  /** true = geprüfte Produktseite der Karte, false = Suche nach dem Namen. */
  cardmarketGenau: boolean;
  amazonKarte: string;
  amazonBooster: string;
}

/** Kauf-Links für die App — dieselben wie auf der Kartenseite (kauf-links.ts). */
export function kaufDto(l: { cardmarket: { url: string; genau: boolean }; amazonKarte: string; amazonBooster: string }): KaufDto {
  return { cardmarket: l.cardmarket.url, cardmarketGenau: l.cardmarket.genau, amazonKarte: l.amazonKarte, amazonBooster: l.amazonBooster };
}

/** Karten eines Wochenberichts (Stand: Erstellung des Berichts) — rein. */
export function berichtKarten(b: { topGainers?: unknown[]; topValue?: unknown[] }): { aufwaerts: InhaltKarteDto[]; wertvollste: InhaltKarteDto[] } {
  return { aufwaerts: karten(b.topGainers, 10), wertvollste: karten(b.topValue, 10) };
}

/** Kurzer Anreißer aus dem Intro: an einer Wortgrenze, höchstens `max` Zeichen (rein). */
export function anreisser(t: string, max = 160): string {
  const s = t.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const schnitt = s.slice(0, max);
  return `${schnitt.slice(0, Math.max(schnitt.lastIndexOf(' '), max - 20)).trim()} …`;
}
