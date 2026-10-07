'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { ExternalLink, Languages } from 'lucide-react';
import type { CardLanguage } from '@/lib/portfolio';
import type { SprachAngabe } from '@/lib/sprachpreise';
import { formatEur } from '@/lib/format';
import { cardmarketSuche } from '@/lib/kauf-links-basis';

// SPRACHWAHL DER KARTENSEITE — EINE Auswahl fuer die ganze Preisspalte.
//
// Befund 28.09.2026 (Nutzer, iPhone): Oben stand nach „JP" der japanische
// Preis (1,10 €), direkt darunter unter „Cardmarket-Preise" weiter die
// englisch/deutschen Werte (Trend 0,12 €). Zwei Zahlen, zwei Ausgaben, keine
// Beschriftung — das liest sich wie ein Widerspruch. Jetzt folgt die
// Aufschluesselung der Auswahl, und was nur fuer EN/DE gemessen ist
// (Marktkontext, Verlaufskennzahlen), sagt das bei JP/KR ausdruecklich.

const Kontext = createContext<{ sprache: CardLanguage; setSprache: (s: CardLanguage) => void } | null>(null);

export function SprachwahlProvider({ children }: { children: ReactNode }) {
  const [sprache, setSprache] = useState<CardLanguage>('EN');
  return <Kontext.Provider value={{ sprache, setSprache }}>{children}</Kontext.Provider>;
}

/** Auswahl aus dem Provider — ohne Provider eine eigene, lokale. */
export function useSprachwahl(): [CardLanguage, (s: CardLanguage) => void] {
  const k = useContext(Kontext);
  const [lokal, setLokal] = useState<CardLanguage>('EN');
  return k ? [k.sprache, k.setSprache] : [lokal, setLokal];
}

export const AUSGABE: Record<CardLanguage, { nom: string; dat: string }> = {
  EN: { nom: 'englische', dat: 'englischen' },
  DE: { nom: 'deutsche', dat: 'deutschen' },
  JP: { nom: 'japanische', dat: 'japanischen' },
  KR: { nom: 'koreanische', dat: 'koreanischen' },
};

export const tagDe = (iso: string) => {
  const [j, m, t] = iso.slice(0, 10).split('-');
  return `${t}.${m}.${j}`;
};

interface Zeile {
  label: string;
  wert: number | null | undefined;
  ton: string;
}

function Tabelle({ zeilen }: { zeilen: Zeile[] }) {
  return (
    <dl className="space-y-2 text-sm">
      {zeilen
        .filter((z) => z.wert != null && z.wert > 0)
        .map((z) => (
          <div key={z.label} className="flex items-center justify-between">
            <dt className="text-slate-400">{z.label}</dt>
            <dd className={`tabular-nums ${z.ton}`}>{formatEur(z.wert as number)}</dd>
          </div>
        ))}
    </dl>
  );
}

interface AufschluesselungProps {
  kartenName: string;
  /** Geprüfter Cardmarket-Link der Karte (EN/DE-Produkt) — kauf-links.ts. */
  cardmarketUrl?: string;
  en: { trend?: number; low?: number; avgSell?: number; avg30?: number } | null;
  /** Serverseitig formulierter Datenstand der EN/DE-Werte. */
  enStand: string | null;
  sprachen: SprachAngabe[];
}

