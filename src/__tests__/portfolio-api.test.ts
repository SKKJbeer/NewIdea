import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PokemonCard } from '@/types';

// Funktionstest der Route, die das Portfolio mit Live-Preisen versorgt.
//
// Der Endpunkt ist der einzige Weg, auf dem echte Marktdaten ins Portfolio
// kommen. Bricht er still, sieht der Nutzer weiter seine Kaufpreise und hält
// sie für aktuell. Getestet wird deshalb nicht nur der Normalfall, sondern
// vor allem das Verhalten bei kaputten Eingaben und ausfallenden Upstreams.

const fetchCardById = vi.fn();
const fetchCMLanguagePrice = vi.fn();

vi.mock('@/lib/pokemon-api', () => ({
  fetchCardById: (...args: unknown[]) => fetchCardById(...args),
}));
vi.mock('@/lib/cardmarket-api', () => ({
  fetchCMLanguagePrice: (...args: unknown[]) => fetchCMLanguagePrice(...args),
}));

// Die Route schreibt die Preise der Portfolio-Karten nach der Antwort mit —
// darüber bauen genau die Karten Historie auf, die jemanden interessieren.
const recordPriceSnapshots = vi.fn(async () => 0);
const getStoredPriceHistories = vi.fn(async () => ({}) as Record<string, Array<{ date: string; price: number }>>);
vi.mock('@/lib/price-history', async (original) => {
  const echt = await original<typeof import('@/lib/price-history')>();
  return {
    ...echt,
    recordPriceSnapshots: (...args: unknown[]) => recordPriceSnapshots(...(args as [])),
    getStoredPriceHistories: (...args: unknown[]) => getStoredPriceHistories(...(args as [])),
  };
});

// `after()` verlangt einen Request-Kontext, den es im Test nicht gibt. Der
// Rückruf wird deshalb sofort ausgeführt — geprüft wird ja sein Inhalt.
vi.mock('next/server', async (original) => {
  const echt = await original<typeof import('next/server')>();
  return { ...echt, after: (fn: () => unknown) => { void fn(); } };
});

const { POST } = await import('@/app/api/portfolio/prices/route');

function card(id: string, market = 100): PokemonCard {
  return {
    id,
    name: `Card ${id}`,
    set: 'Test-Set',
    setCode: 'tst',
    rarity: 'Rare',
    imageUrl: `https://images.pokemontcg.io/tst/${id}.png`,
    prices: { market },
    priceHistory: [{ date: '2026-07-20', price: market - 5 }],
  } as PokemonCard;
}

function post(body: unknown): Request {
  return new Request('https://example.test/api/portfolio/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  fetchCardById.mockReset();
  fetchCMLanguagePrice.mockReset();
});

describe('POST /api/portfolio/prices — Normalfall', () => {
  it('liefert Preis, Verlauf und Stammdaten je Karte', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id, 120));
    const res = await POST(post({ cards: [{ id: 'tst-1', language: 'EN', name: 'Card tst-1' }] }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data['tst-1']).toMatchObject({
      price: 120,
      name: 'Card tst-1',
      set: 'Test-Set',
      setCode: 'tst',
      priceLanguage: 'EN',
    });
    expect(data['tst-1'].priceHistory).toHaveLength(1);
  });

  it('verarbeitet mehrere Karten in einem Aufruf', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id));
    const res = await POST(post({
      cards: [{ id: 'a-1' }, { id: 'a-2' }, { id: 'a-3' }],
    }));
    expect(Object.keys(await res.json())).toHaveLength(3);
  });

  it('erlaubt Zwischenspeichern auf dem CDN', async () => {
    // Ohne Cache trifft jeder Seitenaufruf die TCG-API und läuft ins Rate-Limit.
    fetchCardById.mockImplementation(async (id: string) => card(id));
    const res = await POST(post({ cards: [{ id: 'a-1' }] }));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300');
  });
});

describe('POST /api/portfolio/prices — Sprachpreise', () => {
  it('nimmt den sprachspezifischen Cardmarket-Preis, wenn er vorliegt', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id, 100));
    fetchCMLanguagePrice.mockResolvedValue(145);

    const res = await POST(post({ cards: [{ id: 'a-1', language: 'DE', name: 'Glurak ex' }] }));
    const data = await res.json();
    expect(data['a-1'].price).toBe(145);
    expect(data['a-1'].priceLanguage).toBe('DE');
    expect(fetchCMLanguagePrice).toHaveBeenCalledWith('Glurak ex', 'DE');
  });

  it('fällt auf den englischen Preis zurück, wenn kein Sprachpreis kommt', async () => {
    // Ohne konfigurierte Cardmarket-Schlüssel ist das der Normalfall — der
    // Nutzer muss trotzdem einen Preis sehen, nur eben als EN gekennzeichnet.
    fetchCardById.mockImplementation(async (id: string) => card(id, 100));
    fetchCMLanguagePrice.mockResolvedValue(null);

    const res = await POST(post({ cards: [{ id: 'a-1', language: 'JP', name: 'Karte' }] }));
    const data = await res.json();
    expect(data['a-1'].price).toBe(100);
    expect(data['a-1'].priceLanguage).toBe('EN');
  });

  it('fragt für englische Karten gar nicht erst bei Cardmarket an', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id));
    await POST(post({ cards: [{ id: 'a-1', language: 'EN' }] }));
    expect(fetchCMLanguagePrice).not.toHaveBeenCalled();
  });

  it('nutzt den Kartennamen aus der API, wenn keiner mitgeschickt wurde', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id));
    fetchCMLanguagePrice.mockResolvedValue(80);
    await POST(post({ cards: [{ id: 'a-1', language: 'DE' }] }));
    expect(fetchCMLanguagePrice).toHaveBeenCalledWith('Card a-1', 'DE');
  });
});

