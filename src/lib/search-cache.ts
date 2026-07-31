import { unstable_cache } from 'next/cache';
import { searchCards } from './pokemon-api';
import { searchCardIndex } from './card-index';
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
  const ausIndex = await searchCardIndex(normalisiert, limit).catch(() => []);
  if (ausIndex.length > 0) return ausIndex;

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
