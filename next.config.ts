import type { NextConfig } from "next";
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

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
  "img-src 'self' data: blob: https://images.pokemontcg.io https://assets.pokemon.com",
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

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Für die Video-Routen ins Function-Bundle zwingen:
  // - die ffmpeg-static-Binary (wird sonst nicht getracet → spawn ENOENT)
  // - die Reel-Schriftart (Vercel hat keine System-Fonts → drawtext scheitert)
  outputFileTracingIncludes: {
    '/api/video/auto-reel': ['./node_modules/ffmpeg-static/**', './src/assets/fonts/**'],
    '/api/video/process': ['./node_modules/ffmpeg-static/**', './src/assets/fonts/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pokemontcg.io' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Optimierte Bilder 31 Tage im Vercel-Cache behalten — reduziert
    // Origin-Zugriffe auf die externen Bild-Hosts drastisch
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
