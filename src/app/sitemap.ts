import { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';
import { getArticleType } from '@/lib/article-generator';
import { listSavedArticleMeta } from '@/lib/article-storage';
import { listMarketReportMeta } from '@/lib/market-report-storage';
import { ladeSetListe } from '@/lib/set-liste';
import { listGeneratedGuideMeta } from '@/lib/guide-storage';
import { leseDurchlaufStand } from '@/lib/preis-durchlauf';
import { siteUrlOrLocal } from '@/lib/site';

// Keine geratene Adresse — siehe site.ts.
const BASE_URL = siteUrlOrLocal();

// Bei Abruf erzeugt, nicht beim Bauen. BEFUND auf Produktion (27.09.2026): Die
// Sitemap enthielt 0 Set-Seiten, weil die Kartendatenbank genau waehrend des
// Builds ausfiel — und der leere Stand blieb bis zum naechsten Deploy stehen.
export const dynamic = 'force-dynamic';

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

// EHRLICHES `lastmod` (Befund 29.09.2026): Vorher trug JEDER Eintrag den
// Zeitpunkt des Abrufs. Google wertet `lastmod` nur, wenn es verlässlich ist —
// ein Wert, der immer „jetzt" sagt, wird ignoriert, und damit auch der echte
// Hinweis auf einen neuen Artikel. Jetzt: das Datum, an dem sich der Inhalt
// wirklich geändert hat — oder gar keins, wenn es unbekannt ist.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Seiten mit Marktdaten ändern sich mit dem täglichen Preisdurchlauf.
  const durchlauf = await leseDurchlaufStand().catch(() => null);
  const preisStand = durchlauf?.fertig ? new Date(durchlauf.aktualisiert) : undefined;

  const seite = (pfad: string, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number, lastModified?: Date) =>
    ({ url: `${BASE_URL}${pfad}`, changeFrequency, priority, ...(lastModified ? { lastModified } : {}) });

  const staticPages: MetadataRoute.Sitemap = [
    seite('/', 'daily', 1.0, preisStand),
    seite('/suche', 'weekly', 0.9),
    seite('/einsteiger', 'monthly', 0.8),
    // Die Methodik ist ein Vertrauensdokument — sie gehört indexiert.
    seite('/methodik', 'monthly', 0.6),
    seite('/sets', 'weekly', 0.8, preisStand),
    seite('/artikel', 'daily', 0.8),
    seite('/guides', 'weekly', 0.8),
    seite('/trends', 'daily', 0.9, preisStand),
    seite('/marktbericht', 'weekly', 0.7),
    seite('/marktbericht/archiv', 'weekly', 0.5),
    seite('/portfolio', 'monthly', 0.5),
    seite('/merkliste', 'monthly', 0.4),
    seite('/impressum', 'yearly', 0.2),
    seite('/datenschutz', 'yearly', 0.2),
  ];

  // Guides — statische (lokal, ohne bekanntes Datum) + generierte (mit Erstellzeit).
  const generiert = await listGeneratedGuideMeta().catch(() => [] as Array<{ slug: string; createdAt: string | null }>);
  const erstellt = new Map(generiert.map((g) => [g.slug, g.createdAt]));
  const guideSlugs = [...new Set([...GUIDES.map((g) => g.slug), ...generiert.map((g) => g.slug)])];
  const guidePages: MetadataRoute.Sitemap = guideSlugs.map((slug) => {
    const c = erstellt.get(slug);
    return seite(`/guides/${slug}`, 'monthly', 0.6, c ? new Date(c) : undefined);
  });

  // Artikel — lokal berechnete Publish-Daten (immer da) + gespeicherte. Datum des
  // Artikels = Erscheinungstag (08:00 UTC, Lauf des Tages-Crons).
  const savedMeta = await listSavedArticleMeta().catch(() => [] as Awaited<ReturnType<typeof listSavedArticleMeta>>);
  const articleDates = new Set<string>([...recentPublishDates(), ...savedMeta.map((m) => m.date)]);
  const articlePages: MetadataRoute.Sitemap = [...articleDates].map((date) =>
    seite(`/artikel/${date}`, 'monthly', 0.6, new Date(`${date}T08:00:00Z`)),
  );

  // Wöchentliche Marktberichte: Erstellzeitpunkt aus der Datenbank.
  const reportMeta = await listMarketReportMeta().catch(() => [] as Awaited<ReturnType<typeof listMarketReportMeta>>);
  const reportPages: MetadataRoute.Sitemap = reportMeta.map((r) =>
    seite(`/marktbericht/${r.weekStart}`, 'monthly', 0.4, r.createdAt ? new Date(r.createdAt) : undefined),
  );

  // Set-Landingpages — ALLE Sets, mit gesicherter Liste als Rückfall
  // (`ladeSetListe`): Fiel pokemontcg.io aus, stand die Sitemap ohne ein
  // einziges Set da (27.09.2026). Inhalt = Kartenpreise → Stand des Durchlaufs.
  const setListe = await ladeSetListe(250).catch(() => null);
  const setPages: MetadataRoute.Sitemap = (setListe?.sets ?? []).map((s) =>
    seite(`/sets/${s.id}`, 'weekly', 0.7, preisStand),
  );

  // Kartenseiten stehen NICHT hier, sondern in eigenen Teil-Sitemaps
  // (/karten/sitemap/N.xml, gemeldet in robots.txt) — alle ~20.000 statt
  // bisher 40. Siehe `src/lib/sitemap-karten.ts`.

  return [...staticPages, ...guidePages, ...articlePages, ...reportPages, ...setPages];
}
