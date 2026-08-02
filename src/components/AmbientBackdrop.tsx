import { CREATURE_LINES, ENERGY_ARC } from '@/lib/creature-art';
import { CARD_FAN, CARD_W, CARD_H, glyphFor } from '@/lib/card-motifs';

// HINTERGRUND-EBENEN — Atmosphäre ohne Tapete.
//
// AUSGANGSLAGE: Fast reines Schwarz auf jeder Seite, darauf schwarze Karten mit
// grauen Rahmen. Fachlich sauber und optisch tot — ein Terminal, das ebenso gut
// Anleihen anzeigen könnte. Wer Pokémon sammelt, erkennt darin nichts wieder.
//
// GEGENMASSNAHME IN DREI EBENEN, von schwach nach stark:
//
//   1. Grundton — Beinahe-Schwarz mit einem Stich ins Blaue statt #000.
//   2. Umgebungslicht + Struktur — radiale Lichthöfe, Höhenlinien, Kreaturen-
//      Linienkunst. Alles unter 5 % Deckkraft.
//   3. Die Karten selbst — sie liefern die Farbe, nicht die Oberfläche.
//
// Diese Datei ist Ebene 2. Ebene 1 steht in `ui.ts` (`SURFACE.page`), Ebene 3
// in `collector.ts`.
//
// WARUM MODI STATT EINES HINTERGRUNDS: Derselbe Hintergrund auf jeder Seite
// erzeugt einen einzigen Raum. Ein Markt-Dashboard, eine Kartenseite und ein
// Fließtext haben aber verschiedene Aufgaben — und Research verträgt gar keine
// Kreaturen hinter 1.500 Wörtern. Wenige klar benannte Modi statt Beliebigkeit.
//
// KEIN NACHGEZEICHNETES ARTWORK. Die Linienkunst in `creature-art.ts` ist
// eigenständig gezeichnet: Bögen, Kanten, Energiebahnen. Sie darf an ein
// Drachenwesen erinnern, ist aber keine Kopie und keine Nachzeichnung — das ist
// nicht nur eine Rechtsfrage, sondern der Unterschied zwischen einer Marke und
// einer Fanseite.
//
// LEISTUNG: reines SVG und CSS-Verläufe. Kein Bild, kein Video, keine Leinwand,
// kein WebGL, keine dauerhafte Animation. `aria-hidden`, damit Hilfsmittel
// nichts davon vorlesen.

export type BackdropMode = 'markt' | 'karte' | 'set' | 'sammlung' | 'research';

interface Props {
  mode: BackdropMode;
  /** Akzentfarbe als rgba für den Lichthof — kommt aus `collector.ts`. */
  akzent?: string;
  /**
   * Energietyp der Karte bzw. des Sets. Setzt das Elementzeichen im Grund.
   *
   * Die Zeichen sind EIGENE Zeichnungen (`card-motifs.ts`), nicht die Symbole
   * des Spiels: Eine Flamme ist eine Flamme. Ohne bekannten Typ erscheint
   * keins — ein beliebiges Zeichen wäre eine Behauptung über die Karte.
   */
  typ?: string;
  className?: string;
}

/** Deckkraft der Linienkunst je Modus. Mobil greift zusätzlich `sm:`-Anhebung. */
const STAERKE: Record<BackdropMode, { linien: string; kreatur: string | null; karten: string | null }> = {
  // Der Marktkopf trägt die stärkste Signatur — dort entscheidet der erste Blick.
  markt: { linien: 'opacity-[0.05]', kreatur: 'opacity-[0.028] sm:opacity-[0.038]', karten: 'opacity-[0.03] sm:opacity-[0.04]' },
  // Kartenseite: Die Karte selbst ist der Blickfang und liefert über `akzent`
  // schon die Farbe. Keine Kreatur, aber die Kartenumrisse — sie stellen die
  // eine Karte in eine Sammlung.
  karte: { linien: 'opacity-[0.035]', kreatur: null, karten: 'opacity-[0.022] sm:opacity-[0.03]' },
  set: { linien: 'opacity-[0.04]', kreatur: 'opacity-[0.02] sm:opacity-[0.028]', karten: 'opacity-[0.03] sm:opacity-[0.042]' },
  // Sammlung: hier liegen die echten Karten des Nutzers auf dem Bildschirm.
  // Gezeichnete Umrisse daneben wären eine Verdopplung.
  sammlung: { linien: 'opacity-[0.03]', kreatur: null, karten: null },
  // Research bekommt KEINE Motive. Lesbarkeit zuerst — hinter 1.500 Wörtern
  // ist jede Struktur eine Störung.
  research: { linien: 'opacity-[0.02]', kreatur: null, karten: null },
};

