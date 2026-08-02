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
import { loadSweepState, heute, seitenGesamt as seitenTotal } from '@/lib/price-sweep';
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
  /** Fortschritt der flächendeckenden Preiserfassung — siehe `SweepHealth`. */
  sweep: SweepHealth | null;
  problems: string[];
  checkedAt: string;
}

/**
 * Zustand der Preiserfassung — die WICHTIGSTE Angabe im Monitoring.
 *
 * WARUM EIGENS: Bisher stand dort nur, dass die Tabelle `price_sweep_state`
 * frisch ist. Sie war das auch — und der Durchlauf hing trotzdem Tag für Tag
 * bei Seite 22 von 82 fest. „Die Tabelle wurde heute angefasst" und „die
 * Arbeit ist fertig" sind zwei verschiedene Aussagen, und nur die zweite
 * beantwortet die Frage, ob die Karten aktuell sind.
 *
 * Das ist Stolperstelle 21 in einer neuen Verkleidung: Monitoring muss
 * ERGEBNISSE zeigen, nicht Konfiguration — und ein Zeitstempel ist hier
 * Konfiguration.
 */
export interface SweepHealth {
  /** Tag, für den der aktuelle Durchlauf zählt. */
  laufTag: string;
  /** Heutiges Datum — weicht es ab, ist der Durchlauf heute nie gestartet. */
  heute: string;
  seite: number;
  seitenGesamt: number;
  gesehen: number;
  kartenGesamt: number;
  /** Anteil der heute erfassten Karten, 0–100. */
  anteil: number;
  fertig: boolean;
  /** Minuten seit der letzten Bewegung. `null`, wenn unbekannt. */
  stillstandMinuten: number | null;
  letzterFehler: string | null;
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
  captured_on DATE PRIMARY KEY,
  value       NUMERIC NOT NULL,
  card_count  INT NOT NULL,
  set_count   INT NOT NULL,
  window_days INT NOT NULL DEFAULT 30,
  updated_at  TIMESTAMPTZ DEFAULT now()
);`,
  // Eigener Kartenindex. Ohne ihn geht JEDE Suche nach außen — gemessen 6 bis
  // 13 Sekunden beim ersten Aufruf eines Begriffs.
  cards_index: `CREATE TABLE IF NOT EXISTS cards_index (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  name_de    TEXT,
  set_name   TEXT NOT NULL DEFAULT '',
  set_code   TEXT NOT NULL DEFAULT '',
  number     TEXT,
  rarity     TEXT NOT NULL DEFAULT '',
  image_url  TEXT NOT NULL DEFAULT '',
  price      NUMERIC NOT NULL DEFAULT 0,
  trend      NUMERIC,
  real_data  BOOLEAN NOT NULL DEFAULT false,
  types      TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ohne diese Indizes durchsucht jede Anfrage die gesamte Tabelle.
-- pg_trgm macht aus ILIKE '%text%' eine indexgestuetzte Suche.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS cards_index_name_trgm
  ON cards_index USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cards_index_name_de_trgm
  ON cards_index USING gin (name_de gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cards_index_preis ON cards_index (price DESC);

ALTER TABLE cards_index ENABLE ROW LEVEL SECURITY;`,
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

export interface ProbeSpec {
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
    table: 'cards_index',
    label: 'Kartenindex',
    effect: 'Suche ohne Abruf bei der Kartendatenbank',
    dateColumn: 'updated_at',
    maxAgeDays: 3,
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

export async function probeTable(spec: ProbeSpec): Promise<TableHealth> {
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

  // ERST die Abfrage MIT Antwortkörper — sie ist die einzige, deren Fehler
  // ankommt.
  //
  // Die Zählabfrage lief früher zuerst, und zwar mit `head: true`. Das ist eine
  // HEAD-Anfrage: Fehlt die Tabelle, antwortet die Datenbankschnittstelle mit
  // 404 und einem LEEREN Körper — es gibt also nichts zu lesen, und der Client
  // liefert `error: null, count: null` zurück. Aus `count ?? 0` wurde dann
  // „Tabelle vorhanden, 0 Zeilen". Genau so meldete das Monitoring die gar nicht
  // existierende Tabelle `market_index` wochenlang als in Ordnung, während jeder
  // Schreibversuch scheiterte — also exakt der stille Ausfall, den diese Datei
  // verhindern soll (Stolperstelle 21).
  const { data, error: leseFehler } = await sb
    .from(spec.table)
    .select(spec.dateColumn)
    .order(spec.dateColumn, { ascending: false })
    .limit(1);

  if (leseFehler) {
    const missing = isMissingTableError(leseFehler);
    return {
      ...base,
      missing,
      error: leseFehler.message || 'Unbekannter Datenbankfehler',
      setupSql: missing ? SETUP_SQL[spec.table] ?? null : null,
    };
  }

  let latest: string | null = null;
  if (data && data.length > 0) {
    // Spaltenname ist dynamisch — Supabase kann den Typ hier nicht ableiten.
    const row = data[0] as unknown as Record<string, unknown>;
    const v = row[spec.dateColumn];
    latest = v == null ? null : String(v);
  }

  // Erst jetzt zählen. Die Tabelle ist an dieser Stelle nachweislich lesbar,
  // also ist ein fehlender Zähler höchstens eine unbekannte Zeilenzahl — nie
  // eine fehlende Tabelle.
  const { count } = await sb.from(spec.table).select('*', { count: 'exact', head: true });
  const rows = count ?? null;

  return {
    ...base,
    ok: true,
    rows,
    latest,
    // Ohne Zähler entscheidet der jüngste Eintrag: Steht dort etwas, ist die
    // Tabelle nicht leer. `null` Zeilen heißt „nicht gezählt", nicht „keine".
    freshness: rows === 0 || (rows === null && !latest)
      ? 'empty'
      : classifyFreshness(latest, spec.maxAgeDays),
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
      sweep: null,
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

  // ── PREISERFASSUNG ──────────────────────────────────────────────────────
  //
  // Die wichtigste Frage der ganzen Seite: Sind die Karten heute aktualisiert
  // worden? Sie wird hier beantwortet, und zwar an der ARBEIT, nicht am
  // Zeitstempel der Tabelle.
  let sweep: SweepHealth | null = null;
  const stand = await loadSweepState();
  if (stand) {
    const heuteStr = heute();
    const seitenGesamt = seitenTotal(stand.totalCards);
    const fertig = seitenGesamt > 0 && stand.nextPage > seitenGesamt;
    const anteil =
      stand.totalCards > 0 ? Math.min(Math.round((stand.seen / stand.totalCards) * 100), 100) : 0;

    // Stillstand messen: Die Tabelle traegt einen Zeitstempel der letzten
    // Bewegung. Steht er lange still und ist der Durchlauf nicht fertig, ist
    // die Kette abgerissen.
    const sweepTabelle = tables.find((t) => t.table === 'price_sweep_state');
    let stillstandMinuten: number | null = null;
    if (sweepTabelle?.latest) {
      const zeit = new Date(sweepTabelle.latest).getTime();
      if (!Number.isNaN(zeit)) stillstandMinuten = Math.round((Date.now() - zeit) / 60_000);
    }

    sweep = {
      laufTag: stand.runDate,
      heute: heuteStr,
      seite: stand.nextPage,
      seitenGesamt,
      gesehen: stand.seen,
      kartenGesamt: stand.totalCards,
      anteil,
      fertig,
      stillstandMinuten,
      letzterFehler: stand.lastError,
    };

    // DREI VERSCHIEDENE STOERUNGEN, drei verschiedene Saetze. Sie in einen zu
    // fassen waere bequem und wuerde die Ursache verschleiern.
    if (stand.runDate !== heuteStr) {
      problems.push(
        `Preiserfassung ist heute nicht gestartet — letzter Durchlauf vom ${stand.runDate}. ` +
          `Die Kartenpreise stammen von diesem Tag.`,
      );
    } else if (!fertig && stillstandMinuten !== null && stillstandMinuten > 20) {
      problems.push(
        `Preiserfassung steht seit ${stillstandMinuten} Minuten bei Seite ${stand.nextPage} von ${seitenGesamt} ` +
          `(${anteil} % der Karten). Die Kette ist abgerissen — die restlichen Karten bekommen heute keinen neuen Preis.`,
      );
    } else if (!fertig) {
      problems.push(
        `Preiserfassung läuft: Seite ${stand.nextPage} von ${seitenGesamt} (${anteil} % der Karten).`,
      );
    }
    if (stand.lastError) {
      problems.push(`Preiserfassung meldet: ${stand.lastError}`);
    }
  }

  return { configured: true, tables, guidePipeline, sweep, problems, checkedAt };
}
