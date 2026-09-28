import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { neuheitenLauf, leseNeuheiten, neuheitenAktuell } from '@/lib/neuheiten';

// THEMEN: Neuheiten, Japan zuerst, Kommend — täglich (siehe neuheiten.ts).
// 500, wenn der Lauf scheitert oder die Datei danach nicht aktuell ist.

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (new URL(request.url).searchParams.get('nur') === 'stand') {
    const d = await leseNeuheiten();
    const ok = neuheitenAktuell(d);
    return NextResponse.json({
      ok,
      stand: d?.stand ?? null,
      sets: d?.sets.map((s) => ({ setCode: s.setCode, zugeordnet: s.zugeordnet, gesamt: s.gesamt, versiegelt: s.versiegelt.length })) ?? [],
      japan: d?.japan.map((j) => j.id) ?? [],
      kommend: d?.kommend.length ?? 0,
    }, { status: ok ? 200 : 500 });
  }
  try {
    const lauf = await neuheitenLauf();
    console.log('[cron/themen]', JSON.stringify(lauf));
    revalidatePath('/trends');
    revalidatePath('/');
    for (const s of lauf.sets) if (s.indexGeschrieben > 0) revalidatePath(`/sets/${s.setCode}`);
    return NextResponse.json({ ok: true, ...lauf });
  } catch (err) {
    console.error('[cron/themen] fehlgeschlagen:', err);
    // Ursache nur für die angemeldete Studio-Sitzung (interne Diagnose,
    // Stolperstelle 21) — öffentlich bleibt es bei der generischen Antwort.
    const grund = isStudioAuthedFromRequest(request) && err instanceof Error ? err.message.slice(0, 300) : undefined;
    return NextResponse.json({ ok: false, error: 'internal_error', grund }, { status: 500 });
  }
}
