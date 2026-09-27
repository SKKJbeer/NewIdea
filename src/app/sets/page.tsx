import Link from 'next/link';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { SetLibrary, type SetEintrag } from '@/components/SetLibrary';
import { ladeSetListe } from '@/lib/set-liste';
import { getHomepageCards } from '@/lib/homepage-data';
import { rankSets, validateMarketData, type SetRank } from '@/lib/market-metrics';
import type { Metadata } from 'next';
import { SECTION_LABEL } from '@/lib/ui';
import { LEGAL_NO_ADVICE, LEGAL_UNOFFICIAL } from '@/lib/brand';

// Stuendlich statt taeglich: Ein Aussetzer beim Erzeugen hielt sich sonst 24 h.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pokémon TCG Sets — Kartenpreise & Übersicht aller Erweiterungen',
  description:
    'Alle aktuellen Pokémon-TCG-Sets im Überblick: Erscheinungsdatum, Kartenanzahl und die wertvollsten Karten jedes Sets mit aktuellen Cardmarket-Preisen.',
};


export default async function SetsPage() {
  // SET-LISTE MIT GESICHERTEM RUECKFALL (seit v6.10.2, siehe set-liste.ts).
  // Vorher: nur live — fiel der Abruf beim Build aus, stand bis zu 24 h
  // „Noch keine Sets geladen" auf Produktion. Nur wenn weder Quelle noch
  // Sicherung etwas liefern, wirft die Seite zur Laufzeit (error.tsx, nie
  // gecacht); im Build bleibt der Leerzustand, damit ein Aussetzer nicht das
  // ganze Deployment verhindert.
  const liste = await ladeSetListe(24);
  if (liste.sets.length === 0 && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('Set-Liste weder live noch gesichert verfuegbar');
  }
  const sets = liste.sets;

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
