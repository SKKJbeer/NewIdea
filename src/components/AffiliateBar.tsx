import { ExternalLink } from 'lucide-react';

const AFFILIATES = [
  {
    name: 'Cardmarket',
    url: process.env.NEXT_PUBLIC_CARDMARKET_URL || 'https://www.cardmarket.com/en/Pokemon',
  },
  {
    name: 'Trade Republic',
    url: process.env.NEXT_PUBLIC_TRADE_REPUBLIC_URL || '#',
  },
  {
    name: 'Amazon',
    url: process.env.NEXT_PUBLIC_AMAZON_URL || 'https://www.amazon.de/s?k=pokemon+booster',
  },
];

export function AffiliateBar() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-gray-300 uppercase tracking-wide">Partner</span>
      {AFFILIATES.map((a, i) => (
        <span key={a.name} className="flex items-center gap-2">
          {i > 0 && <span className="text-gray-200" aria-hidden>·</span>}
          <a
            href={a.url === '#' ? undefined : a.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-violet-500 transition-colors"
          >
            {a.name}
            <ExternalLink size={9} className="opacity-60" />
          </a>
        </span>
      ))}
    </div>
  );
}
