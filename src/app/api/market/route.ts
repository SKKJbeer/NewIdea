import { NextResponse } from 'next/server';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary } from '@/lib/ai-generator';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';

// ACHTUNG: Dieser Endpunkt löst pro Aufruf eine vollständige KI-Generierung aus
// und kostet damit echtes Geld. Er war ohne jede Prüfung per GET erreichbar —
// jeder Crawler, Bot oder Scanner konnte ihn auslösen. Genau so lässt sich ein
// Guthaben leerlaufen, ohne dass ein einziger Besucher etwas davon hat.
export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cards = await fetchTrendingCards(20);
    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));
    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Market summary error:', error);
    return NextResponse.json({ error: 'Failed to generate market summary' }, { status: 500 });
  }
}
