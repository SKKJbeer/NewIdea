// Übersetzt Fehler der KI-Schnittstelle in Klartext.
//
// WARUM: Die häufigsten Ursachen haben nichts mit dem Code zu tun —
// aufgebrauchtes Guthaben, fehlender Schlüssel, Rate-Limit. In der rohen
// Fehlermeldung steckt das als verschachteltes JSON, und in der Oberfläche
// sah es dadurch wie ein Programmfehler aus. Ein Beispiel aus der Praxis:
// Marktbericht, Artikel und Guides schlugen gleichzeitig fehl, die Meldung
// lautete „400 {"type":"error",…}" — dahinter stand schlicht ein leeres
// Guthabenkonto.

export type AiErrorKind =
  | 'no_credit'
  | 'no_key'
  | 'rate_limit'
  | 'overloaded'
  | 'truncated'
  | 'unknown';

export interface AiErrorInfo {
  kind: AiErrorKind;
  /** Satz für die Oberfläche — sagt, WER etwas tun muss. */
  message: string;
  /** Rohe Meldung, gekürzt — nur fürs Log und interne Seiten. */
  raw: string;
}

export function describeAiError(err: unknown): AiErrorInfo {
  const raw = (err instanceof Error ? err.message : String(err ?? '')).slice(0, 500);
  const lower = raw.toLowerCase();

  if (lower.includes('credit balance is too low') || lower.includes('insufficient')) {
    return {
      kind: 'no_credit',
      message:
        'Das Guthaben der KI-Schnittstelle ist aufgebraucht. Unter Plans & Billing bei ' +
        'Anthropic aufladen — danach laufen Marktbericht, Artikel und Guides wieder.',
      raw,
    };
  }
  if (lower.includes('authentication') || lower.includes('invalid x-api-key') || lower.includes('401')) {
    return {
      kind: 'no_key',
      message: 'Der API-Schlüssel wird abgelehnt. ANTHROPIC_API_KEY in Vercel prüfen.',
      raw,
    };
  }
  if (lower.includes('rate_limit') || lower.includes('429')) {
    return {
      kind: 'rate_limit',
      message: 'Zu viele Anfragen in kurzer Zeit. In ein paar Minuten erneut versuchen.',
      raw,
    };
  }
  if (lower.includes('overloaded') || lower.includes('529')) {
    return {
      kind: 'overloaded',
      message: 'Die KI-Schnittstelle ist gerade überlastet. Später erneut versuchen.',
      raw,
    };
  }
  if (lower.includes('max_tokens')) {
    return {
      kind: 'truncated',
      message: 'Die Antwort wurde vom Token-Limit abgeschnitten — max_tokens erhöhen.',
      raw,
    };
  }
  return {
    kind: 'unknown',
    message: 'Die Erzeugung ist fehlgeschlagen. Die Ursache steht im Server-Log.',
    raw,
  };
}

/** True, wenn die Ursache beim Konto liegt und nicht am Code. */
export function isBillingProblem(kind: AiErrorKind): boolean {
  return kind === 'no_credit' || kind === 'no_key';
}
