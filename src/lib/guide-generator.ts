import Anthropic from '@anthropic-ai/sdk';
import type { Guide } from './guides';
import { GUIDES } from './guides';
import { GUIDE_TOPICS, type GuideTopic } from './guide-topics';
import { findViolations, type ContentViolation } from './content-rules';
import { saveGeneratedGuide, listGeneratedGuideSlugs } from './guide-storage';

// Automatisierte Guide-Generierung mit hartem Qualitäts-Gate:
// Ein Guide, der die Content-Regeln (Wahrheitspflicht, Neutralität, Schreibstil)
// verletzt, wird NICHT gespeichert — lieber kein Guide als ein schlechter.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

const GUIDE_RULES = `ABSOLUTE REGELN (Verstoß = unbrauchbarer Guide):
1. WAHRHEIT: Nur dokumentierte, verifizierbare Fakten (Bulbapedia, Cardmarket-Systematik, offizielle Anbieter-Websites). NIEMALS erfinden: Preise, Prozentwerte, Druckraten, Auktionsergebnisse, Illustratoren, Jahreszahlen ohne Beleg. Wo Zahlen schwanken (Preise, Gebühren): qualitativ formulieren und auf die Quelle verweisen ("aktuelle Gebühren auf cardmarket.com prüfen").
2. KEINE PREISZAHLEN im Text: kein "€", "EUR", "$" mit Zahl — Preise veralten sofort. Stattdessen: "ein Vielfaches", "deutlich höher", "auf Cardmarket prüfen".
3. KEINE ANLAGEBERATUNG: keine Kaufempfehlungen, keine Renditeversprechen, keine Kauf-/Verkaufszeitpunkte. Kriterien liefern, Entscheidung beim Leser lassen.
4. KEINE ICH-FORM, kein Erzähler-Name. Du-Ansprache an den Leser ist erlaubt und erwünscht.
5. SCHREIBSTIL (menschlich, nüchtern — NICHT nach KI klingend):
   - Direkt mit Fakt/Beobachtung/Kontrast einsteigen. VERBOTEN: "Hier ein Überblick", "In der heutigen Zeit", "Tauchen wir ein"
   - VERBOTENE Wörter: atemberaubend, revolutionär, bahnbrechend, faszinierend, spektakulär, episch
   - Keine Meta-Kommentare ("In diesem Artikel", "Zusammenfassend", "Fazit:")
   - Satzlängen variieren, kurze Sätze einstreuen. Jeder Satz trägt Information (Was/Wann/Wie/Warum)
   - Keine Emojis im Fließtext (content). In tip-Feldern ist EIN Emoji als Präfix erlaubt.
6. ZIELGRUPPE: Deutsche Pokémon-Sammler, alle Erfahrungsstufen. Fachbegriffe beim ersten Auftreten in Klammern erklären.`;

const GUIDE_SCHEMA = `{
  "metaDescription": "SEO-Beschreibung, 140-160 Zeichen, enthält das Kern-Keyword",
  "readingTimeMin": 6,
  "intro": "3-4 Sätze Einstieg — direkt mit dem stärksten Fakt oder dem Problem des Lesers, keine Floskeln",
  "sections": [
    {
      "heading": "Emoji + konkrete Aussage als Überschrift",
      "content": "5-8 dichte Sätze. Konkrete Merkmale, Abläufe, Kriterien — alles verifizierbar.",
      "tip": "Optional: EIN Emoji + praktischer Hinweis in 1-2 Sätzen"
    }
  ],
  "keyPoints": ["4 kompakte Takeaways — konkret, kein Marketing"],
  "tags": ["4-5 deutsche such-relevante Tags, kleingeschrieben"]
}`;

interface GeneratedGuideData {
  metaDescription: string;
  readingTimeMin: number;
  intro: string;
  sections: Array<{ heading: string; content: string; tip?: string }>;
  keyPoints: string[];
  tags: string[];
}

function buildGuidePrompt(topic: GuideTopic): string {
  return `Du bist ein erfahrener Pokémon-TCG-Sammler und Marktbeobachter, der einen Evergreen-Guide auf Deutsch schreibt — sachlich, faktendicht, für echte Sammler nützlich.

${GUIDE_RULES}

AUFTRAG:
Titel des Guides: "${topic.title}"
${topic.brief}

SEKTIONEN (Leitplanke — inhaltlich abdecken, Formulierung frei):
${topic.outline.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Antworte NUR mit validem JSON nach diesem Schema:
${GUIDE_SCHEMA}`;
}

export interface GuideGenerationResult {
  status: 'created' | 'skipped_exists' | 'rejected_quality' | 'failed' | 'no_api_key' | 'all_done';
  slug?: string;
  title?: string;
  violations?: ContentViolation[];
}

/** Prüft einen Guide gegen alle Content-Regeln (gleiche Regexe wie die Build-Tests). */
export function validateGuide(guide: Guide): ContentViolation[] {
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
  }
  // Emoji-Verbot gilt für intro + content (heading/tip nutzen Emojis als Anker)
  return findViolations(texts, /^(intro|sections\[\d+\]\.content|keyPoints|metaDescription)/);
}

/** Nächstes noch nicht generiertes Thema aus der Warteschlange. */
export async function nextPendingTopic(): Promise<GuideTopic | null> {
  const existing = new Set([
    ...GUIDES.map((g) => g.slug),
    ...(await listGeneratedGuideSlugs()),
  ]);
  return GUIDE_TOPICS.find((t) => !existing.has(t.slug)) ?? null;
}

/**
 * Generiert den nächsten ausstehenden Guide aus der Themen-Warteschlange.
 * Qualitäts-Gate: Verletzt die Ausgabe eine Content-Regel, wird NICHT gespeichert.
 */
export async function generateNextGuide(): Promise<GuideGenerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { status: 'no_api_key' };

  const topic = await nextPendingTopic();
  if (!topic) return { status: 'all_done' };

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: buildGuidePrompt(topic) }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const data: GeneratedGuideData = JSON.parse(jsonMatch?.[0] || '{}');

    if (!data.intro || !Array.isArray(data.sections) || data.sections.length < 3 || !Array.isArray(data.keyPoints) || data.keyPoints.length === 0) {
      return { status: 'failed', slug: topic.slug };
    }

    const guide: Guide = {
      slug: topic.slug,
      title: topic.title,
      metaDescription: data.metaDescription || topic.brief.slice(0, 155),
      emoji: topic.emoji,
      badge: topic.badge,
      color: topic.color,
      headerGradient: topic.headerGradient,
      readingTimeMin: Math.max(4, Math.min(12, data.readingTimeMin || 6)),
      intro: data.intro,
      sections: data.sections.map((s) => ({ heading: s.heading, content: s.content, tip: s.tip })),
      keyPoints: data.keyPoints.slice(0, 5),
      tags: (data.tags || []).slice(0, 5),
    };

    // QUALITÄTS-GATE: gleiche Regeln wie die Build-Tests — Verstoß = kein Publish.
    const violations = validateGuide(guide);
    if (violations.length > 0) {
      console.error(`Guide "${topic.slug}" abgelehnt — ${violations.length} Regelverstöße:`, violations.slice(0, 5));
      return { status: 'rejected_quality', slug: topic.slug, violations };
    }

    const saved = await saveGeneratedGuide(guide);
    if (!saved) return { status: 'failed', slug: topic.slug };

    return { status: 'created', slug: guide.slug, title: guide.title };
  } catch (err) {
    console.error(`Guide-Generierung fehlgeschlagen (${topic.slug}):`, err);
    return { status: 'failed', slug: topic.slug };
  }
}
