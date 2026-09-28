import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';

// DARSTELLUNG AUF TELEFONEN — Wächter für Fehler, die man am Rechner nie sieht.
//
// Befund 28.09.2026 (iPhone 15): Nach einer Suche musste man herauszoomen, um
// die Ergebnisse vollständig zu sehen. Ursache: Das Suchfeld hatte 14 px
// Schrift, und iOS Safari zoomt bei Eingabefeldern unter 16 px beim Antippen
// hinein — und bleibt nach dem Absenden gezoomt.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('Kein Auto-Zoom auf iOS', () => {
  it('das Suchfeld hat auf dem Telefon 16 px', () => {
    const box = lies('src/components/SearchBox.tsx');
    const input = box.slice(box.indexOf('<input'), box.indexOf('/>', box.indexOf('<input')));
    expect(input).toMatch(/text-\[16px\] sm:text-sm/);
  });

  it('kein Eingabefeld setzt auf dem Telefon kleinere Schrift ohne 16-px-Grundwert', () => {
    // Jedes <input>/<textarea>/<select> mit text-xs/text-sm muss davor
    // `text-[16px]` (oder text-base) für kleine Bildschirme tragen.
    const verstoesse: string[] = [];
    for (const f of globSync('src/**/*.tsx')) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<(input|textarea|select)\b[^>]*?className="([^"]*)"/g)) {
        const cls = m[2];
        const klein = /(^|\s)(text-xs|text-sm|text-\[1[0-5]px\])(\s|$)/.test(cls);
        const basis = /(^|\s)(text-\[16px\]|text-base)(\s|$)/.test(cls);
        if (klein && !basis) verstoesse.push(`${f}: ${cls.slice(0, 80)}`);
      }
    }
    expect(verstoesse).toEqual([]);
  });

  it('Sicherheitsnetz im CSS: Eingabefelder unter 640 px mindestens 16 px', () => {
    const css = lies('src/app/globals.css');
    expect(css).toMatch(/@media \(max-width: 639px\)[\s\S]*?font-size: max\(16px, 1em\)/);
  });

  it('Zoomen bleibt erlaubt (Bedienhilfe) — kein maximumScale / userScalable', () => {
    const layout = lies('src/app/layout.tsx').replace(/^\s*\/\/.*$/gm, '');
    expect(layout).toMatch(/export const viewport: Viewport/);
    expect(layout).not.toMatch(/maximumScale|userScalable/);
  });
});

describe('Kein weißer Grund', () => {
  it('html/body sind dunkel — keine Regel mit hellem Hintergrund', () => {
    const css = lies('src/app/globals.css');
    expect(css).not.toMatch(/#fff(fff)?\b/i);
    expect(css).toMatch(/html,\s*body \{\s*background: #070810;/);
  });
  it('die Browserleiste ist dunkel eingefärbt', () => {
    expect(lies('src/app/layout.tsx')).toMatch(/themeColor: '#070810'/);
  });
});
