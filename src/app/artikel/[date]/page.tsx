import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NavBar } from '@/components/NavBar';
import { readArticle, generateArticle, getArticleType, ARTICLE_META } from '@/lib/article-generator';
import { ArticleCardGallery } from '@/components/ArticleCardGallery';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { cachedImg } from '@/lib/cached-image';
import { ContentIcon } from '@/components/ContentIcon';
import { ArrowLeft, Clock, Calendar, Tag, TriangleAlert } from 'lucide-react';

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
                <li key={j} className="flex items-start gap-2.5 text-sm text-slate-400 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  <span>{line.replace(/^[-•*]\s*|\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm text-slate-400 leading-relaxed">
            {block}
          </p>
        );
      })}
    </div>
  );
}

const ACCENT_COLOR: Record<string, string> = {
  violet:  'bg-violet-600',
  blue:    'bg-blue-600',
  emerald: 'bg-emerald-600',
  amber:   'bg-amber-500',
  rose:    'bg-rose-600',
  indigo:  'bg-indigo-600',
  gray:    'bg-slate-600',
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

  // Zukunfts-Artikel sperren — aber über reinen Datums-String-Vergleich (beide UTC),
  // nicht über Zeitstempel mit T12:00:00-Anker. Sonst 404t die heutige Seite, wenn sie
  // vor 12:00 UTC gerendert wird (geparstes Datum läge dann "in der Zukunft").
  const todayStr = new Date().toISOString().split('T')[0];
  if (date > todayStr) notFound();

  const type = getArticleType(date);
  if (!type) notFound();
  const meta = ARTICLE_META[type];
  const accent = ACCENT_COLOR[meta.color] ?? 'bg-violet-600';
  const dateLabel = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Zuerst aus dem Speicher lesen (statisch oder vom Cron generiert).
  let article = await readArticle(date);

  // Selbstheilung: Hat der Cron den Artikel (noch) nicht erzeugt, generieren wir ihn
  // jetzt on-demand. generateArticle prüft intern Static + Cache, liefert auch ohne
  // ANTHROPIC_API_KEY einen vollständigen Fallback-Artikel und persistiert das Ergebnis.
  // Dank ISR (revalidate=86400) passiert das höchstens einmal pro Tag pro Artikel.
  if (!article) {
    article = await generateArticle(type, date).catch(() => null);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';
  const jsonLd = article && {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.intro.slice(0, 200),
    datePublished: date,
    inLanguage: 'de',
    author: { '@type': 'Organization', name: 'PokéMarket Intelligence', url: siteUrl },
    publisher: { '@type': 'Organization', name: 'PokéMarket Intelligence', url: siteUrl },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/artikel/${date}` },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:py-14">
          <Link href="/artikel" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-5 transition-colors">
            <ArrowLeft size={12} /> Alle Artikel
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-violet-500/10 text-violet-400"><ContentIcon name={meta.icon} size={11} /> {meta.category}</span>
            <span className="text-xs text-slate-600 flex items-center gap-1"><Calendar size={11} /> {dateLabel}</span>
            {article && <span className="text-xs text-slate-600 flex items-center gap-1"><Clock size={11} /> {article.readingTimeMin} Min Lektüre</span>}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight text-white">{article?.title || meta.label}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-4 space-y-5">
        {!article ? (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-8 text-center">
            <p className="text-slate-400 font-semibold">Artikel noch nicht verfügbar</p>
            <p className="text-slate-600 text-sm mt-1">Neue Artikel erscheinen sonntags und donnerstags — bitte später erneut vorbeischauen.</p>
          </div>
        ) : (
          <>
            {article.isStatic && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2.5">
                <TriangleAlert size={15} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-400/80 leading-relaxed">
                  <strong className="text-amber-400">Archiv-Beitrag:</strong> Preisangaben können veraltet sein — aktuelle Marktpreise bitte direkt auf{' '}
                  <a href="https://www.cardmarket.com/en/Pokemon" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">Cardmarket</a>{' '}
                  prüfen.
                </p>
              </div>
            )}

            {/* Intro */}
            <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
              <div className={`h-1 ${accent}`} />
              <div className="p-5 sm:p-6">
                <p className="text-slate-300 text-base leading-relaxed">{article.intro}</p>
              </div>
            </section>

            {/* Card gallery + price chart */}
            {article.featuredCards && article.featuredCards.length > 0 && (
              <ArticleCardGallery cards={article.featuredCards} accentColor={meta.color} />
            )}

            {/* Key points */}
            {article.keyPoints.length > 0 && (
              <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3">Das Wichtigste auf einen Blick</p>
                <ul className="space-y-2.5">
                  {article.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className={`w-5 h-5 ${accent} rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>{i + 1}</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Sections */}
            {article.sections.map((section, i) => (
              <section key={i} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-6 h-6 ${accent} rounded-full text-white text-[10px] font-black flex items-center justify-center mt-0.5`}>
                    {i + 1}
                  </span>
                  <h2 className="text-base font-black text-slate-200 leading-snug">{section.heading}</h2>
                </div>
                <div className="pl-9">
                  <ArticleContent content={section.content} />
                  {section.highlight && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] p-3">
                      {section.highlight.imageUrl && (
                        <Image
                          src={cachedImg(section.highlight.imageUrl)}
                          alt={section.highlight.name}
                          width={60}
                          height={80}
                          className="object-contain rounded-lg shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 line-clamp-1">{section.highlight.name}</p>
                        <p className="text-xs text-slate-600 line-clamp-1">{section.highlight.set}</p>
                        {section.highlight.setCode && (
                          <BoosterPackImage
                            setCode={section.highlight.setCode}
                            setName={section.highlight.set}
                            className="h-8 mt-1 object-contain"
                          />
                        )}
                        {section.highlight.price > 0 && (
                          <p className="text-sm font-bold text-violet-400 mt-0.5">{section.highlight.price.toFixed(2)} €</p>
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
                <Tag size={12} className="text-slate-700" />
                {article.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-[#13131e] border border-[#2a2a3a] text-slate-500 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Sources */}
            {article.sources && article.sources.length > 0 && (
              <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Quellen</p>
                <ul className="space-y-1">
                  {article.sources.map((src, i) => (
                    <li key={i} className="text-xs">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 hover:underline"
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
          <Link href="/artikel" className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 font-semibold">
            <ArrowLeft size={14} /> Alle Artikel
          </Link>
          <Link href="/marktbericht" className="text-sm text-violet-400 hover:text-violet-300 font-semibold">Marktbericht →</Link>
        </div>

        <footer className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center space-y-1">
          <p className="text-[11px] font-semibold text-amber-400/80">Inoffizielle Fan-Seite · Keine Anlageberatung</p>
          <p className="text-[10px] text-amber-400/60 leading-relaxed">
            Inhalte werden automatisch von KI generiert und dienen ausschließlich der Information.
            Pokémon ist eine Marke von Nintendo / Creatures / GAME FREAK — keine Verbindung zu diesen Unternehmen.
          </p>
        </footer>
      </main>
    </div>
  );
}
