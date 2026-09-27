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

import { randomBytes } from 'crypto';
import { legeAb, listeOrdner, loescheDateien, leseJson, schreibeJson } from './social-speicher';

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

// ── Ablage im Speicher-Eimer (seit v6.10.0) ────────────────────────────────
//
// BEFUND (27.09.2026): Von v6.5.0 bis v6.9.0 wurde KEIN EINZIGER Aufruf
// gezaehlt. Der Zaehler schrieb in eine Tabelle `page_views`, die erst per
// Aufbau-SQL im Supabase-Editor angelegt werden musste — das geschah nie, und
// jeder Aufruf lief still ins Leere. Das Monitoring zeigte den Aufbau-Hinweis,
// aber niemand sah hin (Stolperstellen 21 und 52 in neuer Form).
//
// JETZT: Jeder Aufruf wird als eigene, winzige Datei im Speicher-Eimer
// abgelegt. Der Eimer legt sich selbst an — es gibt keinen Handgriff mehr,
// der vergessen werden kann.
//
// WARUM EINE DATEI JE AUFRUF statt einer hochgezaehlten Datei: Lesen, eins
// addieren, Zurueckschreiben verliert bei gleichzeitigen Aufrufen Zaehlungen.
// Neue Dateien ueberschreiben nie eine andere. Die Angaben stehen im
// DATEINAMEN — die Auswertung braucht nur die Ordnerliste, nicht tausend
// Einzelabrufe.
//
// VERDICHTUNG: Einmal taeglich (Tages-Cron) werden die Einzeldateien
// abgeschlossener Tage zu EINER Tagesdatei zusammengefasst und danach
// geloescht. Die Tagesdatei merkt sich, welche Einzeldateien sie schon
// enthaelt — bricht das Loeschen ab, zaehlt der naechste Lauf nichts doppelt.

const ROH = 'aufrufe/roh';
const TAGE = 'aufrufe/tage';

/** base64url — ohne Punkt, damit der Punkt als Trenner im Dateinamen taugt. */
function kodiere(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64url');
}
function dekodiere(text: string): string {
  return Buffer.from(text, 'base64url').toString('utf8');
}

const KANAELE: readonly Kanal[] = ['suche', 'sozial', 'verweis', 'kampagne', 'direkt', 'intern'];
const GERAETE: readonly Geraet[] = ['mobil', 'tablet', 'desktop'];

/** Dateiname eines Aufrufs: `kanal.geraet.herkunft.kampagne.pfad.zufall`. */
export function aufrufDateiname(e: Omit<AufrufEintrag, 'tag'>, zufall = randomBytes(6).toString('hex')): string {
  return [e.kanal, e.geraet, kodiere(e.herkunft), kodiere(e.kampagne), kodiere(e.pfad), zufall].join('.');
}

/** Liest einen Dateinamen zurueck. `null` bei allem, was nicht von hier stammt. */
export function leseDateiname(name: string, tag: string): AufrufZeile | null {
  const teile = name.split('.');
  if (teile.length !== 6) return null;
  const [kanal, geraet, herkunft, kampagne, pfad] = teile;
  if (!KANAELE.includes(kanal as Kanal) || !GERAETE.includes(geraet as Geraet)) return null;
  try {
    return {
      tag, kanal, geraet,
      herkunft: dekodiere(herkunft),
      kampagne: dekodiere(kampagne),
      pfad: dekodiere(pfad),
      aufrufe: 1,
    };
  } catch {
    // catch erlaubt: fremder Dateiname im Ordner zaehlt schlicht nicht
    return null;
  }
}

/** Zaehlt einen Aufruf: eine neue Datei, die keine andere ueberschreiben kann. */
export async function zaehleAufruf(eintrag: AufrufEintrag): Promise<SchreibErgebnis> {
  try {
    await legeAb(`${ROH}/${eintrag.tag}/${aufrufDateiname(eintrag)}`, '1');
    return { ok: true, fehler: null, fehltAufbau: false };
  } catch (err) {
    // catch erlaubt: Ein Speicherfehler darf den Seitenaufruf nie stoeren —
    // die Ursache geht an den Aufrufer (Log), nicht verloren.
    return { ok: false, fehler: err instanceof Error ? err.message : 'Unbekannter Fehler', fehltAufbau: false };
  }
}

