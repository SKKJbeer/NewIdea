'use client';

import Image from 'next/image';

interface CardImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * Kartenbild mit Platzhalter.
 *
 * DER FEHLER, DEN DAS BEHEBT: Die frühere Fassung setzte das Bild auf
 * `opacity-0` und blendete es erst ein, wenn `onLoad` gefeuert hatte. Genau das
 * geht regelmäßig schief — ist das Bild schon fertig geladen, bevor React den
 * Ereignis-Behandler anhängt (aus dem Zwischenspeicher, bei schnellem Netz, bei
 * langsamer Hydration), feuert `onLoad` NIE. Das Bild bleibt dann dauerhaft
 * unsichtbar, und die Karte sieht aus wie ein leeres Feld. Reproduzierbar war
 * das nicht zuverlässig — es hing am Zeitverhalten, und genau solche Fehler
 * fallen im Test nie auf und im Alltag ständig.
 *
 * Jetzt ist das Bild von Anfang an sichtbar. Der Platzhalter liegt DAHINTER und
 * wird vom Bild verdeckt, sobald es da ist. Ohne JavaScript, ohne Zustand, ohne
 * Ereignis, auf das man warten muss.
 */
export function CardImage({ src, alt, sizes, className = '', priority = false }: CardImageProps) {
  return (
    <>
      <div className="shimmer absolute inset-0 rounded-[inherit]" aria-hidden />
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
    </>
  );
}
