import { getSupabase } from './supabase';

// GESPEICHERTER INDEXSTAND
//
// ANLASS: Der Marktkontext auf jeder Kartenseite braucht den Indexwert. Bisher
// wurde er dafür jedes Mal neu berechnet — und das heißt: 250 Karten aus der
// Kartendatenbank holen, gemessen 9 bis 17 Sekunden, für EINE Zahl. Ein
// Zwischenspeicher im Arbeitsspeicher federte das ab, aber jede kalt gestartete
// Serverinstanz zahlte den vollen Preis erneut. Auf einem Telefon war das der
// Unterschied zwischen „die Seite ist da" und „die Seite lädt noch".
//
// Der Index ändert sich einmal am Tag. Ihn bei jedem Kartenaufruf neu
// auszurechnen ist keine Genauigkeit, sondern Verschwendung.
//
// ZWEITER NUTZEN, der langfristig der wichtigere ist: Aus den täglichen Ständen
// entsteht eine ECHTE Indexhistorie. Der Marktkopf zeigt heute die Verteilung
// der Messwerte statt einer Kurve, weil es keine gespeicherten Tagesstände gab.
// Ab jetzt sammeln sie sich an — und sobald genug beisammen sind, kann dort
// eine Kurve stehen, die auf Messungen beruht statt auf Rückrechnung.

export interface MarketIndexPoint {
  /** Tag der Messung (ISO). */
  date: string;
  /** Median der gemessenen Bewegungen in Prozent über `windowDays`. */
  value: number;
  cardCount: number;
  setCount: number;
  windowDays: number;
}

function heute(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Schreibt den Indexstand des Tages.
 *
 * Idempotent: Mehrfaches Speichern am selben Tag überschreibt den Eintrag,
 * statt eine zweite Zeile anzulegen. Die Startseite ruft das bei jeder
 * Neuerzeugung auf — stündlich, nicht täglich —, und der jeweils letzte Wert
 * des Tages ist der genaueste.
 */
export async function saveMarketIndex(punkt: Omit<MarketIndexPoint, 'date'>): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Supabase nicht konfiguriert';

  const { error } = await sb.from('market_index').upsert(
    {
      captured_on: heute(),
      value: punkt.value,
      card_count: punkt.cardCount,
      set_count: punkt.setCount,
      window_days: punkt.windowDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'captured_on' },
  );

  // Die ECHTE Meldung zurückgeben, nicht nur „hat nicht geklappt" — eine
  // fehlende Tabelle hat in diesem Projekt schon einmal wochenlang stumm alles
  // lahmgelegt (Stolperstelle 21).
  return error ? error.message : null;
}

/**
 * Liest den zuletzt gespeicherten Indexstand.
 *
 * EINE Zeile aus der Datenbank statt 250 Karten aus dem Netz — das ist der
 * ganze Punkt. Gibt `null` zurück, wenn nichts gespeichert ist; der Aufrufer
 * rechnet dann selbst.
 */
export async function loadLatestMarketIndex(maxAgeDays = 3): Promise<MarketIndexPoint | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('market_index')
    .select('captured_on, value, card_count, set_count, window_days')
    .order('captured_on', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Indexstand] nicht lesbar:', error.message);
    return null;
  }
  if (!data) return null;

  // Auf den Datumsteil kürzen. Die Spalte ist als DATE angelegt und liefert
  // „2026-07-31"; wurde die Tabelle einmal als Zeitstempel angelegt, kommt
  // „2026-07-31T00:00:00+00:00" zurück. Ungekürzt ergäbe das Anhängen von
  // „T00:00:00Z" ein ungültiges Datum — und ein ungültiges Datum besteht jede
  // Altersprüfung, weil Vergleiche mit NaN immer falsch sind. Ein beliebig
  // alter Stand ginge dann als heutiger durch.
  const tag = String(data.captured_on).slice(0, 10);

  // Ein zu alter Stand ist keine Auskunft über heute. Lieber selbst rechnen als
  // eine Zahl von letzter Woche als aktuellen Marktstand ausgeben.
  const alter = (Date.parse(`${heute()}T00:00:00Z`) - Date.parse(`${tag}T00:00:00Z`)) / 86_400_000;
  if (!Number.isFinite(alter) || alter > maxAgeDays) return null;

  return {
    date: tag,
    value: Number(data.value),
    cardCount: Number(data.card_count),
    setCount: Number(data.set_count),
    windowDays: Number(data.window_days) || 30,
  };
}

/**
 * Gespeicherte Indexstände als Reihe — für eine künftige Kurve.
 *
 * Wird heute noch nirgends angezeigt: Zwei oder drei Punkte ergeben keine
 * Kurve, und eine Linie durch zwei Punkte über 30 Tage zu ziehen wäre genau die
 * Sorte Darstellung, die dieses Projekt vermeidet. Die Funktion existiert,
 * damit die Daten von Anfang an zusammenkommen.
 */
export async function loadMarketIndexHistory(days = 90): Promise<MarketIndexPoint[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const seit = new Date();
  seit.setDate(seit.getDate() - days);

  const { data, error } = await sb
    .from('market_index')
    .select('captured_on, value, card_count, set_count, window_days')
    .gte('captured_on', seit.toISOString().split('T')[0])
    .order('captured_on', { ascending: true });

  if (error || !data) return [];
  return data.map((r) => ({
    date: String(r.captured_on).slice(0, 10),
    value: Number(r.value),
    cardCount: Number(r.card_count),
    setCount: Number(r.set_count),
    windowDays: Number(r.window_days) || 30,
  }));
}
