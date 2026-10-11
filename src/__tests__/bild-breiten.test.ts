import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BILD_BREITEN, bildBreite } from '@/lib/bild-loader';

describe('Bildbreiten (Befund 11.10.2026: App-Vollbild mit w=1024 → 400, kein Bild)', () => {
  it('unbekannte Breiten werden auf die nächste Stufe umgeleitet statt abgelehnt', () => {
    const route = readFileSync('src/app/api/img/route.ts', 'utf8');
    expect(route).toContain('NextResponse.redirect(ziel, 308)');
    expect(route).toContain('bildBreite(breite)');
    expect(bildBreite(1024)).toBe(1080);
    expect(bildBreite(500)).toBe(640);
  });

  it('die App fragt nur erlaubte Stufen an', () => {
    const ordner = 'ios/CardBeacon/Views';
    for (const datei of readdirSync(ordner)) {
      const text = readFileSync(join(ordner, datei), 'utf8');
      for (const m of text.matchAll(/KartenBild\(quelle: [^,]+, breite: (\d+)\)/g)) {
        expect(BILD_BREITEN as readonly number[], `${datei}: breite ${m[1]}`).toContain(Number(m[1]));
      }
    }
  });
});
