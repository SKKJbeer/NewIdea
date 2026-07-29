import { describe, it, expect, vi, beforeEach } from 'vitest';

// Funktionstest der Konto-Route. Der Zugriffsschutz ist hier das Wichtigste:
// Ein Fehler bedeutet, dass jemand fremde Portfolios sieht oder überschreibt.
//
// Die Datenbank-Antworten werden nachgebildet, damit die Tests ohne Supabase
// laufen. Die zweite Sicherung — Row Level Security in der Tabelle — lässt
// sich hier nicht prüfen; sie steht im Setup-SQL (system-health.ts) und wird
// dort vom Monitoring eingefordert.

const serverAuthClient = vi.fn();
const currentUser = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

vi.mock('@/lib/supabase-auth', async (original) => {
  const echt = await original<typeof import('@/lib/supabase-auth')>();
  return {
    ...echt,
    serverAuthClient: (...args: unknown[]) => serverAuthClient(...args),
    currentUser: (...args: unknown[]) => currentUser(...args),
  };
});

const { GET, PUT } = await import('@/app/api/portfolio/sync/route');

/** Baut einen Supabase-Client nach, so weit die Route ihn benutzt. */
function fakeClient({
  rows = [] as Array<Record<string, unknown>>,
  selectError = null as string | null,
  deleteError = null as string | null,
  upsertError = null as string | null,
} = {}) {
  const aufrufe = { upserted: [] as unknown[], deleted: 0 };

  const query = {
    select: () => query,
    eq: () => query,
    order: async () => ({ data: selectError ? null : rows, error: selectError ? { message: selectError } : null }),
    delete: () => deleteQuery,
    upsert: async (werte: unknown[]) => {
      aufrufe.upserted = werte;
      return { error: upsertError ? { message: upsertError } : null };
    },
  };

  const deleteQuery = {
    eq: () => deleteQuery,
    not: async () => {
      aufrufe.deleted++;
      return { error: deleteError ? { message: deleteError } : null };
    },
    then: (resolve: (v: unknown) => void) => {
      aufrufe.deleted++;
      resolve({ error: deleteError ? { message: deleteError } : null });
    },
  };

  return { client: { from: () => query }, aufrufe };
}

function putRequest(body: unknown): Request {
  return new Request('https://example.test/api/portfolio/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const KARTE = {
  cardId: 'sv3pt5-25',
  cardName: 'Glurak ex',
  setName: 'Pokémon 151',
  setCode: 'sv3pt5',
  imageUrl: 'https://images.pokemontcg.io/sv3pt5/25.png',
  quantity: 2,
  purchasePrice: 120,
  purchaseDate: '2026-07-01',
  language: 'DE',
  addedAt: '2026-07-01T10:00:00Z',
};

beforeEach(() => {
  serverAuthClient.mockReset();
  currentUser.mockReset();
});

describe('GET — ohne Einrichtung und ohne Anmeldung', () => {
  it('meldet fehlende Einrichtung, ohne zu scheitern', async () => {
    // Die Seite arbeitet dann mit dem Browser-Speicher weiter.
    serverAuthClient.mockReturnValue(null);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ configured: false, holdings: [] });
  });

  it('gibt für einen abgemeldeten Besucher keine Daten heraus', async () => {
    serverAuthClient.mockReturnValue(fakeClient().client);
    currentUser.mockResolvedValue(null);
    const res = await GET();
    const daten = await res.json();
    expect(daten.signedIn).toBe(false);
    expect(daten.holdings).toEqual([]);
  });
});

describe('GET — angemeldet', () => {
  it('liefert die Positionen des Nutzers in der Form der Oberfläche', async () => {
    const { client } = fakeClient({
      rows: [{
        user_id: 'u1', card_id: 'sv3pt5-25', card_name: 'Glurak ex', set_name: 'Pokémon 151',
        set_code: 'sv3pt5', image_url: 'https://images.pokemontcg.io/sv3pt5/25.png',
        quantity: 2, purchase_price: 120, purchase_date: '2026-07-01',
        language: 'DE', added_at: '2026-07-01T10:00:00Z',
      }],
    });
    serverAuthClient.mockReturnValue(client);
    currentUser.mockResolvedValue({ id: 'u1', email: 'a@b.de', user_metadata: { full_name: 'Max' } });

    const daten = await (await GET()).json();
    expect(daten.signedIn).toBe(true);
    expect(daten.user).toEqual({ name: 'Max', email: 'a@b.de' });
    expect(daten.holdings).toHaveLength(1);
    expect(daten.holdings[0]).toMatchObject({ cardId: 'sv3pt5-25', quantity: 2, language: 'DE' });
  });

  it('meldet einen Lesefehler, ohne die Seite zu blockieren', async () => {
    // Kein 500er: Die Portfolio-Ansicht soll weiter stehen, nur eben mit dem
    // lokalen Bestand und einem Hinweis.
    const { client } = fakeClient({ selectError: 'relation does not exist' });
    serverAuthClient.mockReturnValue(client);
    currentUser.mockResolvedValue({ id: 'u1', email: null, user_metadata: {} });

    const res = await GET();
    expect(res.status).toBe(200);
    const daten = await res.json();
    expect(daten.error).toBe('load_failed');
    expect(daten.holdings).toEqual([]);
  });

  it('gibt keine internen Fehlerdetails nach außen', async () => {
    const { client } = fakeClient({ selectError: 'permission denied for schema public at /var/task/x' });
    serverAuthClient.mockReturnValue(client);
    currentUser.mockResolvedValue({ id: 'u1', email: null, user_metadata: {} });
    const text = JSON.stringify(await (await GET()).json());
    expect(text).not.toContain('/var/task');
    expect(text).not.toContain('permission denied');
  });
});

