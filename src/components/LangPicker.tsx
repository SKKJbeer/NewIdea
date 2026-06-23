'use client';

import type { CardLanguage } from '@/lib/portfolio';

const LANG_FLAG: Record<CardLanguage, string> = { EN: '🇬🇧', DE: '🇩🇪', JP: '🇯🇵', KR: '🇰🇷' };

export function LangPicker({
  value,
  onChange,
  size = 'sm',
}: {
  value: CardLanguage;
  onChange: (l: CardLanguage) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(['EN', 'DE', 'JP', 'KR'] as CardLanguage[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`flex items-center gap-1 rounded-lg font-bold transition-all ${
            size === 'sm'
              ? 'px-2 py-1 text-[11px]'
              : 'px-2.5 py-1.5 text-xs'
          } ${
            value === lang
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <span className="text-sm leading-none">{LANG_FLAG[lang]}</span>
          <span>{lang}</span>
        </button>
      ))}
    </div>
  );
}
