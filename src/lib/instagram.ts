// INSTAGRAM GRAPH API — Veroeffentlichen fuer ein Business-Konto.
//
// Weg: „Instagram API mit Facebook Login". Das Konto ist ein Business- oder
// Creator-Konto, verbunden mit einer Facebook-Seite. Der Schluessel ist ein
// SEITEN-Zugriffstoken, abgeleitet aus einem langlebigen Nutzer-Token — solche
// Seiten-Tokens laufen nicht ab. Das ist der Grund fuer diesen Weg: Der
// neuere „Instagram Login" liefert Tokens mit 60 Tagen Laufzeit, die
// regelmaessig erneuert und gespeichert werden muessten. Ein Autopilot, der
// nach zwei Monaten still stehen bleibt, ist keiner.
//
// Ablauf einer Veroeffentlichung (von Meta vorgegeben):
//   1. Container anlegen (Bild-/Video-Adresse + Bildunterschrift)
//   2. warten, bis Meta die Datei geholt und verarbeitet hat
//   3. Container veroeffentlichen
// Meta holt die Datei SELBST ueber die Adresse — sie muss oeffentlich
// erreichbar sein (hier: signierte Supabase-Adresse mit zwei Stunden Frist).

/** Graph-Version ueberschreibbar — Meta schaltet alte Versionen nach ca. zwei Jahren ab. */
export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

/** Jeder Aufruf mit Zeitlimit — sonst haengt die Funktion bis zum Vercel-Hardlimit. */
const ZEITLIMIT_MS = 20_000;

export interface IgKonfig {
  token: string;
  konto: string;
}

export function igKonfig(): IgKonfig | null {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const konto = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  return token && konto ? { token, konto } : null;
}

/** Fehler der Graph-API mit der Meldung von Meta — nie verschlucken. */
export class GraphFehler extends Error {
  constructor(
    message: string,
    public readonly code: number | null,
    public readonly subcode: number | null,
  ) {
    super(message);
    this.name = 'GraphFehler';
  }
}

interface GraphAntwort {
  error?: { message?: string; code?: number; error_subcode?: number };
  [k: string]: unknown;
}

/**
 * Ein Aufruf. Der Token geht als Formularfeld bzw. Abfrageparameter mit —
 * so verlangt es die Graph-API. In Logs darf die Adresse deshalb nie landen;
 * geloggt wird nur die Fehlermeldung.
 */
async function graph<T extends GraphAntwort>(
  pfad: string,
  token: string,
  opts: { method?: 'GET' | 'POST'; params?: Record<string, string> } = {},
): Promise<T> {
  const method = opts.method ?? 'GET';
  const params = new URLSearchParams({ ...(opts.params ?? {}), access_token: token });
  const url = method === 'GET' ? `${GRAPH}/${pfad}?${params}` : `${GRAPH}/${pfad}`;

  const res = await fetch(url, {
    method,
    signal: AbortSignal.timeout(ZEITLIMIT_MS),
    ...(method === 'POST'
      ? { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() }
      : {}),
  });

  let daten: T;
  try {
    daten = (await res.json()) as T;
  } catch {
    // catch erlaubt: Meta liefert bei Stoerungen gelegentlich HTML — die
    // Ursache steht dann im Status, und genau der wird weitergereicht.
    throw new GraphFehler(`Graph-API antwortete ohne JSON (HTTP ${res.status})`, null, null);
  }
  if (daten.error || !res.ok) {
    throw new GraphFehler(
      daten.error?.message ?? `HTTP ${res.status}`,
      daten.error?.code ?? null,
      daten.error?.error_subcode ?? null,
    );
  }
  return daten;
}

// ── Container anlegen ───────────────────────────────────────────────────────

export async function bildContainer(
  k: IgKonfig,
  bildUrl: string,
  opt: { caption?: string; karussellElement?: boolean; story?: boolean } = {},
): Promise<string> {
  const params: Record<string, string> = { image_url: bildUrl };
  if (opt.story) params.media_type = 'STORIES';
  if (opt.karussellElement) params.is_carousel_item = 'true';
  if (opt.caption && !opt.karussellElement && !opt.story) params.caption = opt.caption;
  const r = await graph<{ id: string }>(`${k.konto}/media`, k.token, { method: 'POST', params });
  return r.id;
}

export async function karussellContainer(k: IgKonfig, kinder: string[], caption: string): Promise<string> {
  // Meta verlangt 2 bis 10 Elemente.
  if (kinder.length < 2 || kinder.length > 10) {
    throw new GraphFehler(`Karussell braucht 2–10 Elemente, nicht ${kinder.length}`, null, null);
  }
  const r = await graph<{ id: string }>(`${k.konto}/media`, k.token, {
    method: 'POST',
    params: { media_type: 'CAROUSEL', children: kinder.join(','), caption },
  });
  return r.id;
}

