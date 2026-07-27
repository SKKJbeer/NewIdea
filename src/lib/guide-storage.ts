import { getSupabase } from './supabase';
import type { Guide } from './guides';

// Supabase-Tabelle (einmalig anlegen):
// CREATE TABLE IF NOT EXISTS generated_guides (
//   slug       TEXT PRIMARY KEY,
//   title      TEXT NOT NULL,
//   content    JSONB NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT now()
// );

export interface SaveResult {
  ok: boolean;
  /** Klartext-Ursache — NIE verschlucken (siehe system-health.ts). */
  error?: string;
}

/**
 * Speichert einen generierten Guide.
 *
 * Gibt bewusst die ECHTE Fehlermeldung zurück statt nur `false`: Eine fehlende
 * Tabelle hat die Pipeline über einen Monat lang still scheitern lassen, weil
 * der Grund nirgends ankam.
 */
export async function saveGeneratedGuide(guide: Guide): Promise<SaveResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase nicht konfiguriert (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen)' };
  const { error } = await sb.from('generated_guides').upsert(
    { slug: guide.slug, title: guide.title, content: guide },
    { onConflict: 'slug' },
  );
  if (error) {
    return { ok: false, error: error.message || 'Unbekannter Datenbankfehler beim Speichern' };
  }
  return { ok: true };
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
