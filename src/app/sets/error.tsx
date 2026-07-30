'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert, RotateCcw } from 'lucide-react';

// FEHLERZUSTAND MIT AUSWEG.
//
// Vorher endete ein Aussetzer der Kartendatenbank in „Set-Daten momentan nicht
// verfügbar" — ohne Erklärung, ohne Wiederholung, und wegen des Tages-Caches
// bis zu 24 Stunden lang. Diese Seite erscheint nur noch bei kaltem Cache und
// bietet eine echte Wiederholung an.
export default function SetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ursache ins Server-Log, nicht auf den Bildschirm des Besuchers.
    console.error('Set-Übersicht konnte nicht geladen werden:', error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
        <TriangleAlert size={22} />
      </div>
      <h2 className="text-lg font-black text-white">Set-Übersicht gerade nicht erreichbar</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Die Kartendatenbank antwortet im Moment nicht. Das ist meist nach wenigen Sekunden behoben.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-700"
        >
          <RotateCcw size={13} /> Erneut versuchen
        </button>
        <Link
          href="/suche"
          className="rounded-full border border-[#2a2a3a] px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:border-violet-500/30 hover:text-white"
        >
          Zur Kartensuche
        </Link>
      </div>
    </div>
  );
}
