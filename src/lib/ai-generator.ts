import Anthropic from '@anthropic-ai/sdk';
import { PokemonCard, NewsletterContent, VideoScript, SocialPost, MarketSummary } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-opus-4-8';

function formatPrice(card: PokemonCard): string {
  const price = card.prices.holofoil?.market || card.prices.market || 0;
  return price > 0 ? `${price.toFixed(2)} €` : 'N/A';
}

export async function generateMarketSummary(cards: PokemonCard[], topGainers: PokemonCard[], topLosers: PokemonCard[]): Promise<MarketSummary> {
  const cardData = cards.slice(0, 10).map((c) => `${c.name} (${c.set}): ${formatPrice(c)} | Trend: ${c.trendPercent?.toFixed(1)}%`).join('\n');
  const message = await client.messages.create({
    model: MODEL, max_tokens: 1024,
    messages: [{ role: 'user', content: `Du bist ein Pokémon-Karten-Marktexperte. Analysiere diese Karten-Daten und erstelle einen prägnanten deutschen Marktbericht (max. 150 Wörter):\n\nAktuelle Karten-Preise:\n${cardData}\n\nTop-Gewinner: ${topGainers.map((c) => c.name).join(', ')}\nTop-Verlierer: ${topLosers.map((c) => c.name).join(', ')}\n\nFokus auf Trends und Investmentmöglichkeiten.` }],
  });
  const weeklyReport = message.content[0].type === 'text' ? message.content[0].text : '';
  return { topGainers: topGainers.slice(0, 5), topLosers: topLosers.slice(0, 5), trending: cards.slice(0, 8), weeklyReport, generatedAt: new Date().toISOString() };
}

export async function generateNewsletterContent(summary: MarketSummary, cards: PokemonCard[]): Promise<NewsletterContent> {
  const topCards = cards.slice(0, 5);
  const cardDetails = topCards.map((c, i) => `${i + 1}. ${c.name} (${c.set}) — ${formatPrice(c)} | Score: ${c.investmentScore}/100 | Trend: ${c.trendPercent?.toFixed(1)}%`).join('\n');
  const message = await client.messages.create({
    model: MODEL, max_tokens: 2048,
    messages: [{ role: 'user', content: `Erstelle einen wöchentlichen Pokémon-Investment-Newsletter auf Deutsch.\n\nMarktbericht:\n${summary.weeklyReport}\n\nTop-Karten:\n${cardDetails}\n\nAntworte im JSON-Format: {"subject": "...", "preheader": "...", "htmlContent": "...", "textContent": "..."}` }],
  });
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
  let parsed: { subject: string; preheader: string; htmlContent: string; textContent: string };
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    parsed = { subject: 'PokéMarket Weekly', preheader: 'Deine Marktanalyse', htmlContent: `<p>${summary.weeklyReport}</p>`, textContent: summary.weeklyReport };
  }
  return { ...parsed, topCards, generatedAt: new Date().toISOString() };
}

export async function generateVideoScript(cards: PokemonCard[], format: 'youtube' | 'shorts' | 'tiktok'): Promise<VideoScript> {
  const isShortForm = format === 'shorts' || format === 'tiktok';
  const duration = isShortForm ? 60 : 300;
  const topCards = cards.slice(0, isShortForm ? 3 : 5);
  const cardInfo = topCards.map((c) => `${c.name}: ${formatPrice(c)}, Trend: ${c.trendPercent?.toFixed(1)}%`).join('\n');
  const message = await client.messages.create({
    model: MODEL, max_tokens: 2048,
    messages: [{ role: 'user', content: `Erstelle ein ${format === 'youtube' ? 'YouTube (5 Min)' : 'Short/TikTok (60 Sek)'} Video-Skript auf Deutsch für "PokéMarket Intelligence".\n\nTop-Karten:\n${cardInfo}\n\nAntworte im JSON-Format: {"title": "...", "description": "...", "tags": [...], "voiceoverText": "...", "scenes": [{"type": "intro", "duration": 5, "text": "...", "narration": "..."}]}` }],
  });
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
  let parsed: Partial<VideoScript>;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    parsed = { title: 'Top Pokémon Investment-Karten', description: '', tags: [], voiceoverText: '', scenes: [] };
  }
  return { title: parsed.title || '', description: parsed.description || '', tags: parsed.tags || [], duration, scenes: parsed.scenes || [], voiceoverText: parsed.voiceoverText || '', format };
}

export async function generateSocialPosts(cards: PokemonCard[], summary: MarketSummary): Promise<SocialPost[]> {
  const topCard = cards[0];
  const message = await client.messages.create({
    model: MODEL, max_tokens: 1024,
    messages: [{ role: 'user', content: `Erstelle 3 Social-Media-Posts auf Deutsch für "PokéMarket Intelligence".\n\nHighlight: ${topCard?.name} — ${formatPrice(topCard)}\n\nAntworte im JSON-Format: [{"platform": "instagram", "caption": "...", "hashtags": [...]}, {"platform": "twitter", "caption": "...", "hashtags": [...]}, {"platform": "tiktok", "caption": "...", "hashtags": [...]}]` }],
  });
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch?.[0] || '[]');
  } catch { return []; }
}
