import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  planFuer,
  reelRotation,
  berlinerWochentag,
  karussellCaption,
  captionVerstoesse,
  kampagnenLink,
  WOCHENPLAN,
  KARUSSELL_VORLAGEN,
} from '@/lib/social-plan';
import { heuteSchonGepostet, berlinerDatum } from '@/lib/instagram';
import { CONCEPTS, buildStory } from '@/lib/reel-concepts';
import { stilleWav } from '@/lib/reel-generator';
import { ffmpegKandidaten } from '@/lib/ffmpeg-setup';
import { isCronAuthedFromRequest } from '@/lib/studio-auth';
import type { Marktlage } from '@/lib/marktbilder';

const WURZEL = process.cwd();
const lies = (d: string) => readFileSync(join(WURZEL, d), 'utf8');
function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// Ein Montag im Sommer (Berlin = UTC+2), 18:40 Ortszeit.
const MONTAG = new Date('2026-09-28T16:40:00Z');
const tag = (versatz: number) => new Date(MONTAG.getTime() + versatz * 86_400_000);

describe('Der Wochenplan', () => {
  it('hat fuer jeden Wochentag genau eine Beitragsart', () => {
    for (let t = 0; t < 7; t++) expect(['reel', 'karussell']).toContain(WOCHENPLAN[t]);
  });

  it('liest den Wochentag in Berliner Zeit, nicht in UTC', () => {
    // Sonntag 23:30 UTC ist in Berlin schon Montag 01:30.
    expect(berlinerWochentag(new Date('2026-09-27T23:30:00Z'))).toBe(1);
    expect(berlinerDatum(new Date('2026-09-27T23:30:00Z'))).toBe('2026-09-28');
  });

  // DER GRUND FUER EINEN EIGENEN ZAEHLER: Mit der Wochennummer kaeme an allen
  // Reel-Tagen einer Woche dasselbe Format, mit dem Tag des Jahres bei vier
  // Reels im Abstand von zwei Tagen nur zwei der vier Formate.
  it('laesst an den Reel-Tagen einer Woche jedes Format einmal laufen', () => {
    const reelTage = [0, 1, 2, 3, 4, 5, 6].map(tag).filter((d) => planFuer(d).art === 'reel');
    const formate = new Set(reelTage.map((d) => ((reelRotation(d) % CONCEPTS.length) + CONCEPTS.length) % CONCEPTS.length));
    expect(formate.size).toBe(Math.min(reelTage.length, CONCEPTS.length));
  });

  it('beginnt die naechste Woche nicht wieder beim selben Format', () => {
    expect(reelRotation(tag(7))).not.toBe(reelRotation(MONTAG));
  });

  it('buildStory nimmt die Rotation an, statt stumm auf die Woche zurueckzufallen', () => {
    const karten = Array.from({ length: 12 }, (_, i) => ({
      id: `x-${i}`, name: `K${i}`, set: 'S', setCode: 's', imageUrl: 'https://x/y.png',
      prices: { market: 5 + i }, trendPercent: i % 2 ? 4 + i : -3 - i,
      cmPrices: { trend: 5 + i, avg30: 4 + i }, realData: true,
    })) as never;
    const a = buildStory(karten, 'https://t', { rotation: 0 });
    const b = buildStory(karten, 'https://t', { rotation: 1 });
    expect(a?.conceptId).not.toBe(b?.conceptId);
  });

  it('das Karussell beginnt mit dem Ueberblick', () => {
    expect(KARUSSELL_VORLAGEN[0]).toBe('market-state');
    expect(KARUSSELL_VORLAGEN.length).toBeGreaterThanOrEqual(2);
    expect(KARUSSELL_VORLAGEN.length).toBeLessThanOrEqual(10);
  });
});

describe('Nie zweimal am selben Tag', () => {
  it('erkennt einen Beitrag vom heutigen Berliner Tag', () => {
    expect(heuteSchonGepostet([{ id: '1', timestamp: '2026-09-28T07:00:00+0000' }], '2026-09-28')).toBe(true);
    expect(heuteSchonGepostet([{ id: '1', timestamp: '2026-09-27T12:00:00+0000' }], '2026-09-28')).toBe(false);
  });

  it('ordnet einen Beitrag kurz nach Mitternacht Berliner Zeit dem neuen Tag zu', () => {
    // 22:30 UTC am 27. = 00:30 Berlin am 28.
    expect(heuteSchonGepostet([{ id: '1', timestamp: '2026-09-27T22:30:00+0000' }], '2026-09-28')).toBe(true);
  });

  it('wertet einen unlesbaren Zeitstempel als „vielleicht heute" — lieber auslassen als doppeln', () => {
    expect(heuteSchonGepostet([{ id: '1', timestamp: 'kaputt' }], '2026-09-28')).toBe(true);
  });
});

