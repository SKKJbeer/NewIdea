'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cachedImg } from '@/lib/cached-image';

interface CardImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * Kartenbild mit professionellem Ladeverhalten:
 * Shimmer-Platzhalter (grau, animiert leuchtend) bis das Bild da ist,
 * dann weiches Einblenden. Für fill-Layouts in relativen Containern.
 */
export function CardImage({ src, alt, sizes, className = '', priority = false }: CardImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="shimmer absolute inset-0 rounded-[inherit]" aria-hidden />}
      <Image
        src={cachedImg(src)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
