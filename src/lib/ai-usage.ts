// Verbrauchs- und Kostenerfassung für jeden KI-Aufruf.
//
// ANLASS: Ein aufgebrauchtes Guthaben ohne jede Möglichkeit zu sehen, WOFÜR es
// verbraucht wurde. Ohne Erfassung ist jede Erklärung geraten — und die
// naheliegende Vermutung („die paar Texte") war nachweislich falsch: Zwei
// öffentlich erreichbare Endpunkte lösten pro Aufruf eine vollständige
// Opus-Generierung aus.
//
// Grundsatz: Jeder Aufruf wird erfasst, auch der fehlgeschlagene. Ein Aufruf,
// der am Guthaben scheitert, kostet nichts — aber ohne seine Spur sieht es aus,
// als sei gar nichts passiert.

import { getSupabase } from './supabase';

/** Wofür der Aufruf war — die Auswertung gruppiert danach. */
export type AiPurpose =
  | 'artikel'
  | 'guide'
  | 'marktbericht'
  | 'newsletter'
  | 'video-skript'
  | 'social-posts'
  | 'studio-manuell'
  | 'unbekannt';

/**
 * Preise in US-Dollar je Million Token (Stand Juli 2026).
 *
 * Bewusst als Tabelle im Code und nicht in der Datenbank: Die Kosten eines
 * Aufrufs werden zum Zeitpunkt des Aufrufs berechnet und gespeichert. Ändern
 * sich später die Preise, bleiben alte Einträge korrekt.
 */
export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5':    { input: 5,  output: 25 },
  'claude-opus-4-8':  { input: 5,  output: 25 },
  'claude-opus-4-7':  { input: 5,  output: 25 },
  'claude-opus-4-6':  { input: 5,  output: 25 },
  'claude-sonnet-5':  { input: 3,  output: 15 },
  'claude-sonnet-4-6':{ input: 3,  output: 15 },
  'claude-haiku-4-5': { input: 1,  output: 5  },
};

/** Rückfall für unbekannte Modelle — lieber zu hoch schätzen als zu niedrig. */
const FALLBACK_PRICE = { input: 5, output: 25 };

// `null` ist bewusst erlaubt: Das Anthropic-SDK liefert die Cache-Felder als
// `number | null`, wenn kein Cache im Spiel war. Ohne diese Angabe müsste
// jede Aufrufstelle umrechnen — und genau dabei geht eine vergessen.
export interface AiTokenUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/**
 * Kosten eines Aufrufs in US-Dollar.
 *
 * Zwischengespeicherte Eingaben zählen mit: Lesen kostet etwa ein Zehntel,
 * Schreiben etwa das 1,25-fache des normalen Eingabepreises.
 */
export function estimateCostUsd(model: string, usage: AiTokenUsage): number {
  const price = MODEL_PRICES[model] ?? FALLBACK_PRICE;
  const million = 1_000_000;

  const input = (usage.input_tokens ?? 0) * price.input;
  const output = (usage.output_tokens ?? 0) * price.output;
  const cacheRead = (usage.cache_read_input_tokens ?? 0) * price.input * 0.1;
  const cacheWrite = (usage.cache_creation_input_tokens ?? 0) * price.input * 1.25;

  return (input + output + cacheRead + cacheWrite) / million;
}

/** Summe aller abgerechneten Eingabe-Token (inkl. Cache). */
export function totalInputTokens(usage: AiTokenUsage): number {
  return (
    (usage.input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0)
  );
}

export interface AiUsageRecord {
  purpose: AiPurpose;
  model: string;
  usage?: AiTokenUsage;
  ok: boolean;
  /** Klartext-Ursache bei Fehlschlag — niemals der rohe Stacktrace. */
  error?: string;
}

/**
 * Schreibt einen Verbrauchseintrag.
 *
 * Bewusst „fire and forget" mit eigenem try/catch: Die Erfassung darf niemals
 * einen Inhalt verhindern. Fehlt Supabase, passiert schlicht nichts.
 */
