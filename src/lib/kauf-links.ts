// KAUF-LINKS — eine Stelle für Cardmarket und Amazon (Website UND App).
//
// Nutzer-Auftrag (07.10.2026): Der Cardmarket-Link einer Karte soll GENAU auf
// diese Karte führen, nicht auf eine Suche mit allen Raichus.
//
// Quelle der genauen Adresse: pokemontcg.io führt je Karte eine Weiterleitung
// `prices.pokemontcg.io/cardmarket/<id>` auf die Cardmarket-Produktseite.
// Die Zuordnung stammt von dort, nicht von uns — deshalb wird sie GEPRÜFT,
// bevor sie als genauer Link gilt (siehe `pruefeCardmarketZiel`). Belegter
// Fehlfall ohne Prüfung: swsh45sv-SV107 (Glurak-VMAX, Shiny Vault) führt auf
// „Shining-Fates/Charizard-VMAX" — ohne Nummer im Pfad nicht von der 020 zu
// unterscheiden. Solche Ziele bekommen KEINEN genauen Link, sondern die Suche.
//
// Cardmarket selbst ist aus Serverumgebungen nicht abrufbar (403), die Ziele
// lassen sich also nicht direkt nachladen — nur gegen Name und Nummer prüfen.

import { unstable_cache } from 'next/cache';
import { dexKandidaten, dexSetFuer, namenGleich } from './tcgdex';
import { dexSetsVorgehalten } from './frischpreis-karte';

export { cardmarketSuche, amazonSuche } from './kauf-links-basis';
import { cardmarketSuche, amazonSuche } from './kauf-links-basis';

/** Name in der Schreibweise der Cardmarket-Adressen: „Ethan's Pinsir" → „ethans-pinsir". */
export function adressName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’.]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export type ZielPruefung =
  | { url: string; art: 'nummer' }
  /** Cardmarket-Version „V<k>" ohne Nummer — braucht die Gegenprobe `versionPasst`. */
  | { url: string; art: 'version'; version: number };

/**
 * Prüft ein Weiterleitungsziel gegen Name und Nummer der Karte.
 * 1. Einzelkarten-Produktseite bei cardmarket.com (https),
 * 2. Produktteil = Kartenname, danach höchstens „-V<k>" und ein Nummernkürzel,
 * 3. Nummernkürzel (EVS215, MEW199, BS4): Zahl = Kartennummer; Nummern mit
 *    Buchstaben (TG05, SV107) müssen vollständig am Ende stehen.
 * Ohne Kürzel, aber mit „-V<k>": nur vorläufig (art 'version'). Ganz ohne
 * beides: null — so ein Ziel lässt sich nicht von Geschwisterkarten unterscheiden.
 */
export function pruefeCardmarketZiel(ziel: string | null | undefined, karte: { name: string; number?: string | null }): ZielPruefung | null {
  if (!ziel || !karte.number) return null;
  let url: URL;
  try { url = new URL(ziel); } catch { return null; }
  if (url.protocol !== 'https:' || !/^(www\.)?cardmarket\.com$/.test(url.hostname)) return null;
  const teile = url.pathname.split('/').filter(Boolean);
  // /en/Pokemon/Products/Singles/<Erweiterung>/<Produkt>
  if (teile.length !== 6 || teile[1] !== 'Pokemon' || teile[2] !== 'Products' || teile[3] !== 'Singles') return null;
  if (!teile.every((t) => /^[A-Za-z0-9._~%-]+$/.test(t))) return null;
  const sauber = `https://www.cardmarket.com${url.pathname}`;

  const produkt = teile[5].toLowerCase();
  // Mega-Karten schreibt Cardmarket zusammen: „M Charizard-EX" → „MCharizard-EX".
  const name = [adressName(karte.name), adressName(karte.name.replace(/^M /, 'M'))].find((n) => n && produkt.startsWith(n));
  if (!name) return null;
  const rest = /^(?:-v(\d+))?(?:-([a-z]+)(\d+))?$/.exec(produkt.slice(name.length));
  if (!rest) return null;
  const [, version, kBuchst, kZahl] = rest;

  if (kZahl) {
    const nummer = karte.number.trim();
    if (/^\d+$/.test(nummer)) {
      if (Number(kZahl) !== Number(nummer)) return null;
    } else {
      const n = /^([A-Za-z]+)(\d+)$/.exec(nummer);
      if (!n || !kBuchst.endsWith(n[1].toLowerCase()) || Number(kZahl) !== Number(n[2])) return null;
    }
    return { url: sauber, art: 'nummer' };
  }
  if (version) return { url: sauber, art: 'version', version: Number(version) };
  return null;
}

/**
 * Gegenprobe für „V<k>": Cardmarket nummeriert gleichnamige Produkte einer
 * Erweiterung in der Reihenfolge ihrer Produktnummer (belegt an Umbreon VMAX,
 * Evolving Skies: 574143 / 574272 / 574273 = V1 / V2 / V3, TCGdex ordnet 215
 * dem Produkt 574273 zu). Gilt nur, wenn die Produktnummer der Karte (TCGdex)
 * genau an Stelle k der gleichnamigen Karten desselben Sets steht.
 */
