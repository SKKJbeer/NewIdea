// Zentrale Content-Regeln — EINE Quelle für Build-Tests (content-compliance.test.ts)
// UND Laufzeit-Validierung (guide-generator/article-generator).
// Quelle der Regeln: CLAUDE.md → Content-Wahrheitspflicht + Content-Tonalität + Schreibstil.

export const PRICE_IN_TEXT = /\d+(?:[.,]\d+)?\s*(?:€|EUR\b|Euro\b|\$|Dollar\b)/;
export const FIRST_PERSON = /\b(?:ich|Ich)\b/;
export const PERSONA_NAME = /\bMarco\b/i;
export const BUY_ADVICE =
  /kaufenswert|pflichtkauf|kaufchance|kaufzeitpunkt|jetzt kaufen|jetzt zuschlagen|finger weg|geheimtipp|ich empfehle|solltest (?:du )?(?:jetzt )?kaufen|rendite|% des budgets/i;
// KI-Floskeln (siehe .claude/commands/schreibstil.md)
export const AI_PHRASES =
  /atemberaubend|revolutionär|bahnbrechend|faszinierend|spektakulär|hier ein überblick|in der heutigen zeit|tauchen wir|zusammenfassend lässt sich|es ist wichtig zu beachten|abschließend lässt sich|fazit:|in diesem artikel/i;
// Moderner Emoji-Block + kuratierte Symbol-Emojis (⚠⚡⛔✅✨❌⭐ + Variation
// Selector). Kartensymbole wie ●◆★ sind legitime Fachzeichen und bleiben erlaubt —
// deshalb KEIN pauschaler ☀-➿-Bereich (der enthält ★ U+2605).
export const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2B00}-\u{2BFF}\u{FE0F}\u{26A0}\u{26A1}\u{26D4}\u{2705}\u{2728}\u{274C}\u{274E}\u{2753}\u{2757}\u{2764}]/u;

// ── BEHAUPTETE URSACHEN ─────────────────────────────────────────────────────
//
// ANLASS: Im Marktbericht KW 30 stand „Der Grund liegt in der frühen Set-Phase:
// Nachfrage nach den Team-Rocket-Motiven trifft auf ein Angebot, das sich noch
// sortiert." und „das Angebot deckt die Nachfrage". CardBeacon misst Preise.
// Angebot, Nachfrage und Aufmerksamkeit misst es NICHT. Aus einer Preisänderung
// auf ihre Ursache zu schließen ist eine Erfindung — sie klingt nur deshalb
// nicht wie eine, weil sie plausibel ist.
//
// WAS ERLAUBT BLEIBT: dieselbe Überlegung, als Überlegung gekennzeichnet.
// „Eine mögliche Erklärung ist …", „Das könnte zusammenhängen mit …",
// „Historisch folgte auf … häufig …". Der Unterschied ist nicht Kosmetik: Der
// Leser erfährt, ob er eine Messung oder eine Vermutung liest.
//
// GEMESSEN → „X ist um 22,2 % gestiegen."
// VERMUTET → „Eine mögliche Erklärung ist die frühe Set-Phase."
// VERBOTEN → „X ist gestiegen, weil die Nachfrage anzieht."
export const CAUSAL_CLAIM =
  /der grund (?:liegt|dafür|hierfür|ist)|die ursache (?:liegt|ist|dafür)|grund (?:dafür|hierfür) ist|weil die nachfrage|weil das angebot|aufgrund (?:der|steigender|sinkender) nachfrage|angebot deckt die nachfrage|nachfrage (?:trifft|übersteigt|überwiegt)|treibt den preis|getrieben von|bestätigt,? wo|beweist,? dass|zeigt,? dass die nachfrage/i;

/**
 * Kennzeichnungen, die eine Ursachen-Aussage zu einer Vermutung machen.
 *
 * Steht eine davon im selben Text, ist die Ursachen-Regel erfüllt: Der Text
 * legt seine Deutung offen, statt sie als Messung auszugeben.
 */
export const HYPOTHESIS_MARKER =
  /eine mögliche erklärung|möglicherweise|könnte (?:zusammenhängen|damit|daran)|denkbar (?:ist|wäre)|häufig|oft|typischerweise|historisch|in der vergangenheit|erfahrungsgemäß|deutet darauf hin|lässt vermuten/i;

export interface ContentViolation {
  field: string;
  rule: string;
  match: string;
}

/**
 * Prüft Fließtext-Felder gegen alle Content-Regeln.
 * Das Emoji-Verbot gilt seit v2.16.0 ÜBERALL — auch in Überschriften und Tips.
 * Visuelle Anker liefern ausschließlich Lucide-Icons (siehe CLAUDE.md UI-Regeln).
 * `emojiFields` bleibt als Parameter für Spezialfälle, Default = alle Felder.
 */
export function findViolations(
  texts: Array<[field: string, text: string]>,
  emojiFields: RegExp = /(?:)/,
): ContentViolation[] {
  const violations: ContentViolation[] = [];
  const rules: Array<[string, RegExp]> = [
    ['preis-im-fliesstext', PRICE_IN_TEXT],
    ['erste-person', FIRST_PERSON],
    ['persona-name', PERSONA_NAME],
    ['kaufempfehlung', BUY_ADVICE],
    ['ki-floskel', AI_PHRASES],
  ];

  for (const [field, text] of texts) {
    for (const [rule, regex] of rules) {
      const m = text.match(regex);
      if (m) violations.push({ field, rule, match: m[0] });
    }
    if (emojiFields.test(field)) {
      const m = text.match(EMOJI);
      if (m) violations.push({ field, rule: 'emoji-im-fliesstext', match: m[0] });
    }

    // Ursachen-Regel ZULETZT und mit Ausnahme: Eine gekennzeichnete Vermutung
    // ist erlaubt. Deshalb schlägt sie nur an, wenn im selben Text KEINE
    // Kennzeichnung steht — sonst würde die Regel genau die Formulierung
    // bestrafen, zu der sie hinführen soll.
    const ursache = text.match(CAUSAL_CLAIM);
    if (ursache && !HYPOTHESIS_MARKER.test(text)) {
      violations.push({ field, rule: 'behauptete-ursache', match: ursache[0] });
    }
  }
  return violations;
}
