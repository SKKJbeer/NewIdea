'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Key, Link2, FileText, Zap, Server, RefreshCw,
  ExternalLink, ChevronDown, ChevronUp,
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

interface MonitoringData {
  build: {
    version: string;
    siteUrl: string | null;
    siteUrlMissing: boolean;
    nodeEnv: string;
  };
  apiKeys: Record<string, ApiKeyStatus>;
  affiliates: Record<string, AffiliateStatus>;
  legal: Record<string, LegalStatus>;
  features: {
    supabaseConnected: boolean;
    priceSnapshots: FeatureStatus;
    tcgPrices: FeatureStatus;
    aiBlog: FeatureStatus;
    cronDaily: FeatureStatus;
    newsletter: FeatureStatus;
    video: FeatureStatus;
    socialMedia: FeatureStatus;
  };
  checkedAt: string;
}

function StatusIcon({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
  if (warn) return <AlertCircle size={16} className="text-amber-500 shrink-0" />;
  return <XCircle size={16} className="text-rose-500 shrink-0" />;
}

function SectionHeader({ icon: Icon, title, score, total }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  score?: number;
  total?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
          <Icon size={16} className="text-violet-600" />
        </div>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      {score !== undefined && total !== undefined && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          score === total ? 'bg-emerald-50 text-emerald-700' :
          score === 0 ? 'bg-rose-50 text-rose-700' :
          'bg-amber-50 text-amber-700'
        }`}>
          {score}/{total}
        </span>
      )}
    </div>
  );
}

function ApiKeyRow({ info }: { info: ApiKeyStatus }) {
  const [open, setOpen] = useState(false);
  const ok = info.set;
  const live = info.working;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <StatusIcon ok={ok} warn={ok && live === false} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900">{info.label}</span>
          {info.required && <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Pflicht</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {ok ? (
            live === true ? (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">✓ Live</span>
            ) : live === false ? (
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Key gesetzt, API-Fehler</span>
            ) : (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">✓ Gesetzt</span>
            )
          ) : (
            <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">Fehlt</span>
          )}
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-100 space-y-1.5">
          <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Effekt:</span> {info.effect}</p>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Env-Var:</span>{' '}
            <code className="font-mono bg-white border border-gray-200 px-1 py-0.5 rounded text-[11px]">{info.envVar}</code>
          </p>
          <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Wo holen:</span> {info.hint}</p>
        </div>
      )}
    </div>
  );
}

export default function MonitoringPage() {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Monitoring lädt…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-600 text-sm mb-3">{error || 'Keine Daten.'}</p>
          <button onClick={load} className="text-xs text-violet-600 hover:underline">Erneut versuchen</button>
        </div>
      </div>
    );
  }

  const apiKeyEntries = Object.entries(data.apiKeys);
  const keysSet = apiKeyEntries.filter(([, v]) => v.set).length;
  const requiredKeys = apiKeyEntries.filter(([, v]) => v.required);
  const requiredSet = requiredKeys.filter(([, v]) => v.set).length;

  const affiliateEntries = Object.entries(data.affiliates);
  const affiliatesReal = affiliateEntries.filter(([, v]) => !v.isDefault && !v.isBroken).length;

  const legalEntries = Object.entries(data.legal);
  const legalOk = legalEntries.filter(([, v]) => !v.hasPlaceholders).length;

  const featureEntries = Object.entries(data.features).filter(([k]) => k !== 'supabaseConnected') as [string, FeatureStatus][];
  const featuresWorking = featureEntries.filter(([, v]) => v.working).length;

  const totalScore = keysSet + affiliatesReal + legalOk + featuresWorking;
  const totalMax = apiKeyEntries.length + affiliateEntries.length + legalEntries.length + featureEntries.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">System-Monitoring</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              v{data.build.version} · {data.build.nodeEnv} ·{' '}
              {new Date(data.checkedAt).toLocaleTimeString('de-DE')}
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 text-xs font-semibold text-violet-600 border border-violet-200 hover:bg-violet-50 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw size={13} />Aktualisieren
          </button>
        </div>

        {/* Overall score bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">Gesamtstatus</span>
            <span className={`text-sm font-black ${
              totalScore === totalMax ? 'text-emerald-600' :
              totalScore >= totalMax * 0.6 ? 'text-amber-600' : 'text-rose-600'
            }`}>{totalScore}/{totalMax}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                totalScore === totalMax ? 'bg-emerald-500' :
                totalScore >= totalMax * 0.6 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.round((totalScore / totalMax) * 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
            <span>🔑 {keysSet}/{apiKeyEntries.length} Keys</span>
            <span>🔗 {affiliatesReal}/{affiliateEntries.length} Affiliate-Links</span>
            <span>📄 {legalOk}/{legalEntries.length} Rechtstexte</span>
            <span>⚡ {featuresWorking}/{featureEntries.length} Features</span>
          </div>
          {data.build.siteUrlMissing && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              ⚠️ <code className="font-mono">NEXT_PUBLIC_SITE_URL</code> fehlt — SEO-Canonical-URLs, Cron und Sitemap funktionieren nicht korrekt.
            </p>
          )}
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader
            icon={Key}
            title="API-Keys & Dienste"
            score={keysSet}
            total={apiKeyEntries.length}
          />
          {requiredSet < requiredKeys.length && (
            <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">
              {requiredKeys.length - requiredSet} Pflicht-Key(s) fehlen — Kernfunktionen sind eingeschränkt.
            </p>
          )}
          <div className="space-y-2">
            {apiKeyEntries.map(([name, info]) => (
              <ApiKeyRow key={name} info={info} />
            ))}
          </div>
        </div>

        {/* Affiliate Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader
            icon={Link2}
            title="Affiliate-Links"
            score={affiliatesReal}
            total={affiliateEntries.length}
          />
          <div className="space-y-2">
            {affiliateEntries.map(([key, info]) => {
              const ok = !info.isDefault && !info.isBroken;
              return (
                <div key={key} className="flex items-start gap-3 border border-gray-100 rounded-xl px-4 py-3">
                  <StatusIcon ok={ok} warn={info.isDefault && !info.isBroken} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{info.label}</span>
                      {info.isBroken && (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">Broken (#)</span>
                      )}
                      {info.isDefault && !info.isBroken && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Standard-URL</span>
                      )}
                      {ok && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">✓ Eigener Link</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate font-mono">
                      {info.url ?? '(nicht gesetzt)'}
                    </p>
                    {!ok && (
                      <>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">Env-Var:</span>{' '}
                          <code className="font-mono bg-gray-50 border border-gray-200 px-1 py-0.5 rounded text-[11px]">{info.env}</code>
                        </p>
                        <p className="text-xs text-gray-500">{info.hint}</p>
                      </>
                    )}
                    {info.url && (
                      <a
                        href={info.url === '#' ? undefined : info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-violet-500 hover:underline mt-1"
                      >
                        Öffnen <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal pages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader
            icon={FileText}
            title="Rechtliche Seiten"
            score={legalOk}
            total={legalEntries.length}
          />
          <div className="space-y-2">
            {legalEntries.map(([key, info]) => (
              <div key={key} className="border border-gray-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusIcon ok={!info.hasPlaceholders} warn={info.hasPlaceholders} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{info.label}</span>
                      <a href={info.path} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[11px] text-violet-500 hover:underline">
                        Ansehen <ExternalLink size={10} />
                      </a>
                    </div>
                    {info.hasPlaceholders && (
                      <div className="mt-1.5 space-y-1">
                        <p className="text-xs text-amber-700 font-semibold">
                          {info.placeholders.length} Platzhalter noch nicht ersetzt:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {info.placeholders.map((p) => (
                            <code key={p} className="text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded">
                              {p}
                            </code>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">{info.hint}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader
            icon={Zap}
            title="Features & Automatisierungen"
            score={featuresWorking}
            total={featureEntries.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {featureEntries.map(([key, info]) => (
              <div key={key} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
                info.working ? 'border-emerald-100 bg-emerald-50/40' : 'border-gray-100'
              }`}>
                <StatusIcon ok={info.working} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{info.label}</p>
                  <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{info.effect}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader icon={Server} title="Infrastruktur" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Version</span>
              <code className="font-mono font-bold text-gray-900 text-xs">v{data.build.version}</code>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Umgebung</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                data.build.nodeEnv === 'production'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>{data.build.nodeEnv}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Site-URL</span>
              {data.build.siteUrl ? (
                <a href={data.build.siteUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:underline font-mono flex items-center gap-1">
                  {data.build.siteUrl} <ExternalLink size={10} />
                </a>
              ) : (
                <span className="text-xs text-rose-600">Nicht gesetzt</span>
              )}
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Supabase DB</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                data.features.supabaseConnected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {data.features.supabaseConnected ? '✓ Verbunden' : 'Nicht verbunden'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          Geprüft um {new Date(data.checkedAt).toLocaleString('de-DE')} · <a href="/studio" className="hover:underline text-violet-400">→ Studio</a>
        </p>
      </div>
    </div>
  );
}
