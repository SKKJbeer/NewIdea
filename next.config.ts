import type { NextConfig } from "next";
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Die Reel-Schriftart (drawtext) mit in die Video-Function-Bundles packen —
  // sonst fehlt sie zur Laufzeit auf Vercel und FFmpeg-drawtext schlägt fehl.
  outputFileTracingIncludes: {
    '/api/video/auto-reel': ['./src/assets/fonts/**'],
    '/api/video/process': ['./src/assets/fonts/**'],
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
};

export default nextConfig;
