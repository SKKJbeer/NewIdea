import { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';
import { getArticleType } from '@/lib/article-generator';
import { listSavedArticleMeta } from '@/lib/article-storage';
import { listMarketReportMeta } from '@/lib/market-report-storage';
import { fetchRecentSets } from '@/lib/pokemon-api';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';

// Erzeugt die letzten `count` Publish-Daten (nur Sonntag + Donnerstag), neuester zuerst.
// Rein lokal berechnet — kein Netzwerk-Fetch in der Sitemap-Generierung.
function recentPublishDates(count = 26): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  while (dates.length < count) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (getArticleType(dateStr)) dates.push(dateStr);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                  lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/suche`,             lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/sets`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/artikel`,           lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/guides`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/marktbericht`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/marktbericht/archiv`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/portfolio`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/merkliste`,         lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/impressum`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/datenschutz`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ];

  // Guides — aus lokaler Datenquelle, immer verfügbar.
  const guidePages: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Artikel — vereint lokal berechnete Publish-Daten (immer da) mit den in Supabase
  // gespeicherten Artikeln (falls DB nicht erreichbar: leerer Fallback).
  const savedMeta = await listSavedArticleMeta().catch(() => [] as Awaited<ReturnType<typeof listSavedArticleMeta>>);
  const articleDates = new Set<string>([...recentPublishDates(), ...savedMeta.map((m) => m.date)]);
  const articlePages: MetadataRoute.Sitemap = [...articleDates].map((date) => ({
    url: `${BASE_URL}/artikel/${date}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Wöchentliche Marktberichte aus dem Archiv (falls DB nicht erreichbar: leerer Fallback).
  const reportMeta = await listMarketReportMeta().catch(() => [] as Awaited<ReturnType<typeof listMarketReportMeta>>);
  const reportPages: MetadataRoute.Sitemap = reportMeta.map((r) => ({
    url: `${BASE_URL}/marktbericht/${r.weekStart}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  // Set-Landingpages — die wichtigsten SEO-Einstiege (falls TCG-API down: leerer Fallback).
  const sets = await fetchRecentSets(24).catch(() => []);
  const setPages: MetadataRoute.Sitemap = sets.map((s) => ({
    url: `${BASE_URL}/sets/${s.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...guidePages, ...articlePages, ...reportPages, ...setPages];
}
