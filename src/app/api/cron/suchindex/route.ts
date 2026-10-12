import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { baueSuchIndex, suchIndexStand, suchIndexAktuell } from '@/lib/such-index';
import { mitWiederholung } from '@/lib/qualitaet';

// SUCHINDEX — täglich nach dem Sweep (neue Karten), siehe such-index.ts.
// 500, wenn die Schranke nicht hält: Die alte Datei bleibt dann stehen.

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (new URL(request.url).searchParams.get('nur') === 'stand') {
    const s = await suchIndexStand();
    const ok = suchIndexAktuell(s);
    return NextResponse.json({ ok, ...s }, { status: ok ? 200 : 500 });
  }
  try {
    const r = await mitWiederholung(async () => {
      const x = await baueSuchIndex();
      if (!x.ok) throw new Error(`Schranke: ${x.befund}`);
      return x;
    }, { max: 3, warteMs: 5_000 });
    console.log('[cron/suchindex]', JSON.stringify(r));
    return NextResponse.json(r);
  } catch (err) {
    console.error('[cron/suchindex] fehlgeschlagen:', err);
    const grund = isStudioAuthedFromRequest(request) && err instanceof Error ? err.message.slice(0, 300) : undefined;
    return NextResponse.json({ ok: false, error: 'internal_error', grund }, { status: 500 });
  }
}
