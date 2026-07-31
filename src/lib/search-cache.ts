import { unstable_cache } from 'next/cache';
import { searchCards } from './pokemon-api';
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
// WARUM ZEHN MINUTEN: Preise ändern sich einmal am Tag; die Suche ist eine
// Trefferliste, keine Kursabfrage. Zehn Minuten sind kurz genug, dass eine
// neu erschienene Karte zeitnah auftaucht, und lang genug, dass die üblichen
// Suchen (Charizard, Pikachu, das Set der Woche) den Aussetzern der Quelle
// entzogen sind.
const FRIST_SEKUNDEN = 600;

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
