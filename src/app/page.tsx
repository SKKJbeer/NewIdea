import { Suspense } from 'react';
import { fetchTopValueCards } from '@/lib/pokemon-api';
import { CardGrid } from '@/components/CardGrid';
import { MoverList } from '@/components/MoverList';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { SearchBox } from '@/components/SearchBox';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NavBar } from '@/components/NavBar';
import { Zap, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

export default async function Home() {
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
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero — schlicht */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-10 text-center sm:pt-16">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
            <Zap size={11} className="fill-violet-500 text-violet-500" />
            Echte Cardmarket-Preise · täglich aktualisiert
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Was ist deine Pokémon-Karte <span className="text-violet-600">wert?</span>
          </h1>
          <p className="mx-auto mb-6 max-w-md text-sm text-gray-500 sm:text-base">
            Suche jede Karte, sieh den aktuellen Marktwert, Trend und Preisverlauf.
          </p>
          <SearchBox placeholder="Karte suchen, z.B. Glurak oder Charizard …" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 pt-10 pb-16">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Kartendaten momentan nicht verfügbar</p>
              <p className="mt-1 text-xs text-amber-600">Bitte später erneut versuchen.</p>
            </div>
          </div>
        )}

        {/* Markt-Bewegungen: Top 10 Gewinner & Verlierer */}
        {(gainers.length > 0 || losers.length > 0) && (
          <section>
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Markt-Bewegungen</p>
              <h2 className="text-xl font-black text-gray-900">Gewinner &amp; Verlierer (30 Tage)</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {gainers.length > 0 && <MoverList cards={gainers} title="Top 10 Gewinner" variant="gainer" />}
              {losers.length > 0 && <MoverList cards={losers} title="Top 10 Verlierer" variant="loser" />}
            </div>
          </section>
        )}

        {/* Trennung + Karten */}
        {topValue.length > 0 && (
          <section id="karten">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Karten</p>
                <h2 className="text-xl font-black text-gray-900">Wertvollste Karten</h2>
              </div>
              <a href="/suche" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800">
                Alle durchsuchen <ArrowRight size={13} />
              </a>
            </div>
            <CardGrid cards={topValue} />
          </section>
        )}

        {/* Blog */}
        <section>
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
        </section>

        {/* Newsletter */}
        <section id="newsletter">
          <Suspense>
            <NewsletterSignup />
          </Suspense>
        </section>

        {/* Partner */}
        <section>
          <p className="mb-2 text-[11px] text-gray-400">Partner &amp; Affiliate-Links</p>
          <AffiliateBar />
        </section>

        <footer className="space-y-3 border-t border-gray-200 pt-6">
          <p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-gray-400">
            PokéMarket Intelligence ist kein Finanzberater. Alle Preisangaben (Cardmarket, EUR) ohne Gewähr.{' '}
            <span className="text-gray-300">•</span> Affiliate-Links: Bei Käufen über unsere Links erhalten wir eine kleine Provision.
          </p>
          <div className="flex justify-center gap-5 text-xs">
            <a href="/impressum" className="text-gray-400 transition-colors hover:text-violet-600">Impressum</a>
            <span className="text-gray-200">|</span>
            <a href="/datenschutz" className="text-gray-400 transition-colors hover:text-violet-600">Datenschutz</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
