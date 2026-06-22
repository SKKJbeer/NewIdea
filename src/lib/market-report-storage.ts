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

export async function saveMarketReport(report: StoredMarketReport): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
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
  return !error;
}

export async function loadLatestMarketReport(): Promise<StoredMarketReport | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('market_reports')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return {
    weekStart: String(data.week_start),
    weekNumber: Number(data.week_number),
    reportText: String(data.report_text),
    topGainers: (data.top_gainers as PokemonCard[]) || [],
    topValue: (data.top_value as PokemonCard[]) || [],
    createdAt: String(data.created_at),
  };
}
