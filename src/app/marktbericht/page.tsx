import { Suspense } from 'react';
import Link from 'next/link';
import { CardGrid } from '@/components/CardGrid';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { NavBar } from '@/components/NavBar';
import { Calendar, Zap, Shield, TrendingUp, Brain, ChevronLeft, Archive } from 'lucide-react';
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
    description: 'Wöchentliche KI-Marktanalyse für Pokémon-Karten-Sammler und Investoren.',
  };
}

export default async function MarktberichtPage() {
  const [report, allMeta] = await Promise.all([
    loadLatestMarketReport().catch(() => null),
    listMarketReportMeta().catch(() => []),
  ]);

  const hasContent = !!report;
  const previousReports = allMeta.slice(1); // everything except the latest

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <header className="bg-gradient-to-br from-violet-800 via-indigo-800 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-violet-200 text-xs mb-5">
            <Calendar size={12} />
            {report ? `KW ${report.weekNumber} · ${formatWeekDate(report.weekStart)}` : 'Wöchentlich aktualisiert'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
            Wöchentliche<br /><span className="text-yellow-300">Marktanalyse</span>
          </h1>
          <p className="text-violet-200 text-sm sm:text-base max-w-md mx-auto mb-6">
            KI-gestützte Investment-Analyse für Pokémon-Karten-Sammler und Investoren.
          </p>
          <div className="flex justify-center gap-6 text-violet-300 text-xs">
            <div className="flex items-center gap-1.5"><Brain size={12} />KI-Analyse</div>
            <div className="flex items-center gap-1.5"><TrendingUp size={12} />Echtzeit-Preise</div>
            <div className="flex items-center gap-1.5"><Zap size={12} />Wöchentlich neu</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-8 -mt-6">
        {!hasContent && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm flex items-start gap-3">
            <span className="text-xl">📅</span>
            <div>
              <p className="font-semibold">Erster Bericht noch ausstehend</p>
              <p className="text-xs mt-1 text-amber-600">
                Der erste Wochenbericht wird automatisch jeden Montag um 07:00 Uhr UTC generiert.
                Du kannst ihn auch manuell über das{' '}
                <a href="/studio" className="underline">Studio</a> anstoßen.
              </p>
            </div>
          </div>
        )}

        {report?.reportText && (
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
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{report.reportText}</p>
            </div>
          </section>
        )}

        {report && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Top Gewinner', value: `${report.topGainers.length}`, icon: '📈' },
              { label: 'Wertvollste Karten', value: `${report.topValue.length}`, icon: '💎' },
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

        {report && report.topGainers.length > 0 && (
          <div className="space-y-8">
            <CardGrid cards={report.topGainers} title="🚀 Top Investment-Karten" />
            {report.topValue.length > 0 && <CardGrid cards={report.topValue} title="💎 Höchste Kartenwerte" />}
          </div>
        )}

        {/* Archiv-Navigation */}
        {previousReports.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive size={15} className="text-violet-500" />
                <p className="text-sm font-bold text-gray-900">Frühere Berichte</p>
              </div>
              <Link href="/marktbericht/archiv" className="text-xs font-semibold text-violet-600 hover:text-violet-800">
                Alle anzeigen →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {previousReports.slice(0, 4).map((meta) => (
                <Link
                  key={meta.weekStart}
                  href={`/marktbericht/${meta.weekStart}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-violet-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar size={13} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700">
                        KW {meta.weekNumber}
                      </p>
                      <p className="text-xs text-gray-400">{formatWeekDate(meta.weekStart)}</p>
                    </div>
                  </div>
                  <ChevronLeft size={15} className="text-gray-300 group-hover:text-violet-500 rotate-180" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Shield size={10} />Partner & Affiliate-Links</p>
          <AffiliateBar />
        </section>

        <section id="newsletter">
          <div className="text-center mb-4">
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Newsletter</p>
            <h2 className="text-xl font-black text-gray-900">Jeden Montag direkt ins Postfach</h2>
            <p className="text-gray-500 text-sm mt-1">Die komplette Marktanalyse als E-Mail — kostenlos.</p>
          </div>
          <Suspense><NewsletterSignup /></Suspense>
        </section>

        <footer className="border-t border-gray-200 pt-6 space-y-3">
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-center space-y-1">
            <p className="text-[11px] font-semibold text-amber-800">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Alle Inhalte dienen ausschließlich der Information — <strong>keine Anlageberatung</strong>.
              Preisangaben (Cardmarket, EUR) ohne Gewähr.
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
