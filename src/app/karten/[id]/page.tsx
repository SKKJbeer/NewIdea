import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Star, ShoppingCart, ExternalLink } from 'lucide-react';
import { fetchCardById, generatePriceHistory, calculateInvestmentScore } from '@/lib/pokemon-api';
import { PriceChart } from '@/components/PriceChart';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await fetchCardById(id);
  if (!card) return { title: 'Karte nicht gefunden' };
  return {
    title: `${card.name} — PokéMarket Intelligence`,
    description: `Aktuelle Preise, Investment-Score und Preis-Historie für ${card.name} (${card.set}).`,
  };
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const card = await fetchCardById(id);
  if (!card) notFound();

  const price = card.prices.holofoil?.market || card.prices.market || 0;
  const trend = card.trendPercent || 0;
  const isPositive = trend >= 0;
  const score = calculateInvestmentScore(card);
  const history = generatePriceHistory(price, 30);

  const scoreColor =
    score >= 70 ? 'text-green-600 bg-green-50' :
    score >= 50 ? 'text-yellow-600 bg-yellow-50' :
    'text-gray-500 bg-gray-50';

  const scoreLabel =
    score >= 70 ? 'Starkes Investment' :
    score >= 50 ? 'Mittleres Potenzial' :
    'Vorsicht geboten';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Alle Karten
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Card image */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-4 w-full max-w-xs">
              {card.imageUrlHiRes || card.imageUrl ? (
                <img
                  src={card.imageUrlHiRes || card.imageUrl}
                  alt={card.name}
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
                <ShoppingCart size={18} />
                Auf Cardmarket kaufen
                <ExternalLink size={14} className="opacity-70" />
              </a>
              <a
                href={`https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${card.name} Karte`)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-xl py-2.5 font-semibold text-sm transition-colors"
              >
                Amazon
                <ExternalLink size={12} className="opacity-70" />
              </a>
              <p className="text-xs text-gray-400 text-center">
                * Affiliate-Links — wir erhalten eine kleine Provision
              </p>
            </div>
          </div>

          {/* Right: Info */}
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{card.set}</p>
              <h1 className="text-2xl font-black text-gray-900">{card.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{card.rarity}</p>

              <div className="flex items-end gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400">Marktpreis</p>
                  <p className="text-3xl font-black text-gray-900">
                    {price > 0 ? `${price.toFixed(2)} €` : 'N/A'}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold pb-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isPositive ? '+' : ''}{trend.toFixed(1)}% (30d)
                </div>
              </div>
            </div>

            {/* Investment Score */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">Investment-Score</h2>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor}`}>
                  {score}/100
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-gray-400'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Star size={14} className={score >= 70 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                {scoreLabel}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Der Score berücksichtigt Rarität, aktuellen Preis und Kursentwicklung.
                Kein Anlageversprechen.
              </p>
            </div>

            {/* Price details */}
            {(card.prices.holofoil || card.prices.reverseHolofoil) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 mb-3">Preis-Details</h2>
                <div className="space-y-2 text-sm">
                  {card.prices.holofoil?.market && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Holofoil (Markt)</span>
                      <span className="font-semibold">{card.prices.holofoil.market.toFixed(2)} €</span>
                    </div>
                  )}
                  {card.prices.holofoil?.low && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tiefstkurs</span>
                      <span className="font-semibold text-green-600">{card.prices.holofoil.low.toFixed(2)} €</span>
                    </div>
                  )}
                  {card.prices.holofoil?.high && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Höchstkurs</span>
                      <span className="font-semibold text-red-500">{card.prices.holofoil.high.toFixed(2)} €</span>
                    </div>
                  )}
                  {card.prices.reverseHolofoil?.market && (
                    <div className="flex justify-between border-t border-gray-50 pt-2">
                      <span className="text-gray-500">Reverse Holo (Markt)</span>
                      <span className="font-semibold">{card.prices.reverseHolofoil.market.toFixed(2)} €</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price history chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Preis-Historie (30 Tage)</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              Simulierte Daten — Echtdaten nach DB-Integration
            </span>
          </div>
          <PriceChart data={history} />
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Alle Preisangaben in EUR ohne Gewähr. Kein Anlageversprechen.
          Pokémon ist eine Marke von Nintendo/Creatures Inc./GAME FREAK inc.
        </p>
      </div>
    </div>
  );
}
