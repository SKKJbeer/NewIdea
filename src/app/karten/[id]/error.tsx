'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert, RotateCcw } from 'lucide-react';

// FEHLERZUSTAND DER KARTENSEITE.
//
// Die Kartenseite wirft bei einem Aussetzer der Kartendatenbank, statt selbst
// eine Fehlerseite zu rendern: Seit v6.8.5 wird sie gecacht, und eine
// gerenderte Fehlerseite stuende dann eine Stunde lang im Cache. Ein Wurf wird
// nie gecacht — der naechste Aufruf versucht es neu.
export default function KarteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Kartenseite konnte nicht geladen werden:', error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#070810] text-slate-200">
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          <TriangleAlert size={22} />
        </div>
        <h1 className="text-lg font-black text-white">Kartendaten gerade nicht erreichbar</h1>
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
    </div>
  );
}
