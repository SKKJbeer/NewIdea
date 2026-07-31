'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { formatEur, formatPercent } from '@/lib/format';
import { SECTION_LABEL, TABLE, NUM, toneClass } from '@/lib/ui';

// SET-BIBLIOTHEK
//
// WARUM DIESE SEITE ANDERS AUSSEHEN DARF: Sammler erleben Pokémon über
// Erweiterungen. Ein Set ist kein Datensatz, sondern ein Zeitraum — man weiß,
// wo man war, als es erschien. Diese Seite darf deshalb visueller sein als die
// Marktübersicht; das Set-Logo trägt hier die Farbe.
//
// WAS TROTZDEM GILT: Keine erfundenen Angaben. Die Epochen-Filter kommen aus
// dem `series`-Feld der Kartendatenbank — echte Serienbezeichnungen, keine
// selbst gebauten Ären. Die Marktbewegung steht NUR bei Sets, für die sie
// wirklich gemessen ist; alle anderen zeigen einen Strich. Sortieren nach
// Bewegung schiebt die ungemessenen Sets deshalb ans Ende, statt sie mit einer
// gedachten Null einzureihen.

export interface SetEintrag {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  logoUrl: string;
  /** Gemessene 30-Tage-Bewegung des Sets. `null` = keine ausreichende Stichprobe. */
  trend: number | null;
  /** Typischer Kartenpreis (Median). `null`, wenn nicht gemessen. */
  median: number | null;
  /** Auswertbare Karten in der Stichprobe. */
  gemessen: number;
}

type Sortierung = 'release' | 'bewegung' | 'umfang' | 'preis';

const SORTIERUNGEN: Array<[Sortierung, string]> = [
  ['release', 'Erscheinen'],
  ['bewegung', 'Bewegung 30 T'],
  ['preis', 'Typischer Preis'],
  ['umfang', 'Kartenanzahl'],
];

function datum(s: string): string {
  if (!s) return '';
  const d = new Date(s.replace(/\//g, '-') + 'T12:00:00');
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

export function SetLibrary({ sets }: { sets: SetEintrag[] }) {
  const [epoche, setEpoche] = useState<string>('alle');
  const [sortierung, setSortierung] = useState<Sortierung>('release');

  // Epochen aus den DATEN, nicht aus einer Liste im Code: Erscheint eine neue
  // Serie, taucht sie hier von allein auf — und eine Serie, zu der gerade keine
  // Sets geladen sind, steht nicht als leerer Filter herum.
  const epochen = useMemo(() => {
    const zaehlung = new Map<string, number>();
    for (const s of sets) if (s.series) zaehlung.set(s.series, (zaehlung.get(s.series) ?? 0) + 1);
    return [...zaehlung.entries()].sort((a, b) => b[1] - a[1]);
  }, [sets]);

  const sichtbar = useMemo(() => {
    const gefiltert = epoche === 'alle' ? sets : sets.filter((s) => s.series === epoche);
    const kopie = [...gefiltert];

    // Ungemessene Sets wandern bei datengetriebenen Sortierungen ans ENDE.
    // Sie mit 0 einzusortieren wäre eine Behauptung: „bewegt sich nicht" ist
    // etwas anderes als „nicht gemessen".
    const hinten = (wert: number | null) => (wert === null ? 1 : 0);

    switch (sortierung) {
      case 'bewegung':
        return kopie.sort(
          (a, b) => hinten(a.trend) - hinten(b.trend) || (b.trend ?? 0) - (a.trend ?? 0),
        );
      case 'preis':
        return kopie.sort(
          (a, b) => hinten(a.median) - hinten(b.median) || (b.median ?? 0) - (a.median ?? 0),
        );
      case 'umfang':
        return kopie.sort((a, b) => b.total - a.total);
      default:
        return kopie.sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
    }
  }, [sets, epoche, sortierung]);

  const gemessene = sichtbar.filter((s) => s.trend !== null).length;

  return (
    <>
      {/* Steuerung: zwei Zeilen Text, keine Kachelleiste. Filter, die aussehen
          wie Schaltflächen einer Werkzeugleiste, ziehen mehr Aufmerksamkeit auf
          sich als der Inhalt, den sie filtern. */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3 border-b border-[#1c1c24] pb-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={SECTION_LABEL}>Epoche</span>
          <button
            type="button"
            onClick={() => setEpoche('alle')}
            className={`min-h-[32px] text-[12px] transition-colors ${
              epoche === 'alle' ? 'text-slate-100 underline underline-offset-4' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Alle
          </button>
          {epochen.map(([name, anzahl]) => (
            <button
              key={name}
              type="button"
              onClick={() => setEpoche(name)}
              className={`min-h-[32px] text-[12px] transition-colors ${
                epoche === name ? 'text-slate-100 underline underline-offset-4' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {name} <span className="tabular-nums text-slate-700">{anzahl}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={SECTION_LABEL}>Sortierung</span>
          {SORTIERUNGEN.map(([wert, beschriftung]) => (
            <button
              key={wert}
              type="button"
              onClick={() => setSortierung(wert)}
              className={`min-h-[32px] text-[12px] transition-colors ${
                sortierung === wert ? 'text-slate-100 underline underline-offset-4' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {beschriftung}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[11px] tabular-nums text-slate-600">
        {sichtbar.length} Sets · {gemessene} mit gemessener Bewegung
      </p>

      <div className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {sichtbar.map((set) => (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className={`group flex flex-col ${TABLE.row} py-5`}
          >
            {/* Das Logo ist der Blickfang dieser Seite — größer als in der
                Marktübersicht, weil hier das Set die Einheit ist, nicht die
                Karte. */}
            <div className="flex h-24 items-center justify-start">
              <BoosterPackImage
                setCode={set.id}
                setName={set.name}
                logoUrl={set.logoUrl}
                className="max-h-20 w-auto max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-[1.04]"
              />
            </div>

            <p className="mt-4 truncate text-[15px] text-slate-200 group-hover:text-white">
              {set.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-600">
              {[set.series, datum(set.releaseDate), set.total > 0 ? `${set.total} Karten` : '']
                .filter(Boolean)
                .join(' · ')}
            </p>

            {/* Marktzeile. Steht NUR, wenn wirklich gemessen — sonst ein
                Strich mit dem Grund daneben. */}
            <div className="mt-3 flex items-baseline gap-x-4 border-t border-[#1c1c24]/60 pt-2.5">
              <span className={`${NUM.row} font-semibold ${toneClass(set.trend)}`}>
                {set.trend === null ? '—' : formatPercent(set.trend)}
              </span>
              <span className={`${NUM.small} text-slate-500`}>
                {set.median === null ? '' : formatEur(set.median)}
              </span>
              {/* DREI ZUSTÄNDE, nicht zwei.
                  Die erste Fassung schrieb bei fehlendem Trend „keine
                  Stichprobe" — und stellte damit neben einen gemessenen
                  Medianpreis die Behauptung, es gebe keine Messung. Ein Set
                  kann sehr wohl eine Stichprobe haben und trotzdem keine
                  gemessene BEWEGUNG: Preise sind vorhanden, aber keine Karte
                  hat einen belastbaren 30-Tage-Vergleich. */}
              <span className="ml-auto text-[10px] tabular-nums text-slate-700">
                {set.gemessen === 0
                  ? 'keine Stichprobe'
                  : set.trend === null
                    ? `${set.gemessen} Karten · Bewegung nicht gemessen`
                    : `${set.gemessen} Karten`}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
