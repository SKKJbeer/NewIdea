import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WURZEL = process.cwd();
const lies = (d: string) => readFileSync(join(WURZEL, d), 'utf8');
function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// Supabase-Nachbau: 12.345 Karten, liefert je Anfrage hoechstens 1.000 Zeilen
// — wie PostgREST mit `max-rows`, egal was `range` verlangt.
const GESAMT = 12_345;
const bereiche: Array<[number, number]> = [];
/** Wenn gesetzt: jede `range`-Abfrage scheitert (Datenbank-Aussetzer). */
const stoerung = { aktiv: false };
vi.mock('@/lib/supabase', () => {
  const kette = {
    _von: 0, _bis: 0,
    select() { return this; },
    order() { return this; },
    limit() { return Promise.resolve({ count: GESAMT, error: null, data: [{ id: 'x' }] }); },
    range(von: number, bis: number) {
      bereiche.push([von, bis]);
      if (stoerung.aktiv) return Promise.resolve({ data: null, error: { message: 'statement timeout' } });
      const ende = Math.min(bis, von + 999, GESAMT - 1);
      const data = [];
      for (let i = von; i <= ende; i++) data.push({ id: `k-${i}`, updated_at: '2026-09-27T08:00:00Z' });
      return Promise.resolve({ data, error: null });
    },
  };
  return { getSupabase: () => ({ from: () => kette }) };
});

import { kartenAnzahl, kartenTeil, teileFuer, KARTEN_JE_TEIL } from '@/lib/sitemap-karten';
import { INDEXNOW_SCHLUESSEL } from '@/lib/indexnow';

