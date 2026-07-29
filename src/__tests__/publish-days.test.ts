import { describe, it, expect } from 'vitest';
import { PUBLISH_DAYS, recentPublishDates } from '@/lib/publish-days';
import { getArticleType } from '@/lib/article-generator';

// Der Veröffentlichungsplan ist in CLAUDE.md als unveränderlich festgehalten:
// Artikel erscheinen NUR sonntags (Wochenrückblick) und donnerstags.
describe('Veröffentlichungstage', () => {
  it('kennt genau Sonntag und Donnerstag', () => {
    expect([...PUBLISH_DAYS].sort()).toEqual([0, 4]);
  });

  it('liefert nur Sonntage und Donnerstage, neueste zuerst', () => {
    // Mittwoch, 29. Juli 2026
    const dates = recentPublishDates(6, new Date('2026-07-29T10:00:00Z'));
    expect(dates).toHaveLength(6);

    for (const d of dates) {
      const dow = new Date(d.date + 'T12:00:00Z').getUTCDay();
      expect(PUBLISH_DAYS.has(dow)).toBe(true);
    }

    const isoDates = dates.map((d) => d.date);
    expect(isoDates).toEqual([...isoDates].sort().reverse());
    expect(isoDates[0]).toBe('2026-07-26'); // der Sonntag davor
  });

  it('gibt für jeden gelieferten Termin auch einen Artikeltyp her', () => {
    // Sonst könnte das Monitoring Termine anbieten, die der Endpunkt mit
    // „kein Publish-Tag" ablehnt.
    for (const d of recentPublishDates(8, new Date('2026-07-29T10:00:00Z'))) {
      expect(getArticleType(d.date)).not.toBeNull();
    }
  });

  it('markiert den heutigen Tag nur, wenn heute ein Publish-Tag ist', () => {
    const sunday = recentPublishDates(1, new Date('2026-07-26T10:00:00Z'));
    expect(sunday[0].isToday).toBe(true);

    const wednesday = recentPublishDates(1, new Date('2026-07-29T10:00:00Z'));
    expect(wednesday[0].isToday).toBe(false);
  });
});
