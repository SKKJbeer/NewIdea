'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Zap, CheckCircle2, XCircle, Loader2, FileText, Mail,
  Video, Share2, RefreshCw, Sparkles, ExternalLink,
  Clock, Copy, Check, Trash2, LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
  name: string;
  configured: boolean;
  required: boolean;
  category: string;
  purpose: string;
}

interface StatusResponse {
  integrations: Record<string, Integration>;
  requiredReady: boolean;
  totalConfigured: number;
  totalIntegrations: number;
}

type GenType = 'market' | 'newsletter' | 'video-youtube' | 'video-shorts' | 'social';

interface SavedOutput {
  type: GenType;
  content: unknown;
  savedAt: number;
}

const STEPS: Record<GenType, string[]> = {
  market:        ['Kartendaten laden', 'KI analysiert Markt', 'Bericht schreiben'],
  newsletter:    ['Kartendaten laden', 'Markt analysieren', 'Newsletter verfassen'],
  'video-youtube': ['Kartendaten laden', 'Skript entwickeln', 'Szenen planen'],
  'video-shorts':  ['Top-Karten auswählen', 'Short-Skript schreiben', 'Szenen planen'],
  social:        ['Kartendaten laden', 'Markt analysieren', 'Posts verfassen'],
};

const LABELS: Record<GenType, string> = {
  market: 'Marktbericht',
  newsletter: 'Newsletter',
  'video-youtube': 'YouTube-Video',
  'video-shorts': 'Short/TikTok',
  social: 'Social-Posts',
};

const STORAGE_KEY = 'studio_last_output';

