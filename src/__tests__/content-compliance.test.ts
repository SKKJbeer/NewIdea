import { describe, it, expect } from 'vitest';
import { STATIC_ARTICLES } from '@/lib/static-articles';
import { fallbackArticle, PUBLISH_DAYS, type ArticleType, type Article } from '@/lib/article-generator';
import { GUIDES } from '@/lib/guides';

// ─────────────────────────────────────────────────────────────────────────────
// Content-Compliance — erzwingt die CLAUDE.md-Regeln maschinell:
//  1. Keine Preiszahlen im Fließtext (€/$/EUR) — nur das price:-Feld in highlights
//  2. Keine Erste-Person-Singular, kein Persona-Name
//  3. Keine Kaufempfehlungs-/Finanzberatungs-Vokabeln
//  4. Statische Artikel nur an Publish-Tagen (So/Do)
// Schlägt ein Test fehl, verletzt neuer Content die Wahrheits-/Tonalitätsregeln.
// ─────────────────────────────────────────────────────────────────────────────

// Regeln kommen aus der geteilten Quelle — dieselben Regexe laufen zur Laufzeit
// als Qualitäts-Gate der KI-Generierung (guide-generator.ts).
import { PRICE_IN_TEXT, FIRST_PERSON, PERSONA_NAME, BUY_ADVICE, AI_PHRASES, EMOJI } from '@/lib/content-rules';

// Sammelt alle Fließtext-Felder eines Artikels (ohne die strukturierten highlight-Objekte).
function articleTexts(article: Omit<Article, 'generatedAt'> | Article): Array<[string, string]> {
  const texts: Array<[string, string]> = [
    ['title', article.title],
    ['intro', article.intro],
    ...article.keyPoints.map((p, i) => [`keyPoints[${i}]`, p] as [string, string]),
  ];
  for (const [i, s] of article.sections.entries()) {
    texts.push([`sections[${i}].heading`, s.heading]);
    texts.push([`sections[${i}].content`, s.content]);
  }
  return texts;
}

function expectCompliant(label: string, texts: Array<[string, string]>) {
  for (const [field, text] of texts) {
    expect(text, `${label} → ${field}: Preiszahl im Fließtext (nur highlight.price erlaubt): "${text.match(PRICE_IN_TEXT)?.[0]}"`).not.toMatch(PRICE_IN_TEXT);
    expect(text, `${label} → ${field}: Erste-Person-Singular verboten`).not.toMatch(FIRST_PERSON);
    expect(text, `${label} → ${field}: Persona-Name verboten`).not.toMatch(PERSONA_NAME);
    expect(text, `${label} → ${field}: Kaufempfehlungs-Vokabular: "${text.match(BUY_ADVICE)?.[0]}"`).not.toMatch(BUY_ADVICE);
    expect(text, `${label} → ${field}: KI-Floskel (schreibstil.md): "${text.match(AI_PHRASES)?.[0]}"`).not.toMatch(AI_PHRASES);
    // Emoji-Verbot gilt ÜBERALL — auch Überschriften und Tips. Icons kommen aus Lucide (CLAUDE.md).
    expect(text, `${label} → ${field}: Emoji verboten (nur Lucide-Icons): "${text.match(EMOJI)?.[0]}"`).not.toMatch(EMOJI);
  }
}

describe('Content-Compliance: STATIC_ARTICLES', () => {
  it('alle Artikel liegen auf Publish-Tagen (Sonntag/Donnerstag)', () => {
    for (const date of Object.keys(STATIC_ARTICLES)) {
      const dow = new Date(date + 'T12:00:00').getDay();
      expect(PUBLISH_DAYS.has(dow), `${date} ist Wochentag ${dow} — kein Publish-Tag (So=0/Do=4)`).toBe(true);
    }
  });

  it('kein Preis im Fließtext, keine Ich-Form, keine Kaufempfehlung', () => {
    for (const [date, article] of Object.entries(STATIC_ARTICLES)) {
      expectCompliant(`STATIC_ARTICLES[${date}]`, articleTexts(article));
    }
  });

  it('jeder statische Artikel behält isStatic-Schutz über readArticle (Disclaimer-Pflicht)', () => {
    // isStatic wird in readArticle/generateArticle gesetzt — hier nur sicherstellen,
    // dass kein Artikel es explizit auf false setzt.
    for (const [date, article] of Object.entries(STATIC_ARTICLES)) {
      expect(article.isStatic, `${date}: isStatic darf nie explizit false sein`).not.toBe(false);
    }
  });
});

describe('Content-Compliance: fallbackArticle (alle 7 Typen)', () => {
  const ALL_TYPES: ArticleType[] = ['markt', 'karte', 'strategie', 'set', 'ausblick', 'guide', 'rueckblick'];

  it('kein Preis im Fließtext, keine Ich-Form, keine Kaufempfehlung', () => {
    for (const type of ALL_TYPES) {
      const article = fallbackArticle(type, 'Sonntag, 1. Februar 2026', '');
      expectCompliant(`fallbackArticle(${type})`, articleTexts(article));
    }
  });

  it('jeder Fallback-Artikel trägt isStatic: true (Archiv-Disclaimer-Pflicht)', () => {
    for (const type of ALL_TYPES) {
      expect(fallbackArticle(type, 'Sonntag, 1. Februar 2026', '').isStatic).toBe(true);
    }
  });
});

describe('Content-Compliance: GUIDES', () => {
  it('kein Preis im Fließtext, keine Ich-Form, keine Kaufempfehlung', () => {
    for (const guide of GUIDES) {
      const texts: Array<[string, string]> = [
        ['title', guide.title],
        ['metaDescription', guide.metaDescription],
        ['intro', guide.intro],
        ...guide.keyPoints.map((p, i) => [`keyPoints[${i}]`, p] as [string, string]),
      ];
      for (const [i, s] of guide.sections.entries()) {
        texts.push([`sections[${i}].heading`, s.heading]);
        texts.push([`sections[${i}].content`, s.content]);
        if (s.tip) texts.push([`sections[${i}].tip`, s.tip]);
        for (const [j, c] of (s.cards ?? []).entries()) {
          texts.push([`sections[${i}].cards[${j}].why`, c.why]);
        }
      }
      expectCompliant(`GUIDES[${guide.slug}]`, texts);
    }
  });
});
