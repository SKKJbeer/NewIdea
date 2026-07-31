'use client';

import { useState } from 'react';
import { Info, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatEur, formatPercent } from '@/lib/format';
import type { PerformanceWindow, CardMarketStats, PmiScore } from '@/lib/card-metrics';
import { useInView, EASE_OUT } from '@/lib/use-in-view';

// BAUSTEINE DER KARTEN-DETAILSEITE
//
// Alle drei zeigen ausschließlich Werte, die aus der echten Preisreihe
// stammen. Fehlt die Datengrundlage, erscheint der Baustein gar nicht — statt
// einer Null, die wie eine Messung aussieht.

// ── Wertentwicklung über mehrere Zeiträume ─────────────────────────────────

export function PerformanceStrip({ windows }: { windows: PerformanceWindow[] }) {
  if (windows.length === 0) return null;

  return (
    <div className="border-t border-[#1c1c24] pt-5">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Wertentwicklung
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {windows.map((w) => {
          const up = w.changePct > 0;
          const flach = w.changePct === 0;
          const farbe = flach ? 'text-slate-400' : up ? 'text-emerald-400' : 'text-rose-400';
          return (
            <div
              key={w.label}
              className="rounded-md border border-[#2a2a3a] bg-[#0f0f17] px-2 py-2.5 text-center"
              title={`Gegen ${formatEur(w.fromPrice)} am ${w.fromDate}`}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{w.label}</p>
              <p className={`mt-1 text-xs font-black tabular-nums ${farbe}`}>
                {formatPercent(w.changePct)}
              </p>
            </div>
          );
        })}
      </div>
      {/* Nur Zeiträume mit echter Messung erscheinen — deshalb kann diese
          Reihe kürzer sein als fünf Felder. */}
      <p className="mt-2.5 text-[10px] text-slate-600">
        Nur Zeiträume mit vorliegendem Messpunkt. Bezug ist jeweils der Preis am Anfang des Zeitraums.
      </p>
    </div>
  );
}

// ── Marktkennzahlen ────────────────────────────────────────────────────────

function Kennzahl({ label, wert, zusatz }: { label: string; wert: string; zusatz?: string }) {
  return (
    <div className="rounded-md border border-[#2a2a3a] bg-[#0f0f17] p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{label}</p>
      <p className="mt-1 text-sm font-black tabular-nums text-slate-100">{wert}</p>
      {zusatz && <p className="mt-0.5 text-[10px] text-slate-600">{zusatz}</p>}
    </div>
  );
}

export function MarketStatsPanel({ stats }: { stats: CardMarketStats }) {
  const hatEtwas = stats.ath || stats.high30 || stats.volatilityPct !== null;
  if (!hatEtwas) return null;

  return (
    <div className="border-t border-[#1c1c24] pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Marktkennzahlen
        </p>
        <p className="text-[10px] tabular-nums text-slate-600">{stats.points} Messpunkte</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.ath && (
          <>
            {/* Bewusst „Höchstwert der Reihe" statt „Allzeithoch": Die
                Datenbasis reicht nicht weiter zurück als die Reihe. */}
            <Kennzahl
              label="Höchstwert der Reihe"
              wert={formatEur(stats.ath.price)}
              zusatz={stats.ath.date}
            />
            <Kennzahl
              label="Abstand dazu"
              wert={formatPercent(stats.ath.distancePct)}
              zusatz="aktueller Preis gegen Höchstwert"
            />
          </>
        )}
        {stats.high30 !== null && stats.low30 !== null && (
          <>
            <Kennzahl label="30 Tage Hoch" wert={formatEur(stats.high30)} />
            <Kennzahl label="30 Tage Tief" wert={formatEur(stats.low30)} />
          </>
        )}
        {stats.volatilityPct !== null && (
          <Kennzahl
            label="Schwankungsbreite"
            wert={formatPercent(stats.volatilityPct, { withSign: false })}
            zusatz="mittlere Tagesbewegung"
          />
        )}
      </div>
    </div>
  );
}

// ── Markt-Score ──────────────────────────────────────────────────────────────

