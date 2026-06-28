import { NextResponse } from 'next/server';
import { fetchCardById } from '@/lib/pokemon-api';
import { fetchCMLanguagePrice, type CardLanguage } from '@/lib/cardmarket-api';
import { PriceDataPoint } from '@/types';

export const maxDuration = 30;

interface CardRequest {
  id: string;
  language: CardLanguage;
  name: string;
}

interface LiveCardData {
  price: number;
  priceHistory: PriceDataPoint[];
  name: string;
  set: string;
  setCode: string;
  imageUrl: string;
  priceLanguage: CardLanguage;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    cards?: unknown[];
    cardIds?: unknown[];
  };

  let cards: CardRequest[];

  if (Array.isArray(body.cards)) {
    cards = (body.cards as Array<Record<string, unknown>>)
      .filter((c) => typeof c.id === 'string')
      .map((c) => ({
        id: c.id as string,
        language: ((c.language as string) || 'EN') as CardLanguage,
        name: (c.name as string) || '',
      }))
      .slice(0, 50);
  } else if (Array.isArray(body.cardIds)) {
    // Legacy format — treat all as English
    cards = (body.cardIds as string[])
      .filter((id) => typeof id === 'string')
      .map((id) => ({ id, language: 'EN' as CardLanguage, name: '' }))
      .slice(0, 50);
  } else {
    return NextResponse.json({});
  }

  if (cards.length === 0) return NextResponse.json({});

  // Begrenzt jede Karten-Verarbeitung zeitlich, damit eine hängende Upstream-API (TCG/Cardmarket)
  // nicht die ganze Funktion bis zum Vercel-Hardlimit (maxDuration) blockiert.
  const PER_CARD_TIMEOUT_MS = 8000;
  function withTimeout<T>(p: Promise<T>): Promise<T | null> {
    return Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), PER_CARD_TIMEOUT_MS)),
    ]);
  }

  const results = await Promise.allSettled(
    cards.map(async (c) => {
      const card = await withTimeout(fetchCardById(c.id));
      if (!card) return null;

      let price = card.prices.market || card.prices.holofoil?.market || 0;
      let priceLanguage: CardLanguage = 'EN';

      if (c.language !== 'EN') {
        const langPrice = await withTimeout(fetchCMLanguagePrice(c.name || card.name, c.language));
        if (langPrice !== null) {
          price = langPrice;
          priceLanguage = c.language;
        }
        // If CM not configured or no result, fall back to English Cardmarket price
      }

      return {
        id: c.id,
        data: {
          price,
          priceHistory: card.priceHistory ?? [],
          name: card.name,
          set: card.set,
          setCode: card.setCode,
          imageUrl: card.imageUrl,
          priceLanguage,
        } satisfies LiveCardData,
      };
    }),
  );

  const data: Record<string, LiveCardData> = {};
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      data[result.value.id] = result.value.data;
    }
  });

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
