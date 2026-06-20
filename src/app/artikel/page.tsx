import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { DAY_TYPE, ARTICLE_META } from '@/lib/article-generator';
import { Calendar, Clock, ChevronRight, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pokémon Investment Blog — PokéMarket Intelligence',
  description: 'Tägliche KI-Analysen, Investment-Strategien und Marktberichte für Pokémon-Karten-Sammler. Jeden Tag ein neuer Artikel.',
  openGraph: {
    title: 'Pokémon Investment Blog',
    description: 'Tägliche KI-Analysen für Pokémon-Karten-Investoren.',
  },
};

const COLOR_BADGE: Record<string, string> = {
  violet:  'bg-violet-100 text-violet-700',
  blue:    'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  rose:    'bg-rose-100 text-rose-700',
  indigo:  'bg-indigo-100 text-indigo-700',
  gray:    'bg-gray-100 text-gray-600',
};

function getLast14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const type = DAY_TYPE[d.getDay()];
    const meta = ARTICLE_META[type];
    const dateLabel = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    return { date: dateStr, type, meta, isToday: i === 0, dateLabel };
  });
}

export default function ArtikelListPage() {
  const articles = getLast14Days();
  const today = articles[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero */}
      <header className="bg-gradient-to-br from-gray-900 via-violet-950 to-indigo-950 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-violet-200 text-xs mb-4">
            <Zap size={11} className="text-yellow-300 fill-yellow-300" />
            Täglich neuer KI-Content
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            Pokémon Investment<br /><span className="text-yellow-300">Blog</span>
          </h1>
          <p className="text-violet-200 text-sm max-w-sm mx-auto">
            Jeden Tag ein neuer Artikel — Analysen, Strategien und Guides für Sammler und Investoren.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-5 space-y-3">

        {/* Today's article — featured */}
        <Link
          href={`/artikel/${today.date}`}
          className="block bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl shadow-md hover:shadow-lg transition-all group p-5 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">{today.meta.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {today.meta.category}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">
                  Heute neu
                </span>
              </div>
              <h2 className="text-base font-black group-hover:opacity-90 transition-opacity">
                {today.meta.label}
              </h2>
              <p className="text-violet-200 text-xs mt-1">{today.dateLabel}</p>
            </div>
            <ChevronRight size={18} className="text-white/60 group-hover:text-white transition-colors shrink-0 mt-1" />
          </div>
        </Link>

        {/* Rest of articles */}
        {articles.slice(1).map(({ date, meta, dateLabel }) => (
          <Link
            key={date}
            href={`/artikel/${date}`}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-violet-200 hover:shadow-md transition-all group p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">{meta.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${COLOR_BADGE[meta.color]}`}>
                    {meta.category}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> ~3 Min
                  </span>
                </div>
                <h2 className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                  {meta.label}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Calendar size={10} /> {dateLabel}
                </p>
              </div>
              <ChevronRight size={15} className="text-gray-300 group-hover:text-violet-500 transition-colors shrink-0 mt-1" />
            </div>
          </Link>
        ))}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 pt-4">
          Alle Inhalte werden automatisch von KI generiert und stellen keine Finanzberatung dar.
        </p>
      </main>
    </div>
  );
}
