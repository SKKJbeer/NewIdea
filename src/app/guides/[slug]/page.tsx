import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { getGuide, GUIDES, type Guide } from '@/lib/guides';
import { loadGeneratedGuide, listGeneratedGuides } from '@/lib/guide-storage';
import { ArrowLeft, Clock, Tag, ChevronRight, Lightbulb } from 'lucide-react';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { cachedImg } from '@/lib/cached-image';
import type { Metadata } from 'next';

export const revalidate = 86400;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

// Statischer Guide zuerst (kein DB-Zugriff nötig), sonst generierter aus Supabase.
async function resolveGuide(slug: string): Promise<Guide | null> {
  return getGuide(slug) ?? (await loadGeneratedGuide(slug).catch(() => null));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await resolveGuide(slug);
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

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await resolveGuide(slug);
  if (!guide) notFound();

  // "Weitere Guides": aus dem Gesamtbestand (statisch + generiert)
  const generated = await listGeneratedGuides().catch(() => []);
  const staticSlugs = new Set(GUIDES.map((g) => g.slug));
  const allGuides = [...GUIDES, ...generated.filter((g) => !staticSlugs.has(g.slug))];
  const otherGuides = allGuides.filter((g) => g.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-14 sm:py-16">
          <Link href="/guides" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-5 transition-colors">
            <ArrowLeft size={12} /> Alle Guides
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-violet-500/10 text-violet-400">{guide.emoji} {guide.badge}</span>
            <span className="text-xs text-slate-600 flex items-center gap-1"><Clock size={11} /> {guide.readingTimeMin} Min Lektüre</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight text-white">{guide.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-4 space-y-5">
        {/* Intro */}
        <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 sm:p-6">
          <p className="text-slate-300 text-base leading-relaxed font-medium">{guide.intro}</p>
        </section>

        {/* Key Points */}
        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-violet-400">Das Wichtigste auf einen Blick</p>
          <ul className="space-y-2.5">
            {guide.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="w-5 h-5 bg-violet-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Sections */}
        {guide.sections.map((section, i) => (
          <section key={i} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-black text-slate-200">{section.heading}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{section.content}</p>

            {section.tip && (
              <div className="flex items-start gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                <Lightbulb size={15} className="shrink-0 mt-0.5 text-violet-400 opacity-70" />
                <p className="text-sm leading-relaxed text-slate-300">{section.tip}</p>
              </div>
            )}

            {section.cards && section.cards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {section.cards.map((card) => (
                  <div key={card.name} className="border border-[#2a2a3a] rounded-xl p-3 bg-[#0a0a0f] flex items-start gap-3">
                    {card.imageUrl ? (
                      <div className="flex-none text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cachedImg(card.imageUrl)}
                          alt={card.name}
                          width={56}
                          height={78}
                          className="w-14 rounded-md object-contain"
                          loading="lazy"
                        />
                        {card.setId && (
                          <BoosterPackImage
                            setCode={card.setId}
                            setName={card.name}
                            className="w-14 mt-1.5 object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-xl shrink-0 mt-1">🃏</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 leading-tight">{card.name}</p>
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 bg-violet-500/10 text-violet-400">{card.rarity}</span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">{card.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 items-center pt-1">
          <Tag size={12} className="text-slate-700" />
          {guide.tags.map((tag) => (
            <span key={tag} className="text-xs bg-[#13131e] border border-[#2a2a3a] text-slate-500 px-2.5 py-1 rounded-full">{tag}</span>
          ))}
        </div>

        {/* More Guides */}
        {otherGuides.length > 0 && (
          <section className="pt-2">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Weitere Guides</span>
              <span className="h-px flex-1 bg-[#1e1e30]" />
            </div>
            <div className="space-y-2">
              {otherGuides.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#2a2a3a] bg-[#13131e] hover:border-violet-500/30 hover:bg-[#1a1a28] p-4 transition-all group">
                  <span className="text-2xl shrink-0">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">{g.badge}</span>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-white mt-0.5 leading-tight transition-colors">{g.title}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-700 group-hover:text-violet-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-between items-center pt-2">
          <Link href="/guides" className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 font-semibold">
            <ArrowLeft size={14} /> Alle Guides
          </Link>
          <Link href="/artikel" className="text-sm text-violet-400 hover:text-violet-300 font-semibold">Blog →</Link>
        </div>
      </main>
    </div>
  );
}
