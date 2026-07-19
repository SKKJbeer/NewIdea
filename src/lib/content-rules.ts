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
  }
  return violations;
}
