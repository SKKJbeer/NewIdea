import Link from 'next/link';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SearchBox } from '@/components/SearchBox';
import { ContentIcon } from '@/components/ContentIcon';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { GUIDES } from '@/lib/guides';
import { ICONIC_CARDS, ONBOARDING_STEPS } from '@/lib/beginner-content';
import { cachedImg } from '@/lib/cached-image';
import { Sparkles, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Einsteiger-Guide: Pokémon-Karten verstehen & Wert prüfen',
  description:
    'Neu bei Pokémon-Sammelkarten? Finde in Minuten heraus, was deine Karten wert sind, verstehe Seltenheitsstufen und Lagerung — einfach erklärt, kostenlos und auf Deutsch.',
  alternates: { canonical: '/einsteiger' },
};

export default function EinsteigerPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="relative max-w-3xl mx-auto px-4 pt-12 pb-14 sm:py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Sparkles size={11} /> Neu hier? Fang genau hier an
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 text-white leading-tight text-balance">
            Was sind deine <span className="text-violet-400">Pokémon-Karten</span> wert?
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-7">
            Kein Vorwissen nötig. Gib den Namen einer Karte ein — du siehst sofort den aktuellen Marktpreis, den Verlauf und ähnliche Karten. Deutsche Namen funktionieren.
          </p>
          <div className="max-w-md mx-auto text-left">
            <SearchBox />
          </div>
          <p className="text-[11px] text-slate-600 mt-3">Zum Beispiel: „Glurak", „Pikachu", „Mewtu"</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16 pt-10 space-y-14">
        {/* 3 Schritte */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">In 3 Schritten</span>
            <span className="h-px flex-1 bg-[#1e1e30]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {ONBOARDING_STEPS.map((step, i) => (
              <Link
                key={step.href}
                href={step.href}
                className="group flex flex-col rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 transition-all hover:border-violet-500/30 hover:bg-[#1a1a28]"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                    <ContentIcon name={step.icon} size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-800">{i + 1}</span>
                </div>
                <h2 className="text-sm font-black text-slate-100 leading-snug">{step.title}</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed flex-1">{step.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                  {step.cta} <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Ikonische Karten */}
        <section>
          <div className="mb-1 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Die ikonischsten Karten</span>
            <span className="h-px flex-1 bg-[#1e1e30]" />
          </div>
          <p className="text-xs text-slate-500 mb-5">Ein guter Startpunkt — tippe auf eine Karte für Preis, Verlauf und Details.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ICONIC_CARDS.map((card) => (
              <Link
                key={card.id}
                href={`/karten/${card.id}`}
                className="group flex flex-col rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-3 transition-all hover:border-violet-500/30 hover:bg-[#1a1a28]"
              >
                <div className="relative mx-auto mb-3 w-full max-w-[150px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cachedImg(card.imageUrl)}
                    alt={card.nameDe}
                    className="w-full h-auto rounded-lg drop-shadow-lg transition-transform group-hover:-translate-y-0.5"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <BoosterPackImage setCode={card.setCode} setName={card.name} className="h-4 w-auto shrink-0" />
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{card.nameDe}</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-snug line-clamp-2">{card.why}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Einsteiger-Guides */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Grundlagen verstehen</span>
            <span className="h-px flex-1 bg-[#1e1e30]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4 transition-all hover:border-violet-500/30 hover:bg-[#1a1a28]"
              >
                <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <ContentIcon name={guide.icon} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white leading-snug line-clamp-2">{guide.title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-600 flex items-center gap-1"><Clock size={9} /> {guide.readingTimeMin} Min</p>
                </div>
                <ArrowRight size={14} className="text-slate-700 group-hover:text-violet-400 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Vertrauen / Reassurance */}
        <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-black text-slate-100">Echte Preise, keine Verkaufsmasche</h2>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Alle Preise stammen direkt von Cardmarket und werden täglich aktualisiert. Diese Seite ist eine Informations- und Analyseplattform — keine Anlageberatung, keine Kaufaufforderung. Du entscheidest selbst, was für deine Sammlung zählt.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
