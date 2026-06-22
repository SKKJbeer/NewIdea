import { NextResponse } from 'next/server';
import { fetchCardById } from '@/lib/pokemon-api';
import { PriceDataPoint } from '@/types';

export const maxDuration = 30;

interface LiveCardData {
  price: number;
  priceHistory: PriceDataPoint[];
  name: string;
  set: string;
  setCode: string;
  imageUrl: string;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { cardIds?: unknown };
  const cardIds = Array.isArray(body.cardIds) ? (body.cardIds as string[]).slice(0, 50) : [];
  if (cardIds.length === 0) return NextResponse.json({});

  const results = await Promise.allSettled(cardIds.map((id) => fetchCardById(id)));

  const data: Record<string, LiveCardData> = {};
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value) {
      const card = result.value;
      data[cardIds[i]] = {
        price: card.prices.market || card.prices.holofoil?.market || 0,
        priceHistory: card.priceHistory ?? [],
        name: card.name,
        set: card.set,
        setCode: card.setCode,
        imageUrl: card.imageUrl,
      };
    }
  });

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
