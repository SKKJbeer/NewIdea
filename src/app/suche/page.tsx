import { NavBar } from '@/components/NavBar';
import { SearchBox } from '@/components/SearchBox';
import { SearchResultsLang } from '@/components/SearchResultsLang';
import type { searchCards } from '@/lib/pokemon-api';
import { cachedSearchCards } from '@/lib/search-cache';
import { getMarketBenchmark } from '@/lib/market-context';
import { Search, SearchX, TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';
import { jsonLd } from '@/lib/json-ld';
import { siteUrlOrLocal } from '@/lib/site';
import { SECTION_LABEL } from '@/lib/ui';

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
      description: `Cardmarket-Preise, Trend und Markt-Score für Pokémon-Karten mit „${query}". Angaben ohne Gewähr.`,
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
      results = await cachedSearchCards(query, 40);
    } catch {
      error = true;
    }
  }

  // INDEXWERT FÜR DEN MARKTBEZUG DER TREFFER.
  //
  // Genau dafür wurde der Tagesstand in die Datenbank gelegt: EINE Zeile statt
  // 250 Karten aus dem Netz. Ohne ihn hätte diese Seite die volle Stichprobe
  // nachladen müssen — für eine einzige Vergleichszahl, bei jedem Tastendruck.
  //
  // Schlägt der Abruf fehl, bleibt die Spalte leer. Ein fehlender Vergleich ist
  // kein Fehler der Suche; eine erfundene Null wäre einer.
  const markt = await getMarketBenchmark().catch(() => null);

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
            url: `${siteUrlOrLocal()}/karten/${card.id}`,
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
        />
      )}

      <NavBar />

      {/* KOPF NACH DEM GEMEINSAMEN MUSTER.
          Hier standen drei Dinge, die DESIGN.md ausdrücklich ausschliesst: ein
          Pillen-Etikett, eine zentrierte Werbeüberschrift („Was ist deine Karte
          wert?") und ein grosses abgerundetes Suchfeld als Blickfang, dazu ein
          Verlauf hinter der Überschrift. Diese Seite hatte den Umbau schlicht
          nie mitgemacht — und eine Seite, die anders aussieht als die übrigen,
          ist genau der Bruch, den ein einheitliches System verhindern soll.

          Linksbündig, Abschnittsmarke, keine Pille, kein Verlauf. Das Suchfeld
          bleibt gross genug zum Tippen, ist aber nicht mehr die Hauptaussage
          der Seite — die Treffer sind es. */}
      <header className="border-b border-[#1c1c24]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
          <p className={SECTION_LABEL}>Karten · Pokémon</p>
          <h1 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            {query ? <>Treffer für „{query}"</> : 'Kartensuche'}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Marktwert, gemessene 30-Tage-Bewegung und der Abstand zum Index — für
            jede Karte in derselben Zeile.
          </p>
          <div className="mt-6 max-w-xl">
            <SearchBox initialQuery={query} autoFocus={!query} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {query.length < 2 ? (
          <div className="text-center text-slate-600 py-16">
            <Search size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Gib mindestens 2 Zeichen ein, z.&nbsp;B. „Pikachu", „Charizard" oder „Mewtu".</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto rounded-none border border-amber-500/20 bg-amber-500/5 p-5 text-amber-400 text-center">
            <p className="font-semibold flex items-center justify-center gap-1.5"><TriangleAlert size={14} /> Suche momentan nicht verfügbar</p>
            <p className="text-sm mt-1 text-amber-400/60">Bitte versuche es später erneut.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-slate-600 py-16">
            <SearchX size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Keine Karten für „<span className="font-semibold text-slate-400">{query}</span>" gefunden.</p>
            <p className="text-xs mt-1">Tipp: Versuche den englischen Kartennamen (z.&nbsp;B. „Charizard" statt „Glurak").</p>
          </div>
        ) : (
          <SearchResultsLang cards={results} query={query} cbi={markt?.value ?? null} />
        )}
      </main>

      <p className="text-center text-xs text-slate-700 pb-10">
        Preisangaben in EUR ohne Gewähr. Kein Anlageversprechen.
      </p>
    </div>
  );
}
