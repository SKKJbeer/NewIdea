'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Blendet den Inhalt beim Hereinscrollen sanft ein (Fade + leichtes Aufsteigen).
 * Ein einziger, wiederverwendbarer Baustein — dadurch bekommt JEDER Content
 * (Artikel, Guides, Berichte) automatisch dieselbe lebendige Anmutung.
 *
 * Robust: Ohne IntersectionObserver oder bei „Reduced Motion" wird sofort
 * sichtbar gerendert — der Text ist nie versteckt.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined' || !el) {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-all duration-700 ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}
