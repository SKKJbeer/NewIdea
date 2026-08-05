import type { PmiResult, Breadth, SetRank } from './market-metrics';
import { formatCount } from './format';

// DIE MARKT-STORY — was heute passiert ist, in Sätzen statt in Kennzahlen.
//
// DAS PROBLEM, das sie löst: Die Startseite begann mit „−0,2 %", „32 %", „37".
// Wer Pokémon sammelt und nicht aus der Finanzwelt kommt, liest darin nichts.
// Drei Zahlen ohne Bezug sind keine Auskunft, sondern eine Bringschuld an den
// Leser — und die meisten lösen sie nicht ein, sondern gehen wieder.
//
// UNTERSCHIED ZU `market-brief.ts`: Der Brief ist eine LISTE von Einzelsätzen
// mit je einem Beleg — die Einordnung UNTER den Zahlen, für jemanden, der die
// Zahlen schon gesehen hat. Die Story ist ein zusammenhängender Absatz ÜBER
// den Zahlen, für jemanden, der sie noch nicht gesehen hat. Beide ziehen aus
// denselben geprüften Kennzahlen; keiner darf etwas sagen, was der andere
// nicht belegen könnte.
//
// WARUM NICHT PER SPRACHMODELL: Ein Modell schriebe hier zuverlässig „Sammler
// kehren zurück" oder „die Erholung setzt sich fort". Beides sind Aussagen
// über Ursachen und Zukunft, für die diese Daten keinen Beleg hergeben. Diese
// Datei kann das nicht — jeder Halbsatz hängt an einer Zahl, die daneben steht.
//
// GRENZEN, nicht verhandelbar:
//   · keine Prognose („dürfte", „wird", „setzt sich fort")
//   · keine Ursache („weil", „getrieben von")
//   · keine Empfehlung („lohnt sich", „jetzt kaufen")
//   · kein Zeitraum, der nicht gemessen wurde

export interface MarketStory {
  /**
   * Die Schlagzeile — eine Aussage, kein Etikett.
   *
   * „Der Markt steht still" ist eine Aussage. „Marktübersicht" ist ein
   * Etikett. Auf den ersten Bildschirm gehört die Aussage.
   */
  schlagzeile: string;
  /**
   * Zwei bis drei Sätze zusammenhängender Text. Beantwortet in dieser
   * Reihenfolge: Wohin bewegt sich der Markt? Tragen ihn viele Karten oder
   * wenige? Wo genau passiert es?
   */
  absatz: string;
  /** Die Zahlen darunter — damit jede Aussage nachprüfbar bleibt. */
  belege: Array<{ label: string; wert: string }>;
  /** Reicht die Datenlage? Sonst zeigt die Oberfläche den Mangel, nicht eine Story. */
  belastbar: boolean;
}

/** Schwelle, ab der eine Indexbewegung nicht mehr als seitwärts gilt. */
const FLACH_GRENZE = 1.0;
/** Ab hier ist die Bewegung deutlich, nicht nur vorhanden. */
const DEUTLICH_GRENZE = 3.0;

/** Marktbreite: darunter/darüber gilt die Bewegung als einseitig getragen. */
const BREITE_SCHWACH = 40;
const BREITE_STARK = 60;

const prozent = (v: number, stellen = 1) =>
  // toFixed erlaubt: Zahl im Fließtext eines Kommentars, keine Preisangabe
  `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(stellen).replace('.', ',')} %`;

/**
 * Baut die Story aus geprüften Kennzahlen.
 *
 * Rein und ohne Seiteneffekte — deshalb vollständig testbar, und das ist der
 * Punkt: Ein Text, der auf der Startseite steht, muss so prüfbar sein wie die
 * Zahl daneben.
 */
