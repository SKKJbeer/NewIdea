import { getHomepageCards } from '@/lib/homepage-data';
import { getDataCoverage } from '@/lib/data-coverage';
import { cachedImg } from '@/lib/cached-image';
import { ContentIcon } from '@/components/ContentIcon';
import { SearchBox } from '@/components/SearchBox';
import { AffiliateBar } from '@/components/AffiliateBar';
import { NavBar } from '@/components/NavBar';
import Link from 'next/link';
import { TrendingUp, TrendingDown, BarChart2, ArrowRight, Zap, BookOpen, Activity, Sparkles } from 'lucide-react';
import { GUIDES } from '@/lib/guides';
import type { PriceDataPoint } from '@/types';
import type { Metadata } from 'next';
import { formatEur, formatEurRounded, formatPercent } from '@/lib/format';
import { ApiErrorState } from '@/components/ApiErrorState';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { ZeroMeter, RatioBar, RowBar } from '@/components/DataBars';
import { FearGreedPanel } from '@/components/FearGreedPanel';
import {
  splitMovers,
  marketBreadth,
  rankSets,
  MIN_SET_SAMPLE,
  hasRealTrend,
  computePmi,
  computeFearGreed,
  validateMarketData,
  logDataIssues,
} from '@/lib/market-metrics';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pokémon Kartenmarkt datenbasiert verstehen — PokéMarket Intelligence',
  description:
    'Cardmarket-Preise für Pokémon-Sammelkarten. Marktindex, Top-Gewinner, Verlierer und Markt-Scores — täglich aktualisiert.',
  keywords: [
    'Pokémon Karten Preis',
    'Pokémon TCG Markt',
    'Cardmarket Pokémon',
    'Pokémon Karten Marktanalyse',
    'Pokémon Karten Wert',
    'Charizard Preis',
    'seltene Pokémon Karten',
  ],
  openGraph: {
    title: 'Pokémon Kartenmarkt datenbasiert verstehen — PokéMarket Intelligence',
    description: 'Echte Cardmarket-Preise, Marktindex und Trend-Analyse für Pokémon-Sammelkarten.',
    type: 'website',
    locale: 'de_DE',
    alternateLocale: 'en_US',
  },
};

