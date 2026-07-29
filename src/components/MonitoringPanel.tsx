'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Key, KeyRound, Link2, FileText, Zap, Server, RefreshCw, ExternalLink,
  ChevronDown, ChevronUp, BookMarked, GitBranch, TriangleAlert, CircleAlert, Activity,
} from 'lucide-react';
import { recentPublishDates } from '@/lib/publish-days';

interface ApiKeyStatus {
  set: boolean;
  working?: boolean;
  required: boolean;
  label: string;
  envVar: string;
  hint: string;
  effect: string;
}

interface AffiliateStatus {
  label: string;
  url: string | null;
  isDefault: boolean;
  isBroken: boolean;
  env: string;
  hint: string;
}

interface LegalStatus {
  label: string;
  hasPlaceholders: boolean;
  placeholders: string[];
  path: string;
  hint: string;
}

interface FeatureStatus {
  working: boolean;
  label: string;
  effect: string;
}

interface SkillInfo {
  name: string;
  title: string;
  description: string;
  lastModified: string;
}

interface WorkflowInfo {
  name: string;
  endpoint: string;
  schedule: string;
  scheduleLabel: string;
  description: string;
  active: boolean;
  trigger: string;
}

interface TableHealth {
  table: string;
  label: string;
  effect: string;
  ok: boolean;
  missing: boolean;
  rows: number | null;
  latest: string | null;
  freshness: 'ok' | 'stale' | 'empty' | 'unknown';
  error: string | null;
  setupSql: string | null;
}

interface SystemHealth {
  configured: boolean;
  tables: TableHealth[];
  guidePipeline: {
    generated: number;
    staticGuides: number;
    pendingTopics: number;
    nextTopic: string | null;
    stalled: boolean;
  };
  problems: string[];
  checkedAt: string;
}

interface MonitoringData {
  build: { version: string; siteUrl: string | null; siteUrlMissing: boolean; nodeEnv: string };
  apiKeys: Record<string, ApiKeyStatus>;
  affiliates: Record<string, AffiliateStatus>;
  legal: Record<string, LegalStatus>;
  features: { supabaseConnected: boolean } & Record<string, FeatureStatus>;
  health: SystemHealth | null;
  skills: SkillInfo[];
  workflows: WorkflowInfo[];
  checkedAt: string;
}

