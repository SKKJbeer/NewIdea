import { getHomepageCards } from '@/lib/homepage-data';
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

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pokémon Kartenmarkt in Echtzeit — PokéMarket Intelligence',
  description:
    'Echtzeit-Preise von Cardmarket für Pokémon-Sammelkarten. Marktindex, Top-Gewinner, Verlierer und Investment-Scores täglich aktualisiert.',
  keywords: [
    'Pokémon Karten Preis',
    'Pokémon TCG Markt',
    'Cardmarket Pokémon',
    'Pokémon Investment',
    'Pokémon Karten Wert',
    'Charizard Preis',
    'seltene Pokémon Karten',
  ],
  openGraph: {
    title: 'Pokémon Kartenmarkt in Echtzeit — PokéMarket Intelligence',
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

// --- Fear & Greed meter display ---
function FearGreedBar({ value }: { value: number }) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  let label: string;
  let color: string;
  if (pct >= 75) { label = 'Extreme Gier'; color = '#34d399'; }
  else if (pct >= 60) { label = 'Gier'; color = '#86efac'; }
  else if (pct >= 40) { label = 'Neutral'; color = '#fbbf24'; }
  else if (pct >= 25) { label = 'Angst'; color = '#fb7185'; }
  else { label = 'Extreme Angst'; color = '#ef4444'; }
  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <span className="text-2xl font-black tabular-nums leading-none" style={{ color }}>{pct}</span>
        <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#2a2a3a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: `linear-gradient(to right, #ef4444, #fbbf24, #34d399)` }}
        />
      </div>
    </div>
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
  const cards = await getHomepageCards(50);

  // Ohne Kartendaten KEINE erfundene Marktlage: Die Kennzahlen unten (PMI,
  // Marktbreite, Fear & Greed) würden aus einem leeren Datensatz trotzdem
  // Werte erzeugen — ein Sentiment, das auf nichts beruht. Das verstößt gegen
  // die Wahrheitspflicht (CLAUDE.md → Preise: absolute Wahrheitspflicht).
  // Stattdessen ein ehrlicher Zustand statt einer stumm leeren Seite.
  if (cards.length === 0) {
    return <ApiErrorState backHref="/suche" backLabel="Zur Kartensuche" />;
  }

  // --- Derived metrics ---
  const withTrend = cards.filter((c) => typeof c.trendPercent === 'number');
  const gainers = [...withTrend]
    .sort((a, b) => (b.trendPercent ?? 0) - (a.trendPercent ?? 0))
    .slice(0, 8);
  const losers = [...withTrend]
    .sort((a, b) => (a.trendPercent ?? 0) - (b.trendPercent ?? 0))
    .slice(0, 8);

  const gainCount = withTrend.filter((c) => (c.trendPercent ?? 0) > 0).length;
  const breadthPct = withTrend.length > 0 ? (gainCount / withTrend.length) * 100 : 50;

  // PMI = price-weighted average trend
  let pmiNum = 0;
  if (withTrend.length > 0) {
    let weightSum = 0;
    let trendSum = 0;
    for (const c of withTrend) {
      const w = c.prices.market || 1;
      trendSum += (c.trendPercent ?? 0) * w;
      weightSum += w;
    }
    pmiNum = weightSum > 0 ? trendSum / weightSum : 0;
  }

  // Fear & Greed = composite: breadth (60%) + PMI momentum (40%)
  const momentumScore = Math.min(100, Math.max(0, ((pmiNum + 15) / 30) * 100));
  const fearGreed = Math.round(breadthPct * 0.6 + momentumScore * 0.4);

  const sentiment =
    fearGreed >= 65 ? { label: 'Bullish', dotClass: 'bg-emerald-400' }
    : fearGreed >= 40 ? { label: 'Neutral', dotClass: 'bg-amber-400' }
    : { label: 'Bearish', dotClass: 'bg-rose-400' };

  // Ticker: top 10 gainers + losers interleaved
  const tickerCards = withTrend
    .sort((a, b) => Math.abs(b.trendPercent ?? 0) - Math.abs(a.trendPercent ?? 0))
    .slice(0, 14);

  // Top 10 trending by absolute trend magnitude (all directions)
  const trendingTable = [...withTrend]
    .sort((a, b) => Math.abs(b.trendPercent ?? 0) - Math.abs(a.trendPercent ?? 0))
    .slice(0, 10);

  // Top Sets aggregated from card data
  const setMap = new Map<string, { name: string; count: number; totalPrice: number; totalTrend: number; trendCount: number }>();
  for (const card of cards) {
    const prev = setMap.get(card.setCode) ?? {
      name: card.set,
      count: 0,
      totalPrice: 0,
      totalTrend: 0,
      trendCount: 0,
    };
    const price = card.prices.market ?? 0;
    prev.count++;
    prev.totalPrice += price;
    if (typeof card.trendPercent === 'number') {
      prev.totalTrend += card.trendPercent;
      prev.trendCount++;
    }
    setMap.set(card.setCode, prev);
  }
  const topSets = [...setMap.entries()]
    .map(([code, d]) => ({
      code,
      name: d.name,
      count: d.count,
      avgPrice: d.count > 0 ? d.totalPrice / d.count : 0,
      avgTrend: d.trendCount > 0 ? d.totalTrend / d.trendCount : 0,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 5);
  // Maßstab für die Anteilsbalken in der Set-Tabelle.
  const maxSetPreis = Math.max(...topSets.map((s) => s.avgPrice), 0);

  // Investor Insights — ausschließlich abgeleitet, nichts erfunden.
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
  if (withTrend.length > 0) {
    const positiv = gainCount > withTrend.length / 2;
    insights.push({
      kennzahl: formatPercent(breadthPct, { withSign: false, digits: 0 }),
      titel: positiv ? 'Marktbreite positiv' : 'Marktbreite negativ',
      text: `${gainCount} von ${withTrend.length} analysierten Karten notieren über ihrem 30-Tages-Schnitt.`,
      ton: positiv ? 'up' : 'down',
    });
  }
  if (topSets[0]) {
    insights.push({
      kennzahl: formatEurRounded(topSets[0].avgPrice),
      titel: topSets[0].name,
      text: `Stärkstes Set nach Durchschnittspreis — ${topSets[0].count} Karten im Datensatz.`,
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
          <p className="mb-6 text-xl font-black text-violet-400 sm:text-3xl">in Echtzeit</p>
          <p className="mb-6 text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Preise · Trends · Investment-Scores — aus echten Cardmarket-Daten
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
              const up = (card.trendPercent ?? 0) >= 0;
              const price = card.prices.market;
              return (
                <Link
                  key={card.id}
                  href={`/karten/${card.id}`}
                  className="flex items-center gap-2 shrink-0 group"
                >
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors truncate max-w-[120px]">
                    {card.nameDe ?? card.name}
                  </span>
                  {price != null && price > 0 && (
                    <span className="text-[11px] font-mono text-slate-300">{fmt(price)}</span>
                  )}
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}
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
                <p
                  className={`text-2xl font-black tabular-nums leading-none ${pmiNum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {formatPercent(pmiNum)}
                </p>
                {/* Ohne Balken ist eine Prozentzahl nur eine Zahl — mit ihm
                    sieht man sofort, ob der Ausschlag klein oder groß ist. */}
                <div className="mt-2.5">
                  <ZeroMeter value={pmiNum} max={10} />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-600">Gewichteter Markttrend</p>
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
                  <RatioBar up={gainCount} total={withTrend.length} />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-600">{gainCount}/{withTrend.length} im Plus (30T)</p>
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
                <FearGreedBar value={fearGreed} />
              </div>
            </div>
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
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-400"
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
          <section aria-label="Investor Insights">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Investor Insights
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
              Alle Insights basieren ausschließlich auf Echtzeit-Cardmarket-Daten. Keine Anlageberatung.
            </p>
          </section>
        )}

        {/* ── TOP SETS ────────────────────────────────────────────────────── */}
        {hasData && topSets.length > 0 && (
          <section aria-label="Top Sets">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Top Sets</span>
              <span className="h-px flex-1 bg-[#1e1e30]" />
            </div>
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
                  const anteil = maxSetPreis > 0 ? (s.avgPrice / maxSetPreis) * 100 : 0;
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
                      <span className="text-right text-[11px] font-mono tabular-nums text-slate-400">{fmt(s.avgPrice)}</span>
                      <span className={`text-right text-xs font-bold tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtPct(s.avgTrend)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── BLOG TEASER ─────────────────────────────────────────────────── */}
        <section aria-label="Blog">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Analyse &amp; Blog</span>
              <span className="h-px w-8 bg-[#1e1e30]" />
            </div>
            <Link
              href="/artikel"
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-400"
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
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-400"
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