/** Verdichtete Zeilen eines Tages plus die Einzeldateien, die schon darin stecken. */
interface TagesDatei {
  tag: string;
  zeilen: AufrufZeile[];
  enthalten: string[];
}

/** Fasst gleiche Zeilen zusammen (rein, testbar). */
export function verdichte(zeilen: AufrufZeile[]): AufrufZeile[] {
  const karte = new Map<string, AufrufZeile>();
  for (const z of zeilen) {
    const k = [z.tag, z.pfad, z.kanal, z.herkunft, z.kampagne, z.geraet].join('\u0000');
    const vorhanden = karte.get(k);
    if (vorhanden) vorhanden.aufrufe = (vorhanden.aufrufe ?? 0) + (z.aufrufe ?? 0);
    else karte.set(k, { ...z });
  }
  return [...karte.values()];
}

/**
 * Verdichtet alle ABGESCHLOSSENEN Tage (vor `heute`). Wirft nie; meldet,
 * was passiert ist.
 */
export async function verdichteAufrufe(heute = new Date().toISOString().slice(0, 10)): Promise<{ tage: number; dateien: number; fehler: string | null }> {
  let tage = 0;
  let dateien = 0;
  try {
    const ordner = (await listeOrdner(ROH)).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t) && t < heute);
    for (const tag of ordner) {
      const namen = await listeOrdner(`${ROH}/${tag}`);
      const alt = (await leseJson<TagesDatei>(`${TAGE}/${tag}.json`)) ?? { tag, zeilen: [], enthalten: [] };
      const schonDrin = new Set(alt.enthalten);
      const neu = namen.filter((n) => !schonDrin.has(n));
      const zeilen = neu.map((n) => leseDateiname(n, tag)).filter((z): z is AufrufZeile => z !== null);
      // Erst die Tagesdatei schreiben, DANN loeschen. `enthalten` verhindert
      // Doppelzaehlung, falls das Loeschen abbricht.
      await schreibeJson(`${TAGE}/${tag}.json`, {
        tag,
        zeilen: verdichte([...alt.zeilen, ...zeilen]),
        enthalten: [...alt.enthalten, ...neu],
      } satisfies TagesDatei);
      await loescheDateien(namen.map((n) => `${ROH}/${tag}/${n}`));
      // Nach erfolgreichem Loeschen braucht die Liste niemand mehr.
      await schreibeJson(`${TAGE}/${tag}.json`, {
        tag,
        zeilen: verdichte([...alt.zeilen, ...zeilen]),
        enthalten: [],
      } satisfies TagesDatei);
      tage++;
      dateien += namen.length;
    }
    return { tage, dateien, fehler: null };
  } catch (err) {
    return { tage, dateien, fehler: err instanceof Error ? err.message : 'Unbekannter Fehler' };
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

/** Zeilen eines Tages: verdichtete Tagesdatei plus noch nicht verdichtete Einzeldateien. */
async function zeilenDesTages(tag: string): Promise<AufrufZeile[]> {
  const [datei, namen] = await Promise.all([
    leseJson<TagesDatei>(`${TAGE}/${tag}.json`),
    listeOrdner(`${ROH}/${tag}`),
  ]);
  const drin = new Set(datei?.enthalten ?? []);
  const roh = namen
    .filter((n) => !drin.has(n))
    .map((n) => leseDateiname(n, tag))
    .filter((z): z is AufrufZeile => z !== null);
  return [...(datei?.zeilen ?? []), ...roh];
}

/** Liest die Aufrufe der letzten `tage` Tage (inklusive heute) und wertet sie aus. */
export async function ladeAufrufStatistik(tage = 30, jetzt = new Date()): Promise<AufrufStatistik> {
  const heuteStr = jetzt.toISOString().slice(0, 10);
  const liste: string[] = [];
  for (let i = 0; i < tage; i++) {
    const d = new Date(jetzt.getTime() - i * 86_400_000);
    liste.push(d.toISOString().slice(0, 10));
  }
  try {
    const proTag = await Promise.all(liste.map(zeilenDesTages));
    return auswerten(proTag.flat(), tage, heuteStr);
  } catch (err) {
    return {
      konfiguriert: true, fehltAufbau: false,
      fehler: err instanceof Error ? err.message : 'Unbekannter Fehler',
      tage, gesamt: 0, heute: 0, einstiege: 0, proTag: [], topSeiten: [], kanaele: [],
      herkuenfte: [], kampagnen: [], geraete: [], abgeschnitten: false,
    };
  }
}
