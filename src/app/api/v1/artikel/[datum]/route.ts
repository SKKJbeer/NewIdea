import { NextResponse } from 'next/server';
import { readArticle, getArticleType, ARTICLE_META, artikelPreiseVeraltet } from '@/lib/article-generator';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, artikelDto, gueltigesDatum } from '@/lib/app-api';

// Ein Artikel (v1). Liest nur Gespeichertes — erzeugt nie (kein KI-Aufruf über die App).
export async function GET(_request: Request, { params }: { params: Promise<{ datum: string }> }) {
  const datum = gueltigesDatum((await params).datum);
  const typ = datum ? getArticleType(datum) : null;
  if (!datum || !typ) return NextResponse.json({ error: 'nicht-gefunden' }, { status: 404 });
  try {
    const a = await readArticle(datum);
    if (!a) return NextResponse.json({ error: 'nicht-gefunden' }, { status: 404 });
    return NextResponse.json(
      artikelDto(a, { datum, typ, kategorie: ARTICLE_META[typ].category, archiv: artikelPreiseVeraltet(a) }, siteUrlOrLocal()),
      { headers: { 'Cache-Control': APP_CACHE } },
    );
  } catch (err) {
    console.error('[api/v1/artikel]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
