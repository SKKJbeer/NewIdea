import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { mitFrischpreis, standFrisch, karteMitFrischpreis } from '@/lib/frischpreis-karte';
import { snapshotTauglich } from '@/lib/price-history';
import type { PokemonCard } from '@/types';
import type { FrischerPreis } from '@/lib/tcgdex';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

const KARTE: PokemonCard = {
  id: 'sv3pt5-199',
  name: 'Charizard ex',
  set: '151',
  setCode: 'sv3pt5',
  number: '199',
  rarity: 'Special Illustration Rare',
  imageUrl: 'x',
  prices: { market: 90 },
  trendPercent: 5,
  priceSource: 'cardmarket',
  realData: true,
  cmPrices: { trend: 90, avg30: 85, updatedAt: '2026/03/01' },
};

const TAG = Date.parse('2026-09-27T12:00:00Z');

const FRISCH: FrischerPreis = {
  trend: 120, avg30: 100, avg7: 115, avg1: 118, low: 95, avg: 110,
  updated: '2026-09-26T00:00:00.000Z', dexId: 'sv03.5-199',
};

describe('Frischer Preis auf der Kartenseite', () => {
  it('ersetzt Preis, Bewegung und Aufschluesselung vollstaendig', () => {
    const k = mitFrischpreis(KARTE, FRISCH);
    expect(k.prices.market).toBe(120);
    expect(k.trendPercent).toBe(20);
    expect(k.cmPrices).toMatchObject({ trend: 120, low: 95, avgSell: 110, avg30: 100, quelle: 'tcgdex' });
    expect(k.cmPrices?.updatedAt).toBe(FRISCH.updated);
    // Kein Rest des alten Stands in der Anzeige
    expect(k.priceHistory?.at(-1)?.price).toBe(120);
  });

  it('nennt ohne Ø 30 keine Bewegung', () => {
    const k = mitFrischpreis(KARTE, { ...FRISCH, avg30: null });
    expect(k.trendPercent).toBe(0);
    expect(k.realData).toBe(false);
  });

  it('nimmt nur junge Staende, ungueltige Daten nie (Stolperstelle 46)', () => {
    expect(standFrisch('2026-09-26T00:00:00Z', TAG)).toBe(true);
    expect(standFrisch('2026-09-20T00:00:00Z', TAG)).toBe(false);
    expect(standFrisch('kaputt', TAG)).toBe(false);
    expect(standFrisch('2027-01-01T00:00:00Z', TAG)).toBe(false);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('laesst die Karte bei einem Ausfall von TCGdex unveraendert, statt zu werfen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('netz weg'); }));
    const k = await karteMitFrischpreis(KARTE, 50);
    expect(k).toBe(KARTE);
  });
});

describe('Nur frische Preise werden Tageswerte (Stolperstelle 53)', () => {
  it('lehnt Monate alte Quellstaende ab', () => {
    expect(snapshotTauglich(KARTE, TAG)).toBe(false);
  });
  it('nimmt einen Stand vom Vortag', () => {
    expect(snapshotTauglich(mitFrischpreis(KARTE, FRISCH), TAG)).toBe(true);
  });
  it('lehnt Karten ohne Datenstand ab', () => {
    expect(snapshotTauglich({ ...KARTE, cmPrices: undefined }, TAG)).toBe(false);
  });
  it('beide Speicherwege pruefen die Schranke', () => {
    const src = lies('src/lib/price-history.ts');
    expect(src).toMatch(/!snapshotTauglich\(card\)/);
    expect(src).toMatch(/\.filter\(\(c\) => snapshotTauglich\(c\)\)/);
  });
});

describe('Kartenseite wird gecacht', () => {
  const seite = lies('src/app/karten/[id]/page.tsx');

  it('hat generateStaticParams mit leerer Liste — ohne ist die Route dynamisch', () => {
    expect(seite).toMatch(/export async function generateStaticParams\(\) \{\s*return \[\];\s*\}/);
    expect(seite).toMatch(/export const revalidate = \d+/);
  });

  it('rendert keine Fehlerseite selbst — die waere eine Stunde lang gecacht', () => {
    expect(seite).not.toContain('<ApiErrorState');
    expect(existsSync(join(process.cwd(), 'src/app/karten/[id]/error.tsx'))).toBe(true);
  });

  it('legt den frischen Preis einmal fuer Metadaten und Seite ueber', () => {
    expect(seite).toMatch(/cache\(async \(id: string\)/);
    expect(seite).toContain('karteMitFrischpreis(karte)');
  });

  it('vergleicht keinen frischen Kartenpreis mit einem alten Index', () => {
    expect(lies('src/components/MarketContextSection.tsx')).toMatch(/quelle === 'tcgdex'\) return null/);
  });
});

describe('Set-Seite und Vorschlaege antworten schnell', () => {
  it('Set-Seite hat eine eigene Fehlerseite', () => {
    expect(existsSync(join(process.cwd(), 'src/app/sets/[setCode]/error.tsx'))).toBe(true);
  });
  it('Vorschlaege haben eine harte Zeitgrenze', () => {
    const src = lies('src/app/api/search/suggestions/route.ts');
    expect(src).toMatch(/VORSCHLAG_BUDGET_MS = \d/);
    expect(src).toContain('mitGrenze(Promise.all(');
  });
});
