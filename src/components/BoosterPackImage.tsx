'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

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
//
// ZWEI MESSBARE ÄNDERUNGEN (31.07.2026):
//
// 1. ÜBER DEN BILDOPTIMIERER STATT ÜBER DEN ZWISCHENSPEICHER-PROXY.
//    `/sets` lud 1.921 KB an Set-Logos — Bilder von 400 bis 500 Pixel Breite,
//    angezeigt auf 130. Der Proxy speichert nur zwischen; er verkleinert nichts
//    und wandelt kein Format um. Der Optimierer tut beides. Die ROHE Adresse
//    der Quelle wird übergeben, nicht die Proxy-Adresse: Letztere lehnt der
//    Optimierer mit HTTP 400 ab — das hat hier schon einmal ein Kartenbild
//    verschwinden lassen.
//
// 2. PLATZ WIRD RESERVIERT.
//    Gemessener Layout-Versatz auf `/sets`: 0,41 — das Vierfache der Grenze,
//    ab der eine Seite als „springend" gilt. Set-Logos haben sehr
//    unterschiedliche Seitenverhältnisse; ohne feste Maße wächst die Zeile,
//    sobald jedes Logo eintrifft. `width`/`height` geben dem Browser das
//    Verhältnis vorab, `className` bestimmt weiterhin die tatsächliche Größe.

interface Props {
  setCode: string;
  setName: string;
  className?: string;
  /** Echte Logo-URL aus der TCG-API (set.images.logo) — verlässlichste Quelle. */
  logoUrl?: string;
  /**
   * Ersatzdarstellung, wenn es kein Logo gibt.
   *
   * `icon` (Standard) ist der kleine Platzhalter — richtig überall dort, wo das
   * Bild nur Beiwerk neben Text ist.
   *
   * `wortmarke` setzt stattdessen den Set-Namen. Gedacht für Flächen, auf denen
   * das Set-Bild der Blickfang IST: In der Set-Galerie standen für die vier
   * jüngsten Sets (deren Logos die Quelle noch nicht führt) vier winzige
   * Platzhalter-Kästchen ganz oben — die Seite sah kaputt aus, obwohl sie nur
   * ehrlich war. Ein gesetzter Name füllt denselben Platz und behauptet nichts
   * über ein Bild, das es nicht gibt.
   */
  platzhalter?: 'icon' | 'wortmarke';
}

/**
 * Robuste Quellenkette: echtes API-Logo → aus dem Set-Code abgeleitetes Logo →
 * sauberer Platzhalter. Es erscheint NIE ein kaputtes Bild-Icon.
 */
export function BoosterPackImage({ setCode, setName, className = '', logoUrl, platzhalter = 'icon' }: Props) {
  const sources = [
    logoUrl || '',
    setCode ? `https://images.pokemontcg.io/${setCode}/logo.png` : '',
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);

  if (idx >= sources.length) {
    if (platzhalter === 'wortmarke') {
      return (
        <span
          className={`flex items-center ${className}`}
          role="img"
          aria-label={`${setName} — kein Set-Logo verfügbar`}
        >
          <span className="text-[15px] font-black uppercase leading-tight tracking-[0.12em] text-slate-500">
            {setName}
          </span>
        </span>
      );
    }
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
    <Image
      key={sources[idx]}
      src={sources[idx]}
      // Ehrliche Beschriftung: Es ist das Set-Logo, kein Boosterpack-Foto.
      alt={`Set-Logo ${setName}`}
      // Typisches Logo-Verhältnis. Es muss nicht exakt stimmen — es hält nur
      // den Platz frei, bis das Bild da ist; `object-contain` in der
      // aufrufenden Klasse setzt das echte Verhältnis dann durch.
      width={400}
      height={140}
      sizes="(max-width: 640px) 40vw, 260px"
      className={className}
      onError={() => setIdx((i) => i + 1)}
      loading="lazy"
    />
  );
}
