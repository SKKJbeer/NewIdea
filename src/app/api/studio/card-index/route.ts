import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { sweepChunk } from '@/lib/price-sweep';
import { cardIndexStand } from '@/lib/card-index';

// KARTENINDEX VON HAND FÜLLEN UND NACHSEHEN
//
// Der Index wächst nebenbei mit dem täglichen Preis-Durchlauf. Das genügt im
// Betrieb und nicht am ersten Tag: Nach dem Anlegen der Tabelle wäre die Suche
// sonst bis zum nächsten Morgen weiterhin langsam.
//
// Diese Route stößt denselben Durchlauf sofort an — dieselbe Funktion, dasselbe
// Ergebnis, nur ohne auf den Cron zu warten. Sie ist ausdrücklich dynamisch:
// Eine vorgerenderte Route führt ihren Rumpf zur Laufzeit nicht aus, und genau
// daran ist in diesem Projekt schon einmal ein Schreibvorgang zweimal
// gescheitert, ohne dass es auffiel.
//
// Ein Aufruf verarbeitet einen Abschnitt. Die Antwort sagt, wie weit der
// Durchlauf ist — mehrfach aufrufen, bis `done` erreicht ist.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await cardIndexStand());
}

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  // Knapp unter der Laufzeitgrenze bleiben: Ein abgebrochener Aufruf verliert
  // den Fortschritt nicht (der Seitenzeiger wird nach jeder Seite gesichert),
  // aber er liefert auch keine Antwort, an der man den Stand ablesen könnte.
  const fortschritt = await sweepChunk({ budgetMs: 45_000 });
  const stand = await cardIndexStand();

  return NextResponse.json({
    ok: fortschritt.ok,
    fehler: fortschritt.error ?? null,
    fertig: fortschritt.done,
    seite: fortschritt.page,
    seitenGesamt: fortschritt.totalPages,
    karten: stand.zeilen,
    stand: stand.stand,
  });
}
