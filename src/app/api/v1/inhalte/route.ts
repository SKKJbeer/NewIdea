import { NextResponse } from 'next/server';
import { listSavedArticleMeta } from '@/lib/article-storage';
import { getArticleType, ARTICLE_META } from '@/lib/article-generator';
import { loadLatestMarketReport } from '@/lib/market-report-storage';
import { GUIDES } from '@/lib/guides';
import { listGeneratedGuides } from '@/lib/guide-storage';
import { APP_CACHE } from '@/lib/app-api';

// Übersicht für den Lesen-Tab (v1): neuester Wochenbericht, Artikel (nur
// Veröffentlichungstage So/Do, nicht in der Zukunft) und alle Guides.
export async function GET() {
  try {
    const heute = new Date().toISOString().slice(0, 10);
    const [artikel, bericht, generiert] = await Promise.all([
      listSavedArticleMeta().catch(() => []),
      loadLatestMarketReport().catch(() => null),
      listGeneratedGuides().catch(() => []),
    ]);
    const guides = [...GUIDES, ...generiert.filter((g) => !GUIDES.some((s) => s.slug === g.slug))];
    return NextResponse.json(
      {
        bericht: bericht ? { woche: bericht.weekStart, kw: bericht.weekNumber, erstellt: bericht.createdAt } : null,
        artikel: artikel
          .filter((a) => a.date <= heute && getArticleType(a.date) && a.title)
          .slice(0, 40)
          .map((a) => {
            const typ = getArticleType(a.date)!;
            return { datum: a.date, typ, kategorie: ARTICLE_META[typ].category, titel: a.title };
          }),
        guides: guides.map((g) => ({ slug: g.slug, titel: g.title, beschreibung: g.metaDescription, lesezeit: g.readingTimeMin })),
      },
      { headers: { 'Cache-Control': APP_CACHE } },
    );
  } catch (err) {
    console.error('[api/v1/inhalte]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
