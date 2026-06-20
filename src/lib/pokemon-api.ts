import axios from 'axios';
import { PokemonCard, CardPrices } from '@/types';

const TCG_API_BASE = 'https://api.pokemontcg.io/v2';
const CARDMARKET_BASE = 'https://api.cardmarket.com/ws/v2.0';

export async function fetchTrendingCards(limit = 20): Promise<PokemonCard[]> {
  const sets = ['sv8', 'sv7', 'sv6', 'sv5', 'sv4'];
  const randomSet = sets[Math.floor(Math.random() * sets.length)];

  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '',
    },
    params: {
      q: `set.id:${randomSet} (rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:"Special Illustration Rare")`,
      pageSize: limit,
    },
  });

  const cards: PokemonCard[] = response.data.data.map(mapApiCardToCard);
  return cards.sort((a, b) => {
    const pa = a.prices.holofoil?.market || a.prices.market || 0;
    const pb = b.prices.holofoil?.market || b.prices.market || 0;
    return pb - pa;
  });
}

export async function fetchCardsBySet(setCode: string): Promise<PokemonCard[]> {
  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '',
    },
    params: {
      q: `set.id:${setCode}`,
      pageSize: 50,
    },
  });

  const cards: PokemonCard[] = response.data.data.map(mapApiCardToCard);
  return cards.sort((a, b) => {
    const pa = a.prices.holofoil?.market || a.prices.market || 0;
    const pb = b.prices.holofoil?.market || b.prices.market || 0;
    return pb - pa;
  });
}

export async function fetchTopValueCards(limit = 10): Promise<PokemonCard[]> {
  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '',
    },
    params: {
      q: '(rarity:"Special Illustration Rare" OR rarity:"Hyper Rare")',
      pageSize: limit,
    },
  });

  const cards: PokemonCard[] = response.data.data.map(mapApiCardToCard);
  return cards.sort((a, b) => {
    const pa = a.prices.holofoil?.market || a.prices.market || 0;
    const pb = b.prices.holofoil?.market || b.prices.market || 0;
    return pb - pa;
  });
}

export async function fetchCardById(id: string): Promise<PokemonCard | null> {
  try {
    const response = await axios.get(`${TCG_API_BASE}/cards/${id}`, {
      headers: {
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '',
      },
    });
    return mapApiCardToCard(response.data.data);
  } catch {
    return null;
  }
}

export async function fetchRecentSets(): Promise<Array<{ id: string; name: string; releaseDate: string }>> {
  const response = await axios.get(`${TCG_API_BASE}/sets`, {
    headers: {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '',
    },
    params: {
      orderBy: '-releaseDate',
      pageSize: 10,
    },
  });

  return response.data.data.map((set: { id: string; name: string; releaseDate: string }) => ({
    id: set.id,
    name: set.name,
    releaseDate: set.releaseDate,
  }));
}

// Simulate price history for demonstration (replace with real DB data)
export function generatePriceHistory(basePrice: number, days = 30) {
  const history = [];
  let price = basePrice * 0.8;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.45) * 0.08;
    price = Math.max(0.01, price * (1 + change));
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
    });
  }
  return history;
}

export function calculateInvestmentScore(card: PokemonCard): number {
  let score = 50;
  const price = card.prices.holofoil?.market || card.prices.market || 0;

  if (price > 100) score += 20;
  else if (price > 50) score += 10;
  else if (price > 20) score += 5;

  if (card.rarity === 'Special Illustration Rare') score += 15;
  if (card.rarity === 'Hyper Rare') score += 20;
  if (card.rarity === 'Rare Ultra') score += 10;

  if (card.trendPercent && card.trendPercent > 10) score += 10;
  if (card.trendPercent && card.trendPercent < -10) score -= 15;

  return Math.min(100, Math.max(0, score));
}

function mapApiCardToCard(apiCard: Record<string, unknown>): PokemonCard {
  const tcgprices = apiCard.tcgplayer as Record<string, unknown> | undefined;
  const priceData = (tcgprices?.prices as Record<string, unknown>) || {};

  const prices: CardPrices = {
    market: (tcgprices as Record<string, number> | undefined)?.market,
    holofoil: priceData.holofoil as CardPrices['holofoil'],
    reverseHolofoil: priceData.reverseHolofoil as CardPrices['reverseHolofoil'],
    normal: priceData.normal as CardPrices['normal'],
  };

  const images = apiCard.images as Record<string, string> | undefined;
  const setData = apiCard.set as Record<string, unknown> | undefined;
  const trendPercent = (Math.random() - 0.4) * 30;

  const card: PokemonCard = {
    id: apiCard.id as string,
    name: apiCard.name as string,
    set: (setData?.name as string) || '',
    setCode: (setData?.id as string) || '',
    rarity: (apiCard.rarity as string) || 'Unknown',
    imageUrl: images?.small || '',
    imageUrlHiRes: images?.large,
    prices,
    trendPercent: Math.round(trendPercent * 10) / 10,
  };

  card.investmentScore = calculateInvestmentScore(card);
  return card;
}
