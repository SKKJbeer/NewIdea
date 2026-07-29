import { describe, it, expect } from 'vitest';
import { readingTime } from '@/lib/article-generator';

// Absicherung der Anzeige-Robustheit: Ältere gespeicherte Artikel haben kein
// readingTimeMin-Feld — auf der Seite stand dadurch nur „Min Lektüre" ohne Zahl.

describe('readingTime', () => {
  it('nutzt den gespeicherten Wert, wenn vorhanden', () => {
    expect(readingTime({ readingTimeMin: 7, intro: 'x', sections: [] })).toBe(7);
  });

  it('berechnet die Lesezeit, wenn das Feld fehlt', () => {
    const words = Array.from({ length: 400 }, () => 'wort').join(' ');
    const min = readingTime({
      readingTimeMin: 0,
      intro: words,
      sections: [{ heading: 'A', content: words }],
    });
    // 800 Wörter / 200 = 4 Minuten
    expect(min).toBe(4);
  });

  it('liefert nie 0 Minuten', () => {
    expect(readingTime({ readingTimeMin: 0, intro: '', sections: [] })).toBeGreaterThanOrEqual(1);
  });

  it('kommt mit fehlenden Feldern zurecht', () => {
    // Alte Einträge können sections/intro gar nicht gesetzt haben.
    const min = readingTime({ readingTimeMin: 0 } as Parameters<typeof readingTime>[0]);
    expect(min).toBeGreaterThanOrEqual(1);
  });
});
