// Wiederverwendbares Lade-Skeleton für loading.tsx-Boundaries.
// Zweck: SOFORTIGES visuelles Feedback bei jeder Navigation — der Nutzer sieht
// beim Klick unmittelbar die Zielseiten-Struktur statt einer eingefrorenen Seite,
// während der Server rendert (TCG-API bis 8s, Artikel-Generierung länger).
// Server-Komponente ohne Interaktivität — bewusst leichtgewichtig.

interface RouteSkeletonProps {
  variant?: 'list' | 'grid' | 'detail' | 'article';
  /** Optionaler Hinweistext unter dem Spinner (z.B. bei langlaufender Generierung). */
  hint?: string;
}

function NavBarSkeleton() {
  return (
    <div className="sticky top-0 z-50">
      <div className="h-[26px] bg-[#0d0d18] border-b border-[#1e1e30]" />
      <div className="h-14 bg-[#0d0d18] border-b border-[#1e1e30]" />
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-12 sm:py-14 text-center">
        <div className="inline-block h-6 w-32 rounded-full bg-[#1a1a28] mb-4 animate-pulse" />
        <div className="h-9 w-64 max-w-full mx-auto rounded-xl bg-[#1a1a28] mb-3 animate-pulse" />
        <div className="h-4 w-52 max-w-full mx-auto rounded bg-[#13131e] animate-pulse" />
      </div>
    </div>
  );
}

function Spinner({ hint }: { hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
      {hint && <p className="text-xs text-slate-600 animate-pulse text-center max-w-xs">{hint}</p>}
    </div>
  );
}

export function RouteSkeleton({ variant = 'list', hint }: RouteSkeletonProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBarSkeleton />
      <HeroSkeleton />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Spinner hint={hint} />

        {variant === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 opacity-30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden animate-pulse">
                <div className="aspect-[3/4] shimmer" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-[#2a2a3a] rounded w-3/4" />
                  <div className="h-3 bg-[#2a2a3a] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {variant === 'list' && (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] divide-y divide-[#1e1e30] opacity-40 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a28] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#2a2a3a] rounded w-2/5" />
                  <div className="h-3 bg-[#1a1a28] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {variant === 'detail' && (
          <div className="grid md:grid-cols-2 gap-6 opacity-40">
            <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 animate-pulse">
              <div className="aspect-[3/4] max-w-[280px] mx-auto shimmer rounded-xl" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 space-y-3 animate-pulse">
                  <div className="h-3 bg-[#2a2a3a] rounded w-1/3" />
                  <div className="h-6 bg-[#1a1a28] rounded w-2/3" />
                  <div className="h-3 bg-[#1a1a28] rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {variant === 'article' && (
          <div className="max-w-3xl mx-auto space-y-5 opacity-40">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-6 space-y-3 animate-pulse">
                <div className="h-4 bg-[#2a2a3a] rounded w-1/2" />
                <div className="h-3 bg-[#1a1a28] rounded w-full" />
                <div className="h-3 bg-[#1a1a28] rounded w-11/12" />
                <div className="h-3 bg-[#1a1a28] rounded w-4/5" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
