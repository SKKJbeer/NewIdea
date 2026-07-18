import { notFound } from 'next/navigation';
import { after } from 'next/server';
import Link from 'next/link';
import { ArrowLeft, Star, ShoppingCart, ExternalLink } from 'lucide-react';
import { fetchCardById, fetchTopValueCards, generatePriceHistory, calculateInvestmentScore } from '@/lib/pokemon-api';
import { getStoredPriceHistory, recordPriceSnapshot } from '@/lib/price-history';
import { PriceChart } from '@/components/PriceChart';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { CardLangPrice } from '@/components/CardLangPrice';
import { NavBar } from '@/components/NavBar';
import { WatchButton } from '@/components/WatchButton';
import { CardImage } from '@/components/CardImage';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';

// ISR: Karten-Detailseite pro Karte 1h cachen statt bei jedem Request neu zu rendern.
// Reduziert TCG-API-Last (429-Risiko) und redundante Preis-Snapshots — der `after()`-Hook
// schreibt dann höchstens einmal pro Stunde pro Karte statt bei jedem Aufruf.
export const revalidate = 3600;

// Beim Build vorrendern: Die Top-20-Karten (von der Startseite verlinkt) sind sofort
// da — die meistgeklickten Detailseiten laden ohne Erstbesucher-Wartezeit.
// Alle anderen Karten rendern on-demand und werden dann 1h gecacht.
export async function generateStaticParams() {
  const cards = await fetchTopValueCards(20).catch(() => []);
  return cards.map((c) => ({ id: c.id }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await fetchCardById(id);
  if (!card) return { title: 'Karte nicht gefunden' };

  const price = card.prices.market || card.prices.holofoil?.market || 0;
  const priceStr = price > 0 ? ` — ${price.toFixed(2)} €` : '';
  const nameStr = card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase()
    ? `${card.name} (${card.nameDe})`
    : card.name;

  return {
    title: `${nameStr}${priceStr} Pokémon Karte Preis`,
    description: `${card.name} aus ${card.set} — Cardmarket Preis: ${price > 0 ? price.toFixed(2) + ' €' : 'k. A.'}, Seltenheit: ${card.rarity}. Investment-Score & 30-Tage-Preisverlauf kostenlos ansehen.`,
    openGraph: {
      title: `${card.name} — Pokémon Karte Preis`,
      description: `Aktueller Cardmarket-Preis für ${card.name} (${card.set}): ${price > 0 ? price.toFixed(2) + ' €' : 'k. A.'}.`,
      images: card.imageUrlHiRes ? [{ url: card.imageUrlHiRes, alt: card.name }] : undefined,
      type: 'article',
    },
    alternates: {
      canonical: `${SITE_URL}/karten/${id}`,
    },
  };
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const card = await fetchCardById(id);
  if (!card) notFound();

  const price = card.prices.market || card.prices.holofoil?.market || 0;
  const trend = card.trendPercent || 0;
  const score = calculateInvestmentScore(card);

  after(async () => {
    await recordPriceSnapshot(card);
  });

  const stored = await getStoredPriceHistory(id, 90);
  let history: { date: string; price: number }[];
  let historyKind: 'daily' | 'cardmarket' | 'sample';
  if (stored.length >= 2) {
    history = stored;
    historyKind = 'daily';
  } else if (card.realData && card.priceHistory && card.priceHistory.length >= 2) {
    history = card.priceHistory;
    historyKind = 'cardmarket';
  } else {
    history = generatePriceHistory(price, 30);
    historyKind = 'sample';
  }
  const realData = historyKind !== 'sample';

  const scoreColor =
    score >= 70 ? 'text-emerald-400 bg-emerald-500/10' : score >= 50 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 bg-[#1a1a28]';
  const scoreLabel =
    score >= 70 ? 'Starkes Investment' : score >= 50 ? 'Mittleres Potenzial' : 'Vorsicht geboten';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.name,
    description: `Pokémon-Sammelkarte ${card.name} aus dem Set ${card.set}. Seltenheit: ${card.rarity}.`,
    image: card.imageUrlHiRes || card.imageUrl,
    brand: { '@type': 'Brand', name: 'Pokémon TCG' },
    category: 'Pokémon Sammelkarte',
    ...(price > 0 && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        price: price.toFixed(2),
        priceValidUntil: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/karten/${id}`,
        seller: { '@type': 'Organization', name: 'Cardmarket' },
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <NavBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} />Alle Karten
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-6 flex flex-col items-center">
            <div className="bg-[#1a1a28] rounded-xl p-4 w-full max-w-xs">
              {card.imageUrlHiRes || card.imageUrl ? (
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden">
                  <CardImage
                    src={card.imageUrlHiRes || card.imageUrl || ''}
                    alt={`${card.name} Pokémon Karte`}
                    sizes="(max-width: 768px) 80vw, 320px"
                    className="object-contain rounded-lg shadow-md"
                    priority
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-6xl">🃏</div>
              )}
            </div>
            <div className="mt-4 w-full space-y-2">
              <a
                href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold transition-colors"
              >
                <ShoppingCart size={18} />Auf Cardmarket kaufen<ExternalLink size={14} className="opacity-70" />
              </a>
              <a
                href={`https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${card.name} Karte`)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-xl py-2.5 font-semibold text-sm transition-colors"
              >
                Amazon<ExternalLink size={12} className="opacity-70" />
              </a>
              <p className="text-xs text-slate-700 text-center">* Affiliate-Links</p>
              <WatchButton
                cardId={card.id}
                cardName={card.name}
                setName={card.set}
                setCode={card.setCode}
                imageUrl={card.imageUrl}
                price={price}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">{card.set}</p>
              <h1 className="text-2xl font-black text-white">{card.name}</h1>
              {card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase() && (
                <p className="text-sm font-semibold text-violet-400 mt-0.5">🇩🇪 {card.nameDe}</p>
              )}
              <p className="text-sm text-slate-600 mt-1">{card.rarity}</p>
              <div className="mt-4">
                <CardLangPrice
                  cardId={card.id}
                  cardName={card.name}
                  defaultPrice={price}
                  trendPercent={trend}
                  realData={realData}
                  priceSource={card.priceSource}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-200">Investment-Score</h2>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor}`}>{score}/100</span>
              </div>
              <div className="w-full bg-[#2a2a3a] rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-slate-700'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <Star size={14} className={score >= 70 ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                {scoreLabel}
              </p>
            </div>

            {card.setCode && (
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Aus diesem Booster-Set</p>
                <div className="flex flex-col items-center">
                  <BoosterPackImage
                    setCode={card.setCode}
                    setName={card.set}
                    className="h-48 w-auto object-contain drop-shadow-xl"
                  />
                  <p className="text-sm font-semibold text-slate-400 mt-3 text-center leading-snug">{card.set}</p>
                </div>
                <a
                  href={`https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${card.set} Booster`)}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-xl py-2.5 font-semibold text-sm transition-colors"
                >
                  Booster auf Amazon kaufen <ExternalLink size={13} className="opacity-70" />
                </a>
                <p className="text-xs text-slate-700 text-center mt-1.5">* Affiliate-Link</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 mt-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="font-bold text-slate-200">
              Preis-Historie ({history.length} {history.length === 1 ? 'Tag' : 'Tage'})
            </h2>
            {historyKind === 'daily' ? (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                ✓ Echte Preise · täglich erfasst
              </span>
            ) : historyKind === 'cardmarket' ? (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                ✓ Cardmarket-Durchschnitte
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                Beispielhafter Verlauf
              </span>
            )}
          </div>
          <PriceChart data={history} />
          {historyKind === 'daily' ? (
            <p className="text-xs text-slate-600 mt-3">
              Echte Cardmarket-Preise — ab jetzt täglich erfasst. Der Verlauf wird mit jedem Tag dichter und genauer.
            </p>
          ) : historyKind === 'cardmarket' ? (
            <p className="text-xs text-slate-600 mt-3">
              Basierend auf realen Cardmarket-Durchschnittspreisen (Ø 1/7/30 Tage &amp; Trend), zwischen den Eckwerten interpoliert.
            </p>
          ) : (
            <p className="text-xs text-amber-400/60 mt-3">
              Für diese Karte liegen aktuell keine Cardmarket-Verlaufsdaten vor — die Kurve ist nur ein Beispiel.
            </p>
          )}
        </div>

        <p className="text-xs text-slate-700 text-center mt-6">
          Preise: Cardmarket (EUR), ohne Gewähr. Kein Anlageversprechen.
        </p>
      </div>
    </div>
  );
}
