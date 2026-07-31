import Link from 'next/link';
import { after } from 'next/server';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

import { NavBar } from '@/components/NavBar';
import { ApiErrorState } from '@/components/ApiErrorState';
import { MarketHeader } from '@/components/MarketHeader';
import {
  SectionHead,
  MarketBriefBlock,
  MarketMovers,
  SetMarket,
} from '@/components/MarketModules';

import { getHomepageCards } from '@/lib/homepage-data';
import { getDataCoverage } from '@/lib/data-coverage';
import { saveMarketIndex } from '@/lib/market-index-store';
import { marketBrief } from '@/lib/market-brief';
import {
  splitMovers,
  marketBreadth,
  rankSets,
  hasRealTrend,
  computePmi,
  computeFearGreed,
  validateMarketData,
  logDataIssues,
} from '@/lib/market-metrics';
import { BRAND, DESCRIPTOR_DE, LEGAL_NO_ADVICE, LEGAL_UNOFFICIAL } from '@/lib/brand';
import { SECTION_LABEL } from '@/lib/ui';

// STARTSEITE — die Marktübersicht.
//
// Die Vorgängerfassung war eine Folge voneinander unabhängiger Bausteine:
// Suchfeld als Blickfang, laufender Ticker, vier Kennzahl-Kacheln, Gewinner,
// Verlierer, Trending-Tabelle, Insight-Karten, Set-Tabelle, Portfolio-Hinweis,
// Blog. Zehn Abschnitte, mehrfach dieselben Karten, alle optisch gleich
// gewichtet — und damit keiner wichtig.
//
// Jetzt sechs, in der Reihenfolge der Produktlogik:
//
//   01 MARKT      — wo steht der Markt (Index, Breite, Stimmung, Abdeckung)
//   02 EINORDNUNG — was heißt das (regelbasiert, keine Prognose)
//   03 BEWEGUNGEN — welche Karten tragen es
//   04 SET-MARKT  — welche Sets bewegen sich
//   05 BESTAND    — was heißt das für meine Karten
//   06 RESEARCH   — wo lese ich weiter
//
// Die Suche ist aus dem Blickfang verschwunden. Sie steht jederzeit in der
// Kopfzeile — aber die erste Aussage der Seite ist der Marktstand, nicht ein
// leeres Eingabefeld.

export const revalidate = 3600;

export const metadata: Metadata = {
  // `absolute` statt eines gewoehnlichen Titels: Das Root-Layout haengt an jeden
  // Seitentitel `| CardBeacon` an. Die Startseite fuehrt die Marke bereits im
  // Titel — ohne `absolute` stuende sie zweimal darin.
  // Nicht aus DESCRIPTOR_DE zusammengesetzt: Das ergab „Marktanalyse für
  // Sammelkarten für Pokémon-Karten" — zweimal „für" in einem Titel, der in
  // jedem Suchergebnis steht.
  title: { absolute: `${BRAND} — Marktanalyse für Pokémon-Sammelkarten` },
  description:
    'Marktindex, Marktbreite und Preisbewegungen für Pokémon-Sammelkarten auf Basis aktueller Cardmarket-Daten. Offengelegte Methodik, keine Anlageberatung.',
  // Die geerbte relative Angabe (`./`) loest auf der Wurzelroute zu `/index`
  // auf — einer Adresse, die es nicht gibt. Fuer die Startseite deshalb fest.
  alternates: { canonical: '/' },
  keywords: [
    'Pokémon Karten Preis',
    'Pokémon TCG Markt',
    'Cardmarket Pokémon',
    'Pokémon Karten Marktanalyse',
    'Pokémon Karten Wert',
    'CardBeacon',
  ],
  openGraph: {
    siteName: BRAND,
    title: `${BRAND} — ${DESCRIPTOR_DE}`,
    description:
      'Marktindex, Marktbreite und Preisbewegungen für Pokémon-Sammelkarten. Offengelegte Methodik.',
    type: 'website',
    locale: 'de_DE',
  },
};

