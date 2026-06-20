'use client';

import { MarketSummary as MarketSummaryType, PokemonCard } from '@/types';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

export function MarketSummaryPanel({ summary }: { summary: MarketSummaryType }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-yellow-300" />
          <span className="text-violet-200 text-sm font-medium">KI-Marktanalyse der Woche</span>
        </div>
        <p className="text-white/90 leading-relaxed text-sm">{summary.weeklyReport}</p>
        <p className="text-violet-300 text-xs mt-4">Generiert: {new Date(summary.generatedAt).toLocaleDateString('de-DE')}</p>
      </div>
      <div className="flex flex-col gap-4">
        <MoverList title="Top Gewinner" cards={summary.topGainers} positive />
        <MoverList title="Top Verlierer" cards={summary.topLosers} positive={false} />
      </div>
    </div>
  );
}

function MoverList({ title, cards, positive }: { title: string; cards: PokemonCard[]; positive: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1">
      <div className={`flex items-center gap-1.5 mb-3 text-sm font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
        {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {title}
      </div>
      <ul className="space-y-2">
        {cards.slice(0, 3).map((card) => (
          <li key={card.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-700 font-medium truncate max-w-[120px]">{card.name}</span>
            <span className={`font-bold ${positive ? 'text-green-600' : 'text-red-500'}`}>{positive ? '+' : ''}{(card.trendPercent || 0).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
