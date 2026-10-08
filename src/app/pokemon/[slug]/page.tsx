import { TeilenKnopf } from '@/components/TeilenKnopf';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers, Crown, CalendarDays, Search } from 'lucide-react';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { CardGrid } from '@/components/CardGrid';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { ErsatzBild } from '@/components/ErsatzBild';
import { kartenFuerPokemon } from '@/lib/card-index';
import { pokemonFuerSlug } from '@/lib/pokemon-seiten';
import { displayPrice } from '@/lib/pokemon-api';
import { formatEur, formatCount } from '@/lib/format';
import { jsonLd } from '@/lib/json-ld';
import { siteUrlOrLocal } from '@/lib/site';
import { SECTION_LABEL } from '@/lib/ui';
import type { Metadata } from 'next';

// Wie karten/[id] und sets/[setCode]: ISR auf Abruf, nichts beim Build eingebacken
// (Stolperstelle 55). Ein Datenbankausfall WIRFT → error.tsx, nie gecacht.
export async function generateStaticParams() {
  return [];
}

export const revalidate = 21600;

const SITE_URL = siteUrlOrLocal();
const FRISCH_TAGE = 3;

const laden = cache(async (slug: string) => {
  const p = pokemonFuerSlug(slug);
  if (!p) return null;
  const karten = await kartenFuerPokemon(p.en);
  return { p, karten };
});

interface Props {
  params: Promise<{ slug: string }>;
}

function stand(karten: Array<{ indexStand?: string }>) {
  const tage = karten.map((k) => k.indexStand?.slice(0, 10)).filter((d): d is string => !!d).sort();
  const neuester = tage.at(-1) ?? null;
  const grenze = new Date(Date.now() - FRISCH_TAGE * 86_400_000).toISOString().slice(0, 10);
  return { neuester, alt: tage.filter((d) => d < grenze).length };
}

const tagDe = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await laden(slug).catch(() => null);
  if (!d) return { title: 'Pokémon nicht gefunden' };
  const { p, karten } = d;
  const titel = `${p.de}-Karten (${p.en}): alle ${karten.length} Versionen & Preise`;
  const teuerste = karten[0];
  return {
    title: titel,
    description: teuerste
      ? `Alle ${karten.length} ${p.de}-Karten (${p.en}) mit Cardmarket-Preis, sortiert nach Marktwert. Teuerste: ${teuerste.name} aus ${teuerste.set}.`
      : `${p.de}-Karten (${p.en}) mit Cardmarket-Preisen.`,
    alternates: { canonical: `${SITE_URL}/pokemon/${p.slug}` },
    openGraph: { title: titel, images: teuerste?.imageUrl ? [teuerste.imageUrl] : undefined },
  };
}

