// AUFRUFE UND HERKUNFT — wie viele Menschen die Seite sehen, und woher sie kommen.
//
// ANLASS: Beide Fragen waren unbeantwortbar. `<Analytics />` von Vercel steht
// zwar im Grundgeruest, liefert seine Zahlen aber nur im Vercel-Dashboard und
// nur, wenn es dort eingeschaltet ist — auf `/monitoring`, wo jeder andere
// Betriebswert steht, kam nichts an. Und die fuer die Reichweite entscheidende
// Frage „ueber welchen Weg?" beantwortet es in der kostenlosen Stufe nicht.
//
// WAS HIER NICHT PASSIERT, und zwar mit Absicht:
//   - Kein Cookie, kein localStorage, kein Kennzeichen im Browser. Damit
//     greift §25 TTDSG nicht (kein Speichern und kein Auslesen auf dem
//     Endgeraet) und es braucht kein Einwilligungsbanner.
//   - Keine IP-Adresse und kein User-Agent in der Datenbank. Die IP dient
//     ausschliesslich der Missbrauchsbremse und bleibt im Arbeitsspeicher
//     der Instanz.
//
// WAS DAS KOSTET, ehrlich benannt: Ohne Kennzeichen lassen sich Aufrufe nicht
// zu Besuchern zusammenfassen. Diese Datei zaehlt AUFRUFE. Eine Zahl
// „Besucher" gibt es nirgends — sie waere geraten, und geratene Zahlen sind
// auf dieser Seite der teuerste Fehler.

import { getSupabase } from './supabase';

/** Ueber welchen Weg jemand hergefunden hat. */
export type Kanal = 'suche' | 'sozial' | 'verweis' | 'kampagne' | 'direkt' | 'intern';

export interface Einordnung {
  kanal: Kanal;
  /** Konkrete Quelle: Hostname des Verweises oder `utm_source`. */
  herkunft: string;
  /** `utm_campaign`, leer wenn keine. */
  kampagne: string;
}

// Suchmaschinen und soziale Netze als Listen, nicht als Regex-Ungetuem:
// Eine Liste laesst sich erweitern, ohne sie zu verstehen.
const SUCHMASCHINEN = [
  'google', 'bing', 'duckduckgo', 'ecosia', 'yahoo', 'startpage', 'qwant',
  'yandex', 'baidu', 'brave', 'search.marginalia', 'mojeek', 'seznam', 'naver',
];

const SOZIALE_NETZE = [
  'instagram', 'facebook', 'fb.com', 'messenger', 'threads', 'twitter', 'x.com',
  't.co', 'tiktok', 'youtube', 'youtu.be', 'reddit', 'linkedin', 'pinterest',
  'whatsapp', 'telegram', 'discord', 'tumblr', 'mastodon', 'bsky', 'snapchat',
  'news.ycombinator', 'lnkd.in',
];

/**
 * Hostname ohne `www.` — und ohne Ausnahme bei ungueltiger Adresse.
 *
 * `new URL()` wirft bei Muell; der Verweis kommt aber vom Browser eines
 * Fremden und darf deshalb alles enthalten. Ein Wurf hier wuerde die Zaehlung
 * eines echten Aufrufs verhindern.
 */
export function hostVon(url: string): string {
  if (!url) return '';
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    // catch erlaubt: fremde Zeichenkette, unbrauchbar heisst schlicht „kein Host"
    return '';
  }
}

function enthaelt(host: string, liste: string[]): boolean {
  return liste.some((eintrag) => host === eintrag || host.endsWith(`.${eintrag}`) || host.includes(eintrag));
}

export interface EinordnenEingabe {
  /** `document.referrer` des Aufrufers — darf leer sein. */
  verweis: string;
  /** Abfrageteil der aufgerufenen Adresse, z. B. `?utm_source=instagram`. */
  parameter: string;
  /** Eigener Hostname — Verweise von dort sind keine Herkunft. */
  eigenerHost: string;
  /**
   * Erster Aufruf dieses Seitenladens?
   *
   * WARUM DAS NOETIG IST: Bei einem Seitenwechsel im Browser (Next.js tauscht
   * nur den Inhalt aus) bleibt `document.referrer` auf dem URSPRUENGLICHEN
   * Verweis stehen. Ohne diese Unterscheidung wuerde ein einziger Besuch mit
   * fuenf Seitenwechseln fuenfmal als „von Google gekommen" gezaehlt — die
   * Herkunftsauswertung waere um den Faktor der Seitentiefe aufgeblasen.
   */
  einstieg: boolean;
}

