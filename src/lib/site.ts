// ADRESSE DER SEITE — eine Stelle.
//
// VORGESCHICHTE: Der Rückfallwert `https://pokemarketintelligence.com` stand
// fest verdrahtet in `layout.tsx`, `sitemap.ts` und `robots.ts`. Die Domain war
// nie verbunden. Ergebnis: Jede Seite meldete Suchmaschinen, ihre maßgebliche
// Fassung liege unter einer Adresse, die nicht antwortet — und in der Sitemap
// standen ausschließlich unerreichbare Adressen.
//
// REGEL AB HIER: Es wird keine Produktionsadresse geraten. Gültig ist nur, was
// wirklich existiert:
//
//   1. NEXT_PUBLIC_SITE_URL — die bewusst gesetzte eigene Domain
//   2. die Adresse, unter der dieses Deployment tatsächlich läuft
//   3. gar keine — dann bleiben Verweise relativ
//
// Punkt 2 kommt von der Hosting-Umgebung selbst und ist damit per Definition
// erreichbar. Das ist der entscheidende Unterschied zu einem geratenen Namen.

function normalisieren(wert: string | undefined): string | null {
  if (!wert) return null;
  const getrimmt = wert.trim().replace(/\/+$/, '');
  if (!getrimmt) return null;
  return /^https?:\/\//.test(getrimmt) ? getrimmt : `https://${getrimmt}`;
}

/**
 * Basisadresse für kanonische Verweise, Sitemap und robots.txt.
 *
 * `null` bedeutet: Es ist keine verlässliche Adresse bekannt. Aufrufer müssen
 * diesen Fall behandeln — eine erfundene Adresse ist schlechter als keine.
 */
export function siteUrl(): string | null {
  return (
    normalisieren(process.env.NEXT_PUBLIC_SITE_URL) ??
    // Vercel setzt das auf die Produktionsadresse des Projekts.
    normalisieren(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalisieren(process.env.VERCEL_URL)
  );
}

/**
 * Wie `siteUrl`, aber mit einer Adresse, die sich immer einsetzen lässt.
 *
 * Nur für Stellen, die zwingend eine absolute Adresse brauchen (Sitemap,
 * robots.txt). Ist nichts bekannt, entsteht bewusst eine erkennbar lokale
 * Adresse statt einer plausibel aussehenden, falschen.
 */
export function siteUrlOrLocal(): string {
  return siteUrl() ?? 'http://localhost:3000';
}

/**
 * Adresse fuer Aufrufe der Seite an SICH SELBST (Cron-Ketten, Anstoesse).
 *
 * BEFUND (27.09.2026): Der Preisdurchlauf ist vom 05.08. bis 27.09. kein
 * einziges Mal automatisch gestartet, obwohl der taegliche Cron jeden Tag
 * lief. Von Hand aus dem Studio gestartet lief er sofort. Der Unterschied:
 * Beide riefen `new URL(request.url).origin` auf — beim Studio ist das die
 * oeffentliche Domain, beim Cron moeglicherweise die deployment-eigene
 * Vercel-Adresse, und die sperrt Vercel standardmaessig („Deployment
 * Protection") mit 401.
 *
 * In Produktion deshalb immer die Produktionsadresse, die Vercel selbst setzt
 * und die per Definition oeffentlich ist. Sonst (Vorschau, lokal) die eigene.
 */
export function oeffentlicheBasis(request: Request): string {
  if (process.env.VERCEL_ENV === 'production') {
    const prod = normalisieren(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    if (prod) return prod;
  }
  return new URL(request.url).origin;
}
