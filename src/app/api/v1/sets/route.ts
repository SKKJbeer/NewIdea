import { NextResponse } from 'next/server';
import { ladeSetListe } from '@/lib/set-liste';
import { APP_CACHE, setEintragDto } from '@/lib/app-api';

// Alle Sets (v1), neueste zuerst, mit Logo — mit gesicherter Liste als Rückfall.
export async function GET() {
  try {
    const { sets } = await ladeSetListe(250);
    return NextResponse.json({ sets: sets.map(setEintragDto) }, { headers: { 'Cache-Control': APP_CACHE } });
  } catch (err) {
    console.error('[api/v1/sets]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
