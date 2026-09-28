import type { PokemonCard } from '@/types';
import { schreibeJson, leseJson, loescheDateien } from './social-speicher';
import { dexSetFuer, dexKandidaten, namenGleich, type DexSet } from './tcgdex';
import { dexSetsVorgehalten } from './frischpreis-karte';
import {
  bauZuordnung, preiseAusVerzeichnis, verzeichnisStand, FREMDSPRACHEN, DEX_SPRACHE,
  type Fremdsprache, type Katalog, type KatalogKarte, type KatalogSet, type Gegenstueck,
  type ZuordnungsEintrag, type Zuordnungsgrund, type SprachPreis,
} from './sprach-zuordnung';

// PREISE JAPANISCHER UND KOREANISCHER AUSGABEN — Ablauf und Abfrage.
//
// Die Regeln der Zuordnung stehen in `sprach-zuordnung.ts` (rein, getestet).
// Diese Datei holt die Daten, legt sie im Speicher-Eimer ab und beantwortet
// „was kostet die japanische Ausgabe dieser Karte?".
//
// ABLAUF (Cron `/api/cron/sprachen`, taeglich):
// 1. Katalog einlesen — alle Karten von TCGdex (en, ja, ko), etappenweise mit
//    Zeitbudget, Zwischenstand in `sprachen/aufbau.json`. Einmal je Woche neu,
//    damit neue Sets hinzukommen.
// 2. Zuordnung bauen → `sprachen/zuordnung.json`. Faellt sie deutlich kleiner
//    aus als erwartet (Quelle gestoert), bleibt die alte stehen.
// 3. Preise: das offizielle Cardmarket-Preisverzeichnis (taeglich, oeffentlich)
//    → nur die zugeordneten Produkte → `sprachen/preise.json` mit dem Stand
//    des Verzeichnisses.

const DEX = 'https://api.tcgdex.net/v2';
const KATALOG_URL = 'https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json';
const VERZEICHNIS_URL = 'https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json';
const KOPF = { 'User-Agent': 'CardBeacon/1.0 (+https://new-idea-livid.vercel.app)' };

export const PFAD_AUFBAU = 'sprachen/aufbau.json';
export const PFAD_ZUORDNUNG = 'sprachen/zuordnung.json';
export const PFAD_PREISE = 'sprachen/preise.json';

/** So alt darf die Zuordnung werden, bevor der Katalog neu eingelesen wird. */
export const ZUORDNUNG_ERNEUERN_TAGE = 7;
/** Aelter als das wird ein Sprachpreis nicht angezeigt (wie beim englischen Preis). */
export const SPRACHPREIS_MAX_TAGE = 3;
/**
 * Mindestzahl eindeutiger JP-Paare. Gemessen am 28.09.2026: 5.679. Faellt ein
 * Neuaufbau deutlich darunter, war die Quelle gestoert — dann bleibt die alte
 * Zuordnung stehen, statt still die Haelfte zu verlieren.
 */
export const MIN_JP_PAARE = 3_000;
/** Anteil der zugeordneten Produkte, die im Verzeichnis einen Preis haben muessen (gemessen: 99 %). */
export const MIN_PREIS_ANTEIL = 0.8;

type DexSprache = 'en' | 'ja' | 'ko';
const AUFBAU_SPRACHEN: readonly DexSprache[] = ['ja', 'ko', 'en'];

interface AufbauSprache {
  setListe: string[] | null;
  sets: Record<string, KatalogSet>;
  karten: KatalogKarte[];
}

export interface AufbauStand {
  begonnen: string;
  sprachen: Record<DexSprache, AufbauSprache>;
}

export interface ZuordnungsDatei {
  erstellt: string;
  statistik: Record<Fremdsprache, Record<Zuordnungsgrund, number>>;
  setPaare: Record<Fremdsprache, Array<[string, string]>>;
  /** EN-TCGdex-ID → Eintrag. */
  karten: Record<string, ZuordnungsEintrag>;
}

export interface PreisDatei {
  /** Stand des Cardmarket-Preisverzeichnisses (ISO). */
  stand: string;
  abgerufen: string;
  preise: Record<string, SprachPreis>;
}

// ── Netz ────────────────────────────────────────────────────────────────────

