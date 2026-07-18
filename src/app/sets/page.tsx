import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { Package, ChevronRight, Calendar } from 'lucide-react';
import { fetchRecentSets } from '@/lib/pokemon-api';
import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Pokémon TCG Sets — Kartenpreise & Übersicht aller Erweiterungen',
  description:
    'Alle aktuellen Pokémon-TCG-Sets im Überblick: Erscheinungsdatum, Kartenanzahl und die wertvollsten Karten jedes Sets mit aktuellen Cardmarket-Preisen.',
};

function formatReleaseDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(/\//g, '-') + 'T12:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

export default async function SetsPage() {
  const sets = await fetchRecentSets(24).catch(() => []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Package size={10} /> Set-Übersicht
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white">
            Pokémon TCG <span className="text-violet-400">Sets</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Die aktuellen Erweiterungen mit ihren wertvollsten Karten und Cardmarket-Preisen.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-16">
        {sets.length === 0 ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center max-w-md mx-auto">
            <p className="font-semibold text-amber-400">Set-Daten momentan nicht verfügbar</p>
            <p className="text-sm mt-1 text-amber-400/60">Bitte später erneut versuchen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sets.map((set) => (
              <Link
                key={set.id}
                href={`/sets/${set.id}`}
                className="flex items-center gap-4 rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4 hover:border-violet-500/30 hover:bg-[#1a1a28] transition-all group"
              >
                <BoosterPackImage
                  setCode={set.id}
                  setName={set.name}
                  className="h-20 w-auto shrink-0 object-contain drop-shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white leading-snug transition-colors">
                    {set.name}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{set.series}</p>
                  <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatReleaseDate(set.releaseDate)}
                    {set.total > 0 && <span className="text-slate-700"> · {set.total} Karten</span>}
                  </p>
                </div>
                <ChevronRight size={15} className="text-slate-700 group-hover:text-violet-400 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-[#1e1e30] pt-5 space-y-3">
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