export default async function PokemonSeite({ params }: Props) {
  const { slug } = await params;
  const d = await laden(slug);
  if (!d) notFound();
  const { p, karten } = d;
  if (karten.length === 0) notFound();

  const mitPreis = karten.filter((k) => displayPrice(k) > 0);
  const teuerste = mitPreis[0] ?? null;
  const guenstigste = mitPreis.at(-1) ?? null;
  const sets = new Map<string, { name: string; anzahl: number }>();
  for (const k of karten) {
    const e = sets.get(k.setCode) ?? { name: k.set, anzahl: 0 };
    e.anzahl += 1;
    sets.set(k.setCode, e);
  }
  const setListe = [...sets.entries()].sort((a, b) => b[1].anzahl - a[1].anzahl);
  const { neuester, alt } = stand(karten);
  const fans = mitPreis.slice(0, 3);

  // Fragen + Antworten aus den gemessenen Daten — nichts davon ist geschätzt.
  const fragen: Array<{ f: string; a: string }> = [
    {
      f: `Wie viele ${p.de}-Karten gibt es?`,
      a: `Im Kartenindex von CardBeacon sind ${formatCount(karten.length)} Karten mit ${p.de} (${p.en}) im Namen erfasst, verteilt auf ${formatCount(sets.size)} Sets.`,
    },
  ];
  if (teuerste && neuester) {
    fragen.push({
      f: `Welche ${p.de}-Karte ist am meisten wert?`,
      a: `Nach Cardmarket-Preis-Trend (Stand ${tagDe(neuester)}) ist es ${teuerste.name} aus ${teuerste.set} mit ${formatEur(displayPrice(teuerste))}.`,
    });
  }
  if (guenstigste && teuerste && guenstigste.id !== teuerste.id) {
    fragen.push({
      f: `Wie teuer sind ${p.de}-Karten?`,
      a: `Die erfassten ${p.de}-Karten liegen zwischen ${formatEur(displayPrice(guenstigste))} und ${formatEur(displayPrice(teuerste))} (Cardmarket-Preis-Trend). Zustand, Sprache und Grading verändern den Preis einer einzelnen Karte deutlich.`,
    });
  }

  const strukturiert = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${p.de}-Karten (${p.en}) nach Marktwert`,
      numberOfItems: karten.length,
      itemListElement: karten.slice(0, 20).map((k, i) => ({
        '@type': 'ListItem', position: i + 1, name: `${k.name} (${k.set})`, url: `${SITE_URL}/karten/${k.id}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: fragen.map((q) => ({ '@type': 'Question', name: q.f, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#070810] text-slate-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(strukturiert) }} />

      <header className="relative overflow-hidden border-b border-[#1c1c24]">
        <AmbientBackdrop mode="set" />
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-12 sm:py-14">
          <Link href="/pokemon" prefetch={false} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-6 transition-colors">
            <ArrowLeft size={12} /> Alle Pokémon
          </Link>
          <div className="flex flex-col-reverse sm:flex-row items-center gap-8">
            <div className="flex-1 text-center sm:text-left">
              <p className={SECTION_LABEL}>Pokémon · alle Karten</p>
              <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white">
                {p.de}-Karten <span className="text-violet-400">({p.en})</span>
              </h1>
              <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-xl">
                Alle {formatCount(karten.length)} erfassten Versionen mit Cardmarket-Preis, sortiert nach Marktwert —
                von {formatCount(sets.size)} Sets.
              </p>
              <div className="mt-5">
                <TeilenKnopf url={`${SITE_URL}/pokemon/${p.slug}`} titel={`Alle ${p.de}-Karten mit Preisen`} klein />
              </div>
            </div>
            {fans.length > 0 && (
              <div className="relative h-56 w-64 shrink-0" aria-hidden>
                {fans.map((k, i) => {
                  const versatz = i - (fans.length - 1) / 2;
                  return (
                    <div
                      key={k.id}
                      className="absolute left-1/2 top-2 w-32 -translate-x-1/2"
                      style={{ transform: `translateX(calc(-50% + ${versatz * 62}px)) rotate(${versatz * 10}deg)`, zIndex: i === 1 ? 2 : 1 }}
                    >
                      <div className="relative aspect-[63/88] overflow-hidden rounded-lg shadow-2xl shadow-black/60 ring-1 ring-white/10">
                        <ErsatzBild src={k.imageUrl} alt="" fill sizes="128px" className="object-cover" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 pb-16 space-y-10">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kennzahl symbol={<Layers size={15} />} titel="Karten" wert={formatCount(karten.length)} />
          <Kennzahl symbol={<Layers size={15} />} titel="Sets" wert={formatCount(sets.size)} />
          <Kennzahl symbol={<Crown size={15} />} titel="Teuerste" wert={teuerste ? formatEur(displayPrice(teuerste)) : '—'} />
          <Kennzahl symbol={<CalendarDays size={15} />} titel="Preisstand" wert={neuester ? tagDe(neuester) : '—'} />
        </section>
        {alt > 0 && (
          <p className="text-[11px] text-amber-400/70">
            {formatCount(alt)} der Karten tragen einen älteren Preisstand (die Quelle führt für sie keinen aktuellen Cardmarket-Preis).
          </p>
        )}

        {teuerste && (
          <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-center">
            <Link href={`/karten/${teuerste.id}`} className="relative aspect-[63/88] w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 shadow-xl">
              <ErsatzBild src={teuerste.imageUrl} alt={`${teuerste.name} aus ${teuerste.set}`} fill sizes="160px" className="object-cover" />
            </Link>
            <div className="text-center sm:text-left">
              <p className={SECTION_LABEL}>Wertvollste {p.de}-Karte</p>
              <h2 className="mt-2 text-xl font-bold text-white">{teuerste.name}</h2>
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-400">
                <BoosterPackImage setCode={teuerste.setCode} setName={teuerste.set} className="h-5 w-auto" />
                {teuerste.set}{teuerste.number ? ` · Nr. ${teuerste.number}` : ''}
              </div>
              <p className="mt-3 text-3xl font-black tabular-nums text-violet-300">{formatEur(displayPrice(teuerste))}</p>
              <p className="text-[11px] text-slate-600 mt-1">Cardmarket-Preis-Trend{teuerste.indexStand ? `, Stand ${tagDe(teuerste.indexStand.slice(0, 10))}` : ''}</p>
              <Link href={`/karten/${teuerste.id}`} className="mt-4 inline-flex text-xs font-semibold text-violet-400 hover:text-violet-300">
                Preisverlauf und Details →
              </Link>
            </div>
          </section>
        )}

        <CardGrid cards={karten} title={`Alle ${p.de}-Karten — nach Marktwert sortiert`} />

        {setListe.length > 1 && (
          <section>
            <p className={`${SECTION_LABEL} mb-3`}>{p.de} in diesen Sets</p>
            <div className="flex flex-wrap gap-2">
              {setListe.slice(0, 40).map(([code, s]) => (
                <Link
                  key={code}
                  href={`/sets/${code}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2a2a3a] bg-[#13131e] px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500/30 hover:text-white transition-colors"
                >
                  <BoosterPackImage setCode={code} setName={s.name} className="h-4 w-auto" />
                  {s.name} <span className="text-slate-600 tabular-nums">{s.anzahl}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 sm:p-6">
          <p className={`${SECTION_LABEL} mb-4`}>Häufige Fragen</p>
          <div className="space-y-4">
            {fragen.map((q) => (
              <div key={q.f}>
                <h3 className="font-semibold text-slate-200">{q.f}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{q.a}</p>
              </div>
            ))}
          </div>
        </section>

        <Link
          href={`/suche?q=${encodeURIComponent(p.de)}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300"
        >
          <Search size={14} /> Nach „{p.de}“ suchen
        </Link>

        <footer className="border-t border-[#1e1e30] pt-5">
          <div className="rounded-md border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold text-amber-400/80">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-400/60 mt-0.5">
              Preise: Cardmarket (EUR) ohne Gewähr — <strong className="text-amber-400/80">keine Anlageberatung</strong>.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Kennzahl({ symbol, titel, wert }: { symbol: React.ReactNode; titel: string; wert: string }) {
  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        <span className="text-violet-400">{symbol}</span>
        {titel}
      </p>
      <p className="mt-2 text-xl font-black tabular-nums text-white">{wert}</p>
    </div>
  );
}