async function holeJson<T>(url: string, zeitlimitMs = 15_000): Promise<T | null> {
  let letzter: unknown = null;
  // TCGdex antwortet bei Lastspitzen kurz mit 503 (gemessen 28.09.2026) —
  // fuenf Versuche mit wachsender Pause statt drei kurzer.
  for (let versuch = 0; versuch < 5; versuch++) {
    try {
      const res = await fetch(url, { headers: KOPF, signal: AbortSignal.timeout(zeitlimitMs), cache: 'no-store' });
      if (res.status === 404) return null;
      if (res.ok) return (await res.json()) as T;
      letzter = new Error(`HTTP ${res.status}`);
    } catch (err) {
      letzter = err;
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** versuch));
  }
  throw new Error(`${url}: ${letzter instanceof Error ? letzter.message : String(letzter)}`);
}

interface DexKartenDetail {
  id: string;
  name?: string;
  localId?: string;
  illustrator?: string;
  rarity?: string;
  pricing?: { cardmarket?: { idProduct?: number } | null } | null;
}

/** Ein Set vollstaendig einlesen. Wirft, wenn eine Karte nicht zu holen war — ein halbes Set zaehlt nicht. */
async function leseSet(sprache: DexSprache, setId: string): Promise<{ set: KatalogSet; karten: KatalogKarte[] }> {
  const d = await holeJson<{ id: string; name?: string; releaseDate?: string; cards?: Array<{ id: string }> }>(
    `${DEX}/${sprache}/sets/${encodeURIComponent(setId)}`,
  );
  const ids = (d?.cards ?? []).map((c) => c.id);
  const karten: KatalogKarte[] = [];
  let fehlend = 0;
  let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < ids.length) {
      const id = ids[i++];
      const c = await holeJson<DexKartenDetail>(`${DEX}/${sprache}/cards/${encodeURIComponent(id)}`);
      if (!c) { fehlend++; continue; }
      const produkt = c.pricing?.cardmarket?.idProduct;
      karten.push({
        id: c.id,
        name: c.name ?? '',
        set: setId,
        illustrator: c.illustrator?.trim() || null,
        rarity: c.rarity ?? null,
        produkt: typeof produkt === 'number' && produkt > 0 ? produkt : null,
      });
    }
  }));
  return { set: { id: setId, name: d?.name ?? setId, datum: d?.releaseDate ?? null, fehlend }, karten };
}

// ── Aufbau (etappenweise) ───────────────────────────────────────────────────

const leererAufbau = (): AufbauStand => ({
  begonnen: new Date().toISOString(),
  sprachen: {
    en: { setListe: null, sets: {}, karten: [] },
    ja: { setListe: null, sets: {}, karten: [] },
    ko: { setListe: null, sets: {}, karten: [] },
  },
});

export const aufbauFertig = (a: AufbauStand): boolean =>
  AUFBAU_SPRACHEN.every((s) => a.sprachen[s].setListe !== null && a.sprachen[s].setListe!.every((id) => a.sprachen[s].sets[id]));

/** Liest Sets ein, bis das Zeitbudget verbraucht ist. Speichert den Zwischenstand. */
export async function katalogEtappe(aufbau: AufbauStand, budgetMs: number): Promise<AufbauStand> {
  const ende = Date.now() + budgetMs;
  let fehlschlaege = 0;
  try {
    for (const sprache of AUFBAU_SPRACHEN) {
      const s = aufbau.sprachen[sprache];
      if (!s.setListe) {
        const liste = await holeJson<Array<{ id: string }>>(`${DEX}/${sprache}/sets`);
        if (!liste || liste.length === 0) throw new Error(`TCGdex ${sprache}: keine Sets`);
        s.setListe = liste.map((x) => x.id);
      }
      for (const setId of s.setListe) {
        if (s.sets[setId]) continue;
        if (Date.now() > ende) return aufbau;
        // Ein gestoertes Set bleibt ungelesen und kommt beim naechsten Lauf
        // dran — es haelt die uebrigen nicht auf. Erst wenn ALLE Sets
        // vollstaendig sind, entsteht eine Zuordnung (`aufbauFertig`).
        try {
          const { set, karten } = await leseSet(sprache, setId);
          s.sets[setId] = set;
          s.karten.push(...karten);
          fehlschlaege = 0;
        } catch (err) {
          console.warn(`[sprachpreise] Set ${sprache}/${setId} nicht gelesen:`, err instanceof Error ? err.message : err);
          if (++fehlschlaege >= 5) throw new Error(`TCGdex ${sprache}: fuenf Sets in Folge gescheitert`);
        }
      }
    }
    return aufbau;
  } finally {
    await schreibeJson(PFAD_AUFBAU, aufbau);
  }
}

