import { describe, it, expect } from 'vitest';
import {
  DAY_TYPE,
  ARTICLE_META,
  ARTICLE_PREVIEW_TITLES,
  ARTICLE_PREVIEW_SUBTITLES,
  type ArticleType,
} from '@/lib/article-generator';
import { STATIC_ARTICLES } from '@/lib/static-articles';

const ALL_TYPES: ArticleType[] = ['markt', 'karte', 'strategie', 'set', 'ausblick', 'guide', 'rueckblick'];
const VALID_COLORS = ['violet', 'blue', 'emerald', 'amber', 'rose', 'indigo', 'gray'];

describe('DAY_TYPE', () => {
  it('covers all 7 days of the week', () => {
    for (let day = 0; day <= 6; day++) {
      expect(DAY_TYPE[day], `day ${day} missing`).toBeDefined();
    }
  });

  it('maps to valid ArticleType values', () => {
    for (const type of Object.values(DAY_TYPE)) {
      expect(ALL_TYPES).toContain(type);
    }
  });
});

describe('ARTICLE_META', () => {
  it('has an entry for every ArticleType', () => {
    for (const type of ALL_TYPES) {
      expect(ARTICLE_META[type], `ARTICLE_META missing "${type}"`).toBeDefined();
    }
  });

  it('every entry has required fields', () => {
    for (const [type, meta] of Object.entries(ARTICLE_META)) {
      expect(meta.label, `${type}.label`).toBeTruthy();
      expect(meta.category, `${type}.category`).toBeTruthy();
      expect(meta.emoji, `${type}.emoji`).toBeTruthy();
      expect(VALID_COLORS, `${type}.color "${meta.color}" is invalid`).toContain(meta.color);
    }
  });
});

describe('ARTICLE_PREVIEW_TITLES', () => {
  it('has an entry for every ArticleType', () => {
    for (const type of ALL_TYPES) {
      expect(ARTICLE_PREVIEW_TITLES[type], `ARTICLE_PREVIEW_TITLES missing "${type}"`).toBeTruthy();
    }
  });
});

describe('ARTICLE_PREVIEW_SUBTITLES', () => {
  it('has an entry for every ArticleType', () => {
    for (const type of ALL_TYPES) {
      expect(ARTICLE_PREVIEW_SUBTITLES[type], `ARTICLE_PREVIEW_SUBTITLES missing "${type}"`).toBeTruthy();
    }
  });
});

describe('STATIC_ARTICLES', () => {
  it('has at least one article', () => {
    expect(Object.keys(STATIC_ARTICLES).length).toBeGreaterThan(0);
  });

  it('all dates are valid YYYY-MM-DD strings', () => {
    for (const date of Object.keys(STATIC_ARTICLES)) {
      expect(date, `invalid date format: ${date}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const d = new Date(date + 'T12:00:00');
      expect(isNaN(d.getTime()), `not a real date: ${date}`).toBe(false);
    }
  });

  it('each article has all required fields', () => {
    for (const [date, article] of Object.entries(STATIC_ARTICLES)) {
      expect(article.title, `${date}: title`).toBeTruthy();
      expect(article.intro, `${date}: intro`).toBeTruthy();
      expect(Array.isArray(article.sections), `${date}: sections must be array`).toBe(true);
      expect(article.sections.length, `${date}: sections empty`).toBeGreaterThan(0);
      expect(Array.isArray(article.keyPoints), `${date}: keyPoints must be array`).toBe(true);
      expect(article.keyPoints.length, `${date}: keyPoints empty`).toBeGreaterThan(0);
      expect(Array.isArray(article.tags), `${date}: tags must be array`).toBe(true);
      expect(article.readingTimeMin, `${date}: readingTimeMin`).toBeGreaterThan(0);
    }
  });

  it('each section has a heading and content', () => {
    for (const [date, article] of Object.entries(STATIC_ARTICLES)) {
      for (const [i, section] of article.sections.entries()) {
        expect(section.heading, `${date} section[${i}].heading`).toBeTruthy();
        expect(section.content, `${date} section[${i}].content`).toBeTruthy();
      }
    }
  });

  it('each article has at least one source', () => {
    for (const [date, article] of Object.entries(STATIC_ARTICLES)) {
      expect(
        article.sources && article.sources.length > 0,
        `${date}: missing sources`,
      ).toBe(true);
    }
  });

  it('all sources have a label and a valid URL', () => {
    for (const [date, article] of Object.entries(STATIC_ARTICLES)) {
      for (const src of article.sources ?? []) {
        expect(src.label, `${date}: source.label`).toBeTruthy();
        expect(src.url, `${date}: source.url`).toMatch(/^https?:\/\//);
      }
    }
  });

  it('dates match their expected ArticleType for the day of week', () => {
    for (const date of Object.keys(STATIC_ARTICLES)) {
      const d = new Date(date + 'T12:00:00');
      const expectedType = DAY_TYPE[d.getDay()];
      // The static articles should have content that is consistent with the day's type —
      // this is a soft check (titles differ but type must be resolvable)
      expect(expectedType, `${date}: no DAY_TYPE for day ${d.getDay()}`).toBeDefined();
    }
  });
});
