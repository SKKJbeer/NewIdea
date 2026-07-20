import type { NextConfig } from "next";
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

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
};

export default nextConfig;
