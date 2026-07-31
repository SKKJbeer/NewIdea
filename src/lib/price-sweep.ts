import { getSupabase } from './supabase';
import { upsertCardIndex } from './card-index';
import { fetchCardPage } from './pokemon-api';
import { displayPrice } from './pokemon-api';
import type { PokemonCard } from '@/types';

// FLÄCHENDECKENDE PREISERFASSUNG
//
// ANLASS: Die Preis-Historie entstand bisher aus zwei Quellen — einem
// Schnappschuss bei JEDEM Kartenaufruf und einem täglichen Cron über rund 80
// Karten. Beides zusammen deckte einen Bruchteil der Datenbank ab: Eine Karte,
// die niemand anklickt, bekam nie einen Messpunkt. Wer sie ein halbes Jahr
// später aufruft, sieht keinen Verlauf, obwohl die Seite ein halbes Jahr lang
// hätte messen können. Diese Zeit ist nicht nachholbar — Preise von gestern
// gibt es nirgends zu kaufen.
//
// WARUM IN HÄPPCHEN: Die Kartendatenbank hat rund 20.500 Einträge. Bei 250 pro
// Seite sind das ~82 Abrufe, und eine Seite braucht gemessen ~17 Sekunden —
// zusammen etwa 23 Minuten. Das überschreitet jede Serverless-Laufzeit. Der
// Durchlauf merkt sich deshalb seinen Stand in `price_sweep_state` und setzt
// beim nächsten Aufruf genau dort fort. Ein Abbruch mittendrin kostet nichts:
// Beim nächsten Anlauf geht es an derselben Seite weiter.
//
// STABILE REIHENFOLGE: `orderBy=id` ist Pflicht. Ohne feste Sortierung darf die
// API zwischen zwei Abrufen anders sortieren — dann überspringt der Seitenzeiger
// Karten und liest andere doppelt, ohne dass es auffällt.

/** Karten pro Abruf — das Maximum der API. */
export const SWEEP_PAGE_SIZE = 250;

/**
 * Ein neuer Messpunkt wird auch dann geschrieben, wenn sich der Preis nicht
 * geändert hat — sobald der letzte so alt ist.
 *
 * WARUM NICHT JEDEN TAG FÜR JEDE KARTE: 20.500 Zeilen täglich sind rund
 * 750 MB im Jahr und sprengen die Datenbank, ohne eine einzige zusätzliche
 * Aussage zu liefern — zwischen zwei gleichen Preisen liegt eine gerade Linie,
 * und genau die zeichnet das Diagramm ohnehin. Gespeichert wird deshalb bei
 * ÄNDERUNG (verlustfrei für den Verlauf) plus einem regelmäßigen Lebenszeichen,
 * damit auch eine über Monate unveränderte Karte Punkte im sichtbaren Fenster
 * hat und nicht wie „keine Daten" aussieht.
 */
export const HEARTBEAT_DAYS = 7;

export interface SweepState {
  /** Nächste abzurufende Seite (1-basiert). */
  nextPage: number;
  /** Tag, für den dieser Durchlauf zählt (ISO). */
  runDate: string;
  /** Karten in diesem Durchlauf gesehen. */
  seen: number;
  /** In diesem Durchlauf geschriebene Messpunkte. */
  saved: number;
  /** Gesamtzahl Karten laut API — für den Fortschritt. */
  totalCards: number;
  /** Letzter Fehler im Klartext, damit ein Ausfall nicht stumm bleibt. */
  lastError: string | null;
}

export function heute(): string {
  return new Date().toISOString().split('T')[0];
}

export function leererStand(datum = heute()): SweepState {
  return { nextPage: 1, runDate: datum, seen: 0, saved: 0, totalCards: 0, lastError: null };
}

/**
 * Braucht diese Karte heute einen neuen Messpunkt?
 *
 * Reine Funktion — die Regel ist der Kern der ganzen Erfassung und wird
 * deshalb getrennt von Datenbank und Netz geprüft.
 */
export function needsSnapshot(
  preis: number,
  letzter: { price: number; date: string } | undefined,
  heutigesDatum = heute(),
): boolean {
  if (!(preis > 0)) return false;
  if (!letzter) return true;
  // Schon heute erfasst — ein zweiter Schreibvorgang brächte nichts.
  if (letzter.date === heutigesDatum) return false;
  if (letzter.price !== preis) return true;

  const alter =
    (Date.parse(`${heutigesDatum}T00:00:00Z`) - Date.parse(`${letzter.date}T00:00:00Z`)) / 86_400_000;
  return alter >= HEARTBEAT_DAYS;
}

/** Gesamtzahl der Seiten für eine bekannte Kartenzahl. */
export function seitenGesamt(totalCards: number, pageSize = SWEEP_PAGE_SIZE): number {
  if (!(totalCards > 0)) return 0;
  return Math.ceil(totalCards / pageSize);
}

