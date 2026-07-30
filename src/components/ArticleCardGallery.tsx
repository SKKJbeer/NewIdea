import type { FeaturedCard } from '@/lib/article-generator';
import { BoosterPackImage } from './BoosterPackImage';
import { cachedImg } from '@/lib/cached-image';
import { formatEur } from '@/lib/format';
import { PriceBars, TrendBars, TrendChip } from './DataBars';

// KARTENBLOCK IM ARTIKEL
//
// Das Kartenbild ist der Blickfang, nicht die Beschriftung. Früher stand unter
// JEDER Karte dasselbe Set-Logo in voller Größe — bei vier Karten aus einem Set
// viermal dasselbe Bild, das mehr Platz einnahm als die Karten selbst. Stammen
// alle aus demselben Set, steht das Logo jetzt einmal in der Kopfzeile; sonst
// klein an der einzelnen Karte. So bleibt die Herkunft erkennbar (Pflichtregel
// „Boosterpack-Bild überall dort wo Karten erwähnt werden"), ohne den Block zu
// dominieren.
//
// Die beiden Grafiken darunter liegen in DataBars.tsx — der Marktbericht zeigt
// dieselben.

interface Props {
  cards: FeaturedCard[];
  /** Bleibt für die Aufrufer erhalten — Datenfarben richten sich bewusst NICHT danach. */
  accentColor?: string;
}

export function ArticleCardGallery({ cards }: Props) {
  const balken = cards.map((c) => ({ name: c.name, price: c.price, trend: c.trend }));

  const sets = [...new Set(cards.map((c) => c.setCode).filter(Boolean))];
  const einSet = sets.length === 1 ? cards.find((c) => c.setCode) : null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#13131e]">
        <div className="flex items-center justify-between gap-3 border-b border-[#1e1e30] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Karten im Artikel
          </p>
          {einSet && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[10px] text-slate-600">{einSet.set}</span>
              <BoosterPackImage
                setCode={einSet.setCode}
                setName={einSet.set}
                className="h-7 w-auto shrink-0 object-contain drop-shadow"
              />
            </div>
          )}
        </div>

        <div className="flex snap-x gap-3 overflow-x-auto px-4 py-4">
          {cards.map((card) => (
            <div key={card.name} className="w-[124px] flex-none snap-start">
              <div className="relative mb-2 aspect-[63/88] w-full overflow-hidden rounded-xl border border-[#2a2a3a] bg-gradient-to-b from-[#1a1a28] to-[#0a0a0f] shadow-lg shadow-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cachedImg(card.imageUrl)}
                  alt={card.name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>

              <p className="line-clamp-2 text-[11px] font-bold leading-tight text-slate-200">
                {card.name}
              </p>

              {!einSet && card.setCode && (
                <div className="mt-1 flex items-center gap-1">
                  <BoosterPackImage
                    setCode={card.setCode}
                    setName={card.set}
                    className="h-4 w-auto shrink-0 object-contain"
                  />
                  <span className="truncate text-[9px] text-slate-600">{card.set}</span>
                </div>
              )}

              <div className="mt-1.5 flex items-center gap-1.5">
                {card.price > 0 && (
                  <span className="text-xs font-black tabular-nums text-white">
                    {formatEur(card.price)}
                  </span>
                )}
                <TrendChip trend={card.trend} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <PriceBars items={balken} />
      <TrendBars items={balken} />
    </div>
  );
}
