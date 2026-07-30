'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Meldet, sobald ein Element ins Sichtfeld gescrollt wurde.
 *
 * EINE Stelle für alle Einblend- und Aufbau-Effekte (Code-Regel 10). Vorher
 * trug `Reveal` diese Logik allein; die Datengrafiken brauchen sie ebenso, um
 * ihre Balken beim Hereinscrollen wachsen zu lassen.
 *
 * Robust nach demselben Grundsatz wie `Reveal`: Ohne IntersectionObserver oder
 * bei „Reduced Motion" ist sofort alles sichtbar. Ein Diagramm darf niemals
 * unsichtbar bleiben, nur weil eine Animation nicht laufen kann.
 */
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined' || !el) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
          break;
        }
      }
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
    // Die Optionen sind bewusst nur beim Aufbau relevant — ein neuer Beobachter
    // je Render würde die Animation erneut auslösen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

/** Sanftes Ausklingen — Standard für alle Aufbau-Animationen der Seite. */
export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
