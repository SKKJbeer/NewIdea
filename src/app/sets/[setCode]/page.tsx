import { notFound } from 'next/navigation';
import { SECTION_LABEL } from '@/lib/ui';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { dominantAmbient } from '@/lib/collector';
import { CardGrid } from '@/components/CardGrid';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { ArrowLeft, Package, ShoppingCart, ExternalLink } from 'lucide-react';
import { ApiErrorState } from '@/components/ApiErrorState';
import { fetchCardsBySet, isValidSetCode, displayPrice } from '@/lib/pokemon-api';
import { formatEurRounded, formatPercent } from '@/lib/format';
import type { Metadata } from 'next';
import { jsonLd } from '@/lib/json-ld';
import { siteUrlOrLocal } from '@/lib/site';

// BEWUSST KEIN generateStaticParams: Schlägt die TCG-API während des Builds fehl,
// würden existierende Sets als 404 fest ins CDN gebacken (siehe karten/[id]).
// On-Demand + ISR (24h) + Loading-Skeleton ist robuster.
export const revalidate = 86400;

const SITE_URL = siteUrlOrLocal();

interface Props {
  params: Promise<{ setCode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setCode } = await params;
  if (!isValidSetCode(setCode)) return { title: 'Set nicht gefunden' };

  // Ausfall der Quelle und „Set gibt es nicht" sind zwei verschiedene Aussagen.
  // Frueher endeten beide im Titel „Set nicht gefunden" — bei einem Aussetzer
  // stand das dann fuer ein reales Set in der Auslieferung. Bei einem Ausfall
  // gibt es hier gar keine Behauptung, nur einen neutralen Titel; die Seite
  // selbst zeigt den Fehlerzustand.
  let cards;
  try {
    cards = await fetchCardsBySet(setCode);
  } catch {
    return { title: 'Set-Analyse', robots: { index: false } };
  }
  if (cards.length === 0) return { title: 'Set nicht gefunden', robots: { index: false } };

  const setName = cards[0].set;
  return {
    title: `${setName} — Kartenpreise & wertvollste Karten`,
    description: `Alle handelbaren Karten aus ${setName} mit aktuellen Cardmarket-Preisen (EUR), Trends und Markt-Scores — sortiert nach Marktwert.`,
    alternates: { canonical: `${SITE_URL}/sets/${setCode}` },
  };
}

export default async function SetDetailPage({ params }: Props) {
  const { setCode } = await params;
  if (!isValidSetCode(setCode)) notFound();

  // API-Fehler ≠ "Set existiert nicht": Fehler-UI statt 404 (sonst wird ein
  // existierendes Set bei Rate-Limits als 404 gecacht).
  let cards;
  try {
    cards = await fetchCardsBySet(setCode);
  } catch {
    return <ApiErrorState backHref="/sets" backLabel="Alle Sets" />;
  }
  if (cards.length === 0) notFound();

  const setName = cards[0].set;
  const topValue = cards.reduce((sum, c) => sum + displayPrice(c), 0);

  // Der Ton dieser Seite ist GEZÄHLT, nicht gesetzt: vorherrschender Energietyp
  // der handelbaren Karten. Bei zu dünner Datenlage bleibt es beim Markenton
  // und die Seite behauptet nichts über einen Typ.
  const setTon = dominantAmbient(cards);

  const amazonUrl =
    process.env.NEXT_PUBLIC_AMAZON_URL ||
    `https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${setName} Booster`)}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${setName} — Pokémon-Karten nach Marktwert`,
    numberOfItems: cards.length,
    itemListElement: cards.slice(0, 10).map((card, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: card.name,
      url: `${SITE_URL}/karten/${card.id}`,
    })),
  };

  return (
    <div className="min-h-screen bg-[#070810] text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <NavBar />

      <header className="relative border-b border-[#1c1c24]">
        <AmbientBackdrop mode="set" akzent={setTon.gezaehlt > 0 ? setTon.ambient.ambient : undefined} />
        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-12 sm:py-14">
          <Link href="/sets" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-6 transition-colors">
            <ArrowLeft size={12} /> Alle Sets
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <BoosterPackImage
              setCode={setCode}
              setName={setName}
              className="h-40 w-auto object-contain drop-shadow-xl shrink-0"
            />
            <div className="text-center sm:text-left">
              <p className={SECTION_LABEL}>Set-Analyse · Pokémon</p>
              <h1 className="mt-3 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">{setName}</h1>
              <p className="text-slate-500 text-sm mt-2">
                {cards.length} handelbare Karten · Gesamtwert der Einzelkarten ca. {formatEurRounded(topValue)}
              </p>
              {/* Offenlegung des Seitentons: Die Farbe ist gezählt. Ohne diesen
                  Satz wirkt sie wie Dekoration — mit ihm ist sie eine Angabe.

                  `flex`, NICHT `inline-flex`: Ein Absatz mit `inline-flex` ist
                  ein Inline-Element; der Kaufknopf darunter rutschte dadurch
                  auf dieselbe Zeile und schnitt den Satz ab. */}
              {setTon.gezaehlt > 0 && (
                <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] text-slate-600 sm:justify-start">
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full bg-current ${setTon.ambient.text}`} />
                  Häufigster Energietyp:{' '}
                  <span className={setTon.ambient.text}>{setTon.ambient.quelle}</span>
                  <span className="tabular-nums">
                    {formatPercent(setTon.anteil * 100, { withSign: false, digits: 0 })}
                  </span>
                  der {setTon.gezaehlt} typisierten Karten
                </p>
              )}
              <a
                href={amazonUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 border border-[#2a2a35] px-5 text-[13px] font-semibold text-slate-300 transition-colors hover:border-violet-500/40 hover:text-violet-300"
              >
                <ShoppingCart size={15} /> Booster kaufen <ExternalLink size={12} />
              </a>
              <p className="text-[10px] text-slate-600 mt-1.5">* Affiliate-Link</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 pb-16 space-y-8">
        <CardGrid cards={cards} title={`Alle Karten aus ${setName} — nach Marktwert sortiert`} />

        <footer className="border-t border-[#1e1e30] pt-5 space-y-3">
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
