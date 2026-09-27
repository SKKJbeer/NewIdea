import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { igKonfig } from '@/lib/instagram';
import { holeNach } from '@/lib/instagram-autopilot';

// NACHHOL-LAUF — eine Stunde nach dem Autopiloten.
//
// Meta braucht fuer ein Reel bis zu drei Minuten Verarbeitung. Passte das
// zusammen mit dem Rendern nicht in die 300 s des Hauptlaufs, hat er den
// Container vorgemerkt (Supabase Storage, `offen.json`). Dieser Lauf rendert
// nichts, er veroeffentlicht nur, was bei Meta inzwischen fertig ist.

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const k = igKonfig();
  if (!k) return NextResponse.json({ ok: true, uebersprungen: 'Instagram nicht eingerichtet' });

  try {
    const ergebnis = await holeNach(k);
    console.log('[cron/social/nachholen]', JSON.stringify(ergebnis));
    return NextResponse.json({ ok: ergebnis.verworfen.length === 0, ...ergebnis });
  } catch (err) {
    console.error('[cron/social/nachholen] fehlgeschlagen:', err);
    // Ursache nur ins Log (Code-Regel 3) — die Antwort nennt keine internen Details.
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
