'use client';

import { PokemonCard } from '@/types';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

export function CardGrid({ cards, title }: { cards: PokemonCard[]; title?: string }) {
  return (
    <section>
      {title && <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cards.map((card) => <CardItem key={card.id} card={card} />)}
      </div>
    </section>
  );
}

function CardItem({ card }: { card: PokemonCard }) {
  const price = card.prices.holofoil?.market || card.prices.market || 0;
  const trend = card.trendPercent || 0;
  const isPositive = trend >= 0;
  const score = card.investmentScore || 0;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="relative bg-gradient-to-br from-violet-50 to-indigo-50 p-3 aspect-[3/4]">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🃏</div>
        )}
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-0.5 text-xs font-bold shadow">
          <span className={score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-gray-500'}>{score}</span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{card.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{card.set}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-bold text-gray-900">{price > 0 ? `${price.toFixed(2)} €` : 'N/A'}</span>
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <Star size={10} className={score >= 70 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
          <div className="flex-1 bg-gray-100 rounded-full h-1">
            <div className={`h-1 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-gray-400'}`} style={{ width: `${score}%` }} />
          </div>
        </div>
        <a href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`} target="_blank" rel="noopener noreferrer" className="mt-2 block w-full text-center text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-1.5 transition-colors">
          Kaufen →
        </a>
      </div>
    </div>
  );
}
