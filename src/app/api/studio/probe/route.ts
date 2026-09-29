import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { ladeMarktLage } from '@/lib/markt-lage';
import { berichtErzeugen } from '@/lib/market-report-generator';
import { generateArticle, type ArticleType } from '@/lib/article-generator';

// PROBELAUF DER AUTOMATISCHEN TEXTE — erzeugt mit den heutigen Daten, SPEICHERT
// NICHTS. Zeigt neben dem Text den Datenblock, den das Modell gesehen hat:
// Nur so lässt sich prüfen, ob ein steriler Text an den Daten oder am Prompt
// liegt (Nutzer-Auftrag 28.09.2026: „optimiere, bis es wirkliche Markttrends
// und interessante Berichte macht"). Kostet je Aufruf einen KI-Aufruf —
// deshalb nur mit Studio-Anmeldung.

export const runtime = 'nodejs';
export const maxDuration = 300;

const TYPEN: ArticleType[] = ['markt', 'karte', 'strategie', 'set', 'ausblick', 'guide', 'rueckblick'];

export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const art = url.searchParams.get('art') ?? 'marktbericht';

  try {
    if (art === 'marktbericht') {
      const lage = await ladeMarktLage();
      const { reportText, daten, summary, verstoesse, versuche } = await berichtErzeugen(lage);
      return NextResponse.json({
        art,
        daten,
        bestaetigt: lage.bestaetigt.length,
        pool: lage.pool.length,
        // Qualitätsschranke: leer = hätte veröffentlicht werden dürfen.
        verstoesse,
        versuche,
        gewinner: summary?.topGainers.map((c) => `${c.name} (${c.set})`) ?? [],
        text: reportText,
      });
    }
    if (art === 'artikel') {
      const typ = url.searchParams.get('typ') as ArticleType;
      if (!TYPEN.includes(typ)) return NextResponse.json({ error: `typ: ${TYPEN.join(', ')}` }, { status: 400 });
      const datum = new Date().toISOString().slice(0, 10);
      let daten = '';
      let fehler: string | undefined;
      const artikel = await generateArticle(typ, datum, {
        probe: true,
        onDaten: (d) => { daten = d; },
        onAiError: (i) => { fehler = i.message; },
      });
      return NextResponse.json({ art, typ, daten, fehler, ersatztext: artikel.isStatic === true, artikel });
    }
    return NextResponse.json({ error: 'art: marktbericht | artikel' }, { status: 400 });
  } catch (err) {
    console.error('[studio/probe] fehlgeschlagen:', err);
    // Studio-intern: Ursache mitgeben (Stolperstelle 21).
    return NextResponse.json({ error: 'internal_error', grund: err instanceof Error ? err.message.slice(0, 300) : undefined }, { status: 500 });
  }
}
