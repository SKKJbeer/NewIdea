import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ARTICLES_FIX_SQL } from '@/lib/article-storage';

// ANLASS: Zehn erfolgreich erzeugte Artikel, null gespeicherte Zeilen, keine
// einzige Fehlermeldung. Weil die Artikelseite bei fehlendem Artikel
// selbstheilend neu erzeugt, kostete danach JEDER Seitenaufruf einen
// vollständigen KI-Aufruf — drei Abrufe hintereinander lieferten drei
// verschiedene Titel. Diese Prüfungen halten beide Ursachen geschlossen.

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), 'utf8');

describe('Speicher-Funktionen melden die Ursache', () => {
  it('saveArticle gibt ein Ergebnis-Objekt zurück, keinen nackten boolean', () => {
    const src = lies('src/lib/article-storage.ts');
    expect(src, 'Stolperstelle 21: { ok, error } statt boolean').toContain('Promise<SaveResult>');
    expect(src, 'die echte Meldung muss durchgereicht werden').toMatch(/error\.message/);
    expect(src, '`return !error` verwirft die Diagnose').not.toMatch(/return\s+!error\s*;/);
  });

  it('nennt bei fehlendem Index die Behebung', () => {
    expect(ARTICLES_FIX_SQL).toContain('CREATE UNIQUE INDEX');
    expect(ARTICLES_FIX_SQL).toContain('articles');
    expect(ARTICLES_FIX_SQL).toContain('date');
  });

  it('behandelt den Upsert-Fehlercode 42P10 gesondert', () => {
    // Ohne eindeutigen Index auf `date` scheitert JEDER Upsert — und zwar
    // stillschweigend, weil supabase-js nicht wirft, sondern zurückgibt.
    expect(lies('src/lib/article-storage.ts')).toContain('42P10');
  });
});

describe('Der Generator wertet das Speicher-Ergebnis aus', () => {
  const src = lies('src/lib/article-generator.ts');

  it('verlässt sich nicht auf .catch() bei saveArticle', () => {
    // supabase-js WIRFT nicht — ein angehängtes .catch() greift also nie.
    expect(src).not.toMatch(/saveArticle\([^)]*\)\.catch/);
  });

  it('prüft jeden Rückgabewert von saveArticle', () => {
    const aufrufe = src.match(/await saveArticle\(/g) ?? [];
    const geprueft = src.match(/=\s*await saveArticle\(/g) ?? [];
    expect(aufrufe.length, 'mindestens ein Aufruf erwartet').toBeGreaterThan(0);
    expect(
      geprueft.length,
      'jeder saveArticle-Aufruf muss sein Ergebnis in eine Variable legen und prüfen',
    ).toBe(aufrufe.length);
  });

  it('meldet einen Speicherfehler nach außen', () => {
    expect(src).toContain('onSaveError');
  });
});

describe('Die Artikelseite wird zwischengespeichert', () => {
  const src = lies('src/app/artikel/[date]/page.tsx');

  it('erzeugt on-demand — das ist die Selbstheilung', () => {
    expect(src).toContain('generateArticle(type, date)');
  });

  it('hat generateStaticParams, sonst greift revalidate nicht', () => {
    // Ohne diese Funktion stuft Next.js die Route als vollständig dynamisch
    // ein: kein Zwischenspeicher, also ein KI-Aufruf pro Seitenaufruf.
    expect(
      src,
      'ohne generateStaticParams ist die Route ƒ (dynamisch) und die Selbstheilung ' +
        'läuft bei JEDEM Aufruf — genau das hat Guthaben verbrannt',
    ).toMatch(/export async function generateStaticParams/);
  });

  it('erzeugt beim Bauen nichts vor (Stolperstelle 16)', () => {
    // Eine gefüllte Liste würde einen API-Ausfall während des Builds als 404
    // einbetonieren. Leer heißt: nur auf Anfrage, danach zwischengespeichert.
    const block = src.slice(src.indexOf('export async function generateStaticParams'));
    expect(block.slice(0, 120)).toMatch(/return \[\];/);
  });

  it('setzt ein Revalidierungsfenster', () => {
    expect(src).toMatch(/export const revalidate = \d+/);
  });
});

describe('Die Auslöse-Route meldet, ob gespeichert wurde', () => {
  it('gibt saved und saveError zurück', () => {
    const src = lies('src/app/api/articles/generate/route.ts');
    expect(src, 'sonst meldet die Route Erfolg, den es nicht gab').toContain('saved:');
    expect(src).toContain('onSaveError');
  });
});
