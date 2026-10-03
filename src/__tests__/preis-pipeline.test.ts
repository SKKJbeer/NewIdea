import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  aktualisierung, preisGate, neuerStand, MIN_FRISCH_ANTEIL, type DurchlaufStand,
} from '@/lib/preis-durchlauf';
import { quellStand } from '@/lib/card-index';
import type { PokemonCard } from '@/types';

// DIE PREIS-PIPELINE IST DAS HERZSTUECK DER SEITE (Nutzer-Auftrag 27.09.2026:
// „die preise taeglich bei uns gespeichert und aktualisiert … das muss fest
// verankert werden"). Diese Tests brechen den Build, sobald einer der
// tragenden Teile fehlt oder aufgeweicht wird.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const ohneKommentare = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const ZEILE = {
  id: 'sv3pt5-199', name: 'Charizard ex', set_code: 'sv3pt5', set_name: '151', number: '199',
  price: 90, trend: 5, real_data: true, updated_at: '2026-03-01T00:00:00.000Z',
  image_url: 'x', rarity: 'SIR',
};

describe('Ein frischer Preis wird mit SEINEM Datum gespeichert', () => {
  const a = aktualisierung(ZEILE, { trend: 120, avg30: 100, updated: '2026-09-26T04:12:00.000Z' });

  it('Index: Preis, Bewegung, Quellstand — alle anderen Felder bleiben', () => {
    expect(a.zeile.price).toBe(120);
    expect(a.zeile.trend).toBe(20);
    expect(a.zeile.real_data).toBe(true);
    expect(a.zeile.updated_at).toBe('2026-09-26T04:12:00.000Z');
    expect(a.zeile.image_url).toBe('x');
  });

  it('Tageswert: Tag des Quellstands, nicht der Tag des Schreibens', () => {
    expect(a.snapshot).toEqual({
      card_id: 'sv3pt5-199', card_name: 'Charizard ex', price: 120, source: 'cardmarket', captured_on: '2026-09-26',
    });
  });

  it('ohne Ø 30 keine Bewegung und kein „echter" Verlauf', () => {
    const b = aktualisierung(ZEILE, { trend: 120, avg30: null, updated: '2026-09-26T00:00:00Z' });
    expect(b.zeile.trend).toBeNull();
    expect(b.zeile.real_data).toBe(false);
  });
});

describe('Qualitaetsschranke „Preise von heute"', () => {
  const HEUTE = '2026-09-28';
  const fertig = (ueber: Partial<DurchlaufStand>): DurchlaufStand => ({
    ...neuerStand('2026-09-28'), fertig: true, geprueft: 1000, frisch: 720, ...ueber,
  });

  it('haelt bei vollstaendigem Durchlauf mit genug frischen Preisen', () => {
    expect(preisGate(fertig({}), HEUTE).ok).toBe(true);
  });
  it('faellt ohne Durchlauf', () => {
    expect(preisGate(null, HEUTE).ok).toBe(false);
  });
  it('faellt, wenn der letzte Durchlauf aelter als ein Tag ist', () => {
    const g = preisGate(fertig({ datum: '2026-09-26' }), HEUTE);
    expect(g.ok).toBe(false);
    expect(g.befund).toMatch(/2026-09-26/);
  });
  it('faellt bei zu wenig frischen Preisen', () => {
    expect(preisGate(fertig({ frisch: Math.floor(1000 * MIN_FRISCH_ANTEIL) - 1 }), HEUTE).ok).toBe(false);
  });
  it('faellt, wenn TCGdex ganz ausfaellt (alles Fehler, nichts frisch)', () => {
    expect(preisGate(fertig({ frisch: 0, fehler: 1000 }), HEUTE).ok).toBe(false);
  });
  it('faellt bei einem Schreibfehler', () => {
    expect(preisGate(fertig({ schreibFehler: 'Kartenindex: kaputt' }), HEUTE).ok).toBe(false);
  });
  it('ein unfertiger Durchlauf von GESTERN ist ein Ausfall, einer von heute nicht', () => {
    expect(preisGate({ ...fertig({}), fertig: false, datum: '2026-09-27' }, HEUTE).ok).toBe(false);
    expect(preisGate({ ...fertig({}), fertig: false }, HEUTE).ok).toBe(true);
  });
  it('die Schwelle ist nicht aufgeweicht', () => {
    expect(MIN_FRISCH_ANTEIL).toBeGreaterThanOrEqual(0.5);
  });
});

