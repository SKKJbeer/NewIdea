'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Key, KeyRound, Link2, FileText, Zap, Server, RefreshCw, ExternalLink,
  ChevronDown, ChevronUp, BookMarked, GitBranch, TriangleAlert, CircleAlert,
} from 'lucide-react';

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

interface MonitoringData {
  build: { version: string; siteUrl: string | null; siteUrlMissing: boolean; nodeEnv: string };
  apiKeys: Record<string, ApiKeyStatus>;
  affiliates: Record<string, AffiliateStatus>;
  legal: Record<string, LegalStatus>;
  features: { supabaseConnected: boolean } & Record<string, FeatureStatus>;
  skills: SkillInfo[];
  workflows: WorkflowInfo[];
  checkedAt: string;
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
