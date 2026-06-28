'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, BarChart3, Search, X, Check } from 'lucide-react';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { NavBar } from '@/components/NavBar';
import { PortfolioChart } from '@/components/PortfolioChart';
import {
  normalizeHolding, computePnl, computeChartData, filterByRange,
  formatEur, setCodeFromId,
  LANG_FLAG, RANGE_DAYS,
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

const RANGE_LABEL: Record<keyof typeof RANGE_DAYS, string> = {
  '1D': '1 Tag',
  '1W': '1 Woche',
  '1M': '1 Monat',
  '3M': '3 Monate',
  '1Y': '1 Jahr',
};

// ─── Language picker ─────────────────────────────────────────────────────────

function LangPicker({ value, onChange }: { value: CardLanguage; onChange: (l: CardLanguage) => void }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Sprache</label>
      <div className="grid grid-cols-4 gap-2">
        {(['EN', 'DE', 'JP', 'KR'] as CardLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
              value === lang
                ? 'border-violet-500 bg-violet-500/20 text-violet-400'
                : 'border-[#2a2a3a] bg-[#13131e] text-slate-500 hover:border-violet-500/50 hover:text-slate-300'
            }`}
          >
            <span className="text-base leading-none">{LANG_FLAG[lang]}</span>
            <span>{lang}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5">
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
  const [priceError, setPriceError] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [showReset,  setShowReset]  = useState(false);
  const [editTarget, setEditTarget] = useState<PortfolioHolding | null>(null);
  const [timeRange,  setTimeRange]  = useState<keyof typeof RANGE_DAYS>('1M');

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

  // Refetch wenn sich die preisrelevanten Felder ändern (cardId + Sprache), nicht nur die Anzahl.
  // So löst auch ein Sprachwechsel im Edit-Modal einen neuen Preisabruf aus.
  const fetchKey = holdings.map((h) => `${h.cardId}:${h.language || 'EN'}`).join('|');

  useEffect(() => {
    if (!mounted || holdings.length === 0) { setLiveData({}); setPriceError(false); return; }
    let cancelled = false;
    setLoading(true);
    setPriceError(false);
    fetch('/api/portfolio/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: holdings.map((h) => ({ id: h.cardId, language: h.language || 'EN', name: h.cardName })),
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { if (!cancelled) setLiveData(data as Record<string, LiveCardData>); })
      .catch(() => { if (!cancelled) setPriceError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, fetchKey]);

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

  const { totalCost, totalValue, pnl, pnlPct } = useMemo(
    () => computePnl(holdings, liveData),
    [holdings, liveData],
  );

  const allChartData = useMemo(() => computeChartData(holdings, liveData), [holdings, liveData]);
  const chartData    = useMemo(() => filterByRange(allChartData, timeRange), [allChartData, timeRange]);

  // P&L gekoppelt an gewählten Zeitraum — nutzt ersten Chart-Punkt als Referenzwert
  const rangeStartValue = chartData.length >= 2 ? chartData[0].value : null;
  const rangePnl    = rangeStartValue !== null ? totalValue - rangeStartValue : pnl;
  const rangePnlPct = rangeStartValue !== null && rangeStartValue > 0
    ? (rangePnl / rangeStartValue) * 100
    : pnlPct;
  const isUp      = rangePnl >= 0;
  const lineColor = isUp ? '#34d399' : '#fb7185';

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0f]" />;

  if (holdings.length === 0 && !showAdd) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
        <NavBar />
        <EmptyState onAdd={() => setShowAdd(true)} />
        {showAdd && (
          <AddCardModal holdings={holdings} onAdd={saveHoldings} onClose={() => setShowAdd(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      {/* ── Hero ── */}
      <div className="border-b border-[#1e1e30]">
        <div className="max-w-2xl mx-auto px-5 pt-7 pb-5">

          {/* Header row */}
          <div className="flex items-center justify-between mb-7">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Mein Portfolio</p>
            <div className="flex items-center gap-2">
              {loading && <Loader2 size={12} className="animate-spin text-slate-700" />}
              <button
                onClick={() => setShowReset(true)}
                className="p-2 rounded-full text-slate-700 hover:text-slate-400 hover:bg-[#1a1a28] transition-colors"
                title="Portfolio zurücksetzen"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-full transition-colors"
              >
                <Plus size={14} /> Position
              </button>
            </div>
          </div>

          {/* Total value */}
          <p className="text-[46px] leading-none font-black text-white tabular-nums tracking-tight">
            {formatEur(totalValue)}
          </p>

          {/* P&L — gekoppelt an gewählten Zeitraum */}
          <div className="flex items-baseline gap-2 mt-3 mb-1">
            <span className={`text-base font-bold tabular-nums ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? '+' : ''}{formatEur(rangePnl)}
            </span>
            <span className={`text-sm font-semibold tabular-nums ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({isUp ? '+' : ''}{rangePnlPct.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            {rangeStartValue !== null
              ? `${RANGE_LABEL[timeRange]} · Start ${formatEur(rangeStartValue)}`
              : `seit Kauf · Einstand ${formatEur(totalCost)}`}
          </p>

          {/* Fehler-Hinweis wenn Live-Preise nicht geladen werden konnten */}
          {priceError && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
              <p className="text-[11px] font-semibold text-amber-400/80">
                Live-Preise konnten nicht geladen werden — angezeigt werden Kaufpreise.
              </p>
              <p className="text-[10px] text-amber-400/60 mt-0.5">
                Cardmarket/TCG-API evtl. ausgelastet · in ein paar Minuten erneut versuchen.
              </p>
            </div>
          )}

          {/* Chart */}
          <div className="-mx-1 mb-3">
            <PortfolioChart data={chartData} color={lineColor} />
          </div>

          {/* Time-range segmented control */}
          <div className="flex bg-[#1a1a28] rounded-full p-1">
            {(Object.keys(RANGE_DAYS) as Array<keyof typeof RANGE_DAYS>).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all duration-150 ${
                  timeRange === r
                    ? 'bg-[#2a2a3a] text-slate-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Holdings list ── */}
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-10">
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">
          Positionen <span className="font-normal">({holdings.length})</span>
        </p>

        <div className="rounded-2xl border border-[#2a2a3a] overflow-hidden divide-y divide-[#1e1e30]">
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
                  className="flex items-center gap-3.5 px-4 py-3.5 bg-[#13131e] hover:bg-[#1a1a28] transition-colors group cursor-pointer"
                  onClick={() => setEditTarget(h)}
                >
                  {/* Card image */}
                  <div className="shrink-0 w-11 h-[58px] rounded-md overflow-hidden bg-[#2a2a3a]">
                    <img
                      src={h.imageUrl}
                      alt={h.cardName}
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 leading-snug truncate">
                      {h.cardName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <BoosterPackImage setCode={sc} setName={h.setName} className="h-3.5 w-auto shrink-0" />
                      <span className="text-[11px] text-slate-600 truncate">{h.setName}</span>
                      <span className="text-[9px] font-bold bg-[#2a2a3a] text-slate-500 rounded px-1.5 py-0.5 leading-none shrink-0">
                        {lang}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5 tabular-nums truncate">
                      {h.quantity}× · {formatEur(h.purchasePrice)}
                      {h.purchaseDate
                        ? ` · ${new Date(h.purchaseDate + 'T00:00:00').toLocaleDateString('de-DE', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                          })}`
                        : ''}
                    </p>
                  </div>

                  {/* Value + P&L */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-200 tabular-nums">
                      {formatEur(value)}
                    </p>
                    <p className={`text-xs font-semibold tabular-nums ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pos ? '+' : ''}{formatEur(pnlH)}
                    </p>
                    <p className={`text-[10px] tabular-nums ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pos ? '+' : ''}{pct.toFixed(1)}%
                    </p>
                  </div>

                  {/* Delete — nur Desktop (Hover). Mobile: via Edit-Modal löschen */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeHolding(h.cardId); }}
                    className="p-1.5 rounded-full text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 transition-colors hidden sm:block opacity-0 group-hover:opacity-100 shrink-0"
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
            { label: 'Einstand',   value: formatEur(totalCost) },
            { label: 'Positionen', value: String(holdings.length) },
            { label: 'Karten',     value: String(holdings.reduce((s, h) => s + h.quantity, 0)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#13131e] border border-[#2a2a3a] rounded-2xl p-3.5 text-center">
              <p className="text-[10px] text-slate-600 uppercase font-bold tracking-wider mb-1">{label}</p>
              <p className="text-sm font-bold text-slate-200 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-700 text-center mt-8 leading-relaxed">
          Daten werden lokal im Browser gespeichert · Keine Anlageberatung · Preise ohne Gewähr
        </p>
        <p className="text-[10px] text-slate-800 text-center mt-1 font-mono">
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
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-16 h-16 bg-[#1a1a28] rounded-2xl flex items-center justify-center mb-5">
        <BarChart3 size={28} className="text-violet-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3">Dein Portfolio wartet</h2>
      <p className="text-sm text-slate-500 max-w-xs mb-2 leading-relaxed">
        Trag deine Pokémon-Karten ein und verfolge ihren Marktwert — täglich aktuell, wie bei einer Aktien-App.
      </p>
      <ul className="text-xs text-slate-500 mb-8 space-y-1">
        <li>📈 Kursverlauf interaktiv mit Hover/Touch</li>
        <li>💶 Unrealisierter Gewinn/Verlust</li>
        <li>🇬🇧🇩🇪🇯🇵🇰🇷 Preise nach Sprache (EN/DE/JP/KR)</li>
        <li>🔒 Lokal gespeichert, kein Login nötig</li>
      </ul>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 py-3.5 rounded-full transition-colors"
      >
        <Plus size={16} /> Erste Karte hinzufügen
      </button>
    </div>
  );
}

// ─── Reset dialog ─────────────────────────────────────────────────────────────

function ResetDialog({ count, onConfirm, onCancel }: { count: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#13131e] border border-[#2a2a3a] w-full max-w-sm rounded-3xl shadow-2xl z-10 p-6 text-center">
        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-rose-400" />
        </div>
        <h2 className="text-lg font-black text-slate-200 mb-2">Portfolio zurücksetzen?</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Alle {count} Position{count !== 1 ? 'en werden' : ' wird'} unwiderruflich gelöscht.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-[#2a2a3a] text-sm font-bold text-slate-400 hover:bg-[#1a1a28] transition-colors">
            Abbrechen
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">
            Alles löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = 'w-full text-[16px] sm:text-sm border border-[#2a2a3a] bg-[#1a1a28] text-slate-200 placeholder:text-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all';

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
      purchasePrice: Math.max(0, parseFloat(purchasePrice) || 0) || selected.price || 0,
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

  const priceNum = Math.max(0, parseFloat(purchasePrice) || 0);
  const total = priceNum > 0 && qty > 0 ? priceNum * qty : null;

  return (
    /*
     * Mobile: Vollbild-Overlay (kein Bottom-Sheet). Die iOS-Tastatur verkleinert
     * den sichtbaren Bereich — ein Bottom-Sheet mit dvh/vh würde über die Oberkante
     * hinausschießen und den Header verdecken. Vollbild ist stabiler.
     * Desktop (sm:): zentrierter Dialog mit abgerundeten Ecken.
     */
    <div className="fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 sm:backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 flex flex-col bg-[#13131e] z-10
                      sm:static sm:w-full sm:max-w-md sm:rounded-3xl sm:shadow-2xl sm:max-h-[85vh] sm:overflow-hidden sm:border sm:border-[#2a2a3a]">

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 pb-4 border-b border-[#1e1e30] shrink-0"
          style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        >
          <h2 className="font-black text-slate-200 text-base">Karte hinzufügen</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-600 hover:text-slate-300 hover:bg-[#1a1a28] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Suchfeld ── */}
        {!selected && (
          <div className="shrink-0 px-5 py-3 bg-[#13131e] border-b border-[#1e1e30]">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              <input
                type="search"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kartenname — z. B. Charizard"
                className="w-full pl-10 pr-10 py-3 text-[16px] sm:text-sm border border-[#2a2a3a] rounded-xl bg-[#1a1a28] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
              {searching
                ? <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 animate-spin" />
                : query.length > 0
                  ? <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-slate-300 rounded-full">
                      <X size={13} />
                    </button>
                  : null
              }
            </div>
          </div>
        )}

        {/* ── Scrollbarer Bereich ── */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {/* Suchergebnisse */}
          {!selected && suggestions.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide px-5 pt-4 pb-1">
                {suggestions.length} Karte{suggestions.length !== 1 ? 'n' : ''} gefunden
              </p>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectCard(s)}
                  className="w-full flex items-center gap-3 px-5 py-3 active:bg-[#1a1a28] transition-colors text-left border-b border-[#1e1e30] last:border-0"
                  style={{ minHeight: 64 }}
                >
                  <div className="shrink-0 w-10 h-14 rounded-md overflow-hidden bg-[#2a2a3a]">
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-contain" loading="lazy" />
                      : <div className="w-full h-full" />
                    }
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2">
                      {s.nameDe || s.name}
                    </p>
                    <p className="text-xs text-slate-600 truncate mt-0.5">{s.set}</p>
                  </div>
                  {s.price > 0 && (
                    <p className="shrink-0 text-sm font-bold text-slate-200 tabular-nums">
                      {formatEur(s.price)}
                    </p>
                  )}
                </button>
              ))}
              <div style={{ height: 'max(24px, env(safe-area-inset-bottom))' }} />
            </>
          )}

          {/* Leer-Zustände */}
          {!selected && query.length >= 2 && !searching && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <p className="text-sm font-semibold text-slate-400">Keine Ergebnisse</p>
              <p className="text-xs text-slate-600 mt-1">Versuche einen anderen Suchbegriff</p>
            </div>
          )}
          {!selected && query.length < 2 && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <Search size={36} className="text-slate-800 mb-3" />
              <p className="text-sm text-slate-600">Mind. 2 Zeichen eingeben</p>
            </div>
          )}

          {/* Formular nach Karten-Auswahl */}
          {selected && (
            <div className="px-5 py-5 space-y-4">
              {/* Karten-Vorschau */}
              <div className="flex items-center gap-3 p-4 bg-[#1a1a28] rounded-2xl">
                <div className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-[#2a2a3a]">
                  {selected.imageUrl
                    ? <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-contain" />
                    : <div className="w-full h-full" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 leading-tight">{selected.nameDe || selected.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <BoosterPackImage setCode={setCodeFromId(selected.id)} setName={selected.set} className="h-5 w-auto" />
                    <p className="text-xs text-slate-500 truncate">{selected.set}</p>
                  </div>
                  {selected.price > 0 && (
                    <p className="text-xs font-bold text-slate-400 mt-1.5 tabular-nums">
                      Aktuell {formatEur(selected.price)} 🇬🇧 EN
                    </p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="shrink-0 self-start p-1 text-slate-600 hover:text-slate-300 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <LangPicker value={language} onChange={setLanguage} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Anzahl</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-[#1a1a28] hover:bg-[#2a2a3a] active:bg-[#3a3a4a] flex items-center justify-center font-bold text-slate-300 text-lg transition-colors border border-[#2a2a3a]">−</button>
                    <input type="number" min={1} value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center text-[16px] sm:text-sm font-bold border border-[#2a2a3a] bg-[#1a1a28] text-slate-200 rounded-xl py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20" />
                    <button onClick={() => setQty((q) => q + 1)}
                      className="w-10 h-10 rounded-xl bg-[#1a1a28] hover:bg-[#2a2a3a] active:bg-[#3a3a4a] flex items-center justify-center font-bold text-slate-300 text-lg transition-colors border border-[#2a2a3a]">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Kaufpreis/Stk (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value.replace(/^-+/, ''))}
                    placeholder="0,00"
                    inputMode="decimal"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Kaufdatum</label>
                <input type="date" value={purchaseDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className={inputCls} />
              </div>

              {total !== null && !isNaN(total) && (
                <div className="flex items-center justify-between bg-[#1a1a28] rounded-xl px-4 py-3">
                  <span className="text-xs text-slate-500 font-semibold">Gesamteinstand</span>
                  <span className="text-base font-black text-slate-200 tabular-nums">{formatEur(total)}</span>
                </div>
              )}

              <button
                onClick={confirm}
                disabled={priceNum <= 0}
                className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <Check size={16} />
                {holdings.find((h) => h.cardId === selected.id) ? 'Anzahl erhöhen' : 'Zum Portfolio hinzufügen'}
              </button>

              <p className="text-[10px] text-slate-700 text-center">
                Kaufpreis wird für die Gewinn/Verlust-Berechnung verwendet
              </p>
              <div style={{ height: 'max(24px, env(safe-area-inset-bottom))' }} />
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
  const total = Math.max(0, parseFloat(purchasePrice) || 0) * qty;

  function save() {
    onSave({
      ...holding,
      quantity: qty,
      purchasePrice: Math.max(0, parseFloat(purchasePrice) || 0) || holding.purchasePrice,
      purchaseDate: purchaseDate || holding.purchaseDate,
      language,
    });
  }

  return (
    <div className="fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/60 sm:backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-0 flex flex-col bg-[#13131e] z-10
                      sm:static sm:w-full sm:max-w-md sm:rounded-3xl sm:shadow-2xl sm:max-h-[85vh] sm:overflow-hidden sm:border sm:border-[#2a2a3a]">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-4 border-b border-[#1e1e30] shrink-0"
          style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        >
          <h2 className="font-black text-slate-200 text-base">Position bearbeiten</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-600 hover:text-slate-300 hover:bg-[#1a1a28] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Single scroll context */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {/* Card preview */}
          <div className="flex items-center gap-3 p-4 bg-[#1a1a28] rounded-2xl">
            <div className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-[#2a2a3a]">
              {holding.imageUrl
                ? <img
                    src={holding.imageUrl} alt={holding.cardName}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                : <div className="w-full h-full" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-200 leading-tight">{holding.cardName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <BoosterPackImage setCode={sc} setName={holding.setName} className="h-5 w-auto" />
                <p className="text-xs text-slate-500 truncate">{holding.setName}</p>
              </div>
            </div>
          </div>

          <LangPicker value={language} onChange={setLanguage} />

          {/* Quantity */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Anzahl</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-[#1a1a28] hover:bg-[#2a2a3a] active:bg-[#3a3a4a] flex items-center justify-center font-bold text-slate-300 text-lg transition-colors border border-[#2a2a3a]"
              >
                −
              </button>
              <input
                type="number" min={1} value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center text-[16px] sm:text-sm font-bold border border-[#2a2a3a] bg-[#1a1a28] text-slate-200 rounded-xl py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-[#1a1a28] hover:bg-[#2a2a3a] active:bg-[#3a3a4a] flex items-center justify-center font-bold text-slate-300 text-lg transition-colors border border-[#2a2a3a]"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Kaufpreis/Stk (€)</label>
            <input
              type="number" min={0} step={0.01} value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value.replace(/^-+/, ''))}
              inputMode="decimal"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Kaufdatum</label>
            <input
              type="date" value={purchaseDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {!isNaN(total) && total > 0 && (
            <div className="flex items-center justify-between bg-[#1a1a28] rounded-xl px-4 py-3">
              <span className="text-xs text-slate-500 font-semibold">Gesamteinstand</span>
              <span className="text-base font-black text-slate-200 tabular-nums">{formatEur(total)}</span>
            </div>
          )}

          <button
            onClick={save}
            className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={16} /> Speichern
          </button>

          <button
            onClick={() => onRemove(holding.cardId)}
            className="w-full py-3 text-rose-400 hover:text-rose-300 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={14} /> Karte entfernen
          </button>
          <div style={{ height: 'max(24px, env(safe-area-inset-bottom))' }} />
        </div>
      </div>
    </div>
  );
}
