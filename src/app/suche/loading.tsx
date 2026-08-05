import { SKELETON } from '@/lib/ui';

// LADEZUSTAND DER SUCHE.
//
// KEINE Kopfleiste — auch keine angedeutete. Die Navigation liegt seit v5.5.0
// in der Anwendungshülle und damit AUSSERHALB dieser Ladegrenze; sie steht die
// ganze Zeit da. Der graue Streifen, der hier stand, war deshalb ein zweites,
// totes Band unter einem echten (derselbe Fehler wie v5.6.1).
//
// Der Umriss bildet den Seitenkopf der Suche nach, wie er WIRKLICH aussieht:
// linksbündig in `max-w-6xl`. Vorher war er mittig — beim Erscheinen der
// Inhalte sprang deshalb alles nach links.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#070810]">
      <header className="border-b border-[#1c1c24]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
          <div className={`h-3 w-32 ${SKELETON}`} />
          <div className={`mt-4 h-10 w-72 max-w-full ${SKELETON}`} />
          <div className={`mt-4 h-3 w-64 max-w-full ${SKELETON}`} />
          <div className={`mt-6 h-12 w-full max-w-xl rounded-full ${SKELETON}`} />
        </div>
      </header>

      {/* Dieselbe Zeilenform wie die fertige Trefferliste — Bild, Name, Set,
          Preis. Damit springt beim Erscheinen nichts. */}
      <main className="mx-auto max-w-7xl px-4 py-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#1c1c24]/70 py-2.5"
          >
            <div className={`h-9 w-[26px] ${SKELETON}`} />
            <div>
              <div className={`h-3 w-40 max-w-full ${SKELETON}`} />
              <div className={`mt-1.5 h-2 w-24 ${SKELETON}`} />
            </div>
            <div className={`h-3 w-16 ${SKELETON}`} />
          </div>
        ))}
      </main>
    </div>
  );
}
