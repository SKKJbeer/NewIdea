import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import bildLoader, { bildBreite, BILD_BREITEN } from '@/lib/bild-loader';
import { pokemontcgBild } from '@/lib/bild-ersatz';

// BILDER MÜSSEN IMMER DA SEIN (Nutzer-Auftrag 04.10.2026).
// Befund: Vercel verweigerte /_next/image mit 402 (Kontingent verbraucht) —
// Kartenbilder fehlten. Seit v6.20.0: eigener Loader → /api/img (sharp, CDN-
// Jahresreserve, TCGdex als zweite Quelle) → Ersatzkette im Browser.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const ohneKommentare = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('Bild-Loader', () => {
  it('schickt Kartenbilder über den eigenen Proxy mit fester Breitenstufe', () => {
    expect(bildLoader({ src: 'https://images.pokemontcg.io/sv3pt5/199.png', width: 300 }))
      .toBe(`/api/img?u=${encodeURIComponent('https://images.pokemontcg.io/sv3pt5/199.png')}&w=384`);
  });
  it('rundet auf die nächste Stufe und deckelt oben', () => {
    expect(bildBreite(1)).toBe(32);
    expect(bildBreite(64)).toBe(64);
    expect(bildBreite(5000)).toBe(BILD_BREITEN[BILD_BREITEN.length - 1]);
  });
  it('lässt eigene und fremde Adressen unverändert', () => {
    expect(bildLoader({ src: '/logo.png', width: 64 })).toBe('/logo.png');
    expect(bildLoader({ src: 'https://evil.example/x.png', width: 64 })).toBe('https://evil.example/x.png');
  });
  it('next.config nutzt den eigenen Loader statt der Vercel-Optimierung', () => {
    const cfg = lies('next.config.ts');
    expect(cfg).toMatch(/loader: 'custom'/);
    expect(cfg).toMatch(/loaderFile: '\.\/src\/lib\/bild-loader\.ts'/);
  });
});

describe('Zweite Bildquelle', () => {
  it('zerlegt pokemontcg-Adressen', () => {
    expect(pokemontcgBild(new URL('https://images.pokemontcg.io/sv3pt5/199_hires.png'))).toEqual({ set: 'sv3pt5', nummer: '199', gross: true });
    expect(pokemontcgBild(new URL('https://images.pokemontcg.io/swsh12pt5gg/GG01.png'))).toEqual({ set: 'swsh12pt5gg', nummer: 'GG01', gross: false });
    expect(pokemontcgBild(new URL('https://assets.tcgdex.net/en/sv/sv01/1/low.webp'))).toBeNull();
    expect(pokemontcgBild(new URL('https://images.pokemontcg.io/../etc/passwd'))).toBeNull();
  });
  it('der Proxy versucht TCGdex, wenn die erste Quelle scheitert', () => {
    const route = ohneKommentare(lies('src/app/api/img/route.ts'));
    expect(route).toMatch(/tcgdexErsatz\(target\)/);
  });
});

describe('Proxy-Schranken', () => {
  const route = ohneKommentare(lies('src/app/api/img/route.ts'));
  it('nur feste Breiten, Größengrenze beim Lesen, Pixelgrenze, Jahresreserve', () => {
    expect(route).toMatch(/BILD_BREITEN[\s\S]{0,80}includes\(breite\)/);
    expect(route).toMatch(/leseBegrenzt\(upstream\.body, MAX_BYTES\)/);
    expect(route).toMatch(/limitInputPixels/);
    expect(route).toMatch(/stale-if-error=31536000/);
    expect(route).toMatch(/redirect: 'manual'/);
  });
});

describe('Ersatzkette im Browser', () => {
  it('ErsatzBild fällt auf die rohe Quelle und dann auf einen Platzhalter zurück', () => {
    const c = ohneKommentare(lies('src/components/ErsatzBild.tsx'));
    expect(c).toMatch(/onError/);
    expect(c).toMatch(/unoptimized=\{stufe === 1\}/);
    expect(c).toMatch(/ImageOff/);
  });
  it('nur ErsatzBild, Set-Logos (eigene Kette) und der dekorative Hintergrund nutzen next/image direkt', () => {
    const erlaubt = new Set([
      'src/components/ErsatzBild.tsx',
      'src/components/BoosterPackImage.tsx',
      'src/app/karten/[id]/page.tsx',
    ]);
    const treffer: string[] = [];
    const lauf = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) { if (n !== '__tests__') lauf(p); continue; }
        if (!/\.tsx?$/.test(n)) continue;
        const rel = p.slice(process.cwd().length + 1);
        if (/from ['"]next\/image['"]/.test(readFileSync(p, 'utf8')) && !erlaubt.has(rel)) treffer.push(rel);
      }
    };
    lauf(join(process.cwd(), 'src'));
    expect(treffer).toEqual([]);
  });
});
