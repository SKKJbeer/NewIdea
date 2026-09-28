// SPRACHAUSGABEN EINER KARTE — EXAKTE ZUORDNUNG, NIE GERATEN.
//
// Cardmarket fuehrt englische, deutsche und die anderen europaeischen
// Ausgaben einer Karte als EIN Produkt; der Preis-Trend fasst sie zusammen.
// Japanische und koreanische Karten sind dagegen EIGENE Produkte in eigenen
// Erweiterungen, mit eigenem Preis. Um den japanischen Preis „dieser Karte"
// zu nennen, braucht es also das japanische Gegenstueck — und genau diese
// Zuordnung darf nicht geraten sein.
//
// DATENQUELLEN (beide oeffentlich):
// - TCGdex (en/ja/ko): Karte → Cardmarket-Produkt (`idProduct`), Illustrator,
//   Seltenheit, Set mit Erscheinungsdatum.
// - Cardmarket-Produktkatalog: Produkt → `idMetacard`. Alle Drucke mit
//   demselben Namen und denselben Attacken teilen sich eine Metakarte — ueber
//   Sprachen UND Nachdrucke hinweg.
//
// DIE METAKARTE ALLEIN REICHT NICHT (gemessen 28.09.2026): Neo-Discovery-
// Despotar landete auf dem Despotar aus „Champion Road" (2018, gleiche
// Attacken, gleicher Illustrator), Ho-Oh GX aus Guardians Rising auf einem
// spaeteren japanischen Nachdruck. Deshalb sechs Schranken, alle muessen halten:
//
//  1. Das Produkt ist in seiner Sprache EINDEUTIG (TCGdex vergibt teils ein
//     Produkt an mehrere Karten — Jungle 1–8 teilen sich Produkte).
//  2. Gleiche Metakarte.
//  3. Gleicher Illustrator, auf BEIDEN Seiten angegeben.
//  4. Die Sets gehoeren nachweislich zusammen: Mindestens drei Karten und je
//     ein Fuenftel der Treffer beider Sets verbinden sie, und das japanische
//     Set erschien hoechstens 400 Tage vor bis 60 Tage nach dem englischen.
//     (Japanische Sets erscheinen zuerst; ein spaeter Nachdruck faellt heraus.)
//  5. Die Seltenheit widerspricht sich nicht (Gold-Karte ↔ normale Karte).
//  6. Genau EIN Kandidat — und umgekehrt zeigt auch nur eine englische Karte
//     auf ihn (Bijektion).
//
// Ausserdem: Ist ein beteiligtes Set nicht vollstaendig eingelesen, entfaellt
// es. Eine fehlende Karte koennte sonst einen zweiten Kandidaten verstecken
// und einen falschen eindeutig aussehen lassen.
//
// Was hier nicht eindeutig ist, bekommt KEINEN Preis. Ein fehlender Preis ist
// besser als der Preis einer anderen Karte.

export type Fremdsprache = 'JP' | 'KR';
export const FREMDSPRACHEN: readonly Fremdsprache[] = ['JP', 'KR'];
export const DEX_SPRACHE: Readonly<Record<Fremdsprache | 'EN', 'en' | 'ja' | 'ko'>> = { EN: 'en', JP: 'ja', KR: 'ko' };

export const ZUORDNUNGS_REGELN = {
  MIN_SETPAAR_KARTEN: 3,
  MIN_SETPAAR_ANTEIL: 0.2,
  /** Das fremde Set darf so viele Tage VOR dem englischen erschienen sein. */
  FENSTER_VOR_TAGE: 400,
  /** … und so viele Tage DANACH. */
  FENSTER_NACH_TAGE: 60,
} as const;

export interface KatalogKarte {
  id: string;
  name: string;
  set: string;
  illustrator: string | null;
  rarity: string | null;
  produkt: number | null;
}

export interface KatalogSet {
  id: string;
  name: string;
  datum: string | null;
  /** Karten, die TCGdex im Set fuehrt, aber nicht ausliefert (404). */
  fehlend: number;
}

export interface Katalog {
  sets: Record<string, KatalogSet>;
  karten: KatalogKarte[];
}

export interface Gegenstueck {
  id: string;
  name: string;
  set: string;
  setName: string;
  produkt: number;
}

export interface ZuordnungsEintrag {
  enName: string;
  enProdukt: number;
  JP?: Gegenstueck;
  KR?: Gegenstueck;
}