export default async function MarketPage() {
  // Robust: Live-Daten mit Rückfall auf den letzten gespeicherten Marktbericht,
  // damit ein Aussetzer der Kartendatenbank nicht als leere Seite gecacht wird.
  const cards = await getHomepageCards(250);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#08080b] text-slate-300">
        <NavBar />
        <ApiErrorState backHref="/suche" backLabel="Zur Kartensuche" />
      </div>
    );
  }

  // Erst prüfen, dann rechnen — ein einzelner Ausreißer verschiebt einen
  // gewichteten Index spürbar und unbemerkt.
  const qualitaet = validateMarketData(cards);
  logDataIssues(qualitaet, 'markt');
  const geprueft = qualitaet.clean;

  const cbi = computePmi(geprueft);
  const breite = marketBreadth(geprueft);
  const stimmung = computeFearGreed(geprueft);
  const sets = rankSets(geprueft, 8);
  const { gainers, losers } = splitMovers(geprueft, 6);
  const abdeckung = await getDataCoverage().catch(() => null);

  // Gemessene Bewegungen für die Verteilung im Kopf — nur Karten mit echter
  // Messung, dieselbe Grundmenge wie Index und Marktbreite.
  const trends = geprueft.filter(hasRealTrend).map((c) => c.trendPercent as number);

  const brief = marketBrief(cbi, breite, stimmung, sets);

  // INDEXSTAND FESTHALTEN.
  //
  // Diese Seite berechnet den Index ohnehin — ihn dabei zu speichern kostet
  // nichts und erspart jeder Kartenseite die Neuberechnung aus 250 Karten.
  //
  // `after` läuft NACH der Antwort: Der Besucher wartet nicht auf einen
  // Schreibvorgang, von dem er nichts hat.
  //
  // Nebenbei entsteht so eine echte Indexhistorie. Der Marktkopf zeigt heute
  // die Verteilung statt einer Kurve, weil es keine gespeicherten Tagesstände
  // gab — ab jetzt sammeln sie sich an.
  if (cbi.sufficient) {
    after(async () => {
      const fehler = await saveMarketIndex({
        value: cbi.value,
        cardCount: cbi.cardCount,
        setCount: cbi.setCount,
        windowDays: cbi.windowDays,
      });
      if (fehler) console.error('[Indexstand] nicht gespeichert:', fehler);
    });
  }

  const datenstand = new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#08080b] text-slate-300">
      <NavBar />

      {/* 01 — MARKT */}
      <MarketHeader
        cbi={cbi}
        breite={breite}
        stimmung={stimmung}
        abdeckung={abdeckung}
        trends={trends}
        datenstand={datenstand}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 02 — EINORDNUNG */}
        <section aria-labelledby="einordnung" className="py-12 sm:py-16">
          <SectionHead num="02" title="Einordnung" meta={`${cbi.windowDays} Tage`} />
          <h2 id="einordnung" className="sr-only">
            Einordnung des Marktstands
          </h2>
          <MarketBriefBlock saetze={brief} />
        </section>

        {/* 03 — BEWEGUNGEN */}
        <section aria-labelledby="bewegungen" className="border-t border-[#1c1c24] py-12 sm:py-16">
          <SectionHead
            num="03"
            title="Bewegungen"
            meta={`${breite.up} im Plus · ${breite.down} im Minus`}
            href="/suche"
            hrefLabel="Karten durchsuchen"
          />
          <h2 id="bewegungen" className="sr-only">
            Stärkste Bewegungen
          </h2>
          <MarketMovers gainers={gainers} losers={losers} />
        </section>

        {/* 04 — SET-MARKT */}
        <section aria-labelledby="setmarkt" className="border-t border-[#1c1c24] py-12 sm:py-16">
          <SectionHead
            num="04"
            title="Set-Markt"
            meta={sets.length > 0 ? `${sets.length} Sets mit ausreichender Stichprobe` : undefined}
            href="/sets"
            hrefLabel="Alle Sets"
          />
          <h2 id="setmarkt" className="sr-only">
            Set-Markt
          </h2>
          <SetMarket sets={sets} />
        </section>

        {/* 05 — BESTAND
            Der Übergang vom Markt zum eigenen Bestand ist die Produktidee:
            derselbe Maßstab für beides. Deshalb steht hier keine Werbekachel,
            sondern die Frage, die das Portfolio beantwortet. */}
        <section aria-labelledby="bestand" className="border-t border-[#1c1c24] py-12 sm:py-16">
          <SectionHead num="05" title="Eigener Bestand" />
          <h2 id="bestand" className="sr-only">
            Eigener Bestand
          </h2>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-xl text-[15px] leading-relaxed text-slate-300">
              Derselbe Maßstab, andere Menge: Das Portfolio misst deine Karten
              gegen denselben Index — nicht nur ihren Wert, sondern ihre
              Entwicklung gegenüber dem Markt.
            </p>
            <Link
              href="/portfolio"
              className="inline-flex min-h-[44px] items-center gap-2 border border-[#2a2a35] px-4 text-[13px] text-slate-200 transition-colors hover:border-slate-500"
            >
              Bestand anlegen
              <ArrowRight size={13} />
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-slate-600">Bleibt im Browser. Kein Konto nötig.</p>
        </section>

        {/* 06 — RESEARCH */}
        <section aria-labelledby="research" className="border-t border-[#1c1c24] py-12 sm:py-16">
          <SectionHead num="06" title="Research" href="/research" hrefLabel="Alle Inhalte" />
          <h2 id="research" className="sr-only">
            Research
          </h2>
          <div className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: '/marktbericht',
                titel: 'Marktbericht',
                text: 'Wochenanalyse mit Kennzahlen und Bewegungen',
              },
              { href: '/artikel', titel: 'Analysen', text: 'Sonntags und donnerstags' },
              { href: '/guides', titel: 'Guides', text: 'Seltenheit, Grading, Lagerung' },
              { href: '/methodik', titel: 'Methodik', text: 'Wie jede Kennzahl entsteht' },
            ].map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="group border-t border-[#1c1c24] pt-3 transition-colors hover:border-slate-600"
              >
                <span className="block text-[13px] text-slate-200 group-hover:text-white">
                  {e.titel}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-slate-600">
                  {e.text}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="border-t border-[#1c1c24] py-8">
          <p className={SECTION_LABEL}>Hinweis</p>
          <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-slate-600">
            {LEGAL_UNOFFICIAL} {LEGAL_NO_ADVICE}
          </p>
        </div>
      </main>
    </div>
  );
}
