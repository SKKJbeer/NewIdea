import { NextResponse } from 'next/server';
import { fetchTrendingCards, fetchTopValueCards } from '@/lib/pokemon-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'trending';
  const limit = parseInt(searchParams.get('limit') || '20');
  try {
    const cards = type === 'value' ? await fetchTopValueCards(limit) : await fetchTrendingCards(limit);
    return NextResponse.json({ cards, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Cards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
