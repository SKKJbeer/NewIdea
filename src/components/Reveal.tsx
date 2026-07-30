'use client';

import { type ReactNode } from 'react';
import { useInView, EASE_OUT } from '@/lib/use-in-view';

/**
 * Blendet den Inhalt beim Hereinscrollen sanft ein (Fade + leichtes Aufsteigen).
 * Ein einziger, wiederverwendbarer Baustein — dadurch bekommt JEDER Content
 * (Artikel, Guides, Berichte) automatisch dieselbe lebendige Anmutung.
 *
 * Die Sichtbarkeits-Erkennung liegt in `useInView` und wird von den
 * Datengrafiken mitgenutzt (Code-Regel 10: keine zweite Umsetzung).
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
  const [ref, sichtbar] = useInView<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  return (
    <div
      ref={ref}
      style={{
        transition: `opacity 700ms ${EASE_OUT} ${delay}ms, transform 700ms ${EASE_OUT} ${delay}ms`,
        opacity: sichtbar ? 1 : 0,
        transform: sichtbar ? 'none' : 'translateY(16px)',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
