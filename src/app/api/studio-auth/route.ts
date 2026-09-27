import { NextResponse } from 'next/server';
import { makeToken, isStudioAuthedFromRequest, safeEqual, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/studio-auth';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';
import { istGesperrt, merkeFehlversuch, sperrDiagnose } from '@/lib/anmelde-sperre';

// SCHUTZ GEGEN PASSWORT-RATEN (seit v6.10.2). Vorher: beliebig viele Versuche,
// Vergleich per `!==` (Zeitunterschiede verraten, wie viele Zeichen stimmen —
// Code-Regel 1). Zehn Versuche je 15 Minuten und Adresse reichen fuer jeden,
// der sich vertippt; ein Rateangriff kommt damit nicht voran.
// Die Grenze liegt im Arbeitsspeicher einer Instanz — sie bremst, sie ist
// kein Ersatz fuer ein starkes Passwort.
const versuche = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 });

// GET — check if current session cookie is valid
export async function GET(request: Request) {
  const ok = isStudioAuthedFromRequest(request);
  if (!ok) return NextResponse.json({ ok }, { status: 401 });
  // Diagnose der Anmeldesperre — nur fuer Angemeldete, Adresse nur als Hash.
  const sperre = await sperrDiagnose(clientIp(request));
  return NextResponse.json({ ok, sperre });
}

// POST — validate password, set HttpOnly session cookie
export async function POST(req: Request) {
  const ip = clientIp(req);
  const grenze = versuche(ip);
  // Zwei Stufen: schnelle Bremse je Instanz, verbindliche Sperre ueber alle
  // Instanzen (anmelde-sperre.ts) — die erste allein griff auf Produktion nicht.
  if (!grenze.allowed || (await istGesperrt(ip))) {
    return NextResponse.json(
      { ok: false, error: 'too_many_attempts' },
      { status: 429, headers: { 'Retry-After': String(Math.max(grenze.retryAfterSeconds, 900)) } },
    );
  }
  const { password } = await req.json().catch(() => ({ password: undefined }));
  const secret = process.env.STUDIO_PASSWORD;
  const isProd = process.env.NODE_ENV === 'production';

  // In production: STUDIO_PASSWORD must be set, otherwise fail-closed (no login possible).
  // In development: open login when no password configured.
  if (!secret) {
    if (isProd) {
      return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
    }
  } else if (typeof password !== 'string' || !safeEqual(makeToken(password), makeToken(secret))) {
    // Beide Seiten als Hash vergleichen: gleiche Laenge, also verraet auch die
    // Laufzeit nicht die Laenge des Passworts.
    // Jeder Fehlversuch wird gemerkt und kostet eine Sekunde.
    await merkeFehlversuch(ip);
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = secret ? makeToken(secret) : 'dev';

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

// DELETE — logout: clear the session cookie
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
