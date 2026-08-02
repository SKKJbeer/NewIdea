import type { MarketStory } from '@/lib/market-story';
import { SECTION_LABEL } from '@/lib/ui';

// DIE MARKT-STORY — der erste Bildschirm.
//
// WAS SICH HIER ENTSCHEIDET: Wer neu auf die Seite kommt, sieht als Erstes
// entweder eine Zahl oder einen Satz. Eine Zahl setzt voraus, dass man weiß,
// was sie bedeutet; ein Satz nicht. Die Kennzahlen sind deshalb NICHT
// verschwunden — sie stehen darunter und erklären den Satz, statt ihn zu
// ersetzen.
//
// TYPOGRAFIE STATT KACHEL: Kein Rahmen, keine Fläche, kein Symbol. Eine
// Schlagzeile, ein Absatz, drei Belege. Das ist die Anmutung einer Titelseite,
// und sie trägt die Aussage besser als jede Karte mit Rand — die würde die
// Story zu einem Element unter Elementen machen.

export function MarketStoryBlock({ story, datenstand }: { story: MarketStory; datenstand: string }) {
  return (
    <div className="max-w-3xl">
      <p className={`${SECTION_LABEL} flex items-center gap-2`}>
        Der Pokémon-Markt heute
        <span aria-hidden className="h-1 w-1 rounded-full bg-fuchsia-400/70" />
        <span className="font-normal normal-case tracking-normal text-slate-700">{datenstand}</span>
      </p>

      {/* Die Schlagzeile ist die größte SCHRIFT der Seite — die größte ZAHL
          bleibt der Index darunter. Beides an einer Stelle zu häufen, hebt
          nichts hervor. */}
      <h1 className="mt-4 text-[27px] font-semibold leading-[1.15] tracking-tight text-white sm:text-[38px]">
        {story.schlagzeile}
      </h1>

      <p className="mt-5 text-[15px] leading-[1.75] text-slate-300 sm:text-[17px]">
        {story.absatz}
      </p>

      {/* Die Belege stehen direkt am Text, nicht in einem eigenen Abschnitt:
          Sie sind der Grund, warum man dem Absatz glauben darf. Getrennt
          platziert wären sie wieder nur Kennzahlen. */}
      {story.belastbar && (
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[12px]">
          {story.belege.map((b) => (
            <div key={b.label} className="flex items-baseline gap-2">
              <dt className="text-slate-600">{b.label}</dt>
              <dd className="tabular-nums text-slate-300">{b.wert}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
