'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PokemonCard } from '@/types';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { BoosterPackImage } from './BoosterPackImage';

interface CardGridProps {
  cards: PokemonCard[];
  title?: string;
  compact?: boolean;
  priceOverrides?: Record<string, number>;
  priceLanguage?: string;
}

export function CardGrid({ cards, title, compact = false, priceOverrides = {}, priceLanguage = 'EN' }: CardGridProps) {
  return (
    <section>
      {title && <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>}
      <div className={compact
        ? 'grid grid-cols-3 sm:grid-cols-6 gap-2'
        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
      }>
        {cards.map((card) => (
          <CardItem key={card.id} card={card} compact={compact} priceOverride={priceOverrides[card.id]} priceLanguage={priceLanguage} />
        ))}
      </div>
    </section>
  );
}

function CardItem({ card, compact, priceOverride, priceLanguage = 'EN' }: { card: PokemonCard; compact?: boolean; priceOverride?: number; priceLanguage?: string }) {
  const price = priceOverride ?? (card.prices.market || card.prices.holofoil?.market || 0);
  const trend = card.trendPercent || 0;
  const isPositive = trend >= 0;
  const score = card.investmentScore || 0;

  if (compact) {
    return (
      <Link href={`/karten/${card.id}`} className="block group">
        <div className="bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm transition-all overflow-hidden">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-violet-50 to-indigo-50">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="(max-width: 640px) 33vw, 16vw"
                className="object-contain group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🃏</div>
            )}
          </div>
          <div className="p-1.5">
            <p className="text-[10px] font-semibold text-gray-800 leading-tight line-clamp-1">{card.name}</p>
            <p className="text-[10px] font-bold text-gray-600 tabular-nums">
              {price > 0 ? `${price.toFixed(0)} €` : '—'}
              {priceLanguage !== 'EN' && <span className="ml-1 text-[9px] text-violet-500">{priceLanguage}</span>}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/karten/${card.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer">
        <div className="relative bg-gradient-to-br from-violet-50 to-indigo-50 p-3 aspect-[3/4]">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain group-hover:scale-105 transition-transform duration-300 p-3"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🃏</div>
          )}
          <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-0.5 text-xs font-bold shadow z-10">
            <span className={score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-gray-500'}>
              {score}
            </span>
          </div>
        </div>

        <div className="p-3">
          <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{card.name}</p>
          {card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase() && (
            <p className="text-xs text-violet-500 leading-tight line-clamp-1">🇩🇪 {card.nameDe}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            {card.setCode && (
              <BoosterPackImage
                setCode={card.setCode}
                setName={card.set}
                className="h-5 w-auto object-contain shrink-0"
              />
            )}
            <p className="text-xs text-gray-400 line-clamp-1 min-w-0">{card.set}</p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-base font-bold text-gray-900">
                {price > 0 ? `${price.toFixed(2)} €` : 'N/A'}
              </span>
              {priceLanguage !== 'EN' && (
                <span className="ml-1.5 text-[10px] font-bold text-violet-500">{priceLanguage}</span>
              )}
            </div>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-1">
              <Star size={10} className={score >= 70 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
              <div className="flex-1 bg-gray-100 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-gray-400'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 block w-full text-center text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-1.5 transition-colors">
            Details &amp; Kaufen →
          </div>
        </div>
      </div>
    </Link>
  );
}
