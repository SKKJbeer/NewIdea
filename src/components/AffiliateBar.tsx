import { ExternalLink } from 'lucide-react';

const AFFILIATES = [
  {
    name: 'Cardmarket',
    description: 'Europas größter TCG-Marktplatz',
    url: process.env.NEXT_PUBLIC_CARDMARKET_URL || 'https://www.cardmarket.com/en/Pokemon',
    color: 'from-blue-500 to-blue-700',
    emoji: '🃏',
  },
  {
    name: 'Trade Republic',
    description: 'Kostenloses Depot',
    url: process.env.NEXT_PUBLIC_TRADE_REPUBLIC_URL || '#',
    color: 'from-emerald-500 to-green-700',
    emoji: '📈',
  },
  {
    name: 'Amazon Booster',
    description: 'Boosterpakete & Displays',
    url: process.env.NEXT_PUBLIC_AMAZON_URL || 'https://www.amazon.de/s?k=pokemon+booster',
    color: 'from-orange-400 to-amber-600',
    emoji: '📦',
  },
];

export function AffiliateBar() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3">
      {AFFILIATES.map((affiliate) => (
        <a
          key={affiliate.name}
          href={affiliate.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`bg-gradient-to-r ${affiliate.color} rounded-2xl p-4 text-white flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all group snap-start flex-shrink-0 w-64 sm:w-auto`}
        >
          <span className="text-2xl">{affiliate.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{affiliate.name}</p>
            <p className="text-white/80 text-xs truncate">{affiliate.description}</p>
          </div>
          <ExternalLink size={14} className="opacity-60 group-hover:opacity-100 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}
