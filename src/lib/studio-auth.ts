import { createHash } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'studio_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function makeToken(password: string): string {
  return createHash('sha256').update('pokemarket:studio:' + password).digest('hex');
}

// Returns true if STUDIO_PASSWORD is not set (local dev) or cookie matches
export async function isStudioAuthed(): Promise<boolean> {
  const secret = process.env.STUDIO_PASSWORD;
  if (!secret) return true; // dev: no password configured → open
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return token === makeToken(secret);
}

// Check auth from a raw Request (for API routes that receive Request objects)
export function isStudioAuthedFromRequest(request: Request): boolean {
  const secret = process.env.STUDIO_PASSWORD;
  if (!secret) return true;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === COOKIE_NAME);
  const token = match?.[1];
  return token === makeToken(secret);
}
