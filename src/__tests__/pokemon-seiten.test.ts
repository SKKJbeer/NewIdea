import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  POKEMON, anzeigeName, datenbankMuster, kartePasstZu, pokemonFuerSlug, pokemonInName, pokemonSlug, uebersicht,
} from '@/lib/pokemon-seiten';

describe('Pokémon-Seiten', () => {
  it('Slugs und Anzeigenamen', () => {
    expect(pokemonSlug('glurak')).toBe('glurak');
    expect(pokemonSlug('typ:null')).toBe('typ-null');
    expect(pokemonSlug('ölfa')).toBe('oelfa');
    expect(pokemonSlug('nidoran♀')).toBe('nidoran-w');
    expect(pokemonFuerSlug('pikachu')?.en).toBe('Pikachu');
    expect(kartePasstZu('Nidoran ♀', 'Nidoran♀')).toBe(true);
    expect(kartePasstZu('Nidoran ♂', 'Nidoran♀')).toBe(false);
    expect(anzeigeName('kapu-riki')).toBe('Kapu-Riki');
    expect(pokemonFuerSlug('glurak')).toMatchObject({ de: 'Glurak', en: 'Charizard' });
    expect(pokemonFuerSlug('gibt-es-nicht')).toBeNull();
    expect(new Set(POKEMON.map((p) => p.slug)).size).toBe(POKEMON.length);
  });

  it('Wortgrenzen: Mew ≠ Mewtwo, Pikachu ≠ Raichu, Varianten zählen', () => {
    expect(kartePasstZu('Mewtwo', 'Mew')).toBe(false);
    expect(kartePasstZu('Mew ex', 'Mew')).toBe(true);
    expect(kartePasstZu('Raichu', 'Pikachu')).toBe(false);
    expect(kartePasstZu('M Charizard-EX', 'Charizard')).toBe(true);
    expect(kartePasstZu('Dark Charizard', 'Charizard')).toBe(true);
    expect(kartePasstZu("Team Rocket's Mewtwo ex", 'Mewtwo')).toBe(true);
    expect(kartePasstZu('Mr. Mime', 'Mr. Mime')).toBe(true);
  });

  it('pokemonInName findet Tag-Team-Partner', () => {
    expect(pokemonInName('Pikachu & Zekrom-GX').map((p) => p.en).sort()).toEqual(['Pikachu', 'Zekrom']);
    expect(pokemonInName('Professor\'s Research')).toEqual([]);
    expect(datenbankMuster('Mr. Mime')).toBe('%mr%mime%');
  });

  it('Übersicht zählt und merkt die teuerste Karte', () => {
    const u = uebersicht([
      { id: 'a', name: 'Charizard', image_url: 'https://x/a.png', price: 500 },
      { id: 'b', name: 'Charizard ex', image_url: 'https://x/b.png', price: 80 },
      { id: 'c', name: 'Charmander', image_url: null, price: 2 },
    ]);
    const glurak = u.find((p) => p.slug === 'glurak')!;
    expect(glurak.karten).toBe(2);
    expect(glurak.spitze?.id).toBe('a');
    expect(u.find((p) => p.slug === 'glumanda')?.spitze).toBeNull();
  });

  it('Kartenseite, Sitemap und Navigation verlinken die Pokémon-Seiten', () => {
    expect(readFileSync('src/app/karten/[id]/page.tsx', 'utf8')).toContain('pokemonInName(card.name)');
    expect(readFileSync('src/app/sitemap.ts', 'utf8')).toContain('/pokemon/${p.slug}');
    expect(readFileSync('src/components/AppSidebar.tsx', 'utf8')).toContain("'/pokemon'");
  });
});
