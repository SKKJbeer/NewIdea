// Outcome-Monitoring: Prüft nicht, ob Schlüssel GESETZT sind, sondern ob
// tatsächlich etwas PASSIERT ist.
//
// Hintergrund: Die Guide-Pipeline lief über einen Monat zweimal pro Woche ins
// Leere, ohne dass es auffiel — `saveGeneratedGuide` gab bei fehlender Tabelle
// still `false` zurück, und das Monitoring prüfte nur Env-Variablen. Diese Datei
// schließt genau diese Lücke: echte Zeilen-Zählungen, echte Datumsstände, echte
// Fehlermeldungen aus Postgres.
//
// Bewusst OHNE eigene Tabelle gebaut — alles wird aus den vorhandenen Tabellen
// abgeleitet. Eine neue Tabelle wäre genau die Abhängigkeit, die uns diese Panne
// überhaupt erst eingebrockt hat.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { GUIDE_TOPICS } from './guide-topics';
import { GUIDES } from './guides';

/** Postgres-Fehlercode für „Tabelle existiert nicht". */
const UNDEFINED_TABLE = '42P01';

export type Freshness = 'ok' | 'stale' | 'empty' | 'unknown';

export interface TableHealth {
  table: string;
  label: string;
  effect: string;
  /** Erreichbar und Tabelle vorhanden. */
  ok: boolean;
  /** Tabelle fehlt in der Datenbank (häufigste Ursache stiller Ausfälle). */
  missing: boolean;
  rows: number | null;
  latest: string | null;
  freshness: Freshness;
  /** Klartext-Fehler aus Postgres — nie verschlucken. */
  error: string | null;
  /** Nur gesetzt, wenn die Tabelle fehlt: fertiges SQL zum Anlegen. */
  setupSql: string | null;
}

export interface GuidePipelineHealth {
  generated: number;
  staticGuides: number;
  pendingTopics: number;
  nextTopic: string | null;
  /** Queue hat Themen, aber es wurde noch nie einer erzeugt → Pipeline defekt. */
  stalled: boolean;
}

export interface SystemHealth {
  configured: boolean;
  tables: TableHealth[];
  guidePipeline: GuidePipelineHealth;
  problems: string[];
  checkedAt: string;
}

/** Erkennt „Tabelle existiert nicht" robust über Code UND Meldung. */
export function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  if (e.code === UNDEFINED_TABLE) return true;
  return /relation .* does not exist|could not find the table/i.test(e.message || '');
}

/**
 * Bewertet, ob ein Datenstand noch frisch genug ist.
 * `latest` ist ein ISO-Datum (YYYY-MM-DD oder voller Zeitstempel).
 */
export function classifyFreshness(
  latest: string | null,
  maxAgeDays: number,
  now: Date = new Date(),
): Freshness {
  if (!latest) return 'empty';
  const ts = Date.parse(latest.length <= 10 ? `${latest}T12:00:00Z` : latest);
  if (Number.isNaN(ts)) return 'unknown';
  const ageDays = (now.getTime() - ts) / 86_400_000;
  return ageDays <= maxAgeDays ? 'ok' : 'stale';
}

/** Themen aus der Queue, die noch nicht als Guide existieren. */
export function pendingGuideTopics(existingSlugs: string[]): string[] {
  const have = new Set(existingSlugs);
  return GUIDE_TOPICS.filter((t) => !have.has(t.slug)).map((t) => t.slug);
}

