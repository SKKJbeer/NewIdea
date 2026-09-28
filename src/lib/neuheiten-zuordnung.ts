// NEUE SETS: PREISE DIREKT AUS DEM CARDMARKET-PREISVERZEICHNIS — NIE GERATEN.
//
// Befund 28.09.2026: Die Jubiläums-Sets „30th Celebration“ und „30th Classic
// Collection“ (erschienen 16.09.2026) hatten bei pokemontcg.io UND TCGdex
// keinen einzigen Preis — die Set-Seiten meldeten „nicht gefunden“, Trends und
// Berichte kannten das Jubiläum nicht. Cardmarket selbst führte die Preise da
// schon seit zwei Wochen. Jedes neue Set trifft das in den ersten Wochen, also
// genau dann, wenn es die meisten Leute interessiert.
//
// Diese Datei ordnet Karten eines neuen Sets ihren Cardmarket-Produkten zu —
// rein, ohne Netz, jede Schranke im Test belegt:
//
//  1. WELCHE ERWEITERUNG: Die Cardmarket-Kataloge nennen keine Sprache. Die
//     versiegelten Produkte tun es: „30th Celebration Booster“ (international)
//     gegen „30th Celebration JP Booster“, „… Simplified Chinese Booster“.
//     Gilt nur eine Erweiterung, deren Booster/ETB/Display EXAKT „<Setname>
//     <Produktart>“ heißt — ohne Sprachzusatz. Mehrere oder keine: kein Preis.
//  2. WELCHE KARTE: Cardmarket benennt Einzelkarten „Name [Fähigkeit | Attacke
//     …]“. Dieser Schlüssel muss unter den Karten des Sets (bzw. aller Sets
//     derselben Erweiterung) GENAU einmal vorkommen UND in der Erweiterung
//     genau ein Produkt treffen. Zwei ex-Drucke mit identischen Attacken
//     (normal + Special Illustration Rare) sind nicht unterscheidbar — die
//     bekommen keinen Einzelpreis, sondern werden als „mehrdeutig“ mit ALLEN
//     Produktpreisen geführt, ohne zu behaupten, welcher welcher ist.

export interface CmEinzel {
  idProduct: number;
  name: string;
  idExpansion: number;
}

export interface CmVersiegelt {
  idProduct: number;
  name: string;
  idExpansion: number;
  categoryName?: string;
}

export interface GuidePreis {
  trend: number;
  avg: number | null;
  low: number | null;
  avg7: number | null;
  avg30: number | null;
}

export interface NeuKarte {
  /** TCGdex-ID, z. B. `30th-001`. */
  id: string;
  name: string;
  localId: string;
  rarity: string | null;
  bild: string | null;
  faehigkeiten: string[];
  attacken: string[];
}

/** Produktarten, an deren Namen die Erweiterung eines Sets erkannt wird. */
export const ERKENNUNGS_ARTEN = [
  'Booster',
  'Sleeved Booster',
  'Booster Box',
  'Booster Bundle',
  'Elite Trainer Box',
  'Pokémon Center Elite Trainer Box',
] as const;

const SPRACHZUSATZ = /\b(JP|Japanese|Korean|KR|Chinese|Simplified|Traditional|Indonesian|Thai|T-Chinese|S-Chinese)\b/i;

