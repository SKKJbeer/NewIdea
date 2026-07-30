// Sichere Einbettung von JSON-LD (strukturierte Daten für Suchmaschinen).
//
// DAS PROBLEM: `JSON.stringify` maskiert `</script>` NICHT. Landet der Wert
// über `dangerouslySetInnerHTML` in einem `<script>`-Block, beendet ein
// Kartenname wie
//
//     Glurak</script><script>alert(document.cookie)</script>
//
// den Block vorzeitig — der Rest wird als ausführbares Skript geparst. Das ist
// die klassische XSS-Lücke bei strukturierten Daten.
//
// WOHER DIE DATEN KOMMEN: Kartennamen und Set-Namen stammen aus der externen
// TCG-API, Titel aus der KI-Generierung, und auf der Suchseite floss die
// SUCHANFRAGE DES NUTZERS ungefiltert hinein — ein präparierter Link genügte.
// Keine dieser Quellen ist vertrauenswürdig.
//
// DIE LÖSUNG: Die Zeichen maskieren, mit denen sich ein Skriptblock verlassen
// lässt. Die Ersetzungen sind gültiges JSON und gültiges JavaScript —
// Suchmaschinen lesen die Daten unverändert.
//
// SCHREIBWEISE: Die beiden Zeilentrenner stehen bewusst als `\u2028`-Sequenz
// im Quelltext, nicht als echtes Zeichen. Ein echtes U+2028 ist in JavaScript
// ein Zeilenumbruch und macht ein Regex-Literal ungültig — der erste Versuch
// dieser Datei ließ sich deshalb nicht übersetzen.

const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  // Zeilentrenner: in JSON erlaubt, in JavaScript-Quelltext nicht.
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Serialisiert Daten sicher für die Einbettung in einen `<script>`-Block.
 *
 * Immer über diese Funktion gehen — niemals `JSON.stringify` direkt in
 * `dangerouslySetInnerHTML`.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (zeichen) => ESCAPES[zeichen]);
}

/**
 * Maskiert Text für die Einbettung in HTML-Attribute und -Inhalte.
 *
 * Gebraucht überall dort, wo eine Zeichenkette in handgebautes HTML fließt
 * (z. B. die Newsletter-Vorlage), statt von React gerendert zu werden — React
 * maskiert selbst, handgebautes HTML nicht.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
