import Link from 'next/link';
import { ArrowRight, Search, FolderOpen, Briefcase, FileText, Image as ImageIcon } from 'lucide-react';
import type { PokemonCard } from '@/types';
import type { SetRank } from '@/lib/market-metrics';
import { displayPrice } from '@/lib/pokemon-api';
import { CardThumb } from '@/components/CardThumb';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { formatEur, formatPercent, formatPp } from '@/lib/format';
import { toneClass } from '@/lib/ui';

// DIE DREI PANELS UNTER DEN KENNZAHLEN — nach der gelieferten Vorlage.
//
// Gemeinsame Behandlung, damit sie als Reihe gelesen werden: dieselbe
// Eckenrundung, dieselbe Lichtkante oben, dieselbe halbdurchlaessige Flaeche.
// Unterschiedlich ist nur der INHALT — und genau so steht es in der Vorlage.

function Panel({
  titel,
  aktion,
  aktionHref,
  children,
  className = '',
}: {
  titel: string;
  aktion?: string;
  aktionHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-frame relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl ${className}`}>
      <div
        aria-hidden
        className="absolute inset-x-5 top-0 h-px opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(190,180,255,0.34), transparent)' }}
      />
      <div className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-7 sm:pt-7">
        <h3 className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-slate-400/80">{titel}</h3>
        {aktion && aktionHref && (
          <Link prefetch={false} href={aktionHref} className="shrink-0 text-[11px] text-violet-400 transition-colors hover:text-violet-300">
            {aktion}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

/** Stärkste Bewegungen — Rangnummer, Bild, Name, Bewegung, Abstand zum Index. */
export function MoversPanel({ karten, cbi }: { karten: PokemonCard[]; cbi: number | null }) {
  return (
    <Panel titel="Stärkste Bewegungen" aktion="Alle anzeigen" aktionHref="/suche">
      <div className="mt-4 px-3 pb-4 sm:px-4 sm:pb-5">
        {karten.length === 0 ? (
          <p className="px-2 py-6 text-[13px] text-slate-500">Keine gemessene Bewegung.</p>
        ) : (
          karten.map((c, i) => {
            const trend = c.trendPercent;
            const gemessen = typeof trend === 'number';
            const gegen = gemessen && cbi !== null ? trend - cbi : null;
            return (
              <Link prefetch={false}
                key={c.id}
                href={`/karten/${c.id}`}
                className="group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.035]"
              >
                <span className="w-6 shrink-0 text-[13px] font-mono tabular-nums text-slate-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="lift foil block shrink-0 overflow-hidden rounded-[4px]">
                  <CardThumb src={c.imageUrl} width={34} height={47} className="h-[47px] w-[34px] object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-slate-100 group-hover:text-white">
                    {c.nameDe ?? c.name}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">{c.set}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={`block text-[14px] font-semibold tabular-nums ${toneClass(trend)}`}>
                    {gemessen ? formatPercent(trend) : '—'}
                  </span>
                  <span className="block text-[10px] tabular-nums text-slate-600">
                    {gegen === null ? 'vs. CBI —' : `vs. CBI ${formatPp(gegen)}`}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </div>
    </Panel>
  );
}

/** Set-Markt — Logo, Name, Kartenzahl, tragende Karte, Median und Bewegung. */
export function SetMarketPanel({ sets }: { sets: SetRank[] }) {
  return (
    <Panel titel="Set-Markt im Überblick" aktion="Alle Sets" aktionHref="/sets">
      <div className="mt-4 px-3 pb-4 sm:px-4 sm:pb-5">
        {sets.length === 0 ? (
          <p className="px-2 py-6 text-[13px] text-slate-500">
            Noch kein belastbares Set-Bild — ein Set erscheint ab fünf auswertbaren Karten.
          </p>
        ) : (
          sets.map((s) => (
            <Link prefetch={false}
              key={s.code}
              href={`/sets/${s.code}`}
              className="group flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-white/[0.035]"
            >
              <span className="flex h-11 w-[62px] shrink-0 items-center justify-center">
                <BoosterPackImage
                  setCode={s.code}
                  setName={s.name}
                  className="max-h-9 w-auto max-w-full object-contain opacity-90"
                  platzhalter="wortmarke"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-slate-100 group-hover:text-white">{s.name}</span>
                <span className="block text-[11px] text-slate-500">{s.count} Karten</span>
                {/* Die tragende Karte beantwortet die Frage, die eine
                    Set-Zeile sonst offen laesst: bewegt sich das Set oder eine
                    einzelne Karte darin? */}
                {s.topMover && (
                  <span className="block truncate text-[10px] text-slate-600">
                    Stärkste: {s.topMover.name}{' '}
                    <span className={toneClass(s.topMover.trend)}>{formatPercent(s.topMover.trend)}</span>
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[10px] tabular-nums text-slate-600">
                  Median {s.medianPrice > 0 ? formatEur(s.medianPrice) : '—'}
                </span>
                <span className={`block text-[15px] font-semibold tabular-nums ${toneClass(s.avgTrend)}`}>
                  {s.avgTrend === null ? '—' : formatPercent(s.avgTrend)}
                </span>
                <span className="block text-[10px] text-slate-600">vs. 30 Tage</span>
              </span>
            </Link>
          ))
        )}
      </div>
    </Panel>
  );
}

/** Marktbericht-Hinweis mit dem Bild einer echten Karte aus der Stichprobe. */
export function ReportPromo({
  monat,
  titel,
  text,
  karte,
}: {
  monat: string;
  titel: string;
  text: string;
  karte: PokemonCard | null;
}) {
  return (
    <div className="card-frame relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-xl">
      <div
        aria-hidden
        className="absolute inset-x-5 top-0 h-px opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(190,180,255,0.34), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[18%] -top-[12%] h-[130%] w-[70%] rounded-full blur-[70px]"
        style={{ background: 'radial-gradient(closest-side, rgba(139,92,246,0.2), transparent)' }}
      />

      <div className="relative flex gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-violet-300/90">
            Marktbericht · {monat}
          </p>
          <h3 className="mt-4 text-[21px] font-semibold leading-[1.25] tracking-[-0.01em] text-white">{titel}</h3>
          <p className="mt-4 text-[13.5px] leading-[1.7] text-slate-400">{text}</p>
          <Link prefetch={false}
            href="/marktbericht"
            className="mt-7 inline-flex h-[46px] items-center gap-2 rounded-full border border-white/[0.11] bg-white/[0.05] px-6 text-[13.5px] font-medium text-slate-100 transition-all duration-300 hover:-translate-y-[1px] hover:border-violet-300/35 hover:bg-white/[0.09]"
          >
            Bericht lesen <ArrowRight size={14} />
          </Link>
        </div>

        {/* Das Kartenbild kommt aus der Stichprobe, die dem Bericht zugrunde
            liegt — es ist der Gegenstand der Auskunft, keine Dekoration. */}
        {karte?.imageUrl && (
          <div className="hidden w-[112px] shrink-0 sm:block lg:hidden xl:block">
            <div className="lift foil rare-glow overflow-hidden rounded-[9px] ring-1 ring-white/10">
              <CardThumb src={karte.imageUrl} width={112} height={156} className="h-[156px] w-[112px] object-cover" />
            </div>
            <p className="mt-2 truncate text-[10px] text-slate-600">{karte.nameDe ?? karte.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const SCHNELLZUGRIFF = [
  { href: '/suche', icon: Search, titel: 'Karte suchen', text: 'Preise, Trends & Entwicklung', ton: 'text-violet-300 bg-violet-500/10' },
  { href: '/sets', icon: FolderOpen, titel: 'Sets entdecken', text: 'Alle Sets & Erweiterungen', ton: 'text-emerald-300 bg-emerald-500/10' },
  { href: '/portfolio', icon: Briefcase, titel: 'Portfolio öffnen', text: 'Deine Sammlung auswerten', ton: 'text-amber-300 bg-amber-500/10' },
  { href: '/research', icon: FileText, titel: 'Research', text: 'Guides, Analysen & Marktberichte', ton: 'text-sky-300 bg-sky-500/10' },
  { href: '/methodik', icon: ImageIcon, titel: 'Methodik', text: 'Wie jede Kennzahl entsteht', ton: 'text-fuchsia-300 bg-fuchsia-500/10' },
] as const;

export function QuickActions() {
  return (
    <div className="card-frame relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl sm:p-7">
      <div
        aria-hidden
        className="absolute inset-x-5 top-0 h-px opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(190,180,255,0.34), transparent)' }}
      />
      <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-slate-400/80">Schnellzugriff</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {SCHNELLZUGRIFF.map((e) => (
          <Link prefetch={false}
            key={e.href}
            href={e.href}
            className="group flex min-h-[80px] items-center gap-4 rounded-[18px] border border-white/[0.05] bg-white/[0.015] px-5 py-4 transition-all duration-300 hover:-translate-y-[2px] hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.06] ${e.ton}`}>
              <e.icon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-slate-100 group-hover:text-white">
                {e.titel}
              </span>
              <span className="block text-[11px] leading-snug text-slate-500">{e.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
