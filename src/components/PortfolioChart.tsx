'use client';

import { useRef, useState, useCallback } from 'react';
import { formatEur, shortEur } from '@/lib/portfolio';

export interface ChartPoint { date: string; value: number; }

interface Props {
  data: ChartPoint[];
  color: string; // hex colour — green or red based on P&L
}

// Lightweight custom SVG chart — no Recharts, instant render, touch-enabled.
export function PortfolioChart({ data, color }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Need at least 2 points to draw anything meaningful
  if (data.length < 2) return null;

  // ── Coordinate space ──────────────────────────────────────────────────────
  const VW = 600;
  const VH = 180;
  const PADL = 8, PADR = 8, PADT = 18, PADB = 28;
  const chartW = VW - PADL - PADR;
  const chartH = VH - PADT - PADB;

  const vals  = data.map((d) => d.value);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  // Give flat lines a 10% padding so the curve doesn't hug the edge
  const vRange = maxV > minV ? maxV - minV : Math.abs(maxV) * 0.1 || 1;
  const vPad   = vRange * 0.12;

  const toX = (i: number) => PADL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) =>
    PADT + (1 - (v - minV + vPad) / (vRange + 2 * vPad)) * chartH;

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  // ── SVG path helpers ──────────────────────────────────────────────────────

  function buildLinePath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const tension = (curr.x - prev.x) * 0.35;
      d += ` C ${f(prev.x + tension)} ${f(prev.y)}, ${f(curr.x - tension)} ${f(curr.y)}, ${f(curr.x)} ${f(curr.y)}`;
    }
    return d;
  }

  function f(n: number) { return n.toFixed(2); }

  const linePath = buildLinePath(pts);
  const last     = pts[pts.length - 1];
  const areaPath = `${linePath} L ${f(last.x)} ${VH - PADB} L ${f(PADL)} ${VH - PADB} Z`;

  // ── Interaction ───────────────────────────────────────────────────────────

  const handlePointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect  = svg.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const raw   = ratio * (data.length - 1);
      setHoverIdx(Math.max(0, Math.min(data.length - 1, Math.round(raw))));
    },
    [data.length],
  );

  const hoverPt   = hoverIdx !== null ? pts[hoverIdx]  : null;
  const hoverData = hoverIdx !== null ? data[hoverIdx] : null;

  // ── Axis labels ───────────────────────────────────────────────────────────

  function axisDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit',
    });
  }

  return (
    <div className="relative select-none" style={{ touchAction: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full overflow-visible"
        style={{ height: 150 }}
        onPointerMove={handlePointer}
        onPointerLeave={() => setHoverIdx(null)}
        onPointerCancel={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="pf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
          <clipPath id="pf-clip">
            <rect x={PADL} y={PADT} width={chartW} height={chartH + 4} />
          </clipPath>
        </defs>

        {/* Gradient area fill */}
        <path d={areaPath} fill="url(#pf-grad)" clipPath="url(#pf-clip)" />

        {/* Main line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dot at the most recent (rightmost) point */}
        <circle cx={last.x} cy={last.y} r="4" fill={color} />
        <circle cx={last.x} cy={last.y} r="8" fill={color} fillOpacity="0.18" />

        {/* Y-axis labels: max top-left, min bottom-left */}
        <text x={PADL + 4} y={PADT + 12} fontSize="16" fill="#e5e7eb">
          {shortEur(maxV)}
        </text>
        <text x={PADL + 4} y={VH - PADB - 5} fontSize="16" fill="#e5e7eb">
          {shortEur(minV)}
        </text>

        {/* X-axis date labels */}
        <text x={PADL + 2} y={VH - 5} fontSize="16" fill="#d1d5db">
          {axisDate(data[0].date)}
        </text>
        <text x={VW - PADR - 2} y={VH - 5} fontSize="16" fill="#d1d5db" textAnchor="end">
          {axisDate(data[data.length - 1].date)}
        </text>

        {/* Hover crosshair */}
        {hoverPt && (
          <>
            <line
              x1={f(hoverPt.x)} y1={PADT}
              x2={f(hoverPt.x)} y2={VH - PADB}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="5 4"
              strokeOpacity="0.45"
            />
            <circle cx={f(hoverPt.x)} cy={f(hoverPt.y)} r="6" fill="white" stroke={color} strokeWidth="2.5" />
          </>
        )}
      </svg>

      {/* Hover tooltip overlay — positioned as a floating label */}
      {hoverIdx !== null && hoverData && hoverPt && (
        <div
          className="absolute top-1 pointer-events-none z-10"
          style={{
            left: `${(hoverPt.x / VW) * 100}%`,
            // Flip to left side when past 55% to avoid overflow
            transform:
              hoverIdx >= Math.floor(data.length * 0.55)
                ? 'translateX(calc(-100% - 6px))'
                : 'translateX(6px)',
          }}
        >
          <div className="bg-gray-900 text-white rounded-xl px-3 py-2 shadow-xl whitespace-nowrap">
            <p className="text-[10px] text-gray-400 leading-none mb-1">
              {new Date(hoverData.date + 'T00:00:00').toLocaleDateString('de-DE', {
                weekday: 'short', day: '2-digit', month: 'short',
              })}
            </p>
            <p className="text-sm font-black tabular-nums leading-none">
              {formatEur(hoverData.value)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
