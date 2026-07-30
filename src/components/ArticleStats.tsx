'use client';

import { TrendingUp, TrendingDown, Layers, ArrowLeftRight } from 'lucide-react';
import { formatEur, formatPercent } from '@/lib/format';
import type { BarItem } from './DataBars';
import { CountUp } from './CountUp';
import { useInView, EASE_OUT } from '@/lib/use-in-view';

// KENNZAHLEN-STREIFEN
//
// Zweck: Ein Beitrag, der nur aus Fließtext besteht, verlangt vom Leser, sich
// die Lage selbst zusammenzusuchen. Diese vier Kacheln beantworten in einem
// Blick, worum es geht — und sie stehen bewusst VOR dem Text.
//
// Alle Werte stammen aus den Karten des Beitrags (echte Preise, echte
// Trendwerte). Es wird nichts geschätzt und nichts hochgerechnet: Reicht die
// Datenlage nicht, erscheint der Block gar nicht (CLAUDE.md, Stolperstelle 29 —
// aus fehlenden Daten niemals Kennzahlen ableiten).
//
// Zur Gestaltung: Der Rahmen ist ein feiner Verlauf statt einer flachen Linie,
// das Symbol sitzt in einer getönten Fläche mit Schein, und die Kacheln bauen
// sich beim Hereinscrollen versetzt auf. Wenige Mittel, aber sie trennen eine
// Oberfläche von einem Standard-Plot.

interface Props {
  /** Minimale Form — Artikel und Marktbericht liefern beide diese Felder. */
  cards: BarItem[];
  /** Beschriftung der ersten Kachel je nach Kontext. */
  label?: string;
}

type Ton = 'neutral' | 'up' | 'down';

const TON_KLASSEN: Record<Ton, { text: string; chip: string; glow: string; linie: string }> = {
  up: {
    text: 'text-emerald-400',
    chip: 'bg-emerald-500/10 text-emerald-400 ring-emerald-400/25',
    glow: 'shadow-[0_0_18px_-6px_rgba(52,211,153,0.8)]',
    linie: 'from-emerald-400/60',
  },
  down: {
    text: 'text-rose-400',
    chip: 'bg-rose-500/10 text-rose-400 ring-rose-400/25',
    glow: 'shadow-[0_0_18px_-6px_rgba(251,113,133,0.8)]',
    linie: 'from-rose-400/60',
  },
  neutral: {
    text: 'text-slate-100',
    chip: 'bg-violet-500/10 text-violet-400 ring-violet-400/25',
    glow: 'shadow-[0_0_18px_-6px_rgba(167,139,250,0.7)]',
    linie: 'from-violet-400/50',
  },
};

function Kachel({
  icon,
  label,
  wert,
  zusatz,
  ton = 'neutral',
  verzoegerung = 0,
}: {
  icon: React.ReactNode;
  label: string;
  wert: React.ReactNode;
  zusatz?: string;
  ton?: Ton;
  verzoegerung?: number;
}) {
  const [ref, sichtbar] = useInView<HTMLDivElement>();
  const k = TON_KLASSEN[ton];

  return (
    <div
      ref={ref}
      style={{
        transition: `opacity 700ms ${EASE_OUT} ${verzoegerung}ms, transform 700ms ${EASE_OUT} ${verzoegerung}ms`,
        opacity: sichtbar ? 1 : 0,
        transform: sichtbar ? 'none' : 'translateY(10px)',
      }}
      // Der Rahmen ist ein Verlauf: außen ein Pixel Farbe, innen die Fläche.
      className="rounded-2xl bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-px"
    >
      <div className="relative h-full overflow-hidden rounded-[15px] bg-gradient-to-b from-[#16161f] to-[#0f0f17] p-3">
        {/* Farbiger Akzent an der Oberkante, passend zum Ton der Kachel */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r ${k.linie} to-transparent`}
        />
        <div className="mb-2.5 flex items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${k.chip} ${k.glow}`}
          >
            {icon}
          </span>
          <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </span>
        </div>
        <p className={`truncate text-[15px] font-black tabular-nums leading-none ${k.text}`}>
          {wert}
        </p>
        {zusatz && <p className="mt-1.5 truncate text-[10px] text-slate-600">{zusatz}</p>}
      </div>
    </div>
  );
}

export function ArticleStats({ cards, label = 'Karten im Blick' }: Props) {
  const mitPreis = cards.filter((c) => c.price > 0);
  // Unter zwei Karten gibt es nichts zu vergleichen — dann lieber nichts zeigen
  // als eine Kennzahl aus einem einzigen Wert.
  if (mitPreis.length < 2) return null;

  const nachTrend = [...mitPreis].sort((a, b) => b.trend - a.trend);
  const bester = nachTrend[0];
  const schwaechster = nachTrend[nachTrend.length - 1];
  const preise = mitPreis.map((c) => c.price);
  const min = Math.min(...preise);
  const max = Math.max(...preise);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <Kachel
        icon={<Layers size={13} />}
        label={label}
        wert={<CountUp value={mitPreis.length} format={(v) => String(Math.round(v))} />}
        zusatz="mit echtem Marktpreis"
        verzoegerung={0}
      />
      <Kachel
        icon={<TrendingUp size={13} />}
        label="Stärkster Zuwachs"
        wert={
          bester.trend > 0 ? (
            <CountUp value={bester.trend} format={(v) => formatPercent(v)} />
          ) : (
            '—'
          )
        }
        zusatz={bester.trend > 0 ? bester.name : 'keine Karte im Plus'}
        ton={bester.trend > 0 ? 'up' : 'neutral'}
        verzoegerung={70}
      />
      <Kachel
        icon={<TrendingDown size={13} />}
        label="Größter Rückgang"
        wert={
          schwaechster.trend < 0 ? (
            <CountUp value={schwaechster.trend} format={(v) => formatPercent(v)} />
          ) : (
            '—'
          )
        }
        zusatz={schwaechster.trend < 0 ? schwaechster.name : 'keine Karte im Minus'}
        ton={schwaechster.trend < 0 ? 'down' : 'neutral'}
        verzoegerung={140}
      />
      <Kachel
        icon={<ArrowLeftRight size={13} />}
        label="Preisspanne"
        wert={`${formatEur(min)} – ${formatEur(max)}`}
        zusatz="niedrigster bis höchster Wert"
        verzoegerung={210}
      />
    </div>
  );
}
