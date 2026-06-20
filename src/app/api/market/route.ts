import { NextResponse } from 'next/server';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary } from '@/lib/ai-generator';

export async function GET() {
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
