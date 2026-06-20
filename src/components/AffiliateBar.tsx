import { ExternalLink } from 'lucide-react';

const AFFILIATES = [
  { name: 'Cardmarket', description: 'Europas größter TCG-Marktplatz', url: process.env.NEXT_PUBLIC_CARDMARKET_URL || 'https://www.cardmarket.com/en/Pokemon', color: 'from-blue-500 to-blue-700', emoji: '🃏' },
  { name: 'Trade Republic', description: 'Kostenloses ETF-Depot', url: process.env.NEXT_PUBLIC_TRADE_REPUBLIC_URL || '#', color: 'from-green-500 to-emerald-700', emoji: '📈' },
  { name: 'Amazon Booster', description: 'Boosterpakete & Displays', url: process.env.NEXT_PUBLIC_AMAZON_URL || 'https://www.amazon.de/s?k=pokemon+booster', color: 'from-orange-500 to-amber-600', emoji: '📦' },
];

export function AffiliateBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {AFFILIATES.map((a) => (
        <a key={a.name} href={a.url} target="_blank" rel="noopener noreferrer sponsored" className={`bg-gradient-to-r ${a.color} rounded-xl p-4 text-white flex items-center gap-3 hover:opacity-90 transition-opacity group`}>
          <span className="text-2xl">{a.emoji}</span>
          <div className="flex-1"><p className="font-bold text-sm">{a.name}</p><p className="text-white/80 text-xs">{a.description}</p></div>
          <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
        </a>
      ))}
    </div>
  );
}
