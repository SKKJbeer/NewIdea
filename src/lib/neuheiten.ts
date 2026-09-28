import { getSupabase } from './supabase';
import { schreibeJson, leseJson } from './social-speicher';
import { ladeSetListe } from './set-liste';
import { fetchSetKartenRoh } from './pokemon-api';
import { dexSetFuer, namenGleich, type DexSet } from './tcgdex';
import { dexSetsVorgehalten } from './frischpreis-karte';
import { verzeichnisStand } from './sprach-zuordnung';
import { cardsFromIndex } from './card-index';
import {
  erweiterungFuerSet, ordneKartenZu, versiegeltMitPreis, preisKarte, bewegung30, nummernGleich,
  type CmEinzel, type CmVersiegelt, type GuidePreis, type NeuKarte,
} from './neuheiten-zuordnung';

// NEUHEITEN, JAPAN ZUERST, KOMMEND — die Datengrundlage der Themen-Seite.
//
// Täglicher Cron `/api/cron/themen`. Alles, was hier steht, kommt aus einer
// Quelle mit Datum: Erscheinungsdaten (TCGdex, pokemontcg.io), Preise
// (offizielles Cardmarket-Preisverzeichnis). Nichts wird angekündigt, was
// keine Quelle ankündigt.
//
// 1. NEUE SETS (≤ `NEU_FENSTER_TAGE`): Cardmarket-Erweiterung erkennen, Karten
//    eindeutig zuordnen (neuheiten-zuordnung.ts), zugeordnete Karten mit
//    Preis und Quellstand in den Kartenindex schreiben — nur, wo der Index
//    keinen frischeren Preis hat. Damit stehen neue Sets in Suche, Set- und
//    Kartenseiten, bevor die anderen Quellen nachziehen.
// 2. JAPAN ZUERST: Japanische Sets der letzten `JAPAN_FENSTER_TAGE`, die in
//    der Sprachzuordnung noch KEIN englisches Gegenstück haben. Preise der
//    japanischen Karten selbst — keine Aussage über eine englische Ausgabe.
// 3. KOMMEND: Sets, deren Erscheinungsdatum bei pokemontcg.io in der Zukunft
//    liegt. Gibt die Quelle keine an, bleibt der Abschnitt leer.

const DEX = 'https://api.tcgdex.net/v2';
const KATALOG = 'https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json';
const VERSIEGELT = 'https://downloads.s3.cardmarket.com/productCatalog/productList/products_nonsingles_6.json';
const VERZEICHNIS = 'https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json';
const KOPF = { 'User-Agent': 'CardBeacon/1.0 (+https://new-idea-livid.vercel.app)' };

export const PFAD_NEUHEITEN = 'themen/neuheiten.json';
export const NEU_FENSTER_TAGE = 120;
export const JAPAN_FENSTER_TAGE = 240;
export const JAPAN_MAX_SETS = 3;
/** Älter als das zeigt die Themen-Seite die Datei nicht mehr als aktuell an. */
export const NEUHEITEN_MAX_TAGE = 3;

export interface ProduktPreis {
  produkt: number;
  name: string;
  art: string | null;
  preis: GuidePreis;
}

export interface NeuSet {
  setCode: string;
  dexId: string;
  name: string;
  datum: string;
  gesamt: number;
  logo: string | null;
  erweiterung: number | null;
  versiegelt: ProduktPreis[];
  /** Gleicher Name + gleiche Attacken, mehrere Drucke — ALLE Preise, keine Zuordnung. */
  mehrdeutig: Array<{ name: string; preise: number[] }>;
  zugeordnet: number;
  ohneZuordnung: number;
  indexGeschrieben: number;
}

export interface JapanKarte {
  id: string;
  name: string;
  /** Englischer Name, EXAKT aus dem Cardmarket-Produkt derselben Karte (keine Übersetzung). */
  nameEn: string | null;
  nummer: string;
  rarity: string | null;
  bild: string | null;
  preis: GuidePreis;
}

