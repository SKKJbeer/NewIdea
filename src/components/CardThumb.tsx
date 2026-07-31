import Image from 'next/image';

// KARTENMINIATUR — klein angezeigt, also auch klein geladen.
//
// GEMESSEN am 31.07.2026: Die Startseite lud 2.211 KB an Bildern für ZWÖLF
// Miniaturen von 26 Pixel Breite. Rund 184 KB pro Bild, das auf einem
// Briefmarkenformat landet.
//
// Ursache war kein Versehen im Einzelfall, sondern ein Muster: Die Miniaturen
// waren rohe `<img>`-Tags mit der Bild-Zwischenspeicher-Adresse
// (`/api/img?u=…`). Dieser Proxy tut genau eine Sache — er speichert die
// Antwort der Quelle zwischen. Er verkleinert nichts und wandelt kein Format
// um. Der Bildoptimierer von Next kam damit nie zum Zug, und niemandem fiel es
// auf, weil die Bilder ja korrekt aussahen.
//
// Diese Komponente gibt die ROHE Adresse der Quelle an `next/image`. Das ist
// bewusst NICHT die Proxy-Adresse: Der Optimierer lehnt lokale Proxy-Adressen
// mit verschachtelter Abfrage ab (HTTP 400) — das hat in diesem Projekt schon
// einmal das große Kartenbild verschwinden lassen. `images.pokemontcg.io` steht
// in `remotePatterns`, und der Optimierer hält seine Ergebnisse 31 Tage vor;
// den Zwischenspeicher des Proxys braucht es hier also gar nicht.
//
// Feste Breite und Höhe statt `fill`: Miniaturen stehen in Textzeilen, nicht in
// positionierten Kästen — und eine feste Größe reserviert den Platz, bevor das
// Bild da ist. Genau das hält den Layout-Versatz bei null.

interface Props {
  src: string;
  /** Leer lassen, wenn die Zeile den Namen ohnehin nennt — sonst liest ein
   *  Bildschirmleser jede Karte doppelt vor. */
  alt?: string;
  width: number;
  height: number;
  className?: string;
}

export function CardThumb({ src, alt = '', width, height, className = '' }: Props) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      // Ohne `sizes` nimmt der Optimierer die Layoutbreite an — bei fester
      // Breite ist das genau richtig, und der doppelte Wert deckt Bildschirme
      // mit hoher Pixeldichte ab.
      sizes={`${width * 2}px`}
      className={className}
      loading="lazy"
    />
  );
}
