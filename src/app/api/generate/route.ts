import { NextResponse } from 'next/server';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import {
  generateMarketSummary,
  generateNewsletterContent,
  generateVideoScript,
  generateSocialPosts,
} from '@/lib/ai-generator';

// On-demand content generation for the control dashboard.
// Returns generated content for PREVIEW — does not auto-publish.
export async function POST(request: Request) {
  const { type } = await request.json().catch(() => ({ type: 'market' }));

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Claude API-Key fehlt. Bitte ANTHROPIC_API_KEY in den Einstellungen setzen.' },
      { status: 400 }
    );
  }

  try {
    const cards = await fetchTrendingCards(20);
    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));

    switch (type) {
      case 'market': {
        const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
        return NextResponse.json({ type, content: summary });
      }
      case 'newsletter': {
        const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
        const newsletter = await generateNewsletterContent(summary, cards);
        return NextResponse.json({ type, content: newsletter });
      }
      case 'video-youtube': {
        const script = await generateVideoScript(cards, 'youtube');
        return NextResponse.json({ type, content: script });
      }
      case 'video-shorts': {
        const script = await generateVideoScript(cards.slice(0, 3), 'shorts');
        return NextResponse.json({ type, content: script });
      }
      case 'social': {
        const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
        const posts = await generateSocialPosts(cards, summary);
        return NextResponse.json({ type, content: posts });
      }
      default:
        return NextResponse.json({ error: 'Unbekannter Content-Typ' }, { status: 400 });
    }
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
