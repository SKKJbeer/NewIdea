import { getSupabase } from './supabase';
import { fetchSetCount } from './pokemon-api';
import { loadSweepState } from './price-sweep';

// DATENABDECKUNG — wie viel die Plattform überhaupt beobachtet.
//
// WARUM DAS GETRENNT VON DEN KENNZAHLEN STEHT: Auf der Startseite stand neben
// dem Marktindex „50 Karten · 4 Sets". Das las sich wie der gesamte
// Datenbestand, war aber die Stichprobe EINER Kennzahl. Tatsächlich werden
// über 19.000 Karten täglich erfasst.
//
// Beides ist wahr und beides gehört hin — aber getrennt:
//
//   Datenabdeckung  = was beobachtet wird
//   Stichprobe      = was für DIESE Kennzahl auswertbar ist
//
// Eine Karte, die heute neu erfasst wurde, gehört sofort in die Abdeckung und
// noch NICHT in eine 30-Tage-Kennzahl. Ihr eine Historie anzudichten, damit
// die Stichprobe größer aussieht, verstößt gegen die Preis-Wahrheitspflicht.

export interface DataCoverage {
  /** Karten, die die Erfassung abdeckt. */
  cards: number;
  /** Sets in der Kartendatenbank. */
  sets: number;
  /** Gespeicherte echte Messpunkte. */
  pricePoints: number;
  /** Tag des letzten vollständigen Durchlaufs (ISO) — null, wenn keiner lief. */
  lastSweep: string | null;
}

/**
 * Zählt die Abdeckung.
 *
 * Alle drei Zahlen kommen aus Quellen, die ohnehin gepflegt werden — es
 * entsteht keine zweite Buchführung, die auseinanderlaufen könnte:
 * die Kartenzahl aus dem Stand des Erfassungslaufs, die Zahl der Messpunkte
 * direkt aus der Tabelle, die Set-Zahl aus der Kartendatenbank.
 *
 * Gibt `null` zurück, wenn nichts Belastbares vorliegt — dann zeigt die
 * Oberfläche gar keine Abdeckung an, statt eine geschätzte.
 */
export async function getDataCoverage(): Promise<DataCoverage | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const [stand, punkte, sets] = await Promise.all([
    loadSweepState().catch(() => null),
    zaehleMesspunkte(),
    fetchSetCount().catch(() => 0),
  ]);

  // Ohne einen einzigen Messpunkt gibt es nichts zu berichten.
  if (punkte === null || punkte === 0) return null;

  const cards = stand?.seen && stand.seen > 0 ? stand.seen : (stand?.totalCards ?? 0);
  if (cards === 0) return null;

  return {
    cards,
    sets,
    pricePoints: punkte,
    lastSweep: stand?.runDate ?? null,
  };
}

/** Zeilenzahl ohne die Zeilen zu übertragen. */
async function zaehleMesspunkte(): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { count, error } = await sb
    .from('price_snapshots')
    .select('card_id', { count: 'exact', head: true });
  if (error) {
    console.error('[Datenabdeckung] Messpunkte nicht zählbar:', error.message);
    return null;
  }
  return count ?? 0;
}
