// Konto-Anmeldung über Supabase Auth (Google und Apple).
//
// WARUM SUPABASE AUTH: Supabase ist bereits die Datenbank des Projekts. Eine
// zweite Anmelde-Infrastruktur (etwa NextAuth) hätte eine eigene Sitzungs-
// verwaltung neben dem bestehenden Studio-Cookie gebraucht — zwei Systeme für
// dasselbe Problem. Supabase Auth bringt Google und Apple mit und schreibt die
// Sitzung in Cookies, die auch der Server lesen kann.
//
// ABGRENZUNG ZUM STUDIO-ZUGANG: Das `studio_session`-Cookie schützt die
// internen Seiten und hat nichts hiermit zu tun. Hier geht es um Besucher, die
// ihr eigenes Portfolio dauerhaft speichern wollen.
//
// OHNE KONFIGURATION: Sind die öffentlichen Supabase-Variablen nicht gesetzt,
// geben alle Funktionen `null` zurück. Die Portfolio-Seite arbeitet dann
// unverändert mit dem localStorage weiter — kein Fehler, nur kein Konto.

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export const AUTH_PROVIDERS = ['google', 'apple'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const PROVIDER_LABEL: Record<AuthProvider, string> = {
  google: 'Mit Google anmelden',
  apple: 'Mit Apple anmelden',
};

/**
 * Öffentliche Zugangsdaten. Der Anon-Key ist zum Veröffentlichen gedacht —
 * die Absicherung übernimmt Row Level Security in der Datenbank, nicht die
 * Geheimhaltung des Schlüssels. Der service_role-Key darf hier NIEMALS stehen.
 */
export function authConfig(): { url: string; anonKey: string } | null {
  if (!isLoginEnabled()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Sichtbarkeits-Schalter für die Anmeldung.
 *
 * Getrennt von den Zugangsdaten, damit sich Supabase einrichten und prüfen
 * lässt, OHNE dass Besucher schon eine halb fertige Anmeldung sehen. Erst
 * `NEXT_PUBLIC_PORTFOLIO_LOGIN=on` schaltet sie frei.
 *
 * Bewusst „opt-in": Ein vergessener Schalter bedeutet, dass ein Feature nicht
 * erscheint — nicht, dass eines versehentlich erscheint.
 */
export function isLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PORTFOLIO_LOGIN === 'on';
}

export function isAuthConfigured(): boolean {
  return authConfig() !== null;
}

/** Client für den Browser. Null, wenn die Anmeldung nicht eingerichtet ist. */
export function browserAuthClient(): SupabaseClient | null {
  const config = authConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
}

/**
 * Client für Server-Komponenten und Route-Handler.
 *
 * `cookieStore` wird übergeben statt hier importiert: `next/headers` lässt sich
 * nicht in eine Datei ziehen, die auch der Browser lädt.
 */
export function serverAuthClient(cookieStore: {
  getAll: () => Array<{ name: string; value: string }>;
  set?: (name: string, value: string, options?: Record<string, unknown>) => void;
}): SupabaseClient | null {
  const config = authConfig();
  if (!config) return null;

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        // In Server-Komponenten ist Schreiben nicht erlaubt — dort fehlt `set`.
        // Die Sitzung wird dann von der Middleware bzw. dem Callback erneuert.
        if (!cookieStore.set) return;
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options as Record<string, unknown>);
        }
      },
    },
  });
}

/**
 * Angemeldeten Nutzer ermitteln.
 *
 * Nutzt `getUser()`, NICHT `getSession()`: getSession liest das Cookie nur aus,
 * ohne es beim Auth-Server zu prüfen — ein manipuliertes Cookie käme damit
 * durch. getUser validiert das Token serverseitig.
 */
export async function currentUser(client: SupabaseClient | null): Promise<User | null> {
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data.user ?? null;
  } catch (err) {
    console.warn('Nutzerprüfung fehlgeschlagen:', err);
    return null;
  }
}

/** Anzeigename für die Oberfläche — nie die rohe E-Mail-Adresse erfinden. */
export function displayName(user: Pick<User, 'email' | 'user_metadata'> | null): string {
  if (!user) return '';
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  return meta.full_name || meta.name || user.email || 'Angemeldet';
}
