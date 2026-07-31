import { formatPercent } from '@/lib/format';
import { SECTION_LABEL, NUM, toneClass, barClass } from '@/lib/ui';
import type { MarketContext } from '@/lib/market-context';

// MARKTKONTEXT — die Ansicht dazu.
//
// Bewusst KEINE Kachelreihe. Drei Werte, die miteinander verglichen werden
// sollen, gehören untereinander auf eine gemeinsame Grundlinie — nebeneinander
// in drei Kästen kann man sie nur nacheinander lesen und muss den Vergleich im
// Kopf machen. Genau den soll die Darstellung abnehmen.
//
// Der Balken sitzt auf einer gemeinsamen Nulllinie. Wer die Zeilen von oben
// nach unten liest, sieht den Abstand, bevor er eine Zahl gelesen hat.

export function MarketContextPanel({ context }: { context: MarketContext }) {
  const maxAusschlag = Math.max(...context.rows.map((r) => Math.abs(r.value)), 1);

  return (
    <section aria-labelledby="marktkontext" className="border-t border-[#1c1c24] pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="marktkontext" className={SECTION_LABEL}>
          Marktkontext
        </h2>
        <span className="text-[11px] tabular-nums text-slate-600">
          {context.windowDays} Tage
        </span>
      </div>

      <div className="mt-4">
        {context.rows.map((r) => {
          const anteil = (Math.abs(r.value) / maxAusschlag) * 50;
          const positiv = r.value > 0;
          return (
            <div
              key={r.label}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#1c1c24]/70 py-2.5"
            >
              <div className="min-w-0">
                <p
                  className={`truncate text-[13px] ${
                    r.primary ? 'font-semibold text-slate-100' : 'text-slate-400'
                  }`}
                >
                  {r.label}
                </p>
                {r.meta && (
                  <p className="mt-0.5 text-[11px] tabular-nums text-slate-600">{r.meta}</p>
                )}
                {/* Gemeinsame Nulllinie bei 50 %. */}
                <span className="mt-1.5 block h-[3px] w-full max-w-[280px] bg-[#14141a]" aria-hidden>
                  <span className="relative block h-full w-full">
                    <span
                      className={`absolute top-0 h-full ${barClass(r.value)}`}
                      style={{
                        left: positiv ? '50%' : `${50 - anteil}%`,
                        width: `${Math.max(anteil, 0.6)}%`,
                      }}
                    />
                  </span>
                </span>
              </div>
              <span
                className={`${r.primary ? NUM.large : NUM.row} shrink-0 text-right ${toneClass(r.value)}`}
              >
                {formatPercent(r.value)}
              </span>
            </div>
          );
        })}
      </div>

      {context.relativeToMarket !== null && (
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <div>
            <p className={SECTION_LABEL}>Gegenüber dem Markt</p>
            {/* Prozentpunkte, nicht Prozent — der Unterschied zweier
                Prozentwerte ist keine Prozentzahl. */}
            <p className="mt-1 text-[11px] text-slate-600">
              Abstand zum Index in Prozentpunkten
            </p>
          </div>
          <p className={`${NUM.large} ${toneClass(context.relativeToMarket)}`}>
            {formatPercent(context.relativeToMarket, { digits: 1 }).replace(' %', ' pp')}
          </p>
        </div>
      )}
    </section>
  );
}
