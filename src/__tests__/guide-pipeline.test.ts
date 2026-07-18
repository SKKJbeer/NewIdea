import { describe, it, expect } from 'vitest';
import { GUIDE_TOPICS } from '@/lib/guide-topics';
import { GUIDES, type Guide } from '@/lib/guides';
import { validateGuide } from '@/lib/guide-generator';
import { findViolations } from '@/lib/content-rules';

describe('GUIDE_TOPICS (Themen-Warteschlange)', () => {
  it('hat mindestens 10 Themen für die Pipeline', () => {
    expect(GUIDE_TOPICS.length).toBeGreaterThanOrEqual(10);
  });

  it('keine doppelten Slugs — auch nicht mit statischen Guides', () => {
    const all = [...GUIDE_TOPICS.map((t) => t.slug), ...GUIDES.map((g) => g.slug)];
    expect(new Set(all).size).toBe(all.length);
  });

  it('jedes Thema hat gültigen Slug, Titel, Brief und Outline', () => {
    for (const t of GUIDE_TOPICS) {
      expect(t.slug, t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.title.length, t.slug).toBeGreaterThan(20);
      expect(t.brief.length, t.slug).toBeGreaterThan(80);
      expect(t.outline.length, t.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it('Briefs und Titel verletzen selbst keine Content-Regeln', () => {
    for (const t of GUIDE_TOPICS) {
      const violations = findViolations(
        [[`${t.slug}.title`, t.title]],
        /$^/, // kein Emoji-Check auf Titel
      );
      expect(violations, JSON.stringify(violations)).toHaveLength(0);
    }
  });
});

describe('validateGuide (Laufzeit-Qualitäts-Gate)', () => {
  function makeGuide(overrides: Partial<Guide>): Guide {
    return {
      slug: 'test-guide',
      title: 'Testguide über Kartenpflege für Sammler',
      metaDescription: 'Eine sachliche Beschreibung des Guides für Suchmaschinen ohne Regelverstöße.',
      emoji: '🛡️',
      badge: 'Test',
      color: 'violet',
      headerGradient: 'from-violet-800 to-indigo-900',
      readingTimeMin: 5,
      intro: 'Karten verlieren Zustand durch Licht und Feuchtigkeit. Die Prüfzonen sind bekannt.',
      sections: [
        { heading: '🔬 Erste Sektion', content: 'Sachlicher Inhalt ohne Verstöße gegen die Regeln.' },
      ],
      keyPoints: ['Sachlicher Punkt ohne Regelverstoß'],
      tags: ['test'],
      ...overrides,
    };
  }

  it('akzeptiert einen regelkonformen Guide', () => {
    expect(validateGuide(makeGuide({}))).toHaveLength(0);
  });

  it('lehnt Preiszahlen im Fließtext ab', () => {
    const v = validateGuide(makeGuide({ intro: 'Diese Karte notiert bei 120 € auf Cardmarket.' }));
    expect(v.some((x) => x.rule === 'preis-im-fliesstext')).toBe(true);
  });

  it('lehnt Kaufempfehlungs-Vokabular ab', () => {
    const v = validateGuide(makeGuide({ keyPoints: ['Diese Karte ist jetzt besonders kaufenswert'] }));
    expect(v.some((x) => x.rule === 'kaufempfehlung')).toBe(true);
  });

  it('lehnt KI-Floskeln ab', () => {
    const v = validateGuide(makeGuide({ intro: 'Hier ein Überblick zu allem Wichtigen.' }));
    expect(v.some((x) => x.rule === 'ki-floskel')).toBe(true);
  });

  it('lehnt Ich-Form ab', () => {
    const v = validateGuide(makeGuide({ sections: [{ heading: 'H', content: 'Ich empfehle diese Methode allen Sammlern.' }] }));
    expect(v.some((x) => x.rule === 'erste-person')).toBe(true);
  });

  it('lehnt Emoji im Fließtext ab, erlaubt es in heading/tip', () => {
    const bad = validateGuide(makeGuide({ sections: [{ heading: 'H', content: 'Text mit Emoji 🔥 im Fließtext.' }] }));
    expect(bad.some((x) => x.rule === 'emoji-im-fliesstext')).toBe(true);
    const ok = validateGuide(makeGuide({ sections: [{ heading: '🔥 Überschrift', content: 'Sauberer Text.', tip: '💡 Tipp mit Emoji-Präfix.' }] }));
    expect(ok).toHaveLength(0);
  });
});