const SETUP_SQL: Record<string, string> = {
  price_snapshots: `CREATE TABLE IF NOT EXISTS price_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  card_id     TEXT NOT NULL,
  card_name   TEXT,
  price       NUMERIC NOT NULL,
  source      TEXT,
  captured_on DATE NOT NULL,
  UNIQUE (card_id, captured_on)
);`,
  // Stand der flächendeckenden Preiserfassung. EINE Zeile, die den
  // Seitenzeiger hält — ohne sie beginnt jeder Aufruf wieder bei Seite 1 und
  // der Durchlauf käme nie über den Anfang der Datenbank hinaus.
  price_sweep_state: `CREATE TABLE IF NOT EXISTS price_sweep_state (
  id          TEXT PRIMARY KEY,
  next_page   INT NOT NULL DEFAULT 1,
  run_date    DATE NOT NULL,
  seen        INT NOT NULL DEFAULT 0,
  saved       INT NOT NULL DEFAULT 0,
  total_cards INT NOT NULL DEFAULT 0,
  last_error  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Ohne diesen Index dauert der Vergleich mit den letzten Messpunkten bei
-- wachsender Tabelle immer länger — er wird pro Seite einmal ausgeführt.
CREATE INDEX IF NOT EXISTS price_snapshots_card_date
  ON price_snapshots (card_id, captured_on DESC);`,
  // Täglicher Indexstand. Zweck ist doppelt: Kartenseiten lesen EINE Zeile
  // statt 250 Karten neu zu holen, und über die Zeit entsteht eine echte
  // Indexhistorie für eine spätere Kurve.
  market_index: `CREATE TABLE IF NOT EXISTS market_index (
  captured_on TIMESTAMPTZ PRIMARY KEY,
  value       NUMERIC NOT NULL,
  card_count  INT NOT NULL,
  set_count   INT NOT NULL,
  window_days INT NOT NULL DEFAULT 30,
  updated_at  TIMESTAMPTZ DEFAULT now()
);`,
  articles: `CREATE TABLE IF NOT EXISTS articles (
  date       DATE PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT,
  content    JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
  generated_guides: `CREATE TABLE IF NOT EXISTS generated_guides (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
  market_reports: `CREATE TABLE IF NOT EXISTS market_reports (
  week_start  DATE PRIMARY KEY,
  week_number INT NOT NULL,
  report_text TEXT,
  top_gainers JSONB,
  top_value   JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);`,
  // Konto-Portfolios. Row Level Security ist hier NICHT optional: Ohne sie
  // könnte jeder angemeldete Nutzer die Bestände aller anderen lesen.
  portfolio_holdings: `CREATE TABLE IF NOT EXISTS portfolio_holdings (
  user_id        UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  card_id        TEXT NOT NULL,
  card_name      TEXT NOT NULL DEFAULT '',
  set_name       TEXT NOT NULL DEFAULT '',
  set_code       TEXT NOT NULL DEFAULT '',
  image_url      TEXT NOT NULL DEFAULT '',
  quantity       INT NOT NULL DEFAULT 1,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  purchase_date  DATE,
  language       TEXT NOT NULL DEFAULT 'EN',
  added_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);

ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Jeder sieht und ändert ausschließlich seine eigenen Positionen.
CREATE POLICY "eigene Positionen lesen"   ON portfolio_holdings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "eigene Positionen anlegen" ON portfolio_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eigene Positionen ändern"  ON portfolio_holdings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eigene Positionen löschen" ON portfolio_holdings
  FOR DELETE USING (auth.uid() = user_id);`,
};

interface ProbeSpec {
  table: string;
  label: string;
  effect: string;
  dateColumn: string;
  maxAgeDays: number;
}

const PROBES: ProbeSpec[] = [
  {
    table: 'price_snapshots',
    label: 'Preis-Schnappschüsse',
    effect: 'Echte Preis-Historie in den Charts',
    dateColumn: 'captured_on',
    maxAgeDays: 2,
  },
  {
    table: 'price_sweep_state',
    label: 'Stand der Preiserfassung',
    effect: 'Flächendeckende Messpunkte über alle Karten',
    dateColumn: 'updated_at',
    maxAgeDays: 2,
  },
  {
    table: 'market_index',
    label: 'Indexstände',
    effect: 'Marktkontext auf Kartenseiten ohne Neuberechnung',
    dateColumn: 'captured_on',
    maxAgeDays: 2,
  },
  {
    table: 'articles',
    label: 'Gespeicherte Artikel',
    effect: 'Blog-Beiträge (So/Do)',
    dateColumn: 'date',
    maxAgeDays: 5,
  },
  {
    table: 'generated_guides',
    label: 'Generierte Guides',
    effect: 'Automatische Evergreen-Guides (Di/Fr)',
    dateColumn: 'created_at',
    maxAgeDays: 10,
  },
  {
    table: 'market_reports',
    label: 'Marktberichte',
    effect: 'Wochenanalyse + Startseiten-Fallback',
    dateColumn: 'created_at',
    maxAgeDays: 10,
  },
  {
    table: 'portfolio_holdings',
    label: 'Konto-Portfolios',
    effect: 'Gespeicherte Portfolios angemeldeter Besucher',
    dateColumn: 'added_at',
    // Kein Cron füllt diese Tabelle — sie wächst nur, wenn jemand etwas
    // einträgt. Ein alter Datenstand ist deshalb kein Fehler.
    maxAgeDays: 3650,
  },
];

async function probeTable(spec: ProbeSpec): Promise<TableHealth> {
  const base: TableHealth = {
    table: spec.table,
    label: spec.label,
    effect: spec.effect,
    ok: false,
    missing: false,
    rows: null,
    latest: null,
    freshness: 'unknown',
    error: null,
    setupSql: null,
  };

  const sb = getSupabase();
  if (!sb) return { ...base, error: 'Supabase nicht konfiguriert' };

  // Zeilen zählen (head: true lädt keine Daten — nur den Zähler)
  const { count, error: countError } = await sb
    .from(spec.table)
    .select('*', { count: 'exact', head: true });

  if (countError) {
    const missing = isMissingTableError(countError);
    return {
      ...base,
      missing,
      error: countError.message || 'Unbekannter Datenbankfehler',
      setupSql: missing ? SETUP_SQL[spec.table] ?? null : null,
    };
  }

  // Neuesten Eintrag holen, um den Datenstand zu bestimmen
  let latest: string | null = null;
  const { data, error: latestError } = await sb
    .from(spec.table)
    .select(spec.dateColumn)
    .order(spec.dateColumn, { ascending: false })
    .limit(1);
  if (!latestError && data && data.length > 0) {
    // Spaltenname ist dynamisch — Supabase kann den Typ hier nicht ableiten.
    const row = data[0] as unknown as Record<string, unknown>;
    const v = row[spec.dateColumn];
    latest = v == null ? null : String(v);
  }

  const rows = count ?? 0;
  return {
    ...base,
    ok: true,
    rows,
    latest,
    freshness: rows === 0 ? 'empty' : classifyFreshness(latest, spec.maxAgeDays),
  };
}

/**
 * Sammelt den echten Betriebszustand: Was steht in der Datenbank, wie alt ist es,
 * und welcher konkrete Fehler verhindert gegebenenfalls das Schreiben.
 */
export async function collectSystemHealth(): Promise<SystemHealth> {
  const checkedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      tables: [],
      guidePipeline: {
        generated: 0,
        staticGuides: GUIDES.length,
        pendingTopics: GUIDE_TOPICS.length,
        nextTopic: GUIDE_TOPICS[0]?.slug ?? null,
        stalled: false,
      },
      problems: ['Supabase ist nicht konfiguriert — es werden keine Daten gespeichert'],
      checkedAt,
    };
  }

  const tables = await Promise.all(PROBES.map((p) => probeTable(p).catch((err): TableHealth => ({
    table: p.table,
    label: p.label,
    effect: p.effect,
    ok: false,
    missing: false,
    rows: null,
    latest: null,
    freshness: 'unknown',
    error: err instanceof Error ? err.message : 'Prüfung fehlgeschlagen',
    setupSql: null,
  }))));

  // Guide-Pipeline gesondert bewerten — sie ist der stille Ausfall gewesen.
  const guideTable = tables.find((t) => t.table === 'generated_guides');
  let existingSlugs: string[] = GUIDES.map((g) => g.slug);
  const sbClient = getSupabase();
  if (guideTable?.ok && sbClient) {
    const { data } = await sbClient.from('generated_guides').select('slug');
    const rows = (data ?? []) as unknown as Array<{ slug?: unknown }>;
    existingSlugs = [...existingSlugs, ...rows.map((r) => String(r.slug ?? ''))];
  }
  const pending = pendingGuideTopics(existingSlugs);
  const generated = guideTable?.rows ?? 0;

  const guidePipeline: GuidePipelineHealth = {
    generated,
    staticGuides: GUIDES.length,
    pendingTopics: pending.length,
    nextTopic: pending[0] ?? null,
    stalled: pending.length > 0 && generated === 0,
  };

  // Klartext-Probleme für die Oberfläche
  const problems: string[] = [];
  for (const t of tables) {
    if (t.missing) {
      problems.push(`Tabelle "${t.table}" fehlt in der Datenbank — ${t.effect} wird nicht gespeichert`);
    } else if (!t.ok) {
      problems.push(`Tabelle "${t.table}" nicht lesbar: ${t.error}`);
    } else if (t.freshness === 'empty') {
      problems.push(`"${t.label}" ist leer — es wurde noch nie etwas gespeichert`);
    } else if (t.freshness === 'stale') {
      problems.push(`"${t.label}" ist veraltet (letzter Eintrag: ${t.latest})`);
    }
  }
  if (guidePipeline.stalled) {
    problems.push(
      `Guide-Pipeline steht: ${guidePipeline.pendingTopics} Themen warten, aber es wurde noch kein Guide erzeugt`,
    );
  }

  return { configured: true, tables, guidePipeline, problems, checkedAt };
}
