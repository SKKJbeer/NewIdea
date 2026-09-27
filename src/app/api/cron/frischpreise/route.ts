import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { erfasseFrischpreise } from '@/lib/frischpreise';

// TAEGLICHE FRISCHPREISE — siehe `src/lib/frischpreise.ts`.
// Laeuft nach dem Preisdurchlauf und vor dem Instagram-Autopiloten.

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const ergebnis = await erfasseFrischpreise();
    console.log('[cron/frischpreise]', JSON.stringify(ergebnis));
    // Weniger als 50 frische Karten reichen fuer keinen Beitrag — das ist ein
    // Befund, kein Erfolg (Stolperstelle 24c).
    const ok = ergebnis.frisch >= 50;
    return NextResponse.json({ ok, ...ergebnis }, { status: ok ? 200 : 500 });
  } catch (err) {
    console.error('[cron/frischpreise] fehlgeschlagen:', err);
    return NextResponse.json({ ok: false, fehler: err instanceof Error ? err.message : 'unbekannt' }, { status: 500 });
  }
}
