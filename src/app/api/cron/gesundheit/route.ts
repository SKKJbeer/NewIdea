import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { pruefeGesundheit } from '@/lib/gesundheit';

// TÄGLICHE GESUNDHEITSPRÜFUNG ALLER DATEN (12:30 UTC, nach dem letzten Lauf).
// HTTP 500, sobald ein fälliger Punkt nicht hält — sichtbar als roter Cron bei
// Vercel. Befunde bleiben im Speicher-Eimer und stehen im Monitoring oben.

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const g = await pruefeGesundheit();
    if (!g.ok) console.error('[cron/gesundheit] NICHT GESUND:', JSON.stringify(g.punkte.filter((p) => !p.ok)));
    return NextResponse.json(g, { status: g.ok ? 200 : 500 });
  } catch (err) {
    console.error('[cron/gesundheit] fehlgeschlagen:', err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
