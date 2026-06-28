import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary, generateNewsletterContent } from '@/lib/ai-generator';
import { sendNewsletter } from '@/lib/newsletter';
import { saveMarketReport } from '@/lib/market-report-storage';

// Montags 07:00 UTC: Marktbericht generieren und als Newsletter-Draft in Beehiiv anlegen.
// Video- und Social-Media-Pipeline erfolgt manuell via /studio (erfordert separate Keys).
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    const cards = await fetchTrendingCards(20);
    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));

    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    results.marketSummary = 'generated';

    // Persist report so /marktbericht serves cached content to all users
    const topValue = [...cards].sort((a, b) => {
      const pa = a.prices.market || a.prices.holofoil?.market || 0;
      const pb = b.prices.market || b.prices.holofoil?.market || 0;
      return pb - pa;
    }).slice(0, 6);

    const now = new Date();
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
    const weekNumber = Math.ceil(((monday.getTime() - new Date(Date.UTC(monday.getUTCFullYear(), 0, 1)).getTime()) / 86400000 + 1) / 7);

    await saveMarketReport({
      weekStart: monday.toISOString().split('T')[0],
      weekNumber,
      reportText: summary.weeklyReport,
      topGainers: summary.topGainers.slice(0, 6),
      topValue,
      createdAt: new Date().toISOString(),
    });
    results.marketReportSaved = true;

    const newsletter = await generateNewsletterContent(summary, cards);
    const newsletterSent = await sendNewsletter(newsletter);
    results.newsletter = newsletterSent ? 'draft_created' : 'skipped_no_key';

    revalidatePath('/marktbericht');
    revalidatePath('/artikel');
    results.revalidated = true;

    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), results });
  } catch (error) {
    // Detaillierte Fehler nur ins Server-Log, nicht in die Response (kein Leak interner Details/Keys).
    console.error('Weekly cron failed:', error);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
