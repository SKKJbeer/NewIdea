import { getSupabase } from './supabase';
import { PokemonCard, PriceDataPoint } from '@/types';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function cardPrice(card: PokemonCard): number {
  return card.prices.market || card.prices.holofoil?.market || 0;
}

/** Hoechstalter des Quellstands, damit ein Preis als Tageswert gespeichert wird. */
export const SNAPSHOT_MAX_QUELLALTER_TAGE = 3;

/**
 * DARF DIESER PREIS ALS „PREIS VON HEUTE" IN DIE HISTORIE?
 *
 * Nur, wenn die QUELLE einen jungen Stand hat. pokemontcg.io liefert
 * Cardmarket-Werte, die 3 bis 10 Monate alt sind (gemessen 27.09.2026). Bis
 * v6.8.4 wurden sie trotzdem jeden Tag mit HEUTIGEM Datum gespeichert — die
 * Tageskurve bestand damit aus demselben alten Wert, taeglich neu datiert, und
 * sah aus wie ein stabiler Markt (Stolperstelle 53).
 */
export function snapshotTauglich(card: PokemonCard, jetzt = Date.now()): boolean {
  const stand = card.cmPrices?.updatedAt;
  if (!stand) return false;
  const t = Date.parse(stand.replace(/\//g, '-'));
  if (!Number.isFinite(t)) return false;
  return jetzt - t <= SNAPSHOT_MAX_QUELLALTER_TAGE * 86400_000;
}

// Speichert den heutigen Preis einer einzelnen Karte (idempotent pro Tag).
export async function recordPriceSnapshot(card: PokemonCard): Promise<boolean> {
  const sb = getSupabase();
  const price = cardPrice(card);
  if (!sb || !(price > 0) || !snapshotTauglich(card)) return false;

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
    .filter((c) => snapshotTauglich(c))
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

/**
 * Führt echte Tages-Snapshots und Cardmarket-Ankerpunkte zu EINER Reihe zusammen.
 *
 * ANLASS: Diese Zusammenführung stand nur auf der Karten-Detailseite. Das
 * Portfolio bekam ausschließlich die Cardmarket-Anker — also höchstens vier
 * Punkte je Karte (Ø 30 Tage, Ø 7 Tage, Ø gestern, Trend). Über ein Jahr
 * getragen ergab das eine wochenlang flache Linie mit zwei Stufen, während
 * zehntausende echte Tageswerte ungenutzt in der Datenbank lagen.
 *
 * Regel bleibt unverändert (Preis-Wahrheitspflicht): Bei Datumskollision
 * gewinnt IMMER der echte Snapshot. Es wird nichts interpoliert und nichts
 * erfunden — es werden nur alle vorhandenen echten Quellen genutzt.
 */
export function mergePriceHistory(
  anchors: PriceDataPoint[],
  stored: PriceDataPoint[],
): PriceDataPoint[] {
  const byDate = new Map<string, number>();
  for (const p of anchors) {
    if (p && p.date && p.price > 0) byDate.set(p.date, p.price);
  }
  for (const p of stored) {
    if (p && p.date && p.price > 0) byDate.set(p.date, p.price); // echter Snapshot gewinnt
  }
  return [...byDate.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Liest die gespeicherte Historie für mehrere Karten in EINER Abfrage. */
export async function getStoredPriceHistories(
  cardIds: string[],
  days = 365,
): Promise<Record<string, PriceDataPoint[]>> {
  const sb = getSupabase();
  if (!sb || cardIds.length === 0) return {};

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Eine Abfrage statt einer je Karte — bei 50 Positionen ist das der
  // Unterschied zwischen einem Rundlauf und fünfzig.
  const { data, error } = await sb
    .from('price_snapshots')
    .select('card_id, captured_on, price')
    .in('card_id', cardIds)
    .gte('captured_on', since.toISOString().split('T')[0])
    .order('captured_on', { ascending: true });

  if (error || !data) {
    if (error) console.error('Preis-Historie konnte nicht gelesen werden:', error.message);
    return {};
  }

  const byCard: Record<string, PriceDataPoint[]> = {};
  for (const r of data) {
    const id = r.card_id as string;
    (byCard[id] ??= []).push({ date: r.captured_on as string, price: Number(r.price) });
  }
  return byCard;
}
