import Link from 'next/link';
import Image from 'next/image';
import { PokemonCard } from '@/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MoverListProps {
  cards: PokemonCard[];
  title: string;
  variant: 'gainer' | 'loser';
}

export function MoverList({ cards, title, variant }: MoverListProps) {
  const isGainer = variant === 'gainer';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          isGainer ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
        }`}>
          {isGainer ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
        </span>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>

      <ol className="divide-y divide-gray-50">
        {cards.map((card, i) => {
          const price = card.prices.market || card.prices.holofoil?.market || 0;
          const trend = card.trendPercent || 0;
          const subtitle =
            card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase() ? card.nameDe : card.set;

          return (
            <li key={card.id}>
              <Link
                href={`/karten/${card.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <span className="w-4 shrink-0 text-xs font-bold text-gray-300 tabular-nums">{i + 1}</span>
                <div className="relative flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-gradient-to-br from-violet-50 to-indigo-50">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      fill
                      sizes="32px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-sm">🃏</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight text-gray-900">{card.name}</p>
                  <p className="truncate text-xs text-gray-400">{subtitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-gray-900">
                    {price > 0 ? `${price.toFixed(2)} €` : '—'}
                  </p>
                  <p className={`text-xs font-semibold tabular-nums ${isGainer ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
