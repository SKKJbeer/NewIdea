import { describe, it, expect } from 'vitest';
import { isPublishableReport, MIN_PUBLISHABLE_CHARS } from '@/lib/market-report-storage';
import { currentWeek, MIN_REPORT_CHARS } from '@/lib/market-report-generator';

// Absicherung gegen den konkreten Vorfall: Auf /marktbericht stand über Wochen
// ein „Bericht", dessen gesamter Inhalt das Wort „test" war.

describe('isPublishableReport', () => {
  it('lehnt Platzhalter ab', () => {
    expect(isPublishableReport('test')).toBe(false);
    expect(isPublishableReport('')).toBe(false);
    expect(isPublishableReport(null)).toBe(false);
    expect(isPublishableReport(undefined)).toBe(false);
    expect(isPublishableReport('   ')).toBe(false);
  });

  it('lehnt zu kurze Texte ab', () => {
    expect(isPublishableReport('x'.repeat(MIN_PUBLISHABLE_CHARS - 1))).toBe(false);
  });

  it('akzeptiert einen vollwertigen Bericht', () => {
    expect(isPublishableReport('x'.repeat(MIN_PUBLISHABLE_CHARS))).toBe(true);
    expect(isPublishableReport('x'.repeat(2000))).toBe(true);
  });

  it('nutzt dieselbe Schwelle wie das Erzeugungs-Gate', () => {
    // Anzeige und Erzeugung dürfen nicht auseinanderlaufen.
    expect(MIN_PUBLISHABLE_CHARS).toBe(MIN_REPORT_CHARS);
  });
});

describe('currentWeek', () => {
  it('liefert den Montag der laufenden Woche', () => {
    // Mittwoch, 29. Juli 2026 -> Montag, 27. Juli 2026
    expect(currentWeek(new Date('2026-07-29T12:00:00Z')).weekStart).toBe('2026-07-27');
  });

  it('gibt an einem Montag denselben Tag zurück', () => {
    expect(currentWeek(new Date('2026-07-27T06:00:00Z')).weekStart).toBe('2026-07-27');
  });

  it('behandelt Sonntag als Ende der laufenden Woche', () => {
    // Sonntag, 2. August 2026 gehört zur Woche ab Montag, 27. Juli
    expect(currentWeek(new Date('2026-08-02T12:00:00Z')).weekStart).toBe('2026-07-27');
  });

  it('liefert eine plausible Kalenderwoche', () => {
    const { weekNumber } = currentWeek(new Date('2026-07-29T12:00:00Z'));
    expect(weekNumber).toBeGreaterThan(28);
    expect(weekNumber).toBeLessThan(34);
  });
});
