import Link from 'next/link';
import { after } from 'next/server';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { ApiErrorState } from '@/components/ApiErrorState';
import { NavBar } from '@/components/NavBar';
import { HeroAtmosphere } from '@/components/HeroAtmosphere';
import { CbiPanel } from '@/components/CbiPanel';
import { MetricCards } from '@/components/MetricCards';
import { DistributionBands } from '@/components/DistributionBands';
import { MoversPanel, SetMarketPanel, ReportPromo, QuickActions } from '@/components/HomePanels';
import { MarketBriefBlock, SectionHead } from '@/components/MarketModules';

import { getHomepageCards } from '@/lib/homepage-data';
import { getDataCoverage } from '@/lib/data-coverage';
import { saveMarketIndex, loadMarketIndexHistory } from '@/lib/market-index-store';
import { marketBrief } from '@/lib/market-brief';
import { marketStory } from '@/lib/market-story';
import {
  splitMovers, marketBreadth, rankSets, hasRealTrend,
  computePmi, computeFearGreed, validateMarketData, logDataIssues,
} from '@/lib/market-metrics';
import { BRAND, DESCRIPTOR_DE, LEGAL_NO_ADVICE, LEGAL_UNOFFICIAL } from '@/lib/brand';

// STARTSEITE — umgesetzt nach dem gelieferten Entwurf.
//
// AUFBAU DES ENTWURFS, von oben nach unten:
//
//   Seitenleiste links · Kopfzeile mit Suche
//   KOPF        — Ueberschrift, Marktgeschichte, zwei Wege · daneben CBI-Panel
//   KENNZAHLEN  — vier Karten mit je eigener Mikro-Darstellung
//   DREI PANELS — staerkste Bewegungen · Set-Markt · Marktbericht
//   SCHNELLZUGRIFF
//   Fusszeile
//
// Alles darunter (Einordnung, Verteilung, eigener Bestand) bleibt erhalten:
// Der Entwurf zeigt den ERSTEN Bildschirm, nicht die ganze Seite. Die
// Einordnung wegzulassen, weil sie im Bild nicht vorkommt, waere eine
// Auslegung des Entwurfs, keine Umsetzung.

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `${BRAND} — Marktanalyse für Pokémon-Sammelkarten` },
  description:
    'Marktindex, Marktbreite und Preisbewegungen für Pokémon-Sammelkarten auf Basis aktueller Cardmarket-Daten. Offengelegte Methodik, keine Anlageberatung.',
  alternates: { canonical: '/' },
  keywords: [
    'Pokémon Karten Preis', 'Pokémon TCG Markt', 'Cardmarket Pokémon',
    'Pokémon Karten Marktanalyse', 'Pokémon Karten Wert', 'CardBeacon',
  ],
  openGraph: {
    siteName: BRAND,
    title: `${BRAND} — ${DESCRIPTOR_DE}`,
    description: 'Marktindex, Marktbreite und Preisbewegungen für Pokémon-Sammelkarten. Offengelegte Methodik.',
    type: 'website',
    locale: 'de_DE',
  },
};

