import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { SetLibrary, type SetEintrag } from '@/components/SetLibrary';
import { fetchRecentSets } from '@/lib/pokemon-api';
import { getHomepageCards } from '@/lib/homepage-data';
import { rankSets, validateMarketData, type SetRank } from '@/lib/market-metrics';
import type { Metadata } from 'next';
import { SECTION_LABEL } from '@/lib/ui';
import { LEGAL_NO_ADVICE, LEGAL_UNOFFICIAL } from '@/lib/brand';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Pokémon TCG Sets — Kartenpreise & Übersicht aller Erweiterungen',
  description:
    'Alle aktuellen Pokémon-TCG-Sets im Überblick: Erscheinungsdatum, Kartenanzahl und die wertvollsten Karten jedes Sets mit aktuellen Cardmarket-Preisen.',
};


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

  // MARKTBEWEGUNG JE SET — aus derselben Stichprobe wie die Marktübersicht.
  //
  // Nicht je Set einzeln abgerufen: 24 Sets × ein Abruf wären bei einer Quelle,
  // die regelmäßig aussetzt, mehrere Minuten und mehrere Fehlschläge. Die
  // Stichprobe der Startseite deckt die handelsrelevanten Sets ohnehin ab.
  //
  // Sets ohne ausreichende Stichprobe bekommen `null` — NICHT null Prozent.
  // „Bewegt sich nicht" und „nicht gemessen" sind zwei verschiedene Aussagen,
  // und nur eine davon dürfen wir treffen.
  const marktdaten = await getHomepageCards(250).catch(() => []);
  const proSet = new Map<string, SetRank>();
  for (const r of rankSets(validateMarketData(marktdaten).clean, 999)) proSet.set(r.code, r);

  const eintraege: SetEintrag[] = sets.map((set) => {
    const rang = proSet.get(set.id);
    return {
      id: set.id,
      name: set.name,
      series: set.series ?? '',
      releaseDate: set.releaseDate ?? '',
      total: set.total ?? 0,
      logoUrl: set.logoUrl,
      trend: rang?.avgTrend ?? null,
      median: rang?.medianPrice ?? null,
      gemessen: rang?.count ?? 0,
    };
  });

  return (
    <div className="min-h-screen bg-[#070810] text-slate-300">
      <NavBar />

      {/* Kopf nach dem gemeinsamen Muster: linksbündig, Abschnittsmarke,
          keine Pille, kein Verlauf. Siehe DESIGN.md §2/§4. */}
      <header className="relative border-b border-[#1c1c24]">
        <AmbientBackdrop mode="set" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <p className={SECTION_LABEL}>Sets · Pokémon</p>
          <h1 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Erweiterungen
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Erscheinungsdatum, Umfang und — wo die Datenlage es hergibt —
            Bewegung und typischer Kartenpreis je Set. Filter und Sortierung
            arbeiten ausschließlich auf gemessenen Werten.
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
          <SetLibrary sets={eintraege} />
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
