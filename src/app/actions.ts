'use server';

import { revalidatePath } from 'next/cache';
import { isStudioAuthed } from '@/lib/studio-auth';
import { saveMarketReport, MIN_PUBLISHABLE_CHARS, isPublishableReport } from '@/lib/market-report-storage';
import { currentWeek } from '@/lib/market-report-generator';
import type { MarketSummary } from '@/types';

export interface PublishResult {
  ok: boolean;
  /** Klartext für die Oberfläche — nie nur „fehlgeschlagen". */
  message: string;
}

/**
 * Veröffentlicht den im Studio erzeugten Marktbericht.
 *
 * VORGESCHICHTE: Diese Funktion rief ausschließlich `revalidatePath` auf und
 * speicherte NICHTS. Sie konnte damit gar nicht fehlschlagen — das Studio
 * zeigte anschließend immer „Live!", während auf `/marktbericht` weiterhin
 * „Erster Bericht noch ausstehend" stand. Eine Erfolgsmeldung ohne jede
 * Deckung, genau das Muster aus Stolperstelle 24.
 *
 * Jetzt wird der angezeigte Text tatsächlich gespeichert, durch dasselbe
 * Mindestmaß-Gate geschickt wie der Cron, und das echte Ergebnis
 * zurückgegeben.
 */
export async function publishMarktbericht(summary: MarketSummary | null): Promise<PublishResult> {
  // Serverseitige Prüfung: Eine Server-Action ist ein öffentlich erreichbarer
  // Endpunkt, auch wenn sie nur aus dem Studio aufgerufen wird.
  if (!(await isStudioAuthed())) {
    return { ok: false, message: 'Nicht angemeldet.' };
  }

  const reportText = summary?.weeklyReport ?? '';
  if (!isPublishableReport(reportText)) {
    return {
      ok: false,
      message:
        `Der Text ist zu kurz zum Veröffentlichen (${reportText.trim().length} von mindestens ` +
        `${MIN_PUBLISHABLE_CHARS} Zeichen). Lieber kein Bericht als ein Platzhalter.`,
    };
  }

  const { weekStart, weekNumber } = currentWeek();
  const saved = await saveMarketReport({
    weekStart,
    weekNumber,
    reportText,
    topGainers: summary?.topGainers ?? [],
    topValue: summary?.trending ?? [],
    createdAt: new Date().toISOString(),
  });

  if (!saved.ok) {
    console.error(`Marktbericht KW ${weekNumber} konnte nicht veröffentlicht werden: ${saved.error}`);
    return { ok: false, message: `Speichern fehlgeschlagen: ${saved.error}` };
  }

  revalidatePath('/marktbericht');
  revalidatePath('/marktbericht/archiv');
  revalidatePath('/');

  return { ok: true, message: `KW ${weekNumber} veröffentlicht (${reportText.trim().length} Zeichen).` };
}
