import { NavBar } from '@/components/NavBar';
import { CardGrid } from '@/components/CardGrid';
import { SearchBox } from '@/components/SearchBox';
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
    <div className="min-h-screen bg-gray-50">
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <NavBar />

      <header className="bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-900 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-12 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-violet-200 text-xs mb-4">
            <Search size={12} />
            Karten-Suche
          </div>
          <h1 className="text-2xl sm:text-4xl font-black mb-3">
            Was ist deine Karte <span className="text-yellow-300">wert?</span>
          </h1>
          <p className="text-violet-200 text-sm max-w-md mx-auto mb-6">
            Suche eine Pokémon-Karte und sieh sofort Marktwert, Trend und 30-Tage-Preisverlauf.
          </p>
          <SearchBox initialQuery={query} autoFocus={!query} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {query.length < 2 ? (
          <div className="text-center text-gray-400 py-16">
            <Search size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Gib mindestens 2 Zeichen ein, z.&nbsp;B. „Pikachu", „Charizard" oder „Mewtu".</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-center">
            <p className="font-semibold">⚠️ Suche momentan nicht verfügbar</p>
            <p className="text-sm mt-1 text-amber-600">Bitte versuche es später erneut.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <SearchX size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Keine Karten für „<span className="font-semibold text-gray-600">{query}</span>" gefunden.</p>
            <p className="text-xs mt-1">Tipp: Versuche den englischen Kartennamen (z.&nbsp;B. „Charizard" statt „Glurak").</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-semibold text-gray-900">{results.length}</span> Treffer für „<span className="font-semibold text-gray-900">{query}</span>"
            </p>
            <CardGrid cards={results} />
          </>
        )}
      </main>

      <p className="text-center text-xs text-gray-400 pb-10">
        Preisangaben in EUR ohne Gewähr. Kein Anlageversprechen.
      </p>
    </div>
  );
}
