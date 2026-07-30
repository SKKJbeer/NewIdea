'use client';

import { formatEur, formatPercent } from '@/lib/format';
import { useInView, EASE_OUT } from '@/lib/use-in-view';

// DATENGRAFIKEN
//
// GRUNDSATZ ZUR FARBE: Steigend ist grün, fallend ist rot. Immer. Die frühere
// Fassung nahm die Akzentfarbe des Artikeltyps als „Aufwärts"-Farbe — beim
// Wochenrückblick ist das grau, und darunter stand eine Legende, die Grün
// versprach. Eine Grafik, die eine Erklärung ihrer Farben braucht, ist noch
// nicht fertig.
//
// GRUNDSATZ ZUR GESTALTUNG: Ein flacher Balken auf flachem Grund wirkt wie ein
// Standard-Plot aus einem Notebook. Was den Unterschied macht, sind wenige
// gezielte Mittel: eine vertiefte Spur, ein Verlauf im Balken, ein farbiger
// Schein darunter, runde Enden — und vor allem der Aufbau beim Hereinscrollen.
// Eine Zahl, die von null auf ihren Wert wächst, wird gelesen; eine, die
// fertig dasteht, wird überblättert.
//
// Ohne JavaScript oder bei „Reduced Motion" steht sofort alles da (useInView).

export interface BarItem {
  name: string;
  price: number;
  trend: number;
}

const BAR_MIN_PCT = 5; // Auch der kleinste Balken bleibt sichtbar.
const STUFE_MS = 90; // Versatz je Zeile — der Aufbau läuft von oben nach unten.

