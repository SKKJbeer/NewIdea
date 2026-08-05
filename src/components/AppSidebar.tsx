'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, LineChart, LayoutGrid, Briefcase, FileText, FlaskConical } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';
import { DESCRIPTOR_EN } from '@/lib/brand';

// SEITENLEISTE — nach der gelieferten Vorlage.
//
// Sie ersetzt auf grossen Bildschirmen die waagerechte Leiste. Der Grund steht
// in der Vorlage selbst: Die Startseite hat dort vier Inhaltsreihen
// nebeneinander, und eine Kopfleiste haette den obersten Bildschirm zusaetzlich
// verkuerzt. Eine feste Leiste links kostet Breite, aber keine Hoehe — und
// Hoehe ist auf dem ersten Bildschirm das Knappe.
//
// UNTER 1024 px BLEIBT ES BEI DER KOPFLEISTE. Eine 220-px-Leiste neben 390 px
// Inhalt ist keine Navigation, sondern ein Rand. Die Vorlage zeigt einen
// Desktop-Entwurf; fuer schmale Geraete gilt weiter das bestehende Muster.

const PUNKTE = [
  { href: '/', icon: Home, label: 'Übersicht' },
  { href: '/sets', icon: Layers, label: 'Sets' },
  { href: '/marktbericht', icon: LineChart, label: 'Marktbericht' },
  { href: '/suche', icon: LayoutGrid, label: 'Karten' },
  { href: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { href: '/research', icon: FileText, label: 'Research' },
  { href: '/methodik', icon: FlaskConical, label: 'Methodik' },
] as const;

interface Props {
  /** Datenstand — steht in der Vorlage als eigene Karte unten in der Leiste. */
  datenstand: string;
  /** Bestandszahlen für die untere Karte. `null`, wenn nicht ermittelt. */
  bestand: { karten: number; sets: number | null; punkte: number } | null;
}

export function AppSidebar({ datenstand, bestand }: Props) {
  const pfad = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-white/[0.06] bg-[#0a0b16]/80 backdrop-blur-xl lg:flex">
      {/* Lichtkante an der rechten Innenseite — dieselbe Behandlung wie an den
          Panels, damit die Leiste zum Rest gehoert. */}
      <div
        aria-hidden
        className="absolute inset-y-8 right-0 w-px"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(150,140,255,0.22), transparent)' }}
      />

      <div className="px-5 pt-6">
        <Link prefetch={false} href="/" className="block">
          <Wordmark className="text-[17px]" />
          <p className="mt-1 text-[9.5px] leading-tight tracking-wide text-slate-600">{DESCRIPTOR_EN}</p>
        </Link>
      </div>

      <nav className="mt-7 flex-1 px-3" aria-label="Hauptnavigation">
        {PUNKTE.map((p) => {
          const aktiv = p.href === '/' ? pfad === '/' : pfad.startsWith(p.href);
          return (
            <Link
              prefetch={false}
              key={p.href}
              href={p.href}
              aria-current={aktiv ? 'page' : undefined}
              className={`relative mb-0.5 flex min-h-[44px] items-center gap-3 rounded-[12px] px-3 text-[13.5px] transition-colors ${
                aktiv
                  ? 'border border-violet-400/20 bg-violet-500/[0.13] text-white'
                  : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
              }`}
            >
              <p.icon size={17} className={aktiv ? 'text-violet-300' : 'text-slate-500'} />
              {p.label}
            </Link>
          );
        })}
      </nav>

      {/* DATENSTAND. In der Vorlage eine eigene Karte — und inhaltlich richtig
          dort: Sie beantwortet dauerhaft, wie alt das ist, was man gerade
          sieht, ohne dass man dafuer nach unten muss. */}
      <div className="mx-3 mb-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-slate-500">Datenstand</p>
        <p className="mt-1.5 text-[12px] tabular-nums text-slate-200">{datenstand}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-slate-500">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Läuft
        </p>
      </div>

      {/* BESTAND. Nur wenn ermittelt — sonst steht dort nichts statt einer
          geschaetzten Zahl. */}
      {bestand && (
        <div className="mx-3 mb-5 overflow-hidden rounded-[14px] border border-white/[0.06] bg-white/[0.02]">
          <div
            aria-hidden
            className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(190,180,255,0.3), transparent)' }}
          />
          <div className="px-3.5 py-3">
            <p className="text-[11.5px] font-semibold text-slate-200">Pokémon TCG</p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed tabular-nums text-slate-500">
              {bestand.sets !== null && <>{bestand.sets.toLocaleString('de-DE')} Sets · </>}
              {bestand.karten.toLocaleString('de-DE')} Karten
              <br />
              {bestand.punkte.toLocaleString('de-DE')} Preispunkte
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
