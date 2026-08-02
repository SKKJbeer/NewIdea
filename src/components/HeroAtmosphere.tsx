import {
  MYTHIC_RINGS, MYTHIC_FILAMENTS, MYTHIC_CREST, MYTHIC_SILHOUETTE,
  MYTHIC_EYE, MYTHIC_TEETH, MYTHIC_HATCH, MYTHIC_SPARKS,
} from '@/lib/mythic-art';

// ATMOSPHAERE DES SEITENKOPFS — nach der gelieferten Vorlage.
//
// Die Vorlage baut den Hintergrund aus mehreren Ebenen. Sie einzeln
// nachzubauen ist der einzige Weg, auf den Eindruck zu kommen — ein einzelner
// Verlauf sieht immer nach Verlauf aus, erst die Ueberlagerung sieht nach Raum
// aus. Von hinten nach vorn:
//
//   1. Mitternachtsbasis           — der Grundton, dunkler als die Seite
//   2. Atmosphaerische Verlaeufe   — Blau und Violett, weit auseinander gesetzt
//   3. Lichtstreifen               — diagonale Schlieren wie auf Folie
//   4. Gravur                      — das Fabelwesen, rechts oben
//   5. Bloom                       — weiches Licht ueber allem
//   6. Partikel                    — Streulicht, ruhig gesetzt
//
// LEISTUNG: ausschliesslich CSS-Verlaeufe und SVG. Kein Bild, kein Video,
// keine Leinwand, kein WebGL, keine dauerhafte Animation. `aria-hidden`, damit
// Hilfsmittel nichts davon vorlesen.

/** Streulicht im gesamten Kopf. Von Hand gesetzt — Zufall verteilt sichtbar ungleich. */
const PARTIKEL: Array<[number, number, number, number]> = [
  [4, 18, 1.6, 0.5], [11, 62, 1, 0.32], [17, 33, 1.3, 0.42], [23, 78, 0.9, 0.26],
  [28, 12, 1.5, 0.46], [34, 52, 1, 0.3], [41, 86, 1.2, 0.36], [47, 27, 0.9, 0.24],
  [53, 68, 1.4, 0.44], [58, 8, 1, 0.28], [63, 44, 1.1, 0.34], [69, 92, 0.9, 0.22],
  [74, 22, 1.5, 0.48], [79, 58, 1, 0.3], [84, 36, 1.2, 0.38], [88, 74, 0.9, 0.24],
  [92, 16, 1.3, 0.4], [96, 50, 1, 0.28], [7, 88, 1.1, 0.3], [37, 96, 1, 0.26],
];

