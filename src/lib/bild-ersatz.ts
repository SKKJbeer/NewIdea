import { getSupabase } from './supabase';
import { dexSetFuer, dexKandidaten } from './tcgdex';
import { dexSetsVorgehalten } from './frischpreis-karte';

// ZWEITE BILDQUELLE (seit v6.20.0).
//
// Kartenbilder kommen von images.pokemontcg.io. Fällt dieser Dienst aus
// (Wartung, Überlastung), liefert der Bild-Proxy dieselbe Karte von TCGdex —
// einer unabhängigen Quelle, die dieselben Karten mit eigenem Bildserver führt.
// Die Zuordnung pokemontcg → TCGdex ist dieselbe wie beim Preisdurchlauf
// (Set über den Namen aus dem eigenen Kartenindex, Nummer über `dexKandidaten`).

const DEX = 'https://api.tcgdex.net/v2/en';

/** `https://images.pokemontcg.io/sv3pt5/199_hires.png` → { set, nummer, gross } (rein, getestet). */
export function pokemontcgBild(url: URL): { set: string; nummer: string; gross: boolean } | null {
  if (url.hostname !== 'images.pokemontcg.io') return null;
  const m = url.pathname.match(/^\/([a-z0-9.]+)\/([A-Za-z0-9-]+?)(_hires)?\.png$/i);
  if (!m) return null;
  return { set: m[1], nummer: m[2], gross: Boolean(m[3]) };
}

/** Adresse desselben Bildes bei TCGdex — `null`, wenn keine eindeutige Entsprechung. Wirft nie. */
export async function tcgdexErsatz(url: URL): Promise<string | null> {
  try {
    const teile = pokemontcgBild(url);
    if (!teile) return null;
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.from('cards_index').select('set_name').eq('set_code', teile.set).limit(1);
    const setName = (data?.[0] as { set_name?: string } | undefined)?.set_name;
    if (!setName) return null;
    const dexSet = dexSetFuer(teile.set, setName, await dexSetsVorgehalten());
    if (!dexSet) return null;
    for (const id of dexKandidaten(dexSet, teile.nummer)) {
      const res = await fetch(`${DEX}/cards/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(5000) });
      if (res.status === 404) continue;
      if (!res.ok) return null;
      const karte = (await res.json()) as { image?: string };
      if (!karte.image || !/^https:\/\/assets\.tcgdex\.net\//.test(karte.image)) return null;
      return `${karte.image}/${teile.gross ? 'high' : 'low'}.webp`;
    }
    return null;
  } catch {
    // catch erlaubt: die zweite Quelle ist ein Rückfall; scheitert sie, bleibt es beim Fehler der ersten
    return null;
  }
}
