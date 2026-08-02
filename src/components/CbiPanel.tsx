import type { PmiResult } from '@/lib/market-metrics';
import type { MarketIndexPoint } from '@/lib/market-index-store';
import { formatPercent } from '@/lib/format';
import { toneClass } from '@/lib/ui';

// DAS CBI-PANEL — nach der gelieferten Vorlage.
//
// Es liegt als einziges Element des Kopfs auf einer eigenen Flaeche und soll
// ueber dem Hintergrund SCHWEBEN. Das entsteht nicht durch einen Schatten
// (Schatten stapeln Flaechen sichtbar), sondern durch drei Dinge zugleich:
//
//   · eine halbdurchlaessige Flaeche, durch die der Hintergrund schimmert
//   · eine helle Lichtkante oben und eine dunkle unten
//   · ein weicher Hof, der ueber den Rand hinausreicht
//
// DIE KURVE IST ECHT ODER SIE FEHLT. Die Vorlage zeigt eine 30-Tage-Linie. Die
// gibt es nur, wenn Tagesstaende gespeichert sind — der Indexstand wird bei
// jedem Aufruf der Startseite festgehalten, aber eine Reihe entsteht erst mit
// der Zeit. Bei weniger als zwei Punkten steht deshalb der Grund dafuer da und
// keine Linie. Eine zurueckgerechnete Kurve waere eine erfundene Messung
// (Preis-Wahrheitspflicht).

function pfad(punkte: MarketIndexPoint[], breite: number, hoehe: number): { linie: string; flaeche: string } {
  const werte = punkte.map((p) => p.value);
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  // Symmetrische Spanne um die Null, mindestens ±1 — sonst sieht eine
  // Bewegung von 0,1 Prozentpunkten aus wie ein Ausbruch.
  const spanne = Math.max(Math.abs(min), Math.abs(max), 1) * 1.15;
  const x = (i: number) => (i / Math.max(punkte.length - 1, 1)) * breite;
  const y = (v: number) => hoehe / 2 - (v / spanne) * (hoehe / 2);

  const linie = punkte.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' '); // toFixed erlaubt: SVG-Koordinaten
  const flaeche = `${linie} L ${breite} ${hoehe} L 0 ${hoehe} Z`;
  return { linie, flaeche };
}

interface Props {
  cbi: PmiResult;
  verlauf: MarketIndexPoint[];
  /** Zustandsmarke rechts oben — „Neutral", „Abkühlend" … aus der Temperatur. */
  zustand: string;
}

export function CbiPanel({ cbi, verlauf, zustand }: Props) {
  const B = 560;
  const H = 118;
  const genug = verlauf.length >= 2;
  const { linie, flaeche } = genug ? pfad(verlauf, B, H) : { linie: '', flaeche: '' };
  const spitze = genug
    ? Math.max(...verlauf.map((p) => Math.abs(p.value)), 1) * 1.15
    : 1;

  return (
    <div className="relative">
      {/* Der Hof reicht ueber den Rand hinaus — das laesst die Flaeche
          abheben, ohne dass ein Schatten sie auf den Grund drueckt. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[32px] blur-2xl"
        style={{ background: 'radial-gradient(closest-side, rgba(124,92,255,0.16), transparent)' }}
      />

      <div className="card-frame relative overflow-hidden rounded-[22px] border border-white/[0.09] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
        {/* Lichtkante oben — der schmale helle Streifen, den die Vorlage an
            jeder Flaeche hat. */}
        <div
          aria-hidden
          className="absolute inset-x-6 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(190,180,255,0.5), transparent)' }}
        />

        <div className="flex items-start justify-between gap-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">
            CardBeacon Index (CBI)
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {zustand}
          </span>
        </div>

        {cbi.sufficient ? (
          <p className={`mt-2 text-[54px] font-semibold leading-none tracking-tight sm:text-[64px] ${toneClass(cbi.value)}`}>
            {formatPercent(cbi.value)}
          </p>
        ) : (
          <p className="mt-2 text-[54px] font-semibold leading-none tracking-tight text-slate-700 sm:text-[64px]">—</p>
        )}

        <p className="mt-3 text-[12px] text-slate-400">
          {cbi.windowDays}-Tage-Entwicklung des CardBeacon Index
        </p>

        {/* ── Verlauf ── */}
        <div className="mt-4 flex gap-3">
          <div className="relative min-w-0 flex-1">
            {genug ? (
              <svg viewBox={`0 0 ${B} ${H}`} className="h-[118px] w-full" preserveAspectRatio="none" role="img"
                aria-label={`Indexverlauf über ${verlauf.length} gemessene Tage`}>
                <defs>
                  <linearGradient id="cbi-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(167 139 250)" />
                    <stop offset="55%" stopColor="rgb(217 130 250)" />
                    <stop offset="100%" stopColor="rgb(196 181 253)" />
                  </linearGradient>
                  <linearGradient id="cbi-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(167 139 250)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="rgb(167 139 250)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Nulllinie — ohne sie ist nicht erkennbar, was oben und
                    was unten bedeutet. */}
                <line x1="0" y1={H / 2} x2={B} y2={H / 2} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                <path d={flaeche} fill="url(#cbi-fill)" />
                <path d={linie} fill="none" stroke="url(#cbi-line)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
            ) : (
              <div className="flex h-[118px] flex-col justify-center border-l border-white/[0.06] pl-4">
                <p className="text-[12px] text-slate-400">Verlauf wird aufgebaut</p>
                <p className="mt-1 max-w-[280px] text-[11px] leading-relaxed text-slate-600">
                  {verlauf.length === 1
                    ? 'Ein gemessener Tagesstand liegt vor. Eine Linie entsteht ab dem zweiten.'
                    : 'Noch keine gespeicherten Tagesstände. Eine zurückgerechnete Kurve wäre keine Messung.'}
                </p>
              </div>
            )}
          </div>

          {/* Achsenbeschriftung rechts, wie in der Vorlage */}
          {genug && (
            <div className="flex w-[46px] shrink-0 flex-col justify-between py-[2px] text-right text-[10px] tabular-nums text-slate-500">
              <span>{formatPercent(spitze, { digits: 0 })}</span>
              <span>0 %</span>
              <span>{formatPercent(-spitze, { digits: 0 })}</span>
            </div>
          )}
        </div>

        {genug && (
          <div className="mt-1.5 flex justify-between pr-[58px] text-[10px] tabular-nums text-slate-600">
            <span>{verlauf.length} T</span>
            <span>Heute</span>
          </div>
        )}
      </div>
    </div>
  );
}