export async function ladeKatalogMetakarten(): Promise<Map<number, number>> {
  const d = await holeJson<{ products?: Array<{ idProduct: number; idMetacard: number }> }>(KATALOG_URL, 60_000);
  const m = new Map<number, number>();
  for (const p of d?.products ?? []) if (p.idProduct && p.idMetacard) m.set(p.idProduct, p.idMetacard);
  if (m.size < 10_000) throw new Error(`Cardmarket-Katalog unvollstaendig (${m.size} Produkte)`);
  return m;
}

const alsKatalog = (s: AufbauSprache): Katalog => ({ sets: s.sets, karten: s.karten });

/** Aus einem vollstaendigen Aufbau die Zuordnungsdatei. Rein bis auf den Zeitstempel. */
export function zuordnungsDatei(aufbau: AufbauStand, metakarte: ReadonlyMap<number, number>): ZuordnungsDatei {
  const en = alsKatalog(aufbau.sprachen.en);
  const karten: Record<string, ZuordnungsEintrag> = {};
  const statistik = {} as ZuordnungsDatei['statistik'];
  const setPaare = {} as ZuordnungsDatei['setPaare'];
  for (const sprache of FREMDSPRACHEN) {
    const zielKat = alsKatalog(aufbau.sprachen[DEX_SPRACHE[sprache] as DexSprache]);
    const e = bauZuordnung(en, zielKat, metakarte);
    statistik[sprache] = e.statistik;
    setPaare[sprache] = e.setPaare;
    for (const [enId, p] of e.paare) {
      const eintrag = (karten[enId] ??= { enName: p.en.name, enProdukt: p.en.produkt! });
      eintrag[sprache] = {
        id: p.ziel.id,
        name: p.ziel.name,
        set: p.ziel.set,
        setName: zielKat.sets[p.ziel.set]?.name ?? p.ziel.set,
        produkt: p.ziel.produkt!,
      } satisfies Gegenstueck;
    }
  }
  return { erstellt: new Date().toISOString(), statistik, setPaare, karten };
}

// ── Preise ──────────────────────────────────────────────────────────────────

export function gesuchteProdukte(z: ZuordnungsDatei): Set<number> {
  const s = new Set<number>();
  for (const e of Object.values(z.karten)) for (const sp of FREMDSPRACHEN) if (e[sp]) s.add(e[sp]!.produkt);
  return s;
}

export async function ladePreisverzeichnis(): Promise<{ stand: string; zeilen: Parameters<typeof preiseAusVerzeichnis>[0] }> {
  const d = await holeJson<{ createdAt?: string; priceGuides?: Parameters<typeof preiseAusVerzeichnis>[0] }>(VERZEICHNIS_URL, 60_000);
  const stand = verzeichnisStand(d?.createdAt);
  if (!stand || !d?.priceGuides?.length) throw new Error('Cardmarket-Preisverzeichnis ohne Stand oder leer');
  return { stand, zeilen: d.priceGuides };
}

// ── Qualitaetsschranke ──────────────────────────────────────────────────────

export interface SprachGate {
  ok: boolean;
  befund: string;
}

