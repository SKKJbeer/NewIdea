import { describe, it, expect } from 'vitest';
import { GUIDES } from '@/lib/guides';

describe('GUIDES', () => {
  it('has at least one guide', () => {
    expect(GUIDES.length).toBeGreaterThan(0);
  });

  it('no duplicate slugs', () => {
    const slugs = GUIDES.map((g) => g.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('each guide has required fields', () => {
    for (const guide of GUIDES) {
      expect(guide.slug, `slug missing`).toBeTruthy();
      expect(guide.title, `${guide.slug}: title`).toBeTruthy();
      expect(guide.metaDescription, `${guide.slug}: metaDescription`).toBeTruthy();
      expect(guide.icon, `${guide.slug}: icon`).toBeTruthy();
      expect(guide.readingTimeMin, `${guide.slug}: readingTimeMin`).toBeGreaterThan(0);
      expect(guide.intro, `${guide.slug}: intro`).toBeTruthy();
      expect(Array.isArray(guide.sections), `${guide.slug}: sections must be array`).toBe(true);
      expect(guide.sections.length, `${guide.slug}: sections empty`).toBeGreaterThan(0);
      expect(Array.isArray(guide.keyPoints), `${guide.slug}: keyPoints must be array`).toBe(true);
      expect(guide.keyPoints.length, `${guide.slug}: keyPoints empty`).toBeGreaterThan(0);
      expect(Array.isArray(guide.tags), `${guide.slug}: tags must be array`).toBe(true);
    }
  });

  it('each section has a heading and content', () => {
    for (const guide of GUIDES) {
      for (const [i, section] of guide.sections.entries()) {
        expect(section.heading, `${guide.slug} section[${i}].heading`).toBeTruthy();
        expect(section.content, `${guide.slug} section[${i}].content`).toBeTruthy();
      }
    }
  });

  it('slug only contains lowercase letters, digits and hyphens', () => {
    for (const guide of GUIDES) {
      expect(guide.slug, `${guide.slug}: invalid slug format`).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
