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

  const hasAnyResult = Object.keys(actualLanguages).length > 0;
  const cmFallback =
    language !== 'EN' &&
    hasAnyResult &&
    Object.values(actualLanguages).every((l) => l === 'EN');

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-slate-200">{cards.length}</span> Treffer für „
          <span className="font-semibold text-slate-200">{query}</span>"
        </p>
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin text-violet-400" />}
          <LangPicker value={language} onChange={setLanguage} />
        </div>
      </div>

      {cmFallback && (
        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-400/80">
          <strong className="text-amber-400">Sprachspezifische Preise nicht verfügbar:</strong>{' '}
          Die Cardmarket OAuth API ist noch nicht konfiguriert — EN-Preise werden angezeigt.
        </div>
      )}

      {language !== 'EN' && !loading && !cmFallback && hasAnyResult && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs text-emerald-400">
          ✓ Cardmarket-Preise für {language === 'DE' ? 'deutsche' : language === 'JP' ? 'japanische' : 'koreanische'} Ausgaben
        </div>
      )}

      <CardGrid cards={cards} priceOverrides={priceOverrides} priceLanguage={language} />
    </div>
  );
}
