import type { MetadataRoute } from 'next';
import { siteUrlOrLocal } from '@/lib/site';
import { kartenAnzahl, kartenTeil, teileFuer } from '@/lib/sitemap-karten';

// ALLE KARTENSEITEN — aufgeteilt in /karten/sitemap/0.xml, 1.xml, …
// Die Teile werden in robots.txt gemeldet. Siehe `sitemap-karten.ts`.

// Einmal am Tag neu: Der Kartenindex waechst mit jedem Tagesdurchlauf.
export const revalidate = 86400;

export async function generateSitemaps() {
  const teile = teileFuer(await kartenAnzahl());
  return Array.from({ length: teile }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const teil = Number(await id);
  const basis = siteUrlOrLocal();
  const karten = await kartenTeil(Number.isFinite(teil) && teil >= 0 ? teil : 0);
  return karten.map((k) => ({
    url: `${basis}/karten/${encodeURIComponent(k.id)}`,
    lastModified: k.updated_at ? new Date(k.updated_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));
}
