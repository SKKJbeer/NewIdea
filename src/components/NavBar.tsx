'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Search, BookOpen, BarChart2, Newspaper } from 'lucide-react';

const NAV_LINKS = [
  { href: '/suche',        label: 'Suche',       icon: Search    },
  { href: '/marktbericht', label: 'Markt',        icon: BarChart2 },
  { href: '/artikel',      label: 'Blog',         icon: Newspaper },
  { href: '/guides',       label: 'Guides',       icon: BookOpen  },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — logo only on mobile, full nav on desktop */}
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

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'text-violet-700 bg-violet-50'
                      : 'text-gray-600 hover:text-violet-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Studio link — subtle */}
          <Link
            href="/studio"
            className="hidden sm:block text-xs font-semibold text-gray-400 hover:text-violet-600 transition-colors px-2 py-1.5"
          >
            Studio ⚙
          </Link>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-1px_6px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch h-16">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-violet-600' : 'text-gray-400'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold ${active ? 'text-violet-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer so content doesn't hide behind bottom tab bar on mobile */}
      <div className="sm:hidden h-16" />
    </>
  );
}
