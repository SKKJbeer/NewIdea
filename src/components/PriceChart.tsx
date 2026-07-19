'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface PricePoint {
  date: string;
  price: number;
}

interface TooltipPayload {
  value: number;
  payload: { ts: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#13131e] border border-[#2a2a3a] rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="text-slate-500 text-xs">{fmtDate(payload[0].payload.ts)}</p>
      <p className="font-bold text-slate-200">{payload[0].value.toFixed(2)} €</p>
    </div>
  );
}

export function PriceChart({ data }: { data: PricePoint[] }) {
  // Echte Zeitachse: Datum → Timestamp. So sind die Abstände PROPORTIONAL zur
  // echten Zeit — ein 23-Tage-Sprung ist breiter als ein 1-Tages-Schritt. Das
  // verhindert die "linearen", gleich breiten Segmente der alten Kategorie-Achse.
  const chartData = data
    .map((d) => ({ ...d, ts: new Date(d.date + 'T00:00:00Z').getTime() }))
    .filter((d) => Number.isFinite(d.ts))
    .sort((a, b) => a.ts - b.ts);

  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.12 || Math.max(1, maxPrice * 0.05);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(ts: number) => new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
          minTickGap={28}
        />
        <YAxis
          domain={[minPrice - padding, maxPrice + padding]}
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}€`}
          width={38}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#priceGradient)"
          dot={chartData.length <= 8 ? { r: 3, fill: '#7c3aed' } : false}
          activeDot={{ r: 4, fill: '#a78bfa' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
