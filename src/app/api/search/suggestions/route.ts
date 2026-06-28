import { searchCards, displayPrice } from '@/lib/pokemon-api';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json([]);

  try {
    const cards = await searchCards(q, 20);
    const suggestions = cards.map((c) => ({
      id: c.id,
      name: c.name,
      nameDe: c.nameDe,
      imageUrl: c.imageUrl,
      price: displayPrice(c),
      set: c.set,
    }));
    return NextResponse.json(suggestions, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json([]);
  }
}
