// Pure Merklisten-Logik — kein React, keine Server-Abhängigkeiten, voll testbar.
// Persistenz: localStorage (Key WATCHLIST_KEY), analog zum Portfolio.

export interface WatchlistItem {
  cardId: string;
  cardName: string;
  setName: string;
  setCode: string;
  imageUrl: string;
  priceAtAdd: number;
  addedAt: string; // YYYY-MM-DD
}

export const WATCHLIST_KEY = 'watchlist_v1';

/** Parst den localStorage-Rohwert defensiv — kaputte/fremde Daten ergeben eine leere Liste. */
export function parseWatchlist(raw: string | null): WatchlistItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is WatchlistItem => !!x && typeof x.cardId === 'string' && typeof x.cardName === 'string',
    );
  } catch {
    return [];
  }
}

export function isWatched(list: WatchlistItem[], cardId: string): boolean {
  return list.some((i) => i.cardId === cardId);
}

/** Fügt die Karte hinzu (neueste zuerst) bzw. entfernt sie, wenn sie schon beobachtet wird. */
export function toggleWatch(list: WatchlistItem[], item: WatchlistItem): WatchlistItem[] {
  if (isWatched(list, item.cardId)) {
    return list.filter((i) => i.cardId !== item.cardId);
  }
  return [item, ...list];
}

/**
 * Preisveränderung seit Vormerkung. null wenn kein Vergleich möglich
 * (kein Startpreis erfasst oder kein aktueller Preis verfügbar).
 */
export function watchChange(
  priceAtAdd: number,
  currentPrice: number,
): { abs: number; pct: number } | null {
  if (priceAtAdd <= 0 || currentPrice <= 0) return null;
  const abs = currentPrice - priceAtAdd;
  return { abs, pct: (abs / priceAtAdd) * 100 };
}
