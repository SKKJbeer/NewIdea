import { ExternalLink } from 'lucide-react';

// PARTNER-LEISTE
//
// Die Adressen stehen als Standard im Code und lassen sich per Umgebungs-
// variable überschreiben. Das ist Absicht: Ein Partner-Link ist nichts
// Geheimes, und ohne Standard hing der Trade-Republic-Eintrag als klickbarer
// Link ohne Ziel in der Seite (`href="#"`) — sichtbar, aber wirkungslos.
//
// Kennzeichnung ist Pflicht (§ 6 TMG / UWG): Der Hinweis steht deshalb IN der
// Komponente, nicht in den einzelnen Seiten. So kann er beim Einbau an einer
// neuen Stelle nicht vergessen werden.
const AFFILIATES = [
  {
    name: 'Cardmarket',
    url: process.env.NEXT_PUBLIC_CARDMARKET_URL || 'https://www.cardmarket.com/en/Pokemon',
  },
  {
    name: 'Trade Republic',
    url: process.env.NEXT_PUBLIC_TRADE_REPUBLIC_URL || 'https://refnocode.trade.re/qv0v7zgw',
  },
  {
    name: 'Amazon',
    url: process.env.NEXT_PUBLIC_AMAZON_URL || 'https://www.amazon.de/s?k=pokemon+booster',
  },
];

export function AffiliateBar() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-slate-600 uppercase tracking-wide">Partner</span>
        {AFFILIATES.map((a, i) => (
          <span key={a.name} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-700" aria-hidden>·</span>}
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              // Mindesthöhe für den Finger — die Links waren rund 16 px hoch.
              className="inline-flex min-h-[32px] items-center gap-0.5 text-xs text-slate-500 transition-colors hover:text-violet-400"
            >
              {a.name}
              <ExternalLink size={9} className="opacity-60" />
            </a>
          </span>
        ))}
      </div>
      <p className="text-[10px] text-slate-700">
        * Affiliate-Links — bei einem Abschluss erhält diese Seite eine Provision. Für dich ändert sich der Preis nicht.
      </p>
    </div>
  );
}
