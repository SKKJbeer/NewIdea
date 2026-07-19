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

  return (
    <button
      onClick={toggle}
      disabled={!mounted}
      className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 font-bold text-sm transition-all border ${
        watched
          ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
          : 'border-violet-600 bg-violet-600 text-white hover:bg-violet-500'
      }`}
    >
      <Star size={15} className={watched ? 'fill-violet-400 text-violet-400' : ''} />
      {watched ? 'Auf der Merkliste' : 'Auf die Merkliste'}
    </button>
  );
}
