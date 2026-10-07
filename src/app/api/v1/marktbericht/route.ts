import { NextResponse } from 'next/server';
import { loadLatestMarketReport, loadMarketReportByWeek, isPublishableReport } from '@/lib/market-report-storage';
import { artikelPreiseVeraltet } from '@/lib/article-generator';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, gueltigesDatum } from '@/lib/app-api';

// Wochen-Marktbericht (v1): neuester oder `?woche=JJJJ-MM-TT`. Abschnitte im
// Text beginnen mit `## ` (Marktlage, Trends, Neuheiten, Ausblick).
export async function GET(request: Request) {
  const roh = new URL(request.url).searchParams.get('woche');
  const woche = roh ? gueltigesDatum(roh) : null;
  if (roh && !woche) return NextResponse.json({ error: 'ungueltig' }, { status: 400 });
  try {
    const b = woche ? await loadMarketReportByWeek(woche) : await loadLatestMarketReport();
    if (!b || !isPublishableReport(b.reportText)) return NextResponse.json({ error: 'nicht-gefunden' }, { status: 404 });
    return NextResponse.json(
      {
        woche: b.weekStart,
        kw: b.weekNumber,
        erstellt: b.createdAt,
        text: b.reportText,
        archiv: artikelPreiseVeraltet({ generatedAt: b.createdAt }),
        url: `${siteUrlOrLocal()}/marktbericht/${b.weekStart}`,
      },
      { headers: { 'Cache-Control': APP_CACHE } },
    );
  } catch (err) {
    console.error('[api/v1/marktbericht]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
