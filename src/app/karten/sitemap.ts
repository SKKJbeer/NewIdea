import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { siteUrlOrLocal } from '@/lib/site';
import { kartenAnzahl, kartenTeil, teileFuer } from '@/lib/sitemap-karten';

// ALLE KARTENSEITEN — aufgeteilt in /karten/sitemap/0.xml, 1.xml, …
// Die Teile werden in robots.txt gemeldet. Siehe `sitemap-karten.ts`.

// BEI ABRUF ERZEUGT, NICHT BEIM BAUEN.
//
// Beim Bauen erzeugt, blieb ein Aussetzer bis zum naechsten Deploy stehen —
// genau so war Teil 1 auf Produktion leer. Google holt Sitemaps nur wenige Male
// am Tag; die Last ist vernachlaessigbar, und ein Fehler betrifft nur diesen
// einen Abruf. Scheitert die Datenbank, antwortet der Abruf mit einem Fehler
// statt mit einer leeren Liste (siehe `kartenTeil`).
export const dynamic = 'force-dynamic';

export async function generateSitemaps() {
  const teile = teileFuer(await kartenAnzahl());
  return Array.from({ length: teile }, (_, id) => ({ id }));
}

// 15 Minuten im geteilten Datenspeicher (v6.21.2): 1–2,5 s je Teil, bei jedem
// Abruf neu. `kartenTeil` wirft bei Datenbankfehlern — ein Wurf wird nicht abgelegt.
const teilGespeichert = unstable_cache((teil: number) => kartenTeil(teil), ['sitemap-karten-teil-v1'], { revalidate: 900 });

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const teil = Number(await id);
  const basis = siteUrlOrLocal();
  const karten = await teilGespeichert(Number.isFinite(teil) && teil >= 0 ? teil : 0);
  return karten.map((k) => ({
    url: `${basis}/karten/${encodeURIComponent(k.id)}`,
    lastModified: k.updated_at ? new Date(k.updated_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));
}
