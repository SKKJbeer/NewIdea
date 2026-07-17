'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Search, BarChart3 } from 'lucide-react';

const NAV_LINKS = [
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

          {/* Nav links */}
          <div className="flex items-center gap-0.5">
            {/* Search icon on mobile */}
            <Link
              href="/suche"
              aria-label="Suche"
              className={`sm:hidden p-2 rounded-lg transition-colors ${
                pathname.startsWith('/suche') ? 'text-violet-400' : 'text-slate-500 hover:text-violet-400'
              }`}
            >
              <Search size={18} />
            </Link>

            {/* Blog + Guides + Portfolio text on mobile */}
            <Link
              href="/artikel"
              className={`sm:hidden text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/artikel') ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-violet-400'
              }`}
            >
              Blog
            </Link>
            <Link
              href="/guides"
              className={`sm:hidden text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/guides') ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-violet-400'
              }`}
            >
              Guides
            </Link>
            <Link
              href="/portfolio"
              className={`sm:hidden flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/portfolio') ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-violet-400'
              }`}
            >
              <BarChart3 size={12} />Portfolio
            </Link>

            {/* Desktop: all links */}
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`hidden sm:block text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-slate-500 hover:text-violet-400 hover:bg-[#1a1a28]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <Link
              href="/studio"
              className="hidden sm:block text-xs font-semibold text-slate-700 hover:text-violet-400 transition-colors px-2 py-1.5 ml-1"
            >
              Studio ⚙
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
