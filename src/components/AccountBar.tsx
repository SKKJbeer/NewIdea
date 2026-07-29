'use client';

import { useState } from 'react';
import { Cloud, CloudOff, LogOut, Loader2, TriangleAlert } from 'lucide-react';
import { browserAuthClient, AUTH_PROVIDERS, PROVIDER_LABEL, type AuthProvider } from '@/lib/supabase-auth';

/**
 * Anmeldeleiste über dem Portfolio.
 *
 * Drei Zustände, jeder mit einer klaren Aussage darüber, WO die Daten liegen:
 *  - nicht eingerichtet → gar nichts anzeigen (kein toter Knopf)
 *  - abgemeldet         → „nur in diesem Browser gespeichert" + Anmeldeknöpfe
 *  - angemeldet         → „im Konto gespeichert" + Abmelden
 *
 * Der Hinweis auf den Speicherort ist der eigentliche Zweck: Ohne ihn glaubt
 * jemand, sein Portfolio sei sicher, und verliert es beim Leeren des Browsers.
 */
export function AccountBar({
  signedIn,
  userName,
  syncing,
  syncError,
  onSignedOut,
}: {
  signedIn: boolean;
  userName: string;
  syncing: boolean;
  syncError: boolean;
  onSignedOut: () => void;
}) {
  const [busy, setBusy] = useState<AuthProvider | 'logout' | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  const client = browserAuthClient();
  if (!client) return null;

  async function anmelden(provider: AuthProvider) {
    setBusy(provider);
    setFehler(null);
    const { error } = await client!.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/portfolio` },
    });
    if (error) {
      setFehler('Anmeldung nicht möglich. Bitte später erneut versuchen.');
      setBusy(null);
    }
    // Bei Erfolg übernimmt der Anbieter — die Seite wird verlassen.
  }

  async function abmelden() {
    setBusy('logout');
    await client!.auth.signOut();
    setBusy(null);
    onSignedOut();
  }

  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl ${
              signedIn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {signedIn ? <Cloud size={18} /> : <CloudOff size={18} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">
              {signedIn ? userName || 'Angemeldet' : 'Nur in diesem Browser gespeichert'}
            </p>
            <p className="text-[11px] text-slate-500">
              {signedIn
                ? syncing
                  ? 'Wird gespeichert …'
                  : 'Im Konto gespeichert — auch auf anderen Geräten verfügbar'
                : 'Anmelden, damit das Portfolio erhalten bleibt'}
            </p>
          </div>
        </div>

        {signedIn ? (
          <button
            onClick={abmelden}
            disabled={busy !== null}
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 border border-[#2a2a3a] hover:border-slate-600 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
          >
            {busy === 'logout' ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
            Abmelden
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {AUTH_PROVIDERS.map((provider) => (
              <button
                key={provider}
                onClick={() => anmelden(provider)}
                disabled={busy !== null}
                className="flex items-center gap-2 text-xs font-semibold text-slate-200 border border-[#2a2a3a] hover:border-violet-500/50 hover:bg-[#1a1a28] rounded-xl px-3.5 py-2 transition-colors disabled:opacity-50"
              >
                {busy === provider ? <Loader2 size={13} className="animate-spin" /> : <ProviderMark provider={provider} />}
                {PROVIDER_LABEL[provider]}
              </button>
            ))}
          </div>
        )}
      </div>

      {(fehler || syncError) && (
        <p className="mt-3 flex items-start gap-2 text-[11px] text-amber-400/90 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
          <TriangleAlert size={12} className="shrink-0 mt-0.5" />
          {fehler ?? 'Das Portfolio konnte nicht ins Konto gespeichert werden. Die Änderungen liegen weiterhin in diesem Browser.'}
        </p>
      )}
    </div>
  );
}

/**
 * Anbieter-Zeichen als SVG.
 *
 * Bewusst keine externen Bilder: Der Google- und Apple-Schriftzug darf nicht
 * nachgebaut werden, die reinen Zeichen sind für Anmeldeknöpfe vorgesehen.
 * Emojis wären hier ohnehin ausgeschlossen (Icon-Regel).
 */
function ProviderMark({ provider }: { provider: AuthProvider }) {
  if (provider === 'google') {
    return (
      <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.4 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.4-4.6 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-17.1z" />
        <path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.2a24 24 0 0 0 0 21.6l7.9-6.2z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.2-8.7 2.2-6.3 0-11.6-3.9-13.5-9.4l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.8c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.2-.8-1.7 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-1-2.4-3.9zM14 4.9c.7-.8 1.1-2 1-3.2-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.3z" />
    </svg>
  );
}
