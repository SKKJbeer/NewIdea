'use client';

import { MessageSquare, CircleAlert, Mail } from 'lucide-react';

// RÜCKMELDUNGEN im Monitoring — die neuesten 30, neueste oben.

export interface FeedbackDaten {
  zeit: string;
  art: string;
  text: string;
  mail: string | null;
  pfad: string | null;
}

const ART_FARBE: Record<string, string> = {
  idee: 'text-violet-400 bg-violet-500/10',
  fehler: 'text-rose-400 bg-rose-500/10',
  lob: 'text-emerald-400 bg-emerald-500/10',
  sonstiges: 'text-slate-400 bg-white/[0.06]',
};

export function FeedbackPanel({ eintraege }: { eintraege: FeedbackDaten[] | null }) {
  return (
    <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={16} className="text-violet-400" />
        <h2 className="text-sm font-bold text-white">Rückmeldungen</h2>
        {eintraege && <span className="text-[11px] text-slate-600">{eintraege.length} neueste</span>}
      </div>
      {eintraege === null ? (
        <p className="flex items-center gap-1.5 text-xs text-amber-400/80"><CircleAlert size={13} /> Rückmeldungen nicht lesbar</p>
      ) : eintraege.length === 0 ? (
        <p className="text-xs text-slate-600">Noch keine Rückmeldung über den Feedback-Knopf.</p>
      ) : (
        <ul className="space-y-2">
          {eintraege.map((e) => (
            <li key={e.zeit + e.text.slice(0, 20)} className="rounded-xl border border-[#1e1e30] bg-[#0d0d18] p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${ART_FARBE[e.art] ?? ART_FARBE.sonstiges}`}>{e.art}</span>
                <span>{new Date(e.zeit).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' })}</span>
                {e.pfad && <span className="font-mono">{e.pfad}</span>}
                {e.mail && (
                  <a href={`mailto:${e.mail}`} className="inline-flex items-center gap-1 text-violet-400 hover:underline">
                    <Mail size={10} /> {e.mail}
                  </a>
                )}
              </div>
              <p className="whitespace-pre-line text-xs text-slate-300">{e.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
