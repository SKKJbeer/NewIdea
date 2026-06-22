'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, Loader2, BarChart3, Search, X, Check } from 'lucide-react';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { NavBar } from '@/components/NavBar';
import { PortfolioChart } from '@/components/PortfolioChart';
import {
  normalizeHolding, computePnl, computeChartData, filterByRange,
  formatEur, setCodeFromId,
  LANG_FLAG, LANG_LABEL, RANGE_DAYS,
  type PortfolioHolding, type LiveCardData, type CardLanguage,
} from '@/lib/portfolio';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  name: string;
  nameDe?: string;
  imageUrl: string;
  price: number;
  set: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'portfolio_v1';

// ─── Language picker ─────────────────────────────────────────────────────────

function LangPicker({ value, onChange }: { value: CardLanguage; onChange: (l: CardLanguage) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 block mb-2">Sprache der Karte</label>
      <div className="grid grid-cols-4 gap-2">
        {(['EN', 'DE', 'JP', 'KR'] as CardLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-colors ${
              value === lang
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg leading-none">{LANG_FLAG[lang]}</span>
            <span>{lang}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">
        {value !== 'EN'
          ? 'Preis wird von Cardmarket für diese Sprache abgerufen'
          : 'Cardmarket EUR (englische Ausgabe)'}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [mounted,    setMounted]    = useState(false);
  const [holdings,   setHoldings]   = useState<PortfolioHolding[]>([]);
  const [liveData,   setLiveData]   = useState<Record<string, LiveCardData>>({});
  const [loading,    setLoading]    = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [showReset,  setShowReset]  = useState(false);
  const [editTarget, setEditTarget] = useState<PortfolioHolding | null>(null);
  const [timeRange,  setTimeRange]  = useState<keyof typeof RANGE_DAYS>('1M');

  // Load from localStorage after mount (SSR-safe)
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Partial<PortfolioHolding> & { cardId: string }>;
        setHoldings(parsed.map(normalizeHolding));
      }
    } catch {}
  }, []);

  // Fetch live prices whenever holdings change
  useEffect(() => {
    if (!mounted || holdings.length === 0) { setLiveData({}); return; }
    setLoading(true);
    fetch('/api/portfolio/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: holdings.map((h) => ({ id: h.cardId, language: h.language || 'EN', name: h.cardName })),
      }),
    })
      .then((r) => r.json())
      .then((data) => setLiveData(data as Record<string, LiveCardData>))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mounted, holdings.length]);

  function saveHoldings(h: PortfolioHolding[]) {
    setHoldings(h);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch {}
  }

  function removeHolding(cardId: string) { saveHoldings(holdings.filter((h) => h.cardId !== cardId)); }
  function resetPortfolio()              { saveHoldings([]); setShowReset(false); }
  function saveEdit(updated: PortfolioHolding) {
    saveHoldings(holdings.map((h) => h.cardId === updated.cardId ? updated : h));
    setEditTarget(null);
  }

  // ── Aggregates ──────────────────────────────────────────────────────────
  const { totalCost, totalValue, pnl, pnlPct } = useMemo(
    () => computePnl(holdings, liveData),
    [holdings, liveData],
  );
  const isUp      = pnl >= 0;
  const lineColor = isUp ? '#16a34a' : '#dc2626';

  // ── Chart data ──────────────────────────────────────────────────────────
  const allChartData = useMemo(() => computeChartData(holdings, liveData), [holdings, liveData]);
  const chartData    = useMemo(() => filterByRange(allChartData, timeRange), [allChartData, timeRange]);

  // ── SSR guard ──
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

      {/* ── Hero ── */}
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

          {/* P&L row */}
          <div className="flex items-center gap-2 mb-0.5">
            {isUp
              ? <TrendingUp  size={16} className="text-green-600 shrink-0" />
              : <TrendingDown size={16} className="text-red-500  shrink-0" />}
            <span className={`text-base font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
              {isUp ? '+' : ''}{formatEur(pnl)}
            </span>
            <span className={`text-sm font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
              ({isUp ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            seit Kauf · Einstand {formatEur(totalCost)}
          </p>

          {/* ── Chart ── */}
          <div className="mb-3 -mx-1">
            <PortfolioChart data={chartData} color={lineColor} />
          </div>

          {/* Time-range pills */}
          <div className="flex gap-1">
            {(Object.keys(RANGE_DAYS) as Array<keyof typeof RANGE_DAYS>).map((r) => (
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
        <h2 className="text-sm font-bold text-gray-900 mb-3">
          Positionen <span className="text-gray-400 font-normal">({holdings.length})</span>
        </h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {[...holdings]
            .sort((a, b) =>
              (liveData[b.cardId]?.price || b.purchasePrice) * b.quantity -
              (liveData[a.cardId]?.price || a.purchasePrice) * a.quantity,
            )
            .map((h) => {
              const price = liveData[h.cardId]?.price || h.purchasePrice;
              const value = price * h.quantity;
              const cost  = h.purchasePrice * h.quantity;
              const pnlH  = value - cost;
              const pct   = cost > 0 ? (pnlH / cost) * 100 : 0;
              const pos   = pnlH >= 0;
              const sc    = h.setCode || setCodeFromId(h.cardId);
              const lang  = h.language || 'EN';

              return (
                <div
                  key={h.cardId}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/70 transition-colors group cursor-pointer"
                  onClick={() => setEditTarget(h)}
                >
                  {/* Card image + language badge */}
                  <div className="shrink-0 relative">
                    <img
                      src={h.imageUrl} alt={h.cardName}
                      className="h-16 w-12 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="absolute -bottom-1 -right-1 text-[10px] leading-none bg-white border border-gray-100 rounded px-0.5 shadow-sm">
                      {LANG_FLAG[lang]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{h.cardName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <BoosterPackImage setCode={sc} setName={h.setName} className="h-4 w-auto" />
                      <span className="text-xs text-gray-400 truncate">{h.setName}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {h.quantity}× · à {formatEur(h.purchasePrice)}
                      {h.purchaseDate
                        ? ` · ${new Date(h.purchaseDate + 'T00:00:00').toLocaleDateString('de-DE', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                          })}`
                        : ''}
                      {' · '}{LANG_LABEL[lang]}
                    </p>
                  </div>

                  {/* Value + P&L */}
                  <div className="text-right shrink-0 mr-1">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{formatEur(value)}</p>
                    <p className={`text-xs font-semibold tabular-nums ${pos ? 'text-green-600' : 'text-red-500'}`}>
                      {pos ? '+' : ''}{formatEur(pnlH)}
                    </p>
                    <p className={`text-[10px] font-semibold tabular-nums ${pos ? 'text-green-500' : 'text-red-400'}`}>
                      {pos ? '+' : ''}{pct.toFixed(1)}%
                    </p>
                  </div>

                  {/* Delete */}
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
            { label: 'Einstand',      value: formatEur(totalCost) },
            { label: 'Positionen',    value: String(holdings.length) },
            { label: 'Karten gesamt', value: String(holdings.reduce((s, h) => s + h.quantity, 0)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">{label}</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-300 text-center mt-6 leading-relaxed">
          Daten werden lokal im Browser gespeichert · Keine Anlageberatung · Preise ohne Gewähr
        </p>
        <p className="text-[10px] text-gray-200 text-center mt-1 font-mono">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>

      {/* ── Modals ── */}
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
        <ResetDialog count={holdings.length} onConfirm={resetPortfolio} onCancel={() => setShowReset(false)} />
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-100 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
        <BarChart3 size={32} className="text-violet-500" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-3">Dein Portfolio wartet</h2>
      <p className="text-sm text-gray-400 max-w-xs mb-2 leading-relaxed">
        Trag deine Pokémon-Karten ein und verfolge ihren Marktwert — täglich aktuell, wie bei einer Aktien-App.
      </p>
      <ul className="text-xs text-gray-400 mb-8 space-y-1">
        <li>📈 Kursverlauf interaktiv mit Hover/Touch</li>
        <li>💶 Unrealisierter Gewinn/Verlust</li>
        <li>🇬🇧🇩🇪🇯🇵🇰🇷 Preise nach Sprache (EN/DE/JP/KR)</li>
        <li>🔒 Lokal gespeichert, kein Login nötig</li>
      </ul>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 py-3.5 rounded-2xl transition-colors shadow-sm shadow-violet-200"
      >
        <Plus size={17} /> Erste Karte hinzufügen
      </button>
    </div>
  );
}

// ─── Reset dialog ─────────────────────────────────────────────────────────────

function ResetDialog({ count, onConfirm, onCancel }: { count: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl z-10 p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-2">Portfolio zurücksetzen?</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Alle {count} Position{count !== 1 ? 'en werden' : ' wird'} unwiderruflich gelöscht.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            Abbrechen
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
            Alles löschen
          </button>
        </div>
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
  const [query,         setQuery]         = useState('');
  const [suggestions,   setSuggestions]   = useState<Suggestion[]>([]);
  const [searching,     setSearching]     = useState(false);
  const [selected,      setSelected]      = useState<Suggestion | null>(null);
  const [qty,           setQty]           = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate,  setPurchaseDate]  = useState(() => new Date().toISOString().split('T')[0]);
  const [language,      setLanguage]      = useState<CardLanguage>('EN');

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await r.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch { setSuggestions([]); }
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
      language,
      addedAt: new Date().toISOString().split('T')[0],
    };
    const existing = holdings.find((h) => h.cardId === selected.id);
    const updated = existing
      ? holdings.map((h) => h.cardId === selected.id ? { ...h, quantity: h.quantity + qty } : h)
      : [...holdings, holding];
    onAdd(updated);
    onClose();
  }

  const total = purchasePrice && qty > 0 ? parseFloat(purchasePrice) * qty : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/*
        Mobile: bottom sheet with max-h calculated from dynamic viewport height (dvh)
        so the modal stays above the software keyboard.
        Desktop: centred dialog (sm: breakpoint).
      */}
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col"
        style={{ maxHeight: 'min(85dvh, calc(100vh - 32px))' }}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="font-black text-gray-900 text-base">Karte hinzufügen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">

          {/* Search input */}
          {!selected && (
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="search"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kartenname — z.B. Charizard oder Glurak"
                className="w-full pl-10 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              {searching
                ? <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                : query.length > 0
                  ? <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 p-1">
                      <X size={13} />
                    </button>
                  : null
              }
            </div>
          )}

          {/* Suggestions list */}
          {!selected && suggestions.length > 0 && (
            <div className="-mx-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 mb-1.5">
                {suggestions.length} Karte{suggestions.length !== 1 ? 'n' : ''} gefunden
              </p>
              <div className="space-y-0.5 max-h-64 overflow-y-auto overscroll-contain">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectCard(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-50 active:bg-violet-100 transition-colors text-left group"
                    style={{ minHeight: 56 }}
                  >
                    {/* Card thumbnail */}
                    <div className="shrink-0 w-9 h-12 flex items-center justify-center">
                      {s.imageUrl
                        ? <img src={s.imageUrl} alt={s.name} className="h-12 w-9 object-contain rounded" loading="lazy" />
                        : <div className="w-9 h-12 bg-gray-100 rounded" />
                      }
                    </div>
                    {/* Name + set */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-violet-800">
                        {s.nameDe || s.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{s.set}</p>
                    </div>
                    {/* Price */}
                    <div className="shrink-0 text-right pl-2">
                      {s.price > 0
                        ? <p className="text-sm font-bold text-gray-900 tabular-nums">{formatEur(s.price)}</p>
                        : <p className="text-xs text-gray-300">–</p>
                      }
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty states */}
          {!selected && query.length >= 2 && !searching && suggestions.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">Keine Karten gefunden</p>
          )}
          {!selected && query.length < 2 && (
            <p className="text-center text-xs text-gray-400 py-4">Mind. 2 Zeichen eingeben</p>
          )}

          {/* Selected card details */}
          {selected && (
            <div className="space-y-4">
              {/* Card preview */}
              <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-2xl">
                <div className="shrink-0 w-14 h-20 flex items-center justify-center">
                  {selected.imageUrl
                    ? <img src={selected.imageUrl} alt={selected.name} className="h-20 w-14 object-contain rounded-lg shadow-sm" />
                    : <div className="h-20 w-14 bg-violet-100 rounded-lg" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{selected.nameDe || selected.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <BoosterPackImage setCode={setCodeFromId(selected.id)} setName={selected.set} className="h-5 w-auto" />
                    <p className="text-xs text-gray-500 truncate">{selected.set}</p>
                  </div>
                  {selected.price > 0 && (
                    <p className="text-xs font-bold text-violet-700 mt-1.5">
                      Aktuell {formatEur(selected.price)} 🇬🇧 EN
                    </p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="shrink-0 self-start text-gray-300 hover:text-gray-500 p-1 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Language picker */}
              <LangPicker value={language} onChange={setLanguage} />

              {/* Quantity + price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">Anzahl</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center font-bold text-gray-700 text-lg transition-colors">
                      −
                    </button>
                    <input type="number" min={1} value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center text-sm font-bold border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:border-violet-400"
                    />
                    <button onClick={() => setQty((q) => q + 1)}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center font-bold text-gray-700 text-lg transition-colors">
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">Kaufpreis/Stk (€)</label>
                  <input type="number" min={0} step={0.01} value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0,00" inputMode="decimal"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              {/* Purchase date */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Kaufdatum</label>
                <input type="date" value={purchaseDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 text-gray-700"
                />
              </div>

              {/* Total */}
              {total !== null && !isNaN(total) && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-xs text-gray-500 font-semibold">Gesamteinstand</span>
                  <span className="text-base font-black text-gray-900 tabular-nums">{formatEur(total)}</span>
                </div>
              )}

              <button
                onClick={confirm}
                disabled={!purchasePrice || parseFloat(purchasePrice) <= 0}
                className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <Check size={16} />
                {holdings.find((h) => h.cardId === selected.id) ? 'Anzahl erhöhen' : 'Zum Portfolio hinzufügen'}
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
  const [qty,           setQty]           = useState(holding.quantity);
  const [purchasePrice, setPurchasePrice] = useState(holding.purchasePrice.toFixed(2));
  const [purchaseDate,  setPurchaseDate]  = useState(holding.purchaseDate || '');
  const [language,      setLanguage]      = useState<CardLanguage>(holding.language || 'EN');

  const sc    = holding.setCode || setCodeFromId(holding.cardId);
  const total = parseFloat(purchasePrice) * qty;

  function save() {
    onSave({
      ...holding,
      quantity: qty,
      purchasePrice: parseFloat(purchasePrice) || holding.purchasePrice,
      purchaseDate: purchaseDate || holding.purchaseDate,
      language,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col"
        style={{ maxHeight: 'min(85dvh, calc(100vh - 32px))' }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="font-black text-gray-900 text-base">Position bearbeiten</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          {/* Card preview */}
          <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-2xl">
            <div className="shrink-0 w-14 h-20 flex items-center justify-center">
              {holding.imageUrl
                ? <img src={holding.imageUrl} alt={holding.cardName} className="h-20 w-14 object-contain rounded-lg shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <div className="h-20 w-14 bg-violet-100 rounded-lg" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">{holding.cardName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <BoosterPackImage setCode={sc} setName={holding.setName} className="h-5 w-auto" />
                <p className="text-xs text-gray-500 truncate">{holding.setName}</p>
              </div>
            </div>
          </div>

          <LangPicker value={language} onChange={setLanguage} />

          {/* Quantity */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Anzahl</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center font-bold text-gray-700 text-lg transition-colors">
                −
              </button>
              <input type="number" min={1} value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center text-sm font-bold border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:border-violet-400"
              />
              <button onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center font-bold text-gray-700 text-lg transition-colors">
                +
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Kaufpreis/Stk (€)</label>
            <input type="number" min={0} step={0.01} value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              inputMode="decimal"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Kaufdatum</label>
            <input type="date" value={purchaseDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 text-gray-700"
            />
          </div>

          {!isNaN(total) && total > 0 && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xs text-gray-500 font-semibold">Gesamteinstand</span>
              <span className="text-base font-black text-gray-900 tabular-nums">{formatEur(total)}</span>
            </div>
          )}

          <button onClick={save}
            className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
            <Check size={16} /> Speichern
          </button>

          <button onClick={() => onRemove(holding.cardId)}
            className="w-full py-3 text-red-500 hover:text-red-600 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Trash2 size={14} /> Karte entfernen
          </button>
        </div>
      </div>
    </div>
  );
}
