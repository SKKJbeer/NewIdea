import Link from 'next/link';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SectionHead } from '@/components/MarketModules';
import { recentPublishDates } from '@/lib/publish-days';
import { GUIDES } from '@/lib/guides';
import { BRAND } from '@/lib/brand';
import { SECTION_LABEL, TABLE } from '@/lib/ui';

// RESEARCH — ein Ziel statt vier Navigationspunkte.
//
// Marktbericht, Analysen, Guides und Methodik standen bisher einzeln in der
// obersten Navigationsebene. Vier von acht Punkten für Lesestoff, während der
// Markt selbst einer war. Hier liegen sie zusammen, weil sie dieselbe Rolle
// haben: vertiefen, was die Marktseiten in Zahlen zeigen.

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Research — ${BRAND}`,
  description:
    'Marktbericht, Analysen, Guides und die vollständige Methodik hinter den Kennzahlen von CardBeacon.',
};

const BEREICHE = [
  {
    href: '/marktbericht',
    titel: 'Marktbericht',
    beschreibung:
      'Wochenanalyse: Marktstand, was sich bewegt hat, Set-Aktivität und die Datengrundlage dahinter.',
    takt: 'wöchentlich',
  },
  {
    href: '/artikel',
    titel: 'Analysen',
    beschreibung:
      'Wochenrückblick am Sonntag, wechselnde Marktthemen am Donnerstag.',
    takt: 'So + Do',
  },
  {
    href: '/guides',
    titel: 'Guides',
    beschreibung:
      'Seltenheitsstufen, Grading, Lagerung, Marktmechanik — zeitlos, nicht tagesaktuell.',
    takt: 'Di + Fr',
  },
  {
    href: '/methodik',
    titel: 'Methodik',
    beschreibung:
      'Wie Index, Marktbreite, Stimmung und Set-Kennzahlen entstehen — mit den Schwellen, ab denen nichts ausgewiesen wird.',
    takt: 'laufend',
  },
] as const;

function formatDatum(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function ResearchPage() {
  const letzteArtikel = recentPublishDates(6);

  return (
    <div className="min-h-screen bg-[#08080b] text-slate-300">
      <NavBar />

      <header className="border-b border-[#1c1c24]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <p className={SECTION_LABEL}>Research</p>
          <h1 className="mt-4 max-w-2xl text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Was hinter den Zahlen steht
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Die Marktseiten zeigen den Stand. Hier steht, wie er zustande kommt
            und was sich über die Zeit daraus ablesen lässt.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section aria-labelledby="bereiche" className="py-12 sm:py-16">
          <SectionHead num="01" title="Bereiche" />
          <h2 id="bereiche" className="sr-only">
            Bereiche
          </h2>
          <div className="mt-5 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {BEREICHE.map((b) => (
              <Link
                key={b.href}
                href={b.href}
                className="group border-t border-[#1c1c24] pt-4 transition-colors hover:border-slate-600"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-base text-slate-200 group-hover:text-white">{b.titel}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-slate-700">
                    {b.takt}
                  </span>
                </span>
                <span className="mt-2 block max-w-md text-[13px] leading-relaxed text-slate-500">
                  {b.beschreibung}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="zuletzt" className="border-t border-[#1c1c24] py-12 sm:py-16">
          <SectionHead num="02" title="Zuletzt erschienen" href="/artikel" hrefLabel="Alle Analysen" />
          <h2 id="zuletzt" className="sr-only">
            Zuletzt erschienen
          </h2>
          <div className="mt-5">
            {letzteArtikel.map((e) => (
              <Link
                key={e.date}
                href={`/artikel/${e.date}`}
                className={`flex items-baseline justify-between gap-4 px-1 ${TABLE.row} ${TABLE.cell}`}
              >
                <span className="text-[13px] text-slate-300">{formatDatum(e.date)}</span>
                <span className="text-[11px] text-slate-600">
                  {new Date(`${e.date}T12:00:00`).getUTCDay() === 0 ? 'Wochenrückblick' : 'Marktthema'}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="guides" className="border-t border-[#1c1c24] py-12 sm:py-16">
          <SectionHead num="03" title="Guides" href="/guides" hrefLabel="Alle Guides" />
          <h2 id="guides" className="sr-only">
            Guides
          </h2>
          <div className="mt-5">
            {GUIDES.slice(0, 6).map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className={`flex items-baseline justify-between gap-4 px-1 ${TABLE.row} ${TABLE.cell}`}
              >
                <span className="min-w-0 truncate text-[13px] text-slate-300">{g.title}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-600">{g.readingTimeMin} Min</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
