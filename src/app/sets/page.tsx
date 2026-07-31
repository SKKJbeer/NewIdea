import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { Calendar, Layers } from 'lucide-react';
import { fetchRecentSets } from '@/lib/pokemon-api';
import type { Metadata } from 'next';
import { SECTION_LABEL } from '@/lib/ui';
import { LEGAL_NO_ADVICE, LEGAL_UNOFFICIAL } from '@/lib/brand';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Pokémon TCG Sets — Kartenpreise & Übersicht aller Erweiterungen',
  description:
    'Alle aktuellen Pokémon-TCG-Sets im Überblick: Erscheinungsdatum, Kartenanzahl und die wertvollsten Karten jedes Sets mit aktuellen Cardmarket-Preisen.',
};

function formatReleaseDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(/\//g, '-') + 'T12:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

export default async function SetsPage() {
  // BEWUSST OHNE pauschales `.catch(() => [])`: Ein verschluckter Fehler wurde
  // hier mit `revalidate = 86400` einen GANZEN TAG als Leerzustand gecacht.
  // Zur Laufzeit darf der Fehler deshalb durchschlagen — Next.js behält dann
  // die zuletzt erfolgreiche Seite und zeigt `error.tsx` nur bei kaltem Cache,
  // mit Wiederholmöglichkeit.
  //
  // WÄHREND DES BUILDS gilt das Gegenteil: Dort gibt es keine vorherige Seite,
  // die Next.js behalten könnte — ein Fehler bricht stattdessen den GESAMTEN
  // Build ab. Genau das ist passiert: ein Aussetzer der Kartendatenbank (die
  // laut Stolperstelle 28 regelmäßig welche hat) hätte das ganze Deployment
  // verhindert, inklusive aller Änderungen, die mit Sets nichts zu tun haben.
  // In dieser Phase ist der ehrliche Leerzustand das kleinere Übel: Die erste
  // Neuvalidierung holt die Sets nach.
  let sets = await fetchRecentSets(24).catch((err) => {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('[sets] Abruf während des Builds fehlgeschlagen — Leerzustand:', err);
      return [];
    }
    throw err;
  });
  sets = sets ?? [];

  return (
    <div className="min-h-screen bg-[#08080b] text-slate-300">
      <NavBar />

      {/* Kopf nach dem gemeinsamen Muster: linksbündig, Abschnittsmarke,
          keine Pille, kein Verlauf. Siehe DESIGN.md §2/§4. */}
      <header className="border-b border-[#1c1c24]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <p className={SECTION_LABEL}>Sets · Pokémon</p>
          <h1 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Erweiterungen
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Die aktuellen Sets mit Erscheinungsdatum und Umfang. Bewegung und
            typischer Kartenpreis je Set stehen im Set-Markt der Übersicht.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        {sets.length === 0 ? (
          <div className="mx-auto max-w-md border-t border-[#1c1c24] p-6 text-center">
            <p className="font-semibold text-slate-200">Noch keine Sets geladen</p>
            <p className="mt-1 text-sm text-slate-500">
              Die Set-Übersicht wird gleich befüllt. In der Zwischenzeit findest du jede Karte über die Suche.
            </p>
            <Link
              href="/suche"
              className="mt-4 inline-flex min-h-[44px] items-center border border-[#2a2a35] px-4 text-[13px] text-slate-200 transition-colors hover:border-slate-500"
            >
              Zur Kartensuche
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((set) => (
              <Link
                key={set.id}
                href={`/sets/${set.id}`}
                className="group flex flex-col border-t border-[#1c1c24] pt-4 transition-colors hover:border-slate-600"
              >
                {/* Logo-Feld in einheitlicher Höhe — ohne Fläche und ohne
                    Verlauf, damit das Logo selbst die Farbe liefert. */}
                <div className="flex h-20 items-center justify-start">
                  <BoosterPackImage
                    setCode={set.id}
                    setName={set.name}
                    logoUrl={set.logoUrl}
                    className="max-h-16 w-auto max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>

                {/* Metadaten: klare Hierarchie, dezente Meta-Pillen */}
                <div className="mt-3 flex flex-1 flex-col gap-2">
                  <div>
                    <p className="truncate text-[15px] text-slate-200 group-hover:text-white">{set.name}</p>
                    {set.series && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{set.series}</p>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                    {formatReleaseDate(set.releaseDate) && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#2a2a3a] bg-[#0d0d18] px-2 py-0.5 text-[11px] text-slate-400">
                        <Calendar size={10} className="text-slate-500" />
                        {formatReleaseDate(set.releaseDate)}
                      </span>
                    )}
                    {set.total > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#2a2a3a] bg-[#0d0d18] px-2 py-0.5 text-[11px] text-slate-400">
                        <Layers size={10} className="text-slate-500" />
                        {set.total} Karten
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-[#1c1c24] pt-6">
          <p className={SECTION_LABEL}>Hinweis</p>
          <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-slate-600">
            {LEGAL_UNOFFICIAL} {LEGAL_NO_ADVICE}
          </p>
        </div>
      </main>
    </div>
  );
}
