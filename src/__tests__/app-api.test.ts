import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  karteDto, detailDto, bewegungen, istFrisch, standTag, indexDto, suchbegriff,
  APP_FRISCH_MAX_TAGE, BEWEGUNG_MIN_PREIS, type KarteDto,
} from '@/lib/app-api';
import type { PokemonCard } from '@/types';

const JETZT = Date.parse('2026-10-06T12:00:00Z');
const basis = 'https://cardbeacon.de';
const karte = (x: Partial<PokemonCard & { indexStand: string }> = {}) =>
  ({ id: 'sv3pt5-199', name: 'Charizard ex', set: '151', setCode: 'sv3pt5', rarity: 'SIR', imageUrl: 'https://images.pokemontcg.io/sv3pt5/199.png',
     prices: { market: 120 }, trendPercent: 4.2, indexStand: '2026-10-05T22:00:00+00:00', ...x }) as PokemonCard & { indexStand?: string };

describe('App-API v1: Datenformen', () => {
  it('Preis trägt Quellstand und Frische', () => {
    const d = karteDto(karte(), basis, JETZT);
    expect(d.preis).toBe(120);
    expect(d.preisStand).toBe('2026-10-05');
    expect(d.frisch).toBe(true);
    expect(d.url).toBe('https://cardbeacon.de/karten/sv3pt5-199');
  });
  it('alter Preis wird als nicht frisch markiert, nie als heute', () => {
    const d = karteDto(karte({ indexStand: '2026-03-01T00:00:00Z' }), basis, JETZT);
    expect(d.frisch).toBe(false);
    expect(d.preisStand).toBe('2026-03-01');
  });
  it('fehlender Stand = unbekannt, nicht frisch', () => {
    const d = karteDto(karte({ indexStand: undefined }), basis, JETZT);
    expect(d.preisStand).toBeNull();
    expect(d.frisch).toBe(false);
  });
  it('kein Preis → null statt 0', () => {
    expect(karteDto(karte({ prices: { market: 0 } }), basis, JETZT).preis).toBeNull();
    expect(karteDto(karte({ trendPercent: undefined }), basis, JETZT).trend30).toBeNull();
  });
  it('Frische-Grenze', () => {
    expect(istFrisch('2026-10-03', JETZT)).toBe(true);
    expect(istFrisch('2026-09-30', JETZT)).toBe(false);
    expect(APP_FRISCH_MAX_TAGE).toBe(3);
    expect(standTag('2026/03/01')).toBe('2026-03-01');
    expect(standTag('kaputt')).toBeNull();
  });
  it('Verlauf: nur echte Punkte, keine erfundenen', () => {
    const d = detailDto(karte(), [{ date: '2026-10-01', price: 100 }, { date: 'x', price: 5 }, { date: '2026-10-02', price: Number.NaN }], basis, JETZT);
    expect(d.verlauf).toEqual([{ datum: '2026-10-01', preis: 100 }]);
    expect(d.aufschluesselung.ab).toBeNull();
  });
});

describe('App-API v1: Bewegungen', () => {
  const k = (id: string, preis: number, trend: number, frisch = true): KarteDto =>
    ({ ...karteDto(karte({ id, prices: { market: preis }, trendPercent: trend }), basis, JETZT), frisch });
  it('nur frische Preise ab Mindestpreis', () => {
    const r = bewegungen([k('a', 50, 30), k('b', 1, 300), k('c', 50, 80, false), k('d', 20, -12), k('e', 20, -40)]);
    expect(r.aufwaerts.map((x) => x.id)).toEqual(['a']);
    expect(r.abwaerts.map((x) => x.id)).toEqual(['e', 'd']);
    expect(BEWEGUNG_MIN_PREIS).toBeGreaterThanOrEqual(2);
  });
  it('Index ohne Messpunkte → null (Stolperstelle 29)', () => {
    expect(indexDto(null)).toBeNull();
    expect(indexDto({ date: '2026-10-06', value: 2.2, cardCount: 0, setCount: 0, windowDays: 30 })).toBeNull();
  });
  it('Suchbegriff begrenzt', () => {
    expect(suchbegriff('a')).toBeNull();
    expect(suchbegriff('  mew ')).toBe('mew');
    expect(suchbegriff('x'.repeat(200))?.length).toBe(60);
  });
});

describe('App-API v1: Routen', () => {
  const wurzel = join(process.cwd(), 'src/app/api/v1');
  const dateien: string[] = [];
  const lauf = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? lauf(p) : n === 'route.ts' && dateien.push(p); } };
  lauf(wurzel);
  it('fünf Routen vorhanden', () => expect(dateien.length).toBe(5));
  it('nur lesend, ohne Fehlerdetails, mit Cache-Kopfzeile', () => {
    for (const f of dateien) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)/);
      expect(src, f).not.toMatch(/String\(err|error: err|stack/);
      expect(src, f).toMatch(/Cache-Control/);
      expect(src, f).not.toMatch(/searchCards\(|fetchCardById/); // kein langsamer Fremdabruf
    }
  });
});
