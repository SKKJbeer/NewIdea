import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// GEMESSEN am 05.08.2026 an einem Aufruf der Startseite:
//
//   RSC-Vorabrufe            37   (jede Route vier- bis fuenfmal)
//   Anfragen nach dem Laden  49
//   Hover-Reaktion           65 ms
//
// Die Navigation steht auf JEDER Seite und immer im Sichtfeld. Next.js ruft
// deshalb beim Ankommen jede verlinkte Route vorab ab — auf Vercel ist das je
// Vorabruf ein echter Serveraufruf. Die Seite laedt also die halbe Site, bevor
// jemand irgendwo hingeklickt hat, und der Hauptthread ist genau dann belegt,
// wenn der Besucher die erste Kachel anfaehrt.
//
// Nach der Abschaltung: 0 Vorabrufe, 1 Anfrage nach dem Laden (ein
// nachgeladenes Kartenbild), Hover-Reaktion 9 bis 30 ms.

const WURZEL = process.cwd();
const lies = (d: string) => readFileSync(join(WURZEL, d), 'utf8');

/**
 * Dauerhaft sichtbare Navigation. Diese Dateien duerfen keinen Link ohne
 * `prefetch={false}` enthalten.
 *
 * NICHT dabei: Inhaltslisten (Suchtreffer, Set-Uebersicht, Artikel). Dort ist
 * ein Vorabruf sinnvoll — der Besucher hat die Liste absichtlich geoeffnet und
 * klickt mit hoher Wahrscheinlichkeit hinein.
 */
const CHROME = [
  'src/components/AppSidebar.tsx',
  'src/components/AppShell.tsx',
  'src/components/SiteFooter.tsx',
  'src/components/NavBar.tsx',
  'src/components/HomePanels.tsx',
  'src/app/page.tsx',
];

describe('Dauernavigation ruft keine Seiten vorab ab', () => {
  it.each(CHROME)('%s setzt prefetch={false} an jedem Link', (datei) => {
    const src = lies(datei);
    const links = (src.match(/<Link[\s>]/g) ?? []).length;
    const ohne = links - (src.match(/prefetch=\{false\}/g) ?? []).length;
    expect(ohne, `${ohne} von ${links} Links ohne prefetch={false}`).toBe(0);
  });

  it('deckt alle Bausteine ab, die auf jeder Seite stehen', () => {
    // Waechst die Huelle um einen weiteren Navigationsbaustein, muss er hier
    // eingetragen werden — sonst prueft die Liste an ihm vorbei.
    const huelle = lies('src/components/AppShell.tsx');
    for (const teil of ['AppSidebar', 'NavBar', 'SiteFooter']) {
      expect(huelle).toContain(teil);
      expect(CHROME.some((d) => d.includes(teil))).toBe(true);
    }
  });
});

describe('Der Tages-Cron stoesst die Erfassung zuverlaessig an', () => {
  // BEFUND am 05.08.2026: `price_sweep_state` stand seit dem 02.08. still
  // (4.369 Minuten Stillstand), waehrend DERSELBE Cron am 04.08. um 08:19 UTC
  // einen Guide erzeugt hat. Der Cron lief also — nur der Anstoss kam nie an.
  //
  // Zwei Ursachen, beide hier festgehalten:
  //   1. Dem Cron fehlte jede Laufzeitgrenze, waehrend die Route, die er
  //      aufruft, laengst 300 Sekunden hatte.
  //   2. Der Anstoss stand HINTER zwei Netzabrufen ueber eine Quelle mit
  //      dokumentierten Aussetzern. Reisst die die Zeit auf, wird die Funktion
  //      beendet, bevor die Zeile erreicht ist.
  const cron = lies('src/app/api/cron/daily/route.ts');

  it('hat eine eigene Laufzeitgrenze', () => {
    expect(cron).toMatch(/export const maxDuration = \d+/);
  });

  it('gibt sich mindestens so viel Zeit wie die Route, die er aufruft', () => {
    const sweep = lies('src/app/api/cron/price-sweep/route.ts');
    const zahl = (s: string) => Number(/export const maxDuration = (\d+)/.exec(s)?.[1] ?? 0);
    expect(zahl(cron)).toBeGreaterThanOrEqual(zahl(sweep));
  });

  it('stoesst die Erfassung VOR den langsamen Netzabrufen an', () => {
    const anstoss = cron.indexOf('/api/cron/price-sweep');
    const schnappschuesse = cron.indexOf('fetchTopValueCards(');
    expect(anstoss).toBeGreaterThan(0);
    expect(anstoss).toBeLessThan(schnappschuesse);
  });

  it('meldet einen echten Abriss, statt ihn als Normalfall zu verbuchen', () => {
    expect(cron).toContain("err.name === 'TimeoutError'");
    expect(cron).toContain('results.priceSweepError');
  });
});