export function AmbientBackdrop({ mode, akzent, typ, className = '' }: Props) {
  const stufe = STAERKE[mode];
  const glyph = glyphFor(typ);

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* EBENE A — radiale Lichthöfe.
          Zwei, deutlich versetzt: Ein einzelner mittiger Hof sieht aus wie ein
          Vignettierungsfehler. Der zweite nimmt die Akzentfarbe auf, wenn eine
          übergeben wird — so färbt die Karte den Raum, nicht die Oberfläche. */}
      <div
        className="absolute -left-[10%] -top-[30%] h-[60vh] w-[70vw] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,0.10), transparent)' }}
      />
      <div
        className="absolute -right-[15%] top-[10%] h-[55vh] w-[60vw] rounded-full blur-[130px]"
        style={{
          background: akzent
            ? `radial-gradient(closest-side, ${akzent}, transparent)`
            : 'radial-gradient(closest-side, rgba(56,189,248,0.07), transparent)',
        }}
      />

      {/* DRITTER HOF — nur wo eine Akzentfarbe übergeben wird.
          Der Hof oben rechts liegt in der Ecke; auf der Kartenseite steht das
          Artwork aber links. Ohne diesen zweiten Auftrag blieb die Elementfarbe
          dort, wo niemand hinsieht, und eine Feuer-Karte unterschied sich von
          einer Wasser-Karte praktisch nicht. Er sitzt hinter der Bildspalte und
          folgt derselben Quelle — dem Energietyp, nicht einer Farbanalyse. */}
      {akzent && (
        <div
          className="absolute left-[8%] top-[6%] h-[52vh] w-[46vw] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(closest-side, ${akzent}, transparent)` }}
        />
      )}

      {/* EBENE B — Höhenlinien. Ungleichmäßig gesetzt: Berechnete Abstände
          ergeben ein Raster, und ein Raster ist kein Gelände. */}
      <svg
        className={`absolute inset-0 h-full w-full text-slate-300 ${stufe.linien}`}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 600"
        fill="none"
      >
        <defs>
          <linearGradient id="ab-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
            <stop offset="65%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="ab-mask">
            <rect width="1200" height="600" fill="url(#ab-fade)" />
          </mask>
        </defs>
        <g mask="url(#ab-mask)" stroke="currentColor" fill="none">
          {CREATURE_LINES.map((d, i) => (
            <path key={d} d={d} strokeWidth={i % 3 === 0 ? 1.1 : 0.6} />
          ))}
        </g>
      </svg>

      {/* EBENE C — Kreaturen-Linienkunst.
          Rechts oben, teils außerhalb des Bildausschnitts. Bewusst NICHT
          zentriert: Ein zentriertes Motiv liest sich als Hintergrundbild, ein
          angeschnittenes als Textur.

          AUF DEM TELEFON NICHT AUSGEBLENDET, SONDERN WEITER HINAUSGESCHOBEN.
          Der erste Entwurf setzte `hidden sm:block` — und damit sah die Hälfte
          der Besucher von der Sammler-Ebene nichts. Bei 390 px Breite läge das
          Motiv allerdings direkt hinter der Leitzahl, deshalb steht es dort
          weiter rechts und schwächer (Grundwert in STAERKE, `sm:` hebt an).
          Sichtbar bleibt der Rand der Flügelbahnen. */}
      {stufe.kreatur && (
        <svg
          className={`absolute -right-[42%] -top-[12%] h-[125%] w-[95%] text-violet-200 sm:-right-[18%] sm:w-[75%] ${stufe.kreatur}`}
          viewBox="0 0 600 700"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ENERGY_ARC.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      )}

      {/* EBENE D — aufgefächerte Kartenumrisse.
          Das direkteste Sammler-Zeichen, das ohne fremdes Material auskommt:
          63:88 ist ein Format, kein Werk. Fünf Umrisse, ungleichmäßig gedreht
          wie hingelegte Karten — gleichmäßige Winkel sähen aus wie ein
          Diagramm. Unten links, wo auf keiner Seite eine Zahl steht. */}
      {stufe.karten && (
        <svg
          className={`absolute -bottom-[22%] -left-[8%] h-[95%] w-[62%] text-slate-200 sm:w-[46%] ${stufe.karten}`}
          viewBox="0 0 600 400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          {CARD_FAN.map((k) => (
            <g key={`${k.x}-${k.rot}`} transform={`rotate(${k.rot} ${k.x + CARD_W / 2} ${k.y + CARD_H / 2})`}>
              <rect x={k.x} y={k.y} width={CARD_W} height={CARD_H} rx="9" />
              {/* Die Bildfläche der Karte — der obere Ausschnitt, den jede
                  Sammelkarte hat. Erst damit liest sich das Rechteck als Karte
                  und nicht als Kachel. */}
              <rect x={k.x + 11} y={k.y + 20} width={CARD_W - 22} height={CARD_H * 0.46} rx="3" />
            </g>
          ))}
        </svg>
      )}

      {/* EBENE E — Elementzeichen des Energietyps.
          Eigene Zeichnung, nicht das Symbol des Spiels (siehe card-motifs.ts).
          Groß und stark angeschnitten: Ein vollständig sichtbares Zeichen wäre
          ein Logo, ein angeschnittenes ist Struktur. */}
      {glyph && (
        <svg
          className="absolute -right-[6%] bottom-[4%] h-[42%] w-auto text-slate-100 opacity-[0.035] sm:opacity-[0.05]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {glyph.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      )}
    </div>
  );
}
