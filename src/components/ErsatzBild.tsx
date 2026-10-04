'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';

// KARTENBILD MIT ERSATZKETTE (seit v6.20.0).
//
// 1. über den eigenen Bild-Proxy (Loader → /api/img, verkleinert, CDN-Jahresreserve,
//    TCGdex als zweite Quelle)
// 2. scheitert das, direkt von der Quelle (unoptimized → rohe Adresse)
// 3. erst dann ein Platzhalter — nie ein kaputtes Bild-Symbol
//
// Anlass 04.10.2026: Vercel verweigerte die Bildoptimierung (402, Kontingent
// verbraucht), Kartenbilder blieben leer, und nichts auf der Seite fing es ab.

type Props = Omit<ImageProps, 'src' | 'onError'> & { src: string; platzhalterGroesse?: number };

export function ErsatzBild({ src, platzhalterGroesse = 18, alt, ...rest }: Props) {
  const [stufe, setStufe] = useState(0);
  if (!src || stufe >= 2) {
    return (
      <span className="flex h-full w-full items-center justify-center text-slate-600" role="img" aria-label={alt || 'Bild nicht verfügbar'}>
        <ImageOff size={platzhalterGroesse} />
      </span>
    );
  }
  return (
    <Image
      key={stufe}
      src={src}
      alt={alt}
      {...rest}
      unoptimized={stufe === 1}
      onError={() => setStufe((s) => s + 1)}
    />
  );
}
