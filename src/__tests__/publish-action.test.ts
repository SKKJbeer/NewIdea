import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MarketSummary } from '@/types';

// Die Veröffentlichung des Marktberichts aus dem Studio.
//
// VORGESCHICHTE: Die Aktion rief ausschließlich `revalidatePath` auf und
// speicherte NICHTS. Sie konnte gar nicht fehlschlagen — das Studio zeigte
// danach immer „Live!", während auf der öffentlichen Seite weiterhin
// „Erster Bericht noch ausstehend" stand. Eine Erfolgsmeldung ohne Deckung.
//
// Diese Tests halten fest, dass ein „Live!" ab jetzt bedeutet: Der Text ist
// tatsächlich in der Datenbank.

const isStudioAuthed = vi.fn();
const saveMarketReport = vi.fn();
const revalidatePath = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock('@/lib/studio-auth', () => ({ isStudioAuthed: () => isStudioAuthed() }));
vi.mock('@/lib/market-report-storage', async (original) => {
  const echt = await original<typeof import('@/lib/market-report-storage')>();
  return { ...echt, saveMarketReport: (...a: unknown[]) => saveMarketReport(...a) };
});

const { publishMarktbericht } = await import('@/app/actions');

function summary(text: string): MarketSummary {
  return {
    weeklyReport: text,
    topGainers: [],
    topLosers: [],
    trending: [],
    generatedAt: new Date().toISOString(),
  };
}

/** Ein Text, der das Mindestmaß sicher überschreitet. */
const LANGER_TEXT = 'Der Markt zeigt diese Woche eine ruhige Seitwärtsbewegung. '.repeat(12);

beforeEach(() => {
  isStudioAuthed.mockReset();
  saveMarketReport.mockReset();
  revalidatePath.mockReset();
  isStudioAuthed.mockResolvedValue(true);
  saveMarketReport.mockResolvedValue({ ok: true });
});

describe('publishMarktbericht — Zugriffsschutz', () => {
  it('lehnt einen nicht angemeldeten Aufruf ab', async () => {
    // Server-Actions sind öffentlich erreichbar, auch wenn nur das Studio sie
    // aufruft.
    isStudioAuthed.mockResolvedValue(false);
    const result = await publishMarktbericht(summary(LANGER_TEXT));
    expect(result.ok).toBe(false);
    expect(saveMarketReport).not.toHaveBeenCalled();
  });
});

describe('publishMarktbericht — speichert wirklich', () => {
  it('schreibt den Text in die Datenbank', async () => {
    const result = await publishMarktbericht(summary(LANGER_TEXT));
    expect(result.ok).toBe(true);
    expect(saveMarketReport).toHaveBeenCalledTimes(1);
    const gespeichert = saveMarketReport.mock.calls[0][0] as { reportText: string; weekNumber: number };
    expect(gespeichert.reportText).toBe(LANGER_TEXT);
    expect(gespeichert.weekNumber).toBeGreaterThan(0);
  });

  it('nennt im Erfolgsfall Kalenderwoche und Länge', async () => {
    const result = await publishMarktbericht(summary(LANGER_TEXT));
    expect(result.message).toMatch(/KW \d+/);
    expect(result.message).toMatch(/Zeichen/);
  });

  it('erneuert erst nach erfolgreichem Speichern den Seiten-Cache', async () => {
    await publishMarktbericht(summary(LANGER_TEXT));
    expect(revalidatePath).toHaveBeenCalledWith('/marktbericht');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });
});

describe('publishMarktbericht — meldet Fehlschläge ehrlich', () => {
  it('meldet einen Speicherfehler als Fehlschlag', async () => {
    // Der eigentliche Fund: Vorher wäre hier trotzdem „Live!" erschienen.
    saveMarketReport.mockResolvedValue({ ok: false, error: 'relation "market_reports" does not exist' });
    const result = await publishMarktbericht(summary(LANGER_TEXT));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('market_reports');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('veröffentlicht keinen zu kurzen Text', async () => {
    // Schützt vor dem Platzhalter-Fall: Über Wochen stand als Wochenanalyse
    // ein Bericht online, dessen gesamter Inhalt das Wort „test" war.
    const result = await publishMarktbericht(summary('test'));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/zu kurz/i);
    expect(saveMarketReport).not.toHaveBeenCalled();
  });

  it('veröffentlicht nichts, wenn gar kein Bericht vorliegt', async () => {
    const result = await publishMarktbericht(null);
    expect(result.ok).toBe(false);
    expect(saveMarketReport).not.toHaveBeenCalled();
  });

  it('behandelt einen Text aus reinen Leerzeichen wie einen leeren', async () => {
    const result = await publishMarktbericht(summary('   '.repeat(200)));
    expect(result.ok).toBe(false);
    expect(saveMarketReport).not.toHaveBeenCalled();
  });
});