export async function reelContainer(k: IgKonfig, videoUrl: string, caption: string): Promise<string> {
  const r = await graph<{ id: string }>(`${k.konto}/media`, k.token, {
    method: 'POST',
    // share_to_feed: Das Reel erscheint auch im Profilraster — ohne das liegt
    // es nur im Reels-Reiter und wird im Profil uebersehen.
    params: { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: 'true' },
  });
  return r.id;
}

// ── Warten und Veroeffentlichen ─────────────────────────────────────────────

/**
 * Wartet, bis Meta den Container verarbeitet hat.
 *
 * Bilder sind meist sofort fertig, Reels brauchen 20–90 Sekunden. `ERROR`
 * wird sofort gemeldet, statt bis zum Zeitlimit weiterzuwarten.
 */
export async function warteAufContainer(
  k: IgKonfig,
  containerId: string,
  maxMs = 150_000,
  intervallMs = 5_000,
): Promise<void> {
  const ende = Date.now() + maxMs;
  let letzter = 'unbekannt';
  while (Date.now() < ende) {
    try {
      const r = await graph<{ status_code?: string; status?: string }>(containerId, k.token, {
        params: { fields: 'status_code,status' },
      });
      letzter = r.status_code ?? 'unbekannt';
      if (letzter === 'FINISHED') return;
      if (letzter === 'ERROR' || letzter === 'EXPIRED') {
        throw new GraphFehler(`Container ${letzter}: ${r.status ?? 'ohne Angabe'}`, null, null);
      }
    } catch (err) {
      if (err instanceof GraphFehler && /^Container /.test(err.message)) throw err;
      // Eine einzelne fehlgeschlagene Abfrage beendet das Warten nicht.
      console.warn('[instagram] Statusabfrage fehlgeschlagen, warte weiter:', (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, intervallMs));
  }
  throw new GraphFehler(`Container nicht fertig nach ${Math.round(maxMs / 1000)} s (zuletzt ${letzter})`, null, null);
}

export async function veroeffentliche(k: IgKonfig, containerId: string): Promise<string> {
  const r = await graph<{ id: string }>(`${k.konto}/media_publish`, k.token, {
    method: 'POST',
    params: { creation_id: containerId },
  });
  return r.id;
}

// ── Lesen ───────────────────────────────────────────────────────────────────

export interface IgBeitrag {
  id: string;
  timestamp: string;
  media_type?: string;
  permalink?: string;
}

/** Die letzten Feed-Beitraege — Grundlage fuer „heute schon gepostet?". */
export async function letzteBeitraege(k: IgKonfig, anzahl = 10): Promise<IgBeitrag[]> {
  const r = await graph<{ data?: IgBeitrag[] }>(`${k.konto}/media`, k.token, {
    params: { fields: 'id,timestamp,media_type,permalink', limit: String(anzahl) },
  });
  return r.data ?? [];
}

/** Aktive Stories (die letzten 24 Stunden). */
export async function aktiveStories(k: IgKonfig): Promise<IgBeitrag[]> {
  const r = await graph<{ data?: IgBeitrag[] }>(`${k.konto}/stories`, k.token, {
    params: { fields: 'id,timestamp' },
  });
  return r.data ?? [];
}

export interface IgProfil {
  id: string;
  username?: string;
  followers_count?: number;
  media_count?: number;
}

export async function profil(k: IgKonfig): Promise<IgProfil> {
  return graph<IgProfil & GraphAntwort>(k.konto, k.token, {
    params: { fields: 'id,username,followers_count,media_count' },
  });
}

/** Wie viele Veroeffentlichungen in den letzten 24 h noch frei sind (Meta: 50). */
export async function kontingent(k: IgKonfig): Promise<{ genutzt: number; grenze: number } | null> {
  try {
    const r = await graph<{ data?: Array<{ quota_usage?: number; config?: { quota_total?: number } }> }>(
      `${k.konto}/content_publishing_limit`,
      k.token,
      { params: { fields: 'quota_usage,config' } },
    );
    const e = r.data?.[0];
    return e ? { genutzt: e.quota_usage ?? 0, grenze: e.config?.quota_total ?? 50 } : null;
  } catch (err) {
    console.warn('[instagram] Kontingent nicht lesbar:', (err as Error).message);
    return null;
  }
}

/**
 * Datum in Berliner Zeit (YYYY-MM-DD).
 *
 * Der Tag, an dem jemand in Deutschland den Beitrag sieht, ist der Berliner
 * Tag — ein UTC-Datum wuerde zwischen 0 und 2 Uhr nachts auf den Vortag fallen
 * und dadurch einen zweiten Beitrag am selben Abend zulassen.
 */
export function berlinerDatum(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Gibt es am Berliner Tag `heute` schon einen Beitrag? */
export function heuteSchonGepostet(beitraege: IgBeitrag[], heute: string): boolean {
  return beitraege.some((b) => {
    const t = Date.parse(b.timestamp);
    // Unlesbarer Zeitstempel zaehlt als „vielleicht heute" — im Zweifel lieber
    // einen Tag auslassen als doppelt posten.
    if (!Number.isFinite(t)) return true;
    return berlinerDatum(new Date(t)) === heute;
  });
}
