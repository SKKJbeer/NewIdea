'use client';

import { useState } from 'react';
import { Clapperboard, Loader2, Share2, Download, CheckCircle2, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';

interface AutoReelResult {
  reelUrl: string | null;
  reelPath: string;
  caption: string;
  cards: Array<{ name: string; trendPercent: number }>;
}

type Status = 'idle' | 'generating' | 'done' | 'error';

// Auto-Reel: Ein Klick rendert ein fertiges 1080x1920-Reel aus den Live-Marktdaten
// (Top-Mover der Woche) — kein Videomaterial nötig. Caption enthält den UTM-Link
// zur Seite, damit Social-Traffic in Vercel Analytics zuordenbar ist.
export function AutoReelPanel() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AutoReelResult | null>(null);
  const [caption, setCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishNote, setPublishNote] = useState('');

  async function generate() {
    setStatus('generating');
    setErrorMsg('');
    setResult(null);
    setPublished(false);
    setPublishNote('');
    try {
      const res = await fetch('/api/video/auto-reel', { method: 'POST' });
      const data = await res.json().catch(() => ({})) as AutoReelResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Generierung fehlgeschlagen');
      setResult(data);
      setCaption(data.caption);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setStatus('error');
    }
  }

  async function publish() {
    if (!result?.reelUrl) return;
    setPublishing(true);
    setPublishNote('');
    try {
      const res = await fetch('/api/video/publish-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: result.reelUrl, caption }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; stubbed?: boolean; message?: string; error?: string };
      if (data.stubbed) {
        setPublishNote(data.message ?? 'Instagram-Keys fehlen noch — Reel per Download posten.');
      } else if (data.success) {
        setPublished(true);
      } else {
        setPublishNote(data.error ?? 'Veröffentlichung fehlgeschlagen');
      }
    } catch {
      setPublishNote('Veröffentlichung fehlgeschlagen — bitte erneut versuchen');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-600/10 to-transparent overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e30] flex items-center gap-2">
        <Clapperboard size={15} className="text-violet-400" />
        <h2 className="font-bold text-slate-200 text-sm">Auto-Reel aus Marktdaten</h2>
        <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">Neu</span>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Rendert ohne Videomaterial ein fertiges Hochformat-Reel (Intro, Top-5-Mover mit
          Kartenbild + Preis + Trend, CTA zur Website) und eine Caption mit UTM-Link.
          Dauer: ca. 1–2 Minuten.
        </p>

        {status !== 'done' && (
          <button
            onClick={generate}
            disabled={status === 'generating'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-bold px-4 py-3 transition-colors"
          >
            {status === 'generating'
              ? <><Loader2 size={15} className="animate-spin" /> Reel wird gerendert…</>
              : <><TrendingUp size={15} /> Markt-Reel generieren</>}
          </button>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {errorMsg}
          </div>
        )}

        {status === 'done' && result && (
          <div className="space-y-4">
            {result.reelUrl && (
              <video
                src={result.reelUrl}
                controls
                playsInline
                className="w-full max-w-[240px] mx-auto rounded-xl border border-[#2a2a3a] bg-black aspect-[9/16]"
              />
            )}

            <div className="rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Karten im Reel</p>
              <ul className="space-y-1">
                {result.cards.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate">{c.name}</span>
                    <span className={`font-bold tabular-nums ${c.trendPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {c.trendPercent >= 0 ? '+' : ''}{c.trendPercent.toFixed(1).replace('.', ',')} %
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">
                Caption (editierbar)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={7}
                className="w-full rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] text-slate-300 text-xs p-3 leading-relaxed focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {result.reelUrl && (
                <a
                  href={result.reelUrl}
                  download="pokemarket-reel.mp4"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#13131e] hover:bg-[#1a1a28] text-slate-200 text-sm font-bold px-4 py-3 transition-colors"
                >
                  <Download size={15} /> Herunterladen
                </a>
              )}
              <button
                onClick={publish}
                disabled={publishing || published}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-bold px-4 py-3 transition-colors"
              >
                {publishing
                  ? <><Loader2 size={15} className="animate-spin" /> Wird veröffentlicht…</>
                  : published
                  ? <><CheckCircle2 size={15} /> Veröffentlicht</>
                  : <><Share2 size={15} /> Auf Instagram posten</>}
              </button>
            </div>

            {publishNote && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> {publishNote}
              </div>
            )}

            <button
              onClick={generate}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-violet-400 transition-colors py-1"
            >
              <RefreshCw size={12} /> Neu generieren
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
