'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import {
  WATCHLIST_KEY, parseWatchlist, isWatched, toggleWatch,
  type WatchlistItem,
} from '@/lib/watchlist';

interface WatchButtonProps {
  cardId: string;
  cardName: string;
  setName: string;
  setCode: string;
  imageUrl: string;
  price: number;
}

export function WatchButton({ cardId, cardName, setName, setCode, imageUrl, price }: WatchButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setWatched(isWatched(parseWatchlist(localStorage.getItem(WATCHLIST_KEY)), cardId));
    } catch {}
  }, [cardId]);

  function toggle() {
    try {
      const list = parseWatchlist(localStorage.getItem(WATCHLIST_KEY));
      const item: WatchlistItem = {
        cardId, cardName, setName, setCode, imageUrl,
        priceAtAdd: price,
        addedAt: new Date().toISOString().split('T')[0],
      };
      const updated = toggleWatch(list, item);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      setWatched(isWatched(updated, cardId));
    } catch {}
  }

  // GEDECKT STATT LAUT.
  //
  // Vorher war das eine vollflächig violette Schaltfläche über die ganze
  // Spaltenbreite — auf einem Bildschirmfoto der lauteste Gegenstand der Seite,
  // lauter als das Kartenbild darüber. Genau daran ist ein Produkt als
  // beliebige Vorlage zu erkennen: Die auffälligste Fläche gehört einer
  // Nebenfunktion.
  //
  // Die Karte ist der Blickfang. Das Merken ist eine Nebenhandlung und sieht
  // jetzt auch so aus — sichtbar, erreichbar, aber nicht schreiend. Der
  // gemerkte Zustand ist bewusst der farbigere von beiden: Dass etwas AUF der
  // Merkliste steht, ist die Auskunft; die Einladung ist es nicht.
  return (
    <button
      onClick={toggle}
      disabled={!mounted}
      className={`flex min-h-[44px] w-full items-center justify-center gap-2 border text-[13px] font-semibold transition-colors ${
        watched
          ? 'border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15'
          : 'border-[#2a2a35] bg-transparent text-slate-300 hover:border-violet-500/40 hover:text-violet-300'
      }`}
    >
      <Star size={15} className={watched ? 'fill-violet-400 text-violet-400' : ''} />
      {watched ? 'Auf der Merkliste' : 'Auf die Merkliste'}
    </button>
  );
}
