import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { dexSetFuer, dexKandidaten, normiere, holeFrischenPreis, bewegung, SET_AUSNAHMEN, type DexSet } from '@/lib/tcgdex';

const SETS: DexSet[] = [
  { id: 'base1', name: 'Base Set' },
  { id: 'sv03.5', name: '151' },
  { id: 'lc', name: 'Legendary Collection' },
  { id: 'swsh4.5sv', name: 'Shining Fates Shiny Vault' },
  { id: 'svp', name: 'SVP Black Star Promos' },
  { id: 'swsh7', name: 'Evolving Skies' },
];

describe('Set-Zuordnung pokemontcg.io → TCGdex', () => {
  it('findet Sets ueber den Namen, auch bei abweichender ID', () => {
    expect(dexSetFuer('sv3pt5', '151', SETS)).toBe('sv03.5');
    expect(dexSetFuer('base6', 'Legendary Collection', SETS)).toBe('lc');
    expect(dexSetFuer('swsh7', 'Evolving Skies', SETS)).toBe('swsh7');
  });

  it('nimmt die Handzuordnung, wo der Name nicht passt', () => {
    expect(dexSetFuer('base1', 'Base', SETS)).toBe('base1');
    expect(dexSetFuer('svp', 'Scarlet & Violet Black Star Promos', SETS)).toBe('svp');
    // Gemessen: neun Sets ohne Namenstreffer.
    expect(Object.keys(SET_AUSNAHMEN)).toHaveLength(9);
  });

  it('gibt bei Unbekanntem null zurueck statt zu raten', () => {
    expect(dexSetFuer('xy99', 'Gibt Es Nicht', SETS)).toBeNull();
  });

  it('probiert bei Promos die dreistellige Nummer', () => {
    expect(dexKandidaten('svp', '1')).toEqual(['svp-1', 'svp-001']);
    expect(dexKandidaten('sv03.5', '199')).toEqual(['sv03.5-199']);
    expect(dexKandidaten('swsh4.5sv', 'SV001')).toEqual(['swsh4.5sv-SV001']);
  });

  it('vergleicht Namen ohne Satzzeichen und Akzente', () => {
    expect(normiere('M Lucario-EX')).toBe(normiere('M Lucario EX'));
    expect(normiere('Boss’s Orders')).toBe(normiere("Boss's Orders"));
    expect(normiere('Flabébé')).toBe('flabebe');
  });
});

describe('Ein Preis wird nur bei belegter Zuordnung uebernommen', () => {
  afterEach(() => vi.unstubAllGlobals());
  const antwort = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
  const cm = { updated: '2026-09-26T22:54:32Z', unit: 'EUR', trend: 477.65, avg30: 364.87, avg7: 470.58, avg1: 446.19, low: 109.98, avg: 370.41 };

  it('uebernimmt Trend und Durchschnitte bei gleichem Namen', async () => {
    vi.stubGlobal('fetch', vi.fn(() => antwort({ id: 'sv03.5-199', name: 'Charizard ex', pricing: { cardmarket: cm } })));
    const p = await holeFrischenPreis({ name: 'Charizard ex', setCode: 'sv3pt5', set: '151', number: '199' }, SETS);
    expect(p?.trend).toBe(477.65);
    expect(p?.dexId).toBe('sv03.5-199');
    expect(bewegung(p!)).toBeCloseTo(((477.65 - 364.87) / 364.87) * 100, 5);
  });

  // DIE WICHTIGSTE REGEL: Ein fehlender Preis ist besser als der einer anderen Karte.
  it('verwirft den Preis, wenn der Name abweicht', async () => {
    vi.stubGlobal('fetch', vi.fn(() => antwort({ id: 'sv03.5-199', name: 'Alakazam ex', pricing: { cardmarket: cm } })));
    expect(await holeFrischenPreis({ name: 'Charizard ex', setCode: 'sv3pt5', set: '151', number: '199' }, SETS)).toBeNull();
  });

  it('verwirft Preise in anderer Waehrung und ohne Trend', async () => {
    vi.stubGlobal('fetch', vi.fn(() => antwort({ name: 'Charizard ex', pricing: { cardmarket: { ...cm, unit: 'USD' } } })));
    expect(await holeFrischenPreis({ name: 'Charizard ex', setCode: 'sv3pt5', set: '151', number: '199' }, SETS)).toBeNull();
    vi.stubGlobal('fetch', vi.fn(() => antwort({ name: 'Charizard ex', pricing: { cardmarket: { ...cm, trend: null } } })));
    expect(await holeFrischenPreis({ name: 'Charizard ex', setCode: 'sv3pt5', set: '151', number: '199' }, SETS)).toBeNull();
  });

  it('versucht bei 404 die dreistellige Promo-Nummer', async () => {
    const f = vi.fn((url: string) =>
      url.endsWith('/svp-1') ? Promise.resolve(new Response('', { status: 404 })) : antwort({ id: 'svp-001', name: 'Sprigatito', pricing: { cardmarket: cm } }),
    );
    vi.stubGlobal('fetch', f);
    const p = await holeFrischenPreis({ name: 'Sprigatito', setCode: 'svp', set: 'SV Promos', number: '1' }, SETS);
    expect(p?.dexId).toBe('svp-001');
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('meldet Serverfehler, statt sie als „kein Preis" zu tarnen', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 502 }))));
    await expect(holeFrischenPreis({ name: 'X', setCode: 'sv3pt5', set: '151', number: '1' }, SETS)).rejects.toThrow(/502/);
  });
});

