// HINTERGRUND-IDENTITÄT — das, was man erst beim zweiten Hinsehen bemerkt.
//
// AUFGABE: Der Untergrund war eine reine Fläche. Fachlich einwandfrei und
// vollkommen austauschbar — dasselbe Schwarz wie jedes Krypto-Dashboard.
//
// WAS HIER PASSIERT: Eine abstrakte Höhenlinien-Struktur, wie man sie von
// Karten kennt, überlagert von zwei sehr weichen Lichthöfen. Die Linien laufen
// in unregelmäßigen Abständen — regelmäßige Abstände lesen sich als Raster,
// und ein Raster wirkt technisch statt sammlerhaft.
//
// DECKKRAFT: Rund 3 %. Die Vorgabe lautet: Beim ersten Blick sieht man eine
// hochwertige dunkle Oberfläche, und erst beim genaueren Hinsehen die
// Struktur. Alles darüber wird zur Tapete und nimmt den Karten die Bühne.
//
// KEIN POKÉMON-ARTWORK. Nichts hier ist einer geschützten Illustration
// nachgezeichnet. Die Formensprache kommt von Energie und Folie — Wellen,
// Höhenlinien, Streulicht —, nicht von Kreaturen. Das ist keine juristische
// Vorsichtsmaßnahme allein, sondern auch die bessere Gestaltung: Ein
// angedeuteter Glurak-Umriss im Hintergrund wäre genau die Fan-Seiten-Anmutung,
// die dieses Produkt nicht haben soll.
//
// FÜR HILFSMITTEL UNSICHTBAR: `aria-hidden`, keine Textinhalte, `pointer-events-none`.
// Ein Bildschirmleser hat von einer Höhenlinie nichts.

interface Props {
  /**
   * `hero` ist kräftiger und trägt die Lichthöfe — für den Kopf einer Seite.
   * `flaeche` ist nur die Struktur, für lange Leseflächen.
   */
  variante?: 'hero' | 'flaeche';
  className?: string;
}

export function CollectorBackdrop({ variante = 'flaeche', className = '' }: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 600"
        fill="none"
      >
        <defs>
          {/* Die Linien verblassen nach unten — sonst schneiden sie hart an der
              Abschnittsgrenze ab und sehen aus wie ein Bildfehler. */}
          <linearGradient id="cb-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="70%" stopColor="white" stopOpacity="0.25" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="cb-mask">
            <rect width="1200" height="600" fill="url(#cb-fade)" />
          </mask>
        </defs>

        <g mask="url(#cb-mask)" stroke="currentColor" className="text-slate-400" fill="none">
          {/* Höhenlinien. Die Werte sind von Hand ungleichmäßig gesetzt —
              berechnete Abstände ergeben ein Raster, und ein Raster ist kein
              Gelände. */}
          {[
            'M-40 470 C 180 430, 320 500, 520 452 S 900 372, 1240 424',
            'M-40 424 C 170 386, 330 452, 528 404 S 906 328, 1240 378',
            'M-40 372 C 200 342, 316 400, 510 356 S 892 288, 1240 330',
            'M-40 312 C 190 288, 344 342, 534 300 S 884 240, 1240 276',
            'M-40 246 C 210 228, 330 274, 516 238 S 900 186, 1240 216',
            'M-40 174 C 186 162, 352 200, 540 170 S 890 128, 1240 152',
          ].map((d, i) => (
            <path key={d} d={d} strokeWidth={i % 3 === 0 ? 1.2 : 0.7} opacity={0.5 - i * 0.05} />
          ))}
        </g>

        {variante === 'hero' && (
          <g mask="url(#cb-mask)">
            {/* Streulicht — die Andeutung von Folie unter flachem Licht.
                Zwei Höfe, deutlich versetzt: ein einzelner mittiger Hof sieht
                aus wie ein Vignettierungsfehler. */}
            <ellipse cx="230" cy="130" rx="300" ry="170" className="fill-violet-500/[0.06]" />
            <ellipse cx="980" cy="250" rx="340" ry="150" className="fill-sky-500/[0.04]" />
          </g>
        )}
      </svg>
    </div>
  );
}
