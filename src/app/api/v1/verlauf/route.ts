import { NextResponse } from 'next/server';
import { getStoredPriceHistories } from '@/lib/price-history';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';
import { APP_CACHE, idGruppen, idsAusParam, standTag, tageAusParam } from '@/lib/app-api';

// Echte Tageswerte für mehrere Karten (v1) — Grundlage der Portfolio-Kurve.
// Keine Interpolation: Fehlt ein Tag, fehlt er auch hier.
const bremse = createRateLimiter({ limit: 60, windowMs: 60_000 });

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const ids = idsAusParam(p.get('ids'));
  const tage = tageAusParam(p.get('tage'));
  if (ids.length === 0) return NextResponse.json({ tage, verlauf: {} }, { headers: { 'Cache-Control': APP_CACHE } });
  if (!bremse(clientIp(request)).allowed) return NextResponse.json({ error: 'zu-viele' }, { status: 429 });
  try {
    const teile = await Promise.all(idGruppen(ids, tage).map((g) => getStoredPriceHistories(g, tage)));
    const verlauf: Record<string, Array<{ datum: string; preis: number }>> = {};
    for (const teil of teile) {
      for (const [id, punkte] of Object.entries(teil)) {
        verlauf[id] = punkte
          .filter((x) => Number.isFinite(x.price) && x.price > 0 && standTag(x.date))
          .map((x) => ({ datum: standTag(x.date) as string, preis: x.price }));
      }
    }
    return NextResponse.json({ tage, verlauf }, { headers: { 'Cache-Control': APP_CACHE } });
  } catch (err) {
    console.error('[api/v1/verlauf]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
