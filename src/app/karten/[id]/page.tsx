import { notFound } from 'next/navigation';
import { after } from 'next/server';
import Link from 'next/link';
import { ArrowLeft, Star, ShoppingCart, ExternalLink, ImageOff } from 'lucide-react';
import { fetchCardById, calculateInvestmentScore } from '@/lib/pokemon-api';
import { getStoredPriceHistory, recordPriceSnapshot } from '@/lib/price-history';
import { PriceChart } from '@/components/PriceChart';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { CardLangPrice } from '@/components/CardLangPrice';
import { NavBar } from '@/components/NavBar';
import { WatchButton } from '@/components/WatchButton';
import { CardImage } from '@/components/CardImage';
import { ApiErrorState } from '@/components/ApiErrorState';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';

// ISR: Karten-Detailseite pro Karte 1h cachen statt bei jedem Request neu zu rendern.
// Reduziert TCG-API-Last (429-Risiko) und redundante Preis-Snapshots — der `after()`-Hook
// schreibt dann höchstens einmal pro Stunde pro Karte statt bei jedem Aufruf.
//
// BEWUSST KEIN generateStaticParams: Das Build-Vorrendern (v2.12.0) hat bei
// TCG-API-Ausfällen während des Builds 404-Seiten fest ins CDN gebacken —
// existierende Karten waren dann eine Stunde lang "nicht gefunden".
// On-Demand + ISR + Loading-Skeleton ist robuster.
export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Metadata darf bei API-Fehlern nie den Seitenaufbau verhindern
  const card = await fetchCardById(id).catch(() => null);
  if (!card) return { title: 'Pokémon Karte' };

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

  // API-Fehler (Timeout/Rate-Limit) ≠ "Karte existiert nicht": Fehler-UI statt 404.
  // notFound() nur bei echtem 404 der Datenbank (fetchCardById liefert dann null).
  let card;
  try {
    card = await fetchCardById(id);
  } catch {
    return <ApiErrorState />;
  }
  if (!card) notFound();

  const price = card.prices.market || card.prices.holofoil?.market || 0;
  const trend = card.trendPercent || 0;
  const score = calculateInvestmentScore(card);

  after(async () => {
    await recordPriceSnapshot(card);
  });

  // Preis-Historie ehrlich zusammensetzen:
  // - echte Tages-Snapshots aus Supabase (record-on-view, wächst mit der Zeit)
  // - Cardmarket-Ankerpunkte (Ø 30/7/1 Tage + Trend) als reale Referenz
  // Bei Datumskollision gewinnt IMMER der echte Snapshot. Keine erfundenen Punkte.
  const stored = await getStoredPriceHistory(id, 90);
  const anchors = card.realData && card.priceHistory ? card.priceHistory : [];
  const byDate = new Map<string, number>();
  for (const p of anchors) byDate.set(p.date, p.price);
  for (const p of stored) byDate.set(p.date, p.price); // echte Snapshots überschreiben Anker
  const history = [...byDate.entries()]
    .map(([date, p]) => ({ date, price: p }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const hasChart = history.length >= 2;
  // 'daily' = mind. 2 echte Tages-Snapshots vorhanden, sonst Cardmarket-Referenz
  const historyKind: 'daily' | 'cardmarket' = stored.length >= 2 ? 'daily' : 'cardmarket';
  const realData = card.realData || stored.length > 0;

  // Trend passend zum Chart: aus echten Snapshots (erster→letzter), sonst Cardmarket (ggü. Ø30).
  let displayTrend = trend;
  if (stored.length >= 2 && stored[0].price > 0) {
    displayTrend = Math.round(((stored[stored.length - 1].price - stored[0].price) / stored[0].price) * 1000) / 10;
  }

  // Datenstand der Cardmarket-Preise ehrlich anzeigen — die pokemontcg.io-Quelle
  // aktualisiert nicht täglich, manche Karten sind Monate alt.
  let cmDataAge: string | null = null;
  if (card.cmPrices?.updatedAt) {
    const parsed = new Date(card.cmPrices.updatedAt.replace(/\//g, '-'));
    if (!isNaN(parsed.getTime())) {
      const label = parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
      cmDataAge = days > 45
        ? ` Datenstand: ${label} — kann veraltet sein, aktuelle Preise bitte auf Cardmarket prüfen.`
        : ` Datenstand: ${label}.`;
    }
  }

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
                <div className="aspect-[3/4] flex items-center justify-center text-slate-700"><ImageOff size={48} /></div>
              )}
            </div>
            <div className="mt-4 w-full space-y-3">
              {/* Primäre Funktion: Karte merken */}
              <WatchButton
                cardId={card.id}
                cardName={card.name}
                setName={card.set}
                setCode={card.setCode}
                imageUrl={card.imageUrl}
                price={price}
              />

              {/* Sekundär & dezent: Kauf-Links */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 text-center">Kaufen bei</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2a2a3a] bg-[#1a1a28] hover:border-violet-500/40 hover:bg-[#20202e] text-slate-300 hover:text-white text-xs font-semibold py-2 transition-colors"
                  >
                    <ShoppingCart size={13} /> Cardmarket <ExternalLink size={10} className="opacity-40" />
                  </a>
                  <a
                    href={`https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${card.name} Karte`)}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2a2a3a] bg-[#1a1a28] hover:border-amber-500/40 hover:bg-[#20202e] text-slate-300 hover:text-white text-xs font-semibold py-2 transition-colors"
                  >
                    Amazon <ExternalLink size={10} className="opacity-40" />
                  </a>
                </div>
                <p className="text-[10px] text-slate-700 text-center mt-1.5">* Affiliate-Links</p>
              </div>
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
                  trendPercent={displayTrend}
                  realData={realData}
                  priceSource={card.priceSource}
                />
              </div>
            </div>

            {card.cmPrices && (card.cmPrices.trend || card.cmPrices.low) && (
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-200">Cardmarket-Preise</h2>
                  <a
                    href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`}
                    target="_blank" rel="noopener noreferrer sponsored"
                    className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                  >
                    Prüfen <ExternalLink size={11} />
                  </a>
                </div>
                <dl className="space-y-2 text-sm">
                  {card.cmPrices.trend != null && (
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Preis-Trend (Marktwert)</dt>
                      <dd className="font-bold text-white tabular-nums">{card.cmPrices.trend.toFixed(2)} €</dd>
                    </div>
                  )}
                  {card.cmPrices.low != null && (
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Günstigstes Angebot (ab)</dt>
                      <dd className="font-semibold text-emerald-400 tabular-nums">{card.cmPrices.low.toFixed(2)} €</dd>
                    </div>
                  )}
                  {card.cmPrices.avgSell != null && (
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Ø Verkaufspreis</dt>
                      <dd className="font-semibold text-slate-300 tabular-nums">{card.cmPrices.avgSell.toFixed(2)} €</dd>
                    </div>
                  )}
                  {card.cmPrices.avg30 != null && (
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Ø 30 Tage</dt>
                      <dd className="font-semibold text-slate-300 tabular-nums">{card.cmPrices.avg30.toFixed(2)} €</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
                  Der angezeigte Marktpreis ist der <strong className="text-slate-500">Cardmarket-Trend</strong> (fairer Marktwert bei gutem Zustand). „Ab" ist das günstigste Einzelangebot — meist schlechterer Zustand oder andere Sprache.
                  {cmDataAge}
                </p>
              </div>
            )}

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
            <h2 className="font-bold text-slate-200">Preis-Historie</h2>
            {hasChart && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                {historyKind === 'daily' ? '✓ Echte Tagespreise' : '✓ Cardmarket-Referenz'}
              </span>
            )}
          </div>
          {hasChart ? (
            <>
              <PriceChart data={history} />
              {historyKind === 'daily' ? (
                <p className="text-xs text-slate-600 mt-3">
                  Täglich erfasste Cardmarket-Preise für diese Karte — der Verlauf wird mit jedem Tag genauer.
                </p>
              ) : (
                <p className="text-xs text-slate-600 mt-3">
                  Echte Cardmarket-Durchschnitte (Ø 30 / 7 / 1 Tage &amp; aktueller Trend). Ab jetzt kommen täglich echte Tagespreise dazu.
                </p>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-2xl font-black text-white">{price > 0 ? `${price.toFixed(2)} €` : '—'}</p>
              <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Aktueller Marktpreis. Der Preisverlauf für diese Karte wird ab jetzt täglich aufgebaut und erscheint hier, sobald mehrere Datenpunkte vorliegen.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-700 text-center mt-6">
          Preise: Cardmarket (EUR), ohne Gewähr. Kein Anlageversprechen.
        </p>
      </div>
    </div>
  );
}
