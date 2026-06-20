import { Suspense } from 'react';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary } from '@/lib/ai-generator';
import { CardGrid } from '@/components/CardGrid';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { NavBar } from '@/components/NavBar';
import { Calendar, Zap, Shield, TrendingUp, Brain } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 604800;

function getWeekInfo() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  const dateStr = now.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  return { week, dateStr };
}

export async function generateMetadata(): Promise<Metadata> {
  const { week } = getWeekInfo();
  return {
    title: `Marktanalyse KW ${week} — PokéMarket Intelligence`,
    description: 'Wöchentliche KI-Marktanalyse für Pokémon-Karten-Investoren: Top Investment-Karten, Preisverläufe und exklusive Tipps.',
    openGraph: {
      title: `Pokémon Marktanalyse KW ${week}`,
      description: 'Top Investment-Karten, Preisverläufe und KI-Analyse — jeden Montag neu.',
    },
  };
}

export default async function MarktberichtPage() {
  const { week, dateStr } = getWeekInfo();

  let cards: Awaited<ReturnType<typeof fetchTrendingCards>> = [];
  let weeklyReport = '';
  let topGainers: typeof cards = [];
  let topValue: typeof cards = [];
  let error = false;

  try {
    cards = await fetchTrendingCards(20);
    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));
    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    weeklyReport = summary.weeklyReport;

    topGainers = sorted.slice(0, 6);
    topValue = [...cards]
      .sort((a, b) => {
        const pa = a.prices.holofoil?.market || a.prices.market || 0;
        const pb = b.prices.holofoil?.market || b.prices.market || 0;
        return pb - pa;
      })
      .slice(0, 6);
  } catch {
    error = true;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero */}
      <header className="bg-gradient-to-br from-violet-800 via-indigo-800 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-violet-200 text-xs mb-5">
              <Calendar size={12} />
              KW {week} · {dateStr}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
              Wöchentliche<br />
              <span className="text-yellow-300">Marktanalyse</span>
            </h1>

            <p className="text-violet-200 text-sm sm:text-base max-w-md mx-auto mb-6">
              KI-gestützte Investment-Analyse für Pokémon-Karten-Sammler und Investoren.
            </p>

            <div className="flex justify-center gap-6 text-violet-300 text-xs">
              <div className="flex items-center gap-1.5">
                <Brain size={12} />
                KI-Analyse
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} />
                Echtzeit-Preise
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} />
                Wöchentlich neu
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-10 -mt-6">

        {/* AI Market Report */}
        {weeklyReport ? (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 border-b border-violet-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <Zap size={15} className="text-yellow-300 fill-yellow-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">KI-Marktbericht</p>
                <h2 className="text-sm font-black text-gray-900">Diese Woche im Überblick</h2>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                {weeklyReport}
              </p>
            </div>
          </section>
        ) : null}

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Marktdaten gerade nicht verfügbar</p>
              <p className="text-xs mt-1 text-amber-600">Bitte später erneut versuchen.</p>
            </div>
          </div>
        )}

        {/* Stats strip */}
        {cards.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Karten analysiert', value: `${cards.length}`, icon: '🃏' },
              { label: 'Top Gewinner', value: `${topGainers.length}`, icon: '📈' },
              { label: 'KI-Bericht', value: 'Live', icon: '🤖' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 text-center shadow-sm">
                <div className="text-xl mb-1">{stat.icon}</div>
                <p className="text-lg sm:text-2xl font-black text-violet-700">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Investment Cards */}
        {topGainers.length > 0 && (
          <div className="space-y-10">
            <CardGrid cards={topGainers} title="🚀 Top Investment-Karten" />
            {topValue.length > 0 && <CardGrid cards={topValue} title="💎 Höchste Kartenwerte" />}
          </div>
        )}

        {/* Affiliate bar */}
        <section>
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Shield size={10} />
            Partner & Affiliate-Links
          </p>
          <AffiliateBar />
        </section>

        {/* Newsletter CTA */}
        <section id="newsletter">
          <div className="text-center mb-4">
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Newsletter</p>
            <h2 className="text-xl font-black text-gray-900">Jeden Montag direkt ins Postfach</h2>
            <p className="text-gray-500 text-sm mt-1">Die komplette Marktanalyse als E-Mail — kostenlos.</p>
          </div>
          <Suspense>
            <NewsletterSignup />
          </Suspense>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 space-y-3">
          <p className="text-xs text-gray-400 text-center max-w-xl mx-auto leading-relaxed">
            PokéMarket Intelligence ist kein Finanzberater. Alle Preisangaben ohne Gewähr.
            Pokémon-Karten sind Sachwerte mit Marktrisiken.{' '}
            <span className="text-gray-300">•</span>{' '}
            Affiliate-Links: Bei Käufen über unsere Links erhalten wir eine kleine Provision.
          </p>
          <div className="flex justify-center gap-5 text-xs">
            <a href="/impressum" className="text-gray-400 hover:text-violet-600 transition-colors">Impressum</a>
            <span className="text-gray-200">|</span>
            <a href="/datenschutz" className="text-gray-400 hover:text-violet-600 transition-colors">Datenschutz</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
