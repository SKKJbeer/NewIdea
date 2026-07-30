import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { Package, Calendar, Layers } from 'lucide-react';
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
  // BEWUSST OHNE `.catch(() => [])`: Ein verschluckter Fehler wurde hier mit
  // `revalidate = 86400` einen GANZEN TAG als Leerzustand gecacht. Lässt man
  // ihn laufen, behält Next.js die zuletzt erfolgreiche Seite und zeigt
  // `error.tsx` nur bei kaltem Cache — mit Wiederholmöglichkeit.
  const sets = await fetchRecentSets(24);

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
          <div className="mx-auto max-w-md rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Package size={20} />
            </div>
            <p className="font-semibold text-slate-200">Noch keine Sets geladen</p>
            <p className="mt-1 text-sm text-slate-500">
              Die Set-Übersicht wird gleich befüllt. In der Zwischenzeit findest du jede Karte über die Suche.
            </p>
            <Link
              href="/suche"
              className="mt-4 inline-block rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-700"
            >
              Zur Kartensuche
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((set) => (
              <Link
                key={set.id}
                href={`/sets/${set.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#13131e] hover:border-violet-500/40 hover:bg-[#161622] transition-all"
              >
                {/* Logo-Well: einheitliche Höhe, Logo zentriert — ein konsistentes Raster */}
                <div className="relative flex h-28 items-center justify-center border-b border-[#1e1e30] bg-gradient-to-b from-[#191926] to-[#101018] px-6">
                  <BoosterPackImage
                    setCode={set.id}
                    setName={set.name}
                    logoUrl={set.logoUrl}
                    className="max-h-16 w-auto max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>

                {/* Metadaten: klare Hierarchie, dezente Meta-Pillen */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div>
                    <p className="truncate text-[15px] font-bold text-white">{set.name}</p>
                    {set.series && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{set.series}</p>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                    {formatReleaseDate(set.releaseDate) && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#2a2a3a] bg-[#0d0d18] px-2 py-0.5 text-[11px] text-slate-400">
                        <Calendar size={10} className="text-slate-500" />
                        {formatReleaseDate(set.releaseDate)}
                      </span>
                    )}
                    {set.total > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#2a2a3a] bg-[#0d0d18] px-2 py-0.5 text-[11px] text-slate-400">
                        <Layers size={10} className="text-slate-500" />
                        {set.total} Karten
                      </span>
                    )}
                  </div>
                </div>
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
