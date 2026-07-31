import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PokemonCard } from '@/types';
import type { SetRank } from '@/lib/market-metrics';
import { MIN_SET_SAMPLE } from '@/lib/market-metrics';
import { displayPrice } from '@/lib/pokemon-api';
import { cachedImg } from '@/lib/cached-image';
import { formatEur, formatPercent } from '@/lib/format';
import { SECTION_LABEL, SECTION_NUM, TABLE, NUM, THUMB, toneClass, barClass } from '@/lib/ui';
import type { BriefSatz } from '@/lib/market-brief';

// DIE DREI DATENMODULE DER STARTSEITE
//
// Vorher standen dort vier Abschnitte, die weitgehend dieselben Karten zeigten:
// ein laufender Ticker, „Top Gewinner", „Top Verlierer" und eine
// Trending-Tabelle. Dieselbe Karte konnte in dreien davon auftauchen. Das ist
// keine Marktübersicht, sondern eine Wiederholung mit anderer Überschrift.
//
// Jetzt: EIN Modul je Frage.
//   Bewegungen — was hat sich am stärksten bewegt?
//   Set-Markt  — wo bewegt sich ein ganzes Set?
//   Brief      — was heißt das zusammengenommen?

/** Abschnittskopf mit Nummer. Gibt der Seite eine Leserichtung. */
export function SectionHead({
  num,
  title,
  meta,
  href,
  hrefLabel,
}: {
  num: string;
  title: string;
  meta?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[#1c1c24] pb-3">
      <span className={SECTION_NUM}>{num}</span>
      <h2 className={SECTION_LABEL}>{title}</h2>
      {meta && <span className="text-[11px] tabular-nums text-slate-600">{meta}</span>}
      {href && (
        <Link
          href={href}
          className="ml-auto inline-flex min-h-[32px] items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-slate-200"
        >
          {hrefLabel ?? 'Alle anzeigen'}
          <ArrowRight size={11} />
        </Link>
      )}
    </div>
  );
}

// ── Marktkommentar ──────────────────────────────────────────────────────────

export function MarketBriefBlock({ saetze }: { saetze: BriefSatz[] }) {
  return (
    <div className="mt-5 max-w-3xl space-y-4">
      {saetze.map((s, i) => (
        <p key={i} className="text-[15px] leading-relaxed text-slate-300">
          {s.text}{' '}
          {/* Der Beleg steht IM Satz, nicht in einer Fußnote: Eine Aussage und
              die Zahl, auf der sie beruht, gehören zusammen. */}
          {/* Klammern NUR setzen, wenn der Beleg nicht schon welche mitbringt.
              Sonst stand da „(32 % im Plus (66 von 204))" — eine doppelte
              Klammer mitten im wichtigsten Absatz der Startseite. */}
          <span className="whitespace-nowrap text-[12px] tabular-nums text-slate-600">
            {s.beleg.includes('(') ? s.beleg : `(${s.beleg})`}
          </span>
        </p>
      ))}
    </div>
  );
}

// ── Bewegungen ──────────────────────────────────────────────────────────────

function MoverRow({ card }: { card: PokemonCard }) {
  const trend = card.trendPercent;
  const preis = displayPrice(card);

  return (
    <Link
      href={`/karten/${card.id}`}
      className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-1 ${TABLE.row} ${TABLE.cell}`}
    >
      {/* Kartenbild als Miniatur — es identifiziert die Zeile, es füllt sie
          nicht. Große Kartenkacheln machen aus Marktdaten einen Katalog. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cachedImg(card.imageUrl)}
        alt=""
        loading="lazy"
        className={THUMB}
      />
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-slate-200">
          {card.nameDe ?? card.name}
        </span>
        <span className="block truncate text-[11px] text-slate-600">
          {card.set}
          {card.number ? ` · ${card.number}` : ''}
        </span>
      </span>
      <span className={`${NUM.row} w-20 text-right text-slate-400`}>{formatEur(preis)}</span>
      <span className={`${NUM.row} w-20 text-right font-semibold ${toneClass(trend)}`}>
        {typeof trend === 'number' ? formatPercent(trend) : '—'}
      </span>
    </Link>
  );
}

export function MarketMovers({
  gainers,
  losers,
}: {
  gainers: PokemonCard[];
  losers: PokemonCard[];
}) {
  if (gainers.length === 0 && losers.length === 0) return null;

  return (
    <div className="mt-5 grid gap-x-10 gap-y-8 md:grid-cols-2">
      <div>
        <div className={`${TABLE.head} flex items-center justify-between border-b border-[#1c1c24] pb-2`}>
          <span>Gewinner</span>
          <span className="tabular-nums">30 T</span>
        </div>
        {gainers.length > 0 ? (
          gainers.map((c) => <MoverRow key={c.id} card={c} />)
        ) : (
          <p className="py-4 text-[12px] text-slate-600">Keine gemessene Aufwärtsbewegung.</p>
        )}
      </div>

      <div>
        <div className={`${TABLE.head} flex items-center justify-between border-b border-[#1c1c24] pb-2`}>
          <span>Verlierer</span>
          <span className="tabular-nums">30 T</span>
        </div>
        {losers.length > 0 ? (
          losers.map((c) => <MoverRow key={c.id} card={c} />)
        ) : (
          <p className="py-4 text-[12px] text-slate-600">Keine gemessene Abwärtsbewegung.</p>
        )}
      </div>
    </div>
  );
}

// ── Set-Markt ───────────────────────────────────────────────────────────────

/**
 * Sets nach Bewegung, nicht nach Preis.
 *
 * Die Vorgängerfassung sortierte die Set-Liste nach Preis — das beantwortet
 * „welches Set ist teuer", nicht „wo bewegt sich etwas". Für eine
 * Marktübersicht ist Letzteres die Frage.
 *
 * Der Balken sitzt auf einer gemeinsamen Mittellinie: Ausschläge nach links
 * und rechts sind unmittelbar vergleichbar, ohne dass man Zahlen lesen muss.
 * Gelesen werden müssen sie trotzdem — deshalb steht jeder Wert daneben, und
 * die Richtung hängt nie allein an der Farbe.
 */
export function SetMarket({ sets }: { sets: SetRank[] }) {
  if (sets.length === 0) {
    return (
      <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-slate-500">
        Noch kein belastbares Set-Bild. Ein Set erscheint hier ab{' '}
        {MIN_SET_SAMPLE} auswertbaren Karten — darunter beschreibt ein Mittelwert
        einzelne Karten, nicht das Set.
      </p>
    );
  }

  // Sets ohne gemessene Karte stehen hinten und tragen einen Gedankenstrich —
  // nicht 0,0 %. „Nicht gemessen" ist keine Nullbewegung.
  const nachBewegung = [...sets].sort((a, b) => {
    if (a.avgTrend === null) return 1;
    if (b.avgTrend === null) return -1;
    return b.avgTrend - a.avgTrend;
  });
  const maxAusschlag = Math.max(
    ...nachBewegung.map((s) => Math.abs(s.avgTrend ?? 0)),
    1,
  );

  return (
    <div className="mt-5">
      <div className={`${TABLE.head} grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#1c1c24] pb-2`}>
        <span>Set</span>
        <span className="w-16 text-right">Median</span>
        <span className="w-16 text-right">30 T</span>
      </div>

      {nachBewegung.map((s) => {
        const gemessen = s.avgTrend !== null;
        const anteil = (Math.abs(s.avgTrend ?? 0) / maxAusschlag) * 50;
        const positiv = (s.avgTrend ?? 0) > 0;
        return (
          <Link
            key={s.code}
            href={`/sets/${s.code}`}
            className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-1 ${TABLE.row} ${TABLE.cell}`}
          >
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="truncate text-[13px] text-slate-200">{s.name}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-600">
                  {s.count} Karten
                </span>
              </span>
              {/* Mittellinie bei 50 % — links negativ, rechts positiv. */}
              {gemessen && (
                <span className="mt-1.5 block h-[3px] w-full max-w-[240px] bg-[#14141a]" aria-hidden>
                  <span className="relative block h-full w-full">
                    <span
                      className={`absolute top-0 h-full ${barClass(s.avgTrend)}`}
                      style={{
                        left: positiv ? '50%' : `${50 - anteil}%`,
                        width: `${Math.max(anteil, 0.6)}%`,
                      }}
                    />
                  </span>
                </span>
              )}
            </span>
            <span className={`${NUM.row} w-16 text-right text-slate-400`}>
              {formatEur(s.medianPrice)}
            </span>
            <span className={`${NUM.row} w-16 text-right font-semibold ${toneClass(s.avgTrend)}`}>
              {gemessen ? formatPercent(s.avgTrend as number) : '—'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
