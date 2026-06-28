import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchTrendingCards, fetchTopValueCards } from '@/lib/pokemon-api';
import { recordPriceSnapshots } from '@/lib/price-history';
import { isSupabaseConfigured } from '@/lib/supabase';
import { generateArticle, getArticleType } from '@/lib/article-generator';

// Called daily at 08:00 to pre-warm today's article so first visitors don't wait
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  const results: Record<string, unknown> = { date: today };

  // Echte Tagespreise erfassen, damit über die Zeit ein echter Verlauf entsteht.
  if (isSupabaseConfigured()) {
    try {
      const [topValue, trending] = await Promise.all([
        fetchTopValueCards(40),
        fetchTrendingCards(40),
      ]);
      const byId = new Map<string, (typeof topValue)[number]>();
      for (const c of [...topValue, ...trending]) byId.set(c.id, c);
      const saved = await recordPriceSnapshots([...byId.values()]);
      results.priceSnapshots = saved;
      console.log(`✅ ${saved} Preis-Schnappschüsse gespeichert (${today})`);
    } catch (err) {
      results.priceSnapshotError = String(err);
      console.error('Failed to record price snapshots:', err);
    }
  } else {
    results.priceSnapshots = 'skipped (Supabase nicht konfiguriert)';
  }

  // dayOfWeek konsistent aus `today` ableiten (gleiche Basis wie getArticleType),
  // damit Publish-Day-Check und Artikeltyp nie auseinanderlaufen.
  const type = getArticleType(today);
  if (type) {
    try {
      const article = await generateArticle(type, today);
      results.articleGenerated = true;
      results.articleTitle = article.title;
      console.log(`✅ Article generated (${type}): ${article.title}`);
      // WICHTIG: auch die Detailseite revalidieren, sonst bleibt eine evtl. gecachte
      // "noch nicht verfügbar"-Version bis zum nächsten ISR-Intervall (24h) stehen.
      revalidatePath(`/artikel/${today}`);
    } catch (err) {
      results.articleError = 'generation_failed';
      console.error('Failed to generate article:', err);
    }
  } else {
    const dayOfWeek = new Date(today + 'T12:00:00').getDay();
    results.articleGenerated = false;
    results.articleSkipped = `Kein Publish-Day (Wochentag ${dayOfWeek}) — nur Sonntag (0) und Donnerstag (4)`;
  }

  // Revalidate the listing page so it shows today's article fresh
  revalidatePath('/artikel');
  results.listingRevalidated = true;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
