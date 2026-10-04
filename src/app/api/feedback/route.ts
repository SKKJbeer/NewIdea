import { NextResponse } from 'next/server';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';
import {
  pruefeFeedback, speichereFeedback, ladeFeedback, feedbackOrdner,
  FEEDBACK_MAX_BYTES, FEEDBACK_TAGESGRENZE,
} from '@/lib/feedback';
import { herkunftErlaubt, leseJsonBegrenzt, tagesKontingentFrei } from '@/lib/annahme-schutz';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';

// RÜCKMELDUNGEN: POST offen (Formular auf jeder Seite), GET nur fürs Studio.
// Die IP dient nur der Mengenbremse und bleibt im Arbeitsspeicher.

export const runtime = 'nodejs';

// 5 Meldungen je 10 Minuten und Adresse: genug für echte Rückmeldungen, zu
// wenig, um den Eimer zu fluten.
const bremse = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function POST(request: Request) {
  // 1. Nur von der eigenen Seite (fremde Seiten dürfen Besucher-Browser nicht als Schleuder nutzen).
  if (!herkunftErlaubt(request)) return NextResponse.json({ error: 'ungueltig' }, { status: 403 });

  // 2. Mengenbremse je Adresse (Arbeitsspeicher — die harte Grenze kommt in Schritt 5).
  const grenze = bremse(clientIp(request));
  if (!grenze.allowed) {
    return NextResponse.json({ error: 'zu-viele' }, { status: 429, headers: { 'Retry-After': String(grenze.retryAfterSeconds) } });
  }

  // 3. Körper mit harter Größengrenze, nur JSON.
  const koerper = await leseJsonBegrenzt(request, FEEDBACK_MAX_BYTES);
  if (!koerper.ok) return NextResponse.json({ error: koerper.fehler }, { status: koerper.status });

  // 4. Inhalt prüfen. Roboter (Honigtopf, zu schnell) bekommen dieselbe
  //    Antwort wie ein Erfolg — sonst lernen sie, was sie verrät.
  const geprueft = pruefeFeedback(koerper.daten);
  if (!geprueft.ok) {
    if (geprueft.fehler === 'bot') return NextResponse.json({ ok: true });
    return NextResponse.json({ error: geprueft.fehler }, { status: 400 });
  }

  // 5. Tagesgrenze über ALLE Instanzen (zählt die Dateien des Tages).
  const tag = geprueft.eintrag.zeit.slice(0, 10);
  if (!(await tagesKontingentFrei(feedbackOrdner(tag), FEEDBACK_TAGESGRENZE))) {
    console.warn(`[feedback] Tagesgrenze ${FEEDBACK_TAGESGRENZE} erreicht (${tag}) — Meldung abgewiesen`);
    return NextResponse.json({ error: 'zu-viele' }, { status: 429, headers: { 'Retry-After': '3600' } });
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
