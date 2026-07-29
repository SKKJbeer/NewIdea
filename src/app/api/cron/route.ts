import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary, generateNewsletterContent } from '@/lib/ai-generator';
import { sendNewsletter } from '@/lib/newsletter';
import { generateAndSaveMarketReport } from '@/lib/market-report-generator';

// Montags 07:00 UTC: Marktbericht generieren und als Newsletter-Draft in Beehiiv anlegen.
// Video- und Social-Media-Pipeline erfolgt manuell via /studio (erfordert separate Keys).
//
// WICHTIG: Bericht und Newsletter laufen in GETRENNTEN try/catch-Blöcken. Vorher
// lag alles in einem einzigen Block — ein Fehler beim Newsletter (oder irgendwo
// sonst) verhinderte, dass überhaupt ein Bericht entsteht, und die Antwort sagte
// nur „internal_error".
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. Marktbericht — der eigentliche Seiteninhalt. Status inkl. Ursache in die Antwort.
  const report = await generateAndSaveMarketReport();
  results.marketReport = report.status;
  results.marketReportWeek = report.weekNumber ?? null;
  if (report.reportChars !== undefined) results.marketReportChars = report.reportChars;
  if (report.error) results.marketReportError = report.error;

  if (report.status === 'created') {
    revalidatePath('/marktbericht');
    revalidatePath('/marktbericht/archiv');
    revalidatePath('/');
    console.log(`✅ Marktbericht KW ${report.weekNumber} gespeichert (${report.reportChars} Zeichen)`);
  }

  // 2. Newsletter — optional. Ein Fehler hier darf den Bericht nicht entwerten.
  try {
    const cards = await fetchTrendingCards(20);
    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));
    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    const newsletter = await generateNewsletterContent(summary, cards);
    const newsletterSent = await sendNewsletter(newsletter);
    results.newsletter = newsletterSent ? 'draft_created' : 'skipped_no_key';
  } catch (err) {
    results.newsletter = 'failed';
    results.newsletterError = err instanceof Error ? err.message : 'unbekannt';
    console.error('Newsletter-Schritt fehlgeschlagen:', err);
  }

  revalidatePath('/artikel');

  // Erfolg = der Bericht steht. Alles andere ist Beiwerk.
  return NextResponse.json({
    success: report.status === 'created',
    timestamp: new Date().toISOString(),
    results,
  });
}
