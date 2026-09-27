import { MetadataRoute } from 'next';
import { siteUrlOrLocal } from '@/lib/site';
import { kartenAnzahl, teileFuer } from '@/lib/sitemap-karten';

// Keine geratene Adresse — siehe site.ts.
const BASE_URL = siteUrlOrLocal();

// Bei Abruf erzeugt: Die Zahl der Teil-Sitemaps haengt vom Kartenindex ab. Beim
// Bauen berechnet, haette ein Aussetzer die Zahl bis zum naechsten Deploy auf 1
// gesetzt.
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const teile = teileFuer(await kartenAnzahl());
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // `/studio` OHNE Schraegstrich am Ende: `Disallow: /studio/` sperrt nur
        // Unterseiten, die Studio-Seite selbst blieb erlaubt. Dasselbe fuer
        // das Monitoring, das bisher gar nicht gesperrt war.
        disallow: ['/studio', '/monitoring', '/api/', '/changelog'],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      ...Array.from({ length: teile }, (_, i) => `${BASE_URL}/karten/sitemap/${i}.xml`),
    ],
  };
}
