// Wandelt externe Bild-URLs in Proxy-URLs (/api/img?u=...) um.
// Der Proxy cacht Bilder auf Vercels CDN (30 Tage + 1 Jahr stale-if-error) —
// damit sind Bilder auch bei TCG-API-/CDN-Ausfall weiter verfügbar.
// Unbekannte Hosts werden unverändert durchgereicht (kein offener Proxy).

const PROXY_HOSTS = new Set(['images.pokemontcg.io', 'assets.pokemon.com']);

export function cachedImg(url: string | undefined | null): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' && PROXY_HOSTS.has(u.hostname)) {
      return `/api/img?u=${encodeURIComponent(url)}`;
    }
  } catch {
    // relative oder ungültige URL — unverändert zurückgeben
  }
  return url;
}
