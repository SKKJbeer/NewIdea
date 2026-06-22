import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Calendar, ChevronRight, TrendingUp } from 'lucide-react';
import { listMarketReportMeta } from '@/lib/market-report-storage';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Marktanalyse-Archiv — PokéMarket Intelligence',
  description: 'Alle wöchentlichen Pokémon-Karten-Marktanalysen im Archiv.',
};

function formatWeekDate(weekStart: string) {
  const d = new Date(weekStart + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getYear(weekStart: string) {
  return weekStart.slice(0, 4);
}

export default async function MarktberichtArchivPage() {
  const allMeta = await listMarketReportMeta().catch(() => []);

  // Group by year
  const byYear = allMeta.reduce<Record<string, (typeof allMeta)[number][]>>((acc, meta) => {
    const year = getYear(meta.weekStart);
    if (!acc[year]) acc[year] = [];
    acc[year].push(meta);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <header className="bg-gradient-to-br from-violet-800 via-indigo-800 to-indigo-950 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:py-14">
          <Link
            href="/marktbericht"
            className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white text-xs mb-5 transition-colors"
          >
            ← Aktueller Bericht
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-yellow-300" />
            <span className="text-violet-300 text-sm font-semibold">Archiv</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">
            Alle <span className="text-yellow-300">Marktberichte</span>
          </h1>
          <p className="text-violet-300 text-sm mt-2">
            {allMeta.length} {allMeta.length === 1 ? 'Bericht' : 'Berichte'} gespeichert
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-4 space-y-6">
        {allMeta.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">Noch keine Berichte vorhanden.</p>
            <p className="text-gray-300 text-xs mt-1">Der erste Bericht erscheint automatisch nächsten Montag.</p>
          </div>
        ) : (
          years.map((year) => (
            <section key={year}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{year}</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {byYear[year].map((meta, i) => (
                  <Link
                    key={meta.weekStart}
                    href={i === 0 && years[0] === year ? '/marktbericht' : `/marktbericht/${meta.weekStart}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-violet-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-violet-500 uppercase leading-none">KW</span>
                        <span className="text-sm font-black text-violet-700 leading-none">{meta.weekNumber}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700">
                          Marktanalyse KW {meta.weekNumber}
                          {i === 0 && years[0] === year && (
                            <span className="ml-2 text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                              Aktuell
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={10} />
                          {formatWeekDate(meta.weekStart)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-violet-500 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}

        <footer className="border-t border-gray-200 pt-5 space-y-3">
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold text-amber-800">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-700 mt-0.5">
              Alle Inhalte dienen ausschließlich der Information — <strong>keine Anlageberatung</strong>.
            </p>
          </div>
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
