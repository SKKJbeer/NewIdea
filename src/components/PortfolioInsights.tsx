'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Layers, Coins } from 'lucide-react';
import { cachedImg } from '@/lib/cached-image';
import { BoosterPackImage } from './BoosterPackImage';
import { formatEur, formatPercent } from '@/lib/format';
import { RowBar } from './DataBars';
import type { PositionPerformance, SetAllocation } from '@/lib/portfolio';

// AUSWERTUNG DES BESTANDS
//
// Ein Gesamtwert allein beantwortet nicht, WARUM sich die Sammlung so
// entwickelt. Diese drei Blöcke zeigen die Treiber: die stärksten und
// schwächsten Positionen, die größten Posten und die Aufteilung nach Set.
//
// Durchgängig: Positionen ohne geladenen Marktpreis erscheinen NICHT in den
// Ranglisten. Sie würden dort mit 0,0 % stehen — nicht zu unterscheiden von
// einer Karte, die sich tatsächlich nicht bewegt hat.

function PositionsZeile({ p, rang }: { p: PositionPerformance; rang: number }) {
  const up = p.pnl >= 0;
  return (
    <Link
      href={`/karten/${p.holding.cardId}`}
      className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[#1a1a28]"
    >
      <span className="w-3 shrink-0 text-[10px] font-black tabular-nums text-slate-700">{rang}</span>
      <div className="h-[38px] w-7 shrink-0 overflow-hidden rounded-md border border-[#2a2a3a] bg-[#0a0a0f]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cachedImg(p.holding.imageUrl)}
          alt={p.holding.cardName}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-slate-200 transition-colors group-hover:text-white">
          {p.holding.cardName}
        </p>
        <p className="truncate text-[10px] text-slate-600">{p.holding.setName}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-[11px] font-black tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatPercent(p.pnlPct)}
        </p>
        <p className="text-[10px] tabular-nums text-slate-600">
          {up ? '+' : ''}
          {formatEur(p.pnl)}
        </p>
      </div>
    </Link>
  );
}

function Block({
  titel,
  icon,
  children,
}: {
  titel: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-gradient-to-b from-[#16161f] to-[#101018] p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/10 text-violet-400">
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{titel}</p>
      </div>
      {children}
    </div>
  );
}

export function PortfolioInsights({
  winners,
  losers,
  biggest,
  allocation,
}: {
  winners: PositionPerformance[];
  losers: PositionPerformance[];
  biggest: PositionPerformance[];
  allocation: SetAllocation[];
}) {
  const maxWert = Math.max(...allocation.map((a) => a.value), 0);
  const zeigtRanglisten = winners.length > 0 || losers.length > 0;

  if (!zeigtRanglisten && biggest.length === 0) return null;

  return (
    <div className="space-y-3">
      {(winners.length > 0 || losers.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {winners.length > 0 && (
            <Block titel="Stärkste Positionen" icon={<TrendingUp size={11} />}>
              <div className="space-y-0.5">
                {winners.map((p, i) => (
                  <PositionsZeile key={p.holding.cardId} p={p} rang={i + 1} />
                ))}
              </div>
            </Block>
          )}
          {losers.length > 0 && (
            <Block titel="Schwächste Positionen" icon={<TrendingDown size={11} />}>
              <div className="space-y-0.5">
                {losers.map((p, i) => (
                  <PositionsZeile key={p.holding.cardId} p={p} rang={i + 1} />
                ))}
              </div>
            </Block>
          )}
        </div>
      )}

      {biggest.length > 0 && (
        <Block titel="Größte Posten" icon={<Coins size={11} />}>
          <div className="space-y-2.5">
            {biggest.map((p, i) => {
              const anteil = maxWert > 0 ? (p.value / maxWert) * 100 : 0;
              return (
                <div key={p.holding.cardId}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[11px] font-semibold text-slate-300">
                      {p.holding.cardName}
                    </span>
                    <span className="shrink-0 text-[11px] font-black tabular-nums text-white">
                      {formatEur(p.value)}
                    </span>
                  </div>
                  <RowBar pct={anteil} tone={p.pnl >= 0 ? 'up' : 'down'} delay={i * 70} />
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {allocation.length > 1 && (
        <Block titel="Aufteilung nach Set" icon={<Layers size={11} />}>
          <div className="space-y-2.5">
            {allocation.slice(0, 6).map((a, i) => (
              <div key={a.setCode}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <BoosterPackImage
                      setCode={a.setCode}
                      setName={a.setName}
                      className="h-4 w-6 shrink-0 object-contain"
                    />
                    <span className="min-w-0 truncate text-[11px] font-semibold text-slate-300">
                      {a.setName}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] tabular-nums text-slate-600">
                      {formatPercent(a.sharePct, { withSign: false, digits: 0 })}
                    </span>
                    <span
                      className={`text-[11px] font-bold tabular-nums ${a.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {formatPercent(a.pnlPct)}
                    </span>
                  </span>
                </div>
                <RowBar pct={a.sharePct} tone={a.pnlPct >= 0 ? 'up' : 'down'} delay={i * 70} />
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

/**
 * Vergleich der eigenen Entwicklung gegen den Markt.
 *
 * Erscheint nur, wenn BEIDE Seiten eine belastbare Zahl haben. Eine
 * Outperformance gegen einen Index, den es nicht gibt, wäre eine erfundene
 * Aussage.
 */
export function MarketComparison({
  portfolioPct,
  marketPct,
  deltaPoints,
  days,
}: {
  portfolioPct: number;
  marketPct: number;
  deltaPoints: number;
  days: number;
}) {
  const besser = deltaPoints >= 0;
  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-gradient-to-b from-[#16161f] to-[#101018] p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Dein Bestand gegen den Markt · {days} Tage
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-slate-600">Dein Bestand</p>
          <p
            className={`text-sm font-black tabular-nums ${portfolioPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {formatPercent(portfolioPct)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600">Markt (CBI)</p>
          <p
            className={`text-sm font-black tabular-nums ${marketPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {formatPercent(marketPct)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600">Unterschied</p>
          <p className={`text-sm font-black tabular-nums ${besser ? 'text-emerald-400' : 'text-rose-400'}`}>
            {besser ? '+' : ''}
            {Math.round(deltaPoints * 10) / 10} Pp.
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[10px] leading-snug text-slate-600">
        Der Vergleich stellt die Entwicklung deines Bestands dem preisgewichteten Markttrend
        gegenüber. „Pp." steht für Prozentpunkte.
      </p>
    </div>
  );
}
