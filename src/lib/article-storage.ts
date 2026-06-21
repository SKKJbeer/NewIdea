import { getSupabase } from './supabase';
import type { Article } from './article-generator';

export async function saveArticle(date: string, type: string, article: Article): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('articles').upsert(
    { date, type, title: article.title, content: article },
    { onConflict: 'date' },
  );
  return !error;
}

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
