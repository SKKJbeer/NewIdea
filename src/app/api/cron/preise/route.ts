import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { preisEtappe, preisGate, leseDurchlaufStand } from '@/lib/preis-durchlauf';
import { vorwaermen } from '@/lib/vorwaermen';
import { ladeSetListe } from '@/lib/set-liste';
import { oeffentlicheBasis } from '@/lib/site';

// TAEGLICHER PREISDURCHLAUF (alle Karten, TCGdex) — siehe `preis-durchlauf.ts`.
//
// Mehrere Vercel-Crons am fruehen Morgen rufen diese Route auf; jede Etappe
// setzt fort, wo die vorige aufgehoert hat. Ist der Tag schon fertig, kehrt
// sie sofort zurueck.
//
// STATUS 500, wenn die Qualitaetsschranke nicht haelt: Ein Cron, der „200"
// meldet, obwohl die Preise nicht aktuell sind, ist genau der stille Ausfall,
// der hier schon 53 Tage unbemerkt blieb (Stolperstelle 52).

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // War der Tag schon fertig, bevor diese Etappe begann, nutzt sie ihre
    // Zeit zum Vorwaermen der wichtigsten Seiten (siehe vorwaermen.ts).
    const heute = new Date().toISOString().slice(0, 10);
    const vorher = await leseDurchlaufStand().catch(() => null);
    if (vorher?.datum === heute && vorher.fertig) {
      const gate = preisGate(vorher, heute);
      // Set-Liste auffrischen und sichern (Rueckfall fuer /sets, set-liste.ts).
      const sets = await ladeSetListe(24).catch(() => null);
      if (sets?.quelle === 'live') revalidatePath('/sets');
      const warm = await vorwaermen(oeffentlicheBasis(request));
      console.log('[cron/preise] vorgewaermt', JSON.stringify(warm));
      return NextResponse.json({ ok: gate.ok, gate, vorgewaermt: warm }, { status: gate.ok ? 200 : 500 });
    }

    const stand = await preisEtappe({ budgetMs: 240_000 });
    const gate = preisGate(stand, new Date().toISOString().slice(0, 10));
    console.log('[cron/preise]', JSON.stringify({ ...stand, gate }));
    if (stand.fertig) {
      // Neue Preise sollen sofort sichtbar sein, nicht erst nach Ablauf der Cache-Frist.
      revalidatePath('/');
      revalidatePath('/suche');
    }
    return NextResponse.json({ ok: gate.ok, gate, stand }, { status: gate.ok ? 200 : 500 });
  } catch (err) {
    console.error('[cron/preise] fehlgeschlagen:', err);
    // Ursache nur ins Log (Code-Regel 3) — die Antwort nennt keine internen Details.
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
