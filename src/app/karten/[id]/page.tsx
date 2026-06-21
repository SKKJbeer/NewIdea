import { notFound } from 'next/navigation';
import { after } from 'next/server';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Star, ShoppingCart, ExternalLink } from 'lucide-react';
import { fetchCardById, generatePriceHistory, calculateInvestmentScore } from '@/lib/pokemon-api';
import { getStoredPriceHistory, recordPriceSnapshot } from '@/lib/price-history';
import { PriceChart } from '@/components/PriceChart';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await fetchCardById(id);
  if (!card) return { title: 'Karte nicht gefunden' };

  const price = card.prices.market || card.prices.holofoil?.market || 0;
  const priceStr = price > 0 ? ` — ${price.toFixed(2)} €` : '';
  const nameStr = card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase()
    ? `${card.name} (${card.nameDe})`
    : card.name;

  return {
    title: `${nameStr}${priceStr} Pokémon Karte Preis`,
    description: `${card.name} aus ${card.set} — Cardmarket Preis: ${price > 0 ? price.toFixed(2) + ' €' : 'k. A.'}, Seltenheit: ${card.rarity}. Investment-Score & 30-Tage-Preisverlauf kostenlos ansehen.`,
    openGraph: {
      title: `${card.name} — Pokémon Karte Preis`,
      description: `Aktueller Cardmarket-Preis für ${card.name} (${card.set}): ${price > 0 ? price.toFixed(2) + ' €' : 'k. A.'}.`,
      images: card.imageUrlHiRes ? [{ url: card.imageUrlHiRes, alt: card.name }] : undefined,
      type: 'article',
    },
    alternates: {
      canonical: `${SITE_URL}/karten/${id}`,
    },
  };
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const card = await fetchCardById(id);
  if (!card) notFound();

  const price = card.prices.market || card.prices.holofoil?.market || 0;
  const trend = card.trendPercent || 0;
  const isPositive = trend >= 0;
  const score = calculateInvestmentScore(card);

  after(async () => {
    await recordPriceSnapshot(card);
  });

  const stored = await getStoredPriceHistory(id, 90);
  let history: { date: string; price: number }[];
  let historyKind: 'daily' | 'cardmarket' | 'sample';
  if (stored.length >= 2) {
    history = stored;
    historyKind = 'daily';
  } else if (card.realData && card.priceHistory && card.priceHistory.length >= 2) {
    history = card.priceHistory;
    historyKind = 'cardmarket';
  } else {
    history = generatePriceHistory(price, 30);
    historyKind = 'sample';
  }
  const realData = historyKind !== 'sample';

  const scoreColor =
    score >= 70 ? 'text-green-600 bg-green-50' : score >= 50 ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 bg-gray-50';
  const scoreLabel =
    score >= 70 ? 'Starkes Investment' : score >= 50 ? 'Mittleres Potenzial' : 'Vorsicht geboten';

  // JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.name,
    description: `Pokémon-Sammelkarte ${card.name} aus dem Set ${card.set}. Seltenheit: ${card.rarity}.`,
    image: card.imageUrlHiRes || card.imageUrl,
    brand: { '@type': 'Brand', name: 'Pokémon TCG' },
    category: 'Pokémon Sammelkarte',
    ...(price > 0 && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        price: price.toFixed(2),
        priceValidUntil: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/karten/${id}`,
        seller: { '@type': 'Organization', name: 'Cardmarket' },
      },
    }),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: score,
      bestRating: 100,
      worstRating: 0,
      ratingCount: 1,
      description: scoreLabel,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 text-sm mb-6">
          <ArrowLeft size={16} />Alle Karten
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-4 w-full max-w-xs">
              {card.imageUrlHiRes || card.imageUrl ? (
                <img
                  src={card.imageUrlHiRes || card.imageUrl}
                  alt={`${card.name} Pokémon Karte`}
                  className="w-full h-auto object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-6xl">🃏</div>
              )}
            </div>
            <div className="mt-4 w-full space-y-2">
              <a
                href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold transition-colors"
              >
                <ShoppingCart size={18} />Auf Cardmarket kaufen<ExternalLink size={14} className="opacity-70" />
              </a>
              <a
                href={`https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${card.name} Karte`)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-xl py-2.5 font-semibold text-sm transition-colors"
              >
                Amazon<ExternalLink size={12} className="opacity-70" />
              </a>
              <p className="text-xs text-gray-400 text-center">* Affiliate-Links</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{card.set}</p>
              <h1 className="text-2xl font-black text-gray-900">{card.name}</h1>
              {card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase() && (
                <p className="text-sm font-semibold text-violet-600 mt-0.5">🇩🇪 {card.nameDe}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{card.rarity}</p>
              <div className="flex items-end gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400">
                    Marktpreis{card.priceSource === 'cardmarket' ? ' (Cardmarket)' : ''}
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {price > 0 ? `${price.toFixed(2)} €` : 'N/A'}
                  </p>
                </div>
                {realData && (
                  <div className={`flex items-center gap-1 text-sm font-semibold pb-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {isPositive ? '+' : ''}{trend.toFixed(1)}% (30d)
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">Investment-Score</h2>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor}`}>{score}/100</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-gray-400'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Star size={14} className={score >= 70 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                {scoreLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="font-bold text-gray-900">
              Preis-Historie ({history.length} {history.length === 1 ? 'Tag' : 'Tage'})
            </h2>
            {historyKind === 'daily' ? (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                ✓ Echte Preise · täglich erfasst
              </span>
            ) : historyKind === 'cardmarket' ? (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                ✓ Cardmarket-Durchschnitte
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                Beispielhafter Verlauf
              </span>
            )}
          </div>
          <PriceChart data={history} />
          {historyKind === 'daily' ? (
            <p className="text-xs text-gray-400 mt-3">
              Echte Cardmarket-Preise — ab jetzt täglich erfasst. Der Verlauf wird mit jedem Tag dichter und genauer.
            </p>
          ) : historyKind === 'cardmarket' ? (
            <p className="text-xs text-gray-400 mt-3">
              Basierend auf realen Cardmarket-Durchschnittspreisen (Ø 1/7/30 Tage &amp; Trend), zwischen den Eckwerten interpoliert. Sobald täglich Preise erfasst werden, entsteht hier ein tag-genauer Verlauf.
            </p>
          ) : (
            <p className="text-xs text-amber-600 mt-3">
              Für diese Karte liegen aktuell keine Cardmarket-Verlaufsdaten vor — die Kurve ist nur ein Beispiel.
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Preise: Cardmarket (EUR), ohne Gewähr. Kein Anlageversprechen.
        </p>
      </div>
    </div>
  );
}
