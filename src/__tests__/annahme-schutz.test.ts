import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { herkunftErlaubt, leseJsonBegrenzt, instanzTagesgrenze, textSaeubern, anzahlLinks } from '@/lib/annahme-schutz';

// Security-Review 04.10.2026: offene Schreibwege ohne Größengrenze, ohne
// Herkunfts-Check, mit Mengenbremse nur je Instanz.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const anfrage = (headers: Record<string, string>, body?: string) =>
  new Request('https://cardbeacon.de/api/x', { method: 'POST', headers, body });

describe('herkunftErlaubt', () => {
  it('eigene Seite ja, fremde nein', () => {
    expect(herkunftErlaubt(anfrage({ origin: 'https://cardbeacon.de' }))).toBe(true);
    expect(herkunftErlaubt(anfrage({ origin: 'https://www.cardbeacon.de' }))).toBe(true);
    expect(herkunftErlaubt(anfrage({ origin: 'https://new-idea-git-x-skkjbeer.vercel.app' }))).toBe(true);
    expect(herkunftErlaubt(anfrage({ origin: 'https://evil.example' }))).toBe(false);
    expect(herkunftErlaubt(anfrage({ origin: 'https://cardbeacon.de.evil.example' }))).toBe(false);
    expect(herkunftErlaubt(anfrage({ origin: 'null' }))).toBe(false);
  });
  it('ohne Origin entscheidet Sec-Fetch-Site; ganz ohne = kein Browser', () => {
    expect(herkunftErlaubt(anfrage({ 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(herkunftErlaubt(anfrage({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
    expect(herkunftErlaubt(anfrage({}))).toBe(true);
  });
});

describe('leseJsonBegrenzt', () => {
  it('nimmt kleines JSON an', async () => {
    expect(await leseJsonBegrenzt(anfrage({ 'content-type': 'application/json' }, '{"a":1}'), 100)).toEqual({ ok: true, daten: { a: 1 } });
  });
  it('weist falschen Inhaltstyp, Übergröße und kaputtes JSON ab', async () => {
    expect(await leseJsonBegrenzt(anfrage({ 'content-type': 'text/plain' }, '{}'), 100)).toMatchObject({ ok: false, status: 415 });
    expect(await leseJsonBegrenzt(anfrage({ 'content-type': 'application/json' }, JSON.stringify({ t: 'x'.repeat(500) })), 100)).toMatchObject({ ok: false, status: 413 });
    expect(await leseJsonBegrenzt(anfrage({ 'content-type': 'application/json', 'content-length': '999999' }, '{}'), 100)).toMatchObject({ ok: false, status: 413 });
    expect(await leseJsonBegrenzt(anfrage({ 'content-type': 'application/json' }, '{kaputt'), 100)).toMatchObject({ ok: false, status: 400 });
  });
});

describe('Grenzen und Säubern', () => {
  it('instanzTagesgrenze zählt je Tag neu', () => {
    const g = instanzTagesgrenze(2);
    const t1 = new Date('2026-10-04T10:00:00Z');
    expect([g(t1), g(t1), g(t1)]).toEqual([true, true, false]);
    expect(g(new Date('2026-10-05T00:00:01Z'))).toBe(true);
  });
  it('textSaeubern entfernt Steuer- und Richtungszeichen, hält Zeilen', () => {
    expect(textSaeubern(' a\u0000b‮c​d\r\n\n\n\ne ')).toBe('abcd\n\ne');
  });
  it('anzahlLinks', () => {
    expect(anzahlLinks('siehe https://a.de und www.b.com')).toBe(2);
    expect(anzahlLinks('kein Link')).toBe(0);
  });
});

describe('Alle offenen Schreibwege nutzen den Schutz', () => {
  const routen = ['src/app/api/feedback/route.ts', 'src/app/api/zaehler/route.ts', 'src/app/api/newsletter/route.ts', 'src/app/api/portfolio/prices/route.ts'];
  for (const r of routen) {
    it(r, () => {
      const code = lies(r).replace(/^\s*\/\/.*$/gm, '');
      expect(code).toMatch(/herkunftErlaubt\(request\)/);
      expect(code).toMatch(/leseJsonBegrenzt\(request, /);
      expect(code).not.toMatch(/request\.json\(\)/);
    });
  }
  it('Feedback hat eine Tagesgrenze über alle Instanzen, der Zähler eine je Instanz', () => {
    expect(lies('src/app/api/feedback/route.ts')).toMatch(/tagesKontingentFrei\(feedbackOrdner\(tag\), FEEDBACK_TAGESGRENZE\)/);
    expect(lies('src/app/api/zaehler/route.ts')).toMatch(/instanzTagesgrenze\(/);
  });
  it('Newsletter behauptet ohne Versanddienst keine Speicherung', () => {
    expect(lies('src/app/api/newsletter/route.ts').replace(/^\s*\/\/.*$/gm, '')).not.toMatch(/Anmeldung gespeichert/);
  });
});
