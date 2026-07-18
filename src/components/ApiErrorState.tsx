import Link from 'next/link';
import { NavBar } from './NavBar';
import { CloudOff, RotateCw } from 'lucide-react';

/**
 * Anzeige bei transienten API-Fehlern (Timeout/Rate-Limit der TCG-API).
 * WICHTIG: Dies ist bewusst KEIN 404 — die Daten existieren, nur die Quelle
 * ist gerade nicht erreichbar. Ein erneuter Aufruf behebt es meist.
 */
export function ApiErrorState({ backHref = '/', backLabel = 'Zur Startseite' }: { backHref?: string; backLabel?: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-[#1a1a28] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CloudOff size={28} className="text-amber-400" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">Daten gerade nicht erreichbar</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Die Kartendatenbank antwortet momentan nicht — das passiert bei hoher Last
          und behebt sich meist innerhalb von Sekunden.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href=""
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-full transition-colors text-sm"
          >
            <RotateCw size={14} /> Erneut versuchen
          </a>
          <Link
            href={backHref}
            className="text-sm text-slate-500 hover:text-violet-400 font-semibold transition-colors"
          >
            {backLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}
