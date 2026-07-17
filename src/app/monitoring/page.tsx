'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MonitoringPanel } from '@/components/MonitoringPanel';
import { Lock, Loader2, Activity } from 'lucide-react';

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/studio-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) onAuth();
      else { setError('Falsches Passwort'); setPw(''); }
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d18] flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 mx-auto mb-4">
            <Activity size={22} className="text-violet-600" />
          </div>
          <h1 className="text-lg font-black text-slate-200 mb-1">Monitoring</h1>
          <p className="text-xs text-slate-500 mb-6">Nur für interne Nutzung</p>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Passwort"
              autoFocus
              className="w-full rounded-xl border border-[#2a2a3a] px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || pw.length === 0}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Einloggen
            </button>
          </form>
        </div>
        <p className="text-center mt-4">
          <Link href="/" className="text-xs text-slate-500 hover:text-violet-600">← Zurück zur Website</Link>
        </p>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/studio-auth')
      .then((r) => { if (r.ok) setAuthed(true); })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return (
    <div className="min-h-screen bg-[#0d0d18] flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-violet-600" />
    </div>
  );

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-[#0d0d18]">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-violet-200" />
            <h1 className="text-sm font-black">Monitoring</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/studio" className="bg-[#13131e]/10 hover:bg-[#13131e]/20 rounded-lg px-3 py-1.5 text-xs transition-colors">
              Studio →
            </Link>
            <button
              onClick={async () => {
                await fetch('/api/studio-auth', { method: 'DELETE' });
                setAuthed(false);
              }}
              className="bg-[#13131e]/10 hover:bg-[#13131e]/20 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
              title="Abmelden"
            >
              <Lock size={11} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <MonitoringPanel />
      </div>
    </div>
  );
}