/**
 * Ordnet einen Aufruf einem Weg zu.
 *
 * UTM-Parameter schlagen den Verweis: Wer einen Kampagnenlink baut, will genau
 * diese Zuordnung — und der Verweis waere bei einem Klick aus einer App
 * ohnehin leer.
 */
export function einordnen({ verweis, parameter, eigenerHost, einstieg }: EinordnenEingabe): Einordnung {
  if (!einstieg) return { kanal: 'intern', herkunft: 'intern', kampagne: '' };

  const suchParameter = new URLSearchParams(parameter.startsWith('?') ? parameter.slice(1) : parameter);
  const quelle = (suchParameter.get('utm_source') || '').trim().toLowerCase().slice(0, 60);
  const medium = (suchParameter.get('utm_medium') || '').trim().toLowerCase().slice(0, 60);
  const kampagne = (suchParameter.get('utm_campaign') || '').trim().toLowerCase().slice(0, 80);

  if (quelle) {
    // Das Medium entscheidet ueber den Kanal, nicht die Quelle: Ein Link mit
    // `utm_source=instagram&utm_medium=email` kam per Mail, nicht ueber
    // Instagram.
    let kanal: Kanal = 'kampagne';
    if (medium === 'organic' || medium === 'search') kanal = 'suche';
    else if (medium === 'social' || medium === 'reel' || medium === 'story') kanal = 'sozial';
    else if (medium === 'referral') kanal = 'verweis';
    else if (!medium && enthaelt(quelle, SOZIALE_NETZE)) kanal = 'sozial';
    return { kanal, herkunft: quelle, kampagne };
  }

  const host = hostVon(verweis);
  if (!host) return { kanal: 'direkt', herkunft: 'direkt', kampagne };
  if (host === eigenerHost.toLowerCase().replace(/^www\./, '')) {
    return { kanal: 'intern', herkunft: 'intern', kampagne };
  }
  if (enthaelt(host, SUCHMASCHINEN)) return { kanal: 'suche', herkunft: host, kampagne };
  if (enthaelt(host, SOZIALE_NETZE)) return { kanal: 'sozial', herkunft: host, kampagne };
  return { kanal: 'verweis', herkunft: host, kampagne };
}

/**
 * Bereinigt den gemeldeten Pfad.
 *
 * Der Pfad kommt aus dem Browser und ist damit frei waehlbar. Ohne Grenze
 * koennte ein Skript die Tabelle mit erfundenen Pfaden zumuellen — jede neue
 * Zeichenkette ist eine neue Zeile.
 *
 * Abfrageteil und Anker fliegen raus: `?utm_source=…` gehoert in die Herkunft,
 * nicht in den Seitennamen, sonst steht dieselbe Seite zwanzigmal da.
 */
export function pfadBereinigen(roh: unknown): string | null {
  if (typeof roh !== 'string') return null;
  const ohneAnhang = roh.split('?')[0].split('#')[0].trim();
  if (!ohneAnhang.startsWith('/')) return null;
  if (ohneAnhang.length > 200) return null;
  // Steuerzeichen und Rueckstriche abweisen statt bereinigen — dieselbe Regel
  // wie bei Weiterleitungszielen (Stolperstelle 34): Bereinigen macht aus
  // einem praeparierten Wert einen gueltig aussehenden.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(ohneAnhang)) return null;
  // Schraegstriche am Ende vereinheitlichen, damit `/sets` und `/sets/` nicht
  // als zwei Seiten gezaehlt werden.
  const gekuerzt = ohneAnhang.length > 1 ? ohneAnhang.replace(/\/+$/, '') : ohneAnhang;
  return gekuerzt || '/';
}

/** Grobe Geraeteklasse — bewusst nur drei Stufen, kein Fingerabdruck. */
export type Geraet = 'mobil' | 'tablet' | 'desktop';