/** „Cardmarket-Preise" — immer für die gewählte Ausgabe. */
export function CmAufschluesselung({ kartenName, cardmarketUrl, en, enStand, sprachen }: AufschluesselungProps) {
  const [sprache] = useSprachwahl();
  const fremd = sprache === 'JP' || sprache === 'KR' ? sprachen.find((s) => s.sprache === sprache) ?? null : null;
  // JP/KR sind eigene Produkte — dafür bleibt die Suche; EN/DE führt genau auf die Karte.
  const pruefen = !fremd && cardmarketUrl ? cardmarketUrl : cardmarketSuche(kartenName);

  const kopf = (titel: string, zusatz: string) => (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-bold text-slate-200">{titel}</h2>
        <p className="mt-0.5 text-[11px] text-slate-500">{zusatz}</p>
      </div>
      <a
        href={pruefen}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex min-h-[32px] shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300"
      >
        Prüfen <ExternalLink size={11} />
      </a>
    </div>
  );

  if (sprache === 'JP' || sprache === 'KR') {
    if (!fremd?.ok) {
      return (
        <div className="border-t border-[#1c1c24] pt-5">
          {kopf('Cardmarket-Preise', `${AUSGABE[sprache].nom[0].toUpperCase()}${AUSGABE[sprache].nom.slice(1)} Ausgabe`)}
          <p className="text-sm text-slate-500">
            Für die {AUSGABE[sprache].nom} Ausgabe dieser Karte liegen keine gesicherten Cardmarket-Preise vor.
          </p>
        </div>
      );
    }
    return (
      <div className="border-t border-[#1c1c24] pt-5">
        {kopf(
          'Cardmarket-Preise',
          `${AUSGABE[sprache].nom[0].toUpperCase()}${AUSGABE[sprache].nom.slice(1)} Ausgabe · ${fremd.gegenstueck.id.replace(/-(?=[^-]+$)/, ' ')}`,
        )}
        <Tabelle
          zeilen={[
            { label: 'Preis-Trend (Marktwert)', wert: fremd.preis.trend, ton: 'font-bold text-white' },
            { label: 'Günstigstes Angebot (ab)', wert: fremd.preis.low, ton: 'font-semibold text-emerald-400' },
            { label: 'Ø Verkaufspreis', wert: fremd.preis.avg, ton: 'font-semibold text-slate-300' },
            { label: 'Ø 7 Tage', wert: fremd.preis.avg7, ton: 'font-semibold text-slate-300' },
            { label: 'Ø 30 Tage', wert: fremd.preis.avg30, ton: 'font-semibold text-slate-300' },
          ]}
        />
        <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
          Cardmarket führt die {AUSGABE[sprache].nom} Karte als eigenes Produkt — mit eigenem Preis, unabhängig von der
          englischen/deutschen Ausgabe. Quelle: offizielles Cardmarket-Preisverzeichnis, Stand {tagDe(fremd.stand)}.
        </p>
      </div>
    );
  }

  if (!en || !(en.trend || en.low)) return null;
  return (
    <div className="border-t border-[#1c1c24] pt-5">
      {kopf('Cardmarket-Preise', 'Englische und deutsche Ausgabe (ein Cardmarket-Produkt)')}
      <Tabelle
        zeilen={[
          { label: 'Preis-Trend (Marktwert)', wert: en.trend, ton: 'font-bold text-white' },
          { label: 'Günstigstes Angebot (ab)', wert: en.low, ton: 'font-semibold text-emerald-400' },
          { label: 'Ø Verkaufspreis', wert: en.avgSell, ton: 'font-semibold text-slate-300' },
          { label: 'Ø 30 Tage', wert: en.avg30, ton: 'font-semibold text-slate-300' },
        ]}
      />
      <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
        Der angezeigte Marktpreis ist der <strong className="text-slate-500">Cardmarket-Trend</strong> (fairer Marktwert
        bei gutem Zustand). „Ab" ist das günstigste Einzelangebot — meist schlechterer Zustand oder andere Sprache.
        {enStand}
      </p>
    </div>
  );
}

/**
 * Abschnitte, die nur für die englisch/deutsche Ausgabe gemessen sind. Bei
 * JP/KR bleiben sie sichtbar, stehen aber unter einem klaren Hinweis —
 * sonst läse man die EN-Bewegung als Bewegung der japanischen Karte.
 */
export function NurEnDe({ children }: { children: ReactNode }) {
  const [sprache] = useSprachwahl();
  if (sprache !== 'JP' && sprache !== 'KR') return <>{children}</>;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-[#2a2a3a] bg-[#13131e] px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
        <Languages size={14} className="mt-0.5 shrink-0 text-violet-400" />
        <span>
          Ab hier: Kennzahlen der <strong className="text-slate-300">englischen/deutschen Ausgabe</strong>. Für die{' '}
          {AUSGABE[sprache].nom} Ausgabe gibt es keinen eigenen Verlauf.
        </span>
      </div>
      <div className="opacity-60">{children}</div>
    </div>
  );
}
