import { unstable_cache } from 'next/cache';
import { searchCards } from './pokemon-api';
import { searchCardIndex, cardsFromIndex } from './card-index';
import { sucheImMotor } from './such-index';
import type { SuchHinweis } from './such-motor';
import type { PokemonCard } from '@/types';

// GETEILTER ZWISCHENSPEICHER FÜR SUCHTREFFER
//
// GEMESSEN am 31.07.2026 an der Produktion: DIESELBE Suche nach „charizard"
// brauchte in drei Läufen hintereinander 7,1 s, 4,3 s und 15,7 s. Zwischen zwei
// identischen Anfragen wurde also nichts wiederverwendet.
//
// Der Grund war nicht das Fehlen eines Zwischenspeichers — `searchCards` hat
// einen. Er liegt aber im Arbeitsspeicher der jeweiligen Serverinstanz, und auf
// Vercel beantwortet praktisch jede Anfrage eine andere. Ein Treffer war damit
// Zufall. Genau dieselbe Verwechslung wie beim Indexstand: „ist
// zwischengespeichert" heißt nicht „wird wiedergefunden".
//
// `unstable_cache` legt das Ergebnis dagegen in den geteilten Datenspeicher der
// Anwendung — instanzübergreifend und über Deployments hinweg, bis die Frist
// abläuft.
//
// WARUM EINE STUNDE — und nicht zehn Minuten, wie zuerst gesetzt:
//
// Gemessen kostet der ERSTE Aufruf eines Begriffs 6 bis 13 Sekunden; jeder
// weitere 0,3. Bei zehn Minuten Frist zahlt ein gefragter Begriff diesen Preis
// bis zu 144-mal am Tag, bei einer Stunde 24-mal. Das ist der wirksamste Hebel
// überhaupt, und er kostet nichts.
//
// Warum nicht länger: Die Suchtreffer enthalten PREISE, und die Kartenseite
// wird stündlich neu erzeugt. Wäre die Suche länger gültig, könnten Suchliste
// und Kartenseite unterschiedliche Preise derselben Karte zeigen. Ein
// Widerspruch zwischen zwei Seiten desselben Produkts wiegt schwerer als eine
// Sekunde Ladezeit — deshalb ist die Frist an die der Kartenseite gekoppelt und
// nicht frei gewählt.
const FRIST_SEKUNDEN = 3600;

/**
 * Suche mit geteiltem Zwischenspeicher.
 *
 * LEERE ERGEBNISSE WERDEN NICHT GESPEICHERT — und das ist der wichtigste Teil.
 *
 * Die Kartendatenbank antwortet messbar unzuverlässig; `searchCards` gibt bei
 * einem Totalausfall eine leere Liste zurück. Würde die gespeichert, wäre ein
 * einzelner Aussetzer zehn Minuten lang als „keine Treffer" festgeschrieben —
 * für alle Besucher gleichzeitig. Ein Zwischenspeicher, der Fehler festhält,
 * ist schlimmer als keiner.
 *
 * `unstable_cache` speichert einen geworfenen Fehler nicht. Deshalb wirft die
 * innere Funktion bei leerem Ergebnis, und der Aufrufer hier fängt das ab: Der
 * Besucher sieht „keine Treffer", der nächste Aufruf versucht es erneut.
 */
export async function cachedSearchCards(query: string, limit = 40): Promise<PokemonCard[]> {
  const normalisiert = query.trim().toLowerCase();
  if (normalisiert.length < 2) return [];

  // ZUERST DER EIGENE KARTENINDEX.
  //
  // Er enthält, was der Tages-Durchlauf ohnehin geholt hat. Eine
  // Datenbankabfrage über wenige Millisekunden ersetzt damit einen Netzaufruf
  // über mehrere Sekunden — und sie kann nicht ausfallen, weil eine fremde
  // Schnittstelle gerade streikt.
  //
  // Kein Zwischenspeicher davor: Die Abfrage ist bereits schnell, und ein
  // Zwischenspeicher über einer schnellen Quelle bringt nichts außer einer
  // weiteren Stelle, an der etwas veralten kann.
  //
  // „KEINE TREFFER" IST EINE ANTWORT, KEIN AUSFALL. Der Index enthaelt alle
  // anzeigbaren Karten (~19.700). Findet er nichts, findet die fremde
  // Kartendatenbank auch nichts Brauchbares — sie kostete aber gemessen 4 s
  // bis zur Zeitgrenze (27.09.2026: „mimikyu gx"). Der Rueckfall laeuft
  // deshalb NUR, wenn der Index selbst ausfaellt (er wirft dann).
  try {
    return await searchCardIndex(normalisiert, limit);
  } catch (err) {
    console.warn('[Suche] Index nicht erreichbar, Rueckfall auf die Kartendatenbank:', err instanceof Error ? err.message : err);
  }

  const laden = unstable_cache(
    async () => {
      const cards = await searchCards(normalisiert, limit);
      if (cards.length === 0) {
        // Siehe oben: nicht speichern, was ein Ausfall sein könnte.
        throw new Error('keine Treffer');
      }
      return cards;
    },
    ['suche', normalisiert, String(limit)],
    { revalidate: FRIST_SEKUNDEN, tags: ['suche'] },
  );

  try {
    return await laden();
  } catch {
    // catch erlaubt: „keine Treffer" ist hier ein gültiges Ergebnis, kein Fehler
    // der Seite — und der Grund steht bereits im Log von `searchCards`.
    return [];
  }
}

