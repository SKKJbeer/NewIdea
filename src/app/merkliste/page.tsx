'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Trash2, Loader2, Search } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { formatEur } from '@/lib/portfolio';
import {
  WATCHLIST_KEY, parseWatchlist, watchChange,
  type WatchlistItem,
} from '@/lib/watchlist';

interface LivePrice {
  price: number;
}

export default function MerklistePage() {
  const [mounted,    setMounted]    = useState(false);
  const [items,      setItems]      = useState<WatchlistItem[]>([]);
  const [liveData,   setLiveData]   = useState<Record<string, LivePrice>>({});
  const [loading,    setLoading]    = useState(false);
  const [priceError, setPriceError] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setItems(parseWatchlist(localStorage.getItem(WATCHLIST_KEY)));
    } catch {}
  }, []);

  const fetchKey = items.map((i) => i.cardId).join('|');

  useEffect(() => {
    if (!mounted || items.length === 0) { setLiveData({}); setPriceError(false); return; }
    let cancelled = false;
    setLoading(true);
    setPriceError(false);
    fetch('/api/portfolio/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: items.map((i) => ({ id: i.cardId, language: 'EN', name: i.cardName })),
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { if (!cancelled) setLiveData(data as Record<string, LivePrice>); })
      .catch(() => { if (!cancelled) setPriceError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, fetchKey]);

  function remove(cardId: string) {
    const updated = items.filter((i) => i.cardId !== cardId);
    setItems(updated);
    try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated)); } catch {}
  }

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0f]" />;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-2xl mx-auto px-4 pt-10 pb-12 sm:py-14 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Star size={10} /> Merkliste
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white">
            Karten <span className="text-violet-400">beobachten</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Preisveränderung seit Vormerkung — lokal gespeichert, kein Login nötig.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16 space-y-4">
        {priceError && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
            <p className="text-[11px] font-semibold text-amber-400/80">
              Live-Preise konnten nicht geladen werden — angezeigt werden die Preise zum Vormerk-Zeitpunkt.
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#1a1a28] rounded-2xl flex items-center justify-center mb-5">
              <Star size={28} className="text-violet-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Noch keine Karten vorgemerkt</h2>
            <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">
              Auf jeder Karten-Detailseite gibt es den Button „Auf die Merkliste" — ab dann siehst du hier die Preisveränderung.
            </p>
            <Link
              href="/suche"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-full transition-colors text-sm"
            >
              <Search size={15} /> Karte suchen
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                Beobachtet ({items.length})
              </p>
              {loading && <Loader2 size={12} className="animate-spin text-slate-700" />}
            </div>

            <div className="rounded-2xl border border-[#2a2a3a] overflow-hidden divide-y divide-[#1e1e30]">
              {items.map((item) => {
                const live = liveData[item.cardId]?.price ?? 0;
                const current = live > 0 ? live : item.priceAtAdd;
                const change = watchChange(item.priceAtAdd, live);
                const pos = (change?.abs ?? 0) >= 0;

                return (
                  <div key={item.cardId} className="flex items-center gap-3.5 px-4 py-3.5 bg-[#13131e] hover:bg-[#1a1a28] transition-colors group">
                    <Link href={`/karten/${item.cardId}`} className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="shrink-0 w-11 h-[58px] rounded-md overflow-hidden bg-[#2a2a3a]">
                        {item.imageUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.imageUrl}
                            alt={item.cardName}
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-200 leading-snug truncate group-hover:text-white transition-colors">
                          {item.cardName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <BoosterPackImage setCode={item.setCode} setName={item.setName} className="h-3.5 w-auto shrink-0" />
                          <span className="text-[11px] text-slate-600 truncate">{item.setName}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
                          Vorgemerkt {new Date(item.addedAt + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          {item.priceAtAdd > 0 && ` bei ${formatEur(item.priceAtAdd)}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-200 tabular-nums">{current > 0 ? formatEur(current) : '—'}</p>
                        {change ? (
                          <>
                            <p className={`text-xs font-semibold tabular-nums ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pos ? '+' : ''}{formatEur(change.abs)}
                            </p>
                            <p className={`text-[10px] tabular-nums ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pos ? '+' : ''}{change.pct.toFixed(1)}%
                            </p>
                          </>
                        ) : (
                          <p className="text-[10px] text-slate-600">seit Vormerkung</p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => remove(item.cardId)}
                      className="p-1.5 rounded-full text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Von Merkliste entfernen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <footer className="border-t border-[#1e1e30] pt-5 space-y-3 mt-8">
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold text-amber-400/80">Inoffizielle Fan-Seite — kein offizielles Pokémon-Produkt</p>
            <p className="text-[10px] text-amber-400/60 mt-0.5">
              Preise: Cardmarket (EUR) ohne Gewähr — <strong className="text-amber-400/80">keine Anlageberatung</strong>.
            </p>
          </div>
          <div className="flex justify-center gap-5 text-xs">
            <a href="/impressum" className="text-slate-700 hover:text-violet-400 transition-colors">Impressum</a>
            <span className="text-slate-800">|</span>
            <a href="/datenschutz" className="text-slate-700 hover:text-violet-400 transition-colors">Datenschutz</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