describe('Bildunterschriften', () => {
  const lage: Marktlage = {
    cbi: { value: 3.5, cardCount: 14985, setCount: 155 },
    mover: { name: 'Meloetta ex', set: 'Black Bolt', trend: 55.7, preis: 50.02, gegenMarkt: 52.2 },
    setsSortiert: [
      { name: 'Black Bolt', avgTrend: 6.7 },
      { name: 'Mitte', avgTrend: 1 },
      { name: '151', avgTrend: -6.5 },
    ],
    breitePct: 32,
    temperatur: 'Abkühlend',
    datenstand: '28.09.2026',
  };
  const text = karussellCaption(lage, 'https://beispiel.test');

  it('nennt den gemessenen Zeitraum, nicht eine erfundene Woche', () => {
    expect(text).toMatch(/30-Tage-Schnitt/);
    expect(text).not.toMatch(/diese[rn]? Woche/i);
  });

  it('formatiert Zahlen deutsch', () => {
    expect(text).toContain('14.985');
    expect(text).toMatch(/\+3,5\s%/);
  });

  it('besteht die eigene Inhaltsschranke', () => {
    expect(captionVerstoesse(text)).toEqual([]);
  });

  it('die Schranke greift bei einer Kaufempfehlung', () => {
    expect(captionVerstoesse(`${text}\nJetzt kaufen!`)).toContain('Kaufempfehlung');
    expect(captionVerstoesse('Ich finde das spannend')).toContain('Ich-Form');
    expect(captionVerstoesse('x'.repeat(2300))).toContain('laenger als 2.200 Zeichen');
  });

  it('jedes Reel-Format besteht die Schranke', () => {
    const karten = Array.from({ length: 30 }, (_, i) => ({
      id: `sv3pt5-${i}`, name: `Karte ${i}`, set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: 'https://x/y.png',
      prices: { market: 5 + i }, trendPercent: i % 2 ? 4 + i : -3 - i,
      cmPrices: { trend: 5 + i, avg30: 4 + i }, realData: true,
    })) as never;
    for (const c of CONCEPTS) {
      const story = buildStory(karten, 'https://t', { conceptId: c.id });
      if (!story) continue;
      expect(captionVerstoesse(story.caption), c.id).toEqual([]);
      // Stolperstelle 23: keine Zeitangabe ohne Messung.
      expect(story.caption, c.id).not.toMatch(/diese[rn]? Woche/i);
    }
  });

  it('der Link traegt die Kampagne fuer die Reichweitenmessung', () => {
    expect(kampagnenLink('https://s.test', 'post', 'marktlage')).toBe(
      'https://s.test?utm_source=instagram&utm_medium=post&utm_campaign=marktlage',
    );
  });
});

describe('Die Reel-Texte behaupten keinen Zeitraum, der nicht gemessen wird', () => {
  // trendPercent ist aktueller Preis gegen den 30-Tage-Schnitt
  // (pokemon-api.ts). Stand vorher „Diese Woche im Pokémon-Kartenmarkt".
  it('kein „diese Woche" in Konzepten und Bildern', () => {
    for (const d of ['src/lib/reel-concepts.ts', 'src/lib/reel-frames.tsx']) {
      expect(ohneKommentare(lies(d)), d).not.toMatch(/diese[rn]? Woche|DER WOCHE|Wochenwerte/i);
    }
  });
});

describe('Reels ueberstehen den Weg zu Instagram', () => {
  it('die stumme Tonspur ist ein gueltiger WAV-Kopf', () => {
    const w = stilleWav(2);
    expect(w.toString('ascii', 0, 4)).toBe('RIFF');
    expect(w.toString('ascii', 8, 12)).toBe('WAVE');
    expect(w.readUInt32LE(24)).toBe(44100);
    expect(w.length).toBe(44 + 44100 * 2 * 2);
  });

  it('das Reel bekommt eine Tonspur (Instagram lehnt stumme Dateien teils ab)', () => {
    // Ohne Kommentare: Der Generator ERKLAERT, warum `-f lavfi` nicht geht —
    // die Erklaerung selbst darf den Test nicht brechen (siebter Fall dieser
    // Falle im Projekt).
    const gen = ohneKommentare(lies('src/lib/reel-generator.ts'));
    expect(gen).toMatch(/-c:a aac/);
    expect(gen).not.toMatch(/-f lavfi/);
  });
});

