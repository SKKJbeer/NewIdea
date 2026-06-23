export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* NavBar skeleton */}
      <div className="sticky top-0 z-50 h-[72px] bg-[#0d0d18] border-b border-[#1e1e30]" />

      {/* Hero skeleton */}
      <div className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-12 sm:py-14 text-center">
          <div className="inline-block h-6 w-32 rounded-full bg-[#1a1a28] mb-4 animate-pulse" />
          <div className="h-10 w-72 mx-auto rounded-xl bg-[#1a1a28] mb-3 animate-pulse" />
          <div className="h-4 w-64 mx-auto rounded bg-[#13131e] mb-6 animate-pulse" />
          <div className="h-12 w-full max-w-xl mx-auto rounded-full bg-[#1a1a28] animate-pulse" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          </div>
          <p className="text-sm text-slate-600 animate-pulse">Karten werden gesucht …</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-[#1a1a28]" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-[#2a2a3a] rounded w-3/4" />
                <div className="h-3 bg-[#2a2a3a] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
