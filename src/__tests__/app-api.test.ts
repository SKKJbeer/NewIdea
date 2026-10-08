import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  karteDto, detailDto, bewegungen, istFrisch, standTag, indexDto, suchbegriff,
  APP_FRISCH_MAX_TAGE, BEWEGUNG_MIN_PREIS, type KarteDto,
  idsAusParam, tageAusParam, idGruppen, PORTFOLIO_MAX_IDS,
  artikelDto, guideDto, gueltigesDatum, setEintragDto, sprachDto, marktZusatz,
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
  it('Markt filtert dünn gehandelte Ausreißer wie Website und Instagram', () => {
    expect(readFileSync(join(wurzel, 'markt/route.ts'), 'utf8')).toMatch(/ohneDuenneAusreisser\(/);
  });
  it('zwölf Routen vorhanden', () => expect(dateien.length).toBe(12));
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

describe('App-API v1: Portfolio-Parameter', () => {
  it('IDs: gültig, eindeutig, gekappt', () => {
    expect(idsAusParam('sv3pt5-199, sv3pt5-199,bad id,<x>,swsh7-215')).toEqual(['sv3pt5-199', 'swsh7-215']);
    expect(idsAusParam(Array.from({ length: 150 }, (_, i) => `a-${i}`).join(',')).length).toBe(PORTFOLIO_MAX_IDS);
    expect(idsAusParam(null)).toEqual([]);
  });
  it('Tage begrenzt', () => {
    expect(tageAusParam('9999')).toBe(365);
    expect(tageAusParam('0')).toBe(1);
    expect(tageAusParam(null)).toBe(90);
  });
  it('Gruppen bleiben unter der 1.000-Zeilen-Grenze', () => {
    const ids = Array.from({ length: 50 }, (_, i) => `k-${i}`);
    for (const g of idGruppen(ids, 90)) expect(g.length * 90).toBeLessThanOrEqual(1000);
    expect(idGruppen(ids, 90).flat()).toEqual(ids);
    expect(idGruppen(['a'], 5000)).toEqual([['a']]);
  });
});

describe('App-API v1: Inhalte', () => {
  it('Artikel: Abschnitte ohne Text fallen weg, nur https-Quellen', () => {
    const d = artikelDto({ title: 'T', intro: 'I', sections: [{ heading: 'A', content: 'x' }, { heading: 'B', content: '' }],
      keyPoints: ['k', ''], sources: [{ label: 'CM', url: 'https://cardmarket.com' }, { label: 'X', url: 'javascript:alert(1)' }] },
      { datum: '2026-10-04', typ: 'rueckblick', kategorie: 'Rückblick', archiv: false }, 'https://cardbeacon.de');
    expect(d.abschnitte).toHaveLength(1);
    expect(d.kernpunkte).toEqual(['k']);
    expect(d.quellen).toHaveLength(1);
    expect(d.lesezeit).toBeGreaterThanOrEqual(1);
    expect(d.url).toBe('https://cardbeacon.de/artikel/2026-10-04');
  });
  it('Guide: Tipp optional', () => {
    const g = guideDto({ slug: 's', title: 'T', sections: [{ heading: 'H', content: 'c', tip: 't' }, { heading: 'H2', content: 'c2' }] }, 'https://cardbeacon.de');
    expect(g.abschnitte.map((a) => a.tipp)).toEqual(['t', null]);
  });
  it('Datum: Format und nicht in der Zukunft', () => {
    expect(gueltigesDatum('2026-10-04', '2026-10-07')).toBe('2026-10-04');
    expect(gueltigesDatum('2026-10-08', '2026-10-07')).toBeNull();
    expect(gueltigesDatum('../etc', '2026-10-07')).toBeNull();
  });
  it('Artikel-Route erzeugt nie (kein KI-Aufruf über die App)', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/api/v1/artikel/[datum]/route.ts'), 'utf8');
    expect(src).not.toMatch(/generateArticle/);
  });
});

