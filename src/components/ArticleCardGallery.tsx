'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FeaturedCard } from '@/lib/article-generator';

const ACCENT: Record<string, string> = {
  violet:  '#7c3aed',
  blue:    '#2563eb',
  emerald: '#059669',
  amber:   '#d97706',
  rose:    '#e11d48',
  indigo:  '#4338ca',
  gray:    '#6b7280',
};

function TrendBadge({ trend }: { trend: number }) {
  if (trend === 0) return null;
  const up = trend > 0;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
      {up ? '+' : ''}{trend.toFixed(1)}%
    </span>
  );
}

interface Props {
  cards: FeaturedCard[];
  accentColor: string;
}

export function ArticleCardGallery({ cards, accentColor }: Props) {
  const color = ACCENT[accentColor] || ACCENT.violet;

  const chartData = cards
    .filter((c) => c.price > 0)
    .map((c) => ({
      name: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
      price: parseFloat(c.price.toFixed(2)),
      trend: c.trend,
    }));

  return (
    <div className="space-y-4">
      {/* Card image strip */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Karten im Artikel</p>
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
          {cards.map((card) => (
            <div key={card.name} className="flex-none w-28 snap-start text-center">
              <div className="relative w-28 h-[154px] rounded-lg overflow-hidden bg-gray-50 border border-gray-100 mb-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] font-bold text-gray-800 leading-tight line-clamp-2">{card.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{card.set}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                {card.price > 0 && (
                  <span className="text-[10px] font-bold text-gray-700">{card.price.toFixed(2)}€</span>
                )}
                <TrendBadge trend={card.trend} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price comparison bar chart */}
      {chartData.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Preisvergleich (€)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f3f4f6' }}
                formatter={(v) => [`${Number(v).toFixed(2)}€`, 'Preis']}
              />
              <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.trend >= 0 ? color : '#ef4444'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[9px] text-gray-300 text-right mt-1">Balkenfarbe: grün = Aufwärtstrend · rot = Abwärtstrend</p>
        </div>
      )}
    </div>
  );
}
