'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/lib/use-in-view';

/**
 * Zählt eine Kennzahl beim Hereinscrollen von null auf ihren Wert hoch.
 *
 * WOZU: Eine Zahl, die fertig dasteht, wird überblättert. Eine, die sich
 * aufbaut, wird gelesen — das ist der Grund, warum jede ernsthafte Finanz-
 * oberfläche das tut.
 *
 * WICHTIG: Der ENDWERT ist immer der echte Wert. Es wird nichts gerundet,
 * nichts geschätzt und nichts beschönigt; die Zwischenschritte sind reine
 * Darstellung. Bei „Reduced Motion" oder ohne JavaScript steht der Endwert
 * sofort.
 */
export function CountUp({
  value,
  format,
  duration = 900,
  className = '',
}: {
  value: number;
  format: (v: number) => string;
  duration?: number;
  className?: string;
}) {
  const [ref, sichtbar] = useInView<HTMLSpanElement>();
  const [wert, setWert] = useState(value);

  useEffect(() => {
    if (!sichtbar) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof requestAnimationFrame === 'undefined') {
      setWert(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const lauf = (jetzt: number) => {
      const t = Math.min(1, (jetzt - start) / duration);
      // Sanftes Ausklingen — schnell los, ruhig ankommen.
      const eased = 1 - Math.pow(1 - t, 3);
      setWert(value * eased);
      if (t < 1) frame = requestAnimationFrame(lauf);
      else setWert(value); // Endwert exakt, nie ein gerundeter Zwischenschritt.
    };
    setWert(0);
    frame = requestAnimationFrame(lauf);
    return () => cancelAnimationFrame(frame);
  }, [sichtbar, value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(wert)}
    </span>
  );
}
