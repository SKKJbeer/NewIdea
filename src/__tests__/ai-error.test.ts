import { describe, it, expect } from 'vitest';
import { describeAiError, isBillingProblem } from '@/lib/ai-error';

// Anlass: Marktbericht, Artikel und Guides schlugen gleichzeitig fehl. Die
// Meldung lautete `400 {"type":"error","error":{...}}` — es sah nach einem
// Programmfehler aus. Dahinter stand ein leeres Guthabenkonto.
//
// Diese Übersetzung entscheidet, ob jemand stundenlang im Code sucht oder
// binnen Sekunden weiß, dass er aufladen muss.

const GUTHABEN =
  '400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is ' +
  'too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."}}';

describe('describeAiError', () => {
  it('erkennt ein aufgebrauchtes Guthaben', () => {
    const info = describeAiError(new Error(GUTHABEN));
    expect(info.kind).toBe('no_credit');
    expect(info.message).toMatch(/Guthaben/);
    expect(info.message).toMatch(/aufladen/i);
  });

  it('erkennt einen abgelehnten Schlüssel', () => {
    expect(describeAiError(new Error('401 authentication_error: invalid x-api-key')).kind).toBe('no_key');
  });

  it('erkennt ein Rate-Limit', () => {
    expect(describeAiError(new Error('429 rate_limit_error')).kind).toBe('rate_limit');
  });

  it('erkennt eine Überlastung', () => {
    expect(describeAiError(new Error('529 overloaded_error')).kind).toBe('overloaded');
  });

  it('erkennt eine abgeschnittene Antwort', () => {
    expect(describeAiError(new Error('stop_reason war max_tokens')).kind).toBe('truncated');
  });

  it('gibt bei unbekannten Fehlern einen brauchbaren Satz zurück', () => {
    const info = describeAiError(new Error('irgendwas Unerwartetes'));
    expect(info.kind).toBe('unknown');
    expect(info.message.length).toBeGreaterThan(20);
  });

  it('verkraftet Nicht-Fehler-Werte', () => {
    for (const wert of [null, undefined, 'text', 42, {}]) {
      expect(() => describeAiError(wert)).not.toThrow();
      expect(describeAiError(wert).kind).toBe('unknown');
    }
  });

  it('kürzt die rohe Meldung', () => {
    // Rohe Meldungen können ganze Antworten enthalten — die gehören nicht
    // ungefiltert in ein Log und erst recht nicht in eine Antwort.
    const info = describeAiError(new Error('x'.repeat(5000)));
    expect(info.raw.length).toBeLessThanOrEqual(500);
  });

  it('nennt in der Nutzer-Meldung keine internen Details', () => {
    const info = describeAiError(new Error('Error at /var/task/node_modules/x.js: sk-ant-geheim'));
    expect(info.message).not.toContain('/var/task');
    expect(info.message).not.toContain('sk-ant');
  });
});

describe('isBillingProblem', () => {
  it('trennt Konto-Ursachen von technischen', () => {
    expect(isBillingProblem('no_credit')).toBe(true);
    expect(isBillingProblem('no_key')).toBe(true);
    expect(isBillingProblem('rate_limit')).toBe(false);
    expect(isBillingProblem('truncated')).toBe(false);
    expect(isBillingProblem('unknown')).toBe(false);
  });
});
