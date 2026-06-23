'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { LangPicker } from './LangPicker';
import type { CardLanguage } from '@/lib/portfolio';

const LANG_LABEL: Record<CardLanguage, string> = {
  EN: 'EN',
  DE: 'DE',
  JP: 'JP',
  KR: 'KR',
};

interface CardLangPriceProps {
  cardId: string;
  cardName: string;
  defaultPrice: number;
  trendPercent: number;
  realData: boolean;
  priceSource?: string;
}

export function CardLangPrice({
  cardId,
  cardName,
  defaultPrice,
  trendPercent,
  realData,
  priceSource,
}: CardLangPriceProps) {
  const [language, setLanguage] = useState<CardLanguage>('EN');
  const [price, setPrice] = useState(defaultPrice);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'fallback'>('idle');

  const isPositive = trendPercent >= 0;

  async function handleLangChange(lang: CardLanguage) {
    setLanguage(lang);

    if (lang === 'EN') {
      setPrice(defaultPrice);
      setStatus('idle');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: [{ id: cardId, language: lang, name: cardName }],
        }),
      });
      const data = (await res.json()) as Record<
        string,
        { price: number; priceLanguage: CardLanguage }
      >;
      const result = data[cardId];
      if (result && result.price > 0) {
        setPrice(result.price);
        setStatus(result.priceLanguage === lang ? 'ok' : 'fallback');
      }
    } catch {
      // keep current price
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Language Picker */}
      <div className="mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Kartensprache · Preis
        </p>
        <LangPicker value={language} onChange={handleLangChange} size="md" />
        {language !== 'EN' && (
          <p className="mt-1.5 text-[10px] text-gray-400">
            {status === 'ok' && `✓ Cardmarket-Preis für ${LANG_LABEL[language]}-Ausgaben`}
            {status === 'fallback' &&
              '⚠ Sprachspezifischer Preis nicht verfügbar (Cardmarket OAuth fehlt) — EN-Fallback'}
          </p>
        )}
      </div>

      {/* Price display */}
      <div className="flex items-end gap-4 mt-2">
        <div>
          <p className="text-xs text-gray-400">
            Marktpreis
            {priceSource === 'cardmarket' ? ` (Cardmarket · ${LANG_LABEL[language]})` : ''}
          </p>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={20} className="animate-spin text-violet-500" />
                <span className="text-2xl font-black text-gray-400">...</span>
              </div>
            ) : (
              <p className="text-3xl font-black text-gray-900">
                {price > 0 ? `${price.toFixed(2)} €` : 'N/A'}
              </p>
            )}
          </div>
        </div>

        {realData && !loading && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold pb-1 ${
              isPositive ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {isPositive ? '+' : ''}
            {trendPercent.toFixed(1)}% (30d)
          </div>
        )}
      </div>
    </div>
  );
}