export type Zuordnungsgrund =
  | 'eindeutig'
  | 'en-unvollstaendig'
  | 'en-produkt-doppelt'
  | 'set-lueckenhaft'
  | 'kein-kandidat'
  | 'mehrdeutig'
  | 'rueckwaerts-mehrdeutig';

const tageZwischen = (a: string, b: string): number | null => {
  const ta = Date.parse(a.slice(0, 10));
  const tb = Date.parse(b.slice(0, 10));
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;
  return Math.round((tb - ta) / 86_400_000);
};

const illustratorGleich = (a: KatalogKarte, b: KatalogKarte): boolean =>
  !!a.illustrator && !!b.illustrator && a.illustrator.trim().toLowerCase() === b.illustrator.trim().toLowerCase();

const EINFACH = new Set(['common', 'uncommon']);
const NEUTRAL = new Set(['rare', 'holo rare', 'rare holo', 'promo', 'none']);

/** Seltenheitsklasse: einfach (C/U), neutral (Rare, Holo, Promo, unbekannt), besonders (alles darueber). */
export function seltenheitsKlasse(r: string | null): 'einfach' | 'neutral' | 'besonders' {
  const n = (r ?? 'none').trim().toLowerCase();
  if (EINFACH.has(n)) return 'einfach';
  if (NEUTRAL.has(n)) return 'neutral';
  return 'besonders';
}

/** Gold-, Illustrations- oder Full-Art-Karte gegen eine gewoehnliche: das ist nie dieselbe Karte. */
export function seltenheitWiderspricht(a: string | null, b: string | null): boolean {
  const ka = seltenheitsKlasse(a);
  const kb = seltenheitsKlasse(b);
  return (ka === 'einfach' && kb === 'besonders') || (ka === 'besonders' && kb === 'einfach');
}

/** Karten mit einem Produkt, das in ihrer Sprache nur EINE Karte traegt und im Katalog steht. */
function eindeutigeKarten(karten: KatalogKarte[], metakarte: ReadonlyMap<number, number>): KatalogKarte[] {
  const zahl = new Map<number, number>();
  for (const k of karten) if (k.produkt) zahl.set(k.produkt, (zahl.get(k.produkt) ?? 0) + 1);
  return karten.filter((k) => k.produkt && zahl.get(k.produkt) === 1 && metakarte.has(k.produkt));
}

export interface ZuordnungsErgebnis {
  /** EN-TCGdex-ID → Gegenstueck. */
  paare: Map<string, { en: KatalogKarte; ziel: KatalogKarte }>;
  setPaare: Array<[string, string]>;
  statistik: Record<Zuordnungsgrund, number>;
}

/**
 * Baut die Zuordnung EN → Zielsprache. Rein (keine Netzzugriffe), damit jede
 * Schranke im Test einzeln belegt werden kann.
 */