export async function recordAiUsage(record: AiUsageRecord): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const usage = record.usage ?? {};
  try {
    const { error } = await sb.from('ai_usage').insert({
      purpose: record.purpose,
      model: record.model,
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_read_tokens: usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
      cost_usd: record.ok ? estimateCostUsd(record.model, usage) : 0,
      ok: record.ok,
      error: record.error ?? null,
    });
    if (error) {
      console.warn('Verbrauchseintrag konnte nicht gespeichert werden:', error.message);
    }
  } catch (err) {
    console.warn('Verbrauchserfassung fehlgeschlagen:', err);
  }
}

// ── Auswertung ──────────────────────────────────────────────────────────────

export interface UsageByPurpose {
  purpose: string;
  calls: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface UsageSummary {
  configured: boolean;
  /** Tabelle fehlt — Setup-SQL nötig. */
  missingTable: boolean;
  error: string | null;
  days: number;
  totalCalls: number;
  failedCalls: number;
  totalCostUsd: number;
  todayCostUsd: number;
  byPurpose: UsageByPurpose[];
}

interface UsageRow {
  purpose: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  ok: boolean | null;
  created_at: string | null;
}

/**
 * Fasst den Verbrauch der letzten `days` Tage zusammen.
 *
 * Die Aggregation läuft bewusst hier und nicht als SQL-View: So braucht es
 * keine zweite Datenbank-Migration, wenn sich die Auswertung ändert.
 */
export function summarize(rows: UsageRow[], days: number, today: string): UsageSummary {
  const byPurpose = new Map<string, UsageByPurpose>();
  let totalCalls = 0;
  let failedCalls = 0;
  let totalCostUsd = 0;
  let todayCostUsd = 0;

  for (const row of rows) {
    const purpose = row.purpose || 'unbekannt';
    const entry = byPurpose.get(purpose) ?? {
      purpose,
      calls: 0,
      failed: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    };

    const cost = Number(row.cost_usd ?? 0);
    entry.calls += 1;
    if (row.ok === false) entry.failed += 1;
    entry.inputTokens += Number(row.input_tokens ?? 0);
    entry.outputTokens += Number(row.output_tokens ?? 0);
    entry.costUsd += cost;
    byPurpose.set(purpose, entry);

    totalCalls += 1;
    if (row.ok === false) failedCalls += 1;
    totalCostUsd += cost;
    if ((row.created_at ?? '').slice(0, 10) === today) todayCostUsd += cost;
  }

  return {
    configured: true,
    missingTable: false,
    error: null,
    days,
    totalCalls,
    failedCalls,
    totalCostUsd,
    todayCostUsd,
    // Teuerster Zweck zuerst — das ist die Frage, die man stellt.
    byPurpose: [...byPurpose.values()].sort((a, b) => b.costUsd - a.costUsd),
  };
}

export const AI_USAGE_SETUP_SQL = `CREATE TABLE IF NOT EXISTS ai_usage (
  id                 BIGSERIAL PRIMARY KEY,
  purpose            TEXT NOT NULL,
  model              TEXT NOT NULL,
  input_tokens       INT NOT NULL DEFAULT 0,
  output_tokens      INT NOT NULL DEFAULT 0,
  cache_read_tokens  INT NOT NULL DEFAULT 0,
  cache_write_tokens INT NOT NULL DEFAULT 0,
  cost_usd           NUMERIC NOT NULL DEFAULT 0,
  ok                 BOOLEAN NOT NULL DEFAULT true,
  error              TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON ai_usage (created_at DESC);`;

/** Liest den Verbrauch aus der Datenbank und fasst ihn zusammen. */
export async function loadUsageSummary(days = 30): Promise<UsageSummary> {
  const leer: UsageSummary = {
    configured: false,
    missingTable: false,
    error: null,
    days,
    totalCalls: 0,
    failedCalls: 0,
    totalCostUsd: 0,
    todayCostUsd: 0,
    byPurpose: [],
  };

  const sb = getSupabase();
  if (!sb) return leer;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await sb
    .from('ai_usage')
    .select('purpose, input_tokens, output_tokens, cost_usd, ok, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    // Postgres 42P01 = Tabelle existiert nicht → Setup-SQL anbieten.
    const missing = error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? '');
    return { ...leer, configured: true, missingTable: missing, error: error.message ?? 'Unbekannter Fehler' };
  }

  const today = new Date().toISOString().slice(0, 10);
  return summarize((data ?? []) as UsageRow[], days, today);
}
