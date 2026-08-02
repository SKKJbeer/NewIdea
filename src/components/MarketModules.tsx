import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PokemonCard } from '@/types';
import type { SetRank } from '@/lib/market-metrics';
import { MIN_SET_SAMPLE } from '@/lib/market-metrics';
import { displayPrice } from '@/lib/pokemon-api';
import { CardThumb } from './CardThumb';
import { formatEur, formatPercent, formatPp } from '@/lib/format';
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

/**
 * Eine Bewegungszeile.
 *
 * DREI ENTSCHEIDUNGEN:
 *
 * 1. RANG. Ohne Nummer ist eine Liste eine Aufzählung; mit Nummer ist sie eine
 *    Rangfolge. Der Unterschied kostet nichts und beantwortet „wie weit oben
 *    steht das" ohne Zählen.
 *
 * 2. VERGLEICH ZUM INDEX in derselben Zeile. Das ist der Punkt, an dem sich
 *    CardBeacon von einer Preisliste unterscheidet: „+22,2 %" ist eine Zahl,
 *    „+22,4 Prozentpunkte über dem Markt" ist eine Aussage. Die Spalte steht
 *    NUR da, wenn beides gemessen ist — ohne Indexwert bleibt sie leer statt
 *    eine Null zu zeigen.
 *
 * 3. KEINE GROSSE KACHEL. Das Kartenbild identifiziert die Zeile, es füllt sie
 *    nicht. Große Kartenkacheln machen aus Marktdaten einen Katalog. Die
 *    Sammler-Ebene steckt hier im Detail: leichtes Anheben und der
 *    Folienschimmer auf Karten, die auch wirklich glänzen.
 */
function MoverRow({ card, rang, cbi }: { card: PokemonCard; rang: number; cbi: number | null }) {
  const trend = card.trendPercent;
  const preis = displayPrice(card);
  const gemessen = typeof trend === 'number';
  // Prozentpunkte, nicht Prozent: Die Differenz zweier Prozentwerte ist kein
  // Prozentwert. Wer das vermischt, rechnet falsch und merkt es nie.
  const gegenMarkt = gemessen && cbi !== null ? trend - cbi : null;

  return (
    <Link
      href={`/karten/${card.id}`}
      className={`group grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 gap-y-1 px-1 sm:grid-cols-[auto_auto_1fr_auto_auto_auto] ${TABLE.row} ${TABLE.cell}`}
    >
      <span className="w-4 text-[10px] font-mono tabular-nums text-slate-700">
        {String(rang).padStart(2, '0')}
      </span>

      <span className="lift foil block shrink-0 overflow-hidden rounded-[3px]">
        <CardThumb src={card.imageUrl} width={26} height={36} className={THUMB} />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[13px] text-slate-200">
          {card.nameDe ?? card.name}
        </span>
        <span className="block truncate text-[11px] text-slate-600">
          {card.set}
          {card.number ? ` · ${card.number}` : ''}
          {/* Auf dem Telefon gibt es keine eigene Preisspalte — der Preis
              rückt in die zweite Zeile, statt die Namen auf acht Zeichen zu
              stauchen. */}
          <span className="sm:hidden"> · {formatEur(preis)}</span>
        </span>
      </span>

      <span className={`${NUM.row} hidden w-20 text-right text-slate-400 sm:block`}>
        {formatEur(preis)}
      </span>
      <span className={`${NUM.row} w-[68px] text-right font-semibold ${toneClass(trend)}`}>
        {gemessen ? formatPercent(trend) : '—'}
      </span>
      <span
        className={`${NUM.small} hidden w-[76px] text-right sm:block ${
          gegenMarkt === null ? 'text-slate-700' : 'text-slate-500'
        }`}
        title={gegenMarkt === null ? undefined : 'Abstand zum CardBeacon Index in Prozentpunkten'}
      >
        {gegenMarkt === null ? '—' : formatPp(gegenMarkt)}
      </span>
    </Link>
  );
}

