import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { DAY_TYPE, ARTICLE_META, ARTICLE_PREVIEW_TITLES, ARTICLE_PREVIEW_SUBTITLES } from '@/lib/article-generator';
import { listSavedArticleMeta } from '@/lib/article-storage';
import { GUIDES } from '@/lib/guides';
import { Calendar, Clock, ChevronRight, Zap, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pokémon Investment Blog — PokéMarket Intelligence',
  description: 'Tägliche KI-Analysen, Investment-Strategien und Marktberichte für Pokémon-Karten-Sammler.',
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

export default async function ArtikelListPage() {
  const articles = getLast14Days();
  const today = articles[0];

  // Real titles from Supabase — gracefully empty if not yet generated or table missing
  const savedMeta = await listSavedArticleMeta().catch(() => [] as Awaited<ReturnType<typeof listSavedArticleMeta>>);
  const titleByDate = new Map(savedMeta.map((m) => [m.date, m.title]));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

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
        <Link
          href={`/artikel/${today.date}`}
          className="block bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl shadow-md hover:shadow-lg transition-all group p-5 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">{today.meta.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">{today.meta.category}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">Heute neu</span>
              </div>
              <h2 className="text-base font-black group-hover:opacity-90 leading-snug">
                {titleByDate.get(today.date) || ARTICLE_PREVIEW_TITLES[today.type]}
              </h2>
              <p className="text-violet-200/80 text-xs mt-1 leading-snug">{ARTICLE_PREVIEW_SUBTITLES[today.type]}</p>
              <p className="text-violet-300 text-[10px] mt-1.5 flex items-center gap-1"><Calendar size={9} /> {today.dateLabel}</p>
            </div>
            <ChevronRight size={18} className="text-white/60 group-hover:text-white shrink-0 mt-1" />
          </div>
        </Link>

        {articles.slice(1).map(({ date, type, meta, dateLabel }) => (
          <Link
            key={date}
            href={`/artikel/${date}`}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-violet-200 hover:shadow-md transition-all group p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">{meta.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${COLOR_BADGE[meta.color]}`}>{meta.category}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} /> ~3 Min</span>
                </div>
                <h2 className="text-sm font-bold text-gray-900 group-hover:text-violet-700 leading-snug">
                  {titleByDate.get(date) || ARTICLE_PREVIEW_TITLES[type]}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-1">{ARTICLE_PREVIEW_SUBTITLES[type]}</p>
                <p className="text-[10px] text-gray-300 mt-0.5 flex items-center gap-1"><Calendar size={9} /> {dateLabel}</p>
              </div>
              <ChevronRight size={15} className="text-gray-300 group-hover:text-violet-500 shrink-0 mt-1" />
            </div>
          </Link>
        ))}

        {/* Guides Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-violet-600" />
              <p className="text-sm font-bold text-gray-900">Experten-Guides</p>
            </div>
            <Link href="/guides" className="text-xs font-semibold text-violet-600 hover:text-violet-800">
              Alle Guides →
            </Link>
          </div>
          <div className="space-y-2">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="flex items-center gap-3 bg-white border border-gray-100 hover:border-violet-200 hover:shadow-sm rounded-2xl p-3.5 transition-all group"
              >
                <span className="text-xl shrink-0">{guide.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-violet-700 leading-snug line-clamp-1">{guide.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={9} /> {guide.readingTimeMin} Min
                  </p>
                </div>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-violet-500 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pt-2">
          Alle Inhalte werden automatisch von KI generiert und stellen keine Finanzberatung dar.
        </p>
      </main>
    </div>
  );
}
