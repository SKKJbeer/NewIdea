// Wandelt externe Bild-URLs in Proxy-URLs (/api/img?u=...) um.
// Der Proxy cacht Bilder auf Vercels CDN (30 Tage + 1 Jahr stale-if-error) —
// damit sind Bilder auch bei TCG-API-/CDN-Ausfall weiter verfügbar.
// Unbekannte Hosts werden unverändert durchgereicht (kein offener Proxy).
//
// ⚠️ NUR für einfache <img>-Tags! NIEMALS in next/image (<Image>) verwenden:
// Der Next-Image-Optimizer lehnt lokale Proxy-URLs mit verschachteltem Query
// mit HTTP 400 (INVALID_IMAGE_OPTIMIZE_REQUEST) ab → Bild lädt nicht.
// next/image-Konsumenten geben die rohe Upstream-URL an (images.pokemontcg.io
// ist in remotePatterns) — der Optimizer cacht selbst 31 Tage (minimumCacheTTL).
// Siehe Stolperstelle 18.

// `images.scrydex.com` kam im QA-Durchlauf dazu: Die Kartendatenbank liefert
// die Logos NEUERER Sets von diesem Host. Unbekannte Hosts reicht `cachedImg`
// unverändert durch — die Inhaltsrichtlinie (CSP, seit v2.35.0) blockierte sie
// dann, und auf /sets blieben vier Set-Logos leer. Über den eigenen Proxy
// laufen sie als gleiche Herkunft und brauchen keine Aufweichung der CSP.
const PROXY_HOSTS = new Set([
  'images.pokemontcg.io',
  'assets.pokemon.com',
  'images.scrydex.com',
  // Neue Sets: Bilder gibt es anfangs nur bei TCGdex (neuheiten.ts, 28.09.2026).
  'assets.tcgdex.net',
]);

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