describe('Alle Kartenseiten stehen in der Sitemap', () => {
  beforeEach(() => { bereiche.length = 0; });

  it('teilt in Stuecke, die Google annimmt', () => {
    expect(KARTEN_JE_TEIL).toBeLessThanOrEqual(50_000);
    expect(teileFuer(GESAMT)).toBe(Math.ceil(GESAMT / KARTEN_JE_TEIL));
  });

  it('liefert auch ohne Daten eine Teil-Sitemap statt 404', () => {
    expect(teileFuer(null)).toBe(1);
    expect(teileFuer(0)).toBe(1);
  });

  // DIE FALLE: PostgREST kappt jede Anfrage bei 1.000 Zeilen. Ein einziges
  // `range(0, 4999)` haette still 1.000 statt 5.000 Karten geliefert.
  it('holt einen vollen Teil trotz 1.000-Zeilen-Grenze vollstaendig', async () => {
    const teil = await kartenTeil(0);
    expect(teil).toHaveLength(KARTEN_JE_TEIL);
    expect(new Set(teil.map((k) => k.id)).size).toBe(KARTEN_JE_TEIL);
    expect(bereiche.every(([von, bis]) => bis - von + 1 <= 1000)).toBe(true);
  });

  it('der letzte Teil endet sauber am Tabellenende', async () => {
    const letzter = teileFuer(GESAMT) - 1;
    const teil = await kartenTeil(letzter);
    expect(teil).toHaveLength(GESAMT - letzter * KARTEN_JE_TEIL);
  });

  it('zaehlt mit Antwortkoerper, nicht per HEAD (Stolperstelle 45)', async () => {
    expect(await kartenAnzahl()).toBe(GESAMT);
    expect(ohneKommentare(lies('src/lib/sitemap-karten.ts'))).not.toMatch(/head:\s*true/);
  });

  it('sortiert stabil, damit keine Karte zwischen zwei Teilen verrutscht', () => {
    const src = lies('src/lib/sitemap-karten.ts');
    expect(src).toMatch(/\.order\('price'[\s\S]*?\.order\('id'/);
  });

  it('robots.txt meldet die Teil-Sitemaps', () => {
    const robots = lies('src/app/robots.ts');
    expect(robots).toMatch(/\/karten\/sitemap\/\$\{i\}\.xml/);
  });

  it('nutzt die Next-16-Signatur (id als Promise)', () => {
    const sm = lies('src/app/karten/sitemap.ts');
    expect(sm).toMatch(/id: Promise<string>/);
    expect(sm).toMatch(/await id/);
  });

  it('meldet alle Sets, nicht nur die 24 neuesten', () => {
    expect(lies('src/app/sitemap.ts')).toMatch(/fetchRecentSets\(250\)/);
  });
});

describe('robots.txt sperrt die internen Seiten wirklich', () => {
  // `Disallow: /studio/` sperrt nur Unterseiten — die Studio-Seite selbst blieb
  // erlaubt, das Monitoring war gar nicht gesperrt.
  it('sperrt /studio und /monitoring ohne Schraegstrich am Ende', () => {
    const robots = lies('src/app/robots.ts');
    expect(robots).toMatch(/'\/studio'/);
    expect(robots).toMatch(/'\/monitoring'/);
  });
});

describe('Kartenseiten fragen die Kartendatenbank einmal, nicht zweimal', () => {
  it('Metadaten und Seite teilen sich einen Abruf', () => {
    const seite = ohneKommentare(lies('src/app/karten/[id]/page.tsx'));
    expect(seite).toMatch(/const karteLaden = cache\(fetchCardById\)/);
    expect(seite).not.toMatch(/await fetchCardById\(/);
  });
});

describe('IndexNow', () => {
  it('die Schluesseldatei liegt unter dem Schluessel und enthaelt genau ihn', () => {
    const datei = join(WURZEL, 'public', `${INDEXNOW_SCHLUESSEL}.txt`);
    expect(existsSync(datei)).toBe(true);
    expect(readFileSync(datei, 'utf8')).toBe(INDEXNOW_SCHLUESSEL);
    // Protokoll: 8 bis 128 Zeichen, Buchstaben, Ziffern und Bindestrich.
    expect(INDEXNOW_SCHLUESSEL).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
  });

  it('der Tages-Cron meldet in einem eigenen try/catch', () => {
    const cron = lies('src/app/api/cron/daily/route.ts');
    const block = cron.slice(cron.indexOf('INDEXNOW'));
    expect(block).toMatch(/try \{[\s\S]*meldeAnIndexNow[\s\S]*\} catch/);
  });

  // Der Erfolgsstatus des Guide-Generators heisst 'created'. Mit dem ersten
  // Entwurf ('generated') waere nie ein neuer Guide gemeldet worden.
  it('meldet einen neuen Guide mit dem Status, den der Generator wirklich liefert', () => {
    const cron = lies('src/app/api/cron/daily/route.ts');
    const gen = lies('src/lib/guide-generator.ts');
    const status = cron.match(/results\.guide === '([a-z_]+)'/)?.[1];
    expect(status).toBeDefined();
    expect(gen).toContain(`status: '${status}'`);
  });

  it('die Vollmeldung ist nur aus dem Studio erreichbar', () => {
    expect(lies('src/app/api/studio/indexnow/route.ts')).toMatch(/isStudioAuthedFromRequest/);
  });
});

describe('Ein Aussetzer wird nicht als leere Sitemap gespeichert', () => {
  // BEFUND auf Produktion: Teil 1 hatte 0 statt 5.000 Adressen, die
  // Hauptsitemap 0 Set-Seiten — beides beim Bauen erzeugt und bis zum naechsten
  // Deploy stehen geblieben.
  it('wirft nach drei Versuchen, statt eine leere Liste zu liefern', async () => {
    stoerung.aktiv = true;
    bereiche.length = 0;
    try {
      await expect(kartenTeil(1)).rejects.toThrow(/nicht lesbar/);
      expect(bereiche.length).toBe(3);
    } finally {
      stoerung.aktiv = false;
    }
  }, 10_000);

  it('Sitemaps und robots.txt entstehen bei Abruf, nicht beim Bauen', () => {
    for (const d of ['src/app/sitemap.ts', 'src/app/karten/sitemap.ts', 'src/app/robots.ts']) {
      const src = ohneKommentare(lies(d));
      expect(src, d).toMatch(/export const dynamic = 'force-dynamic'/);
      expect(src, d).not.toMatch(/export const revalidate/);
    }
  });
});
