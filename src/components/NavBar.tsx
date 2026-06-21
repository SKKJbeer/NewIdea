'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Search } from 'lucide-react';

const NAV_LINKS = [
  { href: '/suche',        label: 'Suche'       },
  { href: '/marktbericht', label: 'Marktbericht' },
  { href: '/artikel',      label: 'Blog'         },
  { href: '/guides',       label: 'Guides'       },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-yellow-300 fill-yellow-300" />
          </div>
          <span className="font-black text-gray-900 text-sm">
            Pokémon<span className="text-violet-600">Market</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {/* Search icon on mobile */}
          <Link
            href="/suche"
            aria-label="Suche"
            className={`sm:hidden p-2 rounded-lg transition-colors ${
              pathname.startsWith('/suche') ? 'text-violet-600' : 'text-gray-500 hover:text-violet-600'
            }`}
          >
            <Search size={18} />
          </Link>

          {/* Blog + Guides text on mobile */}
          <Link
            href="/artikel"
            className={`sm:hidden text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
              pathname.startsWith('/artikel') ? 'text-violet-700 bg-violet-50' : 'text-gray-600 hover:text-violet-600'
            }`}
          >
            Blog
          </Link>
          <Link
            href="/guides"
            className={`sm:hidden text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
              pathname.startsWith('/guides') ? 'text-violet-700 bg-violet-50' : 'text-gray-600 hover:text-violet-600'
            }`}
          >
            Guides
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
                    ? 'text-violet-700 bg-violet-50'
                    : 'text-gray-600 hover:text-violet-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            );
          })}

          <Link
            href="/studio"
            className="hidden sm:block text-xs font-semibold text-gray-400 hover:text-violet-600 transition-colors px-2 py-1.5 ml-1"
          >
            Studio ⚙
          </Link>
        </div>
      </div>
    </nav>
  );
}
