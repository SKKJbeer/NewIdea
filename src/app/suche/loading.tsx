export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NavBar skeleton */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm h-14" />

      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-900">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-12 sm:py-14 text-center">
          <div className="inline-block h-6 w-32 rounded-full bg-white/20 mb-4 animate-pulse" />
          <div className="h-10 w-72 mx-auto rounded-xl bg-white/20 mb-3 animate-pulse" />
          <div className="h-4 w-64 mx-auto rounded bg-white/10 mb-6 animate-pulse" />
          <div className="h-12 w-full max-w-xl mx-auto rounded-full bg-white/20 animate-pulse" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Loading state indicator */}
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 animate-pulse">Karten werden gesucht …</p>
        </div>

        {/* Card skeleton grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
