import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sollSichern } from '@/lib/set-liste';
import type { SetMeta } from '@/lib/pokemon-api';

// Befund 03.10.2026: Die 24er-Liste von /sets überschrieb die Sicherung, die
// Sitemap bekam bei einem Ausfall nur noch 24 statt ~176 Sets.

const liste = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `s${i}` }) as unknown as SetMeta);
const jetzt = Date.parse('2026-10-03T12:00:00Z');

describe('sollSichern', () => {
  it('kürzere Liste ersetzt keine längere', () => {
    expect(sollSichern(liste(24), { gesichert: '2026-10-02T12:00:00Z', sets: liste(176) }, jetzt)).toBe(false);
  });
  it('gleich lange oder längere Liste ersetzt', () => {
    expect(sollSichern(liste(176), { gesichert: '2026-10-02T12:00:00Z', sets: liste(24) }, jetzt)).toBe(true);
    expect(sollSichern(liste(176), { gesichert: '2026-10-02T12:00:00Z', sets: liste(176) }, jetzt)).toBe(true);
  });
  it('ohne Sicherung wird gesichert, leere Liste nie', () => {
    expect(sollSichern(liste(24), null, jetzt)).toBe(true);
    expect(sollSichern([], null, jetzt)).toBe(false);
  });
  it('eine über eine Woche alte Sicherung darf auch eine kürzere Liste ersetzen', () => {
    expect(sollSichern(liste(24), { gesichert: '2026-09-20T12:00:00Z', sets: liste(176) }, jetzt)).toBe(true);
  });
  it('IndexNow-Vollmeldung nutzt die abgesicherte Liste', () => {
    const route = readFileSync(join(process.cwd(), 'src/app/api/studio/indexnow/route.ts'), 'utf8');
    expect(route).toMatch(/ladeSetListe\(250\)/);
    expect(route).not.toMatch(/fetchRecentSets/);
  });
});
