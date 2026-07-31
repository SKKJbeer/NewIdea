import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isMissingTableError,
  classifyFreshness,
  pendingGuideTopics,
  probeTable,
} from '@/lib/system-health';
import { getSupabase } from '@/lib/supabase';
import { GUIDE_TOPICS } from '@/lib/guide-topics';

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(),
  isSupabaseConfigured: () => true,
}));

// Diese Tests sichern die Diagnose ab, die den stillen Ausfall der
// Guide-Pipeline überhaupt erst sichtbar macht.

describe('isMissingTableError', () => {
  it('erkennt den Postgres-Code für fehlende Tabellen', () => {
    expect(isMissingTableError({ code: '42P01', message: 'x' })).toBe(true);
  });

  it('erkennt die Meldung auch ohne Code', () => {
    expect(
      isMissingTableError({ message: 'relation "public.generated_guides" does not exist' }),
    ).toBe(true);
    expect(isMissingTableError({ message: 'Could not find the table in the schema cache' })).toBe(true);
  });

  it('meldet andere Fehler NICHT als fehlende Tabelle', () => {
    expect(isMissingTableError({ code: '23505', message: 'duplicate key' })).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError('boom')).toBe(false);
  });
});

describe('classifyFreshness', () => {
  const now = new Date('2026-07-27T10:00:00Z');

  it('wertet fehlenden Stand als leer', () => {
    expect(classifyFreshness(null, 2, now)).toBe('empty');
  });

  it('akzeptiert frische Datenstände', () => {
    expect(classifyFreshness('2026-07-26', 2, now)).toBe('ok');
    expect(classifyFreshness('2026-07-27', 2, now)).toBe('ok');
  });

  it('markiert zu alte Datenstände als veraltet', () => {
    expect(classifyFreshness('2026-07-01', 2, now)).toBe('stale');
  });

  it('kommt mit vollen Zeitstempeln zurecht', () => {
    expect(classifyFreshness('2026-07-26T08:00:00Z', 2, now)).toBe('ok');
    expect(classifyFreshness('2026-06-01T08:00:00Z', 10, now)).toBe('stale');
  });

  it('meldet unlesbare Werte als unklar statt zu raten', () => {
    expect(classifyFreshness('kein-datum', 2, now)).toBe('unknown');
  });
});

// PROBE GEGEN DIE ANTWORT EINER FEHLENDEN TABELLE
//
// Anlass: Das Monitoring meldete `market_index` als „vorhanden, 0 Zeilen",
// während jeder Schreibversuch mit „Could not find the table" scheiterte. Ursache
// war die Reihenfolge der Abfragen — die Zählung lief zuerst und benutzt
// `head: true`, also eine HEAD-Anfrage. Auf eine fehlende Tabelle antwortet
// PostgREST dann mit 404 und LEEREM Körper: Der Client hat nichts zu lesen und
// liefert `error: null, count: null`, woraus `count ?? 0` eine Null-Zeilen-Meldung
// machte. Der Nachbau unten bildet genau dieses Verhalten ab.

interface FakeAntwort {
  data?: unknown[] | null;
  error?: { code?: string; message: string } | null;
  count?: number | null;
}

function fakeClient(leseAntwort: FakeAntwort, zaehlAntwort: FakeAntwort) {
  return {
    from() {
      return {
        select(_spalten: string, optionen?: { head?: boolean }) {
          if (optionen?.head) {
            // Zählabfrage: endet hier, ist direkt awaitbar.
            return Promise.resolve({ count: null, error: null, ...zaehlAntwort });
          }
          const kette = {
            order: () => kette,
            limit: () => Promise.resolve({ data: null, error: null, ...leseAntwort }),
          };
          return kette;
        },
      };
    },
  };
}

const spec = {
  table: 'market_index',
  label: 'Indexstände',
  effect: 'Marktkontext',
  dateColumn: 'captured_on',
  maxAgeDays: 2,
};

describe('probeTable', () => {
  beforeEach(() => vi.mocked(getSupabase).mockReset());

  it('meldet eine fehlende Tabelle als fehlend — auch wenn die Zählung stumm bleibt', async () => {
    vi.mocked(getSupabase).mockReturnValue(
      fakeClient(
        {
          error: {
            code: 'PGRST205',
            message: "Could not find the table 'public.market_index' in the schema cache",
          },
        },
        { count: null, error: null },
      ) as never,
    );

    const health = await probeTable(spec);
    expect(health.missing).toBe(true);
    expect(health.ok).toBe(false);
    // Ohne fertiges SQL bleibt der Befund folgenlos — das ist der halbe Zweck.
    expect(health.setupSql).toContain('CREATE TABLE');
    expect(health.rows).toBeNull();
  });

  it('meldet eine vorhandene leere Tabelle als vorhanden', async () => {
    vi.mocked(getSupabase).mockReturnValue(
      fakeClient({ data: [] }, { count: 0 }) as never,
    );

    const health = await probeTable(spec);
    expect(health.missing).toBe(false);
    expect(health.ok).toBe(true);
    expect(health.rows).toBe(0);
    expect(health.freshness).toBe('empty');
  });

  it('hält eine nicht gezählte Tabelle mit Eintrag NICHT für leer', async () => {
    const heute = new Date().toISOString().split('T')[0];
    vi.mocked(getSupabase).mockReturnValue(
      fakeClient({ data: [{ captured_on: heute }] }, { count: null }) as never,
    );

    const health = await probeTable(spec);
    expect(health.ok).toBe(true);
    // `null` heißt „nicht gezählt", nicht „keine Zeilen".
    expect(health.rows).toBeNull();
    expect(health.freshness).toBe('ok');
  });
});

describe('pendingGuideTopics', () => {
  it('liefert alle Themen, wenn noch keines erzeugt wurde', () => {
    expect(pendingGuideTopics([])).toHaveLength(GUIDE_TOPICS.length);
  });

  it('blendet bereits erzeugte Themen aus', () => {
    const first = GUIDE_TOPICS[0].slug;
    const pending = pendingGuideTopics([first]);
    expect(pending).not.toContain(first);
    expect(pending).toHaveLength(GUIDE_TOPICS.length - 1);
  });

  it('ist leer, wenn alle Themen erzeugt sind', () => {
    expect(pendingGuideTopics(GUIDE_TOPICS.map((t) => t.slug))).toHaveLength(0);
  });
});
