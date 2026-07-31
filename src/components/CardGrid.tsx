'use client';

import Link from 'next/link';
import { CardImage } from './CardImage';
import { PokemonCard } from '@/types';
import { TrendingUp, TrendingDown, ImageOff } from 'lucide-react';
import { BoosterPackImage } from './BoosterPackImage';
import { formatEur, formatEurRounded, formatPercent } from '@/lib/format';
import { hasRealTrend } from '@/lib/market-metrics';

interface CardGridProps {
  cards: PokemonCard[];
  title?: string;
  compact?: boolean;
  priceOverrides?: Record<string, number>;
  priceLanguage?: string;
}

export function CardGrid({ cards, title, compact = false, priceOverrides = {}, priceLanguage = 'EN' }: CardGridProps) {
  return (
    <section>
      {title && (
        <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          {title}
        </h2>
      )}
      <div className={compact
        ? 'grid grid-cols-3 sm:grid-cols-6 gap-2'
        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
      }>
        {cards.map((card) => (
          <CardItem key={card.id} card={card} compact={compact} priceOverride={priceOverrides[card.id]} priceLanguage={priceLanguage} />
        ))}
      </div>
    </section>
  );
}

function CardItem({ card, compact, priceOverride, priceLanguage = 'EN' }: { card: PokemonCard; compact?: boolean; priceOverride?: number; priceLanguage?: string }) {
  const price = priceOverride ?? (card.prices.market || card.prices.holofoil?.market || 0);
  // NICHT `card.trendPercent || 0`.
  //
  // Damit wurde jede Karte OHNE Messung als „0,0 %" ausgewiesen — optisch
  // ununterscheidbar von einer Karte, die sich tatsächlich nicht bewegt hat.
  // Das ist dieselbe Verwechslung wie an vier anderen Stellen im Projekt, und
  // sie verstösst gegen die Preis-Wahrheitspflicht: Eine fehlende Messung darf
  // nie wie ein Messwert aussehen.
  const gemessen = hasRealTrend(card);
  const trend = gemessen ? (card.trendPercent as number) : null;
  const isPositive = trend !== null && trend > 0;
  const unveraendert = trend === 0;

  if (compact) {
    return (
      <Link href={`/karten/${card.id}`} className="block group">
        <div className="bg-[#13131e] rounded-md border border-[#2a2a3a] hover:border-violet-500/30 active:scale-[0.97] active:border-violet-500/50 transition-all overflow-hidden">
          <div className="relative aspect-[63/88] bg-[#1a1a28]">
            {card.imageUrl ? (
              <CardImage
                src={card.imageUrl}
                alt={card.name}
                sizes="(max-width: 640px) 33vw, 16vw"
                className="object-contain group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageOff size={20} /></div>
            )}
          </div>
          <div className="p-1.5">
            <p className="text-[10px] font-semibold text-slate-300 leading-tight line-clamp-1">{card.name}</p>
            <p className="text-[10px] font-bold text-slate-400 tabular-nums">
              {price > 0 ? formatEurRounded(price) : '—'}
              {priceLanguage !== 'EN' && <span className="ml-1 text-[9px] text-violet-400">{priceLanguage}</span>}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/karten/${card.id}`} className="block group">
      <div className="bg-[#13131e] rounded-md border border-[#2a2a3a] hover:border-violet-500/30 active:scale-[0.97] active:border-violet-500/50 transition-all duration-200 overflow-hidden cursor-pointer">
        <div className="relative bg-[#1a1a28] p-3 aspect-[63/88]">
          {card.imageUrl ? (
            <CardImage
              src={card.imageUrl}
              alt={card.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain group-hover:scale-105 transition-transform duration-300 p-3"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageOff size={32} /></div>
          )}
          {/* KEIN PUNKTESTAND MEHR AUF DER KACHEL.
              Hier stand eine Zahl von 0 bis 100, grün ab 70, gelb ab 50 — ohne
              ein Wort dazu, was sie bedeutet. Eine farbcodierte Bewertung ohne
              Erklärung liest sich als Kauf-Ampel, und genau die gibt dieses
              Produkt nicht. Der Wert steht weiterhin auf der Kartenseite, dort
              mit seinen offengelegten Faktoren. */}
        </div>

        <div className="p-3">
          <p className="font-semibold text-slate-200 text-sm leading-tight line-clamp-1">{card.name}</p>
          {card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase() && (
            <p className="text-xs text-violet-400 leading-tight line-clamp-1">🇩🇪 {card.nameDe}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            {card.setCode && (
              <BoosterPackImage
                setCode={card.setCode}
                setName={card.set}
                className="h-5 w-auto object-contain shrink-0"
              />
            )}
            <p className="text-xs text-slate-600 line-clamp-1 min-w-0">{card.set}</p>
          </div>
          {card.rarity && card.rarity !== 'Unknown' && (
            <p className="mt-1 line-clamp-1 text-[10px] text-slate-700">{card.rarity}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-base font-bold text-slate-200">
                {price > 0 ? formatEur(price) : '—'}
              </span>
              {priceLanguage !== 'EN' && (
                <span className="ml-1.5 text-[10px] font-bold text-violet-400">{priceLanguage}</span>
              )}
            </div>
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                trend === null
                  ? 'text-slate-700'
                  : unveraendert
                    ? 'text-slate-500'
                    : isPositive
                      ? 'text-emerald-400'
                      : 'text-rose-400'
              }`}
              // Der Zeitraum gehört an die Zahl — sonst weiß niemand, worauf
              // sich die Veränderung bezieht.
              title={trend === null ? 'Keine Messung über 30 Tage' : 'Veränderung über 30 Tage'}
            >
              {trend !== null && !unveraendert && (isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
              {trend === null ? '—' : formatPercent(Math.abs(trend), { withSign: false })}
              <span className="ml-0.5 text-[9px] text-slate-600">30T</span>
            </span>
          </div>

          {/* HIER LAG EIN BEWERTUNGSBALKEN.
              Ein Stern, ein Fortschrittsbalken, grün ab 70 und gelb ab 50 — auf
              JEDER Kachel, ohne ein Wort dazu, woraus die Zahl entsteht. Zwei
              Gründe für den Ausbau: Er las sich als Kauf-Ampel (Abschnitt
              „keine Kaufsignale"), und er stand in einer Liste, in der man
              Karten VERGLEICHT — dort wiegt eine unerklärte Farbe schwerer als
              irgendwo sonst. Der Wert steht weiterhin auf der Kartenseite, dort
              mit seinen offengelegten Faktoren und einem Link zur Methodik.

              Auch die Schaltfläche „Details & Kaufen →" ist weg: Die ganze
              Kachel ist bereits ein Link, und „Kaufen" war eine Behauptung —
              gekauft wird auf Cardmarket, nicht hier. */}
        </div>
      </div>
    </Link>
  );
}