export default async function MarketPage() {
  const cards = await getHomepageCards(250);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#070810] text-slate-300">
        <NavBar />
        <ApiErrorState backHref="/suche" backLabel="Zur Kartensuche" />
      </div>
    );
  }

  const qualitaet = validateMarketData(cards);
  logDataIssues(qualitaet, 'markt');
  const geprueft = qualitaet.clean;

  const cbi = computePmi(geprueft);
  const breite = marketBreadth(geprueft);
  const stimmung = computeFearGreed(geprueft);
  const sets = rankSets(geprueft, 8);
  const { gainers, losers } = splitMovers(geprueft, 6);
  const [abdeckung, verlauf] = await Promise.all([
    getDataCoverage().catch(() => null),
    // Der Verlauf fuer die Kurve im CBI-Panel. Faellt der Abruf aus, zeigt das
    // Panel den Grund — keine zurueckgerechnete Kurve.
    loadMarketIndexHistory(30).catch(() => []),
  ]);

  const trends = geprueft.filter(hasRealTrend).map((c) => c.trendPercent as number);
  const brief = marketBrief(cbi, breite, stimmung, sets);
  const story = marketStory(cbi, breite, sets);

  if (cbi.sufficient) {
    after(async () => {
      const fehler = await saveMarketIndex({
        value: cbi.value, cardCount: cbi.cardCount,
        setCount: cbi.setCount, windowDays: cbi.windowDays,
      });
      if (fehler) console.error('[Indexstand] nicht gespeichert:', fehler);
    });
  }

  const datenstand = new Date().toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const monat = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  // Die staerkste Bewegung insgesamt — sie traegt das Bild im Bericht-Hinweis.
  const staerkste =
    [...gainers, ...losers].sort(
      (a, b) => Math.abs(b.trendPercent ?? 0) - Math.abs(a.trendPercent ?? 0),
    )[0] ?? null;

  return (
    <AppShell
      datenstand={datenstand}
      bestand={
        abdeckung
          ? { karten: abdeckung.cards, sets: abdeckung.sets, punkte: abdeckung.pricePoints }
          : null
      }
    >
      {/* ══ HERO ═══════════════════════════════════════════════════════════
          Der Hero ist kein Abschnitt, sondern die Identitaet des Produkts.
          Er fuellt fast den ersten Bildschirm (92 vh) — nicht, weil Platz
          uebrig waere, sondern weil die Leere Teil der Gestaltung ist. Wer
          hier ankommt, soll ein paar Sekunden bleiben, bevor Zahlen kommen.

          Drei Bereiche, bewusst UNSYMMETRISCH: Navigation links (in der
          Huelle), Erzaehlung in der Mitte, schwebende Auskunft rechts. */}
      <section
        aria-labelledby="marktkopf"
        className="relative flex min-h-[92vh] flex-col justify-center"
      >
        <HeroAtmosphere />

        <div className="relative w-full px-6 py-16 sm:px-10 lg:px-14 xl:px-16">
          <div className="grid items-center gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)] xl:gap-20">
            {/* ── ERZAEHLUNG ────────────────────────────────────────────
                Hierarchie wie vorgegeben: Auszeichnung, sehr grosse
                Ueberschrift, Erzaehlung, Knoepfe, kleine Marktfakten.
                Textbreite bei 620 px — darueber wird Fliesstext unlesbar,
                darunter wirkt er gedraengt. */}
            <div className="max-w-[620px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.32em] text-slate-400/80">
                Marktübersicht · Pokémon TCG
              </p>

              <h1
                id="marktkopf"
                className="mt-8 bg-clip-text text-[clamp(2.75rem,6.4vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-transparent"
                style={{
                  // Bernstein ueber Weiss in die Markenfarbe — der Verlauf des
                  // Entwurfs. Nicht `.prismatic`: Das ist der Folienverlauf
                  // fuer kleine Auszeichnungen und laeuft ueber drei kalte
                  // Toene; eine Ueberschrift dieser Groesse wirkt damit kuehl
                  // statt kostbar.
                  backgroundImage:
                    'linear-gradient(103deg, rgb(252 214 138) 0%, rgb(250 234 218) 24%, rgb(255 255 255) 46%, rgb(228 217 255) 70%, rgb(167 139 250) 100%)',
                }}
              >
                Heute im
                <br />
                Pokémon Markt
              </h1>

              <p className="mt-9 max-w-[560px] text-[16px] leading-[1.85] text-slate-300/85 sm:text-[17px]">
                {story.absatz}
              </p>

              {/* KNOEPFE bewusst uebergross: 58 px hoch, weite Innenabstaende,
                  Pille. Ein Knopf in Standardgroesse wuerde neben einer
                  72-px-Ueberschrift wie ein Bedienelement wirken — hier ist er
                  Teil der Komposition. */}
              <div className="mt-11 flex flex-wrap items-center gap-4">
                <Link
                  href="/marktbericht"
                  className="group inline-flex h-[58px] items-center gap-2.5 rounded-full border border-violet-300/25 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-9 text-[15px] font-medium text-white shadow-[0_10px_40px_-12px_rgba(139,92,246,0.75)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_16px_52px_-12px_rgba(139,92,246,0.9)]"
                >
                  Marktbericht lesen
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/sets"
                  className="inline-flex h-[58px] items-center rounded-full border border-white/[0.11] bg-white/[0.025] px-9 text-[15px] text-slate-100 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[2px] hover:border-white/[0.22] hover:bg-white/[0.06]"
                >
                  Sets entdecken
                </Link>
              </div>

              {/* Kleine Marktfakten — sie machen die Erzaehlung darueber
                  nachpruefbar, ohne sie zu unterbrechen. */}
              {story.belastbar && (
                <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-3 text-[12px]">
                  {story.belege.map((b) => (
                    <div key={b.label} className="flex flex-col gap-1">
                      <dt className="uppercase tracking-[0.16em] text-slate-600">{b.label}</dt>
                      <dd className="text-[14px] tabular-nums text-slate-200">{b.wert}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* ── SCHWEBENDE AUSKUNFT ───────────────────────────────────── */}
            <div>
              <CbiPanel
                cbi={cbi}
                verlauf={verlauf}
                zustand={stimmung.sufficient ? stimmung.label : 'Keine Messung'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ KENNZAHLEN UND PANELS ═══════════════════════════════════════ */}
      <div className="relative px-6 pb-14 sm:px-10 lg:px-14 xl:px-16">
          {/* ══ KENNZAHLEN ══════════════════════════════════════════════ */}
          <div className="pt-4">
            <MetricCards breite={breite} stimmung={stimmung} abdeckung={abdeckung} cbi={cbi} />
          </div>

          {/* ══ DREI PANELS ═════════════════════════════════════════════ */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <MoversPanel karten={gainers} cbi={cbi.sufficient ? cbi.value : null} />
            <SetMarketPanel sets={sets.slice(0, 4)} />
            <ReportPromo
              monat={monat}
              titel={story.schlagzeile}
              text="Die vollständige Analyse mit Kennzahlen, Bewegungen und der Datengrundlage dahinter."
              karte={staerkste}
            />
          </div>

          {/* ══ SCHNELLZUGRIFF ══════════════════════════════════════════ */}
          <div className="mt-5">
            <QuickActions />
          </div>
      </div>

      {/* ══ WEITERFUEHREND ════════════════════════════════════════════════
          Der Entwurf zeigt den ersten Bildschirm. Was darunter bereits stand,
          bleibt: Einordnung, Verteilung und der Uebergang zum eigenen Bestand
          sind der inhaltliche Kern und nicht Teil des Bildausschnitts. */}
      <main className="px-6 pb-6 sm:px-10 lg:px-14 xl:px-16">
        <section
          aria-labelledby="einordnung"
          className="relative py-20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(139,92,246,0.16)_18%,rgba(217,70,239,0.24)_50%,rgba(56,189,248,0.16)_82%,transparent)]"
        >
          <SectionHead num="01" title="Einordnung" meta={`${cbi.windowDays} Tage`} />
          <h2 id="einordnung" className="sr-only">Einordnung des Marktstands</h2>
          <MarketBriefBlock saetze={brief} />
        </section>

        {cbi.sufficient && trends.length > 0 && (
          <section
            aria-labelledby="verteilung"
            className="relative py-20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(139,92,246,0.16)_18%,rgba(217,70,239,0.24)_50%,rgba(56,189,248,0.16)_82%,transparent)]"
          >
            <SectionHead num="02" title="Verteilung" meta={`${trends.length} gemessene Karten`} />
            <h2 id="verteilung" className="sr-only">Verteilung der Bewegungen</h2>
            <div className="mt-5 max-w-3xl">
              <DistributionBands trends={trends} />
            </div>
          </section>
        )}

        <section
          aria-labelledby="verlierer"
          className="relative py-20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(139,92,246,0.16)_18%,rgba(217,70,239,0.24)_50%,rgba(56,189,248,0.16)_82%,transparent)]"
        >
          <SectionHead
            num="03"
            title="Schwächste Bewegungen"
            meta={`${breite.down} im Minus`}
            href="/suche"
            hrefLabel="Karten durchsuchen"
          />
          <h2 id="verlierer" className="sr-only">Schwächste Bewegungen</h2>
          <div className="mt-5 max-w-2xl">
            <MoversPanel karten={losers} cbi={cbi.sufficient ? cbi.value : null} />
          </div>
        </section>

        <section
          aria-labelledby="bestand"
          className="relative py-20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(139,92,246,0.16)_18%,rgba(217,70,239,0.24)_50%,rgba(56,189,248,0.16)_82%,transparent)]"
        >
          <SectionHead num="04" title="Eigener Bestand" />
          <h2 id="bestand" className="sr-only">Eigener Bestand</h2>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-xl text-[15px] leading-relaxed text-slate-300">
              Derselbe Maßstab, andere Menge: Das Portfolio misst deine Karten gegen denselben
              Index — nicht nur ihren Wert, sondern ihre Entwicklung gegenüber dem Markt.
            </p>
            <Link
              href="/portfolio"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/[0.13] bg-white/[0.03] px-5 text-[13px] text-slate-100 transition-colors hover:border-white/[0.24]"
            >
              Bestand anlegen <ArrowRight size={13} />
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-slate-600">Bleibt im Browser. Kein Konto nötig.</p>
        </section>

        <div className="border-t border-white/[0.05] py-8">
          <p className="max-w-2xl text-[11px] leading-relaxed text-slate-600">
            {LEGAL_UNOFFICIAL} {LEGAL_NO_ADVICE}
          </p>
        </div>
      </main>

    </AppShell>
  );
}
