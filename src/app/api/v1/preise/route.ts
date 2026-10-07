import { NextResponse } from 'next/server';
import { cardsFromIndex } from '@/lib/card-index';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, idsAusParam, karteDto } from '@/lib/app-api';

// Aktuelle Preise für die Karten eines Portfolios (v1). `fehlend` nennt IDs ohne
// Eintrag im Index — die App zeigt dort „kein Preis", nie eine Null.
const bremse = createRateLimiter({ limit: 120, windowMs: 60_000 });

export async function GET(request: Request) {
  const ids = idsAusParam(new URL(request.url).searchParams.get('ids'));
  if (ids.length === 0) return NextResponse.json({ karten: [], fehlend: [] }, { headers: { 'Cache-Control': APP_CACHE } });
  if (!bremse(clientIp(request)).allowed) return NextResponse.json({ error: 'zu-viele' }, { status: 429 });
  try {
    const basis = siteUrlOrLocal();
    const treffer = await cardsFromIndex(ids);
    return NextResponse.json(
      { karten: ids.filter((id) => treffer.has(id)).map((id) => karteDto(treffer.get(id)!, basis)), fehlend: ids.filter((id) => !treffer.has(id)) },
      { headers: { 'Cache-Control': APP_CACHE } },
    );
  } catch (err) {
    console.error('[api/v1/preise]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
