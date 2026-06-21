import { NextResponse } from 'next/server';
import { makeToken, isStudioAuthedFromRequest, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/studio-auth';

// GET — check if current session cookie is valid
export async function GET(request: Request) {
  const ok = isStudioAuthedFromRequest(request);
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}

// POST — validate password, set HttpOnly session cookie
export async function POST(req: Request) {
  const { password } = await req.json();
  const secret = process.env.STUDIO_PASSWORD;

  const valid = !secret || password === secret;
  if (!valid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = secret ? makeToken(secret) : 'dev';
  const isProd = process.env.NODE_ENV === 'production';

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
