import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';

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
