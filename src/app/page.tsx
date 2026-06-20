import { Suspense } from 'react';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { CardGrid } from '@/components/CardGrid';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { AffiliateBar } from '@/components/AffiliateBar';
import { Zap, Mail, PlayCircle } from 'lucide-react';

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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-violet-200 text-sm mb-6">
              <Zap size={14} className="text-yellow-300" />
              KI-gestützte Marktanalyse • Täglich aktualisiert
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              Pokémon<span className="text-yellow-300">Market</span>
              <br />
              Intelligence
            </h1>
            <p className="text-violet-200 text-lg max-w-xl mx-auto mb-8">
              Echtzeit-Preisanalysen, Investment-Scores und KI-Marktberichte für
              Pokémon-Karten-Sammler und Investoren.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#newsletter"
                className="bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition-colors flex items-center gap-2 justify-center"
              >
                <Mail size={18} /> Newsletter abonnieren
              </a>
              <a
                href="https://youtube.com/@pokemarketintelligence"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 justify-center"
              >
                <PlayCircle size={18} /> YouTube ansehen
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <section>
          <p className="text-xs text-gray-400 mb-2">Partner & Affiliate-Links</p>
          <AffiliateBar />
        </section>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Karten analysiert', value: cards.length.toString() },
            { label: 'Updates täglich', value: '24' },
            { label: 'Newsletter', value: 'Kostenlos' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm"
            >
              <p className="text-2xl font-black text-violet-700">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
            ⚠️ Karten-Daten konnten nicht geladen werden. Bitte Pokémon TCG API-Key in .env.local setzen.
          </div>
        )}

        {topGainers.length > 0 && (
          <CardGrid cards={topGainers} title="🚀 Top Investment-Karten dieser Woche" />
        )}

        {topValue.length > 0 && (
          <CardGrid cards={topValue} title="💎 Höchste Kartenwerte" />
        )}

        <section id="newsletter">
          <Suspense>
            <NewsletterSignup />
          </Suspense>
        </section>

        <footer className="border-t border-gray-200 pt-6 pb-10 space-y-3">
          <p className="text-xs text-gray-400 text-center max-w-2xl mx-auto">
            PokéMarket Intelligence ist kein Finanzberater. Alle Preisangaben ohne Gewähr.
            Pokémon-Karten sind Sachwerte mit Marktrisiken. Affiliate-Links: Bei Käufen über
            unsere Links erhalten wir eine kleine Provision — für dich ohne Mehrkosten.
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="/impressum" className="text-gray-400 hover:text-violet-600 transition-colors">Impressum</a>
            <span className="text-gray-200">|</span>
            <a href="/datenschutz" className="text-gray-400 hover:text-violet-600 transition-colors">Datenschutz</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
