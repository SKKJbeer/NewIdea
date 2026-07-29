// Zahlenformatierung — EINE Quelle für die gesamte Oberfläche.
//
// Vorgeschichte: Die Seite ist durchgehend deutsch, Preise wurden aber über ~15
// Stellen hinweg mit `toFixed(2)` gesetzt und dadurch englisch ausgegeben
// („235.71 €" statt „235,71 €", „1234.56" statt „1.234,56"). Eine korrekte
// Umsetzung existierte in portfolio.ts, war aber nur dort im Einsatz.
//
// WICHTIG — diese Helfer sind für die ANZEIGE. Nicht verwenden für:
//  - JSON-LD / strukturierte Daten (schema.org verlangt Punkt als Dezimaltrenner)
//  - Werte in Eingabefeldern (müssen wieder parsebar sein)
//  - SVG-Koordinaten

const EUR = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const AMOUNT = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Preis mit Euro-Zeichen und Tausender-Trennung: "1.234,56 €" */
export function formatEur(value: number): string {
  return EUR.format(value);
}


const EUR_ROUNDED = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Gerundeter Preis für kompakte Raster: "4.185 €" (mit Tausenderpunkt). */
export function formatEurRounded(value: number): string {
  return EUR_ROUNDED.format(value);
}

/** Betrag ohne Währungszeichen: "1.234,56" */
export function formatAmount(value: number): string {
  return AMOUNT.format(value);
}

/**
 * Trend in Prozent mit Vorzeichen: "+3,4 %" / "-1,2 %".
 * `withSign: false` für Stellen, an denen das Vorzeichen bereits durch ein
 * Icon oder die Farbe ausgedrückt wird.
 */
export function formatPercent(value: number, { withSign = true, digits = 1 } = {}): string {
  const formatted = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  const sign = withSign && value > 0 ? '+' : '';
  // Geschütztes Leerzeichen (U+00A0) vor dem Prozentzeichen — genau wie Intl es
  // vor dem €-Zeichen setzt. Mit einem normalen Leerzeichen kann der Umbruch
  // zwischen Zahl und Einheit fallen („21,4" am Zeilenende, „%" auf der nächsten),
  // was in schmalen Spalten und in Reel-Captions sichtbar passiert.
  return `${sign}${formatted} %`;
}

/** Kompakter Betrag für Diagramm-Achsen: "1,2k €" ab 1000, sonst "235 €" */
export function formatCompactEur(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value / 1000);
    return `${k}k €`;
  }
  return `${Math.round(value)} €`;
}
