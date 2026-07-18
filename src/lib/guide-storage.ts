import { getSupabase } from './supabase';
import type { Guide } from './guides';

// Supabase-Tabelle (einmalig anlegen):
// CREATE TABLE IF NOT EXISTS generated_guides (
//   slug       TEXT PRIMARY KEY,
//   title      TEXT NOT NULL,
//   content    JSONB NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT now()
// );

export async function saveGeneratedGuide(guide: Guide): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('generated_guides').upsert(
    { slug: guide.slug, title: guide.title, content: guide },
    { onConflict: 'slug' },
  );
  return !error;
}

export async function loadGeneratedGuide(slug: string): Promise<Guide | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('generated_guides')
    .select('content')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data.content as Guide;
}

export async function listGeneratedGuides(): Promise<Guide[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('generated_guides')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map((r) => r.content as Guide);
}

export async function listGeneratedGuideSlugs(): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('generated_guides').select('slug');
  if (error || !data) return [];
  return data.map((r) => String(r.slug));
}
