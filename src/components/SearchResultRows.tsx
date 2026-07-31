'use client';

import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import type { PokemonCard } from '@/types';
import { CardThumb } from './CardThumb';
import { hasRealTrend } from '@/lib/market-metrics';
import { formatEur, formatPercent, formatPp } from '@/lib/format';
import { TABLE, NUM, toneClass } from '@/lib/ui';

// SUCHERGEBNISSE ALS ZEILEN
//
// VORHER: ein Raster aus Kacheln, jede mit Kartenbild, Namen, Set-Logo,
// Seltenheit, Preis, Trend, einem Bewertungsbalken und einer Schaltfläche
// „Details & Kaufen". Fünf Karten nebeneinander, jede so groß wie eine
// Produktkachel in einem Onlineshop.
//
// Das Problem ist nicht die Gestaltung, sondern die Aufgabe: Wer sucht, will
// VERGLEICHEN. In einem Raster steht jede Zahl an einer anderen Stelle, also
// muss man sie einzeln lesen. In Zeilen stehen sie untereinander, und der
// Vergleich passiert beim Überfliegen.
//
// DER MARKTBEZUG IST DER PUNKT. Jede Zeile zeigt, wie weit die Karte vom Index
// entfernt ist — dieselbe Auskunft wie auf der Startseite, mit demselben
// Zeitraum. Genau das unterscheidet eine Suche mit Marktkontext von einer
// Preisabfrage.
//
// Das Kartenbild bleibt dabei größer als in den Bewegungen: Beim Suchen ist das
// Wiedererkennen der Illustration die halbe Miete, bei einer Rangliste nicht.

interface Props {
  cards: PokemonCard[];
  /** Sprachspezifische Preise, sofern abgerufen. */
  priceOverrides?: Record<string, number>;
  priceLanguage?: string;
  /** Indexwert für den Abstand zum Markt. `null` = kein belastbarer Wert. */
  cbi?: number | null;
}

export function SearchResultRows({
  cards,
  priceOverrides = {},
  priceLanguage = 'EN',
  cbi = null,
}: Props) {
  return (
    <div>
      <div
        className={`${TABLE.head} grid grid-cols-[auto_1fr_auto] items-center gap-x-4 border-b border-[#1c1c24] px-1 pb-2 sm:grid-cols-[auto_1fr_auto_auto_auto]`}
      >
        <span className="w-10" />
        <span>Karte</span>
        <span className="hidden w-24 text-right sm:block">Preis</span>
        <span className="w-[72px] text-right tabular-nums">30 T</span>
        <span className="hidden w-[80px] text-right sm:block">vs. Markt</span>
      </div>

      {cards.map((card) => {
        const preis = priceOverrides[card.id] ?? (card.prices.market || card.prices.holofoil?.market || 0);
        const gemessen = hasRealTrend(card);
        const trend = gemessen ? (card.trendPercent as number) : null;
        // Prozentpunkte — der Abstand zweier Prozentwerte ist kein Prozentwert.
        const gegenMarkt = trend !== null && cbi !== null ? trend - cbi : null;

        return (
          <Link
            key={card.id}
            href={`/karten/${card.id}`}
            className={`group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-1 py-2.5 sm:grid-cols-[auto_1fr_auto_auto_auto] ${TABLE.row} focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-violet-500/60`}
          >
            <span className="lift foil block w-10 shrink-0 overflow-hidden rounded-[3px]"
            >
              {card.imageUrl ? (
                <CardThumb
                  src={card.imageUrl}
                  width={40}
                  height={56}
                  className="aspect-[63/88] w-10 object-contain"
                />
              ) : (
                <span className="flex aspect-[63/88] w-10 items-center justify-center text-slate-700">
                  <ImageOff size={14} />
                </span>
              )}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[14px] text-slate-200 group-hover:text-white">
                {card.nameDe ?? card.name}
              </span>
              <span className="block truncate text-[11px] text-slate-600">
                {card.set}
                {card.number ? ` · ${card.number}` : ''}
                {card.rarity && card.rarity !== 'Unknown' ? ` · ${card.rarity}` : ''}
                {/* Auf dem Telefon gibt es keine eigene Preisspalte. */}
                <span className="sm:hidden"> · {preis > 0 ? formatEur(preis) : '—'}</span>
              </span>
            </span>

            <span className={`${NUM.row} hidden w-24 text-right text-slate-300 sm:block`}>
              {preis > 0 ? formatEur(preis) : '—'}
              {priceLanguage !== 'EN' && (
                <span className="ml-1 text-[9px] text-violet-400">{priceLanguage}</span>
              )}
            </span>

            <span className={`${NUM.row} w-[72px] text-right font-semibold ${toneClass(trend)}`}>
              {trend === null ? '—' : formatPercent(trend)}
            </span>

            <span
              className={`${NUM.small} hidden w-[80px] text-right sm:block ${
                gegenMarkt === null ? 'text-slate-700' : 'text-slate-500'
              }`}
              title={gegenMarkt === null ? undefined : 'Abstand zum CardBeacon Index in Prozentpunkten'}
            >
              {gegenMarkt === null ? '—' : formatPp(gegenMarkt)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
