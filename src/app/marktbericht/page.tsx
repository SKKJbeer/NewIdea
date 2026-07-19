import Link from 'next/link';
import { CardGrid } from '@/components/CardGrid';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NavBar } from '@/components/NavBar';
import { Calendar, CalendarDays, Zap, Shield, TrendingUp, BarChart3, ChevronLeft, Archive, Gem } from 'lucide-react';
import { loadLatestMarketReport, listMarketReportMeta } from '@/lib/market-report-storage';
import type { Metadata } from 'next';

export const revalidate = 3600;

function formatWeekDate(weekStart: string) {
  const d = new Date(weekStart + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata(): Promise<Metadata> {
  const report = await loadLatestMarketReport().catch(() => null);
  const week = report?.weekNumber ?? '—';
  return {
    title: `Marktanalyse KW ${week} — PokéMarket Intelligence`,
    description: 'Wöchentliche Marktanalyse für Pokémon-Karten-Sammler und Investoren.',
  };
}

export default async function MarktberichtPage() {
  const [report, allMeta] = await Promise.all([
    loadLatestMarketReport().catch(() => null),
    listMarketReportMeta().catch(() => []),
  ]);

  const hasContent = !!report;
  const previousReports = allMeta.slice(1);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 sm:py-20 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-violet-400 text-xs">
            <Calendar size={12} />
            {report ? `KW ${report.weekNumber} · ${formatWeekDate(report.weekStart)}` : 'Wöchentlich aktualisiert'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight text-white">
            Wöchentliche<br /><span className="text-violet-400">Marktanalyse</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-6">
            Datenbasierte Investment-Analyse für Pokémon-Karten-Sammler und Investoren.
          </p>
          <div className="flex justify-center gap-6 text-slate-600 text-xs">
            <div className="flex items-center gap-1.5"><BarChart3 size={12} />Marktanalyse</div>
            <div className="flex items-center gap-1.5"><TrendingUp size={12} />Echtzeit-Preise</div>
            <div className="flex items-center gap-1.5"><Zap size={12} />Wöchentlich neu</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-8 -mt-6">
        {!hasContent && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-amber-400 flex items-start gap-3">
            <CalendarDays size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erster Bericht noch ausstehend</p>
              <p className="text-xs mt-1 text-amber-400/60">
                Der Wochenbericht erscheint jeden Montag mit den aktuellen Marktdaten.
              </p>
            </div>
          </div>
        )}

        {report?.reportText && (
          <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
            <div className="bg-[#1a1a28] px-5 py-4 border-b border-[#1e1e30] flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <Zap size={15} className="text-yellow-300 fill-yellow-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Marktbericht</p>
                <h2 className="text-sm font-black text-slate-200">Diese Woche im Überblick</h2>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{report.reportText}</p>
            </div>
          </section>
        )}

        {report && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Top Gewinner', value: `${report.topGainers.length}`, icon: TrendingUp },
              { label: 'Wertvollste Karten', value: `${report.topValue.length}`, icon: Gem },
              { label: 'Marktbericht', value: 'Live', icon: BarChart3 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-3 sm:p-4 text-center">
                <div className="mb-1 flex justify-center text-violet-400"><stat.icon size={20} /></div>
                <p className="text-lg sm:text-2xl font-black text-violet-400">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {report && report.topGainers.length > 0 && (
          <div className="space-y-8">
            <CardGrid cards={report.topGainers} title="Top Investment-Karten" />
            {report.topValue.length > 0 && <CardGrid cards={report.topValue} title="Höchste Kartenwerte" />}
          </div>
        )}

        {previousReports.length > 0 && (
          <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e30] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive size={15} className="text-violet-400" />
                <p className="text-sm font-bold text-slate-200">Frühere Berichte</p>
              </div>
              <Link href="/marktbericht/archiv" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
                Alle anzeigen →
              </Link>
            </div>
            <div className="divide-y divide-[#1e1e30]">
              {previousReports.slice(0, 4).map((meta) => (
                <Link
                  key={meta.weekStart}
                  href={`/marktbericht/${meta.weekStart}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a28] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar size={13} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        KW {meta.weekNumber}
                      </p>
                      <p className="text-xs text-slate-600">{formatWeekDate(meta.weekStart)}</p>
                    </div>
                  </div>
                  <ChevronLeft size={15} className="text-slate-700 group-hover:text-violet-400 rotate-180 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="text-xs text-slate-700 mb-2 flex items-center gap-1"><Shield size={10} />Partner & Affiliate-Links</p>
          <AffiliateBar />
        </section>

        <footer className="space-y-4 border-t border-[#1e1e30] pt-6">
          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center space-y-1">
            <p className="text-xs font-bold text-amber-400/80">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-400/60 leading-relaxed">
              Alle Inhalte dienen ausschließlich der Information — <strong className="text-amber-400/80">keine Anlageberatung</strong>.
              Preisangaben (Cardmarket, EUR) ohne Gewähr.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