const FRESHNESS_BADGE: Record<TableHealth['freshness'], { label: string; cls: string }> = {
  ok:      { label: 'aktuell',  cls: 'bg-emerald-500/10 text-emerald-400' },
  stale:   { label: 'veraltet', cls: 'bg-amber-500/10 text-amber-400' },
  empty:   { label: 'leer',     cls: 'bg-rose-500/10 text-rose-400' },
  unknown: { label: 'unklar',   cls: 'bg-slate-500/10 text-slate-400' },
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value.length <= 10 ? `${value}T12:00:00Z` : value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Betriebszustand: zeigt, was tatsächlich passiert ist (echte Zeilen, Datenstände,
 * Klartext-Fehler) — nicht nur, ob Schlüssel gesetzt sind. Fehlt eine Tabelle,
 * steht hier das fertige SQL zum Anlegen.
 */
function HealthSection({ health, onRefresh }: { health: SystemHealth; onRefresh: () => void }) {
  // Welcher Auslöser gerade läuft (nur einer gleichzeitig — alle drei rufen
  // dieselbe KI und dieselbe Datenbank an).
  const [busy, setBusy] = useState<null | 'guide' | 'report' | 'articles'>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const setResult = (key: string, text: string) => setResults((r) => ({ ...r, [key]: text }));

  async function runGuide() {
    setBusy('guide');
    setResult('guide', '');
    try {
      const res = await fetch('/api/guides/generate', { method: 'POST' });
      const json = await res.json();
      if (json.status === 'created') {
        setResult('guide', `Guide erstellt: ${json.title}`);
        onRefresh();
      } else if (json.status === 'rejected_quality') {
        setResult('guide', `Vom Qualitäts-Gate abgelehnt (${json.violations?.length ?? 0} Regelverstöße) — Text war regelwidrig, kein Speicher-Problem.`);
      } else if (json.status === 'all_done') {
        setResult('guide', 'Alle Themen der Warteschlange sind bereits erzeugt.');
      } else if (json.status === 'no_api_key') {
        setResult('guide', 'ANTHROPIC_API_KEY fehlt.');
      } else {
        setResult('guide', `Fehlgeschlagen: ${json.error || 'unbekannt'}`);
      }
    } catch {
      setResult('guide', 'Aufruf fehlgeschlagen.');
    } finally {
      setBusy(null);
    }
  }

  async function runMarketReport() {
    setBusy('report');
    setResult('report', '');
    try {
      const res = await fetch('/api/market-report/generate', { method: 'POST' });
      const json = await res.json();
      const week = json.weekNumber ? `KW ${json.weekNumber}` : 'Woche';
      if (json.status === 'created') {
        setResult('report', `${week} erstellt — ${json.reportChars} Zeichen, ${json.cards ?? '?'} Karten ausgewertet.`);
        onRefresh();
      } else if (json.status === 'no_cards') {
        setResult('report', 'Die TCG-API hat keine Kartendaten geliefert — später erneut versuchen (Rate-Limit).');
      } else if (json.status === 'rejected_too_short') {
        setResult('report', `Vom Mindestmaß-Gate abgelehnt (${json.reportChars} Zeichen) — nicht gespeichert, damit kein Platzhalter live geht.`);
      } else if (json.status === 'save_failed') {
        setResult('report', `Text erzeugt, aber Speichern fehlgeschlagen: ${json.error || 'unbekannt'}`);
      } else {
        setResult('report', `Fehlgeschlagen: ${json.error || 'unbekannt'}`);
      }
    } catch {
      setResult('report', 'Aufruf fehlgeschlagen.');
    } finally {
      setBusy(null);
    }
  }

  /**
   * Ersetzt gespeicherte Fallback-Artikel durch echte Generierungen.
   *
   * Die Schleife läuft im Browser, nicht im Server: Ein einzelner Aufruf darf
   * 300 s dauern, acht hintereinander würden die Funktion abbrechen. Artikel,
   * die bereits echt sind, werden vom Endpunkt unverändert zurückgegeben —
   * der Lauf ist damit gefahrlos wiederholbar.
   */
  async function runArticles() {
    setBusy('articles');
    const dates = recentPublishDates(8);
    let replaced = 0;
    let stillFallback = 0;
    let failed = 0;

    for (let i = 0; i < dates.length; i++) {
      setResult('articles', `Prüfe ${dates[i].dateLabel} (${i + 1}/${dates.length})…`);
      try {
        const res = await fetch('/api/articles/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dates[i].date }),
        });
        const json = await res.json();
        if (!res.ok) failed++;
        else if (json.isFallback) stillFallback++;
        else replaced++;
      } catch {
        failed++;
      }
    }

    const parts = [`${replaced} echt`];
    if (stillFallback) parts.push(`${stillFallback} weiterhin Ersatztext`);
    if (failed) parts.push(`${failed} fehlgeschlagen`);
    setResult(
      'articles',
      `${dates.length} Termine geprüft: ${parts.join(' · ')}.` +
        (stillFallback ? ' Ersatztexte bedeuten meist: ANTHROPIC_API_KEY fehlt oder die Generierung brach ab.' : ''),
    );
    setBusy(null);
    onRefresh();
  }

  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
      <SectionTitle icon={Activity} title="Betriebszustand (was wirklich passiert)" />

      {!health.configured ? (
        <p className="text-[11px] text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
          <TriangleAlert size={11} className="inline mr-1" />
          Supabase nicht konfiguriert — nichts wird dauerhaft gespeichert.
        </p>
      ) : (
        <>
          {health.problems.length > 0 ? (
            <ul className="mb-3 space-y-1">
              {health.problems.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">
                  <CircleAlert size={11} className="shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-[11px] text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
              <CheckCircle2 size={11} className="inline mr-1" />
              Alle Datenbestände vorhanden und aktuell.
            </p>
          )}

          <div className="space-y-1.5">
            {health.tables.map((t) => {
              const badge = FRESHNESS_BADGE[t.freshness];
              return (
                <div key={t.table} className="border border-[#2a2a3a] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <StatusIcon ok={t.ok && t.freshness === 'ok'} warn={t.ok && t.freshness !== 'ok'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200">{t.label}</p>
                      <p className="text-[10px] text-slate-600">{t.effect}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-300">
                        {t.rows === null ? '—' : t.rows.toLocaleString('de-DE')}
                        <span className="text-[10px] font-normal text-slate-600"> Einträge</span>
                      </p>
                      <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${
                        t.ok ? badge.cls : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {t.ok ? `${badge.label} · ${formatDate(t.latest)}` : t.missing ? 'Tabelle fehlt' : 'Fehler'}
                      </span>
                    </div>
                  </div>
                  {(t.error || t.setupSql) && (
                    <div className="px-3 pb-3 pt-1.5 bg-[#0d0d18] border-t border-[#2a2a3a] space-y-2">
                      {t.error && (
                        <p className="text-[11px] text-rose-400 break-words">
                          <span className="font-semibold">Ursache:</span> {t.error}
                        </p>
                      )}
                      {t.setupSql && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 mb-1">
                            Im Supabase-SQL-Editor ausführen:
                          </p>
                          <pre className="text-[10px] font-mono text-slate-300 bg-[#13131e] border border-[#2a2a3a] rounded-lg p-2 overflow-x-auto whitespace-pre">{t.setupSql}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/*
            Inhalte von Hand anstoßen. Bis v2.29.0 gab es das nur für Guides —
            Marktbericht und Artikel ließen sich ausschließlich per curl mit dem
            Studio-Passwort auslösen. Genau deshalb blieben sie nach einem
            Ausfall wochenlang liegen.
          */}
          <div className="mt-3 space-y-2">
            <PipelineTile
              title="Marktbericht (Wochenanalyse)"
              subtitle="Erzeugt den Bericht der laufenden Woche sofort, statt bis Montag zu warten"
              buttonLabel="Jetzt erzeugen"
              running={busy === 'report'}
              disabled={busy !== null}
              result={results.report}
              onRun={runMarketReport}
            />

            <PipelineTile
              title="Artikel (Sonntag + Donnerstag)"
              subtitle="Prüft die letzten acht Termine und ersetzt Ersatztexte durch echte Beiträge"
              buttonLabel="Prüfen & ersetzen"
              running={busy === 'articles'}
              disabled={busy !== null}
              result={results.articles}
              onRun={runArticles}
            />

            <PipelineTile
              title="Guide-Pipeline"
              subtitle={`${health.guidePipeline.staticGuides} statisch · ${health.guidePipeline.generated} generiert · ${health.guidePipeline.pendingTopics} in Warteschlange`}
              note={
                health.guidePipeline.nextTopic
                  ? `Nächstes Thema: ${health.guidePipeline.nextTopic}`
                  : undefined
              }
              buttonLabel="Jetzt testen"
              running={busy === 'guide'}
              disabled={busy !== null}
              result={results.guide}
              onRun={runGuide}
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Kachel mit Auslöser. Das Ergebnis steht immer im Klartext darunter — ein
 * bloßes „ok" wäre genau die Sorte Rückmeldung, die den monatelangen stillen
 * Ausfall der Guide-Pipeline verdeckt hat.
 */
function PipelineTile({
  title,
  subtitle,
  note,
  buttonLabel,
  running,
  disabled,
  result,
  onRun,
}: {
  title: string;
  subtitle: string;
  note?: string;
  buttonLabel: string;
  running: boolean;
  disabled: boolean;
  result?: string;
  onRun: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a3a] bg-[#0d0d18] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-200">{title}</p>
          <p className="text-[10px] text-slate-600">{subtitle}</p>
        </div>
        <button
          onClick={onRun}
          disabled={disabled}
          className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/50 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40"
        >
          {running ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
          {running ? 'Läuft…' : buttonLabel}
        </button>
      </div>
      {note && <p className="mt-2 text-[10px] text-slate-500 break-words">{note}</p>}
      {result ? (
        <p className="mt-2 text-[11px] text-slate-300 bg-[#13131e] border border-[#2a2a3a] rounded-lg px-2.5 py-2 break-words">
          {result}
        </p>
      ) : null}
    </div>
  );
}

function StatusIcon({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />;
  if (warn) return <AlertCircle size={15} className="text-amber-500 shrink-0" />;
  return <XCircle size={15} className="text-rose-500 shrink-0" />;
}

function SectionTitle({ icon: Icon, title, score, total }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string; score?: number; total?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-violet-600" />
        <span className="text-sm font-bold text-slate-200">{title}</span>
      </div>
      {score !== undefined && total !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          score === total ? 'bg-emerald-50 text-emerald-700' :
          score === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
        }`}>{score}/{total}</span>
      )}
    </div>
  );
}

function ApiKeyRow({ info }: { info: ApiKeyStatus }) {
  const [open, setOpen] = useState(false);
  const live = info.working;
  return (
    <div className="border border-[#2a2a3a] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a28] transition-colors text-left">
        <StatusIcon ok={info.set} warn={info.set && live === false} />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-200">{info.label}</span>
          {info.required && <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Pflicht</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {info.set ? (
            live === true
              ? <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">✓ Live</span>
              : live === false
              ? <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">API-Fehler</span>
              : <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">✓ Gesetzt</span>
          ) : (
            <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full">Fehlt</span>
          )}
          {open ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1.5 bg-[#0d0d18] border-t border-[#2a2a3a] space-y-1">
          <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-300">Effekt:</span> {info.effect}</p>
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-300">Env:</span>{' '}
            <code className="font-mono bg-[#13131e] border border-[#2a2a3a] px-1 rounded text-[10px]">{info.envVar}</code>
          </p>
          <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-300">Woher:</span> {info.hint}</p>
        </div>
      )}
    </div>
  );
}

export function MonitoringPanel() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/monitoring', { cache: 'no-store' });
      setData(await res.json());
    } catch {
      setError('Monitoring-API nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
      <Loader2 size={16} className="animate-spin" /><span className="text-sm">Lade…</span>
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-12">
      <p className="text-rose-600 text-sm mb-2">{error || 'Keine Daten.'}</p>
      <button onClick={load} className="text-xs text-violet-600 hover:underline">Erneut versuchen</button>
    </div>
  );

  const apiKeyEntries = Object.entries(data.apiKeys);
  const keysSet = apiKeyEntries.filter(([, v]) => v.set).length;
  const requiredMissing = apiKeyEntries.filter(([, v]) => v.required && !v.set).length;

  const affiliateEntries = Object.entries(data.affiliates);
  const affiliatesReal = affiliateEntries.filter(([, v]) => !v.isDefault && !v.isBroken).length;

  const legalEntries = Object.entries(data.legal);
  const legalOk = legalEntries.filter(([, v]) => !v.hasPlaceholders).length;

  const featureEntries = Object.entries(data.features).filter(([k]) => k !== 'supabaseConnected') as [string, FeatureStatus][];
  const featuresWorking = featureEntries.filter(([, v]) => v.working).length;

  const totalScore = keysSet + affiliatesReal + legalOk + featuresWorking;
  const totalMax = apiKeyEntries.length + affiliateEntries.length + legalEntries.length + featureEntries.length;

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-200">Gesamtstatus</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${
              totalScore === totalMax ? 'text-emerald-600' :
              totalScore >= totalMax * 0.6 ? 'text-amber-600' : 'text-rose-600'
            }`}>{totalScore}/{totalMax}</span>
            <button onClick={load} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-violet-600 border border-[#2a2a3a] rounded-lg px-2 py-1 transition-colors">
              <RefreshCw size={10} />Neu laden
            </button>
          </div>
        </div>
        <div className="w-full bg-[#1a1a28] rounded-full h-2 mb-2">
          <div className={`h-2 rounded-full transition-all ${
            totalScore === totalMax ? 'bg-emerald-500' :
            totalScore >= totalMax * 0.6 ? 'bg-amber-400' : 'bg-rose-500'
          }`} style={{ width: `${Math.round((totalScore / totalMax) * 100)}%` }} />
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><KeyRound size={11} /> {keysSet}/{apiKeyEntries.length} Keys</span>
          <span className="inline-flex items-center gap-1"><Link2 size={11} /> {affiliatesReal}/{affiliateEntries.length} Affiliate</span>
          <span className="inline-flex items-center gap-1"><FileText size={11} /> {legalOk}/{legalEntries.length} Rechtstexte</span>
          <span className="inline-flex items-center gap-1"><Zap size={11} /> {featuresWorking}/{featureEntries.length} Features</span>
        </div>
        {data.build.siteUrlMissing && (
          <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            <TriangleAlert size={11} className="inline mr-1" /><code className="font-mono">NEXT_PUBLIC_SITE_URL</code> fehlt — Cron & Canonical-URLs defekt
          </p>
        )}
        {requiredMissing > 0 && (
          <p className="mt-2 text-[11px] text-rose-700 bg-rose-50 rounded-lg px-3 py-2">
            <CircleAlert size={11} className="inline mr-1" />{requiredMissing} Pflicht-Key(s) fehlen — Kernfunktionen eingeschränkt
          </p>
        )}
      </div>

      {/* Betriebszustand — steht bewusst ganz oben: echte Ergebnisse vor Konfiguration */}
      {data.health && <HealthSection health={data.health} onRefresh={load} />}

      {/* API Keys */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
        <SectionTitle icon={Key} title="API-Keys" score={keysSet} total={apiKeyEntries.length} />
        <div className="space-y-1.5">
          {apiKeyEntries.map(([name, info]) => <ApiKeyRow key={name} info={info} />)}
        </div>
      </div>

      {/* Affiliate Links */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
        <SectionTitle icon={Link2} title="Affiliate-Links" score={affiliatesReal} total={affiliateEntries.length} />
        <div className="space-y-2">
          {affiliateEntries.map(([key, info]) => {
            const ok = !info.isDefault && !info.isBroken;
            return (
              <div key={key} className="flex items-start gap-3 border border-[#2a2a3a] rounded-xl px-3 py-2.5">
                <StatusIcon ok={ok} warn={info.isDefault && !info.isBroken} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-200">{info.label}</span>
                    {info.isBroken && <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">Broken</span>}
                    {info.isDefault && !info.isBroken && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Standard-URL</span>}
                    {ok && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">✓ Eigener Link</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">{info.url ?? '—'}</p>
                  {!ok && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Env: <code className="font-mono bg-[#0d0d18] border border-[#2a2a3a] px-1 rounded text-[10px]">{info.env}</code>
                      {' · '}{info.hint}
                    </p>
                  )}
                </div>
                {info.url && info.url !== '#' && (
                  <a href={info.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-slate-600 hover:text-violet-500 mt-0.5">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legal */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
        <SectionTitle icon={FileText} title="Rechtliche Seiten" score={legalOk} total={legalEntries.length} />
        <div className="space-y-2">
          {legalEntries.map(([key, info]) => (
            <div key={key} className="border border-[#2a2a3a] rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-3">
                <StatusIcon ok={!info.hasPlaceholders} warn={info.hasPlaceholders} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{info.label}</span>
                    <a href={info.path} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-violet-500 hover:underline flex items-center gap-0.5">
                      Ansehen <ExternalLink size={9} />
                    </a>
                  </div>
                  {info.hasPlaceholders && (
                    <div className="mt-1.5">
                      <p className="text-[10px] font-semibold text-amber-700 mb-1">{info.placeholders.length} Platzhalter offen:</p>
                      <div className="flex flex-wrap gap-1">
                        {info.placeholders.map((p) => (
                          <code key={p} className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-100 px-1 py-0.5 rounded">{p}</code>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{info.hint}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
        <SectionTitle icon={Zap} title="Features" score={featuresWorking} total={featureEntries.length} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {featureEntries.map(([key, info]) => (
            <div key={key} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 ${
              info.working ? 'border-emerald-100 bg-emerald-50/40' : 'border-[#2a2a3a]'
            }`}>
              <StatusIcon ok={info.working} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-200 leading-tight">{info.label}</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{info.effect}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
          <SectionTitle icon={BookMarked} title="Claude Skills" score={data.skills.length} total={data.skills.length} />
          <div className="space-y-2">
            {data.skills.map((skill) => (
              <div key={skill.name} className="border border-[#2a2a3a] rounded-xl px-3 py-2.5 bg-violet-50/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-[11px] font-mono font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
                        /{skill.name}
                      </code>
                      <span className="text-xs font-semibold text-slate-200 leading-tight">{skill.title.replace(/^.+?—\s*/, '')}</span>
                    </div>
                    {skill.description && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{skill.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">
                    {new Date(skill.lastModified).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Automatisch aus <code className="font-mono">.claude/commands/</code> gelesen — neue Skills erscheinen sofort hier.
          </p>
        </div>
      )}

      {/* Automation Workflows */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
        <SectionTitle
          icon={GitBranch}
          title="Automation Workflows"
          score={data.workflows.filter((w) => w.active).length}
          total={data.workflows.length}
        />
        <div className="space-y-2">
          {data.workflows.map((wf) => (
            <div key={wf.endpoint} className={`border rounded-xl px-3 py-2.5 ${
              wf.active ? 'border-emerald-100 bg-emerald-50/30' : 'border-[#2a2a3a]'
            }`}>
              <div className="flex items-start gap-3">
                <StatusIcon ok={wf.active} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-200">{wf.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      wf.trigger === 'Vercel Cron'
                        ? 'bg-indigo-50 text-indigo-600'
                        : wf.trigger === 'Manuell'
                        ? 'bg-[#1a1a28] text-slate-500'
                        : 'bg-blue-50 text-blue-600'
                    }`}>{wf.trigger}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{wf.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-violet-500">{wf.scheduleLabel}</span>
                    <code className="text-[10px] font-mono text-slate-600">{wf.endpoint}</code>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Build info */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
        <SectionTitle icon={Server} title="Build-Info" />
        <div className="space-y-0">
          {[
            ['Version', <code key="v" className="font-mono font-bold text-slate-200 text-xs">v{data.build.version}</code>],
            ['Umgebung', <span key="e" className={`text-xs font-semibold px-2 py-0.5 rounded-full ${data.build.nodeEnv === 'production' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{data.build.nodeEnv}</span>],
            ['Site-URL', data.build.siteUrl
              ? <a key="u" href={data.build.siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:underline font-mono">{data.build.siteUrl}</a>
              : <span key="u" className="text-xs text-rose-600">Nicht gesetzt</span>],
            ['Supabase', <span key="s" className={`text-xs font-semibold px-2 py-0.5 rounded-full ${data.features.supabaseConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-[#1a1a28] text-slate-500'}`}>{data.features.supabaseConnected ? '✓ Verbunden' : 'Nicht verbunden'}</span>],
            ['Geprüft', <span key="t" className="text-xs text-slate-500">{new Date(data.checkedAt).toLocaleTimeString('de-DE')}</span>],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-center justify-between py-2 border-b border-[#1e1e30] last:border-0">
              <span className="text-xs text-slate-500">{label}</span>
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