export interface KartenSuche {
  karten: PokemonCard[];
  /** Tippfehler-Korrektur / weggelassene Wörter — für „Gesucht nach …" in der Oberfläche. */
  hinweis: SuchHinweis | null;
}

/**
 * DIE Suche für Suchseite, Vorschläge und App (seit v6.31.0).
 *
 * 1. Suchmotor (such-motor.ts) über den täglich gebauten Suchindex: Wörter in
 *    beliebiger Reihenfolge, deutsch/englisch, Set, Nummer, Tippfehler.
 * 2. Findet der Motor nichts (oder ist auf dieser Instanz noch keiner geladen):
 *    die bisherige Datenbank-Suche — sie kennt auch Karten, die seit dem
 *    letzten Indexbau dazugekommen sind.
 * Angezeigt werden IMMER die Zeilen aus dem Kartenindex (frischer Preis), der
 * Motor liefert nur die Reihenfolge.
 */
export async function sucheKarten(query: string, limit = 40, { nurIndex = false } = {}): Promise<KartenSuche> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return { karten: [], hinweis: null };
  const motor = await sucheImMotor(q, limit);
  if (motor && motor.ids.length > 0) {
    const zeilen = new Map<string, PokemonCard>();
    for (let i = 0; i < motor.ids.length; i += 200) {
      for (const [id, k] of await cardsFromIndex(motor.ids.slice(i, i + 200))) zeilen.set(id, k);
    }
    const karten = motor.ids.map((id) => zeilen.get(id)).filter((k): k is PokemonCard => !!k);
    if (karten.length > 0) return { karten, hinweis: motor.hinweis };
  }
  // `nurIndex` (App): kein Rückfall auf die fremde Kartendatenbank — ein
  // Ausfall des eigenen Index WIRFT, die App zeigt dann einen Fehler.
  const karten = nurIndex ? await searchCardIndex(q, limit) : await cachedSearchCards(q, limit);
  return { karten, hinweis: karten.length === 0 ? motor?.hinweis ?? null : null };
}

/**
 * Häufige Begriffe vorwärmen.
 *
 * ZWECK: Der erste Aufruf eines Begriffs kostet 6 bis 13 Sekunden — das trifft
 * genau den Besucher, der zuerst kommt. Wenn ohnehin ein Cron läuft, kann er
 * diesen Preis stellvertretend zahlen.
 *
 * DIE BEGRIFFE KOMMEN AUS DEN DATEN, nicht aus einer Liste im Code. Eine fest
 * verdrahtete Liste („Charizard, Pikachu, …") wäre eine Vermutung darüber, was
 * gesucht wird, und sie veraltet mit jedem neuen Set. Die Kartennamen aus der
 * aktuellen Marktstichprobe sind dagegen genau die, die auf der Startseite
 * stehen — und was dort steht, wird als Nächstes gesucht.
 *
 * Läuft NACHEINANDER, nicht parallel: Der Zweck ist, die Quelle zu entlasten,
 * nicht sie mit zwanzig gleichzeitigen Abfragen zu belegen. Fehler werden
 * gezählt, nicht geworfen — ein misslungenes Vorwärmen ist kein Grund, den
 * Cron scheitern zu lassen.
 */
export async function warmSearchCache(begriffe: string[]): Promise<{ warm: number; fehler: number }> {
  let warm = 0;
  let fehler = 0;
  for (const b of begriffe) {
    try {
      const treffer = await cachedSearchCards(b, 40);
      if (treffer.length > 0) warm++;
      else fehler++;
    } catch {
      // catch erlaubt: Vorwärmen ist eine Zugabe — siehe oben.
      fehler++;
    }
  }
  return { warm, fehler };
}
