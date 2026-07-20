import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { getSupabase } from '@/lib/supabase';
import { fetchTrendingCards, displayPrice } from '@/lib/pokemon-api';
import { renderMarketReel, buildReelCaption, toReelCards } from '@/lib/reel-generator';

// FFmpeg-Rendering von ~5 Segmenten braucht Zeit — Vercel-Limit ausreizen.
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });

  try {
    // Top-Mover: stärkste Wochenbewegung zuerst, bei Gleichstand höherer Preis
    const trending = await fetchTrendingCards(30);
    const movers = [...trending].sort(
      (a, b) =>
        Math.abs(b.trendPercent ?? 0) - Math.abs(a.trendPercent ?? 0) ||
        displayPrice(b) - displayPrice(a),
    );
    const reelCards = toReelCards(movers, 5);
    if (reelCards.length === 0) {
      return NextResponse.json({ error: 'Keine geeigneten Karten gefunden' }, { status: 502 });
    }

    const dateLabel = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    const video = await renderMarketReel(reelCards, 'Top-Mover der Woche', dateLabel);

    // Bucket sicherstellen (identisch zur Upload-Route, ignoriert "existiert schon")
    await sb.storage.createBucket('videos', {
      public: false,
      fileSizeLimit: 500 * 1024 * 1024,
      allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    }).catch(() => {});

    const reelPath = `auto-reels/${new Date().toISOString().split('T')[0]}-top-mover.mp4`;
    const { error: upErr } = await sb.storage.from('videos').upload(reelPath, video, {
      contentType: 'video/mp4',
      upsert: true, // gleicher Tag = gleiche Datei überschreiben
    });
    if (upErr) throw new Error(upErr.message);

    const { data: urlData } = await sb.storage.from('videos').createSignedUrl(reelPath, 7200);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';
    const caption = buildReelCaption(reelCards, siteUrl);

    return NextResponse.json({
      reelPath,
      reelUrl: urlData?.signedUrl ?? null,
      caption,
      cards: reelCards.map((c) => ({ name: c.name, trendPercent: c.trendPercent })),
    });
  } catch (error) {
    console.error('[auto-reel] Rendering fehlgeschlagen:', error);
    // Studio-Endpunkt (auth-geschützt): echte Fehlermeldung zur Diagnose zeigen.
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: detail.slice(0, 400) || 'internal_error' }, { status: 500 });
  }
}
