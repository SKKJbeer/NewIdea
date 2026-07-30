import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { splitMovers } from '@/lib/market-metrics';
import {
  generateMarketSummary,
  generateNewsletterContent,
  generateVideoScript,
  generateSocialPosts,
} from '@/lib/ai-generator';

// On-demand content generation for the control dashboard.
// Returns generated content for PREVIEW — does not auto-publish.
// ACHTUNG: Löst pro Aufruf eine vollständige KI-Generierung aus. War ohne
// jede Prüfung öffentlich erreichbar — das ist nicht nur ein Sicherheits-,
// sondern vor allem ein Kostenproblem (siehe /api/market).
export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = await request.json().catch(() => ({ type: 'market' }));

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Claude API-Key fehlt. Bitte ANTHROPIC_API_KEY in den Einstellungen setzen.' },
      { status: 400 }
    );
  }

  try {
    const cards = await fetchTrendingCards(20);
    // Zentrale Vorzeichen-Trennung statt derselben Liste zweimal sortiert —
    // siehe api/cron/route.ts.
    const { gainers, losers } = splitMovers(cards, 5);

    switch (type) {
      case 'market': {
        const summary = await generateMarketSummary(cards, gainers, losers);
        return NextResponse.json({ type, content: summary });
      }
      case 'newsletter': {
        const summary = await generateMarketSummary(cards, gainers, losers);
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
        const summary = await generateMarketSummary(cards, gainers, losers);
        const posts = await generateSocialPosts(cards, summary);
        return NextResponse.json({ type, content: posts });
      }
      default:
        return NextResponse.json({ error: 'Unbekannter Content-Typ' }, { status: 400 });
    }
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
