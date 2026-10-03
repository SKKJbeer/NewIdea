import { describe, it, expect, afterEach } from 'vitest';
import nextConfig, { domainZiel, VERCEL_HOST } from '../../next.config';

// Umleitung Vercel-Adresse → eigene Domain. Darf NUR greifen, wenn
// NEXT_PUBLIC_SITE_URL bewusst auf eine eigene Domain zeigt — eine Umleitung
// auf eine noch nicht ausgelieferte Domain legte die ganze Seite lahm.

const alt = process.env.NEXT_PUBLIC_SITE_URL;
afterEach(() => { process.env.NEXT_PUBLIC_SITE_URL = alt; });

describe('domainZiel', () => {
  it('nur eigene Domains werden Ziel', () => {
    expect(domainZiel('https://cardbeacon.de')).toBe('https://cardbeacon.de');
    expect(domainZiel('cardbeacon.de/')).toBe('https://cardbeacon.de');
    expect(domainZiel(undefined)).toBeNull();
    expect(domainZiel('')).toBeNull();
    expect(domainZiel('https://new-idea-livid.vercel.app')).toBeNull();
    expect(domainZiel('http://localhost:3000')).toBeNull();
  });
});

describe('redirects()', () => {
  it('ohne eigene Domain: keine Umleitung', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(await nextConfig.redirects!()).toEqual([]);
  });

  it('mit eigener Domain: 308 nur für die Vercel-Adresse, /api ausgenommen', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://cardbeacon.de';
    const [r, ...rest] = await nextConfig.redirects!();
    expect(rest).toHaveLength(0);
    expect(r.permanent).toBe(true);
    expect(r.destination).toBe('https://cardbeacon.de/:pfad');
    expect(r.has).toEqual([{ type: 'host', value: VERCEL_HOST.replace(/\./g, '\\.') }]);
    const muster = new RegExp(`^/(${r.source.match(/\((.*)\)$/)![1]})$`);
    expect(muster.test('/karten/sv1-1')).toBe(true);
    expect(muster.test('/')).toBe(true);
    expect(muster.test('/api/cron/preise')).toBe(false);
    expect(muster.test('/api/feedback')).toBe(false);
  });
});
