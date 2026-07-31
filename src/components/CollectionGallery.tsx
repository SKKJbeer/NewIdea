'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import type { PortfolioHolding, LiveCardData } from '@/lib/portfolio';
import { hasLivePrice } from '@/lib/portfolio';
import { CardThumb } from './CardThumb';
import { formatEur, formatPercent } from '@/lib/format';
import { SECTION_LABEL, toneClass } from '@/lib/ui';

// DIE SAMMLUNG ANSEHEN, NICHT AUSWERTEN
//
// WARUM ES DIESE ANSICHT GIBT: Ein Portfolio ist eine Tabelle — Einstand,
// Wert, Veränderung, Anteil. Das ist richtig und es ist nicht alles. Wer
// sammelt, will die Karten auch einfach ansehen können. In der Positionsliste
// ist das Artwork 40 Pixel breit und steht neben vier Zahlen; hier ist es der
// Gegenstand.
//
// WAS DAS NICHT IST: eine nachgebaute Sammelmappe mit Ringen, Seitenrändern
// und Umblätter-Animation. Das machen andere, und es sieht auf einem Telefon
// immer nach Spielzeug aus. Hier steht eine ruhige Galerie: gleichmäßiges
// Raster, echtes Kartenformat, Zahlen klein darunter.
//
// DIE VERBINDUNG BLEIBT: Ein Klick führt auf die Kartenseite und damit in den
// Marktkontext. Sammlung → Karte → Markt, in dieser Richtung.

type Sortierung = 'wert' | 'bewegung' | 'set' | 'neu';

const SORTIERUNGEN: Array<[Sortierung, string]> = [
  ['wert', 'Wert'],
  ['bewegung', 'Bewegung'],
  ['set', 'Set'],
  ['neu', 'Zuletzt hinzugefügt'],
];

interface Props {
  holdings: PortfolioHolding[];
  liveData: Record<string, LiveCardData>;
}

export function CollectionGallery({ holdings, liveData }: Props) {
  const [sortierung, setSortierung] = useState<Sortierung>('wert');

  const sortiert = useMemo(() => {
    const kopie = [...holdings];
    const wert = (h: PortfolioHolding) => (liveData[h.cardId]?.price ?? h.purchasePrice) * h.quantity;
    // Ohne Live-Preis gibt es keine Bewegung — solche Karten wandern ans Ende,
    // statt mit einer gedachten Null in der Rangfolge zu stehen.
    const bewegung = (h: PortfolioHolding) => {
      if (!hasLivePrice(h, liveData) || !(h.purchasePrice > 0)) return null;
      return ((liveData[h.cardId].price - h.purchasePrice) / h.purchasePrice) * 100;
    };

    switch (sortierung) {
      case 'bewegung':
        return kopie.sort((a, b) => {
          const x = bewegung(a);
          const y = bewegung(b);
          if (x === null && y === null) return 0;
          if (x === null) return 1;
          if (y === null) return -1;
          return y - x;
        });
      case 'set':
        return kopie.sort((a, b) => a.setName.localeCompare(b.setName) || a.cardName.localeCompare(b.cardName));
      case 'neu':
        return kopie.sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
      default:
        return kopie.sort((a, b) => wert(b) - wert(a));
    }
  }, [holdings, liveData, sortierung]);

  if (holdings.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#1c1c24] pb-3">
        <span className={SECTION_LABEL}>Sortierung</span>
        {SORTIERUNGEN.map(([wert, beschriftung]) => (
          <button
            key={wert}
            type="button"
            onClick={() => setSortierung(wert)}
            className={`min-h-[32px] text-[12px] transition-colors ${
              sortierung === wert
                ? 'text-slate-100 underline underline-offset-4'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {beschriftung}
          </button>
        ))}
        <span className="ml-auto text-[11px] tabular-nums text-slate-600">
          {holdings.length} {holdings.length === 1 ? 'Karte' : 'Karten'}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
        {sortiert.map((h) => {
          const live = liveData[h.cardId];
          const preis = live?.price ?? 0;
          const gemessen = hasLivePrice(h, liveData) && h.purchasePrice > 0;
          const bewegung = gemessen ? ((preis - h.purchasePrice) / h.purchasePrice) * 100 : null;

          return (
            <Link key={h.cardId} href={`/karten/${h.cardId}`} className="group block">
              {/* Kein Rahmen, kein Kasten — die Karte trägt ihren eigenen Rand.
                  Der Schimmer läuft auf allen Karten der Sammlung: Hier geht es
                  ums Ansehen, und in dieser Ansicht ist er die Auskunft
                  „das ist deine Karte", nicht eine Seltenheitsangabe. */}
              <span className="lift foil relative block aspect-[63/88] w-full overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
                {h.imageUrl ? (
                  <CardThumb
                    src={h.imageUrl}
                    alt={h.cardName}
                    width={220}
                    height={307}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-700">
                    <ImageOff size={24} />
                  </span>
                )}
                {h.quantity > 1 && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-200">
                    {h.quantity}×
                  </span>
                )}
              </span>

              <p className="mt-2.5 truncate text-[12px] text-slate-300 group-hover:text-white">
                {h.cardName}
              </p>
              <p className="truncate text-[10px] text-slate-600">{h.setName}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-[12px] tabular-nums text-slate-300">
                  {preis > 0 ? formatEur(preis) : '—'}
                </span>
                <span className={`text-[11px] tabular-nums ${toneClass(bewegung)}`}>
                  {/* Ohne Live-Preis steht hier ein Strich, keine Null. Ein
                      fehlgeschlagener Abruf darf nicht wie eine Nullbewegung
                      aussehen. */}
                  {bewegung === null ? '—' : formatPercent(bewegung)}
                </span>
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
