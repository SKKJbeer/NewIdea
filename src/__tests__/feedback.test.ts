import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pruefeFeedback, FEEDBACK_MAX_ZEICHEN, FEEDBACK_AUFBEWAHRUNG_TAGE } from '@/lib/feedback';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const jetzt = new Date('2026-10-03T08:00:00Z');

describe('Feedback: Prüfung der Meldung', () => {
  it('nimmt eine gültige Meldung an und speichert nur die erlaubten Felder', () => {
    const r = pruefeFeedback({ art: 'idee', text: '  Preisalarm wäre toll  ', mail: 'A@b.de', pfad: '/karten/sv1-1?x=1', ip: '1.2.3.4', ua: 'x', dauerMs: 5000 }, jetzt);
    expect(r).toEqual({ ok: true, eintrag: { zeit: '2026-10-03T08:00:00.000Z', art: 'idee', text: 'Preisalarm wäre toll', mail: 'a@b.de', pfad: '/karten/sv1-1' } });
  });

  it('ohne Mail und mit unbekannter Art', () => {
    const r = pruefeFeedback({ art: 'hack', text: 'gut so', dauerMs: 5000 }, jetzt);
    expect(r.ok && r.eintrag.art).toBe('sonstiges');
    expect(r.ok && r.eintrag.mail).toBeNull();
  });

  it('weist zu kurz, zu lang, ungültige Mail und fremde Körper ab', () => {
    expect(pruefeFeedback({ text: 'a', dauerMs: 5000 })).toEqual({ ok: false, fehler: 'zu-kurz' });
    expect(pruefeFeedback({ text: 'x'.repeat(FEEDBACK_MAX_ZEICHEN + 1), dauerMs: 5000 })).toEqual({ ok: false, fehler: 'zu-lang' });
    expect(pruefeFeedback({ text: 'hallo', mail: 'kein-mail', dauerMs: 5000 })).toEqual({ ok: false, fehler: 'mail-ungueltig' });
    expect(pruefeFeedback(null)).toEqual({ ok: false, fehler: 'ungueltig' });
    expect(pruefeFeedback('text')).toEqual({ ok: false, fehler: 'ungueltig' });
  });

  it('Honigtopf gefüllt oder zu schnell / ohne Zeitangabe → Roboter', () => {
    expect(pruefeFeedback({ text: 'kauf viagra', website: 'spam.example', dauerMs: 5000 })).toEqual({ ok: false, fehler: 'bot' });
    expect(pruefeFeedback({ text: 'schnell getippt', dauerMs: 300 })).toEqual({ ok: false, fehler: 'bot' });
    expect(pruefeFeedback({ text: 'ohne zeit' })).toEqual({ ok: false, fehler: 'bot' });
  });

  it('mehr als drei Links = Werbung; unsichtbare Zeichen werden entfernt', () => {
    const links = 'a https://x.de b https://y.de c https://z.de d www.w.de';
    expect(pruefeFeedback({ text: links, dauerMs: 5000 })).toEqual({ ok: false, fehler: 'zu-viele-links' });
    const r = pruefeFeedback({ text: 'Ha\u202Ello\u200B\u0007 Welt', dauerMs: 5000 }, jetzt);
    expect(r.ok && r.eintrag.text).toBe('Hallo Welt');
  });

  it('fremde Pfade (extern, Leerzeichen) werden verworfen', () => {
    const r = pruefeFeedback({ text: 'hallo', pfad: 'https://evil.example/', dauerMs: 5000 }, jetzt);
    expect(r.ok && r.eintrag.pfad).toBeNull();
  });
});

describe('Feedback: Verankerung', () => {
  it('Knopf ist im Grundgerüst eingebunden und nutzt 16-px-Felder', () => {
    expect(lies('src/app/layout.tsx')).toMatch(/<FeedbackKnopf \/>/);
    const knopf = lies('src/components/FeedbackKnopf.tsx');
    expect(knopf.match(/text-\[16px\]/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('Route speichert keine IP/Browserkennung, Lesen nur fürs Studio, Mengenbremse vorhanden', () => {
    const route = lies('src/app/api/feedback/route.ts');
    expect(route).toMatch(/isStudioAuthedFromRequest/);
    expect(route).toMatch(/createRateLimiter/);
    const lib = lies('src/lib/feedback.ts').replace(/^\s*\/\/.*$/gm, '');
    expect(lib).not.toMatch(/user-agent|clientIp|x-forwarded-for/i);
  });

  it('Datenschutzerklärung nennt Formular, Felder und Frist; der Tageslauf räumt auf', () => {
    const ds = lies('src/app/datenschutz/page.tsx');
    expect(ds).toMatch(/Feedback-Formular/);
    expect(ds).toMatch(/12 Monaten/);
    expect(FEEDBACK_AUFBEWAHRUNG_TAGE).toBe(365);
    expect(lies('src/app/api/cron/daily/route.ts')).toMatch(/feedbackAufraeumen\(today\)/);
  });
});
