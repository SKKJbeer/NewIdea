import type { NextConfig } from "next";

// Sicherheits-Kopfzeilen für JEDE Antwort.
//
// ANLASS: Vor v2.35.0 lieferte die Seite außer HSTS (von Vercel) keine einzige
// Schutz-Kopfzeile aus. Am schwersten wog das Fehlen eines Rahmen-Schutzes:
// /studio ließ sich unsichtbar in eine fremde Seite einbetten, und dort liegen
// Knöpfe, die Inhalte veröffentlichen und KI-Guthaben verbrauchen — ein
// klassischer Clickjacking-Angriff.
//
// Zur Richtlinie (CSP): `script-src` erlaubt bewusst `'unsafe-inline'`. Next.js
// legt seine Hydrations-Daten als Inline-Skript in die Seite; ohne Nonce aus
// einer Middleware ginge sonst gar nichts. Das ist eine bewusste Abwägung —
// der Gewinn liegt bei `frame-ancestors`, `object-src` und `base-uri`, die
// ohne jeden Nebeneffekt greifen. `unsafe-eval` ist NICHT erlaubt.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.pokemontcg.io https://assets.pokemon.com https://assets.tcgdex.net",
  "font-src 'self' data:",
  // Supabase (Anmeldung + Daten) und die eigene Domain.
  "connect-src 'self' https://*.supabase.co",
  "media-src 'self' blob: https://*.supabase.co",
  // Kein Einbetten, kein Plugin, keine fremde Basis-URL.
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  // Doppelt zu frame-ancestors — ältere Browser kennen nur diese Kopfzeile.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nichts davon braucht die Seite — also nichts davon erlauben.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

// EIGENE DOMAIN (seit v6.18.0): Sobald NEXT_PUBLIC_SITE_URL auf eine eigene
// Domain zeigt, leitet die Vercel-Adresse jeden Seitenaufruf dauerhaft (308)
// dorthin um. Sonst stünde derselbe Inhalt unter zwei Adressen, und Google
// teilt die Bewertung auf.
//
// BEWUSST AN DIE VARIABLE GEKOPPELT, nicht an „Domain existiert": Eine
// Umleitung auf eine Domain, die Vercel noch nicht ausliefert, legte die ganze
// Seite lahm. Die Variable setzt man erst, wenn die Domain im Projekt steht.
//
// /api/* bleibt ausgenommen: Crons, Zähler und Formulare sollen nie über eine
// Umleitung laufen (POST-Körper, Cron-Aufrufe an die Projektadresse).
export const VERCEL_HOST = 'new-idea-livid.vercel.app';

export function domainZiel(siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    const u = new URL(/^https?:\/\//.test(siteUrl.trim()) ? siteUrl.trim() : `https://${siteUrl.trim()}`);
    if (u.hostname === 'localhost' || u.hostname.endsWith('.vercel.app')) return null;
    return `https://${u.hostname}`;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  // Für die Video-Routen ins Function-Bundle zwingen:
  // - die ffmpeg-static-Binary (wird sonst nicht getracet → spawn ENOENT)
  // - die Reel-Schriftart (Vercel hat keine System-Fonts → drawtext scheitert)
  outputFileTracingIncludes: {
    '/api/video/auto-reel': ['./node_modules/ffmpeg-static/**', './src/assets/fonts/**'],
    '/api/video/process': ['./node_modules/ffmpeg-static/**', './src/assets/fonts/**'],
    // Der Instagram-Autopilot rendert Reels — dieselben Dateien wie oben.
    '/api/cron/social': ['./node_modules/ffmpeg-static/**', './src/assets/fonts/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pokemontcg.io' },
      // Neuere Set-Logos liefert die Kartendatenbank von hier. Ohne Eintrag
      // antwortete der Optimierer mit 400, und /sets zeigte Platzhalter.
      // Die Inhaltsrichtlinie bleibt unberuehrt: Optimierte Bilder kommen von
      // der eigenen Adresse.
      { protocol: 'https', hostname: 'images.scrydex.com' },
      { protocol: 'https', hostname: 'assets.tcgdex.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Optimierte Bilder 31 Tage im Vercel-Cache behalten — reduziert
    // Origin-Zugriffe auf die externen Bild-Hosts drastisch
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  async redirects() {
    const ziel = domainZiel(process.env.NEXT_PUBLIC_SITE_URL);
    if (!ziel) return [];
    return [{
      source: '/:pfad((?!api/).*)',
      has: [{ type: 'host', value: VERCEL_HOST.replace(/\./g, '\\.') }],
      destination: `${ziel}/:pfad`,
      permanent: true,
    }];
  },
};

export default nextConfig;
