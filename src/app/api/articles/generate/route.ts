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
    // Die Ursache eines Fehlschlags einsammeln, damit die Antwort sie nennen
    // kann. Ohne das meldete die Route nur „ist ein Ersatztext" — und ein
    // leeres KI-Guthaben sah damit wie ein Programmfehler aus.
    let aiError: { message: string; raw: string } | null = null;
    let saveError: string | null = null;
    const article = await generateArticle(type, date, {
      replaceFallback: true,
      onAiError: (info) => { aiError = info; },
      onSaveError: (message) => { saveError = message; },
    });
    revalidatePath(`/artikel/${date}`);
    revalidatePath('/artikel');
    return NextResponse.json(
      {
        date,
        type,
        title: article.title,
        // isStatic bedeutet: es ist weiterhin der Fallback — die Generierung hat nicht gegriffen.
        isFallback: article.isStatic === true,
        // Klartext-Ursache, wenn die Erzeugung nicht griff. `raw` bleibt
        // draussen — interne Details gehoeren nicht in eine Antwort.
        reason: aiError ? (aiError as { message: string }).message : undefined,
        // Ohne diese Angabe meldete die Route Erfolg, obwohl nichts ankam —
        // und die Seite erzeugte den Artikel bei jedem Aufruf erneut.
        saved: saveError === null,
        saveError: saveError ?? undefined,
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
