import { describe, it, expect } from 'vitest';
import { suchForm, suchMuster, namensRang } from '@/lib/such-relevanz';

describe('Suche: Trenner sind egal (Befund 27.09.2026)', () => {
  it('„mimikyu gx" findet „Mimikyu-GX"', () => {
    expect(suchMuster('mimikyu gx')).toBe('%mimikyu%gx%');
    expect(namensRang('Mimikyu-GX', 'mimikyu gx')).toBe(0);
    expect(namensRang('Glurak-ex', 'glurak ex')).toBe(0);
  });
  it('Apostrophe fallen weg', () => {
    expect(suchForm("Team Rocket's Mewtwo ex")).toBe('team rockets mewtwo ex');
  });
  it('Platzhalter und Filterzeichen gelangen nie in das Muster', () => {
    const m = suchMuster('a%b_c,d(e)f"g*h:i\\j');
    expect(m).not.toMatch(/[_,()"*:\\]/);
    expect(m!.replace(/^%|%$/g, '').split('%').every(Boolean)).toBe(true);
  });
  it('zu kurze oder leere Eingaben ergeben kein Muster', () => {
    expect(suchMuster('%')).toBeNull();
    expect(suchMuster(' - ')).toBeNull();
    expect(suchMuster('a')).toBeNull();
  });
});

describe('Portfolio-Suche liest die Vorschlags-Antwort richtig (Befund 28.09.2026)', () => {
  it('versteht { cards, sets } und die alte reine Liste', async () => {
    const { kartenAusVorschlaegen } = await import('@/lib/such-relevanz');
    expect(kartenAusVorschlaegen({ cards: [{ id: 'a' }], sets: [] })).toEqual([{ id: 'a' }]);
    expect(kartenAusVorschlaegen([{ id: 'b' }])).toEqual([{ id: 'b' }]);
    expect(kartenAusVorschlaegen(null)).toEqual([]);
    expect(kartenAusVorschlaegen({ error: 'rate_limited' })).toEqual([]);
  });
  it('das Portfolio nutzt sie und zeigt einen Fehler statt „Keine Ergebnisse"', async () => {
    const { readFileSync } = await import('fs');
    const src = readFileSync('src/app/portfolio/page.tsx', 'utf8');
    expect(src).toContain('kartenAusVorschlaegen<Suggestion>(data)');
    expect(src).not.toMatch(/Array\.isArray\(data\) \? data : \[\]/);
    expect(src).toMatch(/if \(!r\.ok\) throw/);
    expect(src).toContain('setSuchFehler(true)');
  });
});
