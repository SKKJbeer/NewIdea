'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Loader2, TrendingUp, Clock, Zap } from 'lucide-react';

const PERKS = [
  { icon: TrendingUp, text: 'Top Investment-Karten der Woche' },
  { icon: Zap, text: 'KI-Marktbericht exklusiv' },
  { icon: Clock, text: 'Jeden Montag, 5 Min Lektüre' },
];

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Fehler beim Anmelden');
      }
    } catch {
      setStatus('error');
      setMessage('Verbindungsfehler — bitte erneut versuchen');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
        <CheckCircle size={48} className="mx-auto mb-3" />
        <h3 className="text-xl font-black mb-1">Du bist dabei!</h3>
        <p className="text-green-100 text-sm">{message || 'Schau in dein E-Mail-Postfach!'}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-violet-200 text-xs mb-4">
          <Mail size={11} />
          Kostenloser Newsletter
        </div>
        <h3 className="text-2xl font-black mb-2">Wöchentliche Marktanalyse</h3>
        <p className="text-violet-200 text-sm max-w-sm mx-auto">
          Jeden Montag: Die besten Investment-Chancen — direkt in dein Postfach.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        {PERKS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <Icon size={14} className="text-violet-200 flex-shrink-0" />
            <span className="text-xs text-violet-100">{text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          required
          className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-900 font-black rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 justify-center text-sm whitespace-nowrap"
        >
          {status === 'loading' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            'Jetzt anmelden →'
          )}
        </button>
      </form>

      {status === 'error' && (
        <p className="text-red-300 text-xs text-center mt-3">{message}</p>
      )}

      <p className="text-violet-400 text-xs text-center mt-4">
        Kein Spam · Jederzeit abmeldbar · 100% kostenlos
      </p>
    </div>
  );
}