export function TrendChip({ trend }: { trend: number }) {
  if (!trend) return null;
  const up = trend > 0;
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ring-1 ring-inset ${
        up
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-400/20'
          : 'bg-rose-500/10 text-rose-400 ring-rose-400/20'
      }`}
    >
      {formatPercent(trend)}
    </span>
  );
}

/** Gemeinsamer Rahmen aller Grafik-Karten — eine Optik, eine Stelle. */
function Panel({
  title,
  hinweis,
  children,
}: {
  title: string;
  hinweis?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#2a2a3a] bg-gradient-to-b from-[#16161f] to-[#101018] p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
      {/* Sehr dezenter Lichtsaum oben — nimmt der Fläche das Pappige. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
        {hinweis && <p className="text-[10px] tabular-nums text-slate-600">{hinweis}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * Preisrangliste als waagerechte Balken.
 *
 * Waagerecht, weil senkrechte Balken die Kartennamen auf rund 13 Zeichen
 * zwingen („Terapagos …"). Der Wert steht am Balken, nicht in einem Tooltip —
 * auf einem Telefon gibt es kein Hover.
 */
export function PriceBars({ items, title = 'Preisvergleich' }: { items: BarItem[]; title?: string }) {
  const [ref, sichtbar] = useInView<HTMLDivElement>();

  const mitPreis = items.filter((c) => c.price > 0);
  const max = Math.max(...mitPreis.map((c) => c.price), 0);
  if (mitPreis.length < 2 || max <= 0) return null;

  const sortiert = [...mitPreis].sort((a, b) => b.price - a.price);

  return (
    <div ref={ref}>
      <Panel title={title} hinweis={`Höchstwert ${formatEur(max)}`}>
        {/* Hilfslinien bei 25/50/75 % — geben der Fläche einen Maßstab, ohne
            sich in den Vordergrund zu drängen. */}
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {[25, 50, 75].map((p) => (
              <div key={p} className="absolute inset-y-0 w-px bg-white/[0.04]" style={{ left: `${p}%` }} />
            ))}
          </div>

          <div className="relative space-y-3.5">
            {sortiert.map((card, i) => {
              const anteil = Math.max(BAR_MIN_PCT, (card.price / max) * 100);
              const up = card.trend >= 0;
              const verzoegerung = i * STUFE_MS;
              return (
                <div key={card.name} className="group">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="w-3 shrink-0 text-[10px] font-black tabular-nums text-slate-700">
                        {i + 1}
                      </span>
                      <span className="min-w-0 truncate text-[11px] font-semibold text-slate-300 transition-colors group-hover:text-white">
                        {card.name}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="text-[11px] font-black tabular-nums text-white">
                        {formatEur(card.price)}
                      </span>
                      <TrendChip trend={card.trend} />
                    </span>
                  </div>

                  {/* Vertiefte Spur + Balken mit Verlauf und farbigem Schein */}
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#0c0c14] ring-1 ring-inset ring-white/[0.05]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        up
                          ? 'from-emerald-600 via-emerald-500 to-emerald-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.7)]'
                          : 'from-rose-600 via-rose-500 to-rose-300 shadow-[0_0_12px_-2px_rgba(251,113,133,0.7)]'
                      }`}
                      style={{
                        width: sichtbar ? `${anteil}%` : '0%',
                        transition: `width 1100ms ${EASE_OUT} ${verzoegerung}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>
    </div>
  );
}

/**
 * Veränderungen als Balken beidseits einer Nulllinie.
 *
 * Das ist die eigentliche Aussage eines Marktbeitrags: wer steigt, wer fällt
 * und wie weit das auseinanderliegt. Als Zahlenreihe im Fließtext geht das
 * unter, als Bild ist es in einer Sekunde erfasst.
 */
export function TrendBars({
  items,
  title = 'Marktbild — Veränderung',
}: {
  items: BarItem[];
  title?: string;
}) {
  const [ref, sichtbar] = useInView<HTMLDivElement>();

  const relevant = items.filter((c) => c.trend !== 0);
  const max = Math.max(...relevant.map((c) => Math.abs(c.trend)), 0);
  if (relevant.length < 2 || max <= 0) return null;

  const sortiert = [...relevant].sort((a, b) => b.trend - a.trend);
  const steigend = sortiert.filter((c) => c.trend > 0).length;

  return (
    <div ref={ref}>
      <Panel
        title={title}
        hinweis={`${steigend} von ${sortiert.length} im Plus`}
      >
        <div className="space-y-2.5">
          {sortiert.map((card, i) => {
            const anteil = (Math.abs(card.trend) / max) * 50;
            const up = card.trend >= 0;
            const verzoegerung = i * STUFE_MS;
            return (
              <div key={card.name} className="group flex items-center gap-2.5">
                <span className="w-[84px] shrink-0 truncate text-[10px] text-slate-500 transition-colors group-hover:text-slate-300">
                  {card.name}
                </span>

                <div className="relative h-5 flex-1">
                  {/* Nulllinie mit feinen Endkappen — wirkt wie eine Achse,
                      nicht wie ein zufälliger Strich. */}
                  <div
                    aria-hidden
                    className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-600 to-transparent"
                  />
                  <div
                    className={`absolute top-1/2 h-2.5 -translate-y-1/2 ${
                      up
                        ? 'rounded-r-full bg-gradient-to-r from-emerald-600 to-emerald-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.75)]'
                        : 'rounded-l-full bg-gradient-to-l from-rose-600 to-rose-300 shadow-[0_0_12px_-2px_rgba(251,113,133,0.75)]'
                    }`}
                    style={{
                      [up ? 'left' : 'right']: '50%',
                      width: sichtbar ? `${anteil}%` : '0%',
                      transition: `width 1000ms ${EASE_OUT} ${verzoegerung}ms`,
                    }}
                  />
                </div>

                <span
                  className={`w-[54px] shrink-0 text-right text-[11px] font-bold tabular-nums ${
                    up ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatPercent(card.trend)}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/**
 * Einzelner Messbalken um eine Nulllinie — für Kennzahlen, die in beide
 * Richtungen ausschlagen können (etwa ein gewichteter Markttrend).
 *
 * Ohne diese Darstellung ist eine Prozentzahl nur eine Zahl; mit ihr sieht man
 * sofort, ob der Ausschlag klein oder groß ist.
 */
export function ZeroMeter({ value, max }: { value: number; max: number }) {
  const [ref, sichtbar] = useInView<HTMLDivElement>();
  const grenze = Math.max(Math.abs(value), max, 0.01);
  const anteil = (Math.abs(value) / grenze) * 50;
  const up = value >= 0;

  return (
    <div ref={ref} className="relative h-1.5 rounded-full bg-[#0c0c14] ring-1 ring-inset ring-white/[0.05]">
      <div aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-700" />
      <div
        className={`absolute top-0 h-full ${
          up
            ? 'rounded-r-full bg-gradient-to-r from-emerald-600 to-emerald-300 shadow-[0_0_10px_-2px_rgba(52,211,153,0.8)]'
            : 'rounded-l-full bg-gradient-to-l from-rose-600 to-rose-300 shadow-[0_0_10px_-2px_rgba(251,113,133,0.8)]'
        }`}
        style={{
          [up ? 'left' : 'right']: '50%',
          width: sichtbar ? `${anteil}%` : '0%',
          transition: `width 900ms ${EASE_OUT}`,
        }}
      />
    </div>
  );
}

/**
 * Verhältnis zweier Gruppen als geteilter Balken (etwa steigend gegen fallend).
 *
 * „18 von 40 im Plus" ist eine Zahl, die man umrechnen muss. Als geteilter
 * Balken ist das Verhältnis unmittelbar sichtbar.
 */
export function RatioBar({ up, total }: { up: number; total: number }) {
  const [ref, sichtbar] = useInView<HTMLDivElement>();
  if (total <= 0) return null;
  const anteil = (up / total) * 100;

  return (
    <div ref={ref} className="flex h-1.5 overflow-hidden rounded-full bg-[#0c0c14] ring-1 ring-inset ring-white/[0.05]">
      <div
        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 shadow-[0_0_10px_-3px_rgba(52,211,153,0.9)]"
        style={{ width: sichtbar ? `${anteil}%` : '0%', transition: `width 900ms ${EASE_OUT}` }}
      />
      <div
        className="h-full flex-1 bg-gradient-to-r from-rose-500/70 to-rose-400/70"
        style={{ opacity: sichtbar ? 1 : 0, transition: `opacity 900ms ${EASE_OUT}` }}
      />
    </div>
  );
}

/**
 * Schmaler Anteilsbalken für Tabellenzeilen (etwa Ø-Preis je Set).
 *
 * Eine Zahlenspalte lässt sich lesen, aber nicht vergleichen. Der Balken macht
 * aus vier Zahlen eine Rangfolge, die man auf einen Blick erfasst.
 */
export function RowBar({ pct, tone = 'neutral', delay = 0 }: { pct: number; tone?: 'up' | 'down' | 'neutral'; delay?: number }) {
  const [ref, sichtbar] = useInView<HTMLDivElement>();
  const farbe =
    tone === 'up'
      ? 'from-emerald-600 to-emerald-300'
      : tone === 'down'
        ? 'from-rose-600 to-rose-300'
        : 'from-violet-600 to-violet-300';

  return (
    <div ref={ref} className="h-1 overflow-hidden rounded-full bg-[#0c0c14] ring-1 ring-inset ring-white/[0.04]">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${farbe}`}
        style={{
          width: sichtbar ? `${Math.max(BAR_MIN_PCT, pct)}%` : '0%',
          transition: `width 1000ms ${EASE_OUT} ${delay}ms`,
        }}
      />
    </div>
  );
}
