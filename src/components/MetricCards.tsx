import { Activity, Thermometer, Layers, LibraryBig } from 'lucide-react';
import type { Breadth, FearGreedResult, PmiResult } from '@/lib/market-metrics';
import type { DataCoverage } from '@/lib/data-coverage';

// DIE VIER KENNZAHL-KARTEN — nach der gelieferten Vorlage.
//
// AUFBAU JE KARTE, wie in der Vorlage: Symbolkachel links oben, Bezeichnung
// daneben, grosser Wert darunter, ein erklaerender Halbsatz, und ganz unten
// eine Mikro-Darstellung, die JE KARTE ANDERS ist.
//
// Der letzte Punkt ist der eigentliche: Vier identisch aufgebaute Kacheln
// nebeneinander sind der Grund, warum ein Dashboard wie jedes andere aussieht.
// Jede Darstellung hier wiederholt den Wert der eigenen Karte in einer Form,
// die zu genau diesem Wert passt — ein Anteil als Punktreihe, eine Temperatur
// als Position auf einer Skala, eine Abdeckung als Fortschritt, ein Bestand
// als Welle.
//
// KEINE ERFUNDENEN WERTE: Wo eine Kennzahl nicht gemessen ist, steht ein
// Strich und die Mikro-Darstellung entfaellt. Eine Grafik ohne Datengrundlage
// ist eine Behauptung (Stolperstelle 29).

function Karte({
  icon,
  ton,
  label,
  wert,
  unter,
  children,
}: {
  icon: React.ReactNode;
  ton: string;
  label: string;
  wert: React.ReactNode;
  unter: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-frame group relative overflow-hidden rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-md transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:p-5">
      {/* Lichtkante oben — dieselbe Behandlung wie am CBI-Panel, damit die
          Karten zu ihm gehoeren. */}
      <div
        aria-hidden
        className="absolute inset-x-5 top-0 h-px opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(190,180,255,0.34), transparent)' }}
      />
      {/* Lichtwisch beim Ueberfahren. Einmalig, sehr schwach — die Vorlage
          verlangt „tiny elevation, soft reflection", keine Spielerei. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'linear-gradient(112deg, transparent 38%, rgba(255,255,255,0.05) 50%, transparent 62%)' }}
      />

      <div className="relative flex items-start gap-3.5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-white/[0.08] ${ton}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.11em] text-slate-400">{label}</p>
          <p className="mt-1 text-[26px] font-semibold leading-none tracking-tight text-white sm:text-[30px]">
            {wert}
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-slate-500">{unter}</p>
        </div>
      </div>

      {children && <div className="relative mt-4">{children}</div>}
    </div>
  );
}

export function MetricCards({
  breite,
  stimmung,
  abdeckung,
  cbi,
}: {
  breite: Breadth;
  stimmung: FearGreedResult;
  abdeckung: DataCoverage | null;
  cbi: PmiResult;
}) {
  // Abdeckung: Anteil der Stichprobe am erfassten Bestand. Ohne Bestandszahl
  // gibt es keinen Anteil — dann steht dort ein Strich, kein geschaetzter Wert.
  const abdeckungPct =
    abdeckung && abdeckung.cards > 0
      ? Math.min(Math.round((cbi.cardCount / abdeckung.cards) * 100), 100)
      : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1 — MARKTBREITE. Punktreihe: je ein Punkt fuer ein Fuenfzigstel,
             gefuellt bis zum Anteil im Plus. Ein Anteil, den man abzaehlen
             kann, statt eines Balkens, den man schaetzen muss. */}
      <Karte
        icon={<Activity size={19} className="text-violet-300" />}
        ton="bg-violet-500/10"
        label="Marktbreite"
        wert={breite.total > 0 ? `${Math.round(breite.pct)} %` : '—'}
        unter={breite.total > 0 ? 'der Karten im Plus' : 'keine Messung'}
      >
        {breite.total > 0 && (
          <div className="flex flex-wrap gap-[3px]" aria-hidden>
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className={`h-[5px] w-[5px] rounded-full ${
                  i < Math.round((breite.pct / 100) * 40) ? 'bg-violet-400' : 'bg-white/[0.09]'
                }`}
              />
            ))}
          </div>
        )}
      </Karte>

      {/* 2 — MARKTTEMPERATUR. Position auf einer Skala von kalt nach heiss.
             Kein Balken von null an: Der Wert ist ein STAND zwischen 0 und
             100, keine Menge. */}
      <Karte
        icon={<Thermometer size={19} className="text-sky-300" />}
        ton="bg-sky-500/10"
        label="Markttemperatur"
        wert={stimmung.sufficient ? stimmung.value : '—'}
        unter={
          stimmung.sufficient ? (
            <span className="text-sky-300/90">{stimmung.label}</span>
          ) : (
            'keine Messung'
          )
        }
      >
        {stimmung.sufficient && (
          <div aria-hidden>
            <div
              className="relative h-[6px] rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, rgb(56 189 248), rgb(94 234 212), rgb(250 204 21), rgb(251 146 60), rgb(244 63 94))',
              }}
            >
              <span
                className="absolute -top-[3px] h-3 w-[3px] rounded-full bg-violet-100 shadow-[0_0_6px_rgba(221,214,254,0.85)]"
                style={{ left: `calc(${Math.min(Math.max(stimmung.value, 0), 100)}% - 1.5px)` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] uppercase tracking-wider text-slate-600">
              <span>Kalt</span>
              <span>Mild</span>
              <span>Heiß</span>
            </div>
          </div>
        )}
      </Karte>

      {/* 3 — ABDECKUNG. Fortschritt: Wie viel des erfassten Bestands geht in
             die Kennzahlen ein? Das ist der ehrlichste Wert der Seite, weil er
             die Grenze der eigenen Aussage benennt. */}
      <Karte
        icon={<Layers size={19} className="text-fuchsia-300" />}
        ton="bg-fuchsia-500/10"
        label="Abdeckung"
        wert={abdeckungPct !== null ? `${abdeckungPct} %` : '—'}
        unter={
          abdeckungPct !== null ? 'des erfassten Bestands ausgewertet' : 'Bestand noch nicht ermittelt'
        }
      >
        {abdeckungPct !== null && (
          <div className="h-[6px] overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{
                width: `${abdeckungPct}%`,
                background: 'linear-gradient(90deg, rgb(167 139 250), rgb(232 121 249))',
              }}
            />
          </div>
        )}
      </Karte>

      {/* 4 — BESTAND. Welle aus den tatsaechlichen Set-Groessen waere ehrlicher,
             liegt hier aber nicht vor; deshalb eine ruhige Grundlinie als
             Materialflaeche und die ZAHLEN als Aussage. Keine Datenkurve, die
             keine ist. */}
      <Karte
        icon={<LibraryBig size={19} className="text-emerald-300" />}
        ton="bg-emerald-500/10"
        label="Beobachtete Karten"
        wert={abdeckung ? abdeckung.cards.toLocaleString('de-DE') : cbi.cardCount.toLocaleString('de-DE')}
        unter={
          abdeckung ? (
            <>
              {abdeckung.pricePoints.toLocaleString('de-DE')} Preispunkte
              {abdeckung.sets !== null && ` · ${abdeckung.sets.toLocaleString('de-DE')} Sets`}
            </>
          ) : (
            'in der laufenden Stichprobe'
          )
        }
      >
        <div className="h-[6px] overflow-hidden rounded-full" aria-hidden
          style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.35), rgba(56,189,248,0.25), rgba(167,139,250,0.3))' }}
        />
      </Karte>
    </div>
  );
}
