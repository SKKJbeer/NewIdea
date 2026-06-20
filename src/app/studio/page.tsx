'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Mail,
  Video,
  Share2,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

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

export default function StudioPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [generating, setGenerating] = useState<GenType | null>(null);
  const [output, setOutput] = useState<{ type: GenType; content: unknown } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

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
    setOutput(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setOutput({ type, content: data.content });
      } else {
        setError(data.error || 'Generierung fehlgeschlagen');
      }
    } catch {
      setError('Verbindungsfehler bei der Generierung');
    } finally {
      setGenerating(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-violet-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-xl p-2">
              <Zap size={24} className="text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-black">Content Studio</h1>
              <p className="text-violet-200 text-sm">Deine Steuerzentrale für PokéMarket Intelligence</p>
            </div>
          </div>
          <button
            onClick={loadStatus}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
            Status aktualisieren
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-1">1. System-Status</h2>
          <p className="text-sm text-gray-500 mb-4">
            Welche Dienste sind verbunden? Grün = einsatzbereit, Grau = API-Key fehlt noch.
          </p>

          {status && (
            <div className={`mb-4 rounded-xl p-4 text-sm font-medium ${status.requiredReady ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              {status.requiredReady
                ? `✅ Grundsystem einsatzbereit — ${status.totalConfigured}/${status.totalIntegrations} Dienste verbunden.`
                : `⚠️ Pflicht-Dienste fehlen noch. Trage zuerst Pokémon API + Claude API-Key ein (siehe ANLEITUNG.md).`}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loadingStatus && (
              <div className="col-span-full flex items-center gap-2 text-gray-400 py-8 justify-center">
                <Loader2 className="animate-spin" size={18} /> Lade Status...
              </div>
            )}
            {status &&
              Object.entries(status.integrations).map(([key, integration]) => (
                <div
                  key={key}
                  className={`bg-white rounded-xl border p-4 ${integration.configured ? 'border-green-200' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{integration.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{integration.purpose}</p>
                    </div>
                    {integration.configured ? (
                      <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle size={20} className="text-gray-300 shrink-0" />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {integration.required && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700 px-2 py-0.5 rounded">
                        Pflicht
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${integration.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {integration.configured ? 'Verbunden' : 'Nicht verbunden'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-1">2. Content erstellen</h2>
          <p className="text-sm text-gray-500 mb-4">
            Klicke auf einen Button → die KI erstellt den Inhalt in Sekunden. Du siehst eine Vorschau und entscheidest dann.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <GenButton icon={<FileText size={18} />} label="Marktbericht" type="market" generating={generating} onClick={generate} />
            <GenButton icon={<Mail size={18} />} label="Newsletter" type="newsletter" generating={generating} onClick={generate} />
            <GenButton icon={<Video size={18} />} label="YouTube-Video" type="video-youtube" generating={generating} onClick={generate} />
            <GenButton icon={<Video size={18} />} label="Short/TikTok" type="video-shorts" generating={generating} onClick={generate} />
            <GenButton icon={<Share2 size={18} />} label="Social-Posts" type="social" generating={generating} onClick={generate} />
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
          )}

          {output && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Sparkles size={16} className="text-violet-600" />
                <span className="font-semibold text-gray-900 text-sm">Vorschau — {labelFor(output.type)}</span>
              </div>
              <div className="p-5">
                <OutputView type={output.type} content={output.content} />
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">3. Schnellzugriff</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href="/" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-violet-300 transition-colors flex items-center gap-3">
              <ExternalLink size={18} className="text-violet-600" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Öffentliche Website</p>
                <p className="text-xs text-gray-500">So sehen Besucher die Seite</p>
              </div>
            </a>
            <a href="https://dev.pokemontcg.io/" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-violet-300 transition-colors flex items-center gap-3">
              <ExternalLink size={18} className="text-violet-600" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Pokémon API-Key holen</p>
                <p className="text-xs text-gray-500">Kostenlos registrieren</p>
              </div>
            </a>
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-violet-300 transition-colors flex items-center gap-3">
              <ExternalLink size={18} className="text-violet-600" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Claude API-Key holen</p>
                <p className="text-xs text-gray-500">console.anthropic.com</p>
              </div>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function GenButton({
  icon,
  label,
  type,
  generating,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  type: GenType;
  generating: GenType | null;
  onClick: (t: GenType) => void;
}) {
  const isLoading = generating === type;
  const isDisabled = generating !== null;
  return (
    <button
      onClick={() => onClick(type)}
      disabled={isDisabled}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-violet-400 hover:shadow-sm transition-all flex flex-col items-center gap-2 text-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="text-violet-600">{isLoading ? <Loader2 size={18} className="animate-spin" /> : icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <span className="text-[10px] text-gray-400">{isLoading ? 'Erstelle...' : 'Generieren'}</span>
    </button>
  );
}

function labelFor(type: GenType): string {
  const map: Record<GenType, string> = {
    market: 'Marktbericht',
    newsletter: 'Newsletter',
    'video-youtube': 'YouTube-Video-Skript',
    'video-shorts': 'Short/TikTok-Skript',
    social: 'Social-Media-Posts',
  };
  return map[type];
}

function OutputView({ type, content }: { type: GenType; content: unknown }) {
  if (type === 'market') {
    const c = content as { weeklyReport: string };
    return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.weeklyReport}</p>;
  }

  if (type === 'newsletter') {
    const c = content as { subject: string; preheader: string; htmlContent: string };
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase">Betreff</p>
          <p className="text-sm font-semibold text-gray-900">{c.subject}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase">Vorschautext</p>
          <p className="text-sm text-gray-700">{c.preheader}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Vorschau</p>
          <div
            className="border border-gray-100 rounded-lg p-3 text-sm bg-gray-50 max-h-72 overflow-auto"
            dangerouslySetInnerHTML={{ __html: c.htmlContent }}
          />
        </div>
      </div>
    );
  }

  if (type === 'video-youtube' || type === 'video-shorts') {
    const c = content as { title: string; description: string; tags: string[]; scenes: unknown[]; voiceoverText: string };
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase">Titel</p>
          <p className="text-sm font-semibold text-gray-900">{c.title}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase">Beschreibung</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tags ({c.tags?.length || 0})</p>
          <div className="flex flex-wrap gap-1">
            {c.tags?.map((t) => (
              <span key={t} className="text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded">{t}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase">Szenen</p>
          <p className="text-sm text-gray-700">{c.scenes?.length || 0} Szenen geplant</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Sprecher-Text</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 max-h-40 overflow-auto whitespace-pre-wrap">{c.voiceoverText}</p>
        </div>
      </div>
    );
  }

  if (type === 'social') {
    const posts = content as Array<{ platform: string; caption: string; hashtags: string[] }>;
    return (
      <div className="space-y-3">
        {posts.map((post, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-bold text-violet-700 uppercase mb-1">{post.platform}</p>
            <p className="text-sm text-gray-800">{post.caption}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {post.hashtags?.map((h) => (
                <span key={h} className="text-[11px] text-violet-600">#{h}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
}
