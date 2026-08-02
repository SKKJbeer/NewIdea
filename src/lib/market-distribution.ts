// VERTEILUNG DER BEWEGUNGEN — benannte Bänder statt abstrakter Klassen.
//
// VORHER standen dort acht Balken über einer Achse mit „−20 %  0  +20 %".
// Wer den Markt kennt, liest das. Wer neu ist, sieht ein Diagramm ohne
// Beschriftung und weiß weder, was aufgetragen ist, noch warum es ihn angeht.
//
// Die Fünf-Minuten-Regel wird zur Fünf-SEKUNDEN-Regel: Wenn jemand nach fünf
// Sekunden nicht sagen kann, was er sieht, ist die Grafik falsch — nicht der
// Betrachter.
//
// Deshalb hier:
//   · fünf Bänder statt acht, jedes mit einem Namen in Worten
//   · Anzahl UND Anteil an jedem Band, direkt daneben
//   · ein Satz darunter, der sagt, was die Form bedeutet
//
// WARUM GENAU DIESE GRENZEN: ±2 % ist die Zone, in der eine Preisbewegung bei
// Sammelkarten im Rauschen liegt — Angebotsschwankungen einzelner Verkäufer,
// nicht Marktbewegung. Ab 10 % spricht man von einer Bewegung, die auffällt.
// Die Schwellen sind eine Festlegung, keine Messung; sie stehen deshalb hier
// an einer Stelle und nicht verteilt in der Oberfläche.

export interface Band {
  /** Name in Worten — das, was der Betrachter zuerst liest. */
  label: string;
  /** Kurzform für enge Spalten (Telefon). */
  kurz: string;
  /** Untergrenze in Prozent, einschließlich. */
  von: number;
  /** Obergrenze in Prozent, ausschließlich. */
  bis: number;
  /** Richtung — bestimmt die Farbe. Aufwärts grün, abwärts rot, neutral grau. */
  richtung: -1 | 0 | 1;
  /** Wie stark — bestimmt die Sättigung innerhalb der Richtung. */
  staerke: 'stark' | 'moderat' | 'neutral';
}

export const BAENDER: Band[] = [
  { label: 'Starker Rückgang', kurz: 'Stark −', von: -Infinity, bis: -10, richtung: -1, staerke: 'stark' },
  { label: 'Moderater Rückgang', kurz: 'Mod. −', von: -10, bis: -2, richtung: -1, staerke: 'moderat' },
  { label: 'Unverändert', kurz: 'Neutral', von: -2, bis: 2, richtung: 0, staerke: 'neutral' },
  { label: 'Moderater Anstieg', kurz: 'Mod. +', von: 2, bis: 10, richtung: 1, staerke: 'moderat' },
  { label: 'Starker Anstieg', kurz: 'Stark +', von: 10, bis: Infinity, richtung: 1, staerke: 'stark' },
];

export interface BandWert extends Band {
  anzahl: number;
  /** Anteil an allen gemessenen Karten, 0–100. */
  anteil: number;
}

/** Zählt gemessene Bewegungen in die fünf Bänder. Rein und damit prüfbar. */
export function verteileBaender(trends: number[]): BandWert[] {
  const gesamt = trends.length;
  return BAENDER.map((b) => {
    const anzahl = trends.filter((t) => t >= b.von && t < b.bis).length;
    return { ...b, anzahl, anteil: gesamt > 0 ? (anzahl / gesamt) * 100 : 0 };
  });
}

/**
 * Ein Satz, der sagt, was die Form bedeutet.
 *
 * Ohne ihn ist die Grafik eine Tabelle mit Farben. Der Satz ist die Antwort
 * auf „warum sollte mich das interessieren" — und er beschreibt ausschließlich
 * die gezeigte Verteilung, ohne Ursache und ohne Ausblick.
 */
export function deuteVerteilung(baender: BandWert[]): string {
  const gesamt = baender.reduce((s, b) => s + b.anzahl, 0);
  if (gesamt === 0) return 'Noch keine gemessenen Bewegungen.';

  const summe = (pruef: (b: BandWert) => boolean) =>
    baender.filter(pruef).reduce((s, b) => s + b.anzahl, 0);

  const neutral = summe((b) => b.richtung === 0);
  const hoch = summe((b) => b.richtung === 1);
  const runter = summe((b) => b.richtung === -1);
  const stark = summe((b) => b.staerke === 'stark');
  const anteil = (n: number) => (n / gesamt) * 100;

  // ÜBERGEWICHT WIRD VERGLICHEN, NICHT GEGEN EINE FESTE MARKE GEPRÜFT.
  //
  // Die erste Fassung fragte „liegen mehr als 60 % unten?". Bei 115 unten
  // gegen 52 oben (57 % zu 26 %) fiel sie durch und gab „Gewinner und
  // Verlierer verteilen sich ähnlich stark auf beide Seiten" aus — direkt
  // unter einer Schlagzeile, die das Gegenteil sagte. Zwei Aussagen aus
  // denselben Zahlen, die einander widersprechen, sind schlimmer als eine
  // fehlende.
  //
  // Der Fehler lag in der festen Marke: Sie misst gegen die GESAMTZAHL, und
  // die enthält die unbewegten Karten. Bei vielen unbewegten Karten kann keine
  // Seite 60 % erreichen, obwohl eine doppelt so schwer wiegt wie die andere.
  // Verglichen werden deshalb die beiden Seiten miteinander.
  const seiten = hoch + runter;
  const uebergewicht = seiten > 0 ? Math.max(hoch, runter) / Math.max(Math.min(hoch, runter), 1) : 1;
  const KLARES_UEBERGEWICHT = 1.5;

  if (anteil(neutral) >= 50) {
    return `Über die Hälfte der Karten bewegt sich um weniger als 2 Prozent — der Markt steht weitgehend still.`;
  }
  if (uebergewicht >= KLARES_UEBERGEWICHT && runter > hoch) {
    return `Auf jede Karte im Plus kommen ${(runter / Math.max(hoch, 1)).toFixed(1).replace('.', ',')} im Minus — die Verteilung liegt klar auf der Verlustseite.`; // toFixed erlaubt: Verhältniszahl im Fließtext, keine Preisangabe
  }
  if (uebergewicht >= KLARES_UEBERGEWICHT && hoch > runter) {
    return `Auf jede Karte im Minus kommen ${(hoch / Math.max(runter, 1)).toFixed(1).replace('.', ',')} im Plus — die Verteilung liegt klar auf der Gewinnseite.`; // toFixed erlaubt: Verhältniszahl im Fließtext, keine Preisangabe
  }
  if (anteil(stark) >= 40) {
    return `Ein großer Teil der Karten bewegt sich um mehr als 10 Prozent: Der Markt läuft weit auseinander, statt sich gemeinsam zu bewegen.`;
  }
  return `Gewinner und Verlierer halten sich ungefähr die Waage — es gibt keine gemeinsame Marktrichtung.`;
}
