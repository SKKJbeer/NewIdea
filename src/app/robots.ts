import { MetadataRoute } from 'next';
import { siteUrlOrLocal } from '@/lib/site';
import { kartenAnzahl, teileFuer } from '@/lib/sitemap-karten';

// Keine geratene Adresse — siehe site.ts.
const BASE_URL = siteUrlOrLocal();

// Einmal am Tag neu, damit neu hinzugekommene Karten-Teilsitemaps gemeldet werden.
export const revalidate = 86400;

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