export interface JapanSet {
  id: string;
  name: string;
  /** Englischer Set-Name aus Cardmarkets „<Name> Booster“ derselben Erweiterung — sonst null. */
  nameEn: string | null;
  datum: string;
  gesamt: number;
  karten: JapanKarte[];
  versiegelt: ProduktPreis[];
}

export interface KommendSet {
  setCode: string;
  name: string;
  datum: string;
  gesamt: number;
  logo: string | null;
}

export interface NeuheitenDatei {
  erstellt: string;
  /** Stand des Cardmarket-Preisverzeichnisses (ISO). */
  stand: string;
  sets: NeuSet[];
  japan: JapanSet[];
  kommend: KommendSet[];
}

// ── Netz ────────────────────────────────────────────────────────────────────

async function holeJson<T>(url: string, zeitlimitMs = 20_000): Promise<T | null> {
  let letzter: unknown = null;
  for (let v = 0; v < 4; v++) {
    try {
      const res = await fetch(url, { headers: KOPF, signal: AbortSignal.timeout(zeitlimitMs), cache: 'no-store' });
      if (res.status === 404) return null;
      if (res.ok) return (await res.json()) as T;
      letzter = new Error(`HTTP ${res.status}`);
    } catch (err) {
      letzter = err;
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** v));
  }
  throw new Error(`${url}: ${letzter instanceof Error ? letzter.message : String(letzter)}`);
}

async function parallel<T, E>(liste: T[], n: number, f: (t: T) => Promise<E>): Promise<E[]> {
  const aus: E[] = new Array(liste.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, liste.length) }, async () => {
    while (i < liste.length) { const k = i++; aus[k] = await f(liste[k]); }
  }));
  return aus;
}

interface DexKartenDetail {
  id: string;
  localId?: string;
  name?: string;
  rarity?: string;
  image?: string;
  abilities?: Array<{ name: string }>;
  attacks?: Array<{ name: string }>;
  pricing?: { cardmarket?: { idProduct?: number } | null } | null;
}

interface DexSetDetail {
  id: string;
  name: string;
  releaseDate?: string;
  logo?: string;
  cardCount?: { total?: number; official?: number };
  cards?: Array<{ id: string }>;
}

const alsNeuKarte = (c: DexKartenDetail): NeuKarte => ({
  id: c.id,
  name: c.name ?? '',
  localId: c.localId ?? '',
  rarity: c.rarity ?? null,
  bild: c.image ?? null,
  faehigkeiten: (c.abilities ?? []).map((a) => a.name),
  attacken: (c.attacks ?? []).map((a) => a.name),
});

/** Bild in brauchbarer Größe — TCGdex liefert die Basis ohne Endung. */
export const dexBild = (basis: string | null): string | null => (basis ? `${basis}/high.webp` : null);

async function ladeSetKarten(sprache: 'en' | 'ja', setId: string): Promise<{ set: DexSetDetail; karten: DexKartenDetail[] } | null> {
  const set = await holeJson<DexSetDetail>(`${DEX}/${sprache}/sets/${encodeURIComponent(setId)}`);
  if (!set) return null;
  const ids = (set.cards ?? []).map((c) => c.id);
  const karten = (await parallel(ids, 10, (id) => holeJson<DexKartenDetail>(`${DEX}/${sprache}/cards/${encodeURIComponent(id)}`)))
    .filter((k): k is DexKartenDetail => !!k);
  // Unvollständig eingelesen → nichts zuordnen (eine fehlende Karte könnte
  // einen zweiten Druck verstecken und einen falschen eindeutig aussehen lassen).
  if (karten.length !== ids.length) throw new Error(`${sprache}/${setId}: ${karten.length} von ${ids.length} Karten gelesen`);
  return { set, karten };
}