/** Namensform für den Vergleich: Doppelpunkt weg, Leerraum zusammengefasst. */
export function setNamensForm(name: string): string {
  return name.replace(/:/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Die Cardmarket-Erweiterung eines Sets — oder null, wenn sie nicht EINDEUTIG
 * belegt ist. `setNamen`: alle bekannten Schreibweisen (TCGdex, pokemontcg.io).
 */
export function erweiterungFuerSet(setNamen: string[], versiegelt: CmVersiegelt[]): number | null {
  const formen = new Set(setNamen.filter(Boolean).map(setNamensForm));
  const ziele = new Set<string>();
  for (const f of formen) for (const art of ERKENNUNGS_ARTEN) ziele.add(`${f} ${art.toLowerCase()}`);
  const gefunden = new Set<number>();
  for (const p of versiegelt) {
    if (SPRACHZUSATZ.test(p.name)) continue;
    if (ziele.has(setNamensForm(p.name))) gefunden.add(p.idExpansion);
  }
  return gefunden.size === 1 ? [...gefunden][0] : null;
}

/** Cardmarket-Schlüssel einer Karte: „Name [Fähigkeit | Attacke]“ bzw. nur der Name. */
export function kartenSchluessel(k: Pick<NeuKarte, 'name' | 'faehigkeiten' | 'attacken'>): string {
  const teile = [...k.faehigkeiten, ...k.attacken];
  return teile.length ? `${k.name} [${teile.join(' | ')}]` : k.name;
}

export interface Mehrdeutig {
  schluessel: string;
  karten: string[];
  produkte: number[];
}

export interface KartenZuordnung {
  paare: Array<{ karte: NeuKarte; produkt: number }>;
  mehrdeutig: Mehrdeutig[];
  ohneProdukt: string[];
}

/**
 * Karten → Produkte einer Erweiterung. `karten` = ALLE Karten, die in dieser
 * Erweiterung geführt werden (z. B. Hauptset + Classic Collection), damit die
 * Eindeutigkeit über die ganze Erweiterung gilt.
 */
export function ordneKartenZu(karten: NeuKarte[], einzel: CmEinzel[], erweiterung: number): KartenZuordnung {
  const produkteJeName = new Map<string, number[]>();
  for (const p of einzel) {
    if (p.idExpansion !== erweiterung) continue;
    const l = produkteJeName.get(p.name);
    if (l) l.push(p.idProduct); else produkteJeName.set(p.name, [p.idProduct]);
  }
  const kartenJeSchluessel = new Map<string, NeuKarte[]>();
  for (const k of karten) {
    const s = kartenSchluessel(k);
    const l = kartenJeSchluessel.get(s);
    if (l) l.push(k); else kartenJeSchluessel.set(s, [k]);
  }
  const paare: KartenZuordnung['paare'] = [];
  const mehrdeutig: Mehrdeutig[] = [];
  const ohneProdukt: string[] = [];
  for (const [s, ks] of kartenJeSchluessel) {
    const ps = produkteJeName.get(s) ?? [];
    if (ps.length === 0) { ohneProdukt.push(...ks.map((k) => k.id)); continue; }
    if (ks.length === 1 && ps.length === 1) paare.push({ karte: ks[0], produkt: ps[0] });
    else mehrdeutig.push({ schluessel: s, karten: ks.map((k) => k.id), produkte: [...ps].sort((a, b) => a - b) });
  }
  return { paare, mehrdeutig, ohneProdukt };
}

/** Versiegelte Produkte einer Erweiterung mit Preis, teuerste zuerst. */
export function versiegeltMitPreis(
  versiegelt: CmVersiegelt[],
  erweiterung: number,
  preise: ReadonlyMap<number, GuidePreis>,
): Array<{ produkt: number; name: string; art: string | null; preis: GuidePreis }> {
  return versiegelt
    .filter((p) => p.idExpansion === erweiterung && preise.has(p.idProduct))
    .map((p) => ({ produkt: p.idProduct, name: p.name, art: p.categoryName ?? null, preis: preise.get(p.idProduct)! }))
    .sort((a, b) => b.preis.trend - a.preis.trend);
}

const positiv = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

/** Preisverzeichnis → Map; nur Einträge mit positivem Trend. */
export function preisKarte(zeilen: Array<Record<string, unknown> & { idProduct: number }>): Map<number, GuidePreis> {
  const m = new Map<number, GuidePreis>();
  for (const z of zeilen) {
    const trend = positiv(z.trend);
    if (trend === null) continue;
    m.set(z.idProduct, { trend, avg: positiv(z.avg), low: positiv(z.low), avg7: positiv(z.avg7), avg30: positiv(z.avg30) });
  }
  return m;
}

/** 30-Tage-Bewegung wie überall auf der Seite: Trend gegen Ø 30. Ohne Ø 30 keine. */
export function bewegung30(p: GuidePreis): number | null {
  return p.avg30 ? Math.round(((p.trend - p.avg30) / p.avg30) * 1000) / 10 : null;
}

/** pokemontcg.io-Nummer ↔ TCGdex-localId: `015` = `15`, `CC01` = `CC1`. */
export function nummernGleich(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toUpperCase().replace(/^([A-Z]*)0*(\d+)$/, '$1$2');
  return norm(a) === norm(b);
}

/** Versiegelte Produkte für Texte und Teaser: ohne Kartons (Cases) — ein Karton voller Displays ist kein Marktsignal. */
export function ohneCases<T extends { name: string }>(produkte: T[], max = 4): T[] {
  return produkte.filter((p) => !/\bcase\b/i.test(p.name)).slice(0, max);
}
