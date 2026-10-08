// Serverseitige Daten der Pokémon-Seiten (Übersicht + Sitemap), instanzübergreifend
// zwischengespeichert. Ein Wurf wird nicht abgelegt (unstable_cache).
import { unstable_cache } from 'next/cache';
import { alleKartennamen } from './card-index';
import { MIN_KARTEN_FUER_SITEMAP, uebersicht, type PokemonUebersicht } from './pokemon-seiten';

async function bauen(): Promise<PokemonUebersicht[]> {
  const zeilen = await alleKartennamen();
  if (zeilen.length === 0) throw new Error('Kartenindex leer — Pokémon-Übersicht nicht gebaut');
  return uebersicht(zeilen);
}

export const ladePokemonUebersicht = unstable_cache(bauen, ['pokemon-uebersicht-v1'], { revalidate: 43_200 });

/** Pokémon mit genug Karten für eine eigene Seite in der Sitemap. */
export async function pokemonFuerSitemap(): Promise<PokemonUebersicht[]> {
  return (await ladePokemonUebersicht()).filter((p) => p.karten >= MIN_KARTEN_FUER_SITEMAP);
}
