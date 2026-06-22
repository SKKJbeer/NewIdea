'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Plus, Trash2, Loader2,
  BarChart3, Search, X, Check,
} from 'lucide-react';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { NavBar } from '@/components/NavBar';

interface PortfolioHolding {
  cardId: string;
  cardName: string;
  setName: string;
  setCode: string;
  imageUrl: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  addedAt: string;
}

interface LiveCard {
  price: number;
  priceHistory: Array<{ date: string; price: number }>;
  name: string;
  set: string;
  setCode: string;
  imageUrl: string;
}

interface Suggestion {
  id: string;
  name: string;
  nameDe?: string;
  imageUrl: string;
  price: number;
  set: string;
}

const STORAGE_KEY = 'portfolio_v1';

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });
}

function setCodeFromId(cardId: string) {
  const parts = cardId.split('-');
  return parts.slice(0, -1).join('-');
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [liveData, setLiveData] = useState<Record<string, LiveCard>>({});
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [editTarget, setEditTarget] = useState<PortfolioHolding | null>(null);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');

  // Load portfolio from localStorage after mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHoldings(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch live prices whenever holdings change
  useEffect(() => {
    if (!mounted || holdings.length === 0) { setLiveData({}); return; }
    const ids = holdings.map((h) => h.cardId);
    setLoading(true);
    fetch('/api/portfolio/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds: ids }),
    })
      .then((r) => r.json())
      .then((data) => setLiveData(data as Record<string, LiveCard>))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mounted, holdings.length]);

  function saveHoldings(h: PortfolioHolding[]) {
    setHoldings(h);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch {}
  }

  function removeHolding(cardId: string) {
    saveHoldings(holdings.filter((h) => h.cardId !== cardId));
  }

  function resetPortfolio() {
    saveHoldings([]);
    setShowReset(false);
  }

  function saveEdit(updated: PortfolioHolding) {
    saveHoldings(holdings.map((h) => h.cardId === updated.cardId ? updated : h));
    setEditTarget(null);
  }

  function livePrice(cardId: string, fallback: number) {
    return liveData[cardId]?.price || fallback;
  }

  // ── Portfolio aggregates ──
  const totalCost  = holdings.reduce((s, h) => s + h.purchasePrice * h.quantity, 0);
  const totalValue = holdings.reduce((s, h) => s + livePrice(h.cardId, h.purchasePrice) * h.quantity, 0);
  const totalPnL   = totalValue - totalCost;
  const pnlPct     = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const isUp       = totalPnL >= 0;
  const lineColor  = isUp ? '#16a34a' : '#dc2626';

  // ── Chart data (aggregate price history across all holdings) ──
  const allChartData = useMemo(() => {
    if (holdings.length === 0) return [];

    const dateMap = new Map<string, number>();
    holdings.forEach((h) => {
      const hist = liveData[h.cardId]?.priceHistory ?? [];
      hist.forEach(({ date, price }) => {
        // Only count from the purchase date onwards — before that the card wasn't owned
        if (h.purchaseDate && date < h.purchaseDate) return;
        dateMap.set(date, (dateMap.get(date) ?? 0) + price * h.quantity);
      });
    });

    if (dateMap.size === 0) return [];

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }));
  }, [holdings, liveData]);

  const RANGE_DAYS: Record<typeof timeRange, number> = { '1D': 2, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 };

  const chartData = useMemo(
    () => allChartData.slice(-RANGE_DAYS[timeRange]),
    [allChartData, timeRange]
  );

  // ── Not yet mounted (SSR) ──
  if (!mounted) return <div className="min-h-screen bg-white" />;

  // ── Empty state ──
  if (holdings.length === 0 && !showAdd) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <EmptyState onAdd={() => setShowAdd(true)} />
        {showAdd && (
          <AddCardModal holdings={holdings} onAdd={saveHoldings} onClose={() => setShowAdd(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* ── Hero: total value + chart ── */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">

          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mein Portfolio</p>
            <div className="flex items-center gap-2">
              {loading && <Loader2 size={13} className="animate-spin text-gray-300" />}
              <button
                onClick={() => setShowReset(true)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Portfolio zurücksetzen"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={12} /> Karte
              </button>
            </div>
          </div>

          {/* Total value */}
          <p className="text-[42px] leading-none font-black text-gray-900 tabular-nums mb-2">
            {formatEur(totalValue)}
          </p>

          {/* P&L */}
          <div className="flex items-center gap-2 mb-0.5">
            {isUp
              ? <TrendingUp size={16} className="text-green-600 shrink-0" />
              : <TrendingDown size={16} className="text-red-500 shrink-0" />}
            <span className={`text-base font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
              {isUp ? '+' : ''}{formatEur(totalPnL)}
            </span>
            <span className={`text-sm font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
              ({isUp ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-6">
            seit Kauf · Einstand {formatEur(totalCost)}
          </p>

          {/* Chart */}
          {chartData.length >= 2 ? (
            <div className="mb-4 -mx-1">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={lineColor} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v.toFixed(0)}€`}
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tickCount={4}
                    domain={['auto', 'auto']}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                      fontSize: 12,
                      padding: '8px 14px',
                    }}
                    formatter={(val) => [formatEur(Number(val ?? 0)), 'Portfolio']}
                    labelFormatter={(label) =>
                      new Date(String(label) + 'T00:00:00').toLocaleDateString('de-DE', {
                        weekday: 'short', day: '2-digit', month: 'long',
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={lineColor}
                    strokeWidth={2}
                    fill="url(#portGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            loading && holdings.length > 0 ? (
              <div className="h-32 flex items-center justify-center mb-4">
                <Loader2 size={18} className="animate-spin text-gray-300" />
              </div>
            ) : null
          )}

          {/* Time-range pills */}
          <div className="flex gap-1">
            {(['1D', '1W', '1M', '3M', '1Y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  timeRange === r
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Holdings list ── */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Positionen{' '}
            <span className="text-gray-400 font-normal">({holdings.length})</span>
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {[...holdings]
            .sort((a, b) =>
              livePrice(b.cardId, b.purchasePrice) * b.quantity -
              livePrice(a.cardId, a.purchasePrice) * a.quantity
            )
            .map((h) => {
              const price = livePrice(h.cardId, h.purchasePrice);
              const value = price * h.quantity;
              const cost  = h.purchasePrice * h.quantity;
              const pnl   = value - cost;
              const pct   = cost > 0 ? (pnl / cost) * 100 : 0;
              const pos   = pnl >= 0;
              const sc    = h.setCode || setCodeFromId(h.cardId);

              return (
                <div
                  key={h.cardId}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/70 transition-colors group cursor-pointer"
                  onClick={() => setEditTarget(h)}
                >
                  {/* Card image */}
                  <div className="shrink-0">
                    <img
                      src={h.imageUrl}
                      alt={h.cardName}
                      className="h-16 w-12 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>

                  {/* Name + set + info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{h.cardName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <BoosterPackImage setCode={sc} setName={h.setName} className="h-4 w-auto" />
                      <span className="text-xs text-gray-400">{h.setName}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {h.quantity}× · à {formatEur(h.purchasePrice)}
                      {h.purchaseDate ? ` · ${new Date(h.purchaseDate + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}` : ''}
                    </p>
                  </div>

                  {/* Value + P&L */}
                  <div className="text-right shrink-0 mr-1">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{formatEur(value)}</p>
                    <p className={`text-xs font-semibold tabular-nums ${pos ? 'text-green-600' : 'text-red-500'}`}>
                      {pos ? '+' : ''}{formatEur(pnl)}
                    </p>
                    <p className={`text-[10px] font-semibold tabular-nums ${pos ? 'text-green-500' : 'text-red-400'}`}>
                      {pos ? '+' : ''}{pct.toFixed(1)}%
                    </p>
                  </div>

                  {/* Delete — stopPropagation so it doesn't open the edit modal */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeHolding(h.cardId); }}
                    className="p-1.5 rounded-lg text-gray-200 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="Entfernen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
        </div>

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Einstand',       value: formatEur(totalCost) },
            { label: 'Positionen',     value: String(holdings.length) },
            { label: 'Karten gesamt',  value: String(holdings.reduce((s, h) => s + h.quantity, 0)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">{label}</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-300 text-center mt-6 leading-relaxed">
          Daten werden lokal in deinem Browser gespeichert · Keine Anlageberatung · Preise ohne Gewähr
        </p>
      </div>

      {showAdd && (
        <AddCardModal holdings={holdings} onAdd={saveHoldings} onClose={() => setShowAdd(false)} />
      )}

      {editTarget && (
        <EditCardModal
          holding={editTarget}
          onSave={saveEdit}
          onRemove={(id) => { removeHolding(id); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReset(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl z-10 p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">Portfolio zurücksetzen?</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Alle {holdings.length} Position{holdings.length !== 1 ? 'en werden' : ' wird'} unwiderruflich gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={resetPortfolio}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Alles löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-100 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
          <BarChart3 size={32} className="text-violet-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Dein Portfolio wartet</h2>
        <p className="text-sm text-gray-400 max-w-xs mb-2 leading-relaxed">
          Trag deine Pokémon-Karten ein und verfolge ihren Marktwert — täglich aktuell, wie bei einer Aktien-App.
        </p>
        <ul className="text-xs text-gray-400 mb-8 space-y-1">
          <li>📈 Kursverlauf der letzten 30 Tage</li>
          <li>💶 Unrealisierter Gewinn/Verlust</li>
          <li>🔒 Alles lokal gespeichert, kein Login nötig</li>
        </ul>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 py-3.5 rounded-2xl transition-colors shadow-sm shadow-violet-200"
        >
          <Plus size={17} /> Erste Karte hinzufügen
        </button>
      </div>
    </div>
  );
}

// ─── Add card modal ───────────────────────────────────────────────────────────

function AddCardModal({
  holdings,
  onAdd,
  onClose,
}: {
  holdings: PortfolioHolding[];
  onAdd: (h: PortfolioHolding[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching]   = useState(false);
  const [selected, setSelected]     = useState<Suggestion | null>(null);
  const [qty, setQty]               = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate]   = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await r.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
      setSearching(false);
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  function selectCard(s: Suggestion) {
    setSelected(s);
    setPurchasePrice(s.price > 0 ? s.price.toFixed(2) : '');
    setQty(1);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setSuggestions([]);
    setQuery('');
  }

  function confirm() {
    if (!selected) return;
    const sc = setCodeFromId(selected.id);
    const holding: PortfolioHolding = {
      cardId: selected.id,
      cardName: selected.nameDe || selected.name,
      setName: selected.set,
      setCode: sc,
      imageUrl: selected.imageUrl,
      quantity: qty,
      purchasePrice: parseFloat(purchasePrice) || selected.price || 0,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      addedAt: new Date().toISOString().split('T')[0],
    };
    const existing = holdings.find((h) => h.cardId === selected.id);
    const updated = existing
      ? holdings.map((h) => h.cardId === selected.id ? { ...h, quantity: h.quantity + qty } : h)
      : [...holdings, holding];
    onAdd(updated);
    onClose();
  }

  const total = purchasePrice && qty > 0
    ? parseFloat(purchasePrice) * qty
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-base">Karte hinzufügen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Search input */}
          {!selected && (
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kartenname — z.B. Charizard oder Glurak"
                className="w-full pl-10 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              {searching
                ? <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                : query.length > 0
                  ? <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"><X size={14} /></button>
                  : null
              }
            </div>
          )}

          {/* Suggestions */}
          {!selected && suggestions.length > 0 && (
            <div className="-mx-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 mb-1.5">
                {suggestions.length} Karte{suggestions.length !== 1 ? 'n' : ''} gefunden
              </p>
              <div className="space-y-0.5 max-h-72 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectCard(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-violet-50 transition-colors text-left group"
                >
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="h-12 w-9 object-contain rounded shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-violet-800">
                      {s.nameDe || s.name}
                    </p>
                    <p className="text-xs text-gray-400">{s.set}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {s.price > 0 ? (
                      <p className="text-sm font-bold text-gray-900">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(s.price)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-300">kein Preis</p>
                    )}
                  </div>
                </button>
              ))}
              </div>
            </div>
          )}

          {/* Empty search states */}
          {!selected && query.length >= 2 && !searching && suggestions.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">Keine Karten gefunden</p>
          )}
          {!selected && query.length < 2 && (
            <p className="text-center text-xs text-gray-400 py-4">
              Mind. 2 Zeichen eingeben
            </p>
          )}

          {/* Selected card configuration */}
          {selected && (
            <div className="space-y-4">
              {/* Card preview */}
              <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-2xl">
                <img
                  src={selected.imageUrl}
                  alt={selected.name}
                  className="h-20 w-14 object-contain rounded-lg shrink-0 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{selected.nameDe || selected.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <BoosterPackImage
                      setCode={setCodeFromId(selected.id)}
                      setName={selected.set}
                      className="h-5 w-auto"
                    />
                    <p className="text-xs text-gray-500">{selected.set}</p>
                  </div>
                  {selected.price > 0 && (
                    <p className="text-xs font-bold text-violet-700 mt-1.5">
                      Aktuell {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(selected.price)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 self-start"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quantity + purchase price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">Anzahl</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors text-base"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center text-sm font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:border-violet-400"
                    />
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors text-base"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">Kaufpreis/Stk (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              {/* Purchase date */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Kaufdatum</label>
                <input
                  type="date"
                  value={purchaseDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 text-gray-700"
                />
              </div>

              {/* Total */}
              {total !== null && !isNaN(total) && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-xs text-gray-500 font-semibold">Gesamteinstand</span>
                  <span className="text-base font-black text-gray-900 tabular-nums">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(total)}
                  </span>
                </div>
              )}

              <button
                onClick={confirm}
                disabled={!purchasePrice || parseFloat(purchasePrice) <= 0}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <Check size={16} />
                {holdings.find((h) => h.cardId === selected.id)
                  ? 'Anzahl erhöhen'
                  : 'Zum Portfolio hinzufügen'}
              </button>

              <p className="text-[10px] text-gray-300 text-center">
                Kaufpreis wird für die Gewinn/Verlust-Berechnung verwendet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit card modal ──────────────────────────────────────────────────────────

function EditCardModal({
  holding,
  onSave,
  onRemove,
  onClose,
}: {
  holding: PortfolioHolding;
  onSave: (updated: PortfolioHolding) => void;
  onRemove: (cardId: string) => void;
  onClose: () => void;
}) {
  const [qty, setQty]                   = useState(holding.quantity);
  const [purchasePrice, setPurchasePrice] = useState(holding.purchasePrice.toFixed(2));
  const [purchaseDate, setPurchaseDate]   = useState(holding.purchaseDate || '');

  const sc = holding.setCode || setCodeFromId(holding.cardId);
  const total = parseFloat(purchasePrice) * qty;

  function save() {
    onSave({
      ...holding,
      quantity: qty,
      purchasePrice: parseFloat(purchasePrice) || holding.purchasePrice,
      purchaseDate: purchaseDate || holding.purchaseDate,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-base">Position bearbeiten</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Card preview */}
          <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-2xl">
            <img
              src={holding.imageUrl}
              alt={holding.cardName}
              className="h-20 w-14 object-contain rounded-lg shrink-0 shadow-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">{holding.cardName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <BoosterPackImage setCode={sc} setName={holding.setName} className="h-5 w-auto" />
                <p className="text-xs text-gray-500">{holding.setName}</p>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Anzahl</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors text-base"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center text-sm font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:border-violet-400"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors text-base"
              >
                +
              </button>
            </div>
          </div>

          {/* Purchase price */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Kaufpreis/Stk (€)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400"
            />
          </div>

          {/* Purchase date */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Kaufdatum</label>
            <input
              type="date"
              value={purchaseDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 text-gray-700"
            />
          </div>

          {/* Total */}
          {!isNaN(total) && total > 0 && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xs text-gray-500 font-semibold">Gesamteinstand</span>
              <span className="text-base font-black text-gray-900 tabular-nums">{formatEur(total)}</span>
            </div>
          )}

          {/* Save */}
          <button
            onClick={save}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={16} /> Speichern
          </button>

          {/* Remove */}
          <button
            onClick={() => onRemove(holding.cardId)}
            className="w-full py-3 text-red-500 hover:text-red-600 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={14} /> Karte entfernen
          </button>
        </div>
      </div>
    </div>
  );
}