// ── Zustand in Supabase ─────────────────────────────────────────────────────

const STATE_ID = 'default';

export async function loadSweepState(): Promise<SweepState | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('price_sweep_state')
    .select('next_page, run_date, seen, saved, total_cards, last_error')
    .eq('id', STATE_ID)
    .maybeSingle();

  if (error) {
    console.error('[Preis-Sweep] Stand nicht lesbar:', error.message);
    return null;
  }
  if (!data) return leererStand();

  return {
    nextPage: Number(data.next_page) || 1,
    runDate: (data.run_date as string) || heute(),
    seen: Number(data.seen) || 0,
    saved: Number(data.saved) || 0,
    totalCards: Number(data.total_cards) || 0,
    lastError: (data.last_error as string) || null,
  };
}

export async function saveSweepState(state: SweepState): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Supabase nicht konfiguriert';

  const { error } = await sb.from('price_sweep_state').upsert(
    {
      id: STATE_ID,
      next_page: state.nextPage,
      run_date: state.runDate,
      seen: state.seen,
      saved: state.saved,
      total_cards: state.totalCards,
      last_error: state.lastError,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  // Die ECHTE Meldung zurückgeben, nicht nur „hat nicht geklappt" — eine
  // fehlende Tabelle hat schon einmal wochenlang stumm alles lahmgelegt.
  return error ? error.message : null;
}

/**
 * Vermerkt, dass die Selbstfortsetzung nicht angestoßen werden konnte.
 *
 * ANLASS: Beim ersten echten Lauf blieb der Durchlauf bei Seite 8 stehen, weil
 * der Folgeaufruf an eine noch nicht verbundene Domain ging. Sichtbar war
 * davon NICHTS — im Monitoring stand weiterhin der letzte API-Fehler, und der
 * Stillstand sah aus wie ein langsamer Durchlauf. Ein abgerissener Anstoß
 * gehört deshalb genauso in den Stand wie ein Abruffehler.
 */
export async function markChainError(grund: string): Promise<void> {
  const stand = await loadSweepState();
  if (!stand) return;
  await saveSweepState({ ...stand, lastError: `Fortsetzung nicht angestoßen: ${grund}` });
}

// ── Ein Häppchen ────────────────────────────────────────────────────────────

/** Letzte bekannte Messpunkte für eine Menge Karten — eine Abfrage statt 250. */
async function letzteMesspunkte(
  cardIds: string[],
): Promise<Map<string, { price: number; date: string }>> {
  const map = new Map<string, { price: number; date: string }>();
  const sb = getSupabase();
  if (!sb || cardIds.length === 0) return map;

  // Nur das Fenster, das die Entscheidung braucht: Ist der letzte Punkt älter
  // als das Lebenszeichen, wird ohnehin geschrieben.
  const seit = new Date();
  seit.setDate(seit.getDate() - HEARTBEAT_DAYS);

  const { data, error } = await sb
    .from('price_snapshots')
    .select('card_id, captured_on, price')
    .in('card_id', cardIds)
    .gte('captured_on', seit.toISOString().split('T')[0])
    .order('captured_on', { ascending: true });

  if (error || !data) {
    if (error) console.error('[Preis-Sweep] Vergleichswerte nicht lesbar:', error.message);
    return map;
  }
  // Aufsteigend sortiert — der letzte Treffer je Karte gewinnt.
  for (const r of data) {
    map.set(r.card_id as string, {
      price: Number(r.price),
      date: r.captured_on as string,
    });
  }
  return map;
}

async function schreibe(cards: PokemonCard[], datum: string): Promise<number> {
  const sb = getSupabase();
  if (!sb || cards.length === 0) return 0;

  const rows = cards.map((c) => ({
    card_id: c.id,
    card_name: c.name,
    price: displayPrice(c),
    source: c.priceSource || 'cardmarket',
    captured_on: datum,
  }));

  const { error } = await sb
    .from('price_snapshots')
    .upsert(rows, { onConflict: 'card_id,captured_on' });
  if (error) {
    console.error('[Preis-Sweep] Schreiben fehlgeschlagen:', error.message);
    return 0;
  }
  return rows.length;
}

export interface SweepProgress {
  ok: boolean;
  /** Durchlauf für heute abgeschlossen? */
  done: boolean;
  page: number;
  totalPages: number;
  /** In DIESEM Aufruf verarbeitet. */
  pagesThisRun: number;
  seenThisRun: number;
  savedThisRun: number;
  /** Über den ganzen heutigen Durchlauf. */
  seenTotal: number;
  savedTotal: number;
  error?: string;
}

/**
 * Verarbeitet so viele Seiten, wie in das Zeitbudget passen, und merkt sich
 * den Stand.
 *
 * Das Budget ist bewusst knapp unter der Funktionslaufzeit gewählt: Lieber
 * eine Seite weniger und der Stand ist gespeichert, als mitten im Schreiben
 * abgeschnitten zu werden.
 */
export async function sweepChunk({
  budgetMs = 40_000,
  pageSize = SWEEP_PAGE_SIZE,
  now = () => Date.now(),
}: { budgetMs?: number; pageSize?: number; now?: () => number } = {}): Promise<SweepProgress> {
  const start = now();
  const datum = heute();

  const gespeichert = await loadSweepState();
  if (!gespeichert) {
    return {
      ok: false, done: false, page: 0, totalPages: 0, pagesThisRun: 0,
      seenThisRun: 0, savedThisRun: 0, seenTotal: 0, savedTotal: 0,
      error: 'Zustandstabelle nicht lesbar (price_sweep_state angelegt?)',
    };
  }

  // Neuer Tag → von vorn. Der Seitenzeiger des Vortages ist wertlos, weil
  // sich die Kartenzahl geändert haben kann.
  const state: SweepState = gespeichert.runDate === datum ? gespeichert : leererStand(datum);

  let pagesThisRun = 0;
  let seenThisRun = 0;
  let savedThisRun = 0;
  let fehler: string | undefined;

  for (;;) {
    const totalPages = seitenGesamt(state.totalCards, pageSize);
    if (state.totalCards > 0 && state.nextPage > totalPages) break;

    // Vor dem NÄCHSTEN Abruf prüfen, ob das Budget noch für einen reicht —
    // eine angefangene Seite bringt keinen halben Fortschritt.
    if (pagesThisRun > 0 && now() - start > budgetMs) break;

    try {
      const { cards, rawCount, totalCount } = await fetchCardPage(state.nextPage, pageSize);
      if (totalCount > 0) state.totalCards = totalCount;

      // KARTENINDEX MITSCHREIBEN.
      //
      // Diese Seite ist ohnehin geholt; ihre Karten wegzuwerfen und die Suche
      // später erneut nach außen gehen zu lassen, war die eigentliche Ursache
      // der langen Wartezeiten. Ein Fehler hier darf den Preis-Durchlauf NICHT
      // aufhalten — der ist der Pflichtteil, der Index die Zugabe.
      const indexFehler = await upsertCardIndex(cards).catch((e) => String(e));
      if (indexFehler) console.warn('[Kartenindex] nicht geschrieben:', indexFehler);

      const vergleich = await letzteMesspunkte(cards.map((c) => c.id));
      const faellig = cards.filter((c) => needsSnapshot(displayPrice(c), vergleich.get(c.id), datum));
      const geschrieben = await schreibe(faellig, datum);

      seenThisRun += cards.length;
      savedThisRun += geschrieben;
      state.seen += cards.length;
      state.saved += geschrieben;
      state.nextPage += 1;
      state.lastError = null;
      pagesThisRun += 1;

      // STAND NACH JEDER SEITE SICHERN — nicht erst am Ende der Runde.
      //
      // ANLASS: Wird eine Runde vorzeitig beendet (Laufzeitgrenze, Neustart,
      // abgebrochene Anfrage), war bis hierher die gesamte Arbeit dieser Runde
      // für den Seitenzeiger verloren: Die Messpunkte standen zwar in der
      // Datenbank, aber der nächste Anlauf begann wieder bei derselben Seite.
      // Genau so kam der Durchlauf über Seite 32 nicht hinaus. Ein kleiner
      // Schreibvorgang je Seite fällt neben einem Abruf von 10 bis 17 Sekunden
      // nicht ins Gewicht — und macht den Fortschritt nebenbei laufend sichtbar.
      await saveSweepState(state);

      // Ende der Datenbank — falls `totalCount` einmal fehlt. Maßgeblich ist
      // die UNGEFILTERTE Menge: Eine Seite kann komplett aus Vorschau-Karten
      // ohne Preis bestehen; `cards` wäre dann leer, obwohl noch tausende
      // Karten folgen. Der Durchlauf hätte dort stumm aufgehört.
      if (rawCount === 0) break;
    } catch (err) {
      // NICHT weiterzählen: Beim nächsten Anlauf soll genau diese Seite erneut
      // versucht werden. Sonst entstünde ein dauerhaftes Loch im Datensatz.
      fehler = err instanceof Error ? err.message : String(err);
      state.lastError = fehler;
      console.error(`[Preis-Sweep] Seite ${state.nextPage} fehlgeschlagen:`, fehler);
      break;
    }
  }

  const totalPages = seitenGesamt(state.totalCards, pageSize);
  const done = state.totalCards > 0 && state.nextPage > totalPages;

  const schreibFehler = await saveSweepState(state);

  return {
    ok: !fehler && !schreibFehler,
    done,
    page: state.nextPage,
    totalPages,
    pagesThisRun,
    seenThisRun,
    savedThisRun,
    seenTotal: state.seen,
    savedTotal: state.saved,
    error: fehler ?? schreibFehler ?? undefined,
  };
}
