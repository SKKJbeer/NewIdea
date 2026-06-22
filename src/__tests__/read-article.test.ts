import { describe, it, expect } from 'vitest';
import { readArticle, DAY_TYPE, ARTICLE_META } from '@/lib/article-generator';
import { STATIC_ARTICLES } from '@/lib/static-articles';

describe('readArticle', () => {
  it('returns article for a known static date', async () => {
    const [date] = Object.keys(STATIC_ARTICLES);
    const article = await readArticle(date);

    expect(article).not.toBeNull();
    expect(article!.title).toBeTruthy();
    expect(article!.intro).toBeTruthy();
    expect(article!.sections.length).toBeGreaterThan(0);
    expect(article!.keyPoints.length).toBeGreaterThan(0);
    expect(article!.generatedAt).toBeTruthy();
  });

  it('returns null for an unknown past date (no Supabase in test env)', async () => {
    const article = await readArticle('2020-01-01');
    expect(article).toBeNull();
  });

  it('preserves the title from STATIC_ARTICLES exactly', async () => {
    for (const [date, staticData] of Object.entries(STATIC_ARTICLES)) {
      const article = await readArticle(date);
      expect(article!.title).toBe(staticData.title);
    }
  });

  it('always returns featuredCards as an array', async () => {
    for (const date of Object.keys(STATIC_ARTICLES)) {
      const article = await readArticle(date);
      expect(Array.isArray(article!.featuredCards)).toBe(true);
    }
  });
});

describe('DAY_TYPE + ARTICLE_META round-trip', () => {
  it('every day maps to a type that has a valid color', () => {
    const validColors = ['violet', 'blue', 'emerald', 'amber', 'rose', 'indigo', 'gray'];
    for (let day = 0; day <= 6; day++) {
      const type = DAY_TYPE[day];
      const meta = ARTICLE_META[type];
      expect(validColors).toContain(meta.color);
    }
  });
});
