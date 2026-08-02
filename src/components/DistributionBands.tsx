import { verteileBaender, deuteVerteilung } from '@/lib/market-distribution';
import { SECTION_LABEL } from '@/lib/ui';

// VERTEILUNG DER BEWEGUNGEN — beschriftet, gedeutet, ohne Vorwissen lesbar.
//
// DIE FÜNF-SEKUNDEN-PRÜFUNG: Wer die Grafik fünf Sekunden ansieht, muss sagen
// können, WAS er sieht und WARUM es ihn angeht. Die Vorgängerfassung bestand
// keine der beiden Fragen — acht namenlose Balken über einer Achse mit drei
// Zahlen.
//
// DREI ÄNDERUNGEN, jede gegen eine der offenen Fragen:
//   1. Fünf Bänder mit NAMEN in Worten („Starker Rückgang") statt Klassen.
//   2. Anzahl und Anteil an jedem Band — nicht nur eine Balkenhöhe, die man
//      gegen eine unsichtbare Skala schätzen muss.
//   3. Ein Satz darunter, der die Form deutet.
//
// WAAGERECHTE BALKEN, NICHT SENKRECHTE: Senkrechte Balken zwingen die
// Beschriftung entweder in eine Drehung oder auf 13 Zeichen (Stolperstelle 41).
// Waagerecht steht der Name links, der Balken in der Mitte, die Zahl rechts —
// in Leserichtung.

/** Farbe je Richtung und Stärke. Grün und Rot bleiben der RICHTUNG vorbehalten. */
function balkenFarbe(richtung: -1 | 0 | 1, staerke: 'stark' | 'moderat' | 'neutral'): string {
  if (richtung === 0) return 'bg-slate-600/70';
  if (richtung === 1) return staerke === 'stark' ? 'bg-emerald-400' : 'bg-emerald-400/55';
  return staerke === 'stark' ? 'bg-rose-400' : 'bg-rose-400/55';
}

export function DistributionBands({ trends }: { trends: number[] }) {
  const baender = verteileBaender(trends);
  const gesamt = trends.length;
  if (gesamt === 0) return null;

  // Bezug ist das GRÖSSTE Band, nicht die Gesamtzahl: Sonst sind bei einer
  // ausgeglichenen Verteilung alle fünf Balken kurz und nichts ist erkennbar.
  const groesstes = Math.max(...baender.map((b) => b.anzahl), 1);

  return (
    <div>
      <p className={SECTION_LABEL}>Wie sich die {gesamt} gemessenen Karten verteilen</p>

      <div className="mt-4 space-y-1.5">
        {baender.map((b) => (
          <div key={b.label} className="grid grid-cols-[104px_1fr_auto] items-center gap-3 sm:grid-cols-[150px_1fr_auto] sm:gap-4">
            <span className="truncate text-[11px] text-slate-400 sm:text-[12px]">
              <span className="hidden sm:inline">{b.label}</span>
              <span className="sm:hidden">{b.kurz}</span>
            </span>

            {/* Die Spur ist sichtbar, nicht nur der Balken: Ohne sie weiß
                niemand, worauf sich die Länge bezieht. */}
            <span className="flex h-[7px] w-full overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.04]">
              <span
                className={`h-full rounded-full ${balkenFarbe(b.richtung, b.staerke)}`}
                style={{ width: `${(b.anzahl / groesstes) * 100}%` }}
              />
            </span>

            <span className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-[13px] text-slate-200">{b.anzahl}</span>
              <span className="w-[42px] text-right text-[11px] text-slate-600">
                {Math.round(b.anteil)} %
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Die Grenzen gehören dazu — sonst ist „moderat" eine Behauptung. */}
      <p className="mt-3 text-[10px] text-slate-700">
        Grenzen: unverändert = weniger als 2 % Bewegung · moderat = bis 10 % · stark = darüber.
        Bezug ist der Preis vor 30 Tagen.
      </p>

      {/* DER SATZ, der aus einer Tabelle mit Farben eine Auskunft macht. */}
      <p className="mt-4 max-w-2xl border-l border-violet-500/30 pl-4 text-[14px] leading-relaxed text-slate-300">
        {deuteVerteilung(baender)}
      </p>
    </div>
  );
}
