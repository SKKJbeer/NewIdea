import { INDEX_SHORT, INDEX_LONG } from '@/lib/brand';
import { AmbientBackdrop } from './AmbientBackdrop';
import { NUM, SECTION_LABEL, toneClass, barClass } from '@/lib/ui';
import { formatPercent } from '@/lib/format';
import type { PmiResult, Breadth, FearGreedResult } from '@/lib/market-metrics';
import type { DataCoverage } from '@/lib/data-coverage';

// MARKTKOPF — die visuelle Signatur des Produkts.
//
// ENTWURFSENTSCHEIDUNG: Kein Liniendiagramm.
//
// Ein Index gehört mit einer Kurve dargestellt — dafür braucht es aber
// gespeicherte Indexstände vergangener Tage, und die gibt es nicht. Die
// flächendeckende Preiserfassung läuft erst seit kurzem; eine Kurve daraus wäre
// entweder rückgerechnet (aus Daten, die es für diese Tage nicht gibt) oder
// glatt erfunden. Beides ist ausgeschlossen.
//
// Stattdessen zeigt der Kopf, was WIRKLICH gemessen ist: wie sich die 30-Tage-
// Bewegung über die auswertbaren Karten verteilt. Das beantwortet die Frage
// „was passiert gerade am Markt" sogar direkter als ein Indexpunkt — ein Index
// nahe null kann aus lauter unbewegten Karten entstehen oder aus starken
// Gegenbewegungen, und genau das unterscheidet die Verteilung.
//
// Sobald genügend Tagesstände vorliegen, tritt hier eine Kurve an ihre Stelle.
// Bis dahin steht nichts da, was es nicht gibt.

/** Klassen der Verteilung in Prozentpunkten. Grob genug, um lesbar zu bleiben. */
const KLASSEN = [
  { min: -Infinity, max: -20, label: '< −20' },
  { min: -20, max: -10, label: '−20 bis −10' },
  { min: -10, max: -5, label: '−10 bis −5' },
  { min: -5, max: 0, label: '−5 bis 0' },
  { min: 0, max: 5, label: '0 bis +5' },
  { min: 5, max: 10, label: '+5 bis +10' },
  { min: 10, max: 20, label: '+10 bis +20' },
  { min: 20, max: Infinity, label: '> +20' },
] as const;

export interface Verteilung {
  label: string;
  anzahl: number;
  /** Mitte der Klasse — bestimmt die Richtung und damit die Farbe. */
  richtung: number;
}

/** Zählt die gemessenen Bewegungen in Klassen. Reine Funktion, deshalb prüfbar. */
export function verteilung(trends: number[]): Verteilung[] {
  return KLASSEN.map((k) => ({
    label: k.label,
    anzahl: trends.filter((t) => t >= k.min && t < k.max).length,
    richtung: k.max <= 0 ? -1 : k.min >= 0 ? 1 : 0,
  }));
}

interface Props {
  cbi: PmiResult;
  breite: Breadth;
  stimmung: FearGreedResult;
  abdeckung: DataCoverage | null;
  /** Gemessene 30-Tage-Bewegungen der auswertbaren Karten. */
  trends: number[];
  datenstand: string;
}

