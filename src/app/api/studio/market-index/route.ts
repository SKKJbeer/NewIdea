import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { getHomepageCards } from '@/lib/homepage-data';
import { computePmi, validateMarketData } from '@/lib/market-metrics';
import { saveMarketIndex, loadLatestMarketIndex } from '@/lib/market-index-store';
import { isSupabaseConfigured } from '@/lib/supabase';

// INDEXSTAND VON HAND SCHREIBEN UND NACHSEHEN
//
// WARUM DIESE ROUTE EXISTIERT: Der Indexstand wird an drei Stellen geschrieben —
// von der Startseite, von der öffentlichen Index-Schnittstelle und vom
// Tages-Cron. Alle drei haben denselben Haken: Sie laufen nur, wenn sie
// wirklich ausgeführt werden.
//
// Und genau daran ist der erste Anlauf gescheitert. Die Startseite kommt aus
// dem Zwischenspeicher, ihre Funktion läuft dann gar nicht. Die
// Index-Schnittstelle ist beim Bauen vorgerendert — ihr Rumpf läuft zur
// Laufzeit ebenfalls nicht. Beide Male sah der Code richtig aus und schrieb
// nichts, und nachgewiesen ließ es sich nur daran, dass die Tabelle leer blieb.
//
// Diese Route ist der Gegenentwurf: Sie ist ausdrücklich dynamisch, tut genau
// eine Sache, und ihr Ergebnis steht in der Antwort. Damit ist der
// Schreibvorgang prüfbar, statt geglaubt werden zu müssen — und nach einem
// Deployment lässt sich der erste Stand sofort setzen, ohne bis zum nächsten
// Morgen zu warten.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** GET: nachsehen, welcher Stand gespeichert ist. */
export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const stand = await loadLatestMarketIndex(3650);
  return NextResponse.json({ gespeichert: stand });
}

/** POST: Index berechnen und als heutigen Stand schreiben. */
export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  // Dieselbe Stichprobe und dieselbe Prüfung wie überall sonst — sonst stünde
  // hier ein anderer Index als auf der Startseite.
  const cards = await getHomepageCards(250);
  const index = computePmi(validateMarketData(cards).clean);

  if (!index.sufficient) {
    return NextResponse.json({
      ok: false,
      error: `Zu wenig auswertbare Karten (${index.cardCount}/${index.minCards})`,
      cardCount: index.cardCount,
    });
  }

  const fehler = await saveMarketIndex({
    value: index.value,
    cardCount: index.cardCount,
    setCount: index.setCount,
    windowDays: index.windowDays,
  });

  return NextResponse.json({
    ok: !fehler,
    error: fehler,
    value: index.value,
    cardCount: index.cardCount,
    setCount: index.setCount,
    windowDays: index.windowDays,
  });
}
