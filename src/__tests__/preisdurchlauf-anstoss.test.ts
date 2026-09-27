import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { oeffentlicheBasis } from '@/lib/site';

const lies = (d: string) => readFileSync(join(process.cwd(), d), 'utf8');
function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// BEFUND 27.09.2026: Vom 05.08. bis 27.09. ist der Preisdurchlauf kein einziges
// Mal automatisch gestartet. Aus dem Studio gestartet lief er sofort.

describe('Selbstaufrufe gehen an die oeffentliche Adresse', () => {
  afterEach(() => vi.unstubAllEnvs());
  const anfrage = new Request('https://new-idea-abc123-team.vercel.app/api/cron/daily');

  it('in Produktion die Produktionsadresse, nicht die des Deployments', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'new-idea-livid.vercel.app');
    expect(oeffentlicheBasis(anfrage)).toBe('https://new-idea-livid.vercel.app');
  });

  it('ausserhalb der Produktion die eigene Adresse', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'new-idea-livid.vercel.app');
    expect(oeffentlicheBasis(anfrage)).toBe('https://new-idea-abc123-team.vercel.app');
  });

  it('keine Route ruft sich mehr ueber request.url selbst auf', () => {
    for (const d of [
      'src/app/api/cron/price-sweep/route.ts',
      'src/app/api/studio/price-sweep/route.ts',
      'src/app/api/cron/daily/route.ts',
    ]) {
      const src = ohneKommentare(lies(d));
      expect(src, d).toMatch(/oeffentlicheBasis\(request\)/);
      expect(src, d).not.toMatch(/const basis = (url|new URL\(request\.url\))\.origin/);
    }
  });
});

describe('Der Durchlauf hat einen eigenen Cron', () => {
  it('startet vor dem Tages-Cron, damit der Index auf frischen Preisen rechnet', () => {
    const crons = (JSON.parse(lies('vercel.json')) as { crons: Array<{ path: string; schedule: string }> }).crons;
    const sweep = crons.find((c) => c.path === '/api/cron/price-sweep');
    const daily = crons.find((c) => c.path === '/api/cron/daily');
    expect(sweep).toBeDefined();
    const stunde = (c: { schedule: string }) => Number(c.schedule.split(' ')[1]);
    // Hobby-Crons feuern irgendwann in der angegebenen Stunde — deshalb
    // mindestens eine volle Stunde Abstand.
    expect(stunde(daily!) - stunde(sweep!)).toBeGreaterThanOrEqual(2);
  });
});

describe('Veralteter Kartenindex ist keine Tagesgrundlage', () => {
  // 53 Tage lang wurde der Index aus Preisen vom 05.08. gerechnet und mit
  // HEUTIGEM Datum gespeichert.
  it('getMarketBasis prueft das Alter und faellt sonst auf die Stichprobe zurueck', () => {
    const src = ohneKommentare(lies('src/lib/market-basis.ts'));
    expect(src).toMatch(/indexStandTag\(\)/);
    expect(src).toMatch(/Number\.isFinite\(alterTage\)/);
    expect(src).toMatch(/frisch && ausIndex\.length >= PMI_MIN_CARDS/);
  });

  it('der Stand wird mit Antwortkoerper gelesen und gekuerzt', () => {
    const src = lies('src/lib/card-index.ts');
    const fn = src.slice(src.indexOf('export async function indexStandTag'), src.indexOf('/** Zeilenzahl und Datenstand'));
    expect(fn).not.toMatch(/head:\s*true/);
    expect(fn).toMatch(/slice\(0, 10\)/);
  });
});
