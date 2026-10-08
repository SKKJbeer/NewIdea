'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

// TEILEN (seit v6.28.0, Reichweite): System-Teilen auf dem Telefon (WhatsApp,
// Instagram, Discord …), sonst Link kopieren. Die Adresse trägt eine Kampagne,
// damit geteilte Aufrufe in der Reichweitenmessung als solche erkennbar sind.
// Kein Zähler, kein Kennzeichen — nur die Herkunft „geteilt".

export function teilAdresse(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'teilen');
    u.searchParams.set('utm_medium', 'social');
    return u.toString();
  } catch {
    return url;
  }
}

export function TeilenKnopf({ url, titel, text, klein = false }: { url: string; titel: string; text?: string; klein?: boolean }) {
  const [kopiert, setKopiert] = useState(false);

  async function teilen() {
    const ziel = teilAdresse(url);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: titel, text, url: ziel });
        return;
      }
      await navigator.clipboard.writeText(ziel);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      // Abgebrochen oder nicht erlaubt — nichts zu tun, kein Fehlerzustand nötig.
    }
  }

  return (
    <button
      type="button"
      onClick={teilen}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#2a2a3a] bg-[#1a1a28] font-semibold text-slate-300 transition-colors hover:border-violet-500/40 hover:text-white ${
        klein ? 'min-h-[32px] px-3 text-[11px]' : 'min-h-[40px] px-4 text-xs'
      }`}
      aria-label={`${titel} teilen`}
    >
      {kopiert ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
      {kopiert ? 'Link kopiert' : 'Teilen'}
    </button>
  );
}