describe('Der Durchlauf ist fest eingeplant', () => {
  const crons = (JSON.parse(lies('vercel.json')) as { crons: Array<{ path: string; schedule: string }> }).crons;
  const etappen = crons.filter((c) => c.path.startsWith('/api/cron/preise'));
  const stunde = (c: { schedule: string }) => Number(c.schedule.split(' ')[1]);

  it('mindestens vier Etappen', () => {
    expect(etappen.length).toBeGreaterThanOrEqual(4);
  });
  it('vier davon vor dem Tages-Cron (Marktindex um 08:00)', () => {
    const daily = crons.find((c) => c.path === '/api/cron/daily')!;
    // Hobby-Crons feuern irgendwann in der Stunde — eine volle Stunde Abstand.
    expect(etappen.filter((e) => stunde(e) <= stunde(daily) - 2).length).toBeGreaterThanOrEqual(4);
  });
  it('die Route meldet 500, wenn die Schranke nicht haelt', () => {
    const route = ohneKommentare(lies('src/app/api/cron/preise/route.ts'));
    expect(route).toMatch(/status: gate\.ok \? 200 : 500/);
    expect(route).toMatch(/isCronAuthedFromRequest/);
  });
  it('das Monitoring stellt einen Verstoss GANZ OBEN hin', () => {
    const h = ohneKommentare(lies('src/lib/system-health.ts'));
    expect(h).toMatch(/problems\.unshift\(`PREISE NICHT AKTUELL/);
  });
});

describe('Alte Preise koennen frische nicht mehr ueberschreiben', () => {
  it('der pokemontcg-Durchlauf fuegt nur NEUE Karten in den Index ein', () => {
    const idx = ohneKommentare(lies('src/lib/card-index.ts'));
    const block = idx.slice(idx.indexOf('export async function upsertCardIndex'));
    expect(block.slice(0, 1500)).toMatch(/ignoreDuplicates: true/);
    expect(block.slice(0, 1500)).toMatch(/updated_at: quellStand\(c\)/);
  });
  it('er speichert nur Tageswerte mit jungem Quellstand', () => {
    expect(ohneKommentare(lies('src/lib/price-sweep.ts'))).toMatch(/snapshotTauglich\(c\) && needsSnapshot/);
  });
  it('der Quellstand eines alten Preises ist alt, ein fehlender ist uralt', () => {
    const k = { cmPrices: { updatedAt: '2026/03/01' } } as PokemonCard;
    expect(quellStand(k).slice(0, 10)).toBe('2026-03-01');
    expect(quellStand({} as PokemonCard)).toBe('1970-01-01T00:00:00.000Z');
  });
  it('der Marktindex rechnet nur aus jungen Preisen, in fester Reihenfolge', () => {
    const idx = ohneKommentare(lies('src/lib/card-index.ts'));
    const block = idx.slice(idx.indexOf('export async function indexKartenFuerIndex'));
    expect(block.slice(0, 1500)).toMatch(/\.gte\('updated_at', frischGrenze\)/);
    expect(block.slice(0, 1500)).toMatch(/\.order\('id'/);
  });
});

describe('Belege je Grund (v6.16.1)', () => {
  it('zählt jede Karte, merkt sich aber höchstens BEISPIELE_JE_GRUND Belege', async () => {
    const { verbucheOhne, BEISPIELE_JE_GRUND } = await import('@/lib/preis-durchlauf');
    const stand = neuerStand('2026-10-03');
    for (let i = 0; i < BEISPIELE_JE_GRUND + 5; i++) verbucheOhne(stand, 'unplausibel', `karte-${i}`);
    verbucheOhne(stand, 'kein-cardmarket');
    expect(stand.ohneFrischpreis).toBe(BEISPIELE_JE_GRUND + 6);
    expect(stand.gruende.unplausibel).toBe(BEISPIELE_JE_GRUND + 5);
    expect(stand.beispiele?.unplausibel).toHaveLength(BEISPIELE_JE_GRUND);
    expect(stand.beispiele?.unplausibel?.[0]).toBe('karte-0');
    expect(stand.gruende['kein-cardmarket']).toBe(1);
    expect(stand.beispiele?.['kein-cardmarket']).toBeUndefined();
  });

  it('Beleg einer zurückgehaltenen Messung nennt Trend, beide Schnitte und den bisherigen Wert', async () => {
    const { unplausibelBeleg } = await import('@/lib/preis-durchlauf');
    expect(unplausibelBeleg({ id: 'sv05-195', name: 'Scizor ex', price: 2.6 }, { trend: 11.16, avg7: 2.55, avg30: null }))
      .toBe('sv05-195 Scizor ex: Trend 11.16, Ø7 2.55, Ø30 —, bisher 2.6');
  });

  it('beide Verbuchungsstellen (Etappe + Nachholrunde) laufen über verbucheOhne', () => {
    const code = ohneKommentare(lies('src/lib/preis-durchlauf.ts'));
    expect(code.match(/verbucheOhne\(stand, e\.grund, e\.detail\)/g)).toHaveLength(2);
    expect(code).not.toMatch(/stand\.gruende\[e\.grund\]/);
  });
});