export function versionPasst(version: number, eigenes: number | null, gleichnamige: ReadonlyArray<number | null>): boolean {
  if (!eigenes || version < 1) return false;
  if (gleichnamige.some((p) => !p)) return false; // Lücke → Reihenfolge nicht belegbar
  const sortiert = [...new Set(gleichnamige as number[])].sort((a, b) => a - b);
  if (sortiert.length !== gleichnamige.length) return false; // doppelte Produkte → mehrdeutig
  return sortiert[version - 1] === eigenes;
}

async function weiterleitungsZiel(id: string): Promise<string | null> {
  const r = await fetch(`https://prices.pokemontcg.io/cardmarket/${encodeURIComponent(id)}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(2_500),
    cache: 'no-store',
  });
  if (r.status >= 300 && r.status < 400) return r.headers.get('location');
  if (r.status === 404 || r.status === 502) return null; // keine Zuordnung bei der Quelle
  throw new Error(`HTTP ${r.status}`); // vorübergehend → nicht zwischenspeichern
}

const zielGespeichert = unstable_cache(weiterleitungsZiel, ['cardmarket-ziel-v1'], { revalidate: 14 * 86_400 });

const DEX = 'https://api.tcgdex.net/v2/en';
const DEX_KOPF = { 'User-Agent': 'CardBeacon/1.0 (+https://cardbeacon.de)' };

async function dexJson<T>(pfad: string): Promise<T | null> {
  const r = await fetch(`${DEX}${pfad}`, { headers: DEX_KOPF, signal: AbortSignal.timeout(4_000), cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`TCGdex ${pfad}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

/**
 * Produktnummern der Karte und aller gleichnamigen Karten ihres TCGdex-Sets.
 * null = nicht belegbar (Set/Karte unbekannt, Name abweichend).
 */
export async function produkteImSet(karte: { name: string; number: string; setCode: string; set: string }): Promise<{ eigenes: number | null; gleichnamige: Array<number | null> } | null> {
  const dexSet = dexSetFuer(karte.setCode, karte.set, await dexSetsVorgehalten());
  if (!dexSet) return null;
  const set = await dexJson<{ cards?: Array<{ id: string; name: string }> }>(`/sets/${encodeURIComponent(dexSet)}`);
  const gleich = (set?.cards ?? []).filter((c) => namenGleich(c.name, karte.name));
  if (gleich.length === 0 || gleich.length > 8) return null;
  const kandidaten = new Set(dexKandidaten(dexSet, karte.number));
  if (!gleich.some((c) => kandidaten.has(c.id))) return null;
  const details = await Promise.all(gleich.map((c) =>
    dexJson<{ id: string; pricing?: { cardmarket?: { idProduct?: number } | null } | null }>(`/cards/${encodeURIComponent(c.id)}`)));
  const produkt = (d: (typeof details)[number]) => {
    const p = d?.pricing?.cardmarket?.idProduct;
    return typeof p === 'number' && p > 0 ? p : null;
  };
  const eigene = details.find((d) => d && kandidaten.has(d.id));
  return { eigenes: eigene ? produkt(eigene) : null, gleichnamige: details.map(produkt) };
}

const produkteGespeichert = unstable_cache(produkteImSet, ['cardmarket-produkte-v1'], { revalidate: 14 * 86_400 });

export interface CardmarketLink {
  url: string;
  /** true = geprüfte Produktseite der Karte, false = Suche nach dem Namen. */
  genau: boolean;
}

/** Genauer Cardmarket-Link einer Karte, sonst die Suche. Wirft nie. */
export async function cardmarketLink(karte: { id: string; name: string; number?: string | null; setCode: string; set: string }): Promise<CardmarketLink> {
  try {
    const ziel = pruefeCardmarketZiel(await zielGespeichert(karte.id), karte);
    if (ziel?.art === 'nummer') return { url: ziel.url, genau: true };
    if (ziel?.art === 'version' && karte.number) {
      const p = await produkteGespeichert({ name: karte.name, number: karte.number, setCode: karte.setCode, set: karte.set });
      if (p && versionPasst(ziel.version, p.eigenes, p.gleichnamige)) return { url: ziel.url, genau: true };
    }
  } catch (err) {
    console.warn('[kauf-links] Cardmarket-Ziel nicht geladen:', karte.id, err instanceof Error ? err.message : err);
  }
  return { url: cardmarketSuche(karte.name), genau: false };
}

export interface KaufLinks {
  cardmarket: CardmarketLink;
  /** Die Einzelkarte bei Amazon. */
  amazonKarte: string;
  /** Booster des Sets bei Amazon. */
  amazonBooster: string;
}

/**
 * Alle Kauf-Links einer Karte. `maxMs` begrenzt das Warten auf den genauen
 * Cardmarket-Link (erster Aufruf ohne Zwischenspeicher); danach gilt die Suche,
 * der Abruf läuft im Hintergrund weiter und füllt den Speicher für später.
 */
export async function kaufLinks(
  karte: { id: string; name: string; number?: string | null; setCode: string; set: string },
  maxMs = 2_500,
): Promise<KaufLinks> {
  const rueckfall: CardmarketLink = { url: cardmarketSuche(karte.name), genau: false };
  const cardmarket = await Promise.race([
    cardmarketLink(karte),
    new Promise<CardmarketLink>((r) => setTimeout(() => r(rueckfall), maxMs)),
  ]);
  return {
    cardmarket,
    amazonKarte: amazonSuche(`Pokemon ${karte.name} Karte`),
    amazonBooster: amazonSuche(`Pokemon ${karte.set} Booster`),
  };
}
