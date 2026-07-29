'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cachedImg } from '@/lib/cached-image';

// Zeigt das Set-Kennbild zu einer Karte — damit sofort erkennbar ist, aus
// welchem Set sie stammt.
//
// HISTORIE (wichtig, damit es nicht zurückgebaut wird): Ursprünglich war die
// erste Quelle das Boosterpack-Produktbild unter
// assets.pokemon.com/assets/cms2/img/cards/web/<SET>/<SET>_EN_Booster.png.
// Dieses Pfadschema liefert für JEDES geprüfte Set (SV1, SV3pt5, SV6, SV7, SV8,
// SWSH7, SWSH12) HTTP 404 — die Quelle ist vollständig tot. Ergebnis: Bei jedem
// Kartenbild lief eine garantiert scheiternde Anfrage, bevor auf das Set-Logo
// zurückgefallen wurde. Deshalb ist das Logo jetzt die primäre Quelle.
// Vor einer Rückkehr zum Boosterpack-Bild erst die URLs erneut prüfen.

interface Props {
  setCode: string;
  setName: string;
  className?: string;
  /** Echte Logo-URL aus der TCG-API (set.images.logo) — verlässlichste Quelle. */
  logoUrl?: string;
}

/**
 * Robuste Quellenkette: echtes API-Logo → aus dem Set-Code abgeleitetes Logo →
 * sauberer Platzhalter. Es erscheint NIE ein kaputtes Bild-Icon.
 */
export function BoosterPackImage({ setCode, setName, className = '', logoUrl }: Props) {
  const sources = [
    logoUrl ? cachedImg(logoUrl) : '',
    setCode ? cachedImg(`https://images.pokemontcg.io/${setCode}/logo.png`) : '',
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);

  if (idx >= sources.length) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-[#1a1a28] text-slate-600 ${className}`}
        role="img"
        aria-label={`${setName} — kein Set-Bild verfügbar`}
      >
        <ImageOff size={18} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={sources[idx]}
      src={sources[idx]}
      // Ehrliche Beschriftung: Es ist das Set-Logo, kein Boosterpack-Foto.
      alt={`Set-Logo ${setName}`}
      className={className}
      onError={() => setIdx((i) => i + 1)}
      loading="lazy"
    />
  );
}
