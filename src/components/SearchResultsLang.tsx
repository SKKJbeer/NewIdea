'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SearchResultRows } from './SearchResultRows';
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
  /** Indexwert für den Abstand zum Markt — serverseitig aus EINER Datenbankzeile. */
  cbi?: number | null;
}

export function SearchResultsLang({ cards, query, cbi = null }: SearchResultsLangProps) {
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
          // Nur echte Sprachpreise ersetzen den angezeigten Wert. Vorher
          // stand hier jeder Preis — auch der englische, dann mit „JP"
          // beschriftet.
          if (d.price > 0 && d.priceLanguage === language) overrides[id] = d.price;
          langs[id] = d.priceLanguage;
        }
        setPriceOverrides(overrides);
        setActualLanguages(langs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [language, cards]);

  const ergebnisse = Object.values(actualLanguages);
  const mitSprachpreis = ergebnisse.filter((l) => l === language).length;

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

      {language === 'DE' && (
        <div className="mb-4 rounded-md border border-[#2a2a3a] bg-[#13131e] px-4 py-2.5 text-xs text-slate-400">
          Cardmarket führt deutsche und englische Ausgaben als ein Produkt — die Preise gelten für beide.
        </div>
      )}

      {(language === 'JP' || language === 'KR') && !loading && ergebnisse.length > 0 && (
        <div className="mb-4 rounded-md border border-[#2a2a3a] bg-[#13131e] px-4 py-2.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{mitSprachpreis}</span> von {ergebnisse.length} Karten mit
          eigener {language}-Notierung auf Cardmarket. Die übrigen zeigen die EN-Notierung (markiert) — ihre{' '}
          {language === 'JP' ? 'japanische' : 'koreanische'} Ausgabe ist nicht eindeutig zugeordnet.
        </div>
      )}

      <SearchResultRows
        cards={cards}
        priceOverrides={priceOverrides}
        priceLanguage={language}
        cbi={cbi}
      />
    </div>
  );
}
