import Link from 'next/link';
import { SECTION_LABEL } from '@/lib/ui';
import { CardGrid } from '@/components/CardGrid';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NavBar } from '@/components/NavBar';
import { Calendar, CalendarDays, Zap, Shield, TrendingUp, BarChart3, ChevronLeft, Archive } from 'lucide-react';
import { loadLatestMarketReport, listMarketReportMeta } from '@/lib/market-report-storage';
import { Reveal } from '@/components/Reveal';
import { Prose } from '@/components/Prose';
import { ArticleStats } from '@/components/ArticleStats';
import { PriceBars, TrendBars, type BarItem } from '@/components/DataBars';
import { displayPrice } from '@/lib/pokemon-api';
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
    title: `Marktanalyse KW ${week}`,
    description: 'Wöchentliche Marktanalyse für Pokémon-Karten-Sammler.',
  };
}

export default async function MarktberichtPage() {
  const [report, allMeta] = await Promise.all([
    loadLatestMarketReport().catch(() => null),
    listMarketReportMeta().catch(() => []),
  ]);

  const hasContent = !!report;
  const previousReports = allMeta.slice(1);

  // Grundlage für Kennzahlen und Grafiken: die echten Karten des Berichts.
  // Doppelte Nennungen fallen raus, damit eine Karte nicht zweimal im Balken
  // steht, wenn sie sowohl unter den Gewinnern als auch bei den Werten liegt.
  const balkenDaten: BarItem[] = report
    ? [...new Map(
        [...report.topGainers, ...report.topValue]
          .filter((c) => displayPrice(c) > 0)
          .map((c) => [c.id, { name: c.name, price: displayPrice(c), trend: c.trendPercent ?? 0 }]),
      ).values()]
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      {/* Gemeinsames Kopf-Muster. Der Leuchtfleck, die zentrierte Zweizeilen-
          Überschrift mit Farbhervorhebung und die drei Merkmal-Zeilen darunter
          („Marktanalyse · Cardmarket-Preise · Wöchentlich neu") sind entfallen:
          Sie behaupteten Eigenschaften, statt den Bericht zu zeigen. Der
          Zeitraum steht jetzt dort, wo er hingehört — als Datenangabe neben der
          Abschnittsmarke. */}
      <header className="border-b border-[#1c1c24]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <p className={SECTION_LABEL}>
            Marktbericht · {report ? `KW ${report.weekNumber} · ${formatWeekDate(report.weekStart)}` : 'Pokémon'}
          </p>
          <h1 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Wöchentliche Marktanalyse
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Was sich in der vergangenen Woche bewegt hat — auf Basis der
            Cardmarket-Preise, mit offengelegter Methodik.
          </p>
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
          <Reveal className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
            <div className="bg-[#1a1a28] px-5 py-4 border-b border-[#1e1e30] flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <Zap size={15} className="text-yellow-300 fill-yellow-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Marktbericht</p>
                <h2 className="text-sm font-black text-slate-200">Diese Woche im Überblick</h2>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <Prose text={report.reportText} dropcap />
            </div>
          </Reveal>
        )}

        {/* Kennzahlen aus den echten Kartendaten des Berichts.
            Vorher standen hier die LÄNGEN der beiden Listen („Top Gewinner: 6")
            und ein festes „Live" — Zahlen, die nichts über den Markt sagen. */}
        {balkenDaten.length >= 2 && (
          <ArticleStats cards={balkenDaten} label="Karten im Bericht" />
        )}

        {report && report.topGainers.length > 0 && (
          <div className="space-y-8">
            <CardGrid cards={report.topGainers} title="Stärkste Aufwärtsbewegungen" />

            {/* Dieselben Grafiken wie im Artikel — eine Umsetzung für beide. */}
            <div className="space-y-4">
              <TrendBars items={balkenDaten} title="Marktbild — Veränderung der Woche" />
              <PriceBars items={balkenDaten} title="Preisvergleich der Woche" />
            </div>

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
