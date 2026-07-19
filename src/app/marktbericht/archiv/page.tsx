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

  const byYear = allMeta.reduce<Record<string, (typeof allMeta)[number][]>>((acc, meta) => {
    const year = getYear(meta.weekStart);
    if (!acc[year]) acc[year] = [];
    acc[year].push(meta);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:py-14">
          <Link
            href="/marktbericht"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-5 transition-colors"
          >
            ← Aktueller Bericht
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-violet-400" />
            <span className="text-slate-600 text-sm font-semibold">Archiv</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Alle <span className="text-violet-400">Marktberichte</span>
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            {allMeta.length} {allMeta.length === 1 ? 'Bericht' : 'Berichte'} gespeichert
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-4 space-y-6">
        {allMeta.length === 0 ? (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-8 text-center">
            <p className="text-slate-400 text-sm">Noch keine Berichte vorhanden.</p>
            <p className="text-slate-700 text-xs mt-1">Der erste Bericht erscheint nächsten Montag.</p>
          </div>
        ) : (
          years.map((year) => (
            <section key={year}>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">{year}</p>
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden divide-y divide-[#1e1e30]">
                {byYear[year].map((meta, i) => (
                  <Link
                    key={meta.weekStart}
                    href={i === 0 && years[0] === year ? '/marktbericht' : `/marktbericht/${meta.weekStart}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-[#1a1a28] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-violet-400 uppercase leading-none">KW</span>
                        <span className="text-sm font-black text-violet-400 leading-none">{meta.weekNumber}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                          Marktanalyse KW {meta.weekNumber}
                          {i === 0 && years[0] === year && (
                            <span className="ml-2 text-[10px] font-bold bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded-full">
                              Aktuell
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Calendar size={10} />
                          {formatWeekDate(meta.weekStart)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-slate-700 group-hover:text-violet-400 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}

        <footer className="border-t border-[#1e1e30] pt-5 space-y-3">
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold text-amber-400/80">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-400/60 mt-0.5">
              Alle Inhalte dienen ausschließlich der Information — <strong className="text-amber-400/80">keine Anlageberatung</strong>.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
