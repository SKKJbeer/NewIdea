import { fetchTopValueCards } from '@/lib/pokemon-api';
import { CardGrid } from '@/components/CardGrid';
import { MoverList } from '@/components/MoverList';
import { SearchBox } from '@/components/SearchBox';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NavBar } from '@/components/NavBar';
import Link from 'next/link';
import { Zap, ArrowRight, BookOpen, TrendingUp, TrendingDown, BarChart2, Gem } from 'lucide-react';
import { GUIDES } from '@/lib/guides';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pokémon Karten Preise & Investment — PokéMarket Intelligence',
  description:
    'Echtzeit-Preise von Cardmarket für Pokémon-Sammelkarten. Entdecke Top-Gewinner, Verlierer und Investment-Scores. Kostenlos, täglich aktualisiert.',
  keywords: [
    'Pokémon Karten wert',
    'Pokémon TCG Preise',
    'Cardmarket Pokémon',
    'Pokémon Karten verkaufen',
    'Pokémon Investment',
    'Pokémon Karten Wertentwicklung',
    'seltene Pokémon Karten',
    'Pikachu wert',
    'Charizard Preis',
  ],
  openGraph: {
    title: 'Pokémon Karten Preise & Investment — PokéMarket Intelligence',
    description: 'Echte Cardmarket-Preise, Trends und Investment-Scores für Pokémon-Sammelkarten.',
    type: 'website',
    locale: 'de_DE',
    alternateLocale: 'en_US',
  },
};

