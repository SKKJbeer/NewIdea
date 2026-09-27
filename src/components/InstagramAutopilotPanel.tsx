'use client';

import { useEffect, useState } from 'react';
import {
  Camera, Loader2, CheckCircle2, CircleAlert, TriangleAlert, Play, Send, KeyRound, ExternalLink, CalendarDays,
} from 'lucide-react';
import { formatCount } from '@/lib/format';

// INSTAGRAM-AUTOPILOT IM STUDIO
//
// Drei Aufgaben in einer Flaeche:
//   1. Zustand: Ist ein Zugang eingerichtet, wie heisst das Konto, was kommt
//      an den naechsten Tagen?
//   2. Probelauf: Baut den heutigen Beitrag, ohne ihn zu veroeffentlichen —
//      die Bilder/das Video lassen sich ansehen, bevor irgendetwas oeffentlich
//      wird.
//   3. Einrichtung: Aus dem kurzlebigen Graph-Explorer-Token wird ein
//      dauerhafter Seiten-Token plus Konto-ID, die nur noch in Vercel
//      eingetragen werden muessen.

interface Status {
  konfiguriert: boolean;
  graphVersion: string;
  naechsteTage: Array<{ datum: string; art: 'reel' | 'karussell' }>;
  profil?: { username?: string; followers_count?: number; media_count?: number };
  kontingent?: { genutzt: number; grenze: number } | null;
  letzteBeitraege?: Array<{ id: string; timestamp: string; media_type?: string; permalink?: string }>;
  fehler?: string;
}

interface Teil { status: string; grund?: string; mediaId?: string; dateien?: string[] }
interface Lauf {
  ok: boolean; datum: string; art: string; trocken: boolean;
  feed: Teil; story: Teil; caption?: string; dauerMs: number; error?: string;
}

interface Kandidat {
  seite: string; seitenId: string; instagramId: string | null; instagramName: string | null;
  token: string; laeuftAb: string | null;
}

const ART_TEXT = { reel: 'Reel', karussell: 'Karussell' } as const;

