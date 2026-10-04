// BILD-LOADER FÜR next/image (seit v6.20.0).
//
// BEFUND 04.10.2026: Auf Produktion fehlten Kartenbilder. Vercel antwortete auf
// /_next/image mit 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED — das
// kostenlose Kontingent der Bildoptimierung war verbraucht. Bei ~20.000
// Kartenseiten reicht es grundsätzlich nicht; nur bereits zwischengespeicherte
// Bilder kamen noch an.
//
// Jetzt verkleinert der eigene Bild-Proxy (/api/img, sharp) auf die angefragte
// Breite und speichert jede Größe ein Jahr lang im CDN — auch bei Ausfall der
// Quelle (stale-if-error). Kein Kontingent, das ausgehen kann.
//
// Läuft in Browser UND Server, deshalb rein und ohne Abhängigkeiten.

const PROXY_HOSTS = new Set([
  'images.pokemontcg.io',
  'assets.pokemon.com',
  'images.scrydex.com',
  'assets.tcgdex.net',
]);

/** Erlaubte Breiten — jede Breite ist ein eigener Eintrag im CDN, also wenige und feste. */
export const BILD_BREITEN = [32, 64, 96, 128, 256, 384, 640, 828, 1080] as const;

export function bildBreite(w: number): number {
  return BILD_BREITEN.find((b) => b >= w) ?? BILD_BREITEN[BILD_BREITEN.length - 1];
}

export default function bildLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  try {
    const u = new URL(src);
    if (u.protocol === 'https:' && PROXY_HOSTS.has(u.hostname)) {
      return `/api/img?u=${encodeURIComponent(src)}&w=${bildBreite(width)}`;
    }
  } catch {
    // relative Adresse (eigene Datei) — unverändert
  }
  return src;
}
