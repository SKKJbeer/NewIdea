'use client';

import Link from 'next/link';
import { Zap, LayoutDashboard } from 'lucide-react';

export function NavBar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-yellow-300 fill-yellow-300" />
          </div>
          <span className="font-black text-gray-900 text-sm">
            Pokémon<span className="text-violet-600">Market</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/marktbericht"
            className="text-xs font-semibold text-gray-600 hover:text-violet-600 transition-colors px-2.5 py-1.5 hidden sm:block"
          >
            Marktbericht
          </Link>
          <a
            href="#newsletter"
            className="text-xs font-semibold text-gray-600 hover:text-violet-600 transition-colors px-2.5 py-1.5 hidden sm:block"
          >
            Newsletter
          </a>
          <Link
            href="/studio"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <LayoutDashboard size={13} />
            Studio
          </Link>
        </div>
      </div>
    </nav>
  );
}
