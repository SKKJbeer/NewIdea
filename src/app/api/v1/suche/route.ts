import { NextResponse } from 'next/server';
import { searchCardIndex, searchSetIndex, type SetTreffer } from '@/lib/card-index';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, karteDto, suchbegriff } from '@/lib/app-api';

// App-Suche (v1). Nur der eigene Kartenindex — kein Rückfall auf fremde
// Quellen: eine App, die 30 s wartet, wird geschlossen. Fällt der Index aus,
// antwortet die Route mit 503 und die App zeigt einen Fehler statt „keine Treffer".
const bremse = createRateLimiter({ limit: 120, windowMs: 60_000 });

export async function GET(request: Request) {
  const q = suchbegriff(new URL(request.url).searchParams.get('q'));
  if (!q) return NextResponse.json({ karten: [], sets: [] }, { headers: { 'Cache-Control': APP_CACHE } });
  if (!bremse(clientIp(request)).allowed) return NextResponse.json({ error: 'zu-viele' }, { status: 429 });
  try {
    const basis = siteUrlOrLocal();
    const [karten, sets] = await Promise.all([
      searchCardIndex(q, 40),
      searchSetIndex(q, 4).catch(() => [] as SetTreffer[]),
    ]);
    return NextResponse.json(
      { karten: karten.map((k) => karteDto(k, basis)), sets: sets.map((s) => ({ setCode: s.setCode, name: s.setName })) },
      { headers: { 'Cache-Control': APP_CACHE } },
    );
  } catch (err) {
    console.error('[api/v1/suche]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
