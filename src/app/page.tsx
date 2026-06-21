import { Suspense } from 'react';
import { fetchTopValueCards } from '@/lib/pokemon-api';
import { CardGrid } from '@/components/CardGrid';
import { MoverList } from '@/components/MoverList';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { SearchBox } from '@/components/SearchBox';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NavBar } from '@/components/NavBar';
import { Zap, ArrowRight } from 'lucide-react';
import { getLang } from '@/lib/get-lang';
import { t } from '@/lib/i18n';
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
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com',
  },
};

export default async function Home() {
  const lang = await getLang();

  let cards: Awaited<ReturnType<typeof fetchTopValueCards>> = [];
  let error = false;

  try {
    cards = await fetchTopValueCards(50);
  } catch {
    error = true;
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

      {/* Hero */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-10 text-center sm:pt-16">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
            <Zap size={11} className="fill-violet-500 text-violet-500" />
            {t(lang, 'hero_badge')}
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            {t(lang, 'hero_h1_a')} <span className="text-violet-600">{t(lang, 'hero_h1_b')}</span>
          </h1>
          <p className="mx-auto mb-6 max-w-md text-sm text-gray-500 sm:text-base">
            {t(lang, 'hero_sub')}
          </p>
          <SearchBox
            placeholder={t(lang, 'hero_placeholder')}
            searchBtn={t(lang, 'search_btn')}
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 pt-10 pb-16">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">{t(lang, 'error_cards_title')}</p>
              <p className="mt-1 text-xs text-amber-600">{t(lang, 'error_cards_sub')}</p>
            </div>
          </div>
        )}

        {/* Market Movers */}
        {(gainers.length > 0 || losers.length > 0) && (
          <section aria-label={t(lang, 'section_market_label')}>
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">
                {t(lang, 'section_market_label')}
              </p>
              <h2 className="text-xl font-black text-gray-900">{t(lang, 'section_market_h2')}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {gainers.length > 0 && (
                <MoverList cards={gainers} title={t(lang, 'list_gainers')} variant="gainer" />
              )}
              {losers.length > 0 && (
                <MoverList cards={losers} title={t(lang, 'list_losers')} variant="loser" />
              )}
            </div>
          </section>
        )}

        {/* Blog — primary content section for SEO reach */}
        <section aria-label={t(lang, 'section_blog_label')}>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">
                {t(lang, 'section_blog_label')}
              </p>
              <h2 className="text-xl font-black text-gray-900">{t(lang, 'section_blog_h2')}</h2>
            </div>
            <a
              href="/artikel"
              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800"
            >
              {t(lang, 'section_blog_all')} <ArrowRight size={13} />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { emoji: '📊', label: t(lang, 'blog_item_1_label'), sub: t(lang, 'blog_item_1_sub') },
              { emoji: '🃏', label: t(lang, 'blog_item_2_label'), sub: t(lang, 'blog_item_2_sub') },
              { emoji: '💡', label: t(lang, 'blog_item_3_label'), sub: t(lang, 'blog_item_3_sub') },
            ].map((item) => (
              <a
                key={item.label}
                href="/artikel"
                className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-sm"
              >
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 transition-colors group-hover:text-violet-700">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section id="newsletter" aria-label="Newsletter">
          <Suspense>
            <NewsletterSignup />
          </Suspense>
        </section>

        {/* Top cards — compact, secondary section */}
        {topValue.length > 0 && (
          <section id="karten" aria-label={t(lang, 'section_cards_label')}>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {t(lang, 'section_cards_label')}
                </p>
                <h2 className="text-base font-bold text-gray-700">{t(lang, 'section_cards_h2')}</h2>
              </div>
              <a
                href="/suche"
                className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800"
              >
                {t(lang, 'section_cards_all')} <ArrowRight size={13} />
              </a>
            </div>
            <CardGrid cards={topValue} compact />
          </section>
        )}

        {/* Partner */}
        <section aria-label={t(lang, 'footer_partner')}>
          <p className="mb-2 text-[11px] text-gray-400">{t(lang, 'footer_partner')}</p>
          <AffiliateBar />
        </section>

        <footer className="space-y-3 border-t border-gray-200 pt-6">
          <p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-gray-400">
            {t(lang, 'footer_disclaimer')}{' '}
            <span className="text-gray-300">•</span> {t(lang, 'footer_affiliate')}
          </p>
          <div className="flex justify-center gap-5 text-xs">
            <a href="/impressum" className="text-gray-400 transition-colors hover:text-violet-600">
              {t(lang, 'footer_impressum')}
            </a>
            <span className="text-gray-200">|</span>
            <a href="/datenschutz" className="text-gray-400 transition-colors hover:text-violet-600">
              {t(lang, 'footer_datenschutz')}
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
