import Link from 'next/link';
import { APP_VERSION } from '@/lib/app-version';
import { Wordmark } from './Wordmark';
import {
  DESCRIPTOR_DE,
  LEGAL_NO_ADVICE,
  LEGAL_TRADEMARK,
  LEGAL_UNOFFICIAL,
} from '@/lib/brand';
import { SECTION_LABEL } from '@/lib/ui';

// FUSSZEILE
//
// Die Gruppierung folgt der Navigation, nicht der Dateistruktur: Markt, Karten,
// Portfolio, Research, Rechtliches. Wer oben „Research" gesehen hat, findet
// unten dieselbe Ordnung wieder.

const GRUPPEN: Array<{ label: string; links: Array<{ href: string; label: string }> }> = [
  {
    label: 'Markt',
    links: [
      { href: '/', label: 'Marktübersicht' },
      { href: '/suche', label: 'Karten' },
      { href: '/sets', label: 'Sets' },
    ],
  },
  {
    label: 'Bestand',
    links: [
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/merkliste', label: 'Merkliste' },
    ],
  },
  {
    label: 'Research',
    links: [
      { href: '/marktbericht', label: 'Marktbericht' },
      { href: '/artikel', label: 'Analysen' },
      { href: '/guides', label: 'Guides' },
      { href: '/einsteiger', label: 'Einstieg' },
    ],
  },
  {
    label: 'Transparenz',
    links: [
      // Die Methodik steht bewusst zuerst: Sie ist das Vertrauensdokument,
      // keine Pflichtseite.
      { href: '/methodik', label: 'Methodik' },
      { href: '/changelog', label: 'Änderungen' },
      { href: '/impressum', label: 'Impressum' },
      { href: '/datenschutz', label: 'Datenschutz' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#1c1c24] bg-[#070810]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <Link
              prefetch={false}
              href="/"
              className="flex min-h-[44px] items-center"
              aria-label="CardBeacon — Startseite"
            >
              <Wordmark />
            </Link>
            <p className="mt-3 max-w-[220px] text-[11px] leading-relaxed text-slate-600">
              {DESCRIPTOR_DE} für Pokémon TCG.
            </p>
          </div>

          {GRUPPEN.map((g) => (
            <nav key={g.label} aria-label={g.label}>
              <p className={SECTION_LABEL}>{g.label}</p>
              <ul className="mt-3 -my-1">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
              prefetch={false}
                      href={l.href}
                      className="inline-flex min-h-[32px] items-center text-[12px] text-slate-500 transition-colors hover:text-slate-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#1c1c24] pt-5 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-[11px] leading-relaxed text-slate-600">
            {LEGAL_UNOFFICIAL} {LEGAL_NO_ADVICE} {LEGAL_TRADEMARK}
          </p>
          {/* Konstante statt Umgebungsvariable — siehe app-version.ts. */}
          <p className="shrink-0 font-mono text-[11px] tabular-nums text-slate-700">
            v{APP_VERSION}
          </p>
        </div>
      </div>
    </footer>
  );
}
