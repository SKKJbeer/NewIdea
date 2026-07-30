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

/** Höchstens so viele Weiterleitungen — jede wird erneut geprüft. */
const MAX_REDIRECTS = 3;

function istErlaubt(url: URL): boolean {
  return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname);
}

/**
 * Holt das Bild und folgt Weiterleitungen SELBST.
 *
 * WARUM NICHT AUTOMATISCH: `fetch` folgt standardmäßig jeder Weiterleitung,
 * ohne das Ziel noch einmal gegen die Liste zu halten. Antwortet einer der
 * erlaubten Hosts (oder jemand, der ihn übernommen hat) mit
 * `Location: http://169.254.169.254/...`, holt der Server dieses Ziel ab und
 * gibt die Antwort nach außen — die Allowlist gilt dann nur noch für den
 * ersten Sprung. Genau das ist eine serverseitige Anfragefälschung (SSRF).
 */
async function holeBild(start: URL): Promise<Response | null> {
  let ziel = start;
  for (let sprung = 0; sprung <= MAX_REDIRECTS; sprung++) {
    const antwort = await fetch(ziel.toString(), {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
      redirect: 'manual',
    });

    if (antwort.status < 300 || antwort.status >= 400) return antwort;

    const location = antwort.headers.get('location');
    if (!location) return antwort;

    let naechstes: URL;
    try {
      naechstes = new URL(location, ziel);
    } catch {
      // catch erlaubt: eine unparsbare Weiterleitung wird nicht verfolgt.
      return null;
    }
    if (!istErlaubt(naechstes)) return null;
    ziel = naechstes;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('u') || '';

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse('bad url', { status: 400 });
  }
  if (!istErlaubt(target)) {
    return new NextResponse('host not allowed', { status: 400 });
  }

  try {
    const upstream = await holeBild(target);
    if (!upstream || !upstream.ok || !upstream.body) {
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
