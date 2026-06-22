import { describe, it, expect } from 'vitest';
import { saveMarketReport, loadLatestMarketReport, loadMarketReportByWeek, listMarketReportMeta } from '@/lib/market-report-storage';

describe('market-report-storage exports', () => {
  it('exports the expected functions', () => {
    expect(typeof saveMarketReport).toBe('function');
    expect(typeof loadLatestMarketReport).toBe('function');
    expect(typeof loadMarketReportByWeek).toBe('function');
    expect(typeof listMarketReportMeta).toBe('function');
  });

  it('loadLatestMarketReport returns null when Supabase is not configured', async () => {
    const result = await loadLatestMarketReport();
    expect(result).toBeNull();
  });

  it('listMarketReportMeta returns empty array when Supabase is not configured', async () => {
    const result = await listMarketReportMeta();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('saveMarketReport returns false when Supabase is not configured', async () => {
    const result = await saveMarketReport({
      weekStart: '2026-06-22',
      weekNumber: 26,
      reportText: 'test',
      topGainers: [],
      topValue: [],
      createdAt: new Date().toISOString(),
    });
    expect(result).toBe(false);
  });
});
