'use client';

import { useRef, useState, useCallback } from 'react';

export interface ChartPoint { date: string; value: number; }

interface Props {
  data: ChartPoint[];
  color: string;
  /** Startwert des gewählten Zeitraums — als gestrichelte Referenzlinie (Trade-Republic-Pattern). */
  baselineValue?: number;
  /** Scrub-Callback: Beim Ziehen über den Chart wird der Punkt gemeldet (null = losgelassen). */
  onScrub?: (point: ChartPoint | null) => void;
}

// Leichtgewichtiger Custom-SVG-Chart im Finance-App-Stil:
// - Baseline (gestrichelt) auf Zeitraum-Startwert, Kurvenfarbe relativ dazu
// - Scrubbing: Kurve rechts vom Finger dimmt ab, Datum erscheint am Crosshair,
//   der Wert wandert über onScrub in den Seiten-Header (wie bei Trade Republic)
// - Pulsierender Live-Punkt am aktuellen Wert
export function PortfolioChart({ data, color, baselineValue, onScrub }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const clearScrub = useCallback(() => {
    setHoverIdx(null);
    onScrub?.(null);
  }, [onScrub]);

  const handlePointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect  = svg.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const raw   = ratio * (data.length - 1);
      const idx   = Math.max(0, Math.min(data.length - 1, Math.round(raw)));
      setHoverIdx(idx);
      onScrub?.(data[idx]);
    },
    [data, onScrub],
  );

  if (data.length < 2) return null;

  // ── Coordinate space ──────────────────────────────────────────────────────
  const VW = 600;
  const VH = 170;
  const PADL = 8, PADR = 8, PADT = 14, PADB = 22;
  const chartW = VW - PADL - PADR;
  const chartH = VH - PADT - PADB;

  const vals = data.map((d) => d.value);
  // Baseline in die Skala einbeziehen, damit die Referenzlinie immer sichtbar ist
  if (baselineValue !== undefined && baselineValue > 0) vals.push(baselineValue);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  const vRange = maxV > minV ? maxV - minV : Math.abs(maxV) * 0.1 || 1;
  const vPad   = vRange * 0.12;

  const toX = (i: number) => PADL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) =>
    PADT + (1 - (v - minV + vPad) / (vRange + 2 * vPad)) * chartH;

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  // ── SVG path helpers ──────────────────────────────────────────────────────

  function f(n: number) { return n.toFixed(2); }

  function buildLinePath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    let d = `M ${f(points[0].x)} ${f(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const tension = (curr.x - prev.x) * 0.35;
      d += ` C ${f(prev.x + tension)} ${f(prev.y)}, ${f(curr.x - tension)} ${f(curr.y)}, ${f(curr.x)} ${f(curr.y)}`;
    }
    return d;
  }

  const linePath = buildLinePath(pts);
  const last     = pts[pts.length - 1];
  const areaPath = `${linePath} L ${f(last.x)} ${VH - PADB} L ${f(PADL)} ${VH - PADB} Z`;

  const hoverPt   = hoverIdx !== null ? pts[hoverIdx]  : null;
  const hoverData = hoverIdx !== null ? data[hoverIdx] : null;
  const scrubbing = hoverPt !== null;

  const baselineY =
    baselineValue !== undefined && baselineValue > 0 ? toY(baselineValue) : null;

  function axisDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit',
    });
  }

  function scrubDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
      weekday: 'short', day: '2-digit', month: 'short',
    });
  }

  // Datum-Label am Crosshair horizontal einklemmen, damit es nie überläuft
  const labelX = hoverPt ? Math.max(45, Math.min(VW - 45, hoverPt.x)) : 0;

  return (
    <div className="relative select-none" style={{ touchAction: 'pan-y' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full overflow-visible"
        style={{ height: 160 }}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={clearScrub}
        onPointerCancel={clearScrub}
        onPointerUp={clearScrub}
      >
        <defs>
          <linearGradient id="pf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
          <clipPath id="pf-clip">
            <rect x={PADL} y={PADT - 6} width={chartW} height={chartH + 10} />
          </clipPath>
          {/* Beim Scrubben: nur der Bereich links vom Finger bleibt farbig */}
          <clipPath id="pf-clip-active">
            <rect
              x={PADL}
              y={PADT - 6}
              width={scrubbing ? Math.max(0, (hoverPt as { x: number }).x - PADL) : chartW}
              height={chartH + 10}
            />
          </clipPath>
        </defs>

        {/* Baseline: Zeitraum-Startwert als gestrichelte Referenzlinie */}
        {baselineY !== null && (
          <line
            x1={PADL} y1={f(baselineY)}
            x2={VW - PADR} y2={f(baselineY)}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="1 5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        )}

        {/* Gradient-Fläche — beim Scrubben nur bis zum Finger */}
        <path d={areaPath} fill="url(#pf-grad)" clipPath="url(#pf-clip-active)" />

        {/* Basis-Linie: beim Scrubben komplett sichtbar, aber abgedimmt */}
        {scrubbing && (
          <path
            d={linePath}
            fill="none"
            stroke="#475569"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.45"
            clipPath="url(#pf-clip)"
          />
        )}

        {/* Farbige Linie — beim Scrubben bis zum Finger geclippt */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#pf-clip-active)"
        />

        {/* Live-Punkt am aktuellen Wert — mit dezentem Puls */}
        {!scrubbing && (
          <>
            <circle cx={last.x} cy={last.y} r="7" fill={color} fillOpacity="0.15">
              <animate attributeName="r" values="5;9;5" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.25;0.06;0.25" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={last.x} cy={last.y} r="3.5" fill={color} />
          </>
        )}

        {/* X-Achse: nur Start- und Enddatum, dezent */}
        <text x={PADL + 2} y={VH - 4} fontSize="13" fill="#475569">
          {axisDate(data[0].date)}
        </text>
        <text x={VW - PADR - 2} y={VH - 4} fontSize="13" fill="#475569" textAnchor="end">
          {axisDate(data[data.length - 1].date)}
        </text>

        {/* Scrub-Crosshair: Linie + Punkt + Datum darüber */}
        {hoverPt && hoverData && (
          <>
            <line
              x1={f(hoverPt.x)} y1={PADT - 2}
              x2={f(hoverPt.x)} y2={VH - PADB}
              stroke="#64748b"
              strokeWidth="1"
            />
            <circle cx={f(hoverPt.x)} cy={f(hoverPt.y)} r="5.5" fill="#0a0a0f" stroke={color} strokeWidth="2.5" />
            <text
              x={f(labelX)}
              y={PADT - 4}
              fontSize="13"
              fontWeight="600"
              fill="#94a3b8"
              textAnchor="middle"
            >
              {scrubDate(hoverData.date)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
