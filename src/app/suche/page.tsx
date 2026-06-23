import { NavBar } from '@/components/NavBar';
import { SearchBox } from '@/components/SearchBox';
import { SearchResultsLang } from '@/components/SearchResultsLang';
import { searchCards } from '@/lib/pokemon-api';
import { Search, SearchX } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q || '').trim();
  if (query) {
    return {
      title: `„${query}" Pokémon Karte Preis`,
      description: `Cardmarket-Preise, Trend und Investment-Score für Pokémon-Karten mit „${query}". Echtzeit-Daten ohne Gewähr.`,
    };
  }
  return {
    title: 'Pokémon-Karten suchen — Werte & Preisverlauf',
    description:
      'Suche gezielt nach Pokémon-Karten und sieh sofort Marktwert, Trend und 30-Tage-Preisverlauf. Finde heraus, wie viel deine Karten wert sind.',
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || '').trim();

  let results = [] as Awaited<ReturnType<typeof searchCards>>;
  let error = false;
  if (query.length >= 2) {
    try {
      results = await searchCards(query, 40);
    } catch {
      error = true;
    }
  }

  const structuredData =
    results.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Pokémon-Karten: ${query}`,
          numberOfItems: results.length,
          itemListElement: results.slice(0, 10).map((card, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: card.name,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com'}/karten/${card.id}`,
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-12 sm:py-14 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Search size={10} />
            Karten-Suche
          </div>
          <h1 className="text-2xl sm:text-4xl font-black mb-3 text-white">
            Was ist deine Karte <span className="text-violet-400">wert?</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Suche eine Pokémon-Karte und sieh sofort Marktwert, Trend und 30-Tage-Preisverlauf.
          </p>
          <SearchBox initialQuery={query} autoFocus={!query} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {query.length < 2 ? (
          <div className="text-center text-slate-600 py-16">
            <Search size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Gib mindestens 2 Zeichen ein, z.&nbsp;B. „Pikachu", „Charizard" oder „Mewtu".</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-amber-400 text-center">
            <p className="font-semibold">⚠️ Suche momentan nicht verfügbar</p>
            <p className="text-sm mt-1 text-amber-400/60">Bitte versuche es später erneut.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-slate-600 py-16">
            <SearchX size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Keine Karten für „<span className="font-semibold text-slate-400">{query}</span>" gefunden.</p>
            <p className="text-xs mt-1">Tipp: Versuche den englischen Kartennamen (z.&nbsp;B. „Charizard" statt „Glurak").</p>
          </div>
        ) : (
          <SearchResultsLang cards={results} query={query} />
        )}
      </main>

      <p className="text-center text-xs text-slate-700 pb-10">
        Preisangaben in EUR ohne Gewähr. Kein Anlageversprechen.
      </p>
    </div>
  );
}