export function sprachpreisGate(z: ZuordnungsDatei | null, p: PreisDatei | null, jetzt = Date.now()): SprachGate {
  if (!z) return { ok: false, befund: 'Keine Zuordnung vorhanden' };
  const paare = z.statistik.JP?.eindeutig ?? 0;
  if (paare < MIN_JP_PAARE) return { ok: false, befund: `Nur ${paare} JP-Paare (Mindestens ${MIN_JP_PAARE})` };
  if (!p) return { ok: false, befund: 'Keine Sprachpreise vorhanden' };
  if (!standJung(p.stand, jetzt)) return { ok: false, befund: `Preisverzeichnis-Stand ${p.stand} ist aelter als ${SPRACHPREIS_MAX_TAGE} Tage` };
  const gesucht = gesuchteProdukte(z).size;
  const mitPreis = Object.keys(p.preise).length;
  if (gesucht > 0 && mitPreis < MIN_PREIS_ANTEIL * gesucht) {
    return { ok: false, befund: `Nur ${mitPreis} von ${gesucht} Produkten mit Preis` };
  }
  return { ok: true, befund: `${paare} JP-Paare, ${mitPreis} Preise, Stand ${p.stand.slice(0, 10)}` };
}

export function standJung(stand: string, jetzt = Date.now(), maxTage = SPRACHPREIS_MAX_TAGE): boolean {
  const t = Date.parse(stand);
  return Number.isFinite(t) && jetzt - t <= maxTage * 86_400_000 && t <= jetzt + 86_400_000;
}

// ── Cron-Schritt ────────────────────────────────────────────────────────────

export interface SprachLauf {
  katalog: 'aktuell' | 'eingelesen' | 'teilweise' | 'neu-gebaut' | 'verworfen';
  katalogBefund?: string;
  preise: 'aktuell' | 'aufgefrischt';
  gate: SprachGate;
}

const alterTage = (iso: string | undefined, jetzt: number) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? (jetzt - t) / 86_400_000 : Infinity;
};

export async function sprachLauf(budgetMs: number): Promise<SprachLauf> {
  const start = Date.now();
  let zuordnung = await leseJson<ZuordnungsDatei>(PFAD_ZUORDNUNG);
  let aufbau = await leseJson<AufbauStand>(PFAD_AUFBAU);
  let katalog: SprachLauf['katalog'] = 'aktuell';
  let katalogBefund: string | undefined;

  // 1 + 2: Katalog, wenn keiner da, einer im Aufbau oder der alte zu alt ist.
  if (aufbau || !zuordnung || alterTage(zuordnung.erstellt, start) > ZUORDNUNG_ERNEUERN_TAGE) {
    aufbau = await katalogEtappe(aufbau ?? leererAufbau(), budgetMs - 60_000);
    katalog = 'teilweise';
    if (aufbauFertig(aufbau)) {
      const neu = zuordnungsDatei(aufbau, await ladeKatalogMetakarten());
      const paare = neu.statistik.JP.eindeutig;
      if (paare >= MIN_JP_PAARE) {
        await schreibeJson(PFAD_ZUORDNUNG, neu);
        zuordnung = neu;
        katalog = 'neu-gebaut';
      } else {
        katalog = 'verworfen';
        katalogBefund = `Neuaufbau mit nur ${paare} JP-Paaren verworfen — alte Zuordnung bleibt`;
        console.error('[sprachpreise]', katalogBefund, JSON.stringify(neu.statistik));
      }
      await loescheDateien([PFAD_AUFBAU]);
    }
  }

  // 3: Preise — nur, wenn das Verzeichnis einen neueren Stand hat.
  let preise = await leseJson<PreisDatei>(PFAD_PREISE);
  let preisSchritt: SprachLauf['preise'] = 'aktuell';
  if (zuordnung) {
    const v = await ladePreisverzeichnis();
    if (!preise || v.stand > preise.stand) {
      preise = { stand: v.stand, abgerufen: new Date().toISOString(), preise: preiseAusVerzeichnis(v.zeilen, gesuchteProdukte(zuordnung)) };
      await schreibeJson(PFAD_PREISE, preise);
      preisSchritt = 'aufgefrischt';
    }
  }

  return { katalog, katalogBefund, preise: preisSchritt, gate: sprachpreisGate(zuordnung, preise) };
}

export async function leseSprachStand(): Promise<{ zuordnung: ZuordnungsDatei | null; preise: PreisDatei | null }> {
  const [zuordnung, preise] = await Promise.all([leseJson<ZuordnungsDatei>(PFAD_ZUORDNUNG), leseJson<PreisDatei>(PFAD_PREISE)]);
  return { zuordnung, preise };
}

// ── Abfrage je Karte ────────────────────────────────────────────────────────

