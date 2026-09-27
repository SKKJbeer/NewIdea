import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Speicher und Meta nachgebaut: Der Nachhol-Lauf soll fertige Container
// veroeffentlichen, unfertige behalten und kaputte verwerfen — nie endlos.
const speicher = new Map<string, Array<{ containerId: string; art: string; erstellt: string }>>();
const status = new Map<string, 'FINISHED' | 'IN_PROGRESS' | 'ERROR'>();
const veroeffentlicht: string[] = [];

vi.mock('@/lib/social-speicher', () => ({
  leseOffen: async (d: string) => speicher.get(d) ?? [],
  merkeOffen: async (d: string, o: never[]) => { speicher.set(d, o); },
  vergissOffen: async (d: string) => { speicher.delete(d); },
  ablegen: vi.fn(),
  aufraeumen: vi.fn(),
}));

vi.mock('@/lib/instagram', async (orig) => {
  const echt = await orig<typeof import('@/lib/instagram')>();
  return {
    ...echt,
    containerFertigBis: async (_k: unknown, id: string) => {
      const s = status.get(id);
      if (s === 'ERROR') throw new echt.GraphFehler('Container ERROR: kaputt', null, null);
      return s === 'FINISHED';
    },
    veroeffentliche: async (_k: unknown, id: string) => { veroeffentlicht.push(id); return `media-${id}`; },
  };
});

import { holeNach } from '@/lib/instagram-autopilot';
import { berlinerDatum } from '@/lib/instagram';

const K = { token: 't', konto: 'k' };
const JETZT = new Date('2026-09-28T17:40:00Z');
const HEUTE = berlinerDatum(JETZT);
const GESTERN = berlinerDatum(new Date(JETZT.getTime() - 86_400_000));
const eintrag = (id: string) => ({ containerId: id, art: 'reel', erstellt: '2026-09-28T16:45:00Z' });

describe('Der Nachhol-Lauf', () => {
  beforeEach(() => { speicher.clear(); status.clear(); veroeffentlicht.length = 0; });

  it('veroeffentlicht, was Meta inzwischen fertig hat, und vergisst es dann', async () => {
    speicher.set(HEUTE, [eintrag('a')]);
    status.set('a', 'FINISHED');
    const r = await holeNach(K, JETZT);
    expect(r.veroeffentlicht).toEqual([{ art: 'reel', mediaId: 'media-a' }]);
    expect(speicher.has(HEUTE)).toBe(false);
  });

  it('behaelt, woran Meta noch arbeitet', async () => {
    speicher.set(HEUTE, [eintrag('b')]);
    status.set('b', 'IN_PROGRESS');
    const r = await holeNach(K, JETZT);
    expect(r.weiterOffen).toBe(1);
    expect(veroeffentlicht).toEqual([]);
    expect(speicher.get(HEUTE)).toHaveLength(1);
  });

  it('verwirft kaputte Container, statt sie jeden Tag neu zu versuchen', async () => {
    speicher.set(HEUTE, [eintrag('c')]);
    status.set('c', 'ERROR');
    const r = await holeNach(K, JETZT);
    expect(r.verworfen).toHaveLength(1);
    expect(speicher.has(HEUTE)).toBe(false);
  });

  // Ein Container gilt bei Meta 24 Stunden — ein kurz vor Mitternacht
  // vorgemerktes Reel darf nicht verloren gehen.
  it('schaut auch beim Vortag nach', async () => {
    speicher.set(GESTERN, [eintrag('d')]);
    status.set('d', 'FINISHED');
    await holeNach(K, JETZT);
    expect(veroeffentlicht).toEqual(['d']);
  });
});

describe('Der Nachhol-Lauf ist eingeplant und geschuetzt', () => {
  const lies = (d: string) => readFileSync(join(process.cwd(), d), 'utf8');

  it('laeuft nach dem Hauptlauf', () => {
    const crons = (JSON.parse(lies('vercel.json')) as { crons: Array<{ path: string; schedule: string }> }).crons;
    const haupt = crons.find((c) => c.path === '/api/cron/social')!;
    const nach = crons.find((c) => c.path === '/api/cron/social/nachholen')!;
    expect(nach).toBeDefined();
    const stunde = (c: { schedule: string }) => Number(c.schedule.split(' ')[1]);
    expect(stunde(nach)).toBeGreaterThan(stunde(haupt));
  });

  it('nimmt nur Cron oder Studio an', () => {
    const r = lies('src/app/api/cron/social/nachholen/route.ts');
    expect(r).toMatch(/isCronAuthedFromRequest\(request\)/);
    expect(r).toMatch(/isStudioAuthedFromRequest\(request\)/);
  });

  it('der Hauptlauf merkt einen unfertigen Container vor, statt ihn aufzugeben', () => {
    const lib = lies('src/lib/instagram-autopilot.ts');
    expect(lib).toMatch(/status: 'wartet'/);
    expect(lib).toMatch(/merkeOffen\(datum/);
    // Ein vorgemerkter Feed-Beitrag zaehlt als „schon da" — sonst entstuende ein zweiter.
    expect(lib).toMatch(/wartet bereits ein Feed-Beitrag/);
  });
});

describe('Speicher und Rendern passen zu den Grenzen der Plattformen', () => {
  const lies = (d: string) => readFileSync(join(process.cwd(), d), 'utf8');

  // Erster Lauf auf Produktion: „The object exceeded the maximum allowed size"
  // — der kostenlose Supabase-Tarif erlaubt hoechstens 50 MB je Datei.
  it('der Eimer bleibt unter der 50-MB-Grenze des kostenlosen Tarifs', () => {
    const m = lies('src/lib/social-speicher.ts').match(/fileSizeLimit:\s*(\d+)\s*\*\s*1024\s*\*\s*1024/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeLessThanOrEqual(50);
  });

  // Gemessen auf einem Kern: 113 s bei 30 fps/fast, 75 s bei 24 fps/veryfast.
  it('rendert sparsam genug fuer einen Kern', () => {
    const gen = lies('src/lib/reel-generator.ts');
    expect(gen).toMatch(/const FPS = 24;/);
    expect(gen).toMatch(/'-preset veryfast'/);
  });
});