export default function StudioPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [generating, setGenerating] = useState<GenType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [output, setOutput] = useState<SavedOutput | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadStatus();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setOutput(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  function startTimers(type: GenType) {
    setElapsed(0);
    setCurrentStep(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    const steps = STEPS[type];
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, steps.length - 1);
      setCurrentStep(step);
    }, 5000);
  }

  function stopTimers() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  }

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/status');
      setStatus(await res.json());
    } catch {
      setError('Status konnte nicht geladen werden');
    } finally {
      setLoadingStatus(false);
    }
  }

  async function generate(type: GenType) {
    setGenerating(type);
    setError('');
    startTimers(type);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        const saved: SavedOutput = { type, content: data.content, savedAt: Date.now() };
        setOutput(saved);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } else {
        setError(data.error || 'Generierung fehlgeschlagen');
      }
    } catch {
      setError('Verbindungsfehler — bitte nochmal versuchen');
    } finally {
      stopTimers();
      setGenerating(null);
      setCurrentStep(0);
      setElapsed(0);
    }
  }

  function clearOutput() {
    setOutput(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function copyOutput() {
    if (!output) return;
    const text = JSON.stringify(output.content, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function timeAgo(ts: number) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'gerade eben';
    if (mins < 60) return `vor ${mins} Min`;
    const h = Math.floor(mins / 60);
    return `vor ${h} Std`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-xl p-2">
              <Zap size={20} className="text-yellow-300" />
            </div>
            <div>
              <h1 className="text-base font-black leading-tight">Content Studio</h1>
              <p className="text-violet-200 text-xs">PokéMarket Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStatus}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-xs transition-colors"
            >
              <RefreshCw size={12} className={loadingStatus ? 'animate-spin' : ''} />
              Status
            </button>
            <Link href="/" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-xs transition-colors">
              <LayoutDashboard size={12} />
              Website
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">System-Status</h2>
            {status && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.requiredReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {status.totalConfigured}/{status.totalIntegrations} verbunden
              </span>
            )}
          </div>

          {loadingStatus && (
            <div className="flex items-center gap-2 text-gray-400 py-6 justify-center text-sm">
              <Loader2 className="animate-spin" size={16} /> Lade...
            </div>
          )}

          {status && (
            <div className="divide-y divide-gray-50">
              {Object.entries(status.integrations).map(([key, integration]) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {integration.configured
                      ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                      : <XCircle size={18} className="text-gray-300 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                      <p className="text-xs text-gray-400">{integration.purpose}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {integration.required && (
                      <span className="text-[10px] font-bold uppercase bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">Pflicht</span>
                    )}
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${integration.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {integration.configured ? 'OK' : 'Fehlt'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Content erstellen</h2>
            <p className="text-xs text-gray-400 mt-0.5">KI generiert den Inhalt — du siehst Vorschau & entscheidest</p>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(LABELS) as GenType[]).map((type) => {
              const isLoading = generating === type;
              const icons: Record<GenType, React.ReactNode> = {
                market: <FileText size={20} />,
                newsletter: <Mail size={20} />,
                'video-youtube': <Video size={20} />,
                'video-shorts': <Video size={20} />,
                social: <Share2 size={20} />,
              };
              return (
                <button
                  key={type}
                  onClick={() => generate(type)}
                  disabled={generating !== null}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 text-center transition-all active:scale-95 ${
                    isLoading
                      ? 'border-violet-400 bg-violet-50 shadow-sm'
                      : 'border-gray-200 hover:border-violet-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <div className={isLoading ? 'text-violet-600' : 'text-gray-400'}>
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : icons[type]}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">{LABELS[type]}</span>
                </button>
              );
            })}
          </div>

          {generating && (
            <div className="mx-4 mb-4 bg-violet-50 rounded-xl p-4 border border-violet-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-violet-600" />
                  <span className="text-sm font-semibold text-violet-800">
                    {LABELS[generating]} wird erstellt…
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-violet-500">
                  <Clock size={11} />
                  {elapsed}s
                </div>
              </div>

              <div className="space-y-2">
                {STEPS[generating].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      i < currentStep ? 'bg-green-500' :
                      i === currentStep ? 'bg-violet-600' :
                      'bg-gray-200'
                    }`}>
                      {i < currentStep
                        ? <Check size={9} className="text-white" />
                        : i === currentStep
                          ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          : null}
                    </div>
                    <span className={`text-xs ${
                      i < currentStep ? 'text-green-700 line-through' :
                      i === currentStep ? 'text-violet-800 font-medium' :
                      'text-gray-400'
                    }`}>{step}</span>
                  </div>
                ))}
              </div>

              {elapsed > 20 && (
                <p className="text-xs text-violet-500 mt-3 text-center">
                  KI denkt intensiv nach — bitte warten, nicht neu laden…
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mx-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}
        </section>

        {output && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-violet-600" />
                <span className="font-bold text-gray-900 text-sm">{LABELS[output.type]}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={10} /> {timeAgo(output.savedAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyOutput}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-violet-600 transition-colors px-2 py-1 rounded-lg hover:bg-violet-50"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copied ? 'Kopiert' : 'Kopieren'}
                </button>
                <button
                  onClick={clearOutput}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={12} /> Löschen
                </button>
              </div>
            </div>
            <div className="p-4">
              <OutputView type={output.type} content={output.content} />
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: 'https://dev.pokemontcg.io/', label: 'Pokémon API', sub: 'Key verwalten' },
            { href: 'https://console.anthropic.com/', label: 'Claude API', sub: 'Guthaben prüfen' },
            { href: 'https://beehiiv.com/', label: 'Beehiiv', sub: 'Newsletter-Platform' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl border border-gray-100 p-3 hover:border-violet-300 transition-colors flex items-center gap-3 shadow-sm"
            >
              <ExternalLink size={15} className="text-violet-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{link.label}</p>
                <p className="text-xs text-gray-400">{link.sub}</p>
              </div>
            </a>
          ))}
        </section>
      </div>
    </div>
  );
}

function OutputView({ type, content }: { type: GenType; content: unknown }) {
  if (type === 'market') {
    const c = content as { weeklyReport: string };
    return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.weeklyReport}</p>;
  }

  if (type === 'newsletter') {
    const c = content as { subject: string; preheader: string; htmlContent: string };
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Betreff</p>
            <p className="text-sm font-semibold text-gray-900">{c.subject}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Vorschautext</p>
            <p className="text-sm text-gray-600">{c.preheader}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Newsletter-Vorschau</p>
          <div
            className="border border-gray-100 rounded-xl p-3 text-sm bg-gray-50 max-h-72 overflow-auto"
            dangerouslySetInnerHTML={{ __html: c.htmlContent }}
          />
        </div>
      </div>
    );
  }

  if (type === 'video-youtube' || type === 'video-shorts') {
    const c = content as { title: string; description: string; tags: string[]; scenes: unknown[]; voiceoverText: string };
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Titel</p>
            <p className="text-sm font-semibold text-gray-900">{c.title}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Beschreibung</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.description}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {c.tags?.map((t) => (
              <span key={t} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Sprecher-Text ({c.scenes?.length || 0} Szenen)</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 max-h-48 overflow-auto whitespace-pre-wrap leading-relaxed">
            {c.voiceoverText}
          </p>
        </div>
      </div>
    );
  }

  if (type === 'social') {
    const posts = content as Array<{ platform: string; caption: string; hashtags: string[] }>;
    return (
      <div className="space-y-3">
        {posts.map((post, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
            <p className="text-[10px] font-bold text-violet-700 uppercase mb-1.5">{post.platform}</p>
            <p className="text-sm text-gray-800 leading-relaxed">{post.caption}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {post.hashtags?.map((h) => (
                <span key={h} className="text-xs text-violet-500">#{h}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="text-xs overflow-auto bg-gray-50 rounded-xl p-3">{JSON.stringify(content, null, 2)}</pre>;
}
