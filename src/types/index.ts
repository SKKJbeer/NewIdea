export interface PokemonCard {
  id: string;
  name: string;
  set: string;
  setCode: string;
  rarity: string;
  imageUrl: string;
  imageUrlHiRes?: string;
  prices: CardPrices;
  priceHistory?: PriceDataPoint[];
  investmentScore?: number;
  trendPercent?: number;
}

export interface CardPrices {
  market?: number;
  low?: number;
  mid?: number;
  high?: number;
  directLow?: number;
  holofoil?: { low: number; mid: number; high: number; market: number };
  reverseHolofoil?: { low: number; mid: number; high: number; market: number };
  normal?: { low: number; mid: number; high: number; market: number };
}

export interface PriceDataPoint {
  date: string;
  price: number;
  volume?: number;
}

export interface MarketSummary {
  topGainers: PokemonCard[];
  topLosers: PokemonCard[];
  trending: PokemonCard[];
  weeklyReport: string;
  generatedAt: string;
}

export interface NewsletterContent {
  subject: string;
  preheader: string;
  htmlContent: string;
  textContent: string;
  topCards: PokemonCard[];
  generatedAt: string;
}

export interface VideoScript {
  title: string;
  description: string;
  tags: string[];
  duration: number;
  scenes: VideoScene[];
  voiceoverText: string;
  format: 'youtube' | 'shorts' | 'tiktok';
}

export interface VideoScene {
  duration: number;
  type: 'intro' | 'card_spotlight' | 'chart' | 'cta' | 'outro';
  cardId?: string;
  text: string;
  narration: string;
}

export interface SocialPost {
  platform: 'instagram' | 'twitter' | 'tiktok';
  caption: string;
  hashtags: string[];
  imagePrompt?: string;
  scheduledFor?: string;
}
