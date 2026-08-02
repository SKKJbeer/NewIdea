import { SKELETON } from '@/lib/ui';
import { NavBar } from './NavBar';

// LADEZUSTÄNDE
//
// Vorher: ein sich drehender Kreis in der Seitenmitte, dazu ein Platzhalter-Kopf
// aus abgerundeten Flächen. Ein Spinner sagt „irgendwo passiert etwas" und
// nichts darüber, was gleich kommt — und weil er mittig stand, sprang der
// Inhalt beim Erscheinen darüber hinweg.
//
// Jetzt: Der Platzhalter hat die FORM des Inhalts, der ihn ersetzt, und steht
// an dessen Stelle. Wer auf „Sets" klickt, sieht sofort Set-Zeilen; wer eine
// Karte öffnet, sieht die Kartenfläche in echtem Kartenformat. Kein Kreis,
// kein Balken am oberen Rand.

interface Props {
  variant?: 'list' | 'grid' | 'detail' | 'article';
  /** Wird nicht mehr angezeigt — der Platzhalter selbst ist die Auskunft. */
  hint?: string;
}

function Kopf() {
  return (
    <header className="border-b border-[#1c1c24]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        <div className={`h-3 w-28 ${SKELETON}`} />
        <div className={`mt-6 h-12 w-48 ${SKELETON}`} />
        <div className={`mt-4 h-3 w-64 max-w-full ${SKELETON}`} />
      </div>
    </header>
  );
}

/** Datenzeilen — dieselbe Höhe und Aufteilung wie die fertige Tabelle. */
function Zeilen({ anzahl = 8 }: { anzahl?: number }) {
  return (
    <div>
      {Array.from({ length: anzahl }).map((_, i) => (
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
    </div>
  );
}

export function RouteSkeleton({ variant = 'list' }: Props) {
  return (
    <div className="min-h-screen bg-[#070810]">
      {/* DIE ECHTE NAVIGATION, kein Platzhalter.
          
          BEFUND AUS DEM ECHTEN GERÄT: Hier stand ein leerer Streifen in
          Kopfzeilenhöhe. Wer während des Ladens zurückwollte, hatte dafür kein
          einziges Bedienelement — kein Logo, kein Menü, keinen Zurück-Weg. Bei
          einer langsamen Seite ist das der Moment, in dem man weg will, und
          genau dann war die Seite eine Sackgasse.
          
          Die Navigation braucht keine Daten. Sie gehört von der ersten
          Millisekunde an dorthin. */}
      <NavBar />

      <Kopf />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        {variant === 'detail' && (
          <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
            <div className={`aspect-[63/88] w-full max-w-[300px] ${SKELETON}`} />
            <div>
              <div className={`h-8 w-64 max-w-full ${SKELETON}`} />
              <div className={`mt-3 h-3 w-40 ${SKELETON}`} />
              <div className={`mt-8 h-14 w-32 ${SKELETON}`} />
              <div className="mt-8 space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`h-3 w-full ${SKELETON}`} />
                ))}
              </div>
              {/* Diagrammfläche in Diagrammhöhe — dieselbe wie im fertigen Chart. */}
              <div className={`mt-8 h-[200px] w-full ${SKELETON}`} />
            </div>
          </div>
        )}

        {variant === 'grid' && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className={`h-24 w-full ${SKELETON}`} />
                <div className={`mt-3 h-3 w-32 max-w-full ${SKELETON}`} />
                <div className={`mt-2 h-2 w-20 ${SKELETON}`} />
              </div>
            ))}
          </div>
        )}

        {variant === 'article' && (
          <div className="max-w-2xl space-y-3">
            {[100, 96, 88, 100, 72, 94, 100, 84, 90, 60].map((breite, i) => (
              <div key={i} className={`h-3 ${SKELETON}`} style={{ width: `${breite}%` }} />
            ))}
          </div>
        )}

        {variant === 'list' && <Zeilen />}
      </main>
    </div>
  );
}
