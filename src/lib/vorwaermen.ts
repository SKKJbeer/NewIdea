import { wertvollsteAusIndex } from './card-index';

// SEITEN VORWAERMEN.
//
// Befund 27.09.2026: Vercel legt den Seiten-Cache je Deployment neu an. Nach
// jedem Deploy waren Karten- und Set-Seiten beim ersten Aufruf kalt (1–4 s,
// gemessen 2,5 s fuer Umbreon VMAX). Wer als Erster kommt — oft ein Besucher
// aus der Google-Suche — zahlt diese Wartezeit.
//
// Die spaeten Etappen des Preisdurchlaufs haben meist nichts mehr zu tun,
// weil der Tag schon fertig ist. Ihre Zeit wird hier genutzt: die
// meistgesuchten Seiten einmal aufrufen, damit sie im Cache liegen.

/** Adressen, in Reihenfolge der Wichtigkeit. Rein, testbar. */
export function vorwaermListe(kartenIds: string[], setCodes: string[]): string[] {
  const feste = ['/', '/trends', '/suche', '/sets', '/marktbericht', '/artikel', '/guides'];
  return [
    ...feste,
    ...kartenIds.map((id) => `/karten/${encodeURIComponent(id)}`),
    ...[...new Set(setCodes)].map((c) => `/sets/${encodeURIComponent(c)}`),
  ];
}

export async function vorwaermen(
  basis: string,
  { anzahlKarten = 200, budgetMs = 200_000, gleichzeitig = 6 } = {},
): Promise<{ aufgerufen: number; fehler: number; dauerMs: number }> {
  const start = Date.now();
  const { karten } = await wertvollsteAusIndex(anzahlKarten);
  const liste = vorwaermListe(karten.map((k) => k.id), karten.map((k) => k.setCode));
  let i = 0;
  let aufgerufen = 0;
  let fehler = 0;
  await Promise.all(Array.from({ length: gleichzeitig }, async () => {
    while (i < liste.length && Date.now() - start < budgetMs) {
      const pfad = liste[i++];
      try {
        const r = await fetch(`${basis}${pfad}`, { signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'CardBeacon-Vorwaermen/1.0' } });
        await r.arrayBuffer();
        if (r.ok) aufgerufen++; else fehler++;
      } catch {
        fehler++;
      }
    }
  }));
  return { aufgerufen, fehler, dauerMs: Date.now() - start };
}
