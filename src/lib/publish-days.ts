// Veröffentlichungstage der Artikel — die EINE Quelle dafür.
//
// Bewusst ein eigenes Modul ohne Abhängigkeiten: `article-generator.ts` zieht
// Anthropic-SDK und Supabase mit und kann deshalb nicht in eine Client-
// Komponente importiert werden. Das Monitoring braucht die Termine aber im
// Browser, um Fallback-Artikel einzeln nachgenerieren zu können.
//
// Regel (CLAUDE.md → Blog-Veröffentlichungsplan): Artikel erscheinen NUR
// sonntags (Wochenrückblick) und donnerstags (rotierender Artikel).

/** 0 = Sonntag, 4 = Donnerstag. */
export const PUBLISH_DAYS = new Set([0, 4]);

export interface PublishDate {
  /** ISO-Datum (YYYY-MM-DD, UTC). */
  date: string;
  isToday: boolean;
  /** Für die Anzeige, z. B. „Donnerstag, 23. Juli". */
  dateLabel: string;
}

/** Die letzten `count` Veröffentlichungstermine, neueste zuerst. */
export function recentPublishDates(count = 8, now: Date = new Date()): PublishDate[] {
  const results: PublishDate[] = [];
  const todayStr = now.toISOString().split('T')[0];
  const cursor = new Date(now);

  while (results.length < count) {
    if (PUBLISH_DAYS.has(cursor.getDay())) {
      const date = cursor.toISOString().split('T')[0];
      results.push({
        date,
        isToday: date === todayStr,
        dateLabel: cursor.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }),
      });
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return results;
}
