'use client';

import dynamic from 'next/dynamic';

// NACHLADENDER PREISVERLAUF
//
// ANLASS: Die Karten-Detailseite lud rund 659 kB JavaScript — der größte Teil
// davon die Diagramm-Bibliothek. Die steckte fest im ersten Bündel, obwohl der
// Verlauf erst nach dem Kartenbild und den Kennzahlen sichtbar wird.
//
// WICHTIG FÜR DIE STABILITÄT DES LAYOUTS: Der Platzhalter hat exakt dieselbe
// Höhe wie das fertige Diagramm (200 px). Ohne das würde beim Nachladen alles
// darunter springen — und der gemessene Wert für Layoutverschiebung (aktuell
// 0) wäre dahin.
const PriceChartInner = dynamic(
  () => import('./PriceChart').then((m) => ({ default: m.PriceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] w-full items-center justify-center rounded-xl bg-[#0f0f17]">
        <div className="h-1 w-24 animate-pulse rounded-full bg-[#2a2a3a]" />
      </div>
    ),
  },
);

export function PriceChartLazy({ data }: { data: Array<{ date: string; price: number }> }) {
  return <PriceChartInner data={data} />;
}
