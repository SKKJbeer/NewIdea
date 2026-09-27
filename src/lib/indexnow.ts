import { siteUrl } from './site';

// INDEXNOW — neue und geaenderte Seiten aktiv an Suchmaschinen melden.
//
// Bing, Yandex, Seznam und Naver nehmen solche Meldungen an und teilen sie
// untereinander. Bing speist ausserdem DuckDuckGo, Ecosia, Yahoo und die
// Websuche von ChatGPT. Ohne Meldung findet eine Suchmaschine eine neue Seite
// erst, wenn sie zufaellig vorbeikommt — bei einer jungen Domain kann das
// Wochen dauern.
//
// Anders als die Google Search Console braucht IndexNow kein Konto: Der
// Nachweis, dass die Domain uns gehoert, ist eine Datei mit dem Schluessel
// unter `/<schluessel>.txt`. Der Schluessel ist deshalb OEFFENTLICH und kein
// Geheimnis — er steht absichtlich im Quelltext.
//
// Google nimmt an IndexNow nicht teil. Dort bleibt die Sitemap der Weg.

export const INDEXNOW_SCHLUESSEL = 'f98dc9a6c9f3eb60b3ef4d33ffdfc385';

const ENDPUNKT = 'https://api.indexnow.org/indexnow';
/** Obergrenze je Meldung laut Protokoll. */
export const MAX_JE_MELDUNG = 10_000;

export interface MeldeErgebnis {
  gemeldet: number;
  status: number | null;
  /** Klartext — nie verschlucken (Stolperstelle 21). */
  fehler: string | null;
}

/** Bedeutung der Antwortcodes laut Protokoll — fuer eine lesbare Meldung im Cron. */
function statusText(code: number): string | null {
  if (code === 200 || code === 202) return null;
  if (code === 400) return 'Ungueltiges Format';
  if (code === 403) return 'Schluessel nicht gefunden oder ungueltig (Schluesseldatei erreichbar?)';
  if (code === 422) return 'Adressen gehoeren nicht zum gemeldeten Host';
  if (code === 429) return 'Zu viele Meldungen — spaeter erneut';
  return `HTTP ${code}`;
}

/**
 * Meldet Adressen. Nur Adressen des eigenen Hosts; alles andere lehnt das
 * Protokoll ab (422) — deshalb wird vorher gefiltert statt die ganze Meldung
 * scheitern zu lassen.
 */
export async function meldeAnIndexNow(urls: string[]): Promise<MeldeErgebnis> {
  const basis = siteUrl();
  if (!basis) return { gemeldet: 0, status: null, fehler: 'Keine Produktionsadresse bekannt' };
  // Nur echte, oeffentliche Adressen. Lokale Laeufe melden nichts.
  if (/localhost|127\.0\.0\.1/.test(basis)) return { gemeldet: 0, status: null, fehler: 'Lokale Adresse — nichts gemeldet' };

  const host = new URL(basis).host;
  const eigene = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      // catch erlaubt: eine unlesbare Adresse wird schlicht nicht gemeldet
      return false;
    }
  });
  if (eigene.length === 0) return { gemeldet: 0, status: null, fehler: null };

  let gemeldet = 0;
  let letzterStatus: number | null = null;
  for (let i = 0; i < eigene.length; i += MAX_JE_MELDUNG) {
    const teil = eigene.slice(i, i + MAX_JE_MELDUNG);
    try {
      const res = await fetch(ENDPUNKT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({
          host,
          key: INDEXNOW_SCHLUESSEL,
          keyLocation: `${basis}/${INDEXNOW_SCHLUESSEL}.txt`,
          urlList: teil,
        }),
      });
      letzterStatus = res.status;
      const fehler = statusText(res.status);
      if (fehler) return { gemeldet, status: res.status, fehler };
      gemeldet += teil.length;
    } catch (err) {
      return { gemeldet, status: letzterStatus, fehler: (err as Error).message };
    }
  }
  return { gemeldet, status: letzterStatus, fehler: null };
}
