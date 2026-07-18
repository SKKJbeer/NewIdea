import { NextResponse } from 'next/server';

// Bild-Caching-Proxy: Macht uns unabhängig von der Verfügbarkeit der externen
// Bild-Hosts (TCG-API / Pokémon-CDN). Vercels CDN cacht jede Antwort 30 Tage
// (s-maxage) und bedient bei Origin-Ausfall bis zu 1 Jahr aus dem Stale-Cache
// (stale-while-revalidate + stale-if-error). Ein einmal gesehenes Bild
// verschwindet damit praktisch nie wieder.
//
// Sicherheit: strikte Host-Allowlist + nur https + nur image/*-Antworten —
// kein offener Proxy.

const ALLOWED_HOSTS = new Set(['images.pokemontcg.io', 'assets.pokemon.com']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('u') || '';

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse('bad url', { status: 400 });
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse('host not allowed', { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!upstream.ok || !upstream.body) {
      // Fehler NICHT cachen — nächster Request versucht es erneut
      return new NextResponse('upstream error', { status: 502 });
    }
    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new NextResponse('not an image', { status: 502 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control':
          'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=31536000, stale-if-error=31536000',
      },
    });
  } catch {
    return new NextResponse('fetch failed', { status: 502 });
  }
}
