import type { PmiResult, Breadth, FearGreedResult, SetRank } from './market-metrics';

// MARKTKOMMENTAR — Kennzahlen in Sätzen.
//
// WARUM REGELBASIERT UND NICHT PER SPRACHMODELL: Ein Modell würde hier
// zuverlässig Sätze erzeugen, die gut klingen und mehr behaupten, als gemessen
// ist — „die Erholung setzt sich fort", „Sammler kehren zurück". Beides sind
// Aussagen über Ursachen und Zukunft, für die es in diesen Daten keinen Beleg
// gibt. Diese Datei kann das gar nicht: Jeder Satz hängt an einer Zahl, die
// direkt daneben steht.
//
// GRENZEN, die hier bewusst eingehalten werden:
// - keine Prognose („dürfte", „wird")
// - keine Ursachenbehauptung („weil Sammler …")
// - keine Handlungsempfehlung
// - keine Aussage über Zeiträume, die nicht gemessen wurden
//
// Was bleibt, ist Einordnung: Ist die Bewegung breit oder von wenigen Karten
// getragen? Passt die Richtung des Index zur Marktbreite? Das ist genau das,
// was eine einzelne Prozentzahl NICHT verrät — und der eigentliche Zweck.

export interface BriefSatz {
  text: string;
  /** Die Zahl, auf der der Satz beruht — steht in der Oberfläche daneben. */
  beleg: string;
}

/** Schwelle, ab der eine Indexbewegung nicht mehr als seitwärts gilt. */
const FLACH_GRENZE = 1.0;

/** Marktbreite: darunter/darüber gilt die Bewegung als einseitig getragen. */
const BREITE_SCHWACH = 40;
const BREITE_STARK = 60;

export function marketBrief(
  cbi: PmiResult,
  breite: Breadth,
  stimmung: FearGreedResult,
  sets: SetRank[],
): BriefSatz[] {
  if (!cbi.sufficient || breite.total === 0) {
    return [
      {
        text: 'Für eine Einordnung liegen derzeit nicht genügend gemessene Karten vor.',
        beleg: `${cbi.cardCount} von ${cbi.minCards} nötigen Karten`,
      },
    ];
  }

  const saetze: BriefSatz[] = [];
  const flach = Math.abs(cbi.value) < FLACH_GRENZE;
  const richtung = cbi.value > 0 ? 'im Plus' : 'im Minus';

  // 1. Der Indexstand — und ob er überhaupt eine Richtung hat.
  saetze.push({
    text: flach
      ? `Der Gesamtmarkt bewegt sich über ${cbi.windowDays} Tage kaum.`
      : `Der Gesamtmarkt steht über ${cbi.windowDays} Tage ${richtung}.`,
    beleg: `${INDEX_ZAHL(cbi.value)} preisgewichtet`,
  });

  // 2. Marktbreite gegen Indexrichtung — der eigentliche Erkenntnisgewinn.
  //
  // Ein Index nahe null kann zwei völlig verschiedene Märkte beschreiben: einen,
  // in dem sich nichts bewegt, und einen, in dem starke Gegenbewegungen sich
  // aufheben. Erst die Breite trennt beides.
  const pct = Math.round(breite.pct);
  if (breite.pct < BREITE_SCHWACH) {
    saetze.push({
      text: flach
        ? 'Hinter dem ruhigen Gesamtbild steht eine schmale Basis: Die Mehrheit der gemessenen Karten notiert unter ihrem Vergleichswert.'
        : 'Die Bewegung wird von wenigen Karten getragen — die Mehrheit notiert unter ihrem Vergleichswert.',
      beleg: `${pct} % im Plus (${breite.up} von ${breite.total})`,
    });
  } else if (breite.pct > BREITE_STARK) {
    saetze.push({
      text: 'Die Bewegung ist breit abgestützt: Die Mehrheit der gemessenen Karten liegt über ihrem Vergleichswert.',
      beleg: `${pct} % im Plus (${breite.up} von ${breite.total})`,
    });
  } else {
    saetze.push({
      text: 'Gewinner und Verlierer halten sich ungefähr die Waage.',
      beleg: `${pct} % im Plus (${breite.up} von ${breite.total})`,
    });
  }

  // 3. Sets — nur wenn genügend Sets die Mindest-Stichprobe erreichen.
  // Nur Sets mit echter Messung — ein Set ohne gemessene Karte hat keinen
  // Trend, auch nicht den Wert null.
  const bewegteSets = sets.filter(
    (s): s is SetRank & { avgTrend: number } => typeof s.avgTrend === 'number',
  );
  if (bewegteSets.length >= 2) {
    const bestes = [...bewegteSets].sort((a, b) => b.avgTrend - a.avgTrend)[0];
    const schwaechstes = [...bewegteSets].sort((a, b) => a.avgTrend - b.avgTrend)[0];
    if (bestes.code !== schwaechstes.code) {
      saetze.push({
        text: `Zwischen den Sets liegen ${Math.abs(bestes.avgTrend - schwaechstes.avgTrend).toFixed(1).replace('.', ',')} Prozentpunkte — ${bestes.name} vorn, ${schwaechstes.name} am schwächsten.`, // toFixed erlaubt: Prozentpunkt-Differenz im Fließtext, keine Preisangabe
        beleg: `${bewegteSets.length} Sets mit ausreichender Stichprobe`,
      });
    }
  }

  // 4. Stimmung nur, wenn sie etwas hinzufügt — sonst wiederholt sie die Breite.
  if (stimmung.sufficient && (stimmung.value <= 25 || stimmung.value >= 75)) {
    saetze.push({
      text:
        stimmung.value <= 25
          ? 'Der Stimmungswert liegt im unteren Bereich seiner Skala.'
          : 'Der Stimmungswert liegt im oberen Bereich seiner Skala.',
      beleg: `${stimmung.value} von 100 · ${stimmung.label}`,
    });
  }

  return saetze;
}

/** Prozentzahl im deutschen Format mit Vorzeichen — für den Belegtext. */
function INDEX_ZAHL(v: number): string {
  const gerundet = Math.abs(v).toFixed(1).replace('.', ','); // toFixed erlaubt: Belegtext, keine Preisangabe
  return `${v > 0 ? '+' : v < 0 ? '−' : '±'}${gerundet} %`;
}
