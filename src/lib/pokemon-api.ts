import axios from 'axios';
import { PokemonCard, CardPrices } from '@/types';
import { germanToEnglishName, englishToGermanName } from './pokemon-names-de';

const TCG_API_BASE = 'https://api.pokemontcg.io/v2';

// Only send the API key header if a key is actually configured.
// An empty X-Api-Key header causes the API to return 403; no header = free-tier access.
function tcgHeaders(): Record<string, string> {
  const key = process.env.POKEMON_TCG_API_KEY;
  return key ? { 'X-Api-Key': key } : {};
}

// Deterministisch per ISO-Kalenderwoche — gleiche Woche, gleiche Karten, cachebar.
function weeklySetIndex(count: number): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 86400000));
  return week % count;
}

export async function fetchTrendingCards(limit = 20): Promise<PokemonCard[]> {
  const sets = ['sv8', 'sv7', 'sv6', 'sv5', 'sv4', 'sv3pt5'];
  const selectedSet = sets[weeklySetIndex(sets.length)];

  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: { ...tcgHeaders() },
    params: {
      q: `set.id:${selectedSet} (rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:"Special Illustration Rare")`,
      pageSize: limit,
    },
    timeout: 8000,
  });

  const cards: PokemonCard[] = response.data.data.map(mapApiCardToCard);
  return cards.sort((a, b) => {
    const pa = a.prices.market || a.prices.holofoil?.market || 0;
    const pb = b.prices.market || b.prices.holofoil?.market || 0;
    return pb - pa;
  });
}

export async function fetchCardsBySet(setCode: string): Promise<PokemonCard[]> {
  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: {
      ...tcgHeaders(),
    },
    params: {
      q: `set.id:${setCode}`,
      pageSize: 50,
    },
  });

  const cards: PokemonCard[] = response.data.data.map(mapApiCardToCard);
  return cards.sort((a, b) => {
    const pa = a.prices.market || a.prices.holofoil?.market || 0;
    const pb = b.prices.market || b.prices.holofoil?.market || 0;
    return pb - pa;
  });
}

export async function fetchTopValueCards(limit = 10): Promise<PokemonCard[]> {
  const queries = [
    '(rarity:"Special Illustration Rare" OR rarity:"Hyper Rare")',
    'rarity:"Rare Holo EX"',
    'set.id:sv8',
  ];

  for (const q of queries) {
    try {
      const response = await axios.get(`${TCG_API_BASE}/cards`, {
        headers: { ...tcgHeaders() },
        params: { q, pageSize: limit },
        timeout: 8000,
      });
      const cards: PokemonCard[] = response.data.data.map(mapApiCardToCard);
      if (cards.length > 0) {
        return cards.sort((a, b) => {
          const pa = a.prices.market || a.prices.holofoil?.market || 0;
          const pb = b.prices.market || b.prices.holofoil?.market || 0;
          return pb - pa;
        });
      }
    } catch {
      // Try next query
    }
  }
  return [];
}

export async function searchCards(query: string, limit = 30): Promise<PokemonCard[]> {
  const term = query.trim();
  if (!term) return [];

  // Deutsche Eingabe (z.B. "Glurak") in den englischen Namen ("Charizard") übersetzen,
  // den die TCG-API erwartet. Englische Eingaben bleiben unverändert.
  const translated = germanToEnglishName(term);

  // TCG-API: Wildcard-Suche über den Kartennamen, z.B. name:"*charizard*"
  // Lucene-Query-Metazeichen entfernen, damit Nutzereingaben nicht aus dem name-Feld
  // ausbrechen können (z.B. `") OR set.id:(*` zur Enumeration beliebiger Karten).
  const escaped = translated.replace(/["*?:()\[\]{}^~\\+\-!&|]/g, '').trim();
  if (!escaped) return [];
  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: {
      ...tcgHeaders(),
    },
    params: {
      q: `name:"*${escaped}*"`,
      pageSize: limit,
      orderBy: '-set.releaseDate',
    },
  });

  const cards: PokemonCard[] = response.data.data.map(mapApiCardToCard);
  // Karten mit Preis zuerst, dann nach Marktpreis absteigend
  return cards.sort((a, b) => {
    const pa = a.prices.market || a.prices.holofoil?.market || 0;
    const pb = b.prices.market || b.prices.holofoil?.market || 0;
    return pb - pa;
  });
}

