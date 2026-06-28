import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'studio_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function makeToken(password: string): string {
  return createHash('sha256').update('pokemarket:studio:' + password).digest('hex');
}

// Constant-time string comparison — prevents timing oracle attacks on the session token.
function safeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

// In production: fail-closed when STUDIO_PASSWORD is not set.
// In development: open (no password needed).
function isDevOpen(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export async function isStudioAuthed(): Promise<boolean> {
  const secret = process.env.STUDIO_PASSWORD;
  if (!secret) return isDevOpen();
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value ?? '';
  return safeEqual(token, makeToken(secret));
}

export function isStudioAuthedFromRequest(request: Request): boolean {
  const secret = process.env.STUDIO_PASSWORD;
  if (!secret) return isDevOpen();
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === COOKIE_NAME);
  const token = match?.[1] ?? '';
  return safeEqual(token, makeToken(secret));
}