const tageSeit = (datum: string, jetzt: number) => (jetzt - Date.parse(datum.replace(/\//g, '-').slice(0, 10))) / 86_400_000;

// ── Index schreiben ─────────────────────────────────────────────────────────

interface IndexZeile {
  id: string; name: string; name_de: string | null; set_name: string; set_code: string; number: string | null;
  rarity: string; image_url: string; price: number; trend: number | null; real_data: boolean;
  types: string[] | null; updated_at: string;
}

/**
 * Schreibt zugeordnete Karten in den Kartenindex + Tageswert — aber nur, wo
 * der Index keinen gleich frischen oder frischeren Preis hat (der tägliche
 * TCGdex-Durchlauf bleibt die erste Quelle, sobald er Preise liefert).
 */
async function schreibeIndex(zeilen: IndexZeile[], stand: string): Promise<number> {
  const sb = getSupabase();
  if (!sb || zeilen.length === 0) return 0;
  const vorhanden = new Map<string, string | undefined>();
  for (let i = 0; i < zeilen.length; i += 200) {
    const m = await cardsFromIndex(zeilen.slice(i, i + 200).map((z) => z.id));
    for (const [id, k] of m) vorhanden.set(id, k.indexStand);
  }
  const standMs = Date.parse(stand);
  const neu = zeilen.filter((z) => {
    const alt = vorhanden.get(z.id);
    const altMs = alt ? Date.parse(alt) : NaN;
    return !Number.isFinite(altMs) || altMs < standMs - 86_400_000;
  });
  if (neu.length === 0) return 0;
  const { error: e1 } = await sb.from('cards_index').upsert(neu, { onConflict: 'id' });
  if (e1) throw new Error(`Kartenindex: ${e1.message}`);
  const { error: e2 } = await sb.from('price_snapshots').upsert(
    neu.map((z) => ({ card_id: z.id, card_name: z.name, price: z.price, source: 'cardmarket', captured_on: stand.slice(0, 10) })),
    { onConflict: 'card_id,captured_on' },
  );
  if (e2) throw new Error(`Tageswerte: ${e2.message}`);
  return neu.length;
}

// ── Lauf ────────────────────────────────────────────────────────────────────

export interface NeuheitenLauf {
  stand: string;
  sets: Array<{ setCode: string; erweiterung: number | null; zugeordnet: number; indexGeschrieben: number; fehler?: string }>;
  japan: number;
  kommend: number;
}

export async function neuheitenLauf(): Promise<NeuheitenLauf> {
  const jetzt = Date.now();
  const [einzelRoh, versiegeltRoh, verzeichnis, setListe, dexSets] = await Promise.all([
    holeJson<{ products: CmEinzel[] }>(KATALOG, 60_000),
    holeJson<{ products: CmVersiegelt[] }>(VERSIEGELT, 60_000),
    holeJson<{ createdAt?: string; priceGuides: Array<Record<string, unknown> & { idProduct: number }> }>(VERZEICHNIS, 60_000),
    ladeSetListe(40),
    dexSetsVorgehalten(),
  ]);
  const stand = verzeichnisStand(verzeichnis?.createdAt);
  if (!einzelRoh?.products?.length || !versiegeltRoh?.products?.length || !verzeichnis?.priceGuides?.length || !stand) {
    throw new Error('Cardmarket-Kataloge unvollständig');
  }
  const einzel = einzelRoh.products;
  const versiegelt = versiegeltRoh.products;
  const preise = preisKarte(verzeichnis.priceGuides);

  // ── 3. Kommend ──
  const kommend: KommendSet[] = setListe.sets
    .filter((s) => tageSeit(s.releaseDate, jetzt) < 0)
    .map((s) => ({ setCode: s.id, name: s.name, datum: s.releaseDate.replace(/\//g, '-'), gesamt: s.total, logo: s.logoUrl || null }));

  // ── 1. Neue Sets ──
  const neueSets = setListe.sets.filter((s) => {
    const t = tageSeit(s.releaseDate, jetzt);
    return t >= 0 && t <= NEU_FENSTER_TAGE;
  });
  type Vorbereitet = { pt: (typeof neueSets)[number]; dexId: string; dex: DexSetDetail; karten: NeuKarte[]; erweiterung: number | null };
  const vorbereitet: Vorbereitet[] = [];
  const laufSets: NeuheitenLauf['sets'] = [];
  for (const pt of neueSets) {
    const dexId = dexSetFuer(pt.id, pt.name, dexSets as DexSet[]);
    if (!dexId) { laufSets.push({ setCode: pt.id, erweiterung: null, zugeordnet: 0, indexGeschrieben: 0, fehler: 'kein TCGdex-Set' }); continue; }
    try {
      const g = await ladeSetKarten('en', dexId);
      if (!g) continue;
      const erweiterung = erweiterungFuerSet([g.set.name, pt.name], versiegelt);
      vorbereitet.push({ pt, dexId, dex: g.set, karten: g.karten.map(alsNeuKarte), erweiterung });
    } catch (err) {
      laufSets.push({ setCode: pt.id, erweiterung: null, zugeordnet: 0, indexGeschrieben: 0, fehler: err instanceof Error ? err.message : String(err) });
    }
  }

  // Eindeutigkeit über ALLE Sets derselben Erweiterung (Hauptset + Classic Collection).
  const jeErweiterung = new Map<number, Vorbereitet[]>();
  for (const v of vorbereitet) if (v.erweiterung !== null) {
    const l = jeErweiterung.get(v.erweiterung);
    if (l) l.push(v); else jeErweiterung.set(v.erweiterung, [v]);
  }

  const sets: NeuSet[] = [];
  for (const v of vorbereitet) {
    const eintrag: NeuSet = {
      setCode: v.pt.id, dexId: v.dexId, name: v.pt.name, datum: v.pt.releaseDate.replace(/\//g, '-'),
      gesamt: v.pt.total || v.karten.length, logo: v.pt.logoUrl || null, erweiterung: v.erweiterung,
      versiegelt: [], mehrdeutig: [], zugeordnet: 0, ohneZuordnung: v.karten.length, indexGeschrieben: 0,
    };
    let fehler: string | undefined;
    if (v.erweiterung !== null) {
      const gruppe = jeErweiterung.get(v.erweiterung)!;
      const z = ordneKartenZu(gruppe.flatMap((g) => g.karten), einzel, v.erweiterung);
      const eigene = new Set(v.karten.map((k) => k.id));
      const paare = z.paare.filter((p) => eigene.has(p.karte.id) && preise.has(p.produkt));
      eintrag.zugeordnet = paare.length;
      eintrag.ohneZuordnung = v.karten.length - paare.length;
      // Versiegeltes steht nur beim GRÖSSTEN Set einer Erweiterung (Hauptset
      // statt Classic Collection), sonst stünde es doppelt.
      const haupt = [...gruppe].sort((a, b) => b.karten.length - a.karten.length)[0];
      if (haupt === v) {
        eintrag.versiegelt = versiegeltMitPreis(versiegelt, v.erweiterung, preise).slice(0, 12);
      }
      eintrag.mehrdeutig = z.mehrdeutig
        .filter((m) => m.karten.some((id) => eigene.has(id)))
        .map((m) => ({ name: m.schluessel.replace(/ \[.*$/, ''), preise: m.produkte.map((p) => preise.get(p)?.trend).filter((x): x is number => !!x).sort((a, b) => a - b) }))
        .filter((m) => m.preise.length > 0)
        .sort((a, b) => b.preise[b.preise.length - 1] - a.preise[a.preise.length - 1])
        .slice(0, 12);

      // In den Index — nur Karten, die pokemontcg.io unter Nummer UND Namen führt
      // (bzw. unter einem im Set beidseitig einmaligen Namen, siehe unten).
      try {
        const pt = await fetchSetKartenRoh(v.pt.id);
        const zeilen: IndexZeile[] = [];
        const deNamen = await parallel(paare, 10, (p) =>
          holeJson<{ name?: string }>(`${DEX}/de/cards/${encodeURIComponent(p.karte.id)}`).catch(() => null));
        // Zweiter Weg, nur wenn die Nummern nicht passen: Der Name kommt im Set
        // auf BEIDEN Seiten genau einmal vor. Nötig für Sets, die die Quellen
        // verschieden nummerieren (Classic Collection: pokemontcg.io nach der
        // Originalkarte, Glurak = 4; TCGdex fortlaufend, Glurak = 001).
        const dexKarten = v.karten;
        paare.forEach((p, i) => {
          let treffer = pt.filter((c) => c.number && nummernGleich(c.number, p.karte.localId) && namenGleich(c.name, p.karte.name));
          if (treffer.length === 0) {
            const gleichnamigDex = dexKarten.filter((k) => namenGleich(k.name, p.karte.name));
            const gleichnamigPt = pt.filter((c) => namenGleich(c.name, p.karte.name));
            if (gleichnamigDex.length === 1 && gleichnamigPt.length === 1) treffer = gleichnamigPt;
          }
          if (treffer.length !== 1) return;
          const c = treffer[0];
          const pr = preise.get(p.produkt)!;
          const b = bewegung30(pr);
          const de = deNamen[i]?.name;
          zeilen.push({
            id: c.id, name: c.name, name_de: de && de !== c.name ? de : null, set_name: c.set, set_code: c.setCode,
            number: c.number ?? null, rarity: c.rarity || p.karte.rarity || '', image_url: dexBild(p.karte.bild) ?? c.imageUrl ?? '',
            price: pr.trend, trend: b, real_data: pr.avg30 !== null, types: c.types ?? null, updated_at: stand,
          });
        });
        eintrag.indexGeschrieben = await schreibeIndex(zeilen.filter((z) => z.image_url), stand);
      } catch (err) {
        fehler = err instanceof Error ? err.message : String(err);
        console.warn(`[neuheiten] ${v.pt.id}: Index nicht geschrieben:`, fehler);
      }
    }
    sets.push(eintrag);
    laufSets.push({ setCode: v.pt.id, erweiterung: v.erweiterung, zugeordnet: eintrag.zugeordnet, indexGeschrieben: eintrag.indexGeschrieben, fehler });
  }
  sets.sort((a, b) => b.datum.localeCompare(a.datum));

  // ── 2. Japan zuerst ──
  const japan: JapanSet[] = [];
  try {
    const zuordnung = await leseJson<{ setPaare?: { JP?: Array<[string, string]> } }>('sprachen/zuordnung.json');
    const mitEnglisch = new Set((zuordnung?.setPaare?.JP ?? []).map(([, jp]) => jp));
    const jaListe = await holeJson<Array<{ id: string; name: string }>>(`${DEX}/ja/sets`);
    const details = (await parallel((jaListe ?? []).slice(-40), 8, (s) => holeJson<DexSetDetail>(`${DEX}/ja/sets/${encodeURIComponent(s.id)}`).catch(() => null)))
      .filter((d): d is DexSetDetail => !!d && !!d.releaseDate && tageSeit(d.releaseDate, jetzt) >= 0 && tageSeit(d.releaseDate, jetzt) <= JAPAN_FENSTER_TAGE)
      .filter((d) => !mitEnglisch.has(d.id) && (d.cardCount?.total ?? 0) <= 400)
      .sort((a, b) => b.releaseDate!.localeCompare(a.releaseDate!))
      .slice(0, JAPAN_MAX_SETS);
    for (const d of details) {
      const g = await ladeSetKarten('ja', d.id).catch(() => null);
      if (!g) continue;
      const mitPreis = g.karten
        .map((k) => ({ k, id: k.pricing?.cardmarket?.idProduct }))
        .filter((x): x is { k: DexKartenDetail; id: number } => typeof x.id === 'number' && preise.has(x.id));
      if (mitPreis.length === 0) continue;
      // Erweiterung aus den Produkten der Karten selbst — nur bei klarer Mehrheit.
      const zahl = new Map<number, number>();
      const expVon = new Map(einzel.map((p) => [p.idProduct, p.idExpansion]));
      for (const x of mitPreis) { const e = expVon.get(x.id); if (e) zahl.set(e, (zahl.get(e) ?? 0) + 1); }
      const [bestE, bestN] = [...zahl.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
      const klareErweiterung = bestE !== null && bestN >= 0.8 * mitPreis.length ? bestE : null;
      const produktName = new Map(einzel.map((p) => [p.idProduct, p.name]));
      const boosterName = klareErweiterung === null ? null
        : versiegelt.find((p) => p.idExpansion === klareErweiterung && / Booster$/.test(p.name) && !/Box|Case|Bundle/.test(p.name))?.name ?? null;
      japan.push({
        id: d.id, name: d.name, nameEn: boosterName ? boosterName.replace(/ Booster$/, '') : null,
        datum: d.releaseDate!, gesamt: d.cardCount?.total ?? g.karten.length,
        karten: mitPreis
          .map((x) => ({
            id: x.k.id, name: x.k.name ?? '', nameEn: produktName.get(x.id)?.replace(/ \[.*$/, '') ?? null,
            nummer: x.k.localId ?? '', rarity: x.k.rarity ?? null, bild: dexBild(x.k.image ?? null), preis: preise.get(x.id)!,
          }))
          .sort((a, b) => b.preis.trend - a.preis.trend)
          .slice(0, 12),
        versiegelt: klareErweiterung !== null ? versiegeltMitPreis(versiegelt, klareErweiterung, preise).slice(0, 6) : [],
      });
    }
  } catch (err) {
    console.warn('[neuheiten] Japan-Abschnitt:', err instanceof Error ? err.message : err);
  }

  const datei: NeuheitenDatei = { erstellt: new Date().toISOString(), stand, sets, japan, kommend };
  await schreibeJson(PFAD_NEUHEITEN, datei);
  return { stand, sets: laufSets, japan: japan.length, kommend: kommend.length };
}

// ── Lesen ───────────────────────────────────────────────────────────────────

export function neuheitenAktuell(d: NeuheitenDatei | null, jetzt = Date.now()): boolean {
  if (!d) return false;
  const t = Date.parse(d.stand);
  return Number.isFinite(t) && jetzt - t <= NEUHEITEN_MAX_TAGE * 86_400_000;
}

export async function leseNeuheiten(): Promise<NeuheitenDatei | null> {
  return leseJson<NeuheitenDatei>(PFAD_NEUHEITEN).catch(() => null);
}

/**
 * Themen als Prompt-Kontext für Artikel — OHNE Preiszahlen (die Artikel-
 * Schranke verbietet Preise im Fließtext; Preise stehen in den Kartenbildern).
 * Nur Fakten mit Quelle: Set, Erscheinungsdatum, Produktarten, Kartennamen.
 */
export function themenKontext(d: NeuheitenDatei | null, jetzt = Date.now()): string {
  if (!d || !neuheitenAktuell(d, jetzt)) return '';
  const tage = (iso: string) => Math.max(0, Math.floor((jetzt - Date.parse(iso.slice(0, 10))) / 86_400_000));
  const zeilen: string[] = [];
  for (const s of d.sets.slice(0, 4)) {
    const produkte = s.versiegelt.slice(0, 3).map((p) => p.name).join(', ');
    zeilen.push(`- Neues Set „${s.name}“ (Set-Code ${s.setCode}), erschienen am ${s.datum} (vor ${tage(s.datum)} Tagen), ${s.gesamt} Karten${produkte ? `; teuerste versiegelte Produkte bei Cardmarket: ${produkte}` : ''}.`);
  }
  for (const j of d.japan.slice(0, 2)) {
    const karten = j.karten.slice(0, 3).map((k) => k.nameEn ?? k.name).join(', ');
    zeilen.push(`- In Japan erschienen: „${j.nameEn ?? j.name}“ (${j.id}) am ${j.datum}; eine englische Ausgabe führen die Quellen noch nicht. Teuerste japanische Karten: ${karten}.`);
  }
  if (zeilen.length === 0) return '';
  return `\n\nAKTUELLE THEMEN (belegt aus Cardmarket-Katalog und Set-Daten — nutze sie, wenn sie zum Artikeltyp passen; nenne KEINE Preise im Text, erfinde nichts dazu):\n${zeilen.join('\n')}`;
}
