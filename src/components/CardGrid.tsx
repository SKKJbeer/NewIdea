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
      {title && (
        <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          {title}
        </h2>
      )}
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
        <div className="bg-[#13131e] rounded-xl border border-[#2a2a3a] hover:border-violet-500/30 active:scale-[0.97] active:border-violet-500/50 transition-all overflow-hidden">
          <div className="relative aspect-[3/4] bg-[#1a1a28]">
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
            <p className="text-[10px] font-semibold text-slate-300 leading-tight line-clamp-1">{card.name}</p>
            <p className="text-[10px] font-bold text-slate-400 tabular-nums">
              {price > 0 ? `${price.toFixed(0)} €` : '—'}
              {priceLanguage !== 'EN' && <span className="ml-1 text-[9px] text-violet-400">{priceLanguage}</span>}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/karten/${card.id}`} className="block group">
      <div className="bg-[#13131e] rounded-xl border border-[#2a2a3a] hover:border-violet-500/30 active:scale-[0.97] active:border-violet-500/50 transition-all duration-200 overflow-hidden cursor-pointer">
        <div className="relative bg-[#1a1a28] p-3 aspect-[3/4]">
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
          <div className="absolute top-2 right-2 bg-[#13131e] border border-[#2a2a3a] rounded-full px-2 py-0.5 text-xs font-bold z-10">
            <span className={score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-slate-600'}>
              {score}
            </span>
          </div>
        </div>

        <div className="p-3">
          <p className="font-semibold text-slate-200 text-sm leading-tight line-clamp-1">{card.name}</p>
          {card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase() && (
            <p className="text-xs text-violet-400 leading-tight line-clamp-1">🇩🇪 {card.nameDe}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            {card.setCode && (
              <BoosterPackImage
                setCode={card.setCode}
                setName={card.set}
                className="h-5 w-auto object-contain shrink-0"
              />
            )}
            <p className="text-xs text-slate-600 line-clamp-1 min-w-0">{card.set}</p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-base font-bold text-slate-200">
                {price > 0 ? `${price.toFixed(2)} €` : 'N/A'}
              </span>
              {priceLanguage !== 'EN' && (
                <span className="ml-1.5 text-[10px] font-bold text-violet-400">{priceLanguage}</span>
              )}
            </div>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-1">
              <Star size={10} className={score >= 70 ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
              <div className="flex-1 bg-[#2a2a3a] rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-slate-700'}`}
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
