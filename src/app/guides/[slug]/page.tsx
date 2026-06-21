import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { NavBar } from '@/components/NavBar';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { getGuide, GUIDES } from '@/lib/guides';
import { ArrowLeft, Clock, Tag, ChevronRight, Lightbulb } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 86400;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: 'Guide nicht gefunden' };
  return {
    title: `${guide.title} — PokéMarket Intelligence`,
    description: guide.metaDescription,
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      type: 'article',
    },
  };
}

const COLOR: Record<string, { badge: string; tip: string; accent: string; num: string }> = {
  violet:  { badge: 'bg-violet-100 text-violet-700',   tip: 'bg-violet-50 border-violet-200 text-violet-900',  accent: 'bg-violet-600', num: 'bg-violet-600' },
  blue:    { badge: 'bg-blue-100 text-blue-700',       tip: 'bg-blue-50 border-blue-200 text-blue-900',        accent: 'bg-blue-600',   num: 'bg-blue-600' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', tip: 'bg-emerald-50 border-emerald-200 text-emerald-900', accent: 'bg-emerald-600', num: 'bg-emerald-600' },
  amber:   { badge: 'bg-amber-100 text-amber-700',     tip: 'bg-amber-50 border-amber-200 text-amber-900',     accent: 'bg-amber-500',  num: 'bg-amber-500' },
  rose:    { badge: 'bg-rose-100 text-rose-700',       tip: 'bg-rose-50 border-rose-200 text-rose-900',        accent: 'bg-rose-600',   num: 'bg-rose-600' },
};

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const c = COLOR[guide.color] ?? COLOR.violet;
  const otherGuides = GUIDES.filter((g) => g.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <header className={`bg-gradient-to-br ${guide.headerGradient} text-white`}>
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-14 sm:py-16">
          <Link href="/guides" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs mb-5 transition-colors">
            <ArrowLeft size={12} /> Alle Guides
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-white/15 text-white">{guide.emoji} {guide.badge}</span>
            <span className="text-xs text-white/60 flex items-center gap-1"><Clock size={11} /> {guide.readingTimeMin} Min Lektüre</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight">{guide.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-4 space-y-5">
        {/* Intro */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <p className="text-gray-700 text-base leading-relaxed font-medium">{guide.intro}</p>
        </section>

        {/* Key Points */}
        <section className={`rounded-2xl border p-5 ${c.tip}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70">Das Wichtigste auf einen Blick</p>
          <ul className="space-y-2.5">
            {guide.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`w-5 h-5 ${c.num} rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>{i + 1}</span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Sections */}
        {guide.sections.map((section, i) => (
          <section key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-black text-gray-900">{section.heading}</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{section.content}</p>

            {section.tip && (
              <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${c.tip}`}>
                <Lightbulb size={15} className="shrink-0 mt-0.5 opacity-70" />
                <p className="text-sm leading-relaxed">{section.tip}</p>
              </div>
            )}

            {section.cards && section.cards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {section.cards.map((card) => (
                  <div key={card.name} className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-start gap-3">
                    {card.imageUrl ? (
                      <div className="flex-none text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          width={56}
                          height={78}
                          className="w-14 rounded-md object-contain"
                          loading="lazy"
                        />
                        {card.setId && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`https://images.pokemontcg.io/${card.setId}/logo.png`}
                            alt="Set"
                            className="w-14 mt-1 object-contain opacity-55"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-xl shrink-0 mt-1">🃏</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 leading-tight">{card.name}</p>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${c.badge}`}>{card.rarity}</span>
                      <p className="text-[11px] text-gray-500 mt-1 leading-snug">{card.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 items-center pt-1">
          <Tag size={12} className="text-gray-400" />
          {guide.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{tag}</span>
          ))}
        </div>

        {/* More Guides */}
        {otherGuides.length > 0 && (
          <section className="pt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Weitere Guides</p>
            <div className="space-y-2">
              {otherGuides.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`}
                  className="flex items-center gap-3 bg-white border border-gray-100 hover:border-violet-200 hover:shadow-sm rounded-2xl p-4 transition-all group">
                  <span className="text-2xl shrink-0">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${c.badge}`}>{g.badge}</span>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 mt-0.5 leading-tight">{g.title}</p>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 group-hover:text-violet-500 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-between items-center pt-2">
          <Link href="/guides" className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold">
            <ArrowLeft size={14} /> Alle Guides
          </Link>
          <Link href="/artikel" className="text-sm text-violet-600 hover:text-violet-800 font-semibold">Blog →</Link>
        </div>

        <section id="newsletter">
          <div className="text-center mb-4">
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Newsletter</p>
            <h2 className="text-lg font-black text-gray-900">Jeden Montag per E-Mail</h2>
          </div>
          <Suspense><NewsletterSignup /></Suspense>
        </section>
      </main>
    </div>
  );
}
