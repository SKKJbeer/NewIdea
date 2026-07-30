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
          // `min-h-[32px]` statt reiner Innenabstände: Auf einem Telefon war
          // die Schaltfläche nur rund 22 px hoch — unter jeder brauchbaren
          // Trefferfläche für einen Finger.
          className={`flex min-h-[32px] items-center gap-1 rounded-lg font-bold transition-all ${
            size === 'sm'
              ? 'px-2.5 py-1.5 text-[11px]'
              : 'px-3 py-2 text-xs'
          } ${
            value === lang
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-[#1a1a28] text-slate-400 hover:bg-[#2a2a3a] border border-[#2a2a3a]'
          }`}
        >
          <span className="text-sm leading-none">{LANG_FLAG[lang]}</span>
          <span>{lang}</span>
        </button>
      ))}
    </div>
  );
}
