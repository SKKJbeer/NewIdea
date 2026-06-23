import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { GUIDES } from '@/lib/guides';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Pokémon Karten Guides — PokéMarket Intelligence',
  description: 'Kostenlose Pokémon-Karten-Guides für Sammler und Investoren: Seltenheitsstufen, Grading, Lagerung und Investment-Strategien verständlich erklärt.',
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <BookOpen size={10} />
            Expertenwissen, leicht erklärt
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white">
            Pokémon Karten<br /><span className="text-violet-400">Guides</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Alles was du über Pokémon-Karten wissen musst — von Seltenheitsstufen über Grading bis zur richtigen Investment-Strategie.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-5 space-y-3">
        {GUIDES.map((guide, i) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className={`block rounded-2xl border transition-all group p-5 ${
              i === 0
                ? 'border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30'
                : 'border-[#2a2a3a] bg-[#13131e] hover:border-violet-500/30 hover:bg-[#1a1a28]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl shrink-0">{guide.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{guide.badge}</span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Clock size={10} /> {guide.readingTimeMin} Min
                  </span>
                  {i === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">Empfohlen</span>}
                </div>
                <h2 className="text-sm font-bold text-slate-200 group-hover:text-white leading-snug transition-colors">
                  {guide.title}
                </h2>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {guide.metaDescription}
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-700 group-hover:text-violet-400 shrink-0 mt-1 transition-colors" />
            </div>
          </Link>
        ))}

        <p className="text-center text-xs text-slate-700 pt-4">
          Alle Guides werden von Pokémon-TCG-Experten verfasst und regelmäßig aktualisiert.
        </p>
      </main>
    </div>
  );
}