export async function fetchCardById(id: string): Promise<PokemonCard | null> {
  try {
    const response = await axios.get(`${TCG_API_BASE}/cards/${id}`, {
      headers: {
        ...tcgHeaders(),
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
      ...tcgHeaders(),
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

// Baut einen 30-Tage-Verlauf aus den ECHTEN Cardmarket-Durchschnittspreisen.
// Ankerpunkte: avg30 (vor 30 Tagen), avg7 (vor 7 Tagen), avg1 (gestern), trendPrice (heute).
// Zwischen den Ankern wird linear interpoliert — die Eckwerte sind reale Marktdaten.
export function buildCardmarketHistory(cm: Record<string, number>): { date: string; price: number }[] {
  const today = new Date();
  const anchors: Array<{ daysAgo: number; price: number }> = [];
  if (cm.avg30 > 0) anchors.push({ daysAgo: 30, price: cm.avg30 });
  if (cm.avg7 > 0) anchors.push({ daysAgo: 7, price: cm.avg7 });
  if (cm.avg1 > 0) anchors.push({ daysAgo: 1, price: cm.avg1 });
  const current = cm.trendPrice || cm.averageSellPrice;
  if (current > 0) anchors.push({ daysAgo: 0, price: current });

  if (anchors.length < 2) return [];
  anchors.sort((a, b) => b.daysAgo - a.daysAgo); // ältester zuerst

  const series: { date: string; price: number }[] = [];
  const push = (daysAgo: number, price: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    series.push({ date: d.toISOString().split('T')[0], price: Math.round(price * 100) / 100 });
  };
  for (let i = 0; i < anchors.length - 1; i++) {
    const start = anchors[i];
    const end = anchors[i + 1];
    const span = start.daysAgo - end.daysAgo;
    for (let step = 0; step < span; step++) {
      const frac = step / span;
      push(start.daysAgo - step, start.price + (end.price - start.price) * frac);
    }
  }
  const last = anchors[anchors.length - 1];
  push(last.daysAgo, last.price);
  return series;
}

// Fallback-Verlauf, wenn keine Cardmarket-Daten vorliegen (klar als Beispiel gekennzeichnet in der UI).
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
  const price = card.prices.market || card.prices.holofoil?.market || 0;

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

  // Cardmarket = echte EUR-Daten (für deutsche Community bevorzugt)
  const cmRoot = apiCard.cardmarket as Record<string, unknown> | undefined;
  const cm = (cmRoot?.prices as Record<string, number>) || undefined;

  const eurPrice = cm ? (cm.trendPrice || cm.averageSellPrice || cm.avg7 || cm.avg30 || 0) : 0;
  const tcgHolo = priceData.holofoil as CardPrices['holofoil'];
  const tcgNormal = priceData.normal as CardPrices['normal'];
  const tcgMarket = tcgHolo?.market || tcgNormal?.market || 0;

  const prices: CardPrices = {
    market: eurPrice || tcgMarket,
    holofoil: tcgHolo,
    reverseHolofoil: priceData.reverseHolofoil as CardPrices['reverseHolofoil'],
    normal: tcgNormal,
  };

  // Echter Trend aus Cardmarket: aktueller Trendpreis vs. 30-Tage-Schnitt
  let trendPercent = 0;
  let realData = false;
  let priceHistory: PokemonCard['priceHistory'];
  if (cm && cm.avg30 > 0) {
    const current = cm.trendPrice || cm.avg1 || cm.averageSellPrice || cm.avg30;
    trendPercent = ((current - cm.avg30) / cm.avg30) * 100;
    realData = true;
    const hist = buildCardmarketHistory(cm);
    if (hist.length >= 2) priceHistory = hist;
  }

  const images = apiCard.images as Record<string, string> | undefined;
  const setData = apiCard.set as Record<string, unknown> | undefined;

  const cardName = apiCard.name as string;
  const card: PokemonCard = {
    id: apiCard.id as string,
    name: cardName,
    nameDe: englishToGermanName(cardName) || undefined,
    set: (setData?.name as string) || '',
    setCode: (setData?.id as string) || '',
    rarity: (apiCard.rarity as string) || 'Unknown',
    imageUrl: images?.small || '',
    imageUrlHiRes: images?.large,
    prices,
    priceHistory,
    trendPercent: Math.round(trendPercent * 10) / 10,
    priceSource: eurPrice ? 'cardmarket' : tcgMarket ? 'tcgplayer' : 'none',
    realData,
  };

  card.investmentScore = calculateInvestmentScore(card);
  return card;
}
