'use client';

import { useState } from 'react';
import { cachedImg } from '@/lib/cached-image';

// Maps pokemontcg.io setId (lowercase) → Pokémon Company CDN capitalization
const SET_ID_MAP: Record<string, string> = {
  sv1: 'SV1', sv2: 'SV2', sv3: 'SV3', sv3pt5: 'SV3pt5',
  sv4: 'SV4', sv4pt5: 'SV4pt5', sv5: 'SV5', sv6: 'SV6', sv6pt5: 'SV6pt5',
  sv7: 'SV7', sv7pt5: 'SV7pt5', sv8: 'SV8', sv8pt5: 'SV8pt5',
  swsh1: 'SWSH1', swsh2: 'SWSH2', swsh3: 'SWSH3', swsh4: 'SWSH4',
  swsh5: 'SWSH5', swsh6: 'SWSH6', swsh7: 'SWSH7', swsh8: 'SWSH8',
  swsh9: 'SWSH9', swsh10: 'SWSH10', swsh11: 'SWSH11', swsh12: 'SWSH12',
  swsh12pt5: 'SWSH12pt5',
};

function getPackUrl(setCode: string): string {
  const mapped = SET_ID_MAP[setCode] || setCode.toUpperCase();
  return `https://assets.pokemon.com/assets/cms2/img/cards/web/${mapped}/${mapped}_EN_Booster.png`;
}

interface Props {
  setCode: string;
  setName: string;
  className?: string;
}

export function BoosterPackImage({ setCode, setName, className = '' }: Props) {
  const [src, setSrc] = useState(() => cachedImg(getPackUrl(setCode)));
  const logo = cachedImg(`https://images.pokemontcg.io/${setCode}/logo.png`);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${setName} Boosterpack`}
      className={className}
      onError={() => {
        if (src !== logo) setSrc(logo);
      }}
      loading="lazy"
    />
  );
}
