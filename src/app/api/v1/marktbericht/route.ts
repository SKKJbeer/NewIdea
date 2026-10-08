import { NextResponse } from 'next/server';
import { loadLatestMarketReport, loadMarketReportByWeek, isPublishableReport } from '@/lib/market-report-storage';
import { artikelPreiseVeraltet } from '@/lib/article-generator';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, berichtKarten, gueltigesDatum } from '@/lib/app-api';
import { ohneDuenneAusreisser } from '@/lib/markt-lage';
import { ladeSetListe } from '@/lib/set-liste';

// Wochen-Marktbericht (v1): neuester oder `?woche=JJJJ-MM-TT`. Abschnitte im
// Text beginnen mit `## ` (Marktlage, Trends, Neuheiten, Ausblick).
export async function GET(request: Request) {
  const roh = new URL(request.url).searchParams.get('woche');
  const woche = roh ? gueltigesDatum(roh) : null;
  if (roh && !woche) return NextResponse.json({ error: 'ungueltig' }, { status: 400 });
  try {
    const [b, setListe] = await Promise.all([
      woche ? loadMarketReportByWeek(woche) : loadLatestMarketReport(),
      ladeSetListe(250).catch(() => null),
    ]);
    if (!b || !isPublishableReport(b.reportText)) return NextResponse.json({ error: 'nicht-gefunden' }, { status: 404 });
    return NextResponse.json(
      {
        woche: b.weekStart,
        kw: b.weekNumber,
        erstellt: b.createdAt,
        text: b.reportText,
        archiv: artikelPreiseVeraltet({ generatedAt: b.createdAt }),
        url: `${siteUrlOrLocal()}/marktbericht/${b.weekStart}`,
        // Seit v6.27.0 — Karten des Berichts mit Bild (Preise: Stand der Erstellung).
        // Klassiker über 100 % sind dünn gehandelt (gleiche Regel wie Markt, Website, Instagram).
        ...berichtKarten({ topGainers: ohneDuenneAusreisser(b.topGainers, setDatumAus(setListe)), topValue: b.topValue }),
      },
      { headers: { 'Cache-Control': APP_CACHE } },
    );
  } catch (err) {
    console.error('[api/v1/marktbericht]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}

function setDatumAus(liste: Awaited<ReturnType<typeof ladeSetListe>> | null): Map<string, string> {
  return new Map((liste?.sets ?? []).map((s) => [s.id, s.releaseDate] as [string, string]));
}
