import { MarketContextPanel } from './MarketContextPanel';
import { getMarketBenchmark, getSetBenchmark, buildMarketContext } from '@/lib/market-context';
import { SECTION_LABEL, SKELETON } from '@/lib/ui';
import type { PokemonCard } from '@/types';

// MARKTKONTEXT ALS NACHSTRÖMENDER ABSCHNITT
//
// BEFUND AUS DEM ECHTEN GERÄT: Die Kartenseite brauchte spürbar lange, und
// währenddessen stand nur ein Platzhalter da. Die Ursache war dieser Abschnitt:
// Er holt den Set-Vergleich und den Indexstand, und der Indexstand kostet auf
// einer kalt gestarteten Serverinstanz die volle Marktstichprobe — gemessen 9
// bis 17 Sekunden. Weil beides VOR dem Rendern abgewartet wurde, wartete die
// ganze Seite darauf: Kartenbild, Preis, Verlauf, Kaufknöpfe — alles hing an
// einer Zahl, die ganz unten steht.
//
// Das ist die falsche Reihenfolge. Wer eine Karte öffnet, will zuerst die Karte
// sehen. Der Vergleich mit dem Markt ist wertvoll, aber er ist nicht das, was
// den ersten Bildschirm füllt.
//
// Dieser Abschnitt lädt deshalb GETRENNT: Die Seite ist sofort da und
// vollständig bedienbar, der Marktkontext erscheint, sobald er vorliegt. Der
// Platzhalter hat dieselbe Höhe wie der fertige Block, damit beim Nachrücken
// nichts springt.

export function MarketContextSkeleton() {
  return (
    <section className="border-t border-[#1c1c24] pt-6" aria-busy="true">
      <p className={SECTION_LABEL}>Marktkontext</p>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className={`h-3 w-32 max-w-full ${SKELETON}`} />
              <div className={`mt-2 h-[3px] w-full max-w-[280px] ${SKELETON}`} />
            </div>
            <div className={`h-5 w-16 ${SKELETON}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Holt Set- und Indexvergleich und stellt sie dar.
 *
 * Wird von der Kartenseite in eine `Suspense`-Grenze gestellt. Schlägt etwas
 * fehl oder reicht die Datenlage nicht, verschwindet der Abschnitt still —
 * ein fehlender Vergleich ist kein Fehler der Seite.
 */
export async function MarketContextSection({ card }: { card: PokemonCard }) {
  const [setBenchmark, marktBenchmark] = await Promise.all([
    card.setCode ? getSetBenchmark(card.setCode) : Promise.resolve(null),
    getMarketBenchmark(),
  ]);

  const kontext = buildMarketContext(card, setBenchmark, marktBenchmark);
  if (!kontext) return null;

  return <MarketContextPanel context={kontext} />;
}