// --- Inline SVG Sparkline (server-side rendered) ---
function Sparkline({
  history,
  up,
  w = 80,
  h = 28,
}: {
  history: PriceDataPoint[];
  up: boolean;
  w?: number;
  h?: number;
}) {
  if (history.length < 2) return null;
  const prices = history.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices
    .map((p, i) => {
      // toFixed erlaubt: SVG-Koordinaten, keine Anzeigezahlen
    const x = ((i / (prices.length - 1)) * w).toFixed(1);
      const y = (h - ((p - min) / range) * h).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');
  const color = up ? '#34d399' : '#fb7185';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function fmt(price: number | undefined): string {
  if (!price || price <= 0) return '–';
  // Ab 100 € ohne Nachkommastellen (kompakter im Raster), aber MIT deutschem
  // Tausenderpunkt — sonst steht dort „4185 €" statt „4.185 €".
  return price >= 100 ? formatEurRounded(price) : formatEur(price);
}

function fmtPct(pct: number | undefined): string {
  if (pct == null) return '–';
  return formatPercent(pct);
}

export default async function Home() {
  // Robust: Live-TCG-Daten mit Fallback auf den letzten Supabase-Marktbericht,
  // damit die Startseite bei einem API-Ausfall nicht LEER gecacht wird (Stolperstelle 19).
  // STICHPROBE: 250 statt 50 Karten.
  //
  // Die „50 Karten · 4 Sets" neben dem Marktindex kamen NICHT aus der Datenlage,
  // sondern aus diesem Aufruf — eine Kennzahl über den halben Markt, begrenzt
  // durch eine Zahl im Code. Dieselbe Abfrage liefert bei 250 Karten 17 Sets
  // statt 4; erst damit sind Set-Ranglisten und Marktbreite überhaupt
  // aussagekräftig. Ein Abruf mehr je Neuerzeugung (stündlich) ist das wert.
  const cards = await getHomepageCards(250);

  // Ohne Kartendaten KEINE erfundene Marktlage: Die Kennzahlen unten (PMI,
  // Marktbreite, Fear & Greed) würden aus einem leeren Datensatz trotzdem
  // Werte erzeugen — ein Sentiment, das auf nichts beruht. Das verstößt gegen
  // die Wahrheitspflicht (CLAUDE.md → Preise: absolute Wahrheitspflicht).
  // Stattdessen ein ehrlicher Zustand statt einer stumm leeren Seite.
  if (cards.length === 0) {
    return <ApiErrorState backHref="/suche" backLabel="Zur Kartensuche" />;
  }

  // --- Kennzahlen ---
  // Zuerst prüfen, dann rechnen: Ein einzelner Ausreißer (Preis- oder
  // Trendfehler) verschiebt einen gewichteten Index spürbar, und zwar
  // unbemerkt. Die Befunde landen im Server-Log, statt still einzufließen.
  // Datenabdeckung ist etwas ANDERES als die Stichprobe unten — sie beschreibt,
  // was die Plattform insgesamt beobachtet. Beides nebeneinander zu zeigen ist
  // der Punkt: Eine heute neu erfasste Karte gehört sofort in die Abdeckung und
  // noch nicht in eine 30-Tage-Kennzahl.
  const abdeckung = await getDataCoverage().catch(() => null);

  const qualitaet = validateMarketData(cards);
  logDataIssues(qualitaet, 'startseite');
  const geprueft = qualitaet.clean;

  const withTrend = geprueft.filter(hasRealTrend);
  // Gewinner und Verlierer streng nach Vorzeichen — keine Auffüllung.
  // ACHTUNG: Diese beiden Listen sind auf acht Einträge gekürzt. Sie sind für
  // die ANZEIGE da und dürfen in keine Kennzahl einfließen (siehe unten).
  const { gainers, losers } = splitMovers(geprueft, 8);

  // Marktbreite über den GANZEN Datensatz — nicht über die gekürzte Liste.
  const breite = marketBreadth(geprueft);
  const breadthPct = breite.pct;

  const pmi = computePmi(geprueft);
  const pmiNum = pmi.value;
  const fg = computeFearGreed(geprueft);

  // Datenstand: der Zeitpunkt, zu dem diese Seite erzeugt wurde. Das ist der
  // ehrliche Stand dessen, was hier steht — nicht der Stand der Quelle.
  const datenstand = new Date().toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const sentiment =
    !fg.sufficient ? { label: 'Zu wenig Daten', dotClass: 'bg-slate-600' }
    : fg.value >= 65 ? { label: 'Bullish', dotClass: 'bg-emerald-400' }
    : fg.value >= 40 ? { label: 'Neutral', dotClass: 'bg-amber-400' }
    : { label: 'Bearish', dotClass: 'bg-rose-400' };

  // Ticker: top 10 gainers + losers interleaved
  const tickerCards = [...withTrend]
    .sort((a, b) => Math.abs(b.trendPercent ?? 0) - Math.abs(a.trendPercent ?? 0))
    .slice(0, 14);

  // Top 10 trending by absolute trend magnitude (all directions)
  const trendingTable = [...withTrend]
    .sort((a, b) => Math.abs(b.trendPercent ?? 0) - Math.abs(a.trendPercent ?? 0))
    .slice(0, 10);

  // Set-Rangliste — zentral aus `market-metrics`, damit Startseite und
  // Marktbericht dieselbe Regel anwenden. Sets unter der Mindest-Stichprobe
  // erscheinen NICHT: Zuvor stand hier „151 — stärkstes Set · 1 Karten im
  // Datensatz", also der Preis einer einzelnen Karte als Set-Durchschnitt.
  const topSets = rankSets(geprueft, 5);

  // Maßstab für die Anteilsbalken in der Set-Tabelle.
  const maxSetPreis = Math.max(...topSets.map((s) => s.medianPrice), 0);

  // Markt-Insights — ausschließlich abgeleitet, nichts erfunden.
  // Als reine Textzeilen gingen diese Aussagen unter; jede bekommt jetzt ein
  // Bild und eine hervorgehobene Kennzahl, damit die Zahl den Satz trägt.
  interface Insight {
    kennzahl: string;
    titel: string;
    text: string;
    ton: 'up' | 'down' | 'neutral';
    imageUrl?: string;
    setCode?: string;
    setName?: string;
    href?: string;
  }
  const insights: Insight[] = [];
  const bestGainer = gainers[0];
  const worstLoser = losers[0];
  if (bestGainer && typeof bestGainer.trendPercent === 'number') {
    insights.push({
      kennzahl: fmtPct(bestGainer.trendPercent),
      titel: bestGainer.nameDe ?? bestGainer.name,
      text: 'Stärkster Aufwärtstrend im aktuellen Datensatz (30 Tage).',
      ton: 'up',
      imageUrl: bestGainer.imageUrl,
      setCode: bestGainer.setCode,
      setName: bestGainer.set,
      href: `/karten/${bestGainer.id}`,
    });
  }
  if (worstLoser && typeof worstLoser.trendPercent === 'number') {
    insights.push({
      kennzahl: fmtPct(worstLoser.trendPercent),
      titel: worstLoser.nameDe ?? worstLoser.name,
      text: 'Schwächste Entwicklung im Segment (30 Tage).',
      ton: 'down',
      imageUrl: worstLoser.imageUrl,
      setCode: worstLoser.setCode,
      setName: worstLoser.set,
      href: `/karten/${worstLoser.id}`,
    });
  }
  if (breite.total > 0) {
    const positiv = breite.up > breite.total / 2;
    insights.push({
      kennzahl: formatPercent(breadthPct, { withSign: false, digits: 0 }),
      titel: positiv ? 'Marktbreite positiv' : 'Marktbreite negativ',
      text: `${breite.up} von ${breite.total} analysierten Karten notieren über ihrem 30-Tages-Schnitt.`,
      ton: positiv ? 'up' : 'down',
    });
  }
  if (topSets[0]) {
    insights.push({
      kennzahl: formatEurRounded(topSets[0].medianPrice),
      titel: topSets[0].name,
      text: `Höchster typischer Kartenpreis (Median) unter den Sets mit mindestens ${MIN_SET_SAMPLE} auswertbaren Karten — hier ${topSets[0].count}.`,
      ton: 'neutral',
      setCode: topSets[0].code,
      setName: topSets[0].name,
      href: `/sets/${topSets[0].code}`,
    });
  }

  const hasData = cards.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="mx-auto max-w-2xl px-4 pt-10 pb-8 text-center sm:pt-14">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Zap size={10} className="fill-violet-400" />
            Cardmarket-Preise · täglich aktualisiert
          </div>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Pokémon Kartenmarkt
          </h1>
          <p className="mb-6 text-xl font-black text-violet-400 sm:text-3xl">datenbasiert verstehen</p>
          <p className="mb-6 text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Preise · Trends · Marktanalysen — auf Basis aktueller Cardmarket-Daten
          </p>
          <div className="mx-auto max-w-xl">
            <SearchBox placeholder="Karte suchen, z.B. Glurak oder Charizard …" />
          </div>
        </div>
      </header>

      {/* ── TICKER STRIP ────────────────────────────────────────────────── */}
      {hasData && (
        <div className="border-b border-[#1e1e30] bg-[#0d0d18] py-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-6 px-4 min-w-max">
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 pr-2 border-r border-[#2a2a3a]">
              <Activity size={10} /> Live
            </span>
            {tickerCards.map((card) => {
              const trend = card.trendPercent ?? 0;
              const up = trend > 0;
              const neutral = trend === 0;
              const price = card.prices.market;
              return (
                <Link
                  key={card.id}
                  href={`/karten/${card.id}`}
                  // `min-h-[32px]` — die Ticker-Einträge sind Links und waren
                  // auf einem Telefon nur rund 16 px hoch.
                  className="group flex min-h-[32px] shrink-0 items-center gap-2"
                >
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors truncate max-w-[120px]">
                    {card.nameDe ?? card.name}
                  </span>
                  {price != null && price > 0 && (
                    <span className="text-[11px] font-mono text-slate-300">{fmt(price)}</span>
                  )}
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      neutral ? 'text-slate-500' : up ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {fmtPct(card.trendPercent)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl space-y-10 px-4 pt-8 pb-20">

        {/* ── EINSTEIGER ON-RAMP ──────────────────────────────────────────── */}
        <Link
          href="/einsteiger"
          className="group flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-transparent p-4 transition-all hover:border-violet-500/40 hover:from-violet-600/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-100">Neu bei Pokémon-Karten?</p>
            <p className="text-xs text-slate-500">In 3 Schritten zum Wert deiner Sammlung — ganz ohne Vorwissen.</p>
          </div>
          <ArrowRight size={16} className="shrink-0 text-violet-400 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
        {hasData && (
          <section aria-label="Markt-Kennzahlen">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              {/* PMI */}
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/10">
                    <BarChart2 size={11} className="text-violet-400" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">PMI Index</span>
                </div>
                {/* Ein Index aus wenigen Karten ist kein Index, sondern ein
                    Mittelwert — und sieht in der Oberfläche trotzdem aus wie
                    ein Index. Unterhalb der Mindestmenge wird deshalb KEIN
                    Wert ausgewiesen. */}
                {pmi.sufficient ? (
                  <>
                    <p
                      className={`text-2xl font-black tabular-nums leading-none ${pmiNum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {formatPercent(pmiNum)}
                    </p>
                    <div className="mt-2.5">
                      <ZeroMeter value={pmiNum} max={10} />
                    </div>
                    {/* „auswertbar" ist hier das entscheidende Wort: Das ist die
                        Stichprobe DIESER Kennzahl, nicht der Datenbestand. Der
                        steht als Abdeckung unter den Kacheln. */}
                    <p className="mt-1.5 text-[10px] leading-snug text-slate-600">
                      {pmi.cardCount} auswertbare Karten · {pmi.setCount}{' '}
                      {pmi.setCount === 1 ? 'Set' : 'Sets'}
                      <br />
                      {pmi.windowDays} Tage · Stand {datenstand}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-black leading-tight text-slate-500">—</p>
                    <p className="mt-1.5 text-[10px] leading-snug text-slate-600">
                      Noch nicht genügend Marktdaten für einen belastbaren PMI
                      ({pmi.cardCount}/{pmi.minCards} Karten).
                    </p>
                  </>
                )}
              </div>

              {/* Marktbreite */}
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10">
                    <TrendingUp size={11} className="text-emerald-400" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Marktbreite</span>
                </div>
                <p className={`text-2xl font-black tabular-nums leading-none ${breadthPct >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent(breadthPct, { withSign: false, digits: 0 })}
                </p>
                {/* „18 von 40 im Plus" muss man umrechnen — als geteilter
                    Balken ist das Verhältnis unmittelbar sichtbar. */}
                <div className="mt-2.5">
                  <RatioBar up={breite.up} total={breite.total} />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-600">{breite.up}/{breite.total} im Plus (30T)</p>
              </div>

              {/* Marktstimmung */}
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10">
                    <Activity size={11} className="text-amber-400" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Stimmung</span>
                </div>
                <span className={`block h-5 w-5 rounded-full ${sentiment.dotClass}`} aria-hidden />
                <p className="mt-1.5 text-[10px] text-slate-400 font-semibold">{sentiment.label}</p>
              </div>

              {/* Fear & Greed */}
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-500/10">
                    <Zap size={11} className="text-rose-400" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Fear &amp; Greed</span>
                </div>
                <FearGreedPanel result={fg} />
              </div>
            </div>

            {/* DATENABDECKUNG — bewusst UNTER den Kennzahlen und optisch ruhiger.
                Sie beantwortet eine andere Frage als die Kacheln darüber: nicht
                „wie steht der Markt", sondern „worauf schaut diese Seite
                überhaupt". Ohne diese Zeile las sich die Stichprobe des Index
                wie der gesamte Datenbestand. */}
            {abdeckung && (
              <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-600">
                <span className="font-bold uppercase tracking-widest text-slate-700">Datenabdeckung</span>
                {' · '}
                {abdeckung.cards.toLocaleString('de-DE')} Karten
                {/* Die Set-Zahl entfällt, wenn sie gerade nicht ermittelbar war
                    — eine 0 wäre hier eine Behauptung, keine Messung. */}
                {abdeckung.sets !== null && (
                  <>
                    {' · '}
                    {abdeckung.sets.toLocaleString('de-DE')} Sets
                  </>
                )}
                {' · '}
                {abdeckung.pricePoints.toLocaleString('de-DE')} gespeicherte Preispunkte
                <br />
                <span className="text-slate-700">
                  Die Kennzahlen oben nutzen davon jeweils die Karten, für die der
                  betrachtete Zeitraum vollständig gemessen ist.
                </span>
              </p>
            )}
          </section>
        )}

        {/* ── WINNERS & LOSERS ────────────────────────────────────────────── */}
        {hasData && (gainers.length > 0 || losers.length > 0) && (
          <section aria-label="Top Gewinner und Verlierer">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Marktbewegungen · 30 Tage</span>
              <span className="h-px flex-1 bg-[#1e1e30]" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* Gainers */}
              {gainers.length > 0 && (
                <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-[#1e1e30] px-4 py-3">
                    <TrendingUp size={13} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">Top Gewinner</span>
                  </div>
                  <div className="divide-y divide-[#1e1e30]">
                    {gainers.map((card, i) => {
                      const price = card.prices.market;
                      const up = (card.trendPercent ?? 0) >= 0;
                      return (
                        <Link
                          key={card.id}
                          href={`/karten/${card.id}`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a28] active:bg-[#20202e] transition-colors group"
                        >
                          <span className="w-4 shrink-0 text-[10px] text-slate-700 tabular-nums">{i + 1}</span>
                          {card.imageUrl && (
                            <img
                              src={cachedImg(card.imageUrl)}
                              alt={card.nameDe ?? card.name}
                              width={28}
                              height={39}
                              className="shrink-0 rounded object-contain"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                              {card.nameDe ?? card.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-600">{card.set}</p>
                          </div>
                          {card.priceHistory && card.priceHistory.length >= 2 && (
                            <div className="shrink-0">
                              <Sparkline history={card.priceHistory} up={up} w={60} h={22} />
                            </div>
                          )}
                          <div className="shrink-0 text-right">
                            {price != null && price > 0 && (
                              <p className="text-[11px] font-mono text-slate-400">{fmt(price)}</p>
                            )}
                            <p className="text-xs font-bold text-emerald-400 tabular-nums">
                              {fmtPct(card.trendPercent)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Losers */}
              {losers.length > 0 && (
                <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-[#1e1e30] px-4 py-3">
                    <TrendingDown size={13} className="text-rose-400" />
                    <span className="text-xs font-bold text-rose-400">Top Verlierer</span>
                  </div>
                  <div className="divide-y divide-[#1e1e30]">
                    {losers.map((card, i) => {
                      const price = card.prices.market;
                      const up = (card.trendPercent ?? 0) >= 0;
                      return (
                        <Link
                          key={card.id}
                          href={`/karten/${card.id}`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a28] active:bg-[#20202e] transition-colors group"
                        >
                          <span className="w-4 shrink-0 text-[10px] text-slate-700 tabular-nums">{i + 1}</span>
                          {card.imageUrl && (
                            <img
                              src={cachedImg(card.imageUrl)}
                              alt={card.nameDe ?? card.name}
                              width={28}
                              height={39}
                              className="shrink-0 rounded object-contain"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                              {card.nameDe ?? card.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-600">{card.set}</p>
                          </div>
                          {card.priceHistory && card.priceHistory.length >= 2 && (
                            <div className="shrink-0">
                              <Sparkline history={card.priceHistory} up={up} w={60} h={22} />
                            </div>
                          )}
                          <div className="shrink-0 text-right">
                            {price != null && price > 0 && (
                              <p className="text-[11px] font-mono text-slate-400">{fmt(price)}</p>
                            )}
                            <p className="text-xs font-bold text-rose-400 tabular-nums">
                              {fmtPct(card.trendPercent)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── TRENDING TABLE ──────────────────────────────────────────────── */}
        {hasData && trendingTable.length > 0 && (
          <section aria-label="Trending Karten">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Trending Karten
                </span>
                <span className="h-px w-8 bg-[#1e1e30]" />
              </div>
              <Link
                href="/suche"
                className="inline-flex min-h-[32px] items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-400"
              >
                Alle Karten <ArrowRight size={11} />
              </Link>
            </div>
            <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 border-b border-[#1e1e30] px-4 py-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">#</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">Karte</span>
                <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-slate-700 text-right">Seltenheit</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700 text-right">Preis</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700 text-right">30T %</span>
              </div>
              <div className="divide-y divide-[#1a1a28]">
                {trendingTable.map((card, i) => {
                  const price = card.prices.market;
                  const up = (card.trendPercent ?? 0) >= 0;
                  return (
                    <Link
                      key={card.id}
                      href={`/karten/${card.id}`}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-3 px-4 py-2.5 hover:bg-[#1a1a28] active:bg-[#20202e] transition-colors group"
                    >
                      <span className="w-5 text-[10px] text-slate-700 tabular-nums">{i + 1}</span>
                      <div className="flex min-w-0 items-center gap-2.5">
                        {card.imageUrl && (
                          <img
                            src={cachedImg(card.imageUrl)}
                            alt={card.nameDe ?? card.name}
                            width={24}
                            height={33}
                            className="shrink-0 rounded object-contain"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-200 group-hover:text-white leading-tight">
                            {card.nameDe ?? card.name}
                          </p>
                          <p className="truncate text-[10px] text-slate-600 leading-tight">{card.set}</p>
                        </div>
                      </div>
                      <span className="hidden sm:block truncate max-w-[100px] text-[10px] text-slate-600 text-right">
                        {card.rarity === 'Special Illustration Rare' ? 'SIR' : card.rarity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 text-right tabular-nums">
                        {price != null && price > 0 ? fmt(price) : '–'}
                      </span>
                      <span
                        className={`text-xs font-bold text-right tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {fmtPct(card.trendPercent)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── INVESTOR INSIGHTS ───────────────────────────────────────────── */}
        {hasData && insights.length > 0 && (
          <section aria-label="Markt-Insights">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Markt-Insights
              </span>
              <span className="h-px flex-1 bg-[#1e1e30]" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {insights.map((insight, i) => {
                const tonFarbe =
                  insight.ton === 'up'
                    ? 'text-emerald-400'
                    : insight.ton === 'down'
                      ? 'text-rose-400'
                      : 'text-violet-400';
                const inhalt = (
                  <>
                    {insight.imageUrl ? (
                      <div className="aspect-[63/88] w-12 shrink-0 overflow-hidden rounded-lg border border-[#2a2a3a] bg-gradient-to-b from-[#1a1a28] to-[#0a0a0f] shadow-md shadow-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cachedImg(insight.imageUrl)}
                          alt={insight.titel}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : insight.setCode ? (
                      <div className="flex w-12 shrink-0 items-center justify-center">
                        <BoosterPackImage
                          setCode={insight.setCode}
                          setName={insight.setName ?? ''}
                          className="h-10 w-12 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                        <Activity size={18} className="text-violet-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-lg font-black leading-none tabular-nums ${tonFarbe}`}>
                        {insight.kennzahl}
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-200">{insight.titel}</p>
                      <p className="mt-1 text-[11px] leading-snug text-slate-500">{insight.text}</p>
                    </div>
                  </>
                );
                const klassen =
                  'flex items-start gap-3 rounded-2xl border border-[#2a2a3a] bg-gradient-to-b from-[#16161f] to-[#101018] p-4 transition-colors';
                return insight.href ? (
                  <Link key={i} href={insight.href} className={`${klassen} hover:border-violet-500/30`}>
                    {inhalt}
                  </Link>
                ) : (
                  <div key={i} className={klassen}>
                    {inhalt}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-slate-700">
              Alle Insights sind aus Cardmarket-Daten abgeleitet. Keine Anlageberatung.
            </p>
          </section>
        )}

        {/* ── TOP SETS ────────────────────────────────────────────────────── */}
        {hasData && (
          <section aria-label="Top Sets">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Top Sets</span>
              <span className="h-px flex-1 bg-[#1e1e30]" />
            </div>
            {topSets.length === 0 ? (
              /* Eine Rangliste aus Sets mit ein bis zwei Karten ist keine
                 Rangliste, sondern eine Preisliste einzelner Karten. Dann
                 lieber nichts behaupten. */
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] px-4 py-5 text-center">
                <p className="text-xs font-semibold text-slate-300">
                  Noch nicht genügend Daten für ein belastbares Set-Ranking.
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Ein Set erscheint hier ab {MIN_SET_SAMPLE} auswertbaren Karten.
                </p>
              </div>
            ) : (
            <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-[#1e1e30] px-4 py-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">Set</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700 text-right">Karten</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700 text-right">Ø Preis</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700 text-right">Ø Trend</span>
              </div>
              <div className="divide-y divide-[#1a1a28]">
                {topSets.map((s, i) => {
                  const up = s.avgTrend >= 0;
                  // Anteil am teuersten Set — macht aus einer Zahlenspalte eine
                  // Rangfolge, die man auf einen Blick erfasst.
                  const anteil = maxSetPreis > 0 ? (s.medianPrice / maxSetPreis) * 100 : 0;
                  return (
                    <Link
                      key={s.code}
                      href={`/sets/${s.code}`}
                      className="group grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-[#1a1a28]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="w-4 shrink-0 text-[10px] tabular-nums text-slate-700">{i + 1}</span>
                        {/* Das Set-Bild fehlte hier komplett — eine Liste aus
                            Set-Namen ohne jedes Bild ist genau das, was die
                            Regel „Boosterpack-Bild überall" verhindern soll. */}
                        <BoosterPackImage
                          setCode={s.code}
                          setName={s.name}
                          className="h-7 w-10 shrink-0 object-contain opacity-90 transition-opacity group-hover:opacity-100"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-300 transition-colors group-hover:text-white">
                            {s.name}
                          </p>
                          <div className="mt-1 max-w-[110px]">
                            <RowBar pct={anteil} tone={up ? 'up' : 'down'} delay={i * 80} />
                          </div>
                        </div>
                      </div>
                      <span className="text-right text-[11px] tabular-nums text-slate-600">{s.count}</span>
                      <span className="text-right text-[11px] font-mono tabular-nums text-slate-400">{fmt(s.medianPrice)}</span>
                      <span className={`text-right text-xs font-bold tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtPct(s.avgTrend)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
            )}
          </section>
        )}

        {/* ── EINSTIEG INS PORTFOLIO ──────────────────────────────────────── */}
        {/* Letzter Schritt der Produktlogik: entdecken → analysieren → sammeln
            → verfolgen. Ohne diesen Einstieg endet die Startseite bei der
            Analyse, und das Portfolio findet nur, wer die Navigation durchsucht. */}
        <section aria-label="Portfolio">
          <Link
            href="/portfolio"
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 transition-colors hover:border-violet-500/40"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-600/15 to-transparent"
            />
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <BarChart2 size={20} />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="text-sm font-black text-white">Eigene Sammlung verfolgen</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-400">
                Karten eintragen und Wert, Entwicklung und stärkste Positionen im Blick behalten —
                ohne Anmeldung.
              </p>
            </div>
            <ArrowRight
              size={16}
              className="relative shrink-0 text-slate-600 transition-colors group-hover:text-violet-400"
            />
          </Link>
        </section>

        {/* ── BLOG TEASER ─────────────────────────────────────────────────── */}
        <section aria-label="Blog">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Analyse &amp; Blog</span>
              <span className="h-px w-8 bg-[#1e1e30]" />
            </div>
            <Link
              href="/artikel"
              className="inline-flex min-h-[32px] items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-400"
            >
              Alle Artikel <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: 'refresh', label: 'Wochenrückblick', sub: 'Jeden Sonntag', href: '/artikel' },
              { icon: 'card', label: 'Karte im Fokus', sub: 'Jeden Donnerstag', href: '/artikel' },
              { icon: 'trending', label: 'Marktanalyse', sub: 'Jeden Donnerstag', href: '/artikel' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4 transition-all hover:border-violet-500/30 hover:bg-[#1a1a28]"
              >
                <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <ContentIcon name={item.icon} size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-600">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── GUIDES ──────────────────────────────────────────────────────── */}
        <section aria-label="Guides">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={12} className="text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Experten-Guides</span>
              <span className="h-px w-8 bg-[#1e1e30]" />
            </div>
            <Link
              href="/guides"
              className="inline-flex min-h-[32px] items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-400"
            >
              Alle Guides <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GUIDES.slice(0, 4).map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4 transition-all hover:border-violet-500/30 hover:bg-[#1a1a28]"
              >
                <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <ContentIcon name={guide.icon} size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug line-clamp-2">
                    {guide.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-violet-500">{guide.badge}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── AFFILIATE ───────────────────────────────────────────────────── */}
        <section aria-label="Partner" className="border-t border-[#1e1e30] pt-6">
          <AffiliateBar />
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="space-y-4 border-t border-[#1e1e30] pt-6">
          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center space-y-1">
            <p className="text-xs font-bold text-amber-400/80">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[11px] text-amber-400/60 leading-relaxed">
              Pokémon und alle zugehörigen Namen sind Marken von Nintendo, Creatures Inc. und GAME FREAK.
              Diese Seite steht in keiner Verbindung zu diesen Unternehmen.
            </p>
            <p className="text-[11px] text-amber-400/60">
              Alle Inhalte dienen ausschließlich der Information —{' '}
              <strong className="text-amber-400/80">keine Anlageberatung</strong>.
              Preisangaben (Cardmarket, EUR) ohne Gewähr.
            </p>
          </div>
          <p className="text-center text-[11px] text-slate-700">
            Affiliate-Links: Bei Käufen über unsere Links erhalten wir eine kleine Provision.
          </p>
        </footer>
      </main>
    </div>
  );
}