export type SprachGrund = 'keine-zuordnung' | 'kein-preis' | 'veraltet' | 'nicht-geladen';

export type SprachAngabe =
  | { sprache: Fremdsprache; ok: true; preis: SprachPreis; stand: string; gegenstueck: Gegenstueck }
  | { sprache: Fremdsprache; ok: false; grund: SprachGrund };

const VORHALTEN_MS = 30 * 60_000;
let vorgehalten: { bis: number; daten: Promise<{ zuordnung: ZuordnungsDatei | null; preise: PreisDatei | null }> } | null = null;

function sprachDaten(jetzt = Date.now()) {
  if (vorgehalten && vorgehalten.bis > jetzt) return vorgehalten.daten;
  const daten = leseSprachStand();
  vorgehalten = { bis: jetzt + VORHALTEN_MS, daten };
  daten.then((d) => { if (!d.zuordnung || !d.preise) vorgehalten = null; }, () => { vorgehalten = null; });
  return daten;
}

/** Nur fuer Tests: vorgehaltene Dateien verwerfen. */
export function vergissSprachDaten(): void {
  vorgehalten = null;
}

/**
 * Eintrag der Zuordnung fuer eine Karte — ueber dieselbe Set-/Nummern-Logik
 * wie der englische Frischpreis, mit Namensprobe. Stimmt das bekannte
 * EN-Produkt der Karte nicht mit dem der Zuordnung ueberein, gibt es keinen
 * Eintrag.
 */
export function eintragFuer(
  card: Pick<PokemonCard, 'name' | 'setCode' | 'set' | 'number' | 'cmPrices'>,
  z: ZuordnungsDatei,
  dexSets: DexSet[],
): ZuordnungsEintrag | null {
  if (!card.number) return null;
  const dexSet = dexSetFuer(card.setCode, card.set, dexSets);
  if (!dexSet) return null;
  for (const id of dexKandidaten(dexSet, card.number)) {
    const e = z.karten[id];
    if (!e) continue;
    if (!namenGleich(e.enName, card.name)) return null;
    const produkt = card.cmPrices?.produkt;
    if (produkt && produkt !== e.enProdukt) return null;
    return e;
  }
  return null;
}

/** Rein: Angaben je Fremdsprache aus Eintrag und Preisen. */
export function sprachAngaben(e: ZuordnungsEintrag | null, p: PreisDatei | null, jetzt = Date.now()): SprachAngabe[] {
  return FREMDSPRACHEN.map((sprache): SprachAngabe => {
    const g = e?.[sprache];
    if (!g) return { sprache, ok: false, grund: 'keine-zuordnung' };
    if (!p) return { sprache, ok: false, grund: 'nicht-geladen' };
    if (!standJung(p.stand, jetzt)) return { sprache, ok: false, grund: 'veraltet' };
    const preis = p.preise[String(g.produkt)];
    if (!preis) return { sprache, ok: false, grund: 'kein-preis' };
    return { sprache, ok: true, preis, stand: p.stand, gegenstueck: g };
  });
}

/**
 * Preise der japanischen und koreanischen Ausgabe einer Karte. Wirft nie —
 * fehlt etwas, sagt die Angabe, warum.
 */
export async function sprachpreiseFuerKarte(
  card: Pick<PokemonCard, 'id' | 'name' | 'setCode' | 'set' | 'number' | 'cmPrices'>,
  zeitlimitMs = 3_000,
): Promise<SprachAngabe[]> {
  const nichts = (grund: SprachGrund) => FREMDSPRACHEN.map((sprache): SprachAngabe => ({ sprache, ok: false, grund }));
  try {
    const zeit = new Promise<null>((r) => setTimeout(() => r(null), zeitlimitMs));
    const geladen = await Promise.race([Promise.all([sprachDaten(), dexSetsVorgehalten()]), zeit]);
    if (!geladen) return nichts('nicht-geladen');
    const [{ zuordnung, preise }, dexSets] = geladen;
    if (!zuordnung) return nichts('nicht-geladen');
    return sprachAngaben(eintragFuer(card, zuordnung, dexSets), preise);
  } catch (err) {
    console.warn(`[sprachpreise] ${card.id}:`, err instanceof Error ? err.message : err);
    return nichts('nicht-geladen');
  }
}
