import { describe, it, expect } from 'vitest';
import { formatEur, formatAmount, formatPercent, formatCompactEur } from '@/lib/format';

// Die Seite ist durchgehend deutsch. Preise wurden zuvor an ~15 Stellen mit
// toFixed(2) gesetzt und dadurch englisch ausgegeben („235.71 €"). Diese Tests
// sichern die deutsche Schreibweise projektweit ab.

// Intl setzt zwischen Betrag und Währungszeichen ein GESCHÜTZTES Leerzeichen
// (U+00A0). Das ist typografisch gewollt — es verhindert einen Zeilenumbruch
// zwischen „235,71" und „€". Im Test explizit benannt, weil es optisch von
// einem normalen Leerzeichen nicht zu unterscheiden ist.
const NBSP = ' ';

describe('formatEur', () => {
  it('nutzt Dezimalkomma statt Punkt', () => {
    expect(formatEur(235.71)).toBe(`235,71${NBSP}€`);
    expect(formatEur(8.9)).toBe(`8,90${NBSP}€`);
  });

  it('setzt den Tausender-Trennpunkt', () => {
    // Der frühere naive Komma-Tausch hätte hier "1234,56 €" erzeugt.
    expect(formatEur(1234.56)).toBe(`1.234,56${NBSP}€`);
    expect(formatEur(12000)).toBe(`12.000,00${NBSP}€`);
  });

  it('trennt Betrag und Währung mit geschütztem Leerzeichen', () => {
    expect(formatEur(5)).toContain(NBSP);
    expect(formatEur(5)).not.toMatch(/\d €/); // kein normales Leerzeichen
  });

  it('zeigt immer zwei Nachkommastellen', () => {
    expect(formatEur(5)).toBe(`5,00${NBSP}€`);
    expect(formatEur(0)).toBe(`0,00${NBSP}€`);
  });

  it('behandelt negative Werte', () => {
    expect(formatEur(-12.5)).toContain('12,50');
  });
});

describe('formatAmount', () => {
  it('formatiert ohne Währungszeichen', () => {
    expect(formatAmount(1234.56)).toBe('1.234,56');
    expect(formatAmount(1234.56)).not.toContain('€');
  });
});

describe('formatPercent', () => {
  it('setzt ein Pluszeichen bei positiven Werten', () => {
    expect(formatPercent(3.42)).toBe(`+3,4${NBSP}%`);
  });

  it('behält das Minus bei negativen Werten', () => {
    expect(formatPercent(-1.25)).toBe(`-1,3${NBSP}%`);
  });

  it('lässt das Vorzeichen auf Wunsch weg', () => {
    // Für Stellen, an denen Farbe oder Icon die Richtung schon zeigt.
    expect(formatPercent(3.4, { withSign: false })).toBe(`3,4${NBSP}%`);
  });

  it('unterstützt abweichende Nachkommastellen', () => {
    expect(formatPercent(3.456, { digits: 2 })).toBe(`+3,46${NBSP}%`);
  });

  it('zeigt bei null kein Pluszeichen', () => {
    expect(formatPercent(0)).toBe(`0,0${NBSP}%`);
  });

  it('trennt Zahl und Einheit mit einem geschützten Leerzeichen', () => {
    // Genau wie Intl es vor dem €-Zeichen tut. Mit einem normalen Leerzeichen
    // kann der Zeilenumbruch zwischen Zahl und Einheit fallen — in schmalen
    // Spalten und in Reel-Captions sichtbar.
    expect(formatPercent(12.3)).toContain(NBSP);
    expect(formatPercent(12.3)).not.toMatch(/\d %/);
  });
});

describe('formatCompactEur', () => {
  it('kürzt erst ab 1000', () => {
    expect(formatCompactEur(999)).toBe('999 €');
    expect(formatCompactEur(2500)).toBe('2,5k €');
  });
});
