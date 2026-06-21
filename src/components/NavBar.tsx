'use client';

import Link from 'next/link';
import { Zap, LayoutDashboard, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lang } from '@/lib/i18n';

export function NavBar() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('de');

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )lang=(de|en)/);
    if (match?.[1] === 'en') setLang('en');
  }, []);

  function toggleLang() {
    const next = lang === 'de' ? 'en' : 'de';
    document.cookie = `lang=${next};path=/;max-age=31536000;SameSite=Lax`;
    setLang(next);
    router.refresh();
  }

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
            href="/suche"
            className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-violet-600 transition-colors px-2.5 py-1.5"
          >
            <Search size={13} />
            <span className="hidden sm:inline">{lang === 'de' ? 'Suche' : 'Search'}</span>
          </Link>
          <Link
            href="/marktbericht"
            className="text-xs font-semibold text-gray-600 hover:text-violet-600 transition-colors px-2.5 py-1.5 hidden sm:block"
          >
            {lang === 'de' ? 'Marktbericht' : 'Market Report'}
          </Link>
          <Link
            href="/artikel"
            className="text-xs font-semibold text-gray-600 hover:text-violet-600 transition-colors px-2.5 py-1.5"
          >
            Blog
          </Link>
          <Link
            href="/guides"
            className="text-xs font-semibold text-gray-600 hover:text-violet-600 transition-colors px-2.5 py-1.5 hidden sm:block"
          >
            Guides
          </Link>
          <a
            href="#newsletter"
            className="text-xs font-semibold text-gray-600 hover:text-violet-600 transition-colors px-2.5 py-1.5 hidden sm:block"
          >
            Newsletter
          </a>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            title={lang === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
            className="text-xs font-bold text-gray-500 hover:text-violet-600 transition-colors px-2 py-1.5 border border-gray-200 rounded-lg hover:border-violet-300 ml-1"
          >
            {lang === 'de' ? 'EN' : 'DE'}
          </button>

          <Link
            href="/studio"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ml-1"
          >
            <LayoutDashboard size={13} />
            Studio
          </Link>
        </div>
      </div>
    </nav>
  );
}
