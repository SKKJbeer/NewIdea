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

const COLOR_BADGE: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  blue:   'bg-blue-100 text-blue-700',
  emerald:'bg-emerald-100 text-emerald-700',
  amber:  'bg-amber-100 text-amber-700',
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <header className="bg-gradient-to-br from-gray-900 via-violet-950 to-indigo-950 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-violet-200 text-xs mb-4">
            <BookOpen size={11} />
            Expertenwissen, leicht erklärt
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            Pokémon Karten<br /><span className="text-yellow-300">Guides</span>
          </h1>
          <p className="text-violet-200 text-sm max-w-sm mx-auto">
            Alles was du über Pokémon-Karten wissen musst — von Seltenheitsstufen über Grading bis zur richtigen Investment-Strategie.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-5 space-y-3">
        {GUIDES.map((guide, i) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className={`block rounded-2xl border shadow-sm hover:shadow-md transition-all group p-5 ${
              i === 0
                ? 'bg-gradient-to-r from-violet-600 to-indigo-700 text-white border-transparent'
                : 'bg-white border-gray-100 hover:border-violet-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl shrink-0">{guide.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    i === 0 ? 'bg-white/20 text-white' : COLOR_BADGE[guide.color]
                  }`}>{guide.badge}</span>
                  <span className={`text-[10px] flex items-center gap-1 ${i === 0 ? 'text-white/60' : 'text-gray-400'}`}>
                    <Clock size={10} /> {guide.readingTimeMin} Min
                  </span>
                  {i === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">Empfohlen</span>}
                </div>
                <h2 className={`text-sm font-bold leading-snug ${i === 0 ? 'text-white group-hover:opacity-90' : 'text-gray-900 group-hover:text-violet-700'}`}>
                  {guide.title}
                </h2>
                <p className={`text-xs mt-1 line-clamp-2 ${i === 0 ? 'text-white/70' : 'text-gray-400'}`}>
                  {guide.metaDescription}
                </p>
              </div>
              <ChevronRight size={18} className={`shrink-0 mt-1 ${i === 0 ? 'text-white/60 group-hover:text-white' : 'text-gray-300 group-hover:text-violet-500'}`} />
            </div>
          </Link>
        ))}

        <p className="text-center text-xs text-gray-400 pt-4">
          Alle Guides werden von Pokémon-TCG-Experten verfasst und regelmäßig aktualisiert.
        </p>
      </main>
    </div>
  );
}
