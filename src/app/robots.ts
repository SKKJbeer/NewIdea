import { MetadataRoute } from 'next';
import { siteUrlOrLocal } from '@/lib/site';

// Keine geratene Adresse — siehe site.ts.
const BASE_URL = siteUrlOrLocal();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/studio/', '/api/', '/changelog/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