export function marketStory(
  cbi: PmiResult,
  breite: Breadth,
  sets: SetRank[],
): MarketStory {
  if (!cbi.sufficient || breite.total === 0) {
    return {
      schlagzeile: 'Noch nicht genug gemessen',
      absatz:
        `Für eine belastbare Aussage über den Gesamtmarkt fehlen Messwerte. ` +
        `Sobald genügend Karten mit gemessener Preisbewegung vorliegen, steht hier, ` +
        `was sich bewegt hat.`,
      belege: [
        { label: 'Gemessene Karten', wert: `${formatCount(cbi.cardCount)} von ${cbi.minCards} nötigen` },
      ],
      belastbar: false,
    };
  }

  const flach = Math.abs(cbi.value) < FLACH_GRENZE;
  const deutlich = Math.abs(cbi.value) >= DEUTLICH_GRENZE;
  const aufwaerts = cbi.value > 0;
  const pct = Math.round(breite.pct);
  const schmal = breite.pct < BREITE_SCHWACH;
  const breitGetragen = breite.pct > BREITE_STARK;

  // ── Schlagzeile ──────────────────────────────────────────────────────────
  //
  // Sie benennt die SPANNUNG, nicht den Wert. Ein flacher Index bei schmaler
  // Breite ist die interessanteste Lage überhaupt — und genau die, die eine
  // einzelne Prozentzahl verschweigt.
  let schlagzeile: string;
  if (flach && schmal) {
    schlagzeile = 'Ruhig an der Oberfläche, schwach darunter';
  } else if (flach && breitGetragen) {
    schlagzeile = 'Kaum Bewegung, aber breit getragen';
  } else if (flach) {
    schlagzeile = 'Der Markt bewegt sich kaum';
  } else if (aufwaerts && schmal) {
    schlagzeile = 'Aufwärts — getragen von wenigen Karten';
  } else if (aufwaerts && breitGetragen) {
    schlagzeile = deutlich ? 'Breite Aufwärtsbewegung' : 'Leicht aufwärts, auf breiter Basis';
  } else if (aufwaerts) {
    schlagzeile = 'Leicht aufwärts';
  } else if (breitGetragen) {
    // Index im Minus, Mehrheit im Plus: die teuren Karten ziehen nach unten.
    schlagzeile = 'Index im Minus, Mehrheit im Plus';
  } else {
    schlagzeile = deutlich ? 'Breiter Rückgang' : 'Leicht abwärts';
  }

  // ── Absatz ───────────────────────────────────────────────────────────────
  const teile: string[] = [];

  teile.push(
    flach
      ? `Der Gesamtmarkt hat sich über ${cbi.windowDays} Tage kaum bewegt (${prozent(cbi.value)} für die typische Karte).`
      : `Die typische Karte liegt über ${cbi.windowDays} Tage bei ${prozent(cbi.value)}.`,
  );

  if (schmal) {
    teile.push(
      `Getragen wird das von einer Minderheit: Nur ${pct} % der ${formatCount(breite.total)} gemessenen Karten notieren über ihrem Vergleichswert, ${formatCount(breite.down)} darunter.`,
    );
  } else if (breitGetragen) {
    teile.push(
      `Die Bewegung steht auf breiter Basis — ${pct} % der ${formatCount(breite.total)} gemessenen Karten liegen über ihrem Vergleichswert.`,
    );
  } else {
    teile.push(
      `Gewinner und Verlierer halten sich dabei ungefähr die Waage: ${formatCount(breite.up)} von ${formatCount(breite.total)} gemessenen Karten im Plus.`,
    );
  }

  // Sets nennen — das ist der Satz, der aus einer Kennzahl einen Ort macht.
  // „Der Markt fällt" bleibt abstrakt; „151 fällt, Black Bolt steigt" kann man
  // im eigenen Bestand nachsehen.
  const bewegteSets = sets.filter(
    (s): s is SetRank & { avgTrend: number } => typeof s.avgTrend === 'number',
  );
  if (bewegteSets.length >= 2) {
    const sortiert = [...bewegteSets].sort((a, b) => b.avgTrend - a.avgTrend);
    const bestes = sortiert[0];
    const schwaechstes = sortiert[sortiert.length - 1];
    if (bestes.code !== schwaechstes.code) {
      teile.push(
        `Am weitesten auseinander liegen ${bestes.name} (${prozent(bestes.avgTrend)}) und ${schwaechstes.name} (${prozent(schwaechstes.avgTrend)}).`,
      );
    }
  }

  const belege: Array<{ label: string; wert: string }> = [
    { label: `Index ${cbi.windowDays} Tage`, wert: prozent(cbi.value) },
    { label: 'Im Plus', wert: `${formatCount(breite.up)} von ${formatCount(breite.total)}` },
    { label: 'Erfasste Karten', wert: `${formatCount(cbi.cardCount)} Karten · ${formatCount(cbi.setCount)} Sets` },
  ];

  return { schlagzeile, absatz: teile.join(' '), belege, belastbar: true };
}
