import { getSupabase } from './supabase';
import type { Article } from './article-generator';

// Speichert einen Artikel in Supabase (idempotent per Datum).
export async function saveArticle(date: string, type: string, article: Article): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('articles').upsert(
    { date, type, content: article },
    { onConflict: 'date' },
  );
  return !error;
}

// Liest einen Artikel aus Supabase — null wenn nicht vorhanden.
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

// Listet alle gespeicherten Artikel-Daten (für Archiv).
export async function listSavedArticleDates(): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('articles')
    .select('date')
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map((r) => r.date as string);
}
