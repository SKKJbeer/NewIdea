import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { ContentIcon } from '@/components/ContentIcon';
import { GUIDES } from '@/lib/guides';
import { listGeneratedGuides } from '@/lib/guide-storage';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import { SECTION_LABEL } from '@/lib/ui';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Pokémon Karten Guides',
  description: 'Kostenlose Pokémon-Karten-Guides für Sammler: Seltenheitsstufen, Grading, Lagerung und Markt-Strategien verständlich erklärt.',
};

export default async function GuidesPage() {
  // Statische Guides + automatisch generierte (Supabase) zusammenführen.
  // Bei nicht erreichbarer DB: nur die statischen — Seite bleibt funktionsfähig.
  const generated = await listGeneratedGuides().catch(() => []);
  const staticSlugs = new Set(GUIDES.map((g) => g.slug));
  const allGuides = [...GUIDES, ...generated.filter((g) => !staticSlugs.has(g.slug))];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      {/* Kopf nach dem gemeinsamen Muster (DESIGN.md §2/§4): linksbündig,
          Abschnittsmarke statt Pille, keine Verlaufsfläche, keine
          Farbhervorhebung im Titel. */}
      <header className="border-b border-[#1c1c24]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <p className={SECTION_LABEL}>'Guides · Pokémon'</p>
          <h1 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Guides
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Von Seltenheitsstufen über Grading bis zur Lagerung — Grundlagen, die dauerhaft gelten.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 -mt-5 space-y-3">
        {allGuides.map((guide, i) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            // WICHTIG: `bg-[#13131e]` als DECKENDE Grundfläche unter dem
            // Verlauf. Die hervorgehobene erste Karte war zuvor nur
            // halbtransparent (`from-violet-600/20`), und weil die Liste per
            // `-mt-5` über den Kopfbereich ragt, schien dessen Unterkante
            // mitten durch die Karte — es sah aus, als kreuze eine Linie die
            // Kachel. Deckend + `relative` beendet das.
            className={`group relative block overflow-hidden rounded-2xl border bg-[#13131e] p-5 transition-all ${
              i === 0
                ? 'border-violet-500/30 hover:border-violet-500/50'
                : 'border-[#2a2a3a] hover:border-violet-500/30 hover:bg-[#1a1a28]'
            }`}
          >
            {i === 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 transition-colors group-hover:from-violet-600/30 group-hover:to-indigo-600/30"
              />
            )}
            <div className="relative flex items-start gap-3">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <ContentIcon name={guide.icon} size={20} />
              </div>
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