describe('App-API v1: Ausbau', () => {
  it('Set-Eintrag: nur https-Logos', () => {
    const s = setEintragDto({ id: 'sv3pt5', name: '151', series: 'SV', releaseDate: '2023/09/22', total: 207, logoUrl: 'http://x', symbolUrl: 'https://s' });
    expect(s).toMatchObject({ setCode: 'sv3pt5', datum: '2023-09-22', logo: null, symbol: 'https://s', karten: 207 });
  });
  it('Sprachpreis: Grund im Klartext statt Wert', () => {
    expect(sprachDto({ sprache: 'JP', ok: false, grund: 'keine-zuordnung' })).toEqual({ sprache: 'JP', ok: false, grund: 'Keine eindeutige Zuordnung zu einer Karte dieser Sprache' });
    const d = sprachDto({ sprache: 'KR', ok: true, preis: { trend: 12, low: null, avg30: 10 }, stand: '2026-10-06', gegenstueck: { name: 'X', set: 'SV1' } });
    expect(d).toMatchObject({ ok: true, trend: 12, ab: null, durchschnitt30: 10, stand: '2026-10-06' });
  });
  it('Markt-Zusatz: Set-Bewegung absteigend, leere Breite = null', () => {
    const z = marktZusatz({ breite: { steigend: 0, fallend: 0, gesamt: 0 }, vorwoche: null,
      sets: [{ setCode: 'a', name: 'A', median: 1, karten: 30, datum: null }, { setCode: 'b', name: 'B', median: 5, karten: 30, datum: null }], neuheiten: null });
    expect(z.breite).toBeNull();
    expect(z.setBewegung.map((s) => s.setCode)).toEqual(['b', 'a']);
  });
});

describe('Lese-Inhalte mit Bildern (v6.27.0)', () => {
  it('inhaltKarte: nur mit https-Bild und Name, Preis ≤ 0 → null', async () => {
    const { inhaltKarte } = await import('@/lib/app-api');
    expect(inhaltKarte({ name: 'X', imageUrl: 'http://a/b.png' })).toBeNull();
    expect(inhaltKarte({ name: '', imageUrl: 'https://a/b.png' })).toBeNull();
    expect(inhaltKarte({ name: 'Mew', imageUrl: 'https://a/b.png', rarity: 'Unknown' })?.seltenheit).toBeNull();
    const k = inhaltKarte({ id: 'sv1-1', name: 'X', imageUrl: 'https://a/b.png', price: 0, trend: 5, setId: 'sv1', why: 'w' });
    expect(k).toMatchObject({ id: 'sv1-1', preis: null, trend30: 5, setCode: 'sv1', warum: 'w' });
  });

  it('artikelDto und guideDto liefern Karten', async () => {
    const { artikelDto, guideDto } = await import('@/lib/app-api');
    const a = artikelDto({ title: 'T', intro: 'I', featuredCards: [{ name: 'A', imageUrl: 'https://x/a.png', price: 3 }],
      sections: [{ heading: 'H', content: 'C', highlight: { name: 'B', imageUrl: 'https://x/b.png' } }] },
      { datum: '2026-10-08', typ: 'markt', kategorie: 'Markt', archiv: false }, 'https://s');
    expect(a.karten?.map((k) => k.name)).toEqual(['A']);
    expect(a.abschnitte[0].karte?.name).toBe('B');
    const g = guideDto({ slug: 's', title: 'G', icon: 'gem', badge: 'Grading',
      sections: [{ heading: 'H', content: 'C', cards: [{ name: 'Z', rarity: 'R', why: 'w', imageUrl: 'https://x/z.png', setId: 'base1' }] }] }, 'https://s');
    expect(g.icon).toBe('gem');
    expect(g.abschnitte[0].karten?.[0]).toMatchObject({ name: 'Z', setCode: 'base1', warum: 'w' });
  });

  it('berichtKarten und anreisser', async () => {
    const { berichtKarten, anreisser } = await import('@/lib/app-api');
    const b = berichtKarten({ topGainers: [{ id: 'a-1', name: 'A', imageUrl: 'https://x/a.png', prices: { market: 4 }, trendPercent: 12 }], topValue: [] });
    expect(b.aufwaerts[0]).toMatchObject({ id: 'a-1', preis: 4, trend30: 12 });
    expect(anreisser('kurz')).toBe('kurz');
    const lang = anreisser('wort '.repeat(80), 40);
    expect(lang.length).toBeLessThanOrEqual(42);
    expect(lang.endsWith('…')).toBe(true);
  });
});

describe('Marktbericht der App: dünne Klassiker raus', () => {
  it('Speichern, App und Website filtern Gewinner über relevanteBerichtsGewinner', async () => {
    const { readFileSync } = await import('node:fs');
    for (const f of ['src/app/api/v1/marktbericht/route.ts', 'src/lib/market-report-generator.ts',
      'src/app/marktbericht/page.tsx', 'src/app/marktbericht/[week]/page.tsx']) {
      expect(readFileSync(f, 'utf8'), f).toContain('relevanteBerichtsGewinner(');
    }
  });
});
