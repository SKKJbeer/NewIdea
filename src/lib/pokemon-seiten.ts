// POKÉMON-SEITEN — eine Einstiegsseite je Pokémon („Glurak-Karten: alle Versionen
// und Preise"). Nutzer-Auftrag 08.10.2026 (Reichweite): Suchanfragen wie
// „glurak karte wert" landen bisher auf einzelnen Kartenseiten, nicht auf einer
// Übersicht aller Versionen.
//
// Alles hier ist rein und getestet. Welche Karte zu welchem Pokémon gehört,
// entscheidet der GANZE Wortlaut des Namens (Wortgrenzen) — „Mew" darf nicht
// „Mewtwo" einsammeln, „Pikachu" nicht „Raichu".

import { DE_TO_EN } from './pokemon-names-de';
import { WEITERE_POKEMON } from './pokemon-namen-weitere';

export interface PokemonEintrag {
  /** Adresse: /pokemon/<slug> (deutscher Name). */
  slug: string;
  /** Deutscher Anzeigename, z. B. „Glurak". */
  de: string;
  /** Englischer Kartenname, z. B. „Charizard". */
  en: string;
}

/** Klein, ohne Akzente, alles außer Buchstaben/Ziffern als ein Leerzeichen. */
export function namensForm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    // Nidoran♀ / Nidoran♂ sind zwei Pokémon — das Zeichen muss erhalten bleiben.
    .replace(/♀/g, ' f ').replace(/♂/g, ' m ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** „Kapu-Riki" → „kapu-riki", „Typ:Null" → „typ-null", „Ölfa" → „oelfa". */
export function pokemonSlug(de: string): string {
  return de
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/♀/g, '-w').replace(/♂/g, '-m')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** „lin-fu" → „Lin-Fu", „glurak" → „Glurak". */
export function anzeigeName(deKlein: string): string {
  return deKlein.replace(/(^|[\s\-:])(\p{L})/gu, (_, vor: string, b: string) => vor + b.toUpperCase());
}

export const POKEMON: readonly PokemonEintrag[] = Object.entries({ ...WEITERE_POKEMON, ...DE_TO_EN })
  .map(([de, en]) => ({ slug: pokemonSlug(de), de: anzeigeName(de), en }))
  .filter((p) => p.slug && namensForm(p.en));

const NACH_SLUG = new Map(POKEMON.map((p) => [p.slug, p]));
const NACH_EN = new Map(POKEMON.map((p) => [namensForm(p.en), p]));

export function pokemonFuerSlug(slug: string): PokemonEintrag | null {
  return NACH_SLUG.get(slug) ?? null;
}

/** Gehört die Karte zu diesem Pokémon? Ganzes Wort bzw. ganze Wortfolge. */
export function kartePasstZu(kartenName: string, en: string): boolean {
  const n = namensForm(en);
  return n.length > 0 && ` ${namensForm(kartenName)} `.includes(` ${n} `);
}

/**
 * Pokémon, die ein Kartenname enthält (z. B. „Pikachu & Zekrom-GX" → beide).
 * Über Wortfolgen bis Länge 3 statt 800 Ausdrücken je Karte.
 */
export function pokemonInName(kartenName: string): PokemonEintrag[] {
  const w = namensForm(kartenName).split(' ').filter(Boolean);
  const gefunden = new Map<string, PokemonEintrag>();
  for (let i = 0; i < w.length; i++) {
    for (let n = 1; n <= 3 && i + n <= w.length; n++) {
      const p = NACH_EN.get(w.slice(i, i + n).join(' '));
      if (p) gefunden.set(p.slug, p);
    }
  }
  return [...gefunden.values()];
}

/** Suchmuster für die Datenbank (grob), danach `kartePasstZu` (genau). */
export function datenbankMuster(en: string): string {
  return `%${namensForm(en).split(' ').join('%')}%`;
}

export interface PokemonUebersicht extends PokemonEintrag {
  karten: number;
  /** Teuerste Karte mit Bild (für Kachel und Vorschau). */
  spitze: { id: string; name: string; bild: string; preis: number } | null;
}

/** Zählt Karten je Pokémon und merkt die teuerste — rein, aus Indexzeilen. */
export function uebersicht(
  zeilen: ReadonlyArray<{ id: string; name: string; image_url: string | null; price: number | null }>,
): PokemonUebersicht[] {
  const je = new Map<string, PokemonUebersicht>();
  for (const z of zeilen) {
    for (const p of pokemonInName(z.name)) {
      const e = je.get(p.slug) ?? { ...p, karten: 0, spitze: null };
      e.karten += 1;
      const preis = Number(z.price) || 0;
      if (z.image_url && preis > 0 && (!e.spitze || preis > e.spitze.preis)) {
        e.spitze = { id: z.id, name: z.name, bild: z.image_url, preis };
      }
      je.set(p.slug, e);
    }
  }
  return [...je.values()].sort((a, b) => b.karten - a.karten || a.de.localeCompare(b.de, 'de'));
}

/** Mindestzahl Karten, ab der eine Pokémon-Seite in die Sitemap kommt. */
export const MIN_KARTEN_FUER_SITEMAP = 3;
