import { Suspense } from 'react';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { CardGrid } from '@/components/CardGrid';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NavBar } from '@/components/NavBar';
import { TrendingUp, Zap, Shield, Mail } from 'lucide-react';

export const revalidate = 3600;

export default async function Home() {
  let cards: Awaited<ReturnType<typeof fetchTrendingCards>> = [];
  let error = false;

  try {
    cards = await fetchTrendingCards(20);
  } catch {
    error = true;
  }

  const topGainers = [...cards]
    .sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0))
    .slice(0, 10);

  const topValue = [...cards]
    .sort((a, b) => {
      const pa = a.prices.holofoil?.market || a.prices.market || 0;
      const pb = b.prices.holofoil?.market || b.prices.market || 0;
      return pb - pa;
    })
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero */}
      <header className="bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-12 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-violet-200 text-xs mb-5">
              <Zap size={12} className="text-yellow-300 fill-yellow-300" />
              KI-Marktanalyse • Wöchentlich aktualisiert
            </div>

            <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-3 leading-tight">
              Pokémon<span className="text-yellow-300">Market</span>
              <br />
              Intelligence
            </h1>

            <p className="text-violet-200 text-sm sm:text-lg max-w-lg mx-auto mb-6">
              Echtzeit-Preise, Investment-Scores und KI-Marktberichte
              für Pokémon-Karten-Sammler.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-none mx-auto">
              <a
                href="#newsletter"
                className="bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition-colors flex items-center gap-2 justify-center text-sm"
              >
                <Mail size={16} /> Kostenlos anmelden
              </a>
              <a
                href="#karten"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 justify-center text-sm border border-white/20"
              >
                <TrendingUp size={16} /> Marktpreise ansehen
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex justify-center gap-6 mt-8 text-violet-300 text-xs">
              <div className="flex items-center gap-1.5">
                <Shield size={12} />
                Kostenlos & werbefrei
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} />
                KI-gestützt
              </div>
              <div className="flex items-center gap-1.5">
                <Mail size={12} />
                Newsletter inklusive
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-16 space-y-10 pt-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Karten', value: cards.length > 0 ? `${cards.length}+` : '20+', icon: '🃏' },
            { label: 'Wöchentlich', value: 'Neu', icon: '🔄' },
            { label: 'Newsletter', value: 'Gratis', icon: '📧' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 text-center shadow-sm">
              <div className="text-xl mb-1">{stat.icon}</div>
              <p className="text-lg sm:text-2xl font-black text-violet-700">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Affiliate bar */}
        <section>
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Shield size={10} />
            Partner & Affiliate-Links
          </p>
          <AffiliateBar />
        </section>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Kartendaten nicht verfügbar</p>
              <p className="text-xs mt-1 text-amber-600">Pokémon TCG API-Key in Vercel Env-Vars prüfen.</p>
            </div>
          </div>
        )}

        {/* Card sections */}
        <div id="karten" className="space-y-10">
          {topGainers.length > 0 && (
            <CardGrid cards={topGainers} title="🚀 Top Investment-Karten" />
          )}
          {topValue.length > 0 && (
            <CardGrid cards={topValue} title="💎 Höchste Kartenwerte" />
          )}
        </div>

        {/* Blog teaser */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Blog</p>
              <h2 className="text-lg font-black text-gray-900">Täglich neue Artikel</h2>
            </div>
            <a href="/artikel" className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
              Alle ansehen →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { emoji: '📊', label: 'Marktanalyse', sub: 'Jeden Montag', href: '/artikel' },
              { emoji: '🃏', label: 'Karte im Fokus', sub: 'Jeden Dienstag', href: '/artikel' },
              { emoji: '💡', label: 'Investment-Tipp', sub: 'Jeden Mittwoch', href: '/artikel' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-violet-200 hover:shadow-sm transition-all flex items-center gap-3 group"
              >
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section id="newsletter">
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
