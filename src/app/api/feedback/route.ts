import { NextResponse } from 'next/server';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';
import { pruefeFeedback, speichereFeedback, ladeFeedback } from '@/lib/feedback';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';

// RÜCKMELDUNGEN: POST offen (Formular auf jeder Seite), GET nur fürs Studio.
// Die IP dient nur der Mengenbremse und bleibt im Arbeitsspeicher.

export const runtime = 'nodejs';

// 5 Meldungen je 10 Minuten und Adresse: genug für echte Rückmeldungen, zu
// wenig, um den Eimer zu fluten.
const bremse = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function POST(request: Request) {
  const grenze = bremse(clientIp(request));
  if (!grenze.allowed) {
    return NextResponse.json({ error: 'zu-viele' }, { status: 429, headers: { 'Retry-After': String(grenze.retryAfterSeconds) } });
  }
  let koerper: unknown;
  try {
    koerper = await request.json();
  } catch {
    // catch erlaubt: unlesbarer Körper heißt schlicht „ungültig"
    return NextResponse.json({ error: 'ungueltig' }, { status: 400 });
  }
  const geprueft = pruefeFeedback(koerper);
  if (!geprueft.ok) {
    // Honigtopf-Treffer bekommen dieselbe Antwort wie ein Erfolg.
    if (geprueft.fehler === 'ungueltig' && koerper && typeof (koerper as Record<string, unknown>).website === 'string'
      && ((koerper as Record<string, unknown>).website as string).trim() !== '') {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: geprueft.fehler }, { status: 400 });
  }
  try {
    await speichereFeedback(geprueft.eintrag);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[feedback] Speichern fehlgeschlagen:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ eintraege: await ladeFeedback(50) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[feedback] Lesen fehlgeschlagen:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