export function HeroAtmosphere({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* 1 — MITTERNACHTSBASIS.
          Dunkler als die uebrige Seite und mit einem Stich ins Blaue. Der Kopf
          soll tiefer liegen als das, was darunter kommt. */}
      <div className="absolute inset-0 bg-[#080a18]" />

      {/* 2 — ATMOSPHAERISCHE VERLAEUFE.
          Vier Hoefe, weit auseinander: einer warm links (die Vorlage hat dort
          einen Bernsteinton in der Ueberschrift), zwei kalte rechts, einer
          tief violett in der Mitte. Weit auseinander gesetzt, damit keine
          Mischfarbe entsteht — uebereinander liegende Hoefe ergeben Grau. */}
      <div
        className="absolute -left-[12%] -top-[28%] h-[78vh] w-[62vw] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(closest-side, rgba(88,60,200,0.30), transparent)' }}
      />
      <div
        className="absolute left-[24%] top-[-10%] h-[64vh] w-[46vw] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, rgba(180,120,60,0.13), transparent)' }}
      />
      <div
        className="absolute right-[-10%] top-[-18%] h-[86vh] w-[58vw] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(closest-side, rgba(46,88,190,0.30), transparent)' }}
      />
      <div
        className="absolute right-[16%] bottom-[-30%] h-[62vh] w-[52vw] rounded-full blur-[150px]"
        style={{ background: 'radial-gradient(closest-side, rgba(126,58,205,0.22), transparent)' }}
      />

      {/* 3 — LICHTSTREIFEN.
          Diagonale Schlieren, wie sie auf einer gekippten Folienkarte
          entstehen. Sehr flach im Winkel und sehr schwach — sie sollen den
          Raum strukturieren, nicht auffallen. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(114deg, transparent 0 62px, rgba(255,255,255,0.016) 62px 63px, transparent 63px 138px)',
        }}
      />
      <div
        className="absolute -left-[6%] -top-[10%] h-[130%] w-[38%] -rotate-[24deg]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(150,180,255,0.055) 42%, rgba(255,210,150,0.045) 58%, transparent)',
        }}
      />

      {/* 4 — DIE GRAVUR.
          Rechts oben, gross und teils angeschnitten — wie in der Vorlage. Die
          Figur ist eine eigene Konstruktion (siehe `mythic-art.ts`), kein
          nachgezeichnetes Vorbild.

          Sie liegt ZWISCHEN den Verlaeufen und dem Bloom, nicht obenauf: Das
          ist der Unterschied zwischen „eingraviert" und „aufgeklebt". Der
          Bloom darueber legt sich wie Dunst ueber die Linien. */}
      {/* FESTE HOEHE, KEIN PROZENTWERT.
          Der erste Versuch setzte `h-[132%]` — bezogen auf den ganzen Kopf,
          und der ist mit Kennzahlen und Panels ueber tausend Pixel hoch. Die
          Figur wurde dadurch auf das Doppelte gestreckt und landete mit dem
          Kopf auf Hoehe der Set-Liste. In der Vorlage steht sie NEBEN der
          Ueberschrift, oben. Feste Masse sind hier das Richtige: Die Figur ist
          ein Bildelement, kein Layoutelement. */}
      <svg
        className="absolute left-1/2 top-[-58px] hidden h-[520px] w-[560px] md:block xl:left-[27%] xl:top-[-72px] xl:h-[600px] xl:w-[640px]"
        viewBox="0 0 720 640"
        fill="none"
      >
        <defs>
          {/* Der Verlauf laeuft von Bernstein nach Blau — dieselbe Spanne wie
              die Verlaeufe darunter, damit die Figur zum Raum gehoert. */}
          <linearGradient id="mythic-stroke" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(251 191 36)" />
            <stop offset="42%" stopColor="rgb(244 164 96)" />
            <stop offset="72%" stopColor="rgb(167 139 250)" />
            <stop offset="100%" stopColor="rgb(96 165 250)" />
          </linearGradient>
          {/* Nach unten und links ausblenden: Die Figur soll aus dem Dunkel
              auftauchen, nicht an einer Kante enden. */}
          <radialGradient id="mythic-fade" cx="42%" cy="42%" r="78%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="62%" stopColor="white" stopOpacity="0.66" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="mythic-mask">
            <rect width="720" height="640" fill="url(#mythic-fade)" />
          </mask>
        </defs>

        <g mask="url(#mythic-mask)" stroke="url(#mythic-stroke)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Ringe — der Raum, in dem die Figur steht */}
          <g opacity="0.38">
            {MYTHIC_RINGS.map(([cx, cy, r, anteil]) => (
              <circle
                key={r}
                cx={cx}
                cy={cy}
                r={r}
                strokeWidth="0.9"
                strokeDasharray={`${2 * Math.PI * r * anteil} ${2 * Math.PI * r}`}
                transform={`rotate(-38 ${cx} ${cy})`}
              />
            ))}
          </g>

          {/* Filamente */}
          <g opacity="0.5" strokeWidth="1.1">
            {MYTHIC_FILAMENTS.map((d) => <path key={d} d={d} />)}
          </g>

          {/* Kamm — geschlossene Zacken, schwach gefuellt */}
          <g opacity="0.5" strokeWidth="1.1" fill="url(#mythic-stroke)" fillOpacity="0.08">
            {MYTHIC_CREST.map((d) => <path key={d} d={d} />)}
          </g>

          {/* SILHOUETTE — Schaedel, Kiefer, Hals.
              Die Fuellung ist der Grund, warum die Figur ueberhaupt als Figur
              lesbar ist: Ein Auge erkennt eine Gestalt an ihrer Umrissflaeche,
              nicht an einzelnen Bogen. Sie bleibt so schwach, dass der
              Gravur-Eindruck erhalten bleibt. */}
          <g opacity="0.8" strokeWidth="1.7" fill="url(#mythic-stroke)" fillOpacity="0.075">
            {MYTHIC_SILHOUETTE.map((d) => <path key={d} d={d} />)}
          </g>

          {/* Zaehne */}
          <g opacity="0.62" strokeWidth="1" fill="url(#mythic-stroke)" fillOpacity="0.14">
            {MYTHIC_TEETH.map((d) => <path key={d} d={d} />)}
          </g>

          {/* Auge — das einzige Element mit spuerbarer Fuellung. Ohne es
              bleibt der Umriss eine Form; mit ihm wird er ein Wesen. */}
          <g opacity="0.92" strokeWidth="1.2" fill="url(#mythic-stroke)" fillOpacity="0.42">
            {MYTHIC_EYE.map((d) => <path key={d} d={d} />)}
          </g>

          {/* Schraffur — Volumen durch Dichte */}
          <g opacity="0.38" strokeWidth="0.85">
            {MYTHIC_HATCH.map((d) => <path key={d} d={d} />)}
          </g>

          {/* Funken */}
          <g opacity="0.62" fill="url(#mythic-stroke)" stroke="none">
            {MYTHIC_SPARKS.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
          </g>
        </g>
      </svg>

      {/* 5 — BLOOM.
          Weiches Licht ueber der Gravur. Es nimmt der Zeichnung die Haerte und
          bindet sie in den Raum ein — ohne diese Ebene sieht die Figur
          aufgeklebt aus. */}
      <div
        className="absolute left-[34%] top-[-8%] h-[560px] w-[46%] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(closest-side, rgba(120,150,255,0.14), transparent)' }}
      />

      {/* 6 — PARTIKEL. Ruhig gesetzte Punkte, keine Bewegung. */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {PARTIKEL.map(([x, y, r, o]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r / 10} fill="white" opacity={o} />
        ))}
      </svg>

      {/* Abschluss nach unten: Der Kopf endet nicht an einer Kante, sondern
          laeuft in den Seitengrund aus. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#070810]" />
    </div>
  );
}
