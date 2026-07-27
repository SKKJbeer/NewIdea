import { describe, it, expect } from 'vitest';
import {
  isMissingTableError,
  classifyFreshness,
  pendingGuideTopics,
} from '@/lib/system-health';
import { GUIDE_TOPICS } from '@/lib/guide-topics';

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
