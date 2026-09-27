import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { fuehreAutopilotAus } from '@/lib/instagram-autopilot';
import type { Beitragsart } from '@/lib/social-plan';

// INSTAGRAM-AUTOPILOT — ein Lauf pro Tag.
//
// Ausgeloest vom Vercel-Cron am Abend (vercel.json) oder aus dem Studio. Die
// Antwort traegt das vollstaendige Ergebnis: Ein Cron, der „ok" meldet, ohne
// zu sagen, was passiert ist, war schon mehrfach die Ursache wochenlanger
// stiller Ausfaelle (Stolperstellen 21, 24).
//
// Abfrageparameter (nur fuer Studio und Pruefung):
//   ?trocken=1      baut und legt ab, veroeffentlicht nichts
//   ?erzwingen=1    ueberspringt die Tagespruefung (bewusster Nachschlag)
//   ?art=reel|karussell   statt Wochenplan
//   ?ohneStory=1

export const runtime = 'nodejs';
// Reel-Rendering (~60 s) plus Verarbeitung bei Meta (bis ~90 s) plus Story.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = new URL(request.url).searchParams;
  const artRoh = q.get('art');
  const art: Beitragsart | undefined = artRoh === 'reel' || artRoh === 'karussell' ? artRoh : undefined;

  const ergebnis = await fuehreAutopilotAus({
    trocken: q.get('trocken') === '1',
    erzwingen: q.get('erzwingen') === '1',
    ohneStory: q.get('ohneStory') === '1',
    art,
  });

  // `ok` heisst: nichts ist SCHIEFGEGANGEN. „uebersprungen" ist kein Fehler
  // (z. B. schon gepostet), „fehler" in Feed oder Story schon.
  const ok = ergebnis.feed.status !== 'fehler' && ergebnis.story.status !== 'fehler';
  console.log('[cron/social]', JSON.stringify({ ...ergebnis, caption: undefined }));
  return NextResponse.json({ ok, ...ergebnis }, { status: ok ? 200 : 500 });
}
