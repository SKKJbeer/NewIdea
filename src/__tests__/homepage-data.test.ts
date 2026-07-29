import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PokemonCard } from '@/types';

// Stolperstelle 19: Die Startseite ist statisch mit ISR (1 h). Fällt der
// TCG-Abruf genau während einer Neuerzeugung aus, wurde bis v2.24.0 die LEERE
// Seite gecacht und stundenlang ausgeliefert. `getHomepageCards` fängt das mit
// dem letzten gespeicherten Marktbericht ab.
//
// Die Mocks stehen hier bewusst als Fabrik-Funktionen — so lässt sich pro Test
// ein anderes Verhalten der TCG-API simulieren (leer, Ausnahme, Erfolg).

const fetchTopValueCards = vi.fn();
const loadLatestMarketReport = vi.fn();

vi.mock('@/lib/pokemon-api', () => ({
  fetchTopValueCards: (...args: unknown[]) => fetchTopValueCards(...args),
}));
vi.mock('@/lib/market-report-storage', () => ({
  loadLatestMarketReport: (...args: unknown[]) => loadLatestMarketReport(...args),
}));

const { getHomepageCards } = await import('@/lib/homepage-data');

function card(id: string): PokemonCard {
  return {
    id,
    name: `Card ${id}`,
    set: 'Set',
    setCode: 'st',
    rarity: 'Rare',
    imageUrl: `https://images.pokemontcg.io/st/${id}.png`,
    prices: { market: 10 },
    trendPercent: 1,
  } as PokemonCard;
}

beforeEach(() => {
  fetchTopValueCards.mockReset();
  loadLatestMarketReport.mockReset();
});

describe('getHomepageCards', () => {
  it('nutzt die Live-Daten, wenn der Abruf klappt', async () => {
    fetchTopValueCards.mockResolvedValue([card('a'), card('b')]);
    const result = await getHomepageCards(50);
    expect(result.map((c) => c.id)).toEqual(['a', 'b']);
    // Der Fallback darf dann gar nicht erst angefasst werden.
    expect(loadLatestMarketReport).not.toHaveBeenCalled();
  });

  it('reicht das Limit an den Live-Abruf durch', async () => {
    fetchTopValueCards.mockResolvedValue([card('a')]);
    await getHomepageCards(12);
    expect(fetchTopValueCards).toHaveBeenCalledWith(12);
  });

  it('greift auf den letzten Marktbericht zurück, wenn der Abruf LEER ist', async () => {
    // Genau dieser Fall stand als leere Startseite live: kein Fehler, nur [].
    fetchTopValueCards.mockResolvedValue([]);
    loadLatestMarketReport.mockResolvedValue({
      topValue: [card('x')],
      topGainers: [card('y')],
    });
    const result = await getHomepageCards();
    expect(result.map((c) => c.id)).toEqual(['x', 'y']);
  });

  it('greift auf den Marktbericht zurück, wenn der Abruf WIRFT', async () => {
    fetchTopValueCards.mockRejectedValue(new Error('429 Too Many Requests'));
    loadLatestMarketReport.mockResolvedValue({ topValue: [card('x')], topGainers: [] });
    const result = await getHomepageCards();
    expect(result.map((c) => c.id)).toEqual(['x']);
  });

  it('entfernt Duplikate zwischen topValue und topGainers', async () => {
    // Eine wertvolle Karte kann gleichzeitig Top-Gewinner sein — sonst stünde
    // sie zweimal in derselben Liste.
    fetchTopValueCards.mockResolvedValue([]);
    loadLatestMarketReport.mockResolvedValue({
      topValue: [card('a'), card('b')],
      topGainers: [card('b'), card('c')],
    });
    const result = await getHomepageCards();
    expect(result.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('gibt ein leeres Array zurück, wenn auch der Fallback nichts hat', async () => {
    // Wichtig: KEINE erfundenen Platzhalter. Die Seite rendert dann einen
    // ehrlichen Fehlerzustand (Stolperstelle 29).
    fetchTopValueCards.mockResolvedValue([]);
    loadLatestMarketReport.mockResolvedValue(null);
    expect(await getHomepageCards()).toEqual([]);
  });

  it('überlebt einen Fehler auch im Fallback', async () => {
    fetchTopValueCards.mockRejectedValue(new Error('down'));
    loadLatestMarketReport.mockRejectedValue(new Error('supabase down'));
    await expect(getHomepageCards()).resolves.toEqual([]);
  });

  it('gibt ein leeres Array zurück, wenn der Bericht leere Listen enthält', async () => {
    fetchTopValueCards.mockResolvedValue([]);
    loadLatestMarketReport.mockResolvedValue({ topValue: [], topGainers: [] });
    expect(await getHomepageCards()).toEqual([]);
  });
});
