'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { CardGrid } from './CardGrid';
import { LangPicker } from './LangPicker';
import type { PokemonCard } from '@/types';
import type { CardLanguage } from '@/lib/portfolio';

interface PriceResult {
  price: number;
  priceLanguage: CardLanguage;
}

interface SearchResultsLangProps {
  cards: PokemonCard[];
  query: string;
}

export function SearchResultsLang({ cards, query }: SearchResultsLangProps) {
  const [language, setLanguage] = useState<CardLanguage>('EN');
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [actualLanguages, setActualLanguages] = useState<Record<string, CardLanguage>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (language === 'EN') {
      setPriceOverrides({});
      setActualLanguages({});
      return;
    }

    setLoading(true);
    fetch('/api/portfolio/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: cards.map((c) => ({ id: c.id, language, name: c.name })),
      }),
    })
      .then((r) => r.json())
      .then((data: Record<string, PriceResult>) => {
        const overrides: Record<string, number> = {};
        const langs: Record<string, CardLanguage> = {};
        for (const [id, d] of Object.entries(data)) {
          if (d.price > 0) overrides[id] = d.price;
          langs[id] = d.priceLanguage;
        }
        setPriceOverrides(overrides);
        setActualLanguages(langs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [language, cards]);

  // Check if CM OAuth is not configured (all results fell back to EN)
  const hasAnyResult = Object.keys(actualLanguages).length > 0;
  const cmFallback =
    language !== 'EN' &&
    hasAnyResult &&
    Object.values(actualLanguages).every((l) => l === 'EN');

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{cards.length}</span> Treffer für „
          <span className="font-semibold text-gray-900">{query}</span>"
        </p>
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin text-violet-500" />}
          <LangPicker value={language} onChange={setLanguage} />
        </div>
      </div>

      {cmFallback && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          <strong>Sprachspezifische Preise nicht verfügbar:</strong> Die Cardmarket OAuth API ist noch nicht konfiguriert
          ({['CARDMARKET_APP_TOKEN', 'CARDMARKET_USER_TOKEN'].join(', ')} fehlen in Vercel).
          Es werden EN-Cardmarket-Preise angezeigt.
        </div>
      )}

      {language !== 'EN' && !loading && !cmFallback && hasAnyResult && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          ✓ Cardmarket-Preise für {language === 'DE' ? 'deutsche' : language === 'JP' ? 'japanische' : 'koreanische'} Ausgaben
        </div>
      )}

      <CardGrid cards={cards} priceOverrides={priceOverrides} priceLanguage={language} />
    </div>
  );
}
