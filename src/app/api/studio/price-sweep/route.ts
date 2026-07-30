import { NextResponse, after } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { loadSweepState, sweepChunk, seitenGesamt, heute, markChainError } from '@/lib/price-sweep';
import { isSupabaseConfigured } from '@/lib/supabase';

// START- UND STANDANZEIGE FÜR DIE FLÄCHENDECKENDE PREISERFASSUNG
//
// WARUM ZUSÄTZLICH ZUM CRON: Der Tages-Cron stößt den Durchlauf einmal am Tag
// an. Wer ihn JETZT braucht — nach dem Anlegen der Tabelle, nach einem Ausfall,
// oder um überhaupt erst einmal Daten zu bekommen — müsste sonst bis zum
// nächsten Morgen warten. Genau das ist der Grund, warum die Erfassung so
// lange dünn geblieben ist.
//
// Geschützt über die Studio-Anmeldung, NICHT über das Cron-Geheimnis: Der
// Knopf gehört zur Bedienung, und das Cron-Geheimnis hat in einem Browser
// nichts verloren.

export const maxDuration = 60;

/** GET: nur nachsehen, wie weit die Erfassung ist. */
export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const state = await loadSweepState();
  if (!state) {
    return NextResponse.json({
      ok: false,
      error: 'Zustandstabelle fehlt — SQL für price_sweep_state im Monitoring ausführen',
    });
  }

  const totalPages = seitenGesamt(state.totalCards);
  return NextResponse.json({
    ok: true,
    laufTag: state.runDate,
    heute: heute(),
    seite: state.nextPage,
    seitenGesamt: totalPages,
    fertig: totalPages > 0 && state.nextPage > totalPages,
    gesehen: state.seen,
    gespeichert: state.saved,
    kartenGesamt: state.totalCards,
    letzterFehler: state.lastError,
  });
}

/** POST: Durchlauf sofort starten (bzw. fortsetzen, wo er stehen geblieben ist). */
export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  // Die eigene Adresse, nicht NEXT_PUBLIC_SITE_URL: Dort steht die künftige
  // Domain, die noch nicht verbunden ist — der Folgeaufruf lief damit ins Leere
  // und der Durchlauf blieb nach wenigen Seiten stehen.
  const basis = new URL(request.url).origin;

  // Erst eine Runde selbst arbeiten, danach an die Kette übergeben. So ist
  // schon nach dem ersten Klick sichtbar, dass wirklich etwas passiert —
  // und ein Fehler (fehlende Tabelle, Schlüssel) fällt sofort auf, statt
  // stumm in einem Hintergrundlauf zu verschwinden.
  const erste = await sweepChunk({ budgetMs: 30_000 });

  if (erste.ok && !erste.done) {
    after(async () => {
      try {
        await fetch(`${basis}/api/cron/price-sweep?chain=1`, {
          headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
          signal: AbortSignal.timeout(10_000),
        });
      } catch (err) {
        // Stand bleibt erhalten; der nächste Klick oder der Tages-Cron setzt
        // dort fort. Der Abriss wird vermerkt, damit ein Stillstand nicht wie
        // ein langsamer Durchlauf aussieht.
        const grund = err instanceof Error ? err.message : String(err);
        console.warn('[Preis-Sweep] Kette nicht angestoßen:', grund);
        await markChainError(grund);
      }
    });
  }

  return NextResponse.json(erste);
}
