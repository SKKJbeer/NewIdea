'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Suggestion {
  id: string;
  name: string;
  nameDe?: string;
  imageUrl?: string;
  price: number;
  set: string;
}

interface SearchBoxProps {
  initialQuery?: string;
  autoFocus?: boolean;
  placeholder?: string;
  searchBtn?: string;
}

export function SearchBox({
  initialQuery = '',
  autoFocus = false,
  placeholder = 'Pokémon-Karte suchen, z.B. Charizard …',
  searchBtn = 'Suchen',
}: SearchBoxProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value.trim())}`);
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 320);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length < 2) return;
    setOpen(false);
    router.push(`/suche?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl mx-auto">
      <form onSubmit={submit} className="relative">
        {loadingSuggestions ? (
          <Loader2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400 animate-spin pointer-events-none" />
        ) : (
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        )}
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Pokémon-Karte suchen"
          aria-autocomplete="list"
          aria-expanded={open}
          className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-28 text-sm text-gray-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-700"
        >
          {searchBtn}
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <ul role="listbox">
            {suggestions.map((s) => (
              <li key={s.id} role="option">
                <Link
                  href={`/karten/${s.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 transition-colors"
                >
                  <div className="relative flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-gradient-to-br from-violet-50 to-indigo-50">
                    {s.imageUrl ? (
                      <Image src={s.imageUrl} alt={s.name} fill sizes="32px" className="object-contain" />
                    ) : (
                      <span className="text-sm">🃏</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="truncate text-xs text-gray-400">
                      {s.nameDe && s.nameDe.toLowerCase() !== s.name.toLowerCase() ? s.nameDe : s.set}
                    </p>
                  </div>
                  {s.price > 0 && (
                    <span className="shrink-0 text-sm font-bold text-gray-700 tabular-nums">
                      {s.price.toFixed(2)} €
                    </span>
                  )}
                </Link>
              </li>
            ))}
            <li className="border-t border-gray-50 px-4 py-2 text-center">
              <button
                type="button"
                onClick={submit as never}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  router.push(`/suche?q=${encodeURIComponent(value.trim())}`);
                }}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800"
              >
                Alle Ergebnisse für „{value.trim()}" anzeigen →
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