export default async function Home() {
  let cards: Awaited<ReturnType<typeof fetchTopValueCards>> = [];

  try {
    cards = await fetchTopValueCards(50);
  } catch {
    // API-Ausfall: Seite wird ohne Kartendata gezeigt — kein sichtbarer Fehler
  }

  const withTrend = cards.filter((c) => typeof c.trendPercent === 'number');
  const gainers = [...withTrend].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0)).slice(0, 10);
  const losers = [...withTrend].sort((a, b) => (a.trendPercent || 0) - (b.trendPercent || 0)).slice(0, 10);
  const topValue = [...cards]
    .sort((a, b) => {
      const pa = a.prices.market || a.prices.holofoil?.market || 0;
      const pb = b.prices.market || b.prices.holofoil?.market || 0;
      return pb - pa;
    })
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero — compact, finance-style */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-7 text-center sm:pt-12">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
            <Zap size={11} className="fill-violet-500 text-violet-500" />
            Cardmarket-Preise · täglich aktualisiert
          </div>
          <h1 className="mb-4 text-2xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Was ist deine Pokémon-Karte <span className="text-violet-600">wert?</span>
          </h1>
          <SearchBox placeholder="Karte suchen, z.B. Glurak oder Charizard …" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 pt-6 pb-16">

        {/* Market Stats — 4 boxes */}
        {cards.length > 0 && (() => {
          const bestGainer = gainers[0];
          const worstLoser = losers[0];
          const topCard = topValue[0];
          const topCardPrice = topCard ? (topCard.prices.market || topCard.prices.holofoil?.market || 0) : 0;
          const gainCount = withTrend.filter((c) => (c.trendPercent || 0) > 0).length;

          return (
            <section aria-label="Markt-Überblick">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-white p-3.5 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-50">
                      <TrendingUp size={11} className="text-emerald-600" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Top 30T</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums leading-none text-emerald-600">
                    {bestGainer ? `+${bestGainer.trendPercent?.toFixed(1)}%` : '–'}
                  </p>
                  <p className="mt-1.5 truncate text-[10px] text-gray-400">{bestGainer?.name ?? '–'}</p>
                </div>

                <div className="rounded-xl border border-rose-100 bg-white p-3.5 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-50">
                      <TrendingDown size={11} className="text-rose-500" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Schw. 30T</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums leading-none text-rose-500">
                    {worstLoser ? `${worstLoser.trendPercent?.toFixed(1)}%` : '–'}
                  </p>
                  <p className="mt-1.5 truncate text-[10px] text-gray-400">{worstLoser?.name ?? '–'}</p>
                </div>

                <div className="rounded-xl border border-violet-100 bg-white p-3.5 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-50">
                      <Gem size={11} className="text-violet-600" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Top SIR</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums leading-none text-violet-700">
                    {topCardPrice > 0 ? `${topCardPrice.toFixed(0)} €` : '–'}
                  </p>
                  <p className="mt-1.5 truncate text-[10px] text-gray-400">{topCard?.name ?? '–'}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-50">
                      <BarChart2 size={11} className="text-gray-500" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Im Plus (30T)</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums leading-none text-gray-800">
                    {withTrend.length > 0 ? `${gainCount}/${withTrend.length}` : '–'}
                  </p>
                  <p className="mt-1.5 truncate text-[10px] text-gray-400">Karten im Aufwärtstrend</p>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Market Movers */}
        {(gainers.length > 0 || losers.length > 0) && (
          <section aria-label="Markt-Bewegungen">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Markt · 30 Tage</span>
                <span className="h-px w-4 bg-gray-200" />
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <TrendingUp size={10} /> Gewinner
                </span>
                <span className="text-[11px] text-gray-300">|</span>
                <span className="flex items-center gap-1 text-[11px] text-rose-500 font-semibold">
                  <TrendingDown size={10} /> Verlierer
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {gainers.length > 0 && <MoverList cards={gainers} title="Top 10 Gewinner" variant="gainer" period="30 Tage" />}
              {losers.length > 0 && <MoverList cards={losers} title="Top 10 Verlierer" variant="loser" period="30 Tage" />}
            </div>
          </section>
        )}

        {/* Blog */}
        <section aria-label="Blog">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Blog</p>
              <h2 className="text-xl font-black text-gray-900">Täglich neue Analysen</h2>
            </div>
            <a href="/artikel" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800">
              Alle ansehen <ArrowRight size={13} />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { emoji: '📊', label: 'Marktanalyse', sub: 'Jeden Montag' },
              { emoji: '🃏', label: 'Karte im Fokus', sub: 'Jeden Dienstag' },
              { emoji: '💡', label: 'Investment-Tipp', sub: 'Jeden Mittwoch' },
            ].map((item) => (
              <a
                key={item.label}
                href="/artikel"
                className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-sm"
              >
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 transition-colors group-hover:text-violet-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Guides teaser */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-violet-500" />
                <p className="text-xs font-bold text-gray-600">Experten-Guides</p>
              </div>
              <Link href="/guides" className="text-xs text-violet-600 hover:text-violet-800 font-semibold">Alle →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GUIDES.slice(0, 2).map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 hover:border-violet-200 bg-white p-3 transition-all group">
                  <span className="text-lg shrink-0">{guide.emoji}</span>
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-violet-700 leading-snug line-clamp-2">{guide.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Top cards — compact, secondary */}
        {topValue.length > 0 && (
          <section id="karten" aria-label="Wertvollste Karten">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Karten</p>
                <h2 className="text-base font-bold text-gray-700">Teuerste SIR &amp; Hyper Rares</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Special Illustration Rare · Hyper Rare · aus aktueller Datenbankabfrage</p>
              </div>
              <a href="/suche" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800">
                Alle durchsuchen <ArrowRight size={13} />
              </a>
            </div>
            <CardGrid cards={topValue} compact />
          </section>
        )}

        {/* Partner */}
        <section aria-label="Partner & Affiliate-Links">
          <p className="mb-2 text-[11px] text-gray-400">Partner &amp; Affiliate-Links</p>
          <AffiliateBar />
        </section>

        <footer className="space-y-4 border-t border-gray-200 pt-6">
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-center space-y-1">
            <p className="text-xs font-bold text-amber-800">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Pokémon und alle zugehörigen Namen sind Marken von Nintendo, Creatures Inc. und GAME FREAK.
              Diese Seite steht in keiner Verbindung zu diesen Unternehmen.
            </p>
            <p className="text-[11px] text-amber-700">
              Alle Inhalte dienen ausschließlich der Information — <strong>keine Anlageberatung</strong>.
              Preisangaben (Cardmarket, EUR) ohne Gewähr.
            </p>
          </div>
          <p className="text-center text-[11px] text-gray-400">
            Affiliate-Links: Bei Käufen über unsere Links erhalten wir eine kleine Provision.
          </p>
          <div className="flex justify-center gap-5 text-xs">
            <a href="/impressum" className="text-gray-400 transition-colors hover:text-violet-600">Impressum</a>
            <span className="text-gray-200">|</span>
            <a href="/datenschutz" className="text-gray-400 transition-colors hover:text-violet-600">Datenschutz</a>
            <span className="text-gray-200">|</span>
            <span className="text-gray-300 font-mono">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
