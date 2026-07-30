import { NextResponse } from 'next/server';
import { sweepChunk, markChainError } from '@/lib/price-sweep';
import { isSupabaseConfigured } from '@/lib/supabase';

// FLÄCHENDECKENDE PREISERFASSUNG — Antrieb
//
// Ein voller Durchlauf über die ~20.500 Karten dauert etwa 23 Minuten und passt
// damit in keine Serverless-Laufzeit. Diese Route verarbeitet deshalb ein
// Häppchen und ruft sich danach SELBST erneut auf, bis der Tag fertig ist.
//
// WARUM NICHT ÖFTER PER CRON: Vercel begrenzt Anzahl und Taktung der Cron-Jobs
// (auf dem kleinen Tarif zwei, beide sind vergeben). Die Selbstfortsetzung ist
// davon unabhängig — sie braucht nur einen Anstoß pro Tag.
//
// WARUM DIE ARBEIT IN DER ANFRAGE LÄUFT und nicht in `after()`: Zuerst war es
// umgekehrt — Antwort sofort, Arbeit danach. Im echten Betrieb brach die Kette
// damit reproduzierbar nach fünf bis sechs Übergaben ab (zuletzt bei Seite 20,
// 32 und 49 von 82), ohne Fehler und ohne Log: Die nach der Antwort geplante
// Arbeit wurde schlicht nicht mehr ausgeführt. Was IN der Anfrage passiert,
// läuft dagegen garantiert.
//
// Der Aufrufer wartet deshalb nicht auf das Ergebnis — er bricht seinen Abruf
// nach wenigen Sekunden ab. Das beendet die laufende Runde nicht; sie arbeitet
// weiter und stößt am Ende selbst die nächste an. Der Fortschritt ist deshalb
// NICHT in dieser Antwort zu suchen, sondern in `price_sweep_state`.
//
// SICHERUNG GEGEN ENDLOSSCHLEIFEN, doppelt:
//   1. `chain` zählt die Fortsetzungen und ist hart gedeckelt.
//   2. Der Durchlauf endet ohnehin, sobald der Seitenzeiger über die letzte
//      Seite des Tages hinaus ist — ein weiterer Aufruf tut dann nichts.

// LÄNGER STATT ÖFTER.
//
// BEFUND AUS DEM ECHTEN LAUF: Mit 60 Sekunden schaffte eine Runde ein bis drei
// Seiten — für 82 Seiten also rund 40 Übergaben, und irgendwo dazwischen riss
// die Kette lautlos ab (zuletzt bei Seite 20). Jede Übergabe ist ein möglicher
// Abrisspunkt; die zuverlässigste Kette ist die kürzeste. Mit 300 Sekunden
// bleiben etwa fünf Übergaben für den ganzen Tag.
export const maxDuration = 300;

/** Genug für einen ganzen Tag (~82 Seiten bei ~15 je Runde), zu wenig für eine Dauerschleife. */
const MAX_CHAIN = 150;

/**
 * Arbeitszeit je Runde.
 *
 * BEWUSST WEIT UNTER `maxDuration`: Ob die längere Laufzeit auf dem
 * gebuchten Tarif tatsächlich gewährt wird, ist von außen nicht erkennbar —
 * wird eine Runde vorher abgeschnitten, stößt sie die nächste nicht mehr an
 * und die Kette ist tot. 45 Sekunden halten auch die kleinste Grenze ein.
 * Dass das mehr Übergaben bedeutet, ist verkraftbar, seit der Stand nach
 * JEDER Seite gesichert wird — eine abgebrochene Runde kostet dann höchstens
 * eine Seite, nicht ihre gesamte Arbeit.
 */
const BUDGET_MS = 45_000;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  const url = new URL(request.url);
  const chain = Number(url.searchParams.get('chain')) || 0;
  const sync = url.searchParams.get('sync') === '1';

  // IMMER die Adresse, unter der dieser Aufruf gerade läuft — NICHT
  // NEXT_PUBLIC_SITE_URL.
  //
  // BEFUND AUS DEM ERSTEN ECHTEN LAUF: Dort stand die künftige eigene Domain,
  // die noch nicht verbunden ist. Jeder Folgeaufruf lief damit ins Leere, und
  // der Durchlauf blieb nach wenigen Seiten stehen — ohne Fehlermeldung, weil
  // ein gescheiterter Anstoß bewusst abgefangen wird. Die eigene Adresse ist
  // die einzige, die garantiert erreichbar ist: Sie hat diese Anfrage
  // schließlich gerade beantwortet.
  const basis = url.origin;

  async function runde() {
    const progress = await sweepChunk({ budgetMs: BUDGET_MS });

    // Fortsetzen, solange etwas zu tun ist. Auch nach einem Seitenfehler:
    // Der Zeiger steht dann noch auf derselben Seite, der nächste Anlauf
    // versucht sie erneut. Die Kartendatenbank hat regelmäßig kurze Aussetzer
    // (Stolperstelle 28), die keinen ganzen Tag kosten dürfen.
    if (!progress.done && chain < MAX_CHAIN) {
      try {
        await fetch(`${basis}/api/cron/price-sweep?chain=${chain + 1}`, {
          headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
          // Kein Zwischenspeicher: Der Anstoß MUSS jedes Mal wirklich rausgehen.
          cache: 'no-store',
          // Nur das Absenden zählt. Die nächste Runde arbeitet danach rund 45
          // Sekunden weiter — darauf zu warten würde diese Runde über ihre
          // eigene Laufzeitgrenze treiben.
          signal: AbortSignal.timeout(3_000),
        });
      } catch (err) {
        // Das eigene kurze Zeitlimit ist der Normalfall, KEIN Fehler: Die
        // Anfrage ist raus, die nächste Runde läuft. Alles andere ist ein
        // echter Abriss und muss sichtbar werden — ohne diesen Vermerk sieht
        // ein Stillstand aus wie ein langsamer Durchlauf.
        const abgebrochen = err instanceof Error && err.name === 'TimeoutError';
        if (!abgebrochen) {
          const grund = err instanceof Error ? err.message : String(err);
          console.warn('[Preis-Sweep] Fortsetzung nicht angestoßen:', grund);
          await markChainError(grund);
        }
      }
    }
    return progress;
  }

  const progress = await runde();
  return NextResponse.json({ chain, sync, ...progress });
}
