import { NextResponse } from 'next/server';
import { getGuide } from '@/lib/guides';
import { loadGeneratedGuide } from '@/lib/guide-storage';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, guideDto } from '@/lib/app-api';

// Ein Guide (v1): statisch oder generiert.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return NextResponse.json({ error: 'ungueltig' }, { status: 400 });
  try {
    const g = getGuide(slug) ?? (await loadGeneratedGuide(slug));
    if (!g) return NextResponse.json({ error: 'nicht-gefunden' }, { status: 404 });
    return NextResponse.json(guideDto(g, siteUrlOrLocal()), { headers: { 'Cache-Control': APP_CACHE } });
  } catch (err) {
    console.error('[api/v1/guides]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
