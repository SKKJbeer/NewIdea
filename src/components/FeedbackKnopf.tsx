'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Check, CircleAlert } from 'lucide-react';

// RÜCKMELDUNG — schwebender Knopf auf jeder Seite (seit v6.17.0).
//
// Bewusst klein und unten rechts: Er soll auffindbar sein, aber nie vor dem
// Inhalt stehen. Kein Pop-up, das sich von selbst öffnet — eine Rückmeldung,
// um die man nicht gebeten hat, ist nichts wert.
//
// Eingabefelder mit 16 px auf Telefonen (Stolperstelle 67: iOS zoomt sonst).

const ARTEN = [
  { id: 'idee', label: 'Idee' },
  { id: 'fehler', label: 'Fehler' },
  { id: 'lob', label: 'Lob' },
  { id: 'sonstiges', label: 'Sonstiges' },
] as const;

const FEHLERTEXT: Record<string, string> = {
  'zu-kurz': 'Bitte ein paar Worte mehr.',
  'zu-lang': 'Bitte höchstens 2.000 Zeichen.',
  'mail-ungueltig': 'Die E-Mail-Adresse sieht nicht gültig aus.',
  'zu-viele': 'Gerade kamen viele Meldungen — bitte später noch einmal.',
  'zu-viele-links': 'Bitte höchstens drei Links.',
  'zu-gross': 'Bitte höchstens 2.000 Zeichen.',
};

export function FeedbackKnopf() {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);
  const [art, setArt] = useState<(typeof ARTEN)[number]['id']>('idee');
  const [text, setText] = useState('');
  const [mail, setMail] = useState('');
  const [website, setWebsite] = useState('');
  const [zustand, setZustand] = useState<'bereit' | 'sendet' | 'danke' | 'fehler'>('bereit');
  const [fehler, setFehler] = useState('');
  const feld = useRef<HTMLTextAreaElement>(null);
  // Zeitpunkt des Öffnens: Die Schnittstelle weist Absendungen unter 1,5 s als Roboter ab.
  const geoeffnet = useRef(0);

  useEffect(() => {
    if (offen) { feld.current?.focus(); geoeffnet.current = Date.now(); }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [offen]);

  if (pfad?.startsWith('/studio') || pfad?.startsWith('/monitoring')) return null;

  async function senden(e: React.FormEvent) {
    e.preventDefault();
    setZustand('sendet');
    setFehler('');
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ art, text, mail, pfad, website, dauerMs: Date.now() - geoeffnet.current }),
      });
      if (r.ok) {
        setZustand('danke');
        setText('');
        setMail('');
        return;
      }
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      setFehler(FEHLERTEXT[d.error ?? ''] ?? 'Senden hat nicht geklappt — bitte später noch einmal.');
      setZustand('fehler');
    } catch {
      setFehler('Keine Verbindung — bitte später noch einmal.');
      setZustand('fehler');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOffen(true); if (zustand === 'danke') setZustand('bereit'); }}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-[#2a2a3a] bg-[#13131e]/95 px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur hover:border-violet-500/30 hover:text-violet-400 transition-colors"
        aria-haspopup="dialog"
      >
        <MessageSquare size={14} /> Feedback
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setOffen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-titel"
            className="w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 text-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="feedback-titel" className="text-base font-bold text-white">Was fehlt, was stört, was gefällt?</h2>
              <button type="button" onClick={() => setOffen(false)} className="text-slate-500 hover:text-slate-300" aria-label="Schließen">
                <X size={18} />
              </button>
            </div>

            {zustand === 'danke' ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-4 text-sm text-emerald-400">
                <Check size={16} /> Danke — die Rückmeldung ist angekommen.
              </div>
            ) : (
              <form onSubmit={senden} className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {ARTEN.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setArt(a.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${art === a.id ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'border border-[#2a2a3a] text-slate-500 hover:text-slate-300'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={feld}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  required
                  placeholder="Zum Beispiel: Diese Karte fehlt, dieser Preis wirkt falsch, das wäre praktisch …"
                  className="w-full rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-[16px] sm:text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/40 focus:outline-none"
                />
                <input
                  type="email"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  placeholder="E-Mail für eine Antwort (freiwillig)"
                  autoComplete="email"
                  className="w-full rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-[16px] sm:text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/40 focus:outline-none"
                />
                {/* Honigtopf: für Menschen unsichtbar, Formular-Roboter füllen ihn aus. */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  name="website"
                />
                {zustand === 'fehler' && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400"><CircleAlert size={13} /> {fehler}</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] leading-snug text-slate-600">
                    Gespeichert werden nur Text, Art, die aktuelle Seite und — falls angegeben — die E-Mail. <a href="/datenschutz" className="underline hover:text-slate-400">Datenschutz</a>
                  </p>
                  <button
                    type="submit"
                    disabled={zustand === 'sendet'}
                    className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {zustand === 'sendet' ? 'Sendet …' : 'Senden'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
