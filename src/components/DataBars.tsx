import { formatEur, formatPercent } from '@/lib/format';

// WIEDERVERWENDBARE DATENGRAFIKEN
//
// Eine Stelle für beide Balkenarten — Artikel und Marktbericht zeigen dasselbe,
// also gibt es dafür auch nur eine Umsetzung (Code-Regel 10).
//
// GRUNDSATZ ZUR FARBE: Steigend ist grün, fallend ist rot. Immer. Die frühere
// Fassung nahm die Akzentfarbe des Artikeltyps als „Aufwärts"-Farbe — beim
// Wochenrückblick ist das grau, und darunter stand eine Legende, die Grün
// versprach. Eine Grafik, die eine Erklärung ihrer Farben braucht, ist noch
// nicht fertig.

export interface BarItem {
  name: string;
  price: number;
  trend: number;
}

const BAR_MIN_PCT = 6; // Auch der kleinste Balken bleibt sichtbar.

export function TrendChip({ trend }: { trend: number }) {
  if (!trend) return null;
  const up = trend > 0;
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
        up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
      }`}
    >
      {formatPercent(trend)}
    </span>
  );
}

/**
 * Preisrangliste als waagerechte Balken.
 *
 * Waagerecht, weil senkrechte Balken die Kartennamen auf rund 13 Zeichen
 * zwingen („Terapagos …"). Hier hat der Name die volle Zeilenbreite.
 * Der Wert steht am Balken, nicht im Tooltip — auf einem Telefon gibt es
 * kein Hover.
 */
export function PriceBars({ items, title = 'Preisvergleich' }: { items: BarItem[]; title?: string }) {
  const mitPreis = items.filter((c) => c.price > 0);
  const max = Math.max(...mitPreis.map((c) => c.price), 0);
  if (mitPreis.length < 2 || max <= 0) return null;

  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{title}</p>
        <p className="text-[10px] tabular-nums text-slate-700">höchster Wert {formatEur(max)}</p>
      </div>

      <div className="space-y-3">
        {[...mitPreis]
          .sort((a, b) => b.price - a.price)
          .map((card) => {
            const anteil = Math.max(BAR_MIN_PCT, (card.price / max) * 100);
            const up = card.trend >= 0;
            return (
              <div key={card.name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-[11px] font-semibold text-slate-300">
                    {card.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[11px] font-black tabular-nums text-white">
                      {formatEur(card.price)}
                    </span>
                    <TrendChip trend={card.trend} />
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#1e1e30]">
                  <div
                    className={`h-full rounded-full ${up ? 'bg-emerald-400' : 'bg-rose-400'}`}
                    style={{ width: `${anteil}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/**
 * Veränderungen als Balken beidseits einer Nulllinie.
 *
 * Das ist die eigentliche Aussage eines Marktbeitrags: wer steigt, wer fällt
 * und wie weit auseinander das liegt. Als Zahlenreihe im Fließtext geht das
 * unter, als Bild ist es in einer Sekunde erfasst.
 */
export function TrendBars({ items, title = 'Marktbild — Veränderung' }: { items: BarItem[]; title?: string }) {
  const relevant = items.filter((c) => c.trend !== 0);
  const max = Math.max(...relevant.map((c) => Math.abs(c.trend)), 0);
  if (relevant.length < 2 || max <= 0) return null;

  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
      <p className="mb-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">{title}</p>

      <div className="space-y-2.5">
        {[...relevant]
          .sort((a, b) => b.trend - a.trend)
          .map((card) => {
            const anteil = (Math.abs(card.trend) / max) * 50;
            const up = card.trend >= 0;
            return (
              <div key={card.name} className="flex items-center gap-2.5">
                <span className="w-[84px] shrink-0 truncate text-[10px] text-slate-500">
                  {card.name}
                </span>
                <div className="relative h-4 flex-1">
                  <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#2a2a3a]" />
                  <div
                    className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-sm ${
                      up ? 'bg-emerald-400/85' : 'bg-rose-400/85'
                    }`}
                    style={up ? { left: '50%', width: `${anteil}%` } : { right: '50%', width: `${anteil}%` }}
                  />
                </div>
                <span
                  className={`w-[52px] shrink-0 text-right text-[10px] font-bold tabular-nums ${
                    up ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatPercent(card.trend)}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
