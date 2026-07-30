import { getSupabase } from './supabase';
import type { Article } from './article-generator';

// SPEICHERN MIT ECHTER FEHLERMELDUNG
//
// ANLASS: `saveArticle` gab `!error` zurück und verwarf die Ursache. Die
// Aufrufer hängten ein `.catch()` an — das greift aber nur bei GEWORFENEN
// Ausnahmen, und supabase-js wirft nicht, sondern LIEFERT den Fehler zurück.
// Ergebnis: Zehn erfolgreich erzeugte Artikel, null gespeicherte Zeilen, keine
// einzige Meldung. Und weil die Seite bei fehlendem Artikel selbstheilend neu
// erzeugt, kostete jeder einzelne Seitenaufruf einen vollständigen KI-Aufruf.
//
// REGEL (CLAUDE.md, Stolperstelle 21): Speicher-Funktionen geben `{ ok, error }`
// zurück, niemals nur `boolean`.

export interface SaveResult {
  ok: boolean;
  error: string | null;
}

export async function saveArticle(date: string, type: string, article: Article): Promise<SaveResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase ist nicht konfiguriert' };

  const { error } = await sb.from('articles').upsert(
    { date, type, title: article.title, content: article },
    { onConflict: 'date' },
  );

  if (error) {
    // 42P10 = „no unique or exclusion constraint matching the ON CONFLICT
    // specification" — dann fehlt der Tabelle der eindeutige Index auf `date`.
    const hinweis =
      error.code === '42P10'
        ? ' — der Tabelle `articles` fehlt ein eindeutiger Index auf `date`. ' + ARTICLES_FIX_SQL
        : '';
    return { ok: false, error: `${error.message}${hinweis}` };
  }
  return { ok: true, error: null };
}

/** Behebt die häufigste Ursache: fehlender eindeutiger Index für den Upsert. */
export const ARTICLES_FIX_SQL =
  'CREATE UNIQUE INDEX IF NOT EXISTS articles_date_key ON articles (date);';

export async function loadArticle(date: string): Promise<Article | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('articles')
    .select('content')
    .eq('date', date)
    .single();
  if (error || !data) return null;
  return data.content as Article;
}

// Gibt Datum, Typ und Titel aller gespeicherten Artikel zurück — für das Blog-Listing.
export async function listSavedArticleMeta(): Promise<Array<{ date: string; type: string; title: string }>> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('articles')
    .select('date, type, title')
    .order('date', { ascending: false })
    .limit(60);
  if (error || !data) return [];
  return data.map((r) => ({
    date: String(r.date),
    type: String(r.type),
    title: String(r.title || ''),
  }));
}

export async function listSavedArticleDates(): Promise<string[]> {
  const meta = await listSavedArticleMeta();
  return meta.map((m) => m.date);
}
