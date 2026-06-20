import Anthropic from '@anthropic-ai/sdk';
import { PokemonCard, NewsletterContent, VideoScript, SocialPost, MarketSummary } from '@/types';
import { buildNewsletterHtml } from '@/lib/newsletter-template';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-opus-4-8';

export async function generateMarketSummary(
  cards: PokemonCard[],
  topGainers: PokemonCard[],
  topLosers: PokemonCard[]
): Promise<MarketSummary> {
  const cardData = cards
    .slice(0, 10)
    .map((c) => `${c.name} (${c.set}): ${formatPrice(c)} | Trend: ${c.trendPercent?.toFixed(1)}%`)
    .join('\n');

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Du bist ein Pokémon-Karten-Marktexperte. Analysiere diese Karten-Daten und erstelle einen prägnanten deutschen Marktbericht (max. 150 Wörter):\n\nAktuelle Karten-Preise:\n${cardData}\n\nTop-Gewinner: ${topGainers.map((c) => c.name).join(', ')}\nTop-Verlierer: ${topLosers.map((c) => c.name).join(', ')}\n\nSchreibe einen ansprechenden Marktbericht für Sammler und Investoren. Fokus auf Trends, Investmentmöglichkeiten und was diese Woche beachtet werden sollte.`,
      },
    ],
  });

  const weeklyReport = message.content[0].type === 'text' ? message.content[0].text : '';

  return {
    topGainers: topGainers.slice(0, 5),
    topLosers: topLosers.slice(0, 5),
    trending: cards.slice(0, 8),
    weeklyReport,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateNewsletterContent(
  summary: MarketSummary,
  cards: PokemonCard[]
): Promise<NewsletterContent> {
  const topCards = cards.slice(0, 5);
  const cardDetails = topCards
    .map((c, i) => `${i + 1}. ${c.name} (${c.set}) — ${formatPrice(c)} | Score: ${c.investmentScore}/100 | Trend: ${c.trendPercent?.toFixed(1) || 0}%`)
    .join('\n');

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Du bist der Autor des "PokéMarket Intelligence" Newsletters.\n\nMarktbericht:\n${summary.weeklyReport}\n\nTop-Investment-Karten:\n${cardDetails}\n\nErstelle Newsletter-Inhalte auf Deutsch. Antworte NUR mit validem JSON, kein Text davor oder danach:\n{\n  "subject": "Betreff (max. 60 Zeichen, neugierig machend, mit Emoji)",\n  "preheader": "Vorschautext (max. 90 Zeichen)",\n  "intro": "Einleitungstext (2-3 Sätze, direkt und spannend)",\n  "cardHighlights": [\n    {\n      "name": "Genauer Kartenname",\n      "set": "Set-Name",\n      "price": "0.00 €",\n      "trend": "+X.X%",\n      "score": 85,\n      "reason": "Ein prägnanter Satz warum diese Karte jetzt interessant ist"\n    }\n  ],\n  "tip": "Investment-Tipp der Woche (2-3 Sätze, konkret und umsetzbar)",\n  "tipTitle": "Kurzer Titel für den Tipp",\n  "ctaText": "Handlungsaufforderung (1 Satz)"\n}\n\nErstelle cardHighlights für alle 5 Karten. Verwende die genauen Preise und Trends aus den Daten.`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

  type NewsletterData = {
    subject: string;
    preheader: string;
    intro: string;
    cardHighlights: Array<{ name: string; set: string; price: string; trend: string; score: number; reason: string }>;
    tip: string;
    tipTitle: string;
    ctaText: string;
  };

  let newsletterData: NewsletterData;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    newsletterData = JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    newsletterData = {
      subject: '🚀 PokéMarket Weekly: Top Karten dieser Woche',
      preheader: 'Deine wöchentliche Marktanalyse ist da',
      intro: summary.weeklyReport.slice(0, 300),
      cardHighlights: topCards.map((c) => ({
        name: c.name,
        set: c.set,
        price: formatPrice(c),
        trend: `${(c.trendPercent || 0) >= 0 ? '+' : ''}${(c.trendPercent || 0).toFixed(1)}%`,
        score: c.investmentScore || 0,
        reason: 'Starke Performance diese Woche.',
      })),
      tip: 'Diversifiziere dein Portfolio und setze auf bewährte Sets mit hoher Nachfrage.',
      tipTitle: 'Investment-Tipp der Woche',
      ctaText: 'Jetzt die besten Deals sichern:',
    };
  }

  const htmlContent = buildNewsletterHtml(newsletterData, topCards);
  const textContent = `${newsletterData.subject}\n\n${newsletterData.intro}\n\n${summary.weeklyReport}`;

  return {
    subject: newsletterData.subject,
    preheader: newsletterData.preheader,
    htmlContent,
    textContent,
    topCards,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateVideoScript(
  cards: PokemonCard[],
  format: 'youtube' | 'shorts' | 'tiktok'
): Promise<VideoScript> {
  const isShortForm = format === 'shorts' || format === 'tiktok';
  const duration = isShortForm ? 60 : 300;

  const topCards = cards.slice(0, isShortForm ? 3 : 5);
  const cardInfo = topCards
    .map((c) => `${c.name} (${c.set}): ${formatPrice(c)}, Trend: ${c.trendPercent?.toFixed(1)}%`)
    .join('\n');

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Du erstellst ein ${format === 'youtube' ? 'YouTube-Video (5 Minuten)' : 'Short/TikTok (60 Sekunden)'} Skript auf Deutsch für "PokéMarket Intelligence".\n\nAktuelle Top-Karten:\n${cardInfo}\n\nAntworte im JSON-Format:\n{\n  "title": "...",\n  "description": "...",\n  "tags": [...],\n  "voiceoverText": "...",\n  "scenes": [{"type": "intro", "duration": 10, "text": "...", "narration": "..."}]\n}`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

  let parsed: Partial<VideoScript>;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    parsed = {
      title: 'Top 5 Pokémon Investment-Karten diese Woche',
      description: 'Wöchentliche Marktanalyse',
      tags: ['pokémon', 'investment', 'karten'],
      voiceoverText: 'Willkommen bei PokéMarket Intelligence...',
      scenes: [],
    };
  }

  return {
    title: parsed.title || '',
    description: parsed.description || '',
    tags: parsed.tags || [],
    duration,
    scenes: parsed.scenes || [],
    voiceoverText: parsed.voiceoverText || '',
    format,
  };
}

export async function generateSocialPosts(
  cards: PokemonCard[],
  summary: MarketSummary
): Promise<SocialPost[]> {
  const topCard = cards[0];
  const cardInfo = `${topCard?.name} (${topCard?.set}): ${formatPrice(topCard)}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Erstelle 3 Social-Media-Posts auf Deutsch für "PokéMarket Intelligence".\n\nHighlight: ${cardInfo}\nMarkttrend: ${summary.weeklyReport.slice(0, 200)}\n\nAntworte im JSON-Format:\n[\n  {"platform": "instagram", "caption": "...", "hashtags": [...]},\n  {"platform": "twitter", "caption": "...", "hashtags": [...]},\n  {"platform": "tiktok", "caption": "...", "hashtags": [...]}\n]`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch?.[0] || '[]');
  } catch {
    return [];
  }
}

function formatPrice(card: PokemonCard): string {
  const price = card.prices.holofoil?.market || card.prices.market || 0;
  return price > 0 ? `${price.toFixed(2)} €` : 'N/A';
}
