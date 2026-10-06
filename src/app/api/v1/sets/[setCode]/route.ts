import { NextResponse } from 'next/server';
import { setAusIndex } from '@/lib/card-index';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, karteDto } from '@/lib/app-api';

// Alle Karten eines Sets (v1), teuerste zuerst, aus dem eigenen Index.
export async function GET(_request: Request, { params }: { params: Promise<{ setCode: string }> }) {
  const { setCode } = await params;
  if (!/^[A-Za-z0-9._-]{1,30}$/.test(setCode)) return NextResponse.json({ error: 'ungueltig' }, { status: 400 });
  try {
    const basis = siteUrlOrLocal();
    const karten = (await setAusIndex(setCode)).map((k) => karteDto(k, basis));
    if (karten.length === 0) return NextResponse.json({ error: 'nicht-gefunden' }, { status: 404 });
    return NextResponse.json({ setCode, name: karten[0].set, karten }, { headers: { 'Cache-Control': APP_CACHE } });
  } catch (err) {
    console.error('[api/v1/sets]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