describe('PUT — Zugriffsschutz', () => {
  it('weist einen abgemeldeten Aufruf mit 401 ab', async () => {
    serverAuthClient.mockReturnValue(fakeClient().client);
    currentUser.mockResolvedValue(null);
    const res = await PUT(putRequest({ holdings: [KARTE] }));
    expect(res.status).toBe(401);
  });

  it('antwortet ohne Einrichtung mit 503', async () => {
    serverAuthClient.mockReturnValue(null);
    const res = await PUT(putRequest({ holdings: [] }));
    expect(res.status).toBe(503);
  });

  it('schreibt jede Zeile mit der Kennung des angemeldeten Nutzers', async () => {
    // Ohne das könnte ein Aufruf Positionen einem fremden Konto zuordnen.
    const { client, aufrufe } = fakeClient();
    serverAuthClient.mockReturnValue(client);
    currentUser.mockResolvedValue({ id: 'u-echt', email: null, user_metadata: {} });

    await PUT(putRequest({ holdings: [{ ...KARTE, user_id: 'u-fremd' }] }));
    expect((aufrufe.upserted as Array<{ user_id: string }>)[0].user_id).toBe('u-echt');
  });
});

describe('PUT — Speichern', () => {
  beforeEach(() => {
    currentUser.mockResolvedValue({ id: 'u1', email: null, user_metadata: {} });
  });

  it('speichert die übergebenen Positionen', async () => {
    const { client, aufrufe } = fakeClient();
    serverAuthClient.mockReturnValue(client);
    const res = await PUT(putRequest({ holdings: [KARTE] }));
    expect(await res.json()).toEqual({ saved: 1 });
    expect(aufrufe.upserted).toHaveLength(1);
  });

  it('räumt entfernte Positionen ab', async () => {
    const { client, aufrufe } = fakeClient();
    serverAuthClient.mockReturnValue(client);
    await PUT(putRequest({ holdings: [KARTE] }));
    expect(aufrufe.deleted).toBeGreaterThan(0);
  });

  it('leert das Konto, wenn der Bestand leer übergeben wird', async () => {
    const { client, aufrufe } = fakeClient();
    serverAuthClient.mockReturnValue(client);
    const res = await PUT(putRequest({ holdings: [] }));
    expect(await res.json()).toEqual({ saved: 0 });
    expect(aufrufe.upserted).toHaveLength(0);
    expect(aufrufe.deleted).toBeGreaterThan(0);
  });

  it('weist einen Rumpf ohne Positionsliste ab', async () => {
    serverAuthClient.mockReturnValue(fakeClient().client);
    expect((await PUT(putRequest({}))).status).toBe(400);
    expect((await PUT(putRequest({ holdings: 'keine liste' }))).status).toBe(400);
  });

  it('überspringt Einträge ohne Karten-ID', async () => {
    const { client, aufrufe } = fakeClient();
    serverAuthClient.mockReturnValue(client);
    await PUT(putRequest({ holdings: [KARTE, { cardName: 'ohne id' }, { cardId: '' }] }));
    expect(aufrufe.upserted).toHaveLength(1);
  });

  it('begrenzt die Anzahl der Positionen', async () => {
    const { client, aufrufe } = fakeClient();
    serverAuthClient.mockReturnValue(client);
    const viele = Array.from({ length: 900 }, (_, i) => ({ ...KARTE, cardId: `c-${i}` }));
    const res = await PUT(putRequest({ holdings: viele }));
    expect((await res.json()).saved).toBe(500);
    expect(aufrufe.upserted).toHaveLength(500);
  });

  it('normalisiert beschädigte Positionen vor dem Speichern', async () => {
    const { client, aufrufe } = fakeClient();
    serverAuthClient.mockReturnValue(client);
    await PUT(putRequest({ holdings: [{ cardId: 'a', quantity: null, purchasePrice: null }] }));
    const zeile = (aufrufe.upserted as Array<{ quantity: number; purchase_price: number }>)[0];
    expect(zeile.quantity).toBe(1);
    expect(zeile.purchase_price).toBe(0);
  });

  it('meldet einen Schreibfehler als 500 ohne Details', async () => {
    const { client } = fakeClient({ upsertError: 'duplicate key value at /var/task/db.js' });
    serverAuthClient.mockReturnValue(client);
    const res = await PUT(putRequest({ holdings: [KARTE] }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'save_failed' });
  });

  it('meldet einen Aufräumfehler, ohne halb zu speichern', async () => {
    const { client, aufrufe } = fakeClient({ deleteError: 'permission denied' });
    serverAuthClient.mockReturnValue(client);
    const res = await PUT(putRequest({ holdings: [KARTE] }));
    expect(res.status).toBe(500);
    expect(aufrufe.upserted).toHaveLength(0);
  });
});
