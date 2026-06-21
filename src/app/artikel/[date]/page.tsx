import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { NavBar } from '@/components/NavBar';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { generateArticle, DAY_TYPE, ARTICLE_META } from '@/lib/article-generator';
import { ArticleCardGallery } from '@/components/ArticleCardGallery';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 86400;

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
  const type = DAY_TYPE[d.getDay()];
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

  const type = DAY_TYPE[d.getDay()];
  const meta = ARTICLE_META[type];
  const c = COLOR[meta.color];
  const dateLabel = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let article = null;
  let error = false;
  try {
    article = await generateArticle(type, date);
  } catch {
    error = true;
  }

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
        {error ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800">
            <p className="font-semibold">⚠️ Artikel konnte nicht generiert werden</p>
            <p className="text-sm mt-1 text-amber-600">Bitte ANTHROPIC_API_KEY in Vercel prüfen.</p>
          </div>
        ) : article ? (
          <>
            {/* Intro */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <p className="text-gray-700 text-base leading-relaxed font-medium">{article.intro}</p>
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
                <h2 className="text-base font-black text-gray-900 mb-3">{section.heading}</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
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
          </>
        ) : null}

        <div className="flex justify-between items-center pt-2">
          <Link href="/artikel" className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold">
            <ArrowLeft size={14} /> Alle Artikel
          </Link>
          <Link href="/marktbericht" className="text-sm text-violet-600 hover:text-violet-800 font-semibold">Marktbericht →</Link>
        </div>

        <section id="newsletter">
          <div className="text-center mb-4">
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Newsletter</p>
            <h2 className="text-lg font-black text-gray-900">Jeden Montag per E-Mail</h2>
          </div>
          <Suspense><NewsletterSignup /></Suspense>
        </section>

        <footer className="text-center text-xs text-gray-400 pt-2 pb-4">
          Alle Inhalte werden automatisch von KI generiert und stellen keine Finanzberatung dar.
        </footer>
      </main>
    </div>
  );
}
