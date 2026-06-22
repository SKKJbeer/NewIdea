'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Scissors, Play, Share2, Loader2, CheckCircle2, AlertCircle, RefreshCw, Timer } from 'lucide-react';

type Step = 'pick' | 'uploading' | 'trim' | 'processing' | 'done' | 'error';

interface Result {
  reelUrl: string | null;
  reelPath: string;
  caption: string;
}

export function ReelsStudio() {
  const [step, setStep] = useState<Step>('pick');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPath, setVideoPath] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [clipDuration, setClipDuration] = useState(30);
  const [startTime, setStartTime] = useState(''); // empty = cut from end
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [caption, setCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const trimVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  function reset() {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setStep('pick');
    setUploadProgress(0);
    setVideoPath('');
    setLocalPreviewUrl(null);
    setStartTime('');
    setDescription('');
    setResult(null);
    setCaption('');
    setErrorMsg('');
    setPublished(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function captureCurrentTime() {
    const video = trimVideoRef.current;
    if (video) setStartTime(String(Math.floor(video.currentTime)));
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objUrl);
    setStep('uploading');
    setUploadProgress(0);
    setErrorMsg('');

    try {
      const urlRes = await fetch('/api/video/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Upload-URL Fehler');
      }
      const { signedUrl, path } = await urlRes.json() as { signedUrl: string; path: string };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Upload fehlgeschlagen'));
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });

      setVideoPath(path);
      setStep('trim');
    } catch (err) {
      setErrorMsg(String(err));
      setStep('error');
    }
  }

  async function handleProcess() {
    setStep('processing');
    setErrorMsg('');
    try {
      const startTimeSec = startTime !== '' ? parseFloat(startTime) : undefined;
      const res = await fetch('/api/video/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: videoPath, clipDuration, description, startTime: startTimeSec }),
      });
      const data = await res.json() as { reelUrl?: string; reelPath?: string; caption?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Verarbeitung fehlgeschlagen');
      setResult({ reelUrl: data.reelUrl ?? null, reelPath: data.reelPath!, caption: data.caption! });
      setCaption(data.caption!);
      setStep('done');
    } catch (err) {
      setErrorMsg(String(err));
      setStep('error');
    }
  }

  async function handlePublish() {
    if (!result?.reelUrl) return;
    setPublishing(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/video/publish-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: result.reelUrl, caption }),
      });
      const data = await res.json() as { success?: boolean; stubbed?: boolean; message?: string; error?: string };
      if (data.stubbed) {
        setErrorMsg(data.message ?? 'Instagram-Token nicht konfiguriert');
      } else if (data.success) {
        setPublished(true);
      } else {
        throw new Error(data.error ?? 'Fehler beim Posten');
      }
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        {(['pick', 'trim', 'done'] as const).map((s, i) => {
          const labels = ['Upload', 'Schnitt', 'Reel'];
          const active = step === s || (s === 'pick' && step === 'uploading') || (s === 'trim' && step === 'processing');
          const done = (s === 'pick' && ['trim', 'processing', 'done'].includes(step)) || (s === 'trim' && step === 'done');
          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <div className="w-6 h-px bg-gray-200" />}
              <span className={`px-2 py-0.5 rounded-full font-semibold transition-colors ${
                done ? 'bg-green-100 text-green-700' : active ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step: Pick file */}
      {step === 'pick' && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-2xl p-10 text-center cursor-pointer transition-colors group"
        >
          <div className="w-12 h-12 bg-violet-50 group-hover:bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
            <Upload size={22} className="text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Pack-Opening-Video hochladen</p>
          <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI — max. 500 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/avi,.mp4,.mov,.avi,.webm"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Step: Uploading — show local preview while uploading */}
      {step === 'uploading' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {localPreviewUrl && (
            <video src={localPreviewUrl} controls playsInline muted className="w-full max-h-52 object-contain bg-black" />
          )}
          <div className="p-5 text-center">
            <Loader2 size={20} className="animate-spin text-violet-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800 mb-3">Video wird hochgeladen…</p>
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Step: Trim settings */}
      {step === 'trim' && (
        <div className="space-y-3">
          {/* Local video preview for scrubbing */}
          {localPreviewUrl && (
            <div className="bg-black rounded-2xl overflow-hidden">
              <video
                ref={trimVideoRef}
                src={localPreviewUrl}
                controls
                playsInline
                className="w-full max-h-64 object-contain"
              />
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                <Scissors size={15} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Schnitt-Einstellungen</p>
                <p className="text-xs text-gray-400">Video abspielen · Moment pausieren · Position übernehmen</p>
              </div>
            </div>

            {/* Start position */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <Timer size={11} /> Startposition
                </label>
                <button
                  onClick={captureCurrentTime}
                  className="text-[10px] font-bold bg-violet-100 text-violet-700 hover:bg-violet-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Aktuelle Position übernehmen
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="leer = letzte Sekunden"
                  className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-400"
                />
                <span className="text-xs text-gray-400 shrink-0 w-16 text-right">
                  {startTime !== '' ? `ab ${formatTime(parseFloat(startTime))}` : 'vom Ende'}
                </span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-gray-600">Länge</span>
                <span className="font-bold text-violet-700">{clipDuration}s</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={clipDuration}
                onChange={(e) => setClipDuration(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                <span>10s</span><span>60s</span>
              </div>
            </div>

            {/* Moment description */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Moment beschreiben <span className="font-normal text-gray-400">(optional — verbessert Caption)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Pokémon 151 Boosterbox — Pull von Charizard ex"
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-400"
              />
            </div>

            {/* Summary */}
            <div className="bg-violet-50 rounded-xl p-3 text-xs text-violet-700">
              <p className="font-semibold mb-0.5">Was passiert beim Verarbeiten:</p>
              {startTime !== '' ? (
                <p>→ Clip ab {formatTime(parseFloat(startTime))} für {clipDuration}s</p>
              ) : (
                <p>→ Letzte {clipDuration}s werden ausgeschnitten</p>
              )}
              <p>→ Crop auf 9:16 (Hochformat für Reels)</p>
              <p>→ &quot;PokéMarket Intel&quot; Wasserzeichen</p>
              <p>→ KI generiert Instagram-Caption</p>
            </div>

            <button
              onClick={handleProcess}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Scissors size={15} /> Reel erstellen
            </button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 size={22} className="animate-spin text-violet-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Reel wird erstellt…</p>
          <p className="text-xs text-gray-400">FFmpeg schneidet, croppt und rendert — kann 30–60 Sek dauern</p>
          <div className="mt-4 space-y-2">
            {['Video schneiden', 'Auf 9:16 croppen', 'Wasserzeichen hinzufügen', 'Caption generieren'].map((s) => (
              <div key={s} className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                <Loader2 size={10} className="animate-spin text-violet-400 shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Play size={14} className="text-violet-600" />
              <p className="text-sm font-bold text-gray-900">Reel-Vorschau</p>
            </div>
            {result.reelUrl ? (
              <div className="p-4 flex justify-center">
                <video
                  src={result.reelUrl}
                  controls
                  playsInline
                  className="max-h-80 rounded-xl"
                  style={{ aspectRatio: '9/16' }}
                />
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">Vorschau nicht verfügbar</div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">Instagram-Caption</p>
              <span className="text-[10px] text-gray-400">{caption.length} Zeichen</span>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 resize-none"
            />
          </div>

          {errorMsg && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          {published ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Reel wurde gepostet!</p>
                <p className="text-xs text-green-600 mt-0.5">Auf Instagram sichtbar in wenigen Minuten.</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || !result.reelUrl}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {publishing ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
              {publishing ? 'Wird gepostet…' : 'Auf Instagram posten'}
            </button>
          )}

          <button onClick={reset} className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 py-2 transition-colors">
            <RefreshCw size={12} /> Neues Video
          </button>
        </div>
      )}

      {/* Error state */}
      {step === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Fehler</p>
              <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded-xl py-2 transition-colors"
          >
            <RefreshCw size={12} /> Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  );
}
