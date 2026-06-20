'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) { setStatus('success'); setMessage(data.message); setEmail(''); }
      else { setStatus('error'); setMessage(data.error || 'Fehler beim Anmelden'); }
    } catch { setStatus('error'); setMessage('Verbindungsfehler'); }
  };

  if (status === 'success') return (
    <div className="flex flex-col items-center gap-3 py-4">
      <CheckCircle className="text-green-500" size={40} />
      <p className="text-green-700 font-semibold text-lg">{message}</p>
      <p className="text-gray-500 text-sm">Schau in dein E-Mail-Postfach!</p>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
      <Mail size={32} className="mx-auto mb-3 text-violet-200" />
      <h3 className="text-2xl font-bold mb-2">Wöchentliche Marktanalyse</h3>
      <p className="text-violet-200 mb-6 text-sm max-w-md mx-auto">Jeden Montag: Top Investment-Karten, Preistrends und Marktberichte — komplett kostenlos.</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deine@email.de" required className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white" />
        <button type="submit" disabled={status === 'loading'} className="px-6 py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors disabled:opacity-60 flex items-center gap-2 justify-center">
          {status === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Anmelden...</> : 'Kostenlos anmelden'}
        </button>
      </form>
      {status === 'error' && <p className="text-red-300 text-sm mt-3">{message}</p>}
      <p className="text-violet-300 text-xs mt-4">Kein Spam. Jederzeit abmeldbar. 100% kostenlos.</p>
    </div>
  );
}