export function geraetVonBreite(breite: unknown): Geraet {
  const px = typeof breite === 'number' && Number.isFinite(breite) ? breite : 0;
  if (px > 0 && px < 768) return 'mobil';
  if (px >= 768 && px < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Seiten, die nicht gezaehlt werden.
 *
 * Studio und Monitoring sind die eigenen Werkzeuge — sie in der Reichweite
 * mitzuzaehlen hiesse, sich die eigene Arbeit als Publikum zu verkaufen.
 */
export const NICHT_ZAEHLEN = ['/studio', '/monitoring'];

export function wirdGezaehlt(pfad: string): boolean {
  return !NICHT_ZAEHLEN.some((p) => pfad === p || pfad.startsWith(`${p}/`));
}

// ── Schreiben ───────────────────────────────────────────────────────────────

export interface AufrufEintrag {
  pfad: string;
  kanal: Kanal;
  herkunft: string;
  kampagne: string;
  geraet: Geraet;
  /** Tag im Format YYYY-MM-DD. */
  tag: string;
}

export interface SchreibErgebnis {
  ok: boolean;
  /** Klartext-Ursache — niemals nur `false` zurueckgeben (Stolperstelle 21). */
  fehler: string | null;
  /** Tabelle oder Funktion fehlt in der Datenbank. */
  fehltAufbau: boolean;
}

/** Erkennt „Tabelle/Funktion existiert nicht" ueber Code UND Meldung. */
function fehltInDatenbank(code: string | undefined, meldung: string): boolean {
  return code === '42P01' || code === '42883' || code === 'PGRST202' ||
    /does not exist|schema cache|could not find/i.test(meldung);
}

/**
 * Zaehlt einen Aufruf hoch.
 *
 * Ueber eine Datenbankfunktion und nicht als eine Zeile je Aufruf: Bei einer
 * Zeile je Aufruf waechst die Tabelle mit dem Verkehr, und jede Auswertung
 * muesste alle Zeilen lesen — bei einer Lesegrenze faellt die Summe still zu
 * niedrig aus. Verdichtet bleibt eine Zeile je Tag, Seite und Weg, und die
 * Zahl darin ist exakt, egal wie viel los ist.
 */
export async function zaehleAufruf(eintrag: AufrufEintrag): Promise<SchreibErgebnis> {
  const sb = getSupabase();
  if (!sb) return { ok: false, fehler: 'Supabase nicht konfiguriert', fehltAufbau: false };

  try {
    const { error } = await sb.rpc('zaehle_aufruf', {
      p_tag: eintrag.tag,
      p_pfad: eintrag.pfad,
      p_kanal: eintrag.kanal,
      p_herkunft: eintrag.herkunft,
      p_kampagne: eintrag.kampagne,
      p_geraet: eintrag.geraet,
    });
    if (error) {
      const meldung = error.message ?? 'Unbekannter Fehler';
      return { ok: false, fehler: meldung, fehltAufbau: fehltInDatenbank(error.code, meldung) };
    }
    return { ok: true, fehler: null, fehltAufbau: false };
  } catch (err) {
    // catch erlaubt: Netzfehler zur Datenbank darf den Aufruf nie stoeren
    return { ok: false, fehler: err instanceof Error ? err.message : 'Unbekannter Fehler', fehltAufbau: false };
  }
}

// ── Auswertung ──────────────────────────────────────────────────────────────

export interface ZeileMitAnteil {
  name: string;
  aufrufe: number;
  /** Anteil an der jeweiligen Gesamtmenge, 0–100. */
  anteil: number;
}

export interface TagesZeile {
  tag: string;
  aufrufe: number;
}

export interface AufrufStatistik {
  konfiguriert: boolean;
  /** Tabelle oder Funktion fehlt — Aufbau-SQL noetig. */
  fehltAufbau: boolean;
  fehler: string | null;
  tage: number;
  gesamt: number;
  heute: number;
  /**
   * Aufrufe, bei denen jemand von aussen kam (ohne Seitenwechsel im Browser).
   *
   * Bezugsgroesse fuer `kanaele`, `herkuenfte` und `kampagnen` — dort geht es
   * um die Frage, woher jemand kam, und die stellt sich nur beim Einstieg.
   */
  einstiege: number;
  proTag: TagesZeile[];
  topSeiten: ZeileMitAnteil[];
  kanaele: ZeileMitAnteil[];
  herkuenfte: ZeileMitAnteil[];
  kampagnen: ZeileMitAnteil[];
  geraete: ZeileMitAnteil[];
  /**
   * Die Lesegrenze wurde erreicht — die Zahlen sind damit zu NIEDRIG.
   *
   * Sichtbar gemacht, statt sie als Ergebnis auszugeben: Eine stumm
   * abgeschnittene Summe ist schlimmer als gar keine, weil man ihr nicht
   * ansieht, dass sie falsch ist.
   */
  abgeschnitten: boolean;
}

export interface AufrufZeile {
  tag: string | null;
  pfad: string | null;
  kanal: string | null;
  herkunft: string | null;
  kampagne: string | null;
  geraet: string | null;
  aufrufe: number | null;
}

function nachGroesse(karte: Map<string, number>, bezug: number, grenze?: number): ZeileMitAnteil[] {
  const zeilen = [...karte.entries()]
    .map(([name, aufrufe]) => ({
      name,
      aufrufe,
      anteil: bezug > 0 ? (aufrufe / bezug) * 100 : 0,
    }))
    .sort((a, b) => b.aufrufe - a.aufrufe);
  return grenze ? zeilen.slice(0, grenze) : zeilen;
}

/**
 * Verdichtet die Zeilen zur Auswertung.
 *
 * Bewusst hier statt als Datenbank-Sicht: Aendert sich die Auswertung, braucht
 * es keine zweite Wanderung durch den SQL-Editor — und genau die vergisst man.
 */
export function auswerten(
  zeilen: AufrufZeile[],
  tage: number,
  heuteStr: string,
  abgeschnitten = false,
): AufrufStatistik {
  const proTag = new Map<string, number>();
  const seiten = new Map<string, number>();
  const kanaele = new Map<string, number>();
  const herkuenfte = new Map<string, number>();
  const kampagnen = new Map<string, number>();
  const geraete = new Map<string, number>();

  let gesamt = 0;
  let heute = 0;
  let einstiege = 0;

  const zaehle = (karte: Map<string, number>, schluessel: string, wert: number) => {
    karte.set(schluessel, (karte.get(schluessel) ?? 0) + wert);
  };

  for (const zeile of zeilen) {
    const anzahl = Number(zeile.aufrufe ?? 0);
    if (!Number.isFinite(anzahl) || anzahl <= 0) continue;

    // Zeitstempel zurueckkuerzen, falls die Spalte doch als TIMESTAMPTZ
    // angelegt wurde — Stolperstelle 46.
    const tag = (zeile.tag ?? '').slice(0, 10);
    const kanal = zeile.kanal || 'direkt';

    gesamt += anzahl;
    if (tag === heuteStr) heute += anzahl;
    if (tag) zaehle(proTag, tag, anzahl);
    zaehle(seiten, zeile.pfad || '/', anzahl);
    zaehle(geraete, zeile.geraet || 'desktop', anzahl);

    // WEG UND HERKUNFT ZAEHLEN NUR EINSTIEGE.
    //
    // Ein Seitenwechsel im Browser hat keine Herkunft. Zaehlte er mit, stuende
    // „Seitenwechsel innerhalb der Seite" mit ueber der Haelfte an der Spitze
    // und draengte genau die Angabe nach unten, wegen der man herkommt — die
    // Frage lautet „woher kommen die Leute?", nicht „wie viel klicken sie
    // danach herum?". Die Gesamtzahl der Aufrufe steht oben und geht nicht
    // verloren.
    if (kanal !== 'intern') {
      einstiege += anzahl;
      zaehle(kanaele, kanal, anzahl);
      zaehle(herkuenfte, zeile.herkunft || 'direkt', anzahl);
      if (zeile.kampagne) zaehle(kampagnen, zeile.kampagne, anzahl);
    }
  }

  return {
    konfiguriert: true,
    fehltAufbau: false,
    fehler: null,
    tage,
    gesamt,
    heute,
    einstiege,
    proTag: [...proTag.entries()]
      .map(([tag, aufrufe]) => ({ tag, aufrufe }))
      .sort((a, b) => a.tag.localeCompare(b.tag)),
    topSeiten: nachGroesse(seiten, gesamt, 15),
    kanaele: nachGroesse(kanaele, einstiege),
    herkuenfte: nachGroesse(herkuenfte, einstiege, 15),
    kampagnen: nachGroesse(kampagnen, einstiege, 10),
    geraete: nachGroesse(geraete, gesamt),
    abgeschnitten,
  };
}

/** Obergrenze gelesener Zeilen — darueber wird die Auswertung als unvollstaendig gekennzeichnet. */
export const LESE_GRENZE = 20000;

export const AUFRUFE_SETUP_SQL = `-- Aufrufe und Herkunft. Verdichtet: eine Zeile je Tag, Seite und Weg.
-- Beides zusammen ausfuehren — ohne die Funktion zaehlt nichts hoch.
CREATE TABLE IF NOT EXISTS page_views (
  tag       DATE NOT NULL,
  pfad      TEXT NOT NULL,
  kanal     TEXT NOT NULL,
  herkunft  TEXT NOT NULL,
  kampagne  TEXT NOT NULL DEFAULT '',
  geraet    TEXT NOT NULL,
  aufrufe   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tag, pfad, kanal, herkunft, kampagne, geraet)
);

CREATE INDEX IF NOT EXISTS page_views_tag_idx ON page_views (tag DESC);

-- Zeilenschutz OHNE Regel: Der service_role-Schluessel (nur auf dem Server)
-- umgeht ihn, jeder andere sieht nichts. Das ist noetig, sobald der
-- oeffentliche anon-Schluessel fuer die Portfolio-Anmeldung gesetzt ist --
-- ohne diese Zeile koennte ihn dann jeder auslesen und die Reichweite der
-- Seite mitlesen.
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Hochzaehlen in EINER Anweisung. Lesen-dann-Schreiben aus der Anwendung
-- heraus wuerde bei gleichzeitigen Aufrufen Zaehlungen verlieren.
CREATE OR REPLACE FUNCTION zaehle_aufruf(
  p_tag DATE, p_pfad TEXT, p_kanal TEXT,
  p_herkunft TEXT, p_kampagne TEXT, p_geraet TEXT
) RETURNS void LANGUAGE sql AS $$
  INSERT INTO page_views (tag, pfad, kanal, herkunft, kampagne, geraet, aufrufe)
  VALUES (p_tag, p_pfad, p_kanal, p_herkunft, p_kampagne, p_geraet, 1)
  ON CONFLICT (tag, pfad, kanal, herkunft, kampagne, geraet)
  DO UPDATE SET aufrufe = page_views.aufrufe + 1;
$$;`;

/** Liest die Aufrufe der letzten `tage` Tage und wertet sie aus. */
export async function ladeAufrufStatistik(tage = 30): Promise<AufrufStatistik> {
  const leer: AufrufStatistik = {
    konfiguriert: false,
    fehltAufbau: false,
    fehler: null,
    tage,
    gesamt: 0,
    heute: 0,
    einstiege: 0,
    proTag: [],
    topSeiten: [],
    kanaele: [],
    herkuenfte: [],
    kampagnen: [],
    geraete: [],
    abgeschnitten: false,
  };

  const sb = getSupabase();
  if (!sb) return leer;

  const seit = new Date();
  seit.setDate(seit.getDate() - tage);
  const seitStr = seit.toISOString().slice(0, 10);

  const { data, error } = await sb
    .from('page_views')
    .select('tag, pfad, kanal, herkunft, kampagne, geraet, aufrufe')
    .gte('tag', seitStr)
    .order('tag', { ascending: false })
    .limit(LESE_GRENZE);

  if (error) {
    const meldung = error.message ?? 'Unbekannter Fehler';
    return {
      ...leer,
      konfiguriert: true,
      fehltAufbau: fehltInDatenbank(error.code, meldung),
      fehler: meldung,
    };
  }

  const zeilen = (data ?? []) as AufrufZeile[];
  const heuteStr = new Date().toISOString().slice(0, 10);
  return auswerten(zeilen, tage, heuteStr, zeilen.length >= LESE_GRENZE);
}
