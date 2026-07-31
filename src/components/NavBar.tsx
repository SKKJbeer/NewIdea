'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Wordmark } from './Wordmark';

// NAVIGATION
//
// Fünf Ziele, nicht acht. Die Vorgängerfassung führte jede vorhandene Seite als
// gleichrangigen Punkt: Einsteiger, Suche, Sets, Marktbericht, Blog, Guides,
// Merkliste, Portfolio. Acht Punkte sind keine Ordnung, sondern ein
// Inhaltsverzeichnis — der Besucher muss die Produktstruktur selbst erraten.
//
// Die Reihenfolge bildet ab, wie das Produkt gedacht ist:
//
//   MARKT → KARTEN → SETS → PORTFOLIO → RESEARCH
//
// Erst der Markt, dann seine Einzelteile, dann der eigene Bestand, dann die
// Vertiefung. Merkliste und Einsteiger sind Unterpunkte ihres Zusammenhangs und
// haben in der obersten Ebene nichts verloren.
//
// Der Rechtshinweis ist aus der Kopfzeile verschwunden. Er stand dort in einem
// eigenen Streifen über der ganzen Seite — das Erste, was ein Besucher las, war
// ein Haftungsausschluss. Er steht unverändert in der Fußzeile und auf jeder
// Inhaltsseite; Pflicht ist die Angabe, nicht ihre Platzierung ganz oben.

const NAV = [
  { href: '/', label: 'Markt' },
  { href: '/suche', label: 'Karten' },
  { href: '/sets', label: 'Sets' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/research', label: 'Research' },
] as const;

/** Research fasst mehrere Pfade zusammen — alle zählen als aktiv. */
const RESEARCH_PFADE = ['/research', '/marktbericht', '/artikel', '/guides', '/methodik'];

export function NavBar() {
  const pfad = usePathname() ?? '/';
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    setOffen(false);
  }, [pfad]);

  const aktiv = (href: string) => {
    if (href === '/research') {
      return RESEARCH_PFADE.some((p) => pfad === p || pfad.startsWith(`${p}/`));
    }
    if (href === '/') return pfad === '/';
    return pfad === href || pfad.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#1c1c24] bg-[#08080b]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Trefferflaeche 44 px hoch. Gemessen war die Wortmarke 25 px — als
            Verweis auf die Startseite ist sie damit auf einem Telefon schwerer
            zu treffen als jedes andere Ziel der Seite, und sie ist eines der
            meistgenutzten. Die Marke selbst bleibt gleich gross; nur der
            anklickbare Bereich waechst. */}
        <Link
          href="/"
          className="flex min-h-[44px] shrink-0 items-center"
          aria-label="CardBeacon — Startseite"
        >
          <Wordmark />
        </Link>

        {/* Keine Pillen, keine Flächen: Die aktive Seite trägt eine Linie
            darunter. Das ist die ruhigste Art, Zustand zu zeigen. */}
        <nav className="hidden md:flex items-center" aria-label="Hauptnavigation">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={aktiv(href) ? 'page' : undefined}
              className={`relative px-3 py-[18px] text-[13px] transition-colors ${
                aktiv(href)
                  ? 'text-slate-100 after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-slate-200'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* Suche bleibt jederzeit erreichbar, aber als Werkzeug — nicht als
              Blickfang. Auf der Startseite war sie bisher das größte Element
              der Seite; dieser Platz gehört dem Index. */}
          <Link
            href="/suche"
            className="flex h-11 min-w-[44px] items-center justify-center gap-2 px-2 text-slate-500 transition-colors hover:text-slate-200"
            aria-label="Karten suchen"
          >
            <Search size={15} />
            <span className="hidden lg:inline text-[13px]">Suchen</span>
          </Link>

          <button
            type="button"
            onClick={() => setOffen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-100 md:hidden"
            aria-label={offen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={offen}
          >
            {offen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {offen && (
        <nav className="border-t border-[#1c1c24] md:hidden" aria-label="Navigation">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={aktiv(href) ? 'page' : undefined}
              className={`flex min-h-[48px] items-center border-b border-[#1c1c24]/70 px-4 text-sm ${
                aktiv(href) ? 'text-slate-100' : 'text-slate-400'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
