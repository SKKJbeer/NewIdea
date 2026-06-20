'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  initialQuery?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchBox({ initialQuery = '', autoFocus = false, placeholder = 'Pokémon-Karte suchen, z.B. Charizard …' }: SearchBoxProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length < 2) return;
    router.push(`/suche?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-xl mx-auto">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Pokémon-Karte suchen"
        className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-28 text-sm text-gray-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-700"
      >
        Suchen
      </button>
    </form>
  );
}
