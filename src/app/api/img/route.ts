import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { BILD_BREITEN } from '@/lib/bild-loader';
import { tcgdexErsatz } from '@/lib/bild-ersatz';

export const runtime = 'nodejs';

// Bild-Caching-Proxy: Macht uns unabhängig von der Verfügbarkeit der externen
// Bild-Hosts (TCG-API / Pokémon-CDN). Vercels CDN cacht jede Antwort 30 Tage
// (s-maxage) und bedient bei Origin-Ausfall bis zu 1 Jahr aus dem Stale-Cache
// (stale-while-revalidate + stale-if-error). Ein einmal gesehenes Bild
// verschwindet damit praktisch nie wieder.
//
// Sicherheit: strikte Host-Allowlist + nur https + nur image/*-Antworten —
// kein offener Proxy.

// Muss mit PROXY_HOSTS in cached-image.ts übereinstimmen — sonst erzeugt die
// eine Seite Proxy-URLs, die die andere ablehnt.
const ALLOWED_HOSTS = new Set([
  'images.pokemontcg.io',
  'assets.pokemon.com',
  'images.scrydex.com',
  // Neue Sets: Bilder gibt es anfangs nur bei TCGdex (neuheiten.ts, 28.09.2026).
  'assets.tcgdex.net',
]);

/** Höchstens so viele Weiterleitungen — jede wird erneut geprüft. */
const MAX_REDIRECTS = 3;
const MAX_BYTES = 8 * 1024 * 1024;

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

/** Liest höchstens `max` Bytes — die Kopfzeile `content-length` kann fehlen oder lügen. */
async function leseBegrenzt(body: ReadableStream<Uint8Array>, max: number): Promise<Buffer | null> {
  const leser = body.getReader();
  const teile: Uint8Array[] = [];
  let summe = 0;
  for (;;) {
    const { done, value } = await leser.read();
    if (done) break;
    summe += value.byteLength;
    if (summe > max) {
      await leser.cancel().catch(() => undefined);
      return null;
    }
    teile.push(value);
  }
  return Buffer.concat(teile);
}

/** Holt ein Bild; bei pokemontcg.io-Ausfall dieselbe Karte von TCGdex (bild-ersatz.ts). */
async function holeMitErsatz(target: URL): Promise<{ daten: Buffer; typ: string } | null> {
  const versuche: URL[] = [target];
  for (let i = 0; i < 2; i++) {
    const ziel = versuche[i];
    if (!ziel) break;
    const upstream = await holeBild(ziel).catch(() => null);
    const typ = upstream?.headers.get('content-type') || '';
    if (upstream?.ok && upstream.body && typ.startsWith('image/')) {
      const daten = await leseBegrenzt(upstream.body, MAX_BYTES);
      if (daten && daten.length > 0) return { daten, typ };
    }
    if (i === 0) {
      const ersatz = await tcgdexErsatz(target);
      if (ersatz) versuche.push(new URL(ersatz));
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('u') || '';
  // Breite: nur die festen Stufen des Loaders — sonst ließe sich der
  // Zwischenspeicher mit beliebig vielen Varianten füllen.
  const wRoh = searchParams.get('w');
  const breite = wRoh === null ? null : Number(wRoh);
  if (breite !== null && !(BILD_BREITEN as readonly number[]).includes(breite)) {
    return new NextResponse('bad width', { status: 400 });
  }

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
    const bild = await holeMitErsatz(target);
    if (!bild) {
      // Fehler NICHT cachen — nächster Request versucht es erneut
      return new NextResponse('upstream error', { status: 502 });
    }
    let daten = bild.daten;
    let typ = bild.typ;
    if (breite !== null && typ !== 'image/svg+xml') {
      daten = await sharp(daten, { limitInputPixels: 40_000_000 })
        .resize({ width: breite, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      typ = 'image/webp';
    }
    return new NextResponse(new Uint8Array(daten), {
      headers: {
        'Content-Type': typ,
        'Cache-Control':
          'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.warn('[img] fehlgeschlagen:', err instanceof Error ? err.message : err);
    return new NextResponse('fetch failed', { status: 502 });
  }
}
