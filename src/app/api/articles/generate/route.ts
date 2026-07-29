import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { generateArticle, getArticleType } from '@/lib/article-generator';

// Manueller Auslöser für die Artikel-Generierung (passwortgeschützt).
//
// Zweck: Artikel, die wegen eines früheren Fehlers als Evergreen-Fallback
// gespeichert wurden, durch echte, datenbasierte Beiträge ersetzen — ohne bis
// zum nächsten Publish-Tag zu warten.
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date } = await request.json().catch(() => ({ date: undefined }));
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date (YYYY-MM-DD) fehlt oder ist ungültig' }, { status: 400 });
  }

  const type = getArticleType(date);
  if (!type) {
    return NextResponse.json(
      { error: 'Kein Publish-Tag — Artikel erscheinen nur sonntags und donnerstags' },
      { status: 400 },
    );
  }

  try {
    const article = await generateArticle(type, date, { replaceFallback: true });
    revalidatePath(`/artikel/${date}`);
    revalidatePath('/artikel');
    return NextResponse.json(
      {
        date,
        type,
        title: article.title,
        // isStatic bedeutet: es ist weiterhin der Fallback — die Generierung hat nicht gegriffen.
        isFallback: article.isStatic === true,
        sections: article.sections.length,
        readingTimeMin: article.readingTimeMin,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('Manuelle Artikel-Generierung fehlgeschlagen:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
