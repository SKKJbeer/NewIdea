import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { CardGrid } from '@/components/CardGrid';
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import { loadMarketReportByWeek, listMarketReportMeta } from '@/lib/market-report-storage';
import type { Metadata } from 'next';

export const revalidate = 3600;

function formatWeekDate(weekStart: string) {
  const d = new Date(weekStart + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const report = await loadMarketReportByWeek(week).catch(() => null);
  if (!report) return { title: 'Bericht nicht gefunden' };
  return {
    title: `Marktanalyse KW ${report.weekNumber} — PokéMarket Intelligence`,
    description: `Wöchentliche Pokémon-Karten-Marktanalyse für KW ${report.weekNumber} (${formatWeekDate(report.weekStart)}).`,
  };
}

export default async function WeeklyReportPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) notFound();

  const [report, allMeta] = await Promise.all([
    loadMarketReportByWeek(week).catch(() => null),
    listMarketReportMeta().catch(() => []),
  ]);

  if (!report) notFound();

  // Prev / next week navigation
  const idx = allMeta.findIndex((m) => m.weekStart === week);
  const newerReport = idx > 0 ? allMeta[idx - 1] : null;       // sorted desc, so idx-1 is newer
  const olderReport = idx >= 0 && idx < allMeta.length - 1 ? allMeta[idx + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <header className="bg-gradient-to-br from-violet-800 via-indigo-800 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-14 sm:py-16">
          <Link
            href="/marktbericht"
            className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white text-xs mb-5 transition-colors"
          >
            <ArrowLeft size={12} /> Aktueller Bericht
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-violet-200 text-xs">
              <Calendar size={11} />
              KW {report.weekNumber} · {formatWeekDate(report.weekStart)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight">
            Marktanalyse <span className="text-yellow-300">KW {report.weekNumber}</span>
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-8 -mt-4">
        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between">
          {olderReport ? (
            <Link
              href={`/marktbericht/${olderReport.weekStart}`}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold"
            >
              <ChevronLeft size={16} /> KW {olderReport.weekNumber}
            </Link>
          ) : (
            <span />
          )}
          <Link href="/marktbericht/archiv" className="text-xs text-gray-400 hover:text-violet-600 transition-colors">
            Alle Berichte
          </Link>
          {newerReport ? (
            <Link
              href={`/marktbericht/${newerReport.weekStart}`}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold"
            >
              KW {newerReport.weekNumber} <ChevronRight size={16} />
            </Link>
          ) : (
            <Link
              href="/marktbericht"
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold"
            >
              Aktuell <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {/* Report text */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 border-b border-violet-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <Zap size={15} className="text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">KI-Marktbericht</p>
              <h2 className="text-sm font-black text-gray-900">Wochenüberblick KW {report.weekNumber}</h2>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{report.reportText}</p>
          </div>
        </section>

        {/* Cards */}
        {report.topGainers.length > 0 && (
          <div className="space-y-8">
            <CardGrid cards={report.topGainers} title="🚀 Top Investment-Karten" />
            {report.topValue.length > 0 && <CardGrid cards={report.topValue} title="💎 Höchste Kartenwerte" />}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {olderReport ? (
            <Link
              href={`/marktbericht/${olderReport.weekStart}`}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold"
            >
              <ChevronLeft size={16} /> KW {olderReport.weekNumber}
            </Link>
          ) : (
            <span />
          )}
          {newerReport ? (
            <Link
              href={`/marktbericht/${newerReport.weekStart}`}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold"
            >
              KW {newerReport.weekNumber} <ChevronRight size={16} />
            </Link>
          ) : (
            <Link
              href="/marktbericht"
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold"
            >
              Aktuell <ChevronRight size={16} />
            </Link>
          )}
        </div>

        <footer className="border-t border-gray-200 pt-5 space-y-3">
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-center space-y-1">
            <p className="text-[11px] font-semibold text-amber-800">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-700">
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
