import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverAuthClient } from '@/lib/supabase-auth';
import { safeRedirectPath } from '@/lib/safe-redirect';

// Rückkehr von Google bzw. Apple: Der mitgegebene Code wird gegen eine Sitzung
// getauscht, die Sitzung landet in HttpOnly-Cookies.
//
// Sicherheit: Weitergeleitet wird ausschließlich auf einen Pfad der eigenen
// Seite. Die Prüfung liegt in `safeRedirectPath` (src/lib/safe-redirect.ts) —
// die frühere Fassung an dieser Stelle ließ sich mit einem Rückstrich und mit
// einem Tabulator umgehen.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeRedirectPath(url.searchParams.get('next'), url.origin);

  // Der Anbieter meldet einen Abbruch als Fehler zurück (z. B. „access_denied").
  const providerError = url.searchParams.get('error');
  if (providerError) {
    return NextResponse.redirect(new URL(`/portfolio?login=abgebrochen`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/portfolio?login=fehlgeschlagen', url.origin));
  }

  const cookieStore = await cookies();
  const client = serverAuthClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });

  if (!client) {
    return NextResponse.redirect(new URL('/portfolio?login=nicht-eingerichtet', url.origin));
  }

  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('Anmeldung fehlgeschlagen:', error.message);
    return NextResponse.redirect(new URL('/portfolio?login=fehlgeschlagen', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
