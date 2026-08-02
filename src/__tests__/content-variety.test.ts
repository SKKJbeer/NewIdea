import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  themenAusTiteln, istVerbraucht, waehleThemen, deterministischMischen, SPERRFRIST,
} from '@/lib/content-variety';
import type { PokemonCard } from '@/types';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');

/**
 * Kommentare vor der Pruefung entfernen.
 *
 * ZUM FUENFTEN MAL noetig: Eine Regel, die nach einem verbotenen Begriff
 * sucht, findet ihn zuverlaessig in der Begruendung, warum er verboten ist.
 * Der Kommentar „KEIN Math.random()" liess genau den Test scheitern, der
 * Math.random verbietet.
 */
const ohneKommentare = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// GEGEN DIE ENDLOSSCHLEIFE.
//
// Gezaehlt auf der veroeffentlichten Seite: Fuenf von acht Beitraegen
// behandelten dieselbe Karte (Pikachu ex / Surging Sparks), zwei weitere
// dasselbe zweite Motiv. Fuer jemanden, der die Seite verfolgt, ist das kein
// Angebot, sondern eine Wiederholung.

const karte = (id: string, name: string, set: string, trend = 0, preis = 10): PokemonCard =>
  ({ id, name, set, trendPercent: trend, prices: { market: preis } } as unknown as PokemonCard);

const ECHTE_TITEL = [
  'Wochenrückblick KW 31: Pikachu zieht die Kabel, der Rest von Surging Sparks zieht den Kürzeren',
  'Pikachu ex zieht an, Surging Sparks kühlt ab: Marktanalyse 30.07.2026',
  'Wochenrückblick KW 30: Wenn die Krone wackelt und die Spinne klettert',
  'Stellar Crown im Check: Galvantula ex klettert, während die Krone bröckelt',
];

describe('Themen aus bereits erschienenen Titeln', () => {
  it('erkennt die tatsaechlich wiederholten Motive', () => {
    const gesperrt = themenAusTiteln(ECHTE_TITEL);
    expect(gesperrt.has('pikachu')).toBe(true);
    expect(gesperrt.has('surging')).toBe(true);
    expect(gesperrt.has('sparks')).toBe(true);
    expect(gesperrt.has('galvantula')).toBe(true);
    expect(gesperrt.has('stellar')).toBe(true);
  });

  it('sperrt keine Allerweltswoerter — sonst bliebe nichts uebrig', () => {
    const gesperrt = themenAusTiteln(ECHTE_TITEL);
    for (const w of ['markt', 'woche', 'karte', 'analyse', 'juli', 'pokemon']) {
      expect(gesperrt.has(w), w).toBe(false);
    }
  });

  it('trifft eine Karte ueber Name ODER Set', () => {
    const gesperrt = themenAusTiteln(ECHTE_TITEL);
    expect(istVerbraucht(karte('a', 'Pikachu ex', 'Surging Sparks'), gesperrt)).toBe(true);
    // Anderer Name, aber dasselbe Set — auch das war schon Thema.
    expect(istVerbraucht(karte('b', 'Latias ex', 'Surging Sparks'), gesperrt)).toBe(true);
    expect(istVerbraucht(karte('c', 'Glurak ex', 'Obsidian Flames'), gesperrt)).toBe(false);
  });
});

describe('Themenwahl', () => {
  const pool = [
    karte('1', 'Pikachu ex', 'Surging Sparks', 40, 300),
    karte('2', 'Latias ex', 'Surging Sparks', 30, 200),
    karte('3', 'Glurak ex', 'Obsidian Flames', 12, 150),
    karte('4', 'Mew ex', 'Pokémon 151', -9, 80),
    karte('5', 'Turtok ex', 'Pokémon 151', 4, 60),
    karte('6', 'Bisaflor ex', 'Paldea Evolved', -3, 40),
    karte('7', 'Rayquaza', 'Evolving Skies', 7, 500),
  ];

  it('haelt bereits behandelte Karten aus dem Kandidatenkreis', () => {
    const wahl = waehleThemen(pool, ECHTE_TITEL, '2026-08-06');
    const namen = wahl.kandidaten.map((c) => `${c.name} ${c.set}`).join(' ').toLowerCase();
    expect(namen).not.toContain('pikachu');
    expect(namen).not.toContain('surging sparks');
    expect(wahl.sperreGelockert).toBe(false);
  });

  it('nimmt nicht immer die teuerste Karte', () => {
    // Genau das war die Ursache: Wer immer die ersten sechs nach Wert nimmt,
    // bekommt ueber Wochen dasselbe Thema.
    const a = waehleThemen(pool, [], '2026-08-06').kandidaten.map((c) => c.id);
    const b = waehleThemen(pool, [], '2026-08-13').kandidaten.map((c) => c.id);
    expect(a).not.toEqual(b);
  });

  it('liefert am selben Tag IMMER dieselbe Auswahl', () => {
    // Sonst zeigte ein zweiter Seitenaufruf einen anderen Artikel.
    const a = waehleThemen(pool, [], '2026-08-06').kandidaten.map((c) => c.id);
    const b = waehleThemen(pool, [], '2026-08-06').kandidaten.map((c) => c.id);
    expect(a).toEqual(b);
  });

  it('zeigt beide Richtungen, nicht nur Gewinner', () => {
    // Ein Beitrag nur mit Steigerungen ist eine Auswahl zugunsten guter
    // Nachrichten.
    const wahl = waehleThemen(pool, [], '2026-08-06');
    const trends = wahl.kandidaten.map((c) => c.trendPercent ?? 0);
    expect(Math.max(...trends)).toBeGreaterThan(0);
    expect(Math.min(...trends)).toBeLessThan(0);
  });

  it('lockert die Sperre, statt gar nichts zu liefern — und sagt es', () => {
    const eng = [karte('1', 'Pikachu ex', 'Surging Sparks', 40)];
    const wahl = waehleThemen(eng, ECHTE_TITEL, '2026-08-06');
    expect(wahl.kandidaten.length).toBeGreaterThan(0);
    expect(wahl.sperreGelockert).toBe(true);
  });

  it('mischt ohne Zufallsquelle', () => {
    expect(ohneKommentare(lies('src/lib/content-variety.ts'))).not.toContain('Math.random');
    expect(deterministischMischen([1, 2, 3, 4, 5], 'x')).toHaveLength(5);
    expect(deterministischMischen([1, 2, 3, 4, 5], 'x').sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('Der Generator nutzt die Themenwahl', () => {
  const gen = lies('src/lib/article-generator.ts');

  it('waehlt aus einem breiteren Pool als frueher', () => {
    expect(gen).toContain('fetchTrendingCards(30)');
    expect(gen).not.toContain('.slice(0, 6)');
  });

  it('reicht die letzten Titel als SPERRE, nicht als Anknuepfung', () => {
    // Woertlich stand dort „nur bei thematischem Bezug natuerlich darauf
    // anspielen" — das Modell nahm die Liste als Themenvorschlag.
    expect(gen).toContain('BEREITS ERSCHIENEN');
    expect(gen).not.toContain('darauf anspielen — kein Zwang');
  });

  it('filtert VOR dem Prompt, nicht nur per Bitte an das Modell', () => {
    // Ein Modell, das man bittet, sich nicht zu wiederholen, tut es trotzdem.
    expect(gen).toContain('waehleThemen(');
    expect(gen).toContain('alsPromptText(');
  });

  it('beruecksichtigt genug zurueckliegende Beitraege', () => {
    expect(SPERRFRIST).toBeGreaterThanOrEqual(5);
    expect(gen).toContain('slice(0, SPERRFRIST)');
  });
});
