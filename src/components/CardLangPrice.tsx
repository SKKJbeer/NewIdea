'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { LangPicker } from './LangPicker';
import type { SprachAngabe } from '@/lib/sprachpreise';
import { formatEur, formatPercent } from '@/lib/format';
import { useSprachwahl, AUSGABE, tagDe } from './Sprachwahl';

// PREIS JE KARTENSPRACHE — nur, was Cardmarket wirklich veroeffentlicht.
//
// - EN und DE: Cardmarket fuehrt beide (und die uebrigen europaeischen
//   Sprachen) als EIN Produkt. Der Preis-Trend fasst sie zusammen; einen
//   eigenen Wert nur fuer deutsche Karten gibt es im Preisverzeichnis nicht.
//   Das steht so da, statt einen „DE-Preis" vorzutaeuschen.
// - JP und KR: eigene Produkte mit eigenem Preis — aber nur, wenn die
//   Ausgabe EINDEUTIG zugeordnet ist (sprach-zuordnung.ts). Sonst kein Preis,
//   und der Grund steht dabei. Vorher zeigte diese Stelle den englischen
//   Preis unter der Beschriftung „JP".

const GRUND: Record<Exclude<SprachAngabe, { ok: true }>['grund'], (s: string) => string> = {
  'keine-zuordnung': (s) =>
    `Für diese Karte ist keine ${s} Ausgabe eindeutig zugeordnet. Ohne sichere Zuordnung steht hier kein Preis — ein geschätzter wäre womöglich der einer anderen Karte.`,
  'kein-preis': (s) => `Die ${s} Ausgabe ist zugeordnet, Cardmarket führt für sie derzeit aber keinen Preis-Trend.`,
  veraltet: () => 'Der letzte Stand des Cardmarket-Preisverzeichnisses ist älter als drei Tage — deshalb kein Preis.',
  'nicht-geladen': () => 'Sprachpreise konnten gerade nicht geladen werden.',
};

interface CardLangPriceProps {
  defaultPrice: number;
  trendPercent: number;
  realData: boolean;
  priceSource?: string;
  sprachen: SprachAngabe[];
}

export function CardLangPrice({ defaultPrice, trendPercent, realData, priceSource, sprachen }: CardLangPriceProps) {
  const [language, setLanguage] = useSprachwahl();

  const fremd = language === 'JP' || language === 'KR' ? sprachen.find((s) => s.sprache === language) ?? null : null;

  let price: number | null = defaultPrice > 0 ? defaultPrice : null;
  let trend: number | null = realData ? trendPercent : null;
  let label = priceSource === 'cardmarket' ? 'Cardmarket · EN/DE' : null;
  if (language === 'JP' || language === 'KR') {
    if (fremd?.ok) {
      price = fremd.preis.trend;
      trend = fremd.preis.avg30 ? Math.round(((fremd.preis.trend - fremd.preis.avg30) / fremd.preis.avg30) * 1000) / 10 : null;
      label = `Cardmarket · ${language}`;
    } else {
      price = null;
      trend = null;
      label = null;
    }
  }

  return (
    <div>
      <div className="mb-3">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
          Kartensprache · Preis
        </p>
        <LangPicker value={language} onChange={setLanguage} size="md" />
        {language === 'DE' && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
            Cardmarket führt deutsche, englische und die übrigen europäischen Ausgaben als ein Produkt. Der
            Preis-Trend gilt für alle zusammen — einen eigenen Wert nur für deutsche Karten veröffentlicht
            Cardmarket nicht.
          </p>
        )}
        {(language === 'JP' || language === 'KR') && fremd && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            {fremd.ok ? (
              <>
                {/* Set-CODE und Nummer statt Set-Name: TCGdex fuehrt einzelne
                    japanische Set-Namen falsch (SV4a heisst dort „Raging
                    Surf"), Code und Nummer stehen dagegen auf der Karte. */}
                Preis der {AUSGABE[language].dat} Ausgabe{' '}
                <span className="text-slate-300">
                  {fremd.gegenstueck.name} · {fremd.gegenstueck.id.replace(/-(?=[^-]+$)/, '\u00A0')}
                </span>
                {' '}· Stand {tagDe(fremd.stand)}
              </>
            ) : (
              GRUND[fremd.grund](AUSGABE[language].nom)
            )}
          </p>
        )}
      </div>

      <div className="flex items-end gap-4 mt-2">
        <div>
          <p className="text-xs text-slate-600">
            Marktpreis{label ? ` (${label})` : ''}
          </p>
          <p className="text-3xl font-black text-white tabular-nums">{price !== null ? formatEur(price) : '—'}</p>
        </div>

        {trend !== null && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold pb-1 ${
              trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend >= 0 ? '+' : ''}
            {formatPercent(trend, { withSign: false })} (30d)
          </div>
        )}
      </div>
    </div>
  );
}
