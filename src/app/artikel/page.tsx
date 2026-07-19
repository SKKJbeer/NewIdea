import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { ContentIcon } from '@/components/ContentIcon';
import { ARTICLE_META, ARTICLE_PREVIEW_TITLES, ARTICLE_PREVIEW_SUBTITLES, PUBLISH_DAYS, getArticleType, ARTICLE_LEVEL, LEVEL_LABEL } from '@/lib/article-generator';
import { listSavedArticleMeta } from '@/lib/article-storage';
import { GUIDES } from '@/lib/guides';
import { Calendar, Clock, ChevronRight, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 3600;

// Level-Badge-Stil je Leserlevel (identisch zur Artikel-Detailseite).
const LEVEL_STYLE: Record<string, string> = {
  einsteiger:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  fortgeschritten: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  profi:           'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export const metadata: Metadata = {
  title: 'Pokémon Investment Blog — PokéMarket Intelligence',
  description: 'Wöchentlicher Wochenrückblick (sonntags) und rotierender Donnerstags-Artikel — Marktanalysen und Guides für Pokémon-Karten-Sammler.',
};

/** Returns the last `count` published dates (Sunday + Thursday only), newest first. */
function getPublishDates(count = 8): Array<{ date: string; isToday: boolean; dateLabel: string }> {
  const results: Array<{ date: string; isToday: boolean; dateLabel: string }> = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const cursor = new Date(now);

  while (results.length < count) {
    const dow = cursor.getDay();
    if (PUBLISH_DAYS.has(dow)) {
      const dateStr = cursor.toISOString().split('T')[0];
      results.push({
        date: dateStr,
        isToday: dateStr === todayStr,
        dateLabel: cursor.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }),
      });
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return results;
}

export default async function ArtikelListPage() {
  const publishDates = getPublishDates(8);
  const todayEntry = publishDates[0].isToday ? publishDates[0] : null;
  const listEntries = todayEntry ? publishDates.slice(1) : publishDates;

  const savedMeta = await listSavedArticleMeta().catch(() => [] as Awaited<ReturnType<typeof listSavedArticleMeta>>);
  const titleByDate = new Map(savedMeta.map((m) => [m.date, m.title]));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Calendar size={10} className="text-yellow-400" />
            Sonntags + Donnerstags
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white">
            Pokémon Investment<br /><span className="text-violet-400">Blog</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Sonntags: Wochenrückblick. Donnerstags: Marktanalyse, Karte im Fokus oder Guide.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-5 space-y-3">
        {/* Heute neu — nur wenn heute ein Publish-Day ist */}
        {todayEntry && (() => {
          const type = getArticleType(todayEntry.date)!;
          const meta = ARTICLE_META[type];
          return (
            <Link
              href={`/artikel/${todayEntry.date}`}
              className="block rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 transition-all group p-5"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                  <ContentIcon name={meta.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">{meta.category}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${LEVEL_STYLE[ARTICLE_LEVEL[type]]}`}>{LEVEL_LABEL[ARTICLE_LEVEL[type]]}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">Heute neu</span>
                  </div>
                  <h2 className="text-base font-black text-white group-hover:text-violet-300 leading-snug transition-colors">
                    {titleByDate.get(todayEntry.date) || ARTICLE_PREVIEW_TITLES[type]}
                  </h2>
                  <p className="text-slate-500 text-xs mt-1 leading-snug">{ARTICLE_PREVIEW_SUBTITLES[type]}</p>
                  <p className="text-slate-600 text-[10px] mt-1.5 flex items-center gap-1"><Calendar size={9} /> {todayEntry.dateLabel}</p>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-violet-400 shrink-0 mt-1 transition-colors" />
              </div>
            </Link>
          );
        })()}

        {/* Zurückliegende Publish-Dates */}
        {listEntries.map(({ date, dateLabel }) => {
          const type = getArticleType(date);
          if (!type) return null;
          const meta = ARTICLE_META[type];
          return (
            <Link
              key={date}
              href={`/artikel/${date}`}
              className="block rounded-2xl border border-[#2a2a3a] bg-[#13131e] hover:border-violet-500/30 hover:bg-[#1a1a28] transition-all group p-4"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <ContentIcon name={meta.icon} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{meta.category}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${LEVEL_STYLE[ARTICLE_LEVEL[type]]}`}>{LEVEL_LABEL[ARTICLE_LEVEL[type]]}</span>
                    <span className="text-xs text-slate-600 flex items-center gap-1"><Clock size={10} /> ~3 Min</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-200 group-hover:text-white leading-snug transition-colors">
                    {titleByDate.get(date) || ARTICLE_PREVIEW_TITLES[type]}
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-1">{ARTICLE_PREVIEW_SUBTITLES[type]}</p>
                  <p className="text-[10px] text-slate-700 mt-0.5 flex items-center gap-1"><Calendar size={9} /> {dateLabel}</p>
                </div>
                <ChevronRight size={15} className="text-slate-700 group-hover:text-violet-400 shrink-0 mt-1 transition-colors" />
              </div>
            </Link>
          );
        })}

        {/* Guides Section */}
        <div className="pt-4">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen size={12} className="text-slate-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Experten-Guides</span>
            <span className="h-px flex-1 bg-[#1e1e30]" />
            <Link href="/guides" className="text-[11px] font-semibold text-violet-500 hover:text-violet-400">
              Alle Guides →
            </Link>
          </div>
          <div className="space-y-2">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-[#2a2a3a] bg-[#13131e] hover:border-violet-500/30 hover:bg-[#1a1a28] p-3.5 transition-all group"
              >
                <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <ContentIcon name={guide.icon} size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white leading-snug line-clamp-1 transition-colors">{guide.title}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                    <Clock size={9} /> {guide.readingTimeMin} Min
                  </p>
                </div>
                <ChevronRight size={13} className="text-slate-700 group-hover:text-violet-400 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 pt-2">
          Alle Inhalte dienen ausschließlich der Information und stellen keine Finanzberatung dar.
        </p>
      </main>
    </div>
  );
}