function TeilZeile({ titel, teil }: { titel: string; teil: Teil }) {
  const farbe =
    teil.status === 'veroeffentlicht' ? 'text-emerald-400'
      : teil.status === 'fehler' ? 'text-rose-400'
      : teil.status === 'trocken' ? 'text-violet-300'
      : 'text-slate-400';
  return (
    <div className="rounded-xl border border-[#2a2a3a] bg-[#0e0e18] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-200">{titel}</span>
        <span className={`text-[11px] font-semibold ${farbe}`}>{teil.status}</span>
      </div>
      {teil.grund && <p className="mt-1 break-words text-[11px] text-slate-400">{teil.grund}</p>}
      {teil.dateien && teil.dateien.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {teil.dateien.map((u, i) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#2a2a3a] px-2 py-1 text-[11px] text-violet-300 hover:border-violet-500/30">
              <ExternalLink size={10} /> Datei {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function InstagramAutopilotPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [laden, setLaden] = useState(true);
  const [lauf, setLauf] = useState<Lauf | null>(null);
  const [laeuft, setLaeuft] = useState<null | 'trocken' | 'echt'>(null);
  const [fehler, setFehler] = useState('');

  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [kurzToken, setKurzToken] = useState('');
  const [einrichten, setEinrichten] = useState(false);
  const [kandidaten, setKandidaten] = useState<Kandidat[] | null>(null);
  const [einrichtFehler, setEinrichtFehler] = useState('');

  async function ladeStatus() {
    setLaden(true);
    try {
      const r = await fetch('/api/studio/instagram', { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setStatus(await r.json());
    } catch (e) {
      setFehler(`Zustand nicht ladbar: ${(e as Error).message}`);
    } finally {
      setLaden(false);
    }
  }
  useEffect(() => { ladeStatus(); }, []);

  async function starte(modus: 'trocken' | 'echt') {
    if (modus === 'echt' && !window.confirm('Jetzt wirklich auf Instagram veröffentlichen? Das lässt sich nicht automatisch zurücknehmen.')) return;
    setLaeuft(modus);
    setLauf(null);
    setFehler('');
    try {
      const q = modus === 'trocken' ? '?trocken=1' : '?erzwingen=1';
      const r = await fetch(`/api/cron/social${q}`, { cache: 'no-store' });
      const d = (await r.json().catch(() => ({ error: `HTTP ${r.status}` }))) as Lauf;
      setLauf(d);
      if (modus === 'echt') ladeStatus();
    } catch (e) {
      setFehler((e as Error).message);
    } finally {
      setLaeuft(null);
    }
  }

  async function tauschen(e: React.FormEvent) {
    e.preventDefault();
    setEinrichten(true);
    setEinrichtFehler('');
    setKandidaten(null);
    try {
      const r = await fetch('/api/studio/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, appSecret, kurzToken }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setKandidaten(d.kandidaten);
      // Das Secret nicht laenger als noetig im Formular stehen lassen.
      setAppSecret('');
      setKurzToken('');
    } catch (err) {
      setEinrichtFehler((err as Error).message);
    } finally {
      setEinrichten(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Camera size={15} className="text-violet-400" />
        <h2 className="text-sm font-bold text-slate-200">Instagram-Autopilot</h2>
      </div>

      {laden ? (
        <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Lade…</p>
      ) : status && (
        <>
          {status.konfiguriert && !status.fehler ? (
            <p className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400">
              <CheckCircle2 size={11} className="mr-1 inline" />
              Verbunden mit @{status.profil?.username ?? '—'}
              {typeof status.profil?.followers_count === 'number' && <> · {formatCount(status.profil.followers_count)} Follower</>}
              {typeof status.profil?.media_count === 'number' && <> · {formatCount(status.profil.media_count)} Beiträge</>}
              {status.kontingent && <> · heute {status.kontingent.genutzt}/{status.kontingent.grenze} Veröffentlichungen genutzt</>}
            </p>
          ) : status.fehler ? (
            <p className="mb-3 break-words rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-400">
              <CircleAlert size={11} className="mr-1 inline" /> Zugang eingetragen, aber Meta lehnt ab: {status.fehler}
            </p>
          ) : (
            <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
              <TriangleAlert size={11} className="mr-1 inline" />
              Noch kein Zugang. Der Autopilot läuft trotzdem jeden Abend an und meldet „übersprungen" — der Probelauf unten funktioniert schon jetzt.
            </p>
          )}

          <div className="mb-3 rounded-xl border border-[#2a2a3a] bg-[#0e0e18] px-3 py-2.5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
              <CalendarDays size={11} /> Nächste sieben Tage (jeweils abends, dazu täglich eine Story)
            </p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {status.naechsteTage.map((t) => (
                <div key={t.datum} className="rounded-lg bg-white/[0.03] px-1 py-1.5">
                  <p className="text-[10px] text-slate-600">{t.datum.slice(8, 10)}.{t.datum.slice(5, 7)}.</p>
                  <p className={`text-[10px] font-semibold ${t.art === 'reel' ? 'text-violet-300' : 'text-sky-300'}`}>{ART_TEXT[t.art]}</p>
                </div>
              ))}
            </div>
          </div>

          {status.letzteBeitraege && status.letzteBeitraege.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {status.letzteBeitraege.map((b) => (
                <a key={b.id} href={b.permalink} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-[#2a2a3a] px-2 py-1 text-[10px] text-slate-400 hover:text-violet-300">
                  {b.media_type ?? 'Beitrag'} · {new Date(b.timestamp).toLocaleDateString('de-DE')}
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => starte('trocken')} disabled={laeuft !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#2a2a3a] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-violet-500/30 disabled:opacity-50">
          {laeuft === 'trocken' ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Probelauf (nichts wird veröffentlicht)
        </button>
        {status?.konfiguriert && (
          <button onClick={() => starte('echt')} disabled={laeuft !== null}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
            {laeuft === 'echt' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Heutigen Beitrag jetzt veröffentlichen
          </button>
        )}
      </div>
      {laeuft && <p className="mt-2 text-[11px] text-slate-500">Ein Reel braucht bis zu drei Minuten — Seite bitte offen lassen.</p>}
      {fehler && <p className="mt-2 text-[11px] text-rose-400">{fehler}</p>}

      {lauf && (
        <div className="mt-3 space-y-2">
          {lauf.error && <p className="text-[11px] text-rose-400">{lauf.error}</p>}
          {lauf.feed && <TeilZeile titel={`Feed · ${ART_TEXT[lauf.art as 'reel' | 'karussell'] ?? lauf.art}`} teil={lauf.feed} />}
          {lauf.story && <TeilZeile titel="Story" teil={lauf.story} />}
          {lauf.caption && (
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-[#2a2a3a] bg-[#0d0d18] p-3 font-sans text-[11px] text-slate-300">{lauf.caption}</pre>
          )}
          {typeof lauf.dauerMs === 'number' && <p className="text-[10px] text-slate-600">Dauer: {Math.round(lauf.dauerMs / 1000)} s</p>}
        </div>
      )}

      <details className="mt-4 rounded-xl border border-[#2a2a3a] bg-[#0e0e18] px-3 py-2.5">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-200">
          <KeyRound size={12} /> Zugang einrichten (einmalig)
        </summary>
        <form onSubmit={tauschen} className="mt-3 space-y-2">
          <p className="text-[11px] leading-relaxed text-slate-500">
            App-ID und App-Secret aus developers.facebook.com → deine App → Einstellungen → Allgemein.
            Den Token aus dem Graph-API-Explorer (Berechtigungen: instagram_basic, instagram_content_publish,
            pages_show_list, pages_read_engagement, business_management). Er gilt nur eine Stunde — hier wird
            daraus ein dauerhafter. Nichts davon wird gespeichert.
          </p>
          <input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="App-ID" inputMode="numeric"
            className="w-full rounded-lg border border-[#2a2a3a] bg-[#13131e] px-3 py-2 text-xs text-slate-200 focus:border-violet-500/50 focus:outline-none" />
          <input value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder="App-Secret" type="password" autoComplete="off"
            className="w-full rounded-lg border border-[#2a2a3a] bg-[#13131e] px-3 py-2 text-xs text-slate-200 focus:border-violet-500/50 focus:outline-none" />
          <textarea value={kurzToken} onChange={(e) => setKurzToken(e.target.value)} placeholder="Token aus dem Graph-API-Explorer" rows={3}
            className="w-full rounded-lg border border-[#2a2a3a] bg-[#13131e] px-3 py-2 font-mono text-[11px] text-slate-200 focus:border-violet-500/50 focus:outline-none" />
          <button type="submit" disabled={einrichten || !appId || !appSecret || !kurzToken}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
            {einrichten && <Loader2 size={13} className="animate-spin" />} Dauerhaften Zugang erzeugen
          </button>
          {einrichtFehler && <p className="break-words text-[11px] text-rose-400">{einrichtFehler}</p>}
        </form>

        {kandidaten && (
          <div className="mt-3 space-y-2">
            {kandidaten.map((k) => (
              <div key={k.seitenId} className="rounded-lg border border-[#2a2a3a] bg-[#13131e] p-3">
                <p className="text-xs font-semibold text-slate-200">
                  Seite „{k.seite}" {k.instagramName ? <>→ @{k.instagramName}</> : <span className="text-rose-400">— kein Instagram-Business-Konto verbunden</span>}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Laufzeit: {k.laeuftAb === null ? 'unbefristet' : k.laeuftAb}
                </p>
                {k.instagramId && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] text-slate-400">In Vercel → Settings → Environment Variables eintragen, danach neu deployen:</p>
                    <label className="block text-[10px] text-slate-500">INSTAGRAM_BUSINESS_ACCOUNT_ID</label>
                    <input readOnly value={k.instagramId} onFocus={(e) => e.currentTarget.select()}
                      className="w-full rounded border border-[#2a2a3a] bg-[#0d0d18] px-2 py-1 font-mono text-[11px] text-slate-200" />
                    <label className="block text-[10px] text-slate-500">INSTAGRAM_ACCESS_TOKEN</label>
                    <textarea readOnly value={k.token} rows={3} onFocus={(e) => e.currentTarget.select()}
                      className="w-full rounded border border-[#2a2a3a] bg-[#0d0d18] px-2 py-1 font-mono text-[10px] text-slate-200" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </details>
    </section>
  );
}
