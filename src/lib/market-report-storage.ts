import { getSupabase } from './supabase';
import type { PokemonCard } from '@/types';

export interface StoredMarketReport {
  weekStart: string;
  weekNumber: number;
  reportText: string;
  topGainers: PokemonCard[];
  topValue: PokemonCard[];
  createdAt: string;
}

export interface MarketReportMeta {
  weekStart: string;
  weekNumber: number;
  createdAt: string;
}

function rowToReport(data: Record<string, unknown>): StoredMarketReport {
  return {
    weekStart: String(data.week_start),
    weekNumber: Number(data.week_number),
    reportText: String(data.report_text),
    topGainers: (data.top_gainers as PokemonCard[]) || [],
    topValue: (data.top_value as PokemonCard[]) || [],
    createdAt: String(data.created_at),
  };
}

export interface SaveResult {
  ok: boolean;
  /** Klartext-Ursache — NIE verschlucken (siehe CLAUDE.md, Stolperstelle 21). */
  error?: string;
}

/**
 * Speichert den Wochenbericht.
 *
 * Gibt die ECHTE Fehlermeldung zurück statt nur `false`: Der Cron hat zuvor
 * `marketReportSaved: true` gemeldet, ohne den Rückgabewert überhaupt zu prüfen —
 * ein fehlgeschlagenes Speichern sah dadurch wie ein Erfolg aus.
 */
export async function saveMarketReport(report: StoredMarketReport): Promise<SaveResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase nicht konfiguriert (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen)' };
  const { error } = await sb.from('market_reports').upsert(
    {
      week_start: report.weekStart,
      week_number: report.weekNumber,
      report_text: report.reportText,
      top_gainers: report.topGainers,
      top_value: report.topValue,
    },
    { onConflict: 'week_start' },
  );
  if (error) return { ok: false, error: error.message || 'Unbekannter Datenbankfehler beim Speichern' };
  return { ok: true };
}

/**
 * Mindestlänge, ab der ein gespeicherter Bericht als veröffentlichungswürdig gilt.
 * Schützt die Seite vor Platzhaltern: Über Wochen stand als Wochenanalyse ein
 * Bericht online, dessen gesamter Inhalt das Wort „test" war.
 */
export const MIN_PUBLISHABLE_CHARS = 300;

export function isPublishableReport(reportText: string | null | undefined): boolean {
  return (reportText ?? '').trim().length >= MIN_PUBLISHABLE_CHARS;
}

/**
 * Neuester Bericht — überspringt unbrauchbare Platzhalter-Einträge und liefert
 * den jüngsten Bericht mit echtem Inhalt.
 */
export async function loadLatestMarketReport(): Promise<StoredMarketReport | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('market_reports')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(10);
  if (error || !data || data.length === 0) return null;
  const usable = (data as Record<string, unknown>[]).find((r) => isPublishableReport(r.report_text as string));
  return usable ? rowToReport(usable) : null;
}

export async function loadMarketReportByWeek(weekStart: string): Promise<StoredMarketReport | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('market_reports')
    .select('*')
    .eq('week_start', weekStart)
    .single();
  if (error || !data) return null;
  return rowToReport(data as Record<string, unknown>);
}

export async function listMarketReportMeta(): Promise<MarketReportMeta[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('market_reports')
    .select('week_start, week_number, created_at, report_text')
    .order('week_start', { ascending: false })
    .limit(104); // 2 years max
  if (error || !data) return [];
  return (data as Record<string, unknown>[])
    // Platzhalter-Einträge nicht verlinken — sonst führt das Archiv auf leere Berichte.
    .filter((r) => isPublishableReport(r.report_text as string))
    .map((r) => ({
      weekStart: String(r.week_start),
      weekNumber: Number(r.week_number),
      createdAt: String(r.created_at),
    }));
}
