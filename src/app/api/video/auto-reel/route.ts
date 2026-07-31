import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { getSupabase } from '@/lib/supabase';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { renderStory } from '@/lib/reel-generator';
import { buildStory, CONCEPTS } from '@/lib/reel-concepts';
import { siteUrlOrLocal } from '@/lib/site';

// FFmpeg-Rendering von ~5 Segmenten braucht Zeit — Vercel-Limit ausreizen.
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });

  // Format wählbar (Studio), sonst automatische Rotation nach Kalenderwoche.
  const body = await request.json().catch(() => ({} as { conceptId?: string }));
  const conceptId = typeof body?.conceptId === 'string' ? body.conceptId : undefined;

  try {
    const trending = await fetchTrendingCards(30);
    const siteUrl = siteUrlOrLocal();
    const story = buildStory(trending, siteUrl, { conceptId });
    if (!story) {
      return NextResponse.json(
        { error: 'Keine ausreichenden Marktdaten für ein Reel', concepts: CONCEPTS.map((c) => c.id) },
        { status: 502 },
      );
    }

    const video = await renderStory(story);

    // Bucket sicherstellen (identisch zur Upload-Route, ignoriert "existiert schon")
    await sb.storage.createBucket('videos', {
      public: false,
      fileSizeLimit: 500 * 1024 * 1024,
      allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    }).catch(() => {});

    const reelPath = `auto-reels/${new Date().toISOString().split('T')[0]}-${story.conceptId}.mp4`;
    const { error: upErr } = await sb.storage.from('videos').upload(reelPath, video, {
      contentType: 'video/mp4',
      upsert: true, // gleicher Tag = gleiche Datei überschreiben
    });
    if (upErr) throw new Error(upErr.message);

    const { data: urlData } = await sb.storage.from('videos').createSignedUrl(reelPath, 7200);

    return NextResponse.json({
      reelPath,
      reelUrl: urlData?.signedUrl ?? null,
      caption: story.caption,
      concept: { id: story.conceptId, title: story.title },
      scenes: story.scenes.length,
      availableConcepts: CONCEPTS.map((c) => ({ id: c.id, label: c.label })),
    });
  } catch (error) {
    console.error('[auto-reel] Rendering fehlgeschlagen:', error);
    // Studio-Endpunkt (auth-geschützt): volle Diagnose zeigen — Name, Message,
    // erster Stack-Frame. So bekommen wir immer etwas Verwertbares.
    const e = error as { name?: string; message?: string; stack?: string };
    const detail = [
      e?.name,
      e?.message,
      (e?.stack || '').split('\n')[1]?.trim(),
    ].filter(Boolean).join(' | ') || (() => { try { return JSON.stringify(error); } catch { return String(error); } })();
    return NextResponse.json({ error: detail.slice(0, 600) || 'unknown_error' }, { status: 500 });
  }
}
