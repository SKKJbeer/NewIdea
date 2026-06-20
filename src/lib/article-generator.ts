import Anthropic from '@anthropic-ai/sdk';
import { fetchTrendingCards } from './pokemon-api';

export type ArticleType = 'markt' | 'karte' | 'strategie' | 'set' | 'ausblick' | 'guide' | 'rueckblick';

export interface Article {
  title: string;
  intro: string;
  sections: Array<{ heading: string; content: string }>;
  keyPoints: string[];
  tags: string[];
  readingTimeMin: number;
  generatedAt: string;
}

export const DAY_TYPE: Record<number, ArticleType> = {
  0: 'rueckblick',
  1: 'markt',
  2: 'karte',
  3: 'strategie',
  4: 'set',
  5: 'ausblick',
  6: 'guide',
};

export const ARTICLE_META: Record<ArticleType, { label: string; category: string; emoji: string; color: string }> = {
  markt:      { label: 'Wöchentliche Marktanalyse',  category: 'Markt',      emoji: '📊', color: 'violet'  },
  karte:      { label: 'Karte im Fokus',             category: 'Spotlight',  emoji: '🃏', color: 'blue'    },
  strategie:  { label: 'Investment-Strategie',       category: 'Strategie',  emoji: '💡', color: 'emerald' },
  set:        { label: 'Set-Analyse',                category: 'Analyse',    emoji: '📦', color: 'amber'   },
  ausblick:   { label: 'Wochenend-Ausblick',         category: 'Prognose',   emoji: '🔮', color: 'rose'    },
  guide:      { label: 'Sammler-Guide',              category: 'Guide',      emoji: '📚', color: 'indigo'  },
  rueckblick: { label: 'Wochenrückblick',            category: 'Rückblick',  emoji: '🔄', color: 'gray'    },
};

const JSON_SCHEMA = `{
  "title": "SEO-optimierter Titel (60-80 Zeichen, mit 'Pokémon' Keyword)",
  "intro": "Einleitung (2-3 packende Sätze)",
  "sections": [
    {"heading": "Abschnittstitel", "content": "3-4 Sätze Inhalt"},
    {"heading": "Abschnittstitel", "content": "3-4 Sätze Inhalt"},
    {"heading": "Abschnittstitel", "content": "3-4 Sätze Inhalt"}
  ],
  "keyPoints": ["Kernaussage 1", "Kernaussage 2", "Kernaussage 3"],
  "tags": ["pokémon karten", "tcg", "investment", "weiteres keyword"]
}`;

function buildPrompt(type: ArticleType, cards: string, dateLabel: string): string {
  const base = `Du bist ein Pokémon-TCG-Investment-Experte und schreibst für einen deutschen Blog. Antworte NUR mit validem JSON, kein Text davor oder danach:\n${JSON_SCHEMA}`;

  const contexts: Record<ArticleType, string> = {
    markt: `Schreibe eine Marktanalyse für ${dateLabel}. Analysiere die Trends und gib Investment-Einschätzungen.\n\nAktuelle Karten-Preise:\n${cards}`,
    karte: `Wähle die spannendste Karte aus den aktuellen Daten und analysiere sie tiefgehend für ${dateLabel}.\n\nAktuelle Karten-Preise:\n${cards}`,
    strategie: `Erkläre eine konkrete Investment-Strategie für Pokémon-Karten, relevant für ${dateLabel}.\n\nAktuelle Marktdaten:\n${cards}`,
    set: `Analysiere ein aktuell interessantes Pokémon-TCG-Set basierend auf den Daten vom ${dateLabel}.\n\nAktuelle Karten (mit Set-Info):\n${cards}`,
    ausblick: `Gib einen Ausblick auf das Wochenende — was sollten Investoren kaufen/verkaufen? Stand: ${dateLabel}.\n\nAktuelle Marktdaten:\n${cards}`,
    guide: `Schreibe einen praktischen Sammler-Guide, der für Anfänger und Fortgeschrittene nützlich ist. Stand: ${dateLabel}.\n\nKontext — aktuelle Top-Karten:\n${cards}`,
    rueckblick: `Blicke auf die vergangene Woche zurück und ziehe Lehren für die kommende Woche. Stand: ${dateLabel}.\n\nDiese Woche im Markt:\n${cards}`,
  };

  return `${base}\n\n${contexts[type]}`;
}

export async function generateArticle(type: ArticleType, date: string): Promise<Article> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let cardSummary = 'Keine aktuellen Daten verfügbar';
  try {
    const cards = await fetchTrendingCards(10);
    cardSummary = cards
      .slice(0, 6)
      .map((c) => `${c.name} (${c.set}): ${(c.prices.holofoil?.market || c.prices.market || 0).toFixed(2)}€, Trend: ${(c.trendPercent || 0).toFixed(1)}%`)
      .join('\n');
  } catch {}

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildPrompt(type, cardSummary, dateLabel) }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

  interface ArticleData {
    title: string;
    intro: string;
    sections: Array<{ heading: string; content: string }>;
    keyPoints: string[];
    tags: string[];
  }

  let data: ArticleData;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    data = JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    data = {
      title: `${ARTICLE_META[type].label} — ${dateLabel}`,
      intro: 'Der Pokémon-Kartenmarkt bietet diese Woche interessante Entwicklungen für Sammler und Investoren.',
      sections: [{ heading: 'Marktüberblick', content: cardSummary }],
      keyPoints: ['Markt analysieren', 'Trends beobachten', 'Informiert investieren'],
      tags: ['pokémon karten', 'tcg', 'investment'],
    };
  }

  const wordCount = [data.intro, ...(data.sections || []).map((s) => s.content)].join(' ').split(' ').length;

  return {
    title: data.title || ARTICLE_META[type].label,
    intro: data.intro || '',
    sections: data.sections || [],
    keyPoints: data.keyPoints || [],
    tags: data.tags || [],
    readingTimeMin: Math.max(1, Math.ceil(wordCount / 200)),
    generatedAt: new Date().toISOString(),
  };
}