describe('POST /api/portfolio/prices — kaputte Eingaben', () => {
  it('antwortet auf einen leeren Rumpf mit einem leeren Objekt', async () => {
    const res = await POST(post({}));
    expect(await res.json()).toEqual({});
    expect(fetchCardById).not.toHaveBeenCalled();
  });

  it('antwortet auf ungültiges JSON mit einem leeren Objekt statt zu werfen', async () => {
    const req = new Request('https://example.test/api/portfolio/prices', {
      method: 'POST',
      body: 'kein json',
    });
    await expect(POST(req)).resolves.toBeDefined();
    expect(await (await POST(req)).json()).toEqual({});
  });

  it('überspringt Einträge ohne gültige ID', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id));
    const res = await POST(post({ cards: [{ id: 123 }, { name: 'ohne id' }, { id: 'a-1' }] }));
    expect(Object.keys(await res.json())).toEqual(['a-1']);
  });

  it('begrenzt die Anzahl der Karten pro Aufruf', async () => {
    // Sonst könnte ein einziger Aufruf 500 Upstream-Anfragen auslösen.
    fetchCardById.mockImplementation(async (id: string) => card(id));
    const viele = Array.from({ length: 120 }, (_, i) => ({ id: `a-${i}` }));
    await POST(post({ cards: viele }));
    expect(fetchCardById).toHaveBeenCalledTimes(50);
  });

  it('versteht das alte Format mit reinen IDs', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id));
    const res = await POST(post({ cardIds: ['a-1', 'a-2'] }));
    const data = await res.json();
    expect(Object.keys(data).sort()).toEqual(['a-1', 'a-2']);
    expect(data['a-1'].priceLanguage).toBe('EN');
  });

  it('antwortet auf eine leere Kartenliste mit einem leeren Objekt', async () => {
    const res = await POST(post({ cards: [] }));
    expect(await res.json()).toEqual({});
  });
});

describe('POST /api/portfolio/prices — Ausfälle einzelner Karten', () => {
  it('liefert die übrigen Karten, wenn eine wirft', async () => {
    // Promise.allSettled: Eine kaputte Karte darf nicht das ganze Portfolio
    // ohne Live-Preise dastehen lassen.
    fetchCardById.mockImplementation(async (id: string) => {
      if (id === 'kaputt-1') throw new Error('TCG-API 500');
      return card(id);
    });
    const res = await POST(post({ cards: [{ id: 'a-1' }, { id: 'kaputt-1' }, { id: 'a-2' }] }));
    const data = await res.json();
    expect(Object.keys(data).sort()).toEqual(['a-1', 'a-2']);
  });

  it('lässt eine unbekannte Karte einfach weg', async () => {
    fetchCardById.mockImplementation(async (id: string) => (id === 'gibt-es-nicht' ? null : card(id)));
    const res = await POST(post({ cards: [{ id: 'gibt-es-nicht' }, { id: 'a-1' }] }));
    expect(Object.keys(await res.json())).toEqual(['a-1']);
  });

  it('bricht die Antwort nicht ab, wenn der Sprachpreis wirft', async () => {
    fetchCardById.mockImplementation(async (id: string) => card(id, 90));
    fetchCMLanguagePrice.mockRejectedValue(new Error('Cardmarket down'));
    const res = await POST(post({ cards: [{ id: 'a-1', language: 'DE' }, { id: 'a-2' }] }));
    const data = await res.json();
    // Die englische Karte kommt in jedem Fall durch.
    expect(data['a-2'].price).toBe(90);
  });

  it('gibt ein leeres Objekt zurück, wenn ALLE Karten scheitern', async () => {
    // Wichtig: kein 500er. Die Seite zeigt dann Kaufpreise plus Hinweis —
    // ein Fehlerstatus würde die ganze Portfolio-Ansicht leeren.
    fetchCardById.mockRejectedValue(new Error('alles down'));
    const res = await POST(post({ cards: [{ id: 'a-1' }, { id: 'a-2' }] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it('liefert einen leeren Verlauf statt undefined', async () => {
    // Die Grafik iteriert über priceHistory — undefined würde sie werfen lassen.
    fetchCardById.mockImplementation(async (id: string) => {
      const c = card(id);
      delete (c as { priceHistory?: unknown }).priceHistory;
      return c;
    });
    const res = await POST(post({ cards: [{ id: 'a-1' }] }));
    expect((await res.json())['a-1'].priceHistory).toEqual([]);
  });
});
