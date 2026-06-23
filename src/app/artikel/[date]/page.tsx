import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NavBar } from '@/components/NavBar';
import { readArticle, getArticleType, ARTICLE_META } from '@/lib/article-generator';
import { ArticleCardGallery } from '@/components/ArticleCardGallery';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';

import type { Metadata } from 'next';

export const revalidate = 86400;

function ArticleContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/).filter((s) => s.trim());
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((s) => s.trim());
        const isList =
          lines.length > 1 &&
          lines.every((l) => /^[-•*]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim()));
        if (isList) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((line, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span>{line.replace(/^[-•*]\s*|\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm text-gray-700 leading-relaxed">
            {block}
          </p>
        );
      })}
    </div>
  );
}

const COLOR: Record<string, { badge: string; header: string; accent: string }> = {
  violet:  { badge: 'bg-violet-100 text-violet-700',   header: 'from-violet-800 to-indigo-900',  accent: 'bg-violet-600' },
  blue:    { badge: 'bg-blue-100 text-blue-700',       header: 'from-blue-800 to-blue-950',      accent: 'bg-blue-600' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', header: 'from-emerald-800 to-green-950',  accent: 'bg-emerald-600' },
  amber:   { badge: 'bg-amber-100 text-amber-700',     header: 'from-amber-700 to-orange-900',   accent: 'bg-amber-500' },
  rose:    { badge: 'bg-rose-100 text-rose-700',       header: 'from-rose-800 to-pink-950',      accent: 'bg-rose-600' },
  indigo:  { badge: 'bg-indigo-100 text-indigo-700',   header: 'from-indigo-800 to-indigo-950',  accent: 'bg-indigo-600' },
  gray:    { badge: 'bg-gray-100 text-gray-600',       header: 'from-gray-700 to-gray-900',      accent: 'bg-gray-600' },
};

function parseDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(dateStr + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const d = parseDate(date);
  if (!d) return { title: 'Artikel nicht gefunden' };
  const type = getArticleType(date);
  if (!type) return { title: 'Artikel nicht gefunden' };
  const meta = ARTICLE_META[type];
  const dateLabel = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  return {
    title: `${meta.label} vom ${dateLabel} — PokéMarket Intelligence`,
    description: `${meta.label} für Pokémon-Karten-Investoren vom ${dateLabel}.`,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const d = parseDate(date);
  if (!d) notFound();

  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (daysDiff < 0) notFound();

  // Only Sunday (Wochenrückblick) and Thursday (rotating) are valid article days
  const type = getArticleType(date);
  if (!type) notFound();
  const meta = ARTICLE_META[type];
  const c = COLOR[meta.color];
  const dateLabel = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const article = await readArticle(date);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <header className={`bg-gradient-to-br ${c.header} text-white`}>
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:py-14">
          <Link href="/artikel" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs mb-5 transition-colors">
            <ArrowLeft size={12} /> Alle Artikel
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-white/15 text-white">{meta.emoji} {meta.category}</span>
            <span className="text-xs text-white/60 flex items-center gap-1"><Calendar size={11} /> {dateLabel}</span>
            {article && <span className="text-xs text-white/60 flex items-center gap-1"><Clock size={11} /> {article.readingTimeMin} Min Lektüre</span>}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight">{article?.title || meta.label}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-4 space-y-5">
        {!article ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-500 font-semibold">Artikel noch nicht verfügbar</p>
            <p className="text-gray-400 text-sm mt-1">Dieser Artikel wird täglich um 08:00 Uhr automatisch erstellt.</p>
          </div>
        ) : (
          <>
            {article.isStatic && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Archiv-Beitrag:</strong> Preisangaben können veraltet sein — aktuelle Marktpreise bitte direkt auf{' '}
                  <a href="https://www.cardmarket.com/en/Pokemon" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">Cardmarket</a>{' '}
                  prüfen.
                </p>
              </div>
            )}

            {/* Intro */}
            <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
              <div className={`h-1 ${c.accent}`} />
              <div className="p-5 sm:p-6">
                <p className="text-gray-700 text-base leading-relaxed">{article.intro}</p>
              </div>
            </section>

            {/* Card gallery + price chart */}
            {article.featuredCards && article.featuredCards.length > 0 && (
              <ArticleCardGallery cards={article.featuredCards} accentColor={meta.color} />
            )}

            {/* Key points */}
            {article.keyPoints.length > 0 && (
              <section className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-3">Das Wichtigste auf einen Blick</p>
                <ul className="space-y-2.5">
                  {article.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-violet-900">
                      <span className={`w-5 h-5 ${c.accent} rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>{i + 1}</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Sections */}
            {article.sections.map((section, i) => (
              <section key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-6 h-6 ${c.accent} rounded-full text-white text-[10px] font-black flex items-center justify-center mt-0.5`}>
                    {i + 1}
                  </span>
                  <h2 className="text-base font-black text-gray-900 leading-snug">{section.heading}</h2>
                </div>
                <div className="pl-9">
                  <ArticleContent content={section.content} />
                  {section.highlight && (
                    <div className="mt-4 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                      {section.highlight.imageUrl && (
                        <Image
                          src={section.highlight.imageUrl}
                          alt={section.highlight.name}
                          width={60}
                          height={80}
                          className="object-contain rounded-lg shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{section.highlight.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{section.highlight.set}</p>
                        {section.highlight.setCode && (
                          <BoosterPackImage
                            setCode={section.highlight.setCode}
                            setName={section.highlight.set}
                            className="h-8 mt-1 object-contain"
                          />
                        )}
                        {section.highlight.price > 0 && (
                          <p className="text-sm font-bold text-violet-700 mt-0.5">{section.highlight.price.toFixed(2)} €</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center pt-1">
                <Tag size={12} className="text-gray-400" />
                {article.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Sources */}
            {article.sources && article.sources.length > 0 && (
              <section className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quellen</p>
                <ul className="space-y-1">
                  {article.sources.map((src, i) => (
                    <li key={i} className="text-xs">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 hover:text-violet-800 hover:underline"
                      >
                        {src.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <div className="flex justify-between items-center pt-2">
          <Link href="/artikel" className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold">
            <ArrowLeft size={14} /> Alle Artikel
          </Link>
          <Link href="/marktbericht" className="text-sm text-violet-600 hover:text-violet-800 font-semibold">Marktbericht →</Link>
        </div>

        <footer className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-center space-y-1 pb-4">
          <p className="text-[11px] font-semibold text-amber-800">Inoffizielle Fan-Seite · Keine Anlageberatung</p>
          <p className="text-[10px] text-amber-700 leading-relaxed">
            Inhalte werden automatisch von KI generiert und dienen ausschließlich der Information.
            Pokémon ist eine Marke von Nintendo / Creatures / GAME FREAK — keine Verbindung zu diesen Unternehmen.
          </p>
        </footer>
      </main>
    </div>
  );
}
