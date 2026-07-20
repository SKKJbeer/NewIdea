'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Zap, Search, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/einsteiger',   label: 'Einsteiger'   },
  { href: '/suche',        label: 'Suche'       },
  { href: '/sets',         label: 'Sets'         },
  { href: '/marktbericht', label: 'Marktbericht' },
  { href: '/artikel',      label: 'Blog'         },
  { href: '/guides',       label: 'Guides'       },
  { href: '/merkliste',    label: 'Merkliste'    },
  { href: '/portfolio',    label: 'Portfolio'    },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Menü bei Seitenwechsel schließen
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-[#0d0d18] border-b border-[#1e1e30] px-4 py-1.5 text-center">
        <p className="text-[10px] sm:text-xs text-amber-400/60 font-medium leading-tight">
          <span className="font-bold text-amber-400/80">Inoffizielle Fan-Seite</span>
          {' · '}Kein offizielles Pokémon-Produkt
          {' · '}
          <span className="font-bold text-amber-400/80">Keine Anlageberatung</span>
          {' · '}Alle Preise ohne Gewähr
        </p>
      </div>
      <nav className="bg-[#0d0d18]/95 backdrop-blur-md border-b border-[#1e1e30]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-yellow-300 fill-yellow-300" />
            </div>
            <span className="font-black text-slate-200 text-sm">
              Pokémon<span className="text-violet-400">Market</span>
            </span>
          </Link>

          {/* Desktop: alle Links inline */}
          <div className="hidden sm:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                  isActive(href)
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-500 hover:text-violet-400 hover:bg-[#1a1a28]'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/studio"
              className="text-xs font-semibold text-slate-700 hover:text-violet-400 transition-colors px-2 py-1.5 ml-1"
            >
              Studio
            </Link>
          </div>

          {/* Mobil: Suche + Hamburger */}
          <div className="flex sm:hidden items-center gap-1">
            <Link
              href="/suche"
              aria-label="Suche"
              className={`p-2 rounded-lg transition-colors ${
                pathname.startsWith('/suche') ? 'text-violet-400' : 'text-slate-500 hover:text-violet-400'
              }`}
            >
              <Search size={18} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={open}
              className={`p-2 rounded-lg transition-colors ${
                open ? 'text-violet-400 bg-violet-500/10' : 'text-slate-400 hover:text-violet-400'
              }`}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobil: aufklappbares Menü mit ALLEN Links */}
        {open && (
          <div className="sm:hidden border-t border-[#1e1e30] bg-[#0d0d18]/98 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-3 py-2 grid grid-cols-2 gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(href)
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-slate-300 hover:text-violet-400 hover:bg-[#1a1a28]'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/studio"
                className="col-span-2 text-xs font-semibold text-slate-600 hover:text-violet-400 transition-colors px-3 py-2 mt-1 border-t border-[#1e1e30]"
              >
                Studio
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
