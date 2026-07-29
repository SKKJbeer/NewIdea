import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverAuthClient } from '@/lib/supabase-auth';

// Rückkehr von Google bzw. Apple: Der mitgegebene Code wird gegen eine Sitzung
// getauscht, die Sitzung landet in HttpOnly-Cookies.
//
// Sicherheit: Weitergeleitet wird ausschließlich auf einen relativen Pfad der
// eigenen Seite. Ohne diese Prüfung wäre `?next=https://fremde-seite` eine
// offene Weiterleitung — ein beliebter Baustein für Phishing.

function safeRedirectPath(raw: string | null): string {
  if (!raw) return '/portfolio';
  // Nur ein einzelner Schrägstrich am Anfang; `//host` wäre protokollrelativ
  // und damit eine externe Adresse.
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/portfolio';
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeRedirectPath(url.searchParams.get('next'));

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
