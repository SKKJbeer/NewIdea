import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ErsatzBild } from '@/components/ErsatzBild';
import { ladePokemonUebersicht } from '@/lib/pokemon-daten';
import { formatCount, formatEurRounded } from '@/lib/format';
import { SECTION_LABEL } from '@/lib/ui';
import type { PokemonUebersicht } from '@/lib/pokemon-seiten';
import type { Metadata } from 'next';

export const revalidate = 21600;

export const metadata: Metadata = {
  title: 'Pokémon-Karten nach Pokémon — alle Versionen & Preise',
  description:
    'Alle Pokémon-Sammelkarten nach Pokémon sortiert: Glurak, Pikachu, Nachtara und mehr — jede Version mit aktuellem Cardmarket-Preis.',
};

export default async function PokemonUebersichtSeite() {
  // Wie /sets: zur Laufzeit wirft ein Ausfall (error.tsx, nie gecacht); beim Build
  // bleibt die Seite leer, damit ein Aussetzer nicht das Deployment verhindert.
  let alle: PokemonUebersicht[] = [];
  try {
    alle = await ladePokemonUebersicht();
  } catch (err) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') throw err;
  }
  const beliebt = alle.filter((p) => p.spitze).slice(0, 60);
  const azListe = [...alle].sort((a, b) => a.de.localeCompare(b.de, 'de'));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Sparkles size={10} /> {formatCount(alle.length)} Pokémon
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white">
            Karten nach <span className="text-violet-400">Pokémon</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Jede Version deines Lieblings-Pokémon auf einen Blick — mit Cardmarket-Preis, sortiert nach Marktwert.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 pb-16 space-y-12">
        <section>
          <p className={`${SECTION_LABEL} mb-4`}>Die meisten Karten</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {beliebt.map((p) => (
              <Link
                key={p.slug}
                href={`/pokemon/${p.slug}`}
                className="group rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-3 hover:border-violet-500/30 hover:bg-[#1a1a28] transition-all"
              >
                <div className="relative mx-auto aspect-[63/88] w-full max-w-[140px] overflow-hidden rounded-lg ring-1 ring-white/5 transition-transform group-hover:-translate-y-1">
                  {p.spitze && <ErsatzBild src={p.spitze.bild} alt={`${p.de}: ${p.spitze.name}`} fill sizes="140px" className="object-cover" />}
                </div>
                <p className="mt-3 font-bold text-white">{p.de}</p>
                <p className="text-[11px] text-slate-500">
                  {p.en} · {formatCount(p.karten)} Karten
                </p>
                {p.spitze && <p className="text-[11px] text-slate-600 mt-0.5">bis {formatEurRounded(p.spitze.preis)}</p>}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <p className={`${SECTION_LABEL} mb-4`}>Alle Pokémon von A bis Z</p>
          <div className="flex flex-wrap gap-2">
            {azListe.map((p) => (
              <Link
                key={p.slug}
                href={`/pokemon/${p.slug}`}
                prefetch={false}
                className="rounded-full border border-[#2a2a3a] bg-[#13131e] px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500/30 hover:text-white transition-colors"
              >
                {p.de} <span className="text-slate-600 tabular-nums">{p.karten}</span>
              </Link>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-slate-600 text-center">
          Inoffizielle Fan-Seite · Preise: Cardmarket (EUR) ohne Gewähr · keine Anlageberatung
        </p>
      </main>
    </div>
  );
}