describe('Frischpreise: Ablage und Verwendung', () => {
  const lies = (d: string) => readFileSync(join(process.cwd(), d), 'utf8');

  it('filtert zu alte Cardmarket-Staende und prueft NaN', () => {
    const src = lies('src/lib/frischpreise.ts');
    expect(src).toMatch(/!Number\.isFinite\(t\) \|\| t < grenze/);
  });

  it('laeuft taeglich nach dem Preisdurchlauf und vor dem Autopiloten', () => {
    const crons = (JSON.parse(lies('vercel.json')) as { crons: Array<{ path: string; schedule: string }> }).crons;
    const stunde = (p: string) => Number(crons.find((c) => c.path === p)!.schedule.split(' ')[1]);
    expect(stunde('/api/cron/frischpreise')).toBeGreaterThan(stunde('/api/cron/price-sweep') + 1);
    expect(stunde('/api/cron/frischpreise')).toBeLessThan(stunde('/api/cron/social'));
  });

  // cardsFromIndex kappt still bei 200 IDs — bei 400 Frischpreisen waere die
  // Haelfte stumm weggefallen.
  it('laedt die Index-Metadaten in Stuecken zu 200', () => {
    const src = lies('src/lib/marktbilder.tsx');
    expect(src).toMatch(/for \(let i = 0; i < ids\.length; i \+= 200\)/);
  });

  it('die Marktbilder nehmen Frischpreise zuerst', () => {
    const src = lies('src/lib/marktbilder.tsx');
    const fn = src.slice(src.indexOf('export async function ladeMarktkarten'));
    expect(fn.indexOf('leseFrischpreise')).toBeLessThan(fn.indexOf('wertvollsteAusIndex'));
  });
});

describe('Nur Bewegungen, die die Verkaeufe tragen', () => {
  // Rohwerte vom 27.09.2026, TCGdex.
  it('verwirft Dark Dragoran (+1.459 %): Trend 15× ueber dem Schnitt, Ø 7 Tage zeigt nach unten', async () => {
    const { bestaetigteBewegung } = await import('@/lib/frischpreise');
    expect(bestaetigteBewegung({ trend: 2133.07, avg30: 136.81, avg7: 99.91 })).toBeNull();
  });

  it('verwirft Shining Celebi (+217 %): Ø 7 Tage widerspricht', async () => {
    const { bestaetigteBewegung } = await import('@/lib/frischpreise');
    expect(bestaetigteBewegung({ trend: 965.47, avg30: 304.19, avg7: 251.55 })).toBeNull();
  });

  it('verwirft Sceptile EX (+51 %): Trend steigt, Verkaeufe fallen', async () => {
    const { bestaetigteBewegung } = await import('@/lib/frischpreise');
    expect(bestaetigteBewegung({ trend: 18.21, avg30: 12.03, avg7: 8.83 })).toBeNull();
  });

  it('behaelt M Sceptile EX (+59 %): Ø 7 Tage bestaetigt — und zeigt die Kennzahl der Seite', async () => {
    const { bestaetigteBewegung } = await import('@/lib/frischpreise');
    const b = bestaetigteBewegung({ trend: 43.15, avg30: 27.16, avg7: 45.64 });
    expect(b).toBeCloseTo(((43.15 - 27.16) / 27.16) * 100, 5);
  });

  it('ohne 30-Tage-Wert oder 7-Tage-Wert keine Bewegung', async () => {
    const { bestaetigteBewegung } = await import('@/lib/frischpreise');
    expect(bestaetigteBewegung({ trend: 10, avg30: null, avg7: 9 })).toBeNull();
    expect(bestaetigteBewegung({ trend: 10, avg30: 9, avg7: null })).toBeNull();
  });

  it('wirft Karten mit identischen Preisdaten beide heraus (Holo/Nicht-Holo auf einer Cardmarket-Seite)', async () => {
    const { ohneMehrdeutige } = await import('@/lib/frischpreise');
    const e = (id: string, preis: number) => ({ id, preis, avg30: 136.81, avg7: 99.91, low: 29.99 });
    expect(ohneMehrdeutige([e('base5-5', 2133.07), e('base5-22', 2133.07), e('x-1', 10)]).map((k) => k.id)).toEqual(['x-1']);
  });

  it('das Reel bekommt dieselbe Bereinigung wie das Karussell', () => {
    const lib = readFileSync(join(process.cwd(), 'src/lib/instagram-autopilot.ts'), 'utf8');
    expect(lib).toMatch(/buildStory\(validateMarketData\(basis\.karten\)\.clean/);
  });
});

describe('Kein Vergleich zwischen verschiedenen Datenstaenden', () => {
  // Erster Probelauf: „+149,2 pp zum Markt" — ein Preis von gestern gegen einen
  // Index auf Monate alten Werten.
  it('bei Frischpreisen entfaellt der Abstand zum Index', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/marktbilder.tsx'), 'utf8');
    expect(src).toMatch(/gegenMarkt: basis\.quelle === 'frisch' \? null/);
  });
});