export function MarketHeader({ cbi, breite, stimmung, abdeckung, trends, datenstand }: Props) {
  const klassen = verteilung(trends);
  const maxKlasse = Math.max(...klassen.map((k) => k.anzahl), 1);

  return (
    <section aria-labelledby="marktkopf" className="relative border-b border-[#1c1c24]">
      {/* Die Sammler-Struktur liegt NUR hier, im Kopf. Über die ganze Seite
          gezogen würde sie zur Tapete; im Kopf gibt sie dem ersten Bildschirm
          eine Anmutung, ohne einer einzigen Zahl in die Quere zu kommen. */}
      <AmbientBackdrop mode="markt" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        {/* „Marktübersicht · Pokémon TCG", NICHT „Erster Markt: Pokémon".
            Letzteres las sich wie eine Ankündigung an Investoren — als sei
            Pokémon ein Testlauf. Für jemanden, der Karten sammelt, ist Pokémon
            aber nicht der erste Markt, sondern DER Markt. */}
        <h1 id="marktkopf" className={`${SECTION_LABEL} flex items-center gap-2`}>
          Marktübersicht · Pokémon TCG
          <span aria-hidden className="h-1 w-1 rounded-full bg-violet-400/70" />
        </h1>

        {/* Der Indexwert ist die größte Zahl der Seite. Genau eine. */}
        <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-[13px] font-semibold tracking-tight text-slate-300">
                {INDEX_SHORT}
              </span>
              <span className="text-[11px] text-slate-600">{INDEX_LONG}</span>
            </div>
            {cbi.sufficient ? (
              <p className={`${NUM.hero} mt-2 ${toneClass(cbi.value)}`}>
                {formatPercent(cbi.value)}
              </p>
            ) : (
              <p className={`${NUM.hero} mt-2 text-slate-700`}>—</p>
            )}
            <p className="mt-3 text-[11px] text-slate-600">
              {cbi.sufficient
                ? `Gemessene Bewegung über ${cbi.windowDays} Tage`
                : `Noch nicht genügend Daten (${cbi.cardCount}/${cbi.minCards} Karten)`}
            </p>
          </div>

          {/* Verteilung statt Kurve — siehe Kommentar oben.
              `basis-full` bis zum sm-Bereich: Auf 390 px quetschte sich die
              Verteilung neben den Indexwert, die Überschrift brach mitten im
              Wort um und die Achsenbeschriftung lag auf den Balken. Auf dem
              Telefon gehört sie unter die Zahl, nicht daneben. */}
          {cbi.sufficient && trends.length > 0 && (
            <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
              <p className={SECTION_LABEL}>Verteilung der 30-Tage-Bewegung</p>
              <div className="mt-3 flex h-24 items-end gap-1" role="img"
                aria-label={klassen.map((k) => `${k.label} Prozent: ${k.anzahl} Karten`).join(', ')}>
                {klassen.map((k) => (
                  <div key={k.label} className="group flex min-w-0 flex-1 flex-col justify-end gap-1">
                    <span className="text-center text-[10px] tabular-nums text-slate-600">
                      {k.anzahl > 0 ? k.anzahl : ''}
                    </span>
                    <div
                      className={`${barClass(k.richtung)} w-full`}
                      style={{ height: `${Math.max((k.anzahl / maxKlasse) * 64, k.anzahl > 0 ? 2 : 0)}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-slate-700">
                <span>−20 %</span>
                <span>0</span>
                <span>+20 %</span>
              </div>
            </div>
          )}
        </div>

        {/* VIER KENNZAHLEN, VIER SIGNATUREN.
            Vorher standen hier drei typografisch identische Blöcke — dieselbe
            Marke, dieselbe Zahl, dieselbe Fußzeile. Wer darüberliest, merkt
            sich keine davon, weil nichts sie unterscheidet. Jede bekommt jetzt
            eine eigene kleine Darstellung, und zwar eine, die ihren Wert
            WIEDERHOLT statt ihn zu schmücken: der Anteil im Plus als geteilter
            Balken, die Temperatur als Position auf einer Skala, die Stichprobe
            als abzählbare Punkte, die Sets als gestapelte Ebenen. Keine davon
            steht da, wenn der zugehörige Wert nicht gemessen ist. */}
        <dl className="mt-10 grid grid-cols-2 divide-y divide-[#1c1c24] border-y border-[#1c1c24] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="py-4 pr-4 sm:py-5 sm:pr-5">
            <dt className={SECTION_LABEL}>Marktbreite</dt>
            <dd className={`${NUM.large} mt-2 ${breite.total > 0 ? 'text-slate-200' : 'text-slate-700'}`}>
              {breite.total > 0 ? `${Math.round(breite.pct)} %` : '—'}
            </dd>
            {breite.total > 0 && (
              <dd className="mt-2.5 flex h-[3px] max-w-[140px] overflow-hidden" aria-hidden>
                {/* Geteilter Balken: Anteil im Plus gegen Anteil im Minus.
                    Dieselbe Zahl, nur sofort erfassbar. */}
                <span className="bg-emerald-400/70" style={{ width: `${breite.pct}%` }} />
                <span className="flex-1 bg-rose-400/60" />
              </dd>
            )}
            <dd className="mt-2 text-[11px] tabular-nums text-slate-600">
              {breite.total > 0 ? `${breite.up} von ${breite.total} im Plus` : 'keine Messung'}
            </dd>
          </div>

          <div className="py-4 pl-4 sm:px-5 sm:py-5">
            <dt className={SECTION_LABEL}>Temperatur</dt>
            <dd className={`${NUM.large} mt-2 ${stimmung.sufficient ? 'text-slate-200' : 'text-slate-700'}`}>
              {stimmung.sufficient ? stimmung.value : '—'}
            </dd>
            {stimmung.sufficient && (
              <dd className="relative mt-2.5 h-[3px] max-w-[140px] bg-gradient-to-r from-sky-500/60 via-slate-600 to-orange-500/60" aria-hidden>
                {/* Marke auf der Skala — kalt links, heiß rechts. Der Wert ist
                    ein Stand zwischen 0 und 100, kein Balken von null an. */}
                <span
                  className="absolute -top-[3px] h-[9px] w-[2px] bg-slate-200"
                  style={{ left: `calc(${Math.min(Math.max(stimmung.value, 0), 100)}% - 1px)` }}
                />
              </dd>
            )}
            <dd className="mt-2 text-[11px] text-slate-600">
              {stimmung.sufficient ? stimmung.label : 'keine Messung'}
            </dd>
          </div>

          <div className="py-4 pr-4 sm:px-5 sm:py-5">
            <dt className={SECTION_LABEL}>Stichprobe</dt>
            <dd className={`${NUM.large} mt-2 text-slate-200`}>{cbi.cardCount}</dd>
            <dd className="mt-2.5 flex max-w-[140px] flex-wrap gap-[3px]" aria-hidden>
              {/* Ein Punkt je zehn Karten, gedeckelt. Die Menge wird abzählbar,
                  ohne dass 204 Punkte zur Fläche werden. */}
              {Array.from({ length: Math.min(Math.ceil(cbi.cardCount / 10), 28) }).map((_, i) => (
                <span key={i} className="h-[3px] w-[3px] rounded-full bg-slate-500" />
              ))}
            </dd>
            <dd className="mt-2 text-[11px] tabular-nums text-slate-600">{cbi.windowDays} Tage</dd>
          </div>

          <div className="py-4 pl-4 sm:px-5 sm:py-5">
            <dt className={SECTION_LABEL}>Sets</dt>
            <dd className={`${NUM.large} mt-2 text-slate-200`}>{cbi.setCount}</dd>
            <dd className="mt-2.5 flex max-w-[140px] flex-col gap-[2px]" aria-hidden>
              {/* Gestapelte Ebenen — je eine Linie pro Set, bis zu sechs. */}
              {Array.from({ length: Math.min(cbi.setCount, 6) }).map((_, i) => (
                <span
                  key={i}
                  className="h-[2px] bg-violet-400/40"
                  style={{ width: `${100 - i * 13}%` }}
                />
              ))}
            </dd>
            <dd className="mt-2 text-[11px] text-slate-600">mit Stichprobe</dd>
          </div>
        </dl>

        {/* DATENBESTAND ALS EIGENER STREIFEN.
            Er beantwortet die Frage, die jede Kennzahl darüber offen lässt:
            worauf beruht das? Bewusst getrennt von der Stichprobe — der
            Bestand ist, was wir HABEN, die Stichprobe, was in diese Zahlen
            eingeht. Beides in eine Zeile zu setzen hat schon einmal dazu
            geführt, dass die eine für die andere gehalten wurde. */}
        <div className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b border-[#1c1c24] pb-5 text-[11px] tabular-nums text-slate-600">
          {abdeckung && (
            <>
              <span>
                <span className="text-slate-300">{abdeckung.cards.toLocaleString('de-DE')}</span> Karten
                im Bestand
              </span>
              {abdeckung.sets !== null && (
                <span>
                  <span className="text-slate-300">{abdeckung.sets.toLocaleString('de-DE')}</span> Sets
                </span>
              )}
              <span>
                <span className="text-slate-300">{abdeckung.pricePoints.toLocaleString('de-DE')}</span>{' '}
                Preispunkte
              </span>
            </>
          )}
          <span className="ml-auto">
            <span className="text-slate-700">Stand</span> {datenstand}
          </span>
        </div>
      </div>
    </section>
  );
}
