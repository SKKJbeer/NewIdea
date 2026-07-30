// Ladezustand der Set-Übersicht — dieselbe Rasterform wie die fertige Seite,
// damit beim Erscheinen der Inhalte nichts springt.
export default function SetsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#13131e]">
            <div className="h-28 animate-pulse border-b border-[#1e1e30] bg-[#191926]" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-2/3 animate-pulse rounded bg-[#1e1e30]" />
              <div className="h-2 w-1/3 animate-pulse rounded bg-[#1a1a28]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