export function MarketMovers({
  gainers,
  losers,
  cbi = null,
}: {
  gainers: PokemonCard[];
  losers: PokemonCard[];
  /** Indexwert für die Spalte „gegen Markt". `null` = kein belastbarer Wert. */
  cbi?: number | null;
}) {
  if (gainers.length === 0 && losers.length === 0) return null;

  const kopf = (
    <>
      <span className="hidden w-20 text-right sm:block">Preis</span>
      <span className="w-[68px] text-right tabular-nums">30 T</span>
      <span className="hidden w-[76px] text-right sm:block">vs. Markt</span>
    </>
  );

  return (
    /* ZWEISPALTIG ERST AB `lg`, NICHT AB `md`.
       Bei genau 768 px greift `md`, und dann muss eine Zeile aus Rang, Bild,
       Name, Preis, 30 T und „vs. Markt" in 340 px passen. Die drei Zahlenspalten
       haben feste Breiten, also schob die letzte 39 px über den Rand hinaus —
       die ganze Seite ließ sich waagerecht schieben. Ab 1024 px ist der Platz
       da; darunter steht eine Liste unter der anderen. */
    <div className="mt-5 grid gap-x-10 gap-y-8 lg:grid-cols-2">
      {[
        ['Gewinner', gainers, 'Keine gemessene Aufwärtsbewegung.'] as const,
        ['Verlierer', losers, 'Keine gemessene Abwärtsbewegung.'] as const,
      ].map(([titel, karten, leer]) => (
        <div key={titel}>
          <div
            className={`${TABLE.head} grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 border-b border-[#1c1c24] px-1 pb-2 sm:grid-cols-[auto_auto_1fr_auto_auto_auto]`}
          >
            <span className="w-4" />
            <span className="w-[26px]" />
            <span className="min-w-0 truncate">{titel}</span>
            {kopf}
          </div>
          {karten.length > 0 ? (
            karten.map((c, i) => <MoverRow key={c.id} card={c} rang={i + 1} cbi={cbi} />)
          ) : (
            <p className="py-4 text-[12px] text-slate-600">{leer}</p>
          )}
        </div>
      ))}
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
export function SetMarket({ sets, cbi = null }: { sets: SetRank[]; cbi?: number | null }) {
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
      <div className={`${TABLE.head} grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#1c1c24] pb-2 sm:grid-cols-[1fr_auto_auto_auto]`}>
        <span>Set</span>
        <span className="w-16 text-right">Median</span>
        <span className="w-16 text-right">30 T</span>
        <span className="hidden w-[76px] text-right sm:block">vs. Markt</span>
      </div>

      {nachBewegung.map((s) => {
        const gemessen = s.avgTrend !== null;
        const anteil = (Math.abs(s.avgTrend ?? 0) / maxAusschlag) * 50;
        const positiv = (s.avgTrend ?? 0) > 0;
        // Derselbe Maßstab wie bei Karten und in der Suche: Prozentpunkte
        // gegen den Index, und nur wenn beide Seiten gemessen sind.
        const gegenMarkt = gemessen && cbi !== null ? (s.avgTrend as number) - cbi : null;
        return (
          <Link
            key={s.code}
            href={`/sets/${s.code}`}
            className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-1 sm:grid-cols-[1fr_auto_auto_auto] ${TABLE.row} ${TABLE.cell}`}
          >
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="truncate text-[13px] text-slate-200">{s.name}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-600">
                  {s.count} Karten
                </span>
              </span>
              {/* DIE TRAGENDE KARTE.
                  Eine Set-Zeile lässt sonst die wichtigste Frage offen: Bewegt
                  sich das ganze Set oder eine einzelne Karte? Bewusst als
                  Textzeile und nicht beim Überfahren — auf einem Telefon gibt
                  es kein Überfahren, und eine Auskunft, die dort fehlt, ist
                  keine Auskunft. */}
              {s.topMover && (
                <span className="mt-0.5 block truncate text-[11px] text-slate-600">
                  stärkste Bewegung: {s.topMover.name}{' '}
                  <span className={`tabular-nums ${toneClass(s.topMover.trend)}`}>
                    {formatPercent(s.topMover.trend)}
                  </span>
                </span>
              )}
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
            <span
              className={`${NUM.small} hidden w-[76px] text-right sm:block ${
                gegenMarkt === null ? 'text-slate-700' : 'text-slate-500'
              }`}
              title={gegenMarkt === null ? undefined : 'Abstand zum CardBeacon Index in Prozentpunkten'}
            >
              {gegenMarkt === null ? '—' : formatPp(gegenMarkt)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
