import { TrendingUp, TrendingDown, Layers, ArrowLeftRight } from 'lucide-react';
import { formatEur, formatPercent } from '@/lib/format';
import type { BarItem } from './DataBars';

// KENNZAHLEN-STREIFEN ZUM ARTIKEL
//
// Zweck: Ein Beitrag, der nur aus Fließtext besteht, verlangt vom Leser, sich
// die Lage selbst zusammenzusuchen. Diese vier Kacheln beantworten in einem
// Blick, worum es geht — und sie stehen bewusst VOR dem Text.
//
// Alle Werte stammen aus den Karten des Beitrags (echte Preise, echte
// Trendwerte). Es wird nichts geschätzt und nichts hochgerechnet: Reicht die
// Datenlage nicht, erscheint der Block gar nicht (CLAUDE.md, Stolperstelle 29 —
// aus fehlenden Daten niemals Kennzahlen ableiten).

interface Props {
  /** Minimale Form — Artikel und Marktbericht liefern beide diese Felder. */
  cards: BarItem[];
  /** Beschriftung der ersten Kachel je nach Kontext. */
  label?: string;
}

function Kachel({
  icon,
  label,
  wert,
  zusatz,
  ton = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  wert: string;
  zusatz?: string;
  ton?: 'neutral' | 'up' | 'down';
}) {
  const farbe =
    ton === 'up' ? 'text-emerald-400' : ton === 'down' ? 'text-rose-400' : 'text-slate-200';
  const chip =
    ton === 'up'
      ? 'bg-emerald-500/10 text-emerald-400'
      : ton === 'down'
        ? 'bg-rose-500/10 text-rose-400'
        : 'bg-violet-500/10 text-violet-400';

  return (
    <div className="rounded-xl border border-[#2a2a3a] bg-[#13131e] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${chip}`}>
          {icon}
        </span>
        <span className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-600">
          {label}
        </span>
      </div>
      <p className={`truncate text-sm font-black tabular-nums ${farbe}`}>{wert}</p>
      {zusatz && <p className="mt-0.5 truncate text-[10px] text-slate-600">{zusatz}</p>}
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
        wert={String(mitPreis.length)}
        zusatz={mitPreis.length === 1 ? 'Karte' : 'Karten mit Marktpreis'}
      />
      <Kachel
        icon={<TrendingUp size={13} />}
        label="Stärkster Zuwachs"
        wert={bester.trend > 0 ? formatPercent(bester.trend) : '—'}
        zusatz={bester.trend > 0 ? bester.name : 'keine Karte im Plus'}
        ton={bester.trend > 0 ? 'up' : 'neutral'}
      />
      <Kachel
        icon={<TrendingDown size={13} />}
        label="Größter Rückgang"
        wert={schwaechster.trend < 0 ? formatPercent(schwaechster.trend) : '—'}
        zusatz={schwaechster.trend < 0 ? schwaechster.name : 'keine Karte im Minus'}
        ton={schwaechster.trend < 0 ? 'down' : 'neutral'}
      />
      <Kachel
        icon={<ArrowLeftRight size={13} />}
        label="Preisspanne"
        wert={`${formatEur(min)} – ${formatEur(max)}`}
        zusatz="niedrigster bis höchster Wert"
      />
    </div>
  );
}
