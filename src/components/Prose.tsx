import type { ReactNode } from 'react';

// Hebt Kennzahlen im Fließtext hervor (Preise, Prozente) — das Auge findet die
// wichtigen Werte sofort, ohne dass der Text bunt wird.
const SPLIT = /(\d[\d.,]*\s?(?:€|EUR|%|Prozent))/g;
const HIT = /^\d[\d.,]*\s?(?:€|EUR|%|Prozent)$/;

function emphasize(text: string, keyBase: string): ReactNode[] {
  return text.split(SPLIT).map((part, i) =>
    HIT.test(part) ? (
      <span key={`${keyBase}-${i}`} className="font-semibold text-violet-300">
        {part}
      </span>
    ) : (
      <span key={`${keyBase}-${i}`}>{part}</span>
    ),
  );
}

const LIST_LINE = /^([-•*]|\d+\.)\s/;

/**
 * Einheitlicher, gut lesbarer Fließtext-Renderer für ALLE Content-Flächen
 * (Artikel, Guides, Marktberichte). Verwandelt rohen Absatz-Text in:
 *  - großzügig gesetzte Absätze (angenehme Zeilenhöhe, lesefreundliche Breite)
 *  - optionalen Initialbuchstaben (Drop-Cap) im ersten Absatz
 *  - Aufzählungen mit dezenten Punkten
 *  - farblich hervorgehobene Kennzahlen (Preise/Prozente)
 *
 * Weil die Text-Erzeugung nur Rohtext liefert, wird jeder künftig generierte
 * Beitrag automatisch so dargestellt.
 */
export function Prose({
  text,
  dropcap = false,
  className = '',
}: {
  text: string;
  dropcap?: boolean;
  className?: string;
}) {
  const blocks = text
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const isList = lines.length > 1 && lines.every((l) => LIST_LINE.test(l));

        if (isList) {
          return (
            <ul key={i} className="space-y-2.5">
              {lines.map((line, j) => (
                <li
                  key={j}
                  className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-300"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <span>{emphasize(line.replace(/^([-•*]|\d+\.)\s*/, ''), `${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        const drop = dropcap && i === 0;
        return (
          <p
            key={i}
            className={`text-[15px] leading-[1.75] text-slate-300 ${
              drop
                ? 'first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:text-5xl first-letter:font-black first-letter:leading-[0.8] first-letter:text-violet-400'
                : ''
            }`}
          >
            {emphasize(block, String(i))}
          </p>
        );
      })}
    </div>
  );
}
