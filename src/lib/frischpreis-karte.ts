import type { PokemonCard } from '@/types';
import { buildCardmarketHistory, calculateInvestmentScore } from './pokemon-api';
import { ladeDexSets, pruefeFrischenPreis, type DexSet, type FrischerPreis } from './tcgdex';

// FRISCHER PREIS FUER EINE EINZELNE KARTE.
//
// Die Kartendaten kommen von pokemontcg.io — deren Cardmarket-Werte sind
// 3 bis 10 Monate alt (gemessen 27.09.2026, `cardmarket.updatedAt`). Auf einer
// Kartenseite heisst „Preis" aber „Preis jetzt". Deshalb legt diese Datei den
// Cardmarket-Stand von TCGdex (Vortag) ueber die Karte — nur, wenn die
// Zuordnung per Namensprobe bestaetigt ist und der Stand wirklich jung ist.
// Sonst bleibt die Karte unveraendert, und die Seite nennt ihren alten
// Datenstand (Stolperstelle 53: Aktualitaet am Stand der QUELLE messen).

/** Aelter als das wird ein TCGdex-Stand nicht als „frisch" uebernommen. */
export const KARTE_FRISCH_MAX_TAGE = 3;
/** Zeitbudget fuer den Abruf auf der Kartenseite — laenger darf die Seite nicht warten. */
export const KARTE_FRISCH_ZEITLIMIT_MS = 4_000;

const SETS_GUELTIG_MS = 12 * 3600_000;
let setsCache: { bis: number; sets: Promise<DexSet[]> } | null = null;

/** Set-Liste von TCGdex, je Funktionsinstanz 12 h vorgehalten. Fehlschlaege werden nicht vorgehalten. */
export function dexSetsVorgehalten(jetzt = Date.now()): Promise<DexSet[]> {
  if (setsCache && setsCache.bis > jetzt) return setsCache.sets;
  const sets = ladeDexSets();
  setsCache = { bis: jetzt + SETS_GUELTIG_MS, sets };
  sets.catch(() => { setsCache = null; });
  return sets;
}

/**
 * Karte mit dem frischen Cardmarket-Stand. Rein: dieselbe Ableitung wie beim
 * Einlesen aus pokemontcg.io (Trend gegen Ø 30, Anker fuer den Verlauf), nur
 * mit den Werten von TCGdex.
 */
export function mitFrischpreis(card: PokemonCard, p: FrischerPreis): PokemonCard {
  const cm: Record<string, number> = {
    trendPrice: p.trend,
    averageSellPrice: p.avg ?? 0,
    lowPrice: p.low ?? 0,
    avg1: p.avg1 ?? 0,
    avg7: p.avg7 ?? 0,
    avg30: p.avg30 ?? 0,
  };
  const hist = buildCardmarketHistory(cm);
  const trendPercent = p.avg30 ? Math.round(((p.trend - p.avg30) / p.avg30) * 1000) / 10 : 0;
  const neu: PokemonCard = {
    ...card,
    prices: { ...card.prices, market: p.trend },
    priceHistory: hist.length >= 2 ? hist : undefined,
    trendPercent,
    priceSource: 'cardmarket',
    realData: p.avg30 !== null,
    cmPrices: {
      trend: p.trend,
      low: p.low ?? undefined,
      avgSell: p.avg ?? undefined,
      avg30: p.avg30 ?? undefined,
      updatedAt: p.updated,
      quelle: 'tcgdex',
    },
  };
  neu.investmentScore = calculateInvestmentScore(neu);
  return neu;
}

/** Ist der Stand jung genug? Ungueltige Datumswerte sind es nie (Stolperstelle 46). */
export function standFrisch(updated: string, jetzt = Date.now(), maxTage = KARTE_FRISCH_MAX_TAGE): boolean {
  const t = Date.parse(updated);
  return Number.isFinite(t) && jetzt - t <= maxTage * 86400_000 && t <= jetzt + 86400_000;
}

/**
 * Karte mit frischem Preis, wenn einer sicher zuzuordnen ist — sonst die Karte
 * unveraendert. Wirft nie: Ein Ausfall bei TCGdex darf keine Kartenseite
 * kosten, er laesst nur den alten, als alt gekennzeichneten Stand stehen.
 */
export async function karteMitFrischpreis(card: PokemonCard, zeitlimitMs = KARTE_FRISCH_ZEITLIMIT_MS): Promise<PokemonCard> {
  if (!card.number) return card;
  try {
    const sets = await dexSetsVorgehalten();
    const e = await pruefeFrischenPreis(
      { name: card.name, setCode: card.setCode, set: card.set, number: card.number },
      sets,
      zeitlimitMs,
    );
    if (!e.ok || !standFrisch(e.preis.updated)) return card;
    return mitFrischpreis(card, e.preis);
  } catch (err) {
    console.warn(`[frischpreis-karte] ${card.id}:`, err instanceof Error ? err.message : err);
    return card;
  }
}