export function bauZuordnung(
  en: Katalog,
  ziel: Katalog,
  metakarte: ReadonlyMap<number, number>,
): ZuordnungsErgebnis {
  const R = ZUORDNUNGS_REGELN;
  const statistik: Record<Zuordnungsgrund, number> = {
    eindeutig: 0, 'en-unvollstaendig': 0, 'en-produkt-doppelt': 0, 'set-lueckenhaft': 0,
    'kein-kandidat': 0, mehrdeutig: 0, 'rueckwaerts-mehrdeutig': 0,
  };

  const enEindeutig = eindeutigeKarten(en.karten, metakarte);
  const enEindeutigIds = new Set(enEindeutig.map((k) => k.id));
  const zielEindeutig = eindeutigeKarten(ziel.karten, metakarte);

  const proMeta = new Map<number, KatalogKarte[]>();
  for (const z of zielEindeutig) {
    const m = metakarte.get(z.produkt!)!;
    const l = proMeta.get(m);
    if (l) l.push(z); else proMeta.set(m, [z]);
  }
  const kandidatenRoh = (e: KatalogKarte) =>
    (proMeta.get(metakarte.get(e.produkt!)!) ?? []).filter((z) => illustratorGleich(e, z));

  // Schranke 4 — welche Sets gehoeren zusammen?
  const paarZahl = new Map<string, number>();
  const enSumme = new Map<string, number>();
  const zielSumme = new Map<string, number>();
  for (const e of enEindeutig) {
    for (const z of kandidatenRoh(e)) {
      const s = `${e.set}\u0000${z.set}`;
      paarZahl.set(s, (paarZahl.get(s) ?? 0) + 1);
      enSumme.set(e.set, (enSumme.get(e.set) ?? 0) + 1);
      zielSumme.set(z.set, (zielSumme.get(z.set) ?? 0) + 1);
    }
  }
  const setPaare = new Set<string>();
  for (const [s, n] of paarZahl) {
    const [E, Z] = s.split('\u0000');
    const dE = en.sets[E]?.datum;
    const dZ = ziel.sets[Z]?.datum;
    if (!dE || !dZ) continue;
    const abstand = tageZwischen(dE, dZ);
    if (abstand === null || abstand < -R.FENSTER_VOR_TAGE || abstand > R.FENSTER_NACH_TAGE) continue;
    if (n >= R.MIN_SETPAAR_KARTEN && n >= R.MIN_SETPAAR_ANTEIL * enSumme.get(E)! && n >= R.MIN_SETPAAR_ANTEIL * zielSumme.get(Z)!) {
      setPaare.add(s);
    }
  }

  // Lueckenhafte Sets: selbst lueckenhaft, oder ein Partner-Set ist es.
  const lueckenhaft = (sets: Record<string, KatalogSet>, id: string) => !sets[id] || sets[id].fehlend > 0;
  const gesperrtEn = new Set<string>();
  for (const s of setPaare) {
    const [E, Z] = s.split('\u0000');
    if (lueckenhaft(en.sets, E) || lueckenhaft(ziel.sets, Z)) gesperrtEn.add(E);
  }

  const vorlaeufig = new Map<string, { en: KatalogKarte; ziel: KatalogKarte }>();
  for (const e of en.karten) {
    if (!e.produkt || !e.illustrator) { statistik['en-unvollstaendig']++; continue; }
    if (!enEindeutigIds.has(e.id)) { statistik['en-produkt-doppelt']++; continue; }
    if (gesperrtEn.has(e.set)) { statistik['set-lueckenhaft']++; continue; }
    const k = kandidatenRoh(e).filter(
      (z) => setPaare.has(`${e.set}\u0000${z.set}`) && !seltenheitWiderspricht(e.rarity, z.rarity),
    );
    if (k.length === 0) { statistik['kein-kandidat']++; continue; }
    if (k.length > 1) { statistik.mehrdeutig++; continue; }
    vorlaeufig.set(e.id, { en: e, ziel: k[0] });
  }

  // Schranke 6 — Bijektion.
  const rueck = new Map<string, number>();
  for (const p of vorlaeufig.values()) rueck.set(p.ziel.id, (rueck.get(p.ziel.id) ?? 0) + 1);
  const paare = new Map<string, { en: KatalogKarte; ziel: KatalogKarte }>();
  for (const [id, p] of vorlaeufig) {
    if (rueck.get(p.ziel.id) === 1) { paare.set(id, p); statistik.eindeutig++; }
    else statistik['rueckwaerts-mehrdeutig']++;
  }

  return {
    paare,
    setPaare: [...setPaare].map((s) => s.split('\u0000') as [string, string]).sort(),
    statistik,
  };
}

// ── Preise aus dem offiziellen Cardmarket-Preisverzeichnis ──────────────────

export interface SprachPreis {
  trend: number;
  avg: number | null;
  low: number | null;
  avg7: number | null;
  avg30: number | null;
}

interface GuideZeile {
  idProduct: number;
  trend?: number | null;
  avg?: number | null;
  low?: number | null;
  avg7?: number | null;
  avg30?: number | null;
}

const positiv = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

/**
 * Preise der gesuchten Produkte aus dem Preisverzeichnis. Ohne positiven
 * Preis-Trend KEIN Eintrag — 0 ist bei Cardmarket „kein Wert", kein Preis.
 */
export function preiseAusVerzeichnis(zeilen: GuideZeile[], gesucht: ReadonlySet<number>): Record<string, SprachPreis> {
  const aus: Record<string, SprachPreis> = {};
  for (const z of zeilen) {
    if (!gesucht.has(z.idProduct)) continue;
    const trend = positiv(z.trend);
    if (trend === null) continue;
    aus[String(z.idProduct)] = {
      trend,
      avg: positiv(z.avg),
      low: positiv(z.low),
      avg7: positiv(z.avg7),
      avg30: positiv(z.avg30),
    };
  }
  return aus;
}

/** Cardmarket schreibt `2026-09-28T02:47:59+0200` — ohne Doppelpunkt im Versatz. Liefert ISO oder null. */
export function verzeichnisStand(createdAt: unknown): string | null {
  if (typeof createdAt !== 'string') return null;
  const t = Date.parse(createdAt.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