describe('FFmpeg wird dort gesucht, wo es auf Vercel liegt', () => {
  // BEFUND auf Produktion: spawn /ROOT/node_modules/ffmpeg-static/ffmpeg ENOENT.
  // Turbopack ersetzt __dirname durch den Platzhalter /ROOT.
  it('prueft zuerst das Arbeitsverzeichnis', () => {
    expect(ffmpegKandidaten()[0]).toBe(join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'));
  });

  it('nimmt nie den Platzhalterpfad', () => {
    expect(ffmpegKandidaten().some((p) => p.startsWith('/ROOT/'))).toBe(false);
  });

  it('jede Route, die Reels rendert, buendelt Binary und Schrift', () => {
    const cfg = lies('next.config.ts');
    for (const route of ['/api/video/auto-reel', '/api/cron/social']) {
      const zeile = cfg.split('\n').find((z) => z.includes(`'${route}'`));
      expect(zeile, route).toMatch(/ffmpeg-static/);
      expect(zeile, route).toMatch(/fonts/);
    }
  });
});

describe('Der Autopilot laeuft zeitgesteuert und ist geschuetzt', () => {
  it('steht im Cron-Plan', () => {
    const plan = JSON.parse(lies('vercel.json')) as { crons: Array<{ path: string; schedule: string }> };
    const eintrag = plan.crons.find((c) => c.path === '/api/cron/social');
    expect(eintrag).toBeDefined();
    // Taeglich — Vercel Hobby erlaubt nicht mehr als einmal am Tag.
    expect(eintrag!.schedule.split(' ').slice(2)).toEqual(['*', '*', '*']);
  });

  it('nimmt nur Cron oder Studio an', () => {
    const route = ohneKommentare(lies('src/app/api/cron/social/route.ts'));
    expect(route).toMatch(/isCronAuthedFromRequest\(request\)/);
    expect(route).toMatch(/isStudioAuthedFromRequest\(request\)/);
    expect(route).toMatch(/maxDuration = 300/);
  });

  it('Feed und Story scheitern getrennt voneinander', () => {
    const lib = lies('src/lib/instagram-autopilot.ts');
    expect(lib.match(/\} catch \(err\) \{/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(lib).toMatch(/ergebnis\.feed = \{ status: 'fehler'/);
    expect(lib).toMatch(/ergebnis\.story = \{ status: 'fehler'/);
  });

  it('prueft die Bildunterschrift, bevor veroeffentlicht wird', () => {
    const lib = lies('src/lib/instagram-autopilot.ts');
    const pruefung = lib.indexOf('captionVerstoesse(');
    const veroeffentlichung = lib.indexOf('vorbereitet.veroeffentlichen(');
    expect(veroeffentlichung).toBeGreaterThan(0);
    expect(pruefung).toBeGreaterThan(0);
    expect(pruefung).toBeLessThan(veroeffentlichung);
  });

  it('der Einrichtungshelfer speichert und loggt keine Schluessel', () => {
    const route = ohneKommentare(lies('src/app/api/studio/instagram/route.ts'));
    expect(route).toMatch(/isStudioAuthedFromRequest/);
    expect(route).not.toMatch(/console\.\w+\([^)]*(appSecret|kurzToken|access_token)/);
    expect(route).not.toMatch(/getSupabase|\.insert\(|\.upsert\(/);
  });
});

describe('Cron-Pruefung: zeitkonstant und fail-closed', () => {
  const alt = { ...process.env };
  afterEach(() => {
    process.env = { ...alt };
    vi.unstubAllEnvs();
  });

  const anfrage = (auth?: string) =>
    new Request('https://x.test/api/cron', auth ? { headers: { authorization: auth } } : undefined);

  it('laesst das richtige Secret durch und alles andere nicht', () => {
    vi.stubEnv('CRON_SECRET', 'geheim-123');
    expect(isCronAuthedFromRequest(anfrage('Bearer geheim-123'))).toBe(true);
    expect(isCronAuthedFromRequest(anfrage('Bearer geheim-12'))).toBe(false);
    expect(isCronAuthedFromRequest(anfrage())).toBe(false);
  });

  // VORHER: `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` — ohne
  // Variable wurde daraus „Bearer undefined", und genau das kam durch.
  it('laesst in Produktion ohne Secret NICHTS durch, auch nicht „Bearer undefined"', () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(isCronAuthedFromRequest(anfrage('Bearer undefined'))).toBe(false);
    expect(isCronAuthedFromRequest(anfrage())).toBe(false);
  });

  it('keine Route vergleicht das Secret mehr mit !==', () => {
    for (const d of [
      'src/app/api/cron/route.ts',
      'src/app/api/cron/daily/route.ts',
      'src/app/api/cron/price-sweep/route.ts',
      'src/app/api/publish/route.ts',
      'src/app/api/video/route.ts',
      'src/app/api/cron/social/route.ts',
    ]) {
      expect(lies(d), d).not.toMatch(/!==\s*`Bearer/);
    }
  });
});