export function PmiScorePanel({ score }: { score: PmiScore }) {
  const [offen, setOffen] = useState(false);
  const [ref, sichtbar] = useInView<HTMLDivElement>();

  if (!score.sufficient) {
    return (
      <div className="border-t border-[#1c1c24] pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Markt-Score</p>
        <p className="mt-2 text-sm text-slate-500">
          Für diese Karte liegen noch zu wenige Messpunkte vor. Der Score erscheint, sobald die
          Preisreihe dichter ist.
        </p>
      </div>
    );
  }

  const farbe =
    score.total >= 70 ? 'text-emerald-400' : score.total >= 45 ? 'text-amber-400' : 'text-rose-400';
  const balken =
    score.total >= 70
      ? 'from-emerald-600 to-emerald-300'
      : score.total >= 45
        ? 'from-amber-600 to-amber-300'
        : 'from-rose-600 to-rose-300';

  return (
    <div ref={ref} className="border-t border-[#1c1c24] pt-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Markt-Score</p>
          <p className={`mt-1 text-2xl font-black leading-none tabular-nums ${farbe}`}>
            {score.total}
            <span className="text-sm text-slate-600"> / 100</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOffen(true)}
          className="-m-2 flex items-center gap-1 p-2 text-[10px] font-semibold text-slate-500 transition-colors hover:text-violet-400"
          aria-label="Wie entsteht dieser Score?"
        >
          Erklärung <Info size={11} />
        </button>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#0c0c14] ring-1 ring-inset ring-white/[0.05]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${balken}`}
          style={{ width: sichtbar ? `${score.total}%` : '0%', transition: `width 1000ms ${EASE_OUT}` }}
        />
      </div>

      <div className="space-y-2">
        {score.factors.map((f, i) => (
          <div key={f.label} className="flex items-center gap-2.5">
            <span className="w-[76px] shrink-0 text-[10px] text-slate-500">{f.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0c0c14]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-300"
                style={{
                  width: sichtbar ? `${f.value}%` : '0%',
                  transition: `width 900ms ${EASE_OUT} ${i * 80}ms`,
                }}
              />
            </div>
            <span className="w-7 shrink-0 text-right text-[10px] font-bold tabular-nums text-slate-400">
              {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* Pflichthinweis: Der Score ist eine Marktkennzahl, keine Empfehlung.
          Die frühere Fassung schrieb „Starkes Investment" bzw. „Vorsicht
          geboten" — das sind Handlungsempfehlungen. */}
      <p className="mt-3 border-t border-[#1e1e30] pt-2.5 text-[10px] leading-relaxed text-slate-600">
        Der Markt-Score ist eine datenbasierte Marktkennzahl und keine Anlageberatung.
      </p>

      {offen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setOffen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Berechnung des Markt-Score"
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto border-t border-[#1c1c24] pt-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Wie entsteht dieser Score?
                </p>
                <p className={`mt-1 text-xl font-black ${farbe}`}>{score.total} / 100</p>
              </div>
              <button
                type="button"
                onClick={() => setOffen(false)}
                className="-m-2 p-2 text-slate-500 hover:text-slate-300"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {score.factors.map((f) => (
                <div key={f.label} className="rounded-md border border-[#2a2a3a] bg-[#0f0f17] p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{f.label}</span>
                    <span className="text-xs tabular-nums text-slate-400">{f.value} / 100</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">{f.detail}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 border-t border-[#1e1e30] pt-3 text-[11px] leading-relaxed text-slate-500">
              Der Gesamtwert ist der Mittelwert der vier Faktoren. Alle stammen aus der echten
              Preisreihe dieser Karte. Der Preis selbst fließt bewusst NICHT ein — teuer bedeutet
              nicht besser.
            </p>
            <a
              href="/methodik"
              className="mt-3 inline-block text-[11px] font-semibold text-violet-400 hover:text-violet-300"
            >
              Vollständige Methodik ansehen →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/** Kleiner Richtungspfeil für Trendwerte — eine Stelle für alle Panels. */
export function TrendIcon({ value, size = 14 }: { value: number; size?: number }) {
  if (value > 0) return <TrendingUp size={size} className="text-emerald-400" />;
  if (value < 0) return <TrendingDown size={size} className="text-rose-400" />;
  return <Minus size={size} className="text-slate-500" />;
}
