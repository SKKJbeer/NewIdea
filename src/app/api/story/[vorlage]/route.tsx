import { STORY_FORMATE, type StoryFormat } from '@/lib/story-frames';
import { ladeMarktlage, rendereMarktbild, istVorlage } from '@/lib/marktbilder';

// BILDER AUS ECHTEN MARKTDATEN
//
// Diese Route erzeugt die Marktgeschichten als PNG — für Instagram, für
// Teilen-Vorschauen, für Beitragsköpfe. Die Logik liegt in `marktbilder.tsx`,
// damit der Instagram-Autopilot dieselben Zahlen zeigt wie diese Route.
//
// SIE NIMMT KEINEN TEXT ENTGEGEN. Die einzigen Parameter sind die Vorlage und
// das Format; alle Zahlen und Namen stammen aus derselben Marktstichprobe wie
// die Startseite. Eine öffentliche Adresse, die beliebigen Text im
// CardBeacon-Layout setzt, wäre eine Fläche, auf der jeder eine Behauptung
// erzeugen kann, die aussieht wie eine Messung von uns.
//
// Reicht die Datenlage nicht, entsteht KEIN Bild.

export const revalidate = 3600;

function istFormat(f: string): f is StoryFormat {
  return f in STORY_FORMATE;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vorlage: string }> },
) {
  const { vorlage } = await params;
  if (!istVorlage(vorlage)) {
    return new Response('unbekannte Vorlage', { status: 404 });
  }

  const roh = new URL(request.url).searchParams.get('format') ?? 'post';
  const format: StoryFormat = istFormat(roh) ? roh : 'post';

  const lage = await ladeMarktlage();
  if (!lage) return new Response('zu wenig Daten für eine Marktaussage', { status: 503 });

  const png = await rendereMarktbild(vorlage, lage, format);
  if (!png) return new Response('keine gemessene Grundlage für diese Vorlage', { status: 503 });

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // Eine Stunde — dieselbe Frist wie die Startseite, aus der die Zahlen
      // stammen. Ein Bild, das länger gilt als seine Quelle, zeigt irgendwann
      // einen Stand, den es auf der Seite nicht mehr gibt.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
