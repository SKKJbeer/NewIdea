'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import type { FearGreedResult } from '@/lib/market-metrics';
import { useInView, EASE_OUT } from '@/lib/use-in-view';

// ANGST & GIER — mit offengelegter Rechnung.
//
// ANLASS: Der Wert entstand aus einer Formel, die nirgends stand. Ein
// Stimmungsindikator, den niemand nachrechnen kann, ist eine Behauptung —
// besonders auf einer Seite, die Marktvertrauen aufbauen soll. Über den
// Info-Knopf sind jetzt alle drei Teilwerte, ihre Gewichte und ihre Herkunft
// einsehbar; die Summe ergibt exakt den angezeigten Wert.

/**
 * Farbe der Markttemperatur — KALT bis HEISS, nicht schlecht bis gut.
 *
 * Vorher lief die Skala von Rot über Gelb nach Grün. Damit stand da eine
 * Bewertung: unten schlecht, oben gut. Ein ruhiger Markt ist aber nicht
 * schlechter als ein heißer — für jemanden, der kaufen will, ist er sogar der
 * angenehmere. Die Seite gibt keine Kaufempfehlungen, also darf auch die Farbe
 * keine geben.
 *
 * Die neue Skala ist eine Temperaturskala: Blau (kalt) über Grau (ruhig) nach
 * Orange (heiß). Sie sagt, wie viel los ist, und überlässt die Bewertung dem
 * Leser. Grün und Rot bleiben ausschließlich der Richtung von Preisen
 * vorbehalten — sonst bedeuten dieselben zwei Farben auf einer Seite zweierlei.
 */
function farbeZu(value: number): string {
  if (value >= 75) return '#fb923c';
  if (value >= 60) return '#fcd34d';
  if (value >= 40) return '#94a3b8';
  if (value >= 25) return '#7dd3fc';
  return '#38bdf8';
}

export function FearGreedPanel({ result }: { result: FearGreedResult }) {
  const [offen, setOffen] = useState(false);
  const [ref, sichtbar] = useInView<HTMLDivElement>();

  if (!result.sufficient) {
    return (
      <div>
        <p className="text-lg font-black leading-tight text-slate-500">—</p>
        <p className="mt-1.5 text-[10px] leading-snug text-slate-600">
          Noch nicht genügend Marktdaten für eine belastbare Temperatur.
        </p>
      </div>
    );
  }

  const farbe = farbeZu(result.value);

  return (
    <div ref={ref}>
      <div className="mb-1 flex items-end justify-between gap-1">
        <span className="text-2xl font-black leading-none tabular-nums" style={{ color: farbe }}>
          {result.value}
        </span>
        <button
          type="button"
          onClick={() => setOffen(true)}
          className="-m-2 flex items-center gap-1 p-2 text-[10px] font-semibold text-slate-500 transition-colors hover:text-violet-400"
          aria-label="Wie wird dieser Wert berechnet?"
        >
          <span style={{ color: farbe }}>{result.label}</span>
          <Info size={11} />
        </button>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#0c0c14] ring-1 ring-inset ring-white/[0.05]">
        <div
          className="h-full rounded-full"
          style={{
            width: sichtbar ? `${result.value}%` : '0%',
            transition: `width 1000ms ${EASE_OUT}`,
            background: 'linear-gradient(to right, #38bdf8, #94a3b8, #fb923c)',
          }}
        />
      </div>

      {offen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setOffen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Berechnung der Markttemperatur"
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Wie wird dieser Wert berechnet?
                </p>
                <p className="mt-1 text-xl font-black" style={{ color: farbe }}>
                  {result.value} · {result.label}
                </p>
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
              {result.components.map((k) => (
                <div key={k.label} className="rounded-xl border border-[#2a2a3a] bg-[#0f0f17] p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{k.label}</span>
                    <span className="text-xs tabular-nums text-slate-400">
                      {Math.round(k.score)} / 100 · Gewicht {Math.round(k.weight * 100)} %
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#0c0c14]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-300"
                      style={{ width: `${Math.min(100, Math.max(0, k.score))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-slate-500">{k.detail}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 border-t border-[#1e1e30] pt-3 text-[11px] leading-relaxed text-slate-500">
              Der Wert ist die gewichtete Summe der drei Teilwerte. Er beschreibt die aktuelle
              Marktlage im ausgewerteten Datensatz und ist keine Anlageberatung.
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
