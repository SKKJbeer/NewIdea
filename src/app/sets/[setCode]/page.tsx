import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { CardGrid } from '@/components/CardGrid';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { ArrowLeft, Package, ShoppingCart, ExternalLink } from 'lucide-react';
import { fetchCardsBySet, fetchRecentSets, isValidSetCode, displayPrice } from '@/lib/pokemon-api';
import type { Metadata } from 'next';

export const revalidate = 86400;

// Beim Build vorrendern: Die 12 neuesten Sets sind sofort da — kein Erstbesucher
// wartet auf den TCG-API-Render. Ältere Sets rendern on-demand (dynamicParams default).
export async function generateStaticParams() {
  const sets = await fetchRecentSets(12).catch(() => []);
  return sets.map((s) => ({ setCode: s.id }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';

interface Props {
  params: Promise<{ setCode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setCode } = await params;
  if (!isValidSetCode(setCode)) return { title: 'Set nicht gefunden' };
  const cards = await fetchCardsBySet(setCode).catch(() => []);
  if (cards.length === 0) return { title: 'Set nicht gefunden' };

  const setName = cards[0].set;
  return {
    title: `${setName} — Kartenpreise & wertvollste Karten`,
    description: `Alle handelbaren Karten aus ${setName} mit aktuellen Cardmarket-Preisen (EUR), Trends und Investment-Scores — sortiert nach Marktwert.`,
    alternates: { canonical: `${SITE_URL}/sets/${setCode}` },
  };
}

export default async function SetDetailPage({ params }: Props) {
  const { setCode } = await params;
  if (!isValidSetCode(setCode)) notFound();

  const cards = await fetchCardsBySet(setCode).catch(() => []);
  if (cards.length === 0) notFound();

  const setName = cards[0].set;
  const topValue = cards.reduce((sum, c) => sum + displayPrice(c), 0);

  const amazonUrl =
    process.env.NEXT_PUBLIC_AMAZON_URL ||
    `https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${setName} Booster`)}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${setName} — Pokémon-Karten nach Marktwert`,
    numberOfItems: cards.length,
    itemListElement: cards.slice(0, 10).map((card, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: card.name,
      url: `${SITE_URL}/karten/${card.id}`,
    })),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-12 sm:py-14">
          <Link href="/sets" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-6 transition-colors">
            <ArrowLeft size={12} /> Alle Sets
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <BoosterPackImage
              setCode={setCode}
              setName={setName}
              className="h-40 w-auto object-contain drop-shadow-xl shrink-0"
            />
            <div className="text-center sm:text-left">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
                <Package size={10} /> Set-Analyse
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">{setName}</h1>
              <p className="text-slate-500 text-sm mt-2">
                {cards.length} handelbare Karten · Gesamtwert der Einzelkarten ca. {topValue.toFixed(0)} €
              </p>
              <a
                href={amazonUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-4 inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors"
              >
                <ShoppingCart size={15} /> Booster kaufen <ExternalLink size={12} />
              </a>
              <p className="text-[10px] text-slate-600 mt-1.5">* Affiliate-Link</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 pb-16 space-y-8">
        <CardGrid cards={cards} title={`Alle Karten aus ${setName} — nach Marktwert sortiert`} />

        <footer className="border-t border-[#1e1e30] pt-5 space-y-3">
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold text-amber-400/80">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-400/60 mt-0.5">
              Preise: Cardmarket (EUR) ohne Gewähr — <strong className="text-amber-400/80">keine Anlageberatung</strong>.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
