import { getSupabase } from './supabase';
import { PokemonCard, PriceDataPoint } from '@/types';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function cardPrice(card: PokemonCard): number {
  return card.prices.market || card.prices.holofoil?.market || 0;
}

// Speichert den heutigen Preis einer einzelnen Karte (idempotent pro Tag).
export async function recordPriceSnapshot(card: PokemonCard): Promise<boolean> {
  const sb = getSupabase();
  const price = cardPrice(card);
  if (!sb || !(price > 0)) return false;

  const { error } = await sb.from('price_snapshots').upsert(
    {
      card_id: card.id,
      card_name: card.name,
      price,
      source: card.priceSource || 'cardmarket',
      captured_on: today(),
    },
    { onConflict: 'card_id,captured_on' }
  );
  return !error;
}

// Speichert die heutigen Preise vieler Karten in einem Rutsch (für den Cron-Job).
export async function recordPriceSnapshots(cards: PokemonCard[]): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  const captured_on = today();
  const rows = cards
    .map((c) => ({
      card_id: c.id,
      card_name: c.name,
      price: cardPrice(c),
      source: c.priceSource || 'cardmarket',
      captured_on,
    }))
    .filter((r) => r.price > 0);

  if (rows.length === 0) return 0;
  const { error } = await sb.from('price_snapshots').upsert(rows, { onConflict: 'card_id,captured_on' });
  return error ? 0 : rows.length;
}

// Liest die echte, tageweise gespeicherte Preis-Historie einer Karte.
export async function getStoredPriceHistory(cardId: string, days = 90): Promise<PriceDataPoint[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await sb
    .from('price_snapshots')
    .select('captured_on, price')
    .eq('card_id', cardId)
    .gte('captured_on', since.toISOString().split('T')[0])
    .order('captured_on', { ascending: true });

  if (error || !data) return [];
  return data.map((r) => ({ date: r.captured_on as string, price: Number(r.price) }));
}
