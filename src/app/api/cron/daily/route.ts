import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchTrendingCards, fetchTopValueCards } from '@/lib/pokemon-api';
import { recordPriceSnapshots } from '@/lib/price-history';
import { isSupabaseConfigured } from '@/lib/supabase';

// Called daily at 08:00 to pre-warm today's article so first visitors don't wait
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';

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

  try {
    // Trigger ISR generation by fetching the article page
    const res = await fetch(`${baseUrl}/artikel/${today}`, {
      headers: { 'x-prerender-revalidate': process.env.REVALIDATION_TOKEN || '' },
      next: { revalidate: 0 },
    });
    results.articleStatus = res.status;
    results.articleWarmed = res.ok;
    console.log(`✅ Daily article pre-warmed: /artikel/${today} (${res.status})`);
  } catch (err) {
    results.articleError = String(err);
    console.error('Failed to pre-warm article:', err);
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
