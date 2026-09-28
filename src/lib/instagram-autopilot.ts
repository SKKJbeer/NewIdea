import sharp from 'sharp';
import { buildStory, neuerscheinungStory } from '@/lib/reel-concepts';
import { leseNeuheiten, neuheitenAktuell } from '@/lib/neuheiten';
import { setAusIndex } from '@/lib/card-index';
import { ohneDuenneAusreisser } from '@/lib/markt-lage';
import { ladeSetListe } from '@/lib/set-liste';
import { validateMarketData } from '@/lib/market-metrics';
import { renderStory } from '@/lib/reel-generator';
import { ladeMarktlage, ladeMarktkarten, rendereBewegung, type Marktlage } from '@/lib/marktbilder';
import { siteUrlOrLocal } from '@/lib/site';
import {
  planFuer,
  karussellCaption,
  captionVerstoesse,
  karussellFolien,
  type Beitragsart,
} from '@/lib/social-plan';
import { ablegen, aufraeumen, merkeOffen, leseOffen, vergissOffen, leseJson, schreibeJson, type OffeneVeroeffentlichung } from '@/lib/social-speicher';
import {
  igKonfig,
  bildContainer,
  karussellContainer,
  reelContainer,
  warteAufContainer,
  containerFertigBis,
  veroeffentliche,
  letzteBeitraege,
  aktiveStories,
  heuteSchonGepostet,
  berlinerDatum,
  GraphFehler,
  type IgKonfig,
} from '@/lib/instagram';

// DER INSTAGRAM-AUTOPILOT.
//
// Ein Lauf pro Tag (Vercel-Cron, abends). Er entscheidet anhand des
// Wochenplans, ob ein Reel oder ein Karussell erscheint, baut es aus echten
// Marktdaten, legt die Dateien ab, veroeffentlicht — und legt zusaetzlich eine
// Story mit der Marktlage an.
//
// GRUNDSAETZE:
//   - Feed und Story in GETRENNTEN Bloecken. Scheitert das eine, laeuft das
//     andere trotzdem (Stolperstelle 24: Kuer darf Pflicht nicht mitreissen —
//     hier sind beide gleichrangig, also reisst keiner den anderen mit).
//   - Nie doppelt: Gab es am Berliner Tag schon einen Feed-Beitrag, wird
//     keiner erzeugt. Die Pruefung fragt Instagram selbst — eine eigene
//     Tabelle waere genau die Abhaengigkeit, die schon zweimal still
//     ausgefallen ist.
//   - Trockenlauf: baut und legt alles ab, veroeffentlicht nichts. So laesst
//     sich jeder Beitrag vorher ansehen, auch ohne Instagram-Zugang.
//   - Inhaltsschranke: Verstoesst eine Bildunterschrift gegen die Regeln der
//     Seite, wird NICHT veroeffentlicht. Lieber ein Tag ohne Beitrag als ein
//     oeffentlicher Regelverstoss, der sich nicht zurueckholen laesst.

/** Zeitbudget des Laufs. Vercel beendet die Funktion nach 300 s. */
const BUDGET_MS = 280_000;

export interface Teilergebnis {
  /** `wartet`: Container bei Meta angelegt, aber noch nicht fertig — der Nachhol-Lauf veroeffentlicht ihn. */
  status: 'veroeffentlicht' | 'trocken' | 'uebersprungen' | 'fehler' | 'wartet';
  grund?: string;
  mediaId?: string;
  dateien?: string[];
}

export interface AutopilotErgebnis {
  datum: string;
  art: Beitragsart;
  trocken: boolean;
  konfiguriert: boolean;
  feed: Teilergebnis;
  story: Teilergebnis;
  caption?: string;
  aufgeraeumt?: number;
  /** Anzahl vorgemerkter Beitraege, die dieser Lauf nachtraeglich veroeffentlicht hat. */
  nachgeholt?: number;
  dauerMs: number;
}

export interface AutopilotOptionen {
  trocken?: boolean;
  /** Tagespruefung aussetzen — nur fuer einen bewussten Nachschlag aus dem Studio. */
  erzwingen?: boolean;
  /** Beitragsart statt Wochenplan. */
  art?: Beitragsart;
  /** Story weglassen. */
  ohneStory?: boolean;
  jetzt?: Date;
}

async function alsJpeg(png: Buffer): Promise<Buffer> {
  // Instagram nimmt fuer Bilder ausschliesslich JPEG an.
  return sharp(png).flatten({ background: '#08080b' }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

function meldung(err: unknown): string {
  if (err instanceof GraphFehler) return `Instagram: ${err.message}${err.code ? ` (Code ${err.code})` : ''}`;
  return err instanceof Error ? err.message : String(err);
}

/** Ergebnis einer Veroeffentlichung: fertig, oder Container fuer den Nachhol-Lauf. */
type Veroeffentlicht = { mediaId: string } | { offen: string };

interface Vorbereitet {
  caption: string;
  dateien: string[];
  /** `fristMs`: wie lange auf Meta gewartet werden darf, bevor vorgemerkt wird. */
  veroeffentlichen: (k: IgKonfig, fristMs: number) => Promise<Veroeffentlicht>;
  /** Gezeigte Karten — werden erst nach echter Veröffentlichung gemerkt. */
  gezeigt?: string[];
}

// GEDÄCHTNIS „SCHON GEZEIGT" — gegen dieselben Karten an drei Karussell-Tagen
// derselben Woche. 30-Tage-Bewegungen ändern sich langsam; ohne Gedächtnis
// zeigte jedes Karussell die Spitze derselben Rangliste. Gemerkt wird nur,
// was wirklich veröffentlicht wurde (ein Probelauf verbraucht nichts).
const PFAD_GEZEIGT = 'instagram/gezeigt.json';
export const GEZEIGT_TAGE = 6;
export interface GezeigtDatei { eintraege: Array<{ datum: string; ids: string[] }> }

/** Karten, die in den letzten `GEZEIGT_TAGE` Tagen vor `datum` gezeigt wurden. Rein. */
export function zuletztGezeigt(d: GezeigtDatei | null, datum: string): Set<string> {
  const heute = Date.parse(datum);
  const ids = new Set<string>();
  for (const e of d?.eintraege ?? []) {
    const tage = (heute - Date.parse(e.datum)) / 86_400_000;
    if (tage >= 0 && tage <= GEZEIGT_TAGE) for (const id of e.ids) ids.add(id);
  }
  return ids;
}

async function merkeGezeigt(datum: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const alt = await leseJson<GezeigtDatei>(PFAD_GEZEIGT).catch(() => null);
    const behalten = (alt?.eintraege ?? []).filter((e) => (Date.parse(datum) - Date.parse(e.datum)) / 86_400_000 <= GEZEIGT_TAGE * 2);
    await schreibeJson(PFAD_GEZEIGT, { eintraege: [...behalten, { datum, ids }] } satisfies GezeigtDatei);
  } catch (err) {
    // Kür, nicht Pflicht: ohne Gedächtnis droht nur eine Wiederholung.
    console.warn('[autopilot] Gezeigte Karten nicht gemerkt:', err instanceof Error ? err.message : err);
  }
}

/** Wie alt die Daten hoechstens sein duerfen, damit ein Beitrag erscheint. */
export const MAX_DATENALTER_TAGE = 2;

/**
 * Veroeffentlicht wird nur aus dem Tagesstand des Kartenindex, und nur wenn er
 * frisch ist.
 *
 * Die Stichprobe (Live-Abruf) liefert bei Teilausfaellen jedes Mal andere
 * Karten — zwei Beitraege am selben Tag koennten sich widersprechen. Und ein
 * Beitrag aus einem tagealten Stand wuerde als neue Marktlage erscheinen,
 * obwohl der Preisdurchlauf stillsteht. In beiden Faellen: kein Beitrag.
 * Lieber ein Tag Pause als eine Aussage, die sich nicht halten laesst.
 */
export function datenTaugen(quelle: Marktlage['quelle'], datenTag: string | null, heute: string): string | null {
  if (quelle === 'stichprobe') return 'Keine Frischpreise — aus einer Zufallsstichprobe wird nichts veroeffentlicht';
  // Der Kartenindex wird taeglich geschrieben, seine Preise stammen aber aus
  // pokemontcg.io und sind dort drei bis zehn Monate alt (gemessen 27.09.2026).
  // Ein Beitrag „Markt am <heute>" daraus waere eine falsche Zeitangabe.
  if (quelle !== 'frisch') return 'Keine Frischpreise fuer heute — Kartenindex-Werte sind Monate alt und werden nicht veroeffentlicht';
  if (!datenTag) return 'Datenstand des Kartenindex unbekannt';
  const alter = (Date.parse(`${heute}T00:00:00Z`) - Date.parse(`${datenTag.slice(0, 10)}T00:00:00Z`)) / 86_400_000;
  // Stolperstelle 46: Eine Altersgrenze, die bei NaN durchwinkt, ist keine.
  if (!Number.isFinite(alter)) return `Datenstand unlesbar (${datenTag})`;
  if (alter > MAX_DATENALTER_TAGE) {
    return `Datenstand ist ${alter} Tage alt (Stand ${datenTag}) — Frischpreise bzw. Preisdurchlauf pruefen`;
  }
  return null;
}

async function bereiteKarussellVor(datum: string, siteUrl: string): Promise<Vorbereitet> {
  const gezeigtDatei = await leseJson<GezeigtDatei>(PFAD_GEZEIGT).catch(() => null);
  const lage = await ladeMarktlage({ ausschliessen: zuletztGezeigt(gezeigtDatei, datum) });
  if (!lage) throw new Error('Zu wenig Marktdaten fuer ein Karussell');
  const einwand = datenTaugen(lage.quelle, lage.datenTag, datum);
  if (einwand) throw new Error(einwand);

  // Nur Bewegungen mit Kartenbild — ohne Karte ist die Folie eine nackte Zahl,
  // und genau die wird auf Instagram ueberblaettert.
  const folien = karussellFolien(lage);
  const urls: string[] = [];
  for (const f of folien) {
    const png = await rendereBewegung(f.mover, lage, 'post', f.titel);
    const ablage = await ablegen(datum, `karussell-${urls.length + 1}.jpg`, await alsJpeg(png), 'image/jpeg');
    urls.push(ablage.url);
  }
  if (urls.length < 2) throw new Error(`Nur ${urls.length} Bewegung(en) mit Kartenbild — Karussell braucht mindestens zwei`);

  const caption = karussellCaption(lage, siteUrl);
  return {
    caption,
    dateien: urls,
    gezeigt: folien.map((f) => f.mover.id).filter((id): id is string => Boolean(id)),
    async veroeffentlichen(k, fristMs) {
      const kinder: string[] = [];
      for (const url of urls) kinder.push(await bildContainer(k, url, { karussellElement: true }));
      // Bilder sind bei Meta fast sofort fertig — hier genuegt kurzes Warten.
      for (const kind of kinder) await warteAufContainer(k, kind, 60_000, 3_000);
      const container = await karussellContainer(k, kinder, caption);
      if (!(await containerFertigBis(k, container, fristMs, 3_000))) return { offen: container };
      return { mediaId: await veroeffentliche(k, container) };
    },
  };
}

async function bereiteReelVor(datum: string, siteUrl: string, rotation: number): Promise<Vorbereitet> {
  // Dieselbe Grundlage wie die Startseite — mit Rueckfall auf den letzten
  // gespeicherten Marktbericht, wenn die Kartendatenbank gerade nicht antwortet.
  const basis = await ladeMarktkarten();
  const einwand = datenTaugen(basis.quelle, basis.datenTag, datum);
  if (einwand) throw new Error(einwand);
  // Dieselbe Bereinigung wie Karussell und Story. Vorher bekam das Reel die
  // Rohliste — und zeigte eine Karte, die das Karussell desselben Tages
  // aussortiert hatte. Zwei Beitraege, zwei Massstaebe.
  // NEUERSCHEINUNG an jedem zweiten Reel-Tag, solange ein Set jünger als 30
  // Tage ist und genug frisch bepreiste Karten hat — sonst die Rotation.
  let neu = null as ReturnType<typeof neuerscheinungStory>;
  if (rotation % 2 === 0) {
    try {
      const n = await leseNeuheiten();
      const jung = neuheitenAktuell(n)
        ? n!.sets.find((s) => (Date.now() - Date.parse(s.datum)) / 86_400_000 <= 30)
        : undefined;
      if (jung) {
        const heute = Date.now();
        const karten = (await setAusIndex(jung.setCode)).filter((k) => k.indexStand && heute - Date.parse(k.indexStand) <= 2 * 86_400_000);
        const versiegelt = n!.sets.filter((s) => s.erweiterung === jung.erweiterung).flatMap((s) => s.versiegelt);
        neu = neuerscheinungStory({
          setName: jung.name,
          tageSeitErscheinen: Math.floor((heute - Date.parse(jung.datum)) / 86_400_000),
          karten: validateMarketData(karten).clean,
          versiegelt: versiegelt.map((v) => ({ name: v.name, trend: v.preis.trend })),
        }, siteUrl);
      }
    } catch (err) {
      console.warn('[autopilot] Neuerscheinung nicht möglich:', err instanceof Error ? err.message : err);
    }
  }
  // Ohne dünn gehandelte Klassiker-Ausreißer — sonst eröffnet „Top-Mover"
  // jede Woche mit derselben Karte, die drei Verkäufe bewegt haben.
  const setListe = await ladeSetListe(250).catch(() => null);
  const setDatum = new Map<string, string>((setListe?.sets ?? []).map((s) => [s.id, s.releaseDate]));
  const story = neu ?? buildStory(ohneDuenneAusreisser(validateMarketData(basis.karten).clean, setDatum), siteUrl, { rotation });
  if (!story) throw new Error('Keine ausreichenden Marktdaten fuer ein Reel');

  const mp4 = await renderStory(story);
  const ablage = await ablegen(datum, `reel-${story.conceptId}.mp4`, mp4, 'video/mp4');
  return {
    caption: story.caption,
    dateien: [ablage.url],
    async veroeffentlichen(k, fristMs) {
      const container = await reelContainer(k, ablage.url, story.caption);
      if (!(await containerFertigBis(k, container, fristMs, 6_000))) return { offen: container };
      return { mediaId: await veroeffentliche(k, container) };
    },
  };
}

export interface NachholErgebnis {
  veroeffentlicht: Array<{ art: string; mediaId: string }>;
  weiterOffen: number;
  verworfen: Array<{ art: string; grund: string }>;
}

/**
 * Veroeffentlicht vorgemerkte Container von heute und gestern.
 *
 * Gestern mit, weil ein Container bei Meta 24 Stunden gilt: Ein Reel, das
 * kurz vor Mitternacht vorgemerkt wurde, soll nicht verloren gehen.
 */
export async function holeNach(k: IgKonfig, jetzt: Date = new Date()): Promise<NachholErgebnis> {
  const ergebnis: NachholErgebnis = { veroeffentlicht: [], weiterOffen: 0, verworfen: [] };
  const tage = [berlinerDatum(jetzt), berlinerDatum(new Date(jetzt.getTime() - 86_400_000))];
  for (const datum of tage) {
    const offen = await leseOffen(datum);
    if (offen.length === 0) continue;
    const bleibt: OffeneVeroeffentlichung[] = [];
    for (const o of offen) {
      try {
        if (await containerFertigBis(k, o.containerId, 20_000, 4_000)) {
          const mediaId = await veroeffentliche(k, o.containerId);
          ergebnis.veroeffentlicht.push({ art: o.art, mediaId });
        } else {
          bleibt.push(o);
        }
      } catch (err) {
        // ERROR/EXPIRED oder abgelaufen: nicht endlos weiter versuchen.
        ergebnis.verworfen.push({ art: o.art, grund: meldung(err) });
      }
    }
    ergebnis.weiterOffen += bleibt.length;
    if (bleibt.length > 0) await merkeOffen(datum, bleibt);
    else await vergissOffen(datum);
  }
  return ergebnis;
}

export async function fuehreAutopilotAus(opt: AutopilotOptionen = {}): Promise<AutopilotErgebnis> {
  const start = Date.now();
  const jetzt = opt.jetzt ?? new Date();
  const datum = berlinerDatum(jetzt);
  const plan = planFuer(jetzt);
  const art = opt.art ?? plan.art;
  const k = igKonfig();
  const trocken = opt.trocken === true;
  const siteUrl = siteUrlOrLocal();

  const ergebnis: AutopilotErgebnis = {
    datum,
    art,
    trocken,
    konfiguriert: Boolean(k),
    feed: { status: 'uebersprungen' },
    story: { status: 'uebersprungen' },
    dauerMs: 0,
  };

  if (!k && !trocken) {
    const grund = 'INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID nicht gesetzt';
    ergebnis.feed = { status: 'uebersprungen', grund };
    ergebnis.story = { status: 'uebersprungen', grund };
    ergebnis.dauerMs = Date.now() - start;
    return ergebnis;
  }

  // ── FEED ──────────────────────────────────────────────────────────────────
  try {
    let schonDa: string | null = null;
    if (k && !trocken) {
      // Zuerst Liegengebliebenes veroeffentlichen. Ein heute vorgemerkter
      // Feed-Beitrag zaehlt als „schon da" — sonst entstuende ein zweiter.
      const nach = await holeNach(k, jetzt);
      if (nach.veroeffentlicht.length > 0) ergebnis.nachgeholt = nach.veroeffentlicht.length;
      const heuteOffen = (await leseOffen(datum)).some((o) => o.art !== 'story');
      if (heuteOffen) schonDa = `Am ${datum} wartet bereits ein Feed-Beitrag auf Meta`;
      else if (!opt.erzwingen && heuteSchonGepostet(await letzteBeitraege(k, 10), datum)) {
        schonDa = `Am ${datum} gibt es bereits einen Feed-Beitrag`;
      }
    }
    if (schonDa) {
      ergebnis.feed = { status: 'uebersprungen', grund: schonDa };
    } else {
      const vorbereitet =
        art === 'reel'
          ? await bereiteReelVor(datum, siteUrl, plan.rotation)
          : await bereiteKarussellVor(datum, siteUrl);
      ergebnis.caption = vorbereitet.caption;

      const verstoesse = captionVerstoesse(vorbereitet.caption);
      if (verstoesse.length > 0) {
        ergebnis.feed = {
          status: 'fehler',
          grund: `Bildunterschrift verletzt Inhaltsregeln: ${verstoesse.join(', ')}`,
          dateien: vorbereitet.dateien,
        };
      } else if (trocken || !k) {
        ergebnis.feed = { status: 'trocken', dateien: vorbereitet.dateien };
      } else {
        // Frist: Restbudget minus Reserve fuer Story und Antwort. Reicht sie
        // nicht, wird der Container fuer den Nachhol-Lauf vorgemerkt statt
        // verloren zu gehen.
        const frist = BUDGET_MS - (Date.now() - start) - 40_000;
        const r = await vorbereitet.veroeffentlichen(k, frist);
        // Veröffentlicht oder bei Meta vorgemerkt — beides erscheint.
        await merkeGezeigt(datum, vorbereitet.gezeigt ?? []);
        if ('mediaId' in r) {
          ergebnis.feed = { status: 'veroeffentlicht', mediaId: r.mediaId, dateien: vorbereitet.dateien };
        } else {
          const vorher = await leseOffen(datum);
          await merkeOffen(datum, [...vorher, { containerId: r.offen, art, erstellt: new Date().toISOString() }]);
          ergebnis.feed = {
            status: 'wartet',
            grund: 'Meta verarbeitet noch — der Nachhol-Lauf veroeffentlicht den Beitrag',
            dateien: vorbereitet.dateien,
          };
        }
      }
    }
  } catch (err) {
    console.error('[autopilot] Feed fehlgeschlagen:', err);
    ergebnis.feed = { status: 'fehler', grund: meldung(err) };
  }

  // ── STORY ─────────────────────────────────────────────────────────────────
  try {
    if (opt.ohneStory) {
      ergebnis.story = { status: 'uebersprungen', grund: 'abgewaehlt' };
    } else if (Date.now() - start > BUDGET_MS - 60_000) {
      // Ein Reel mit langer Verarbeitung bei Meta kann das Budget aufbrauchen.
      // Dann lieber keine Story als eine abgebrochene Funktion.
      ergebnis.story = { status: 'uebersprungen', grund: 'Zeitbudget nach dem Feed-Beitrag aufgebraucht' };
    } else if (k && !trocken && !opt.erzwingen && heuteSchonGepostet(await aktiveStories(k), datum)) {
      ergebnis.story = { status: 'uebersprungen', grund: `Am ${datum} gibt es bereits eine Story` };
    } else {
      const lage = await ladeMarktlage();
      if (!lage) throw new Error('Zu wenig Marktdaten fuer eine Story');
      const einwand = datenTaugen(lage.quelle, lage.datenTag, datum);
      if (einwand) throw new Error(einwand);
      // Die Karte mit der staerksten Bewegung, mit Kartenbild — im Hochformat
      // das staerkste Motiv. KEINE Marktlage mit Index: Der CardBeacon Index
      // rechnet noch auf dem Monate alten Bestand (siehe datenTaugen).
      const mover = lage.gewinner[0] ?? lage.verlierer[0];
      if (!mover) throw new Error('Keine gemessene Bewegung fuer eine Story');
      const titel = mover.trend >= 0 ? 'Stärkster Anstieg · 30 Tage' : 'Stärkster Rückgang · 30 Tage';
      const png = await rendereBewegung(mover, lage, 'reel', titel);
      const ablage = await ablegen(datum, 'story-bewegung.jpg', await alsJpeg(png), 'image/jpeg');

      if (trocken || !k) {
        ergebnis.story = { status: 'trocken', dateien: [ablage.url] };
      } else {
        const container = await bildContainer(k, ablage.url, { story: true });
        await warteAufContainer(k, container, 60_000, 3_000);
        const mediaId = await veroeffentliche(k, container);
        ergebnis.story = { status: 'veroeffentlicht', mediaId, dateien: [ablage.url] };
      }
    }
  } catch (err) {
    console.error('[autopilot] Story fehlgeschlagen:', err);
    ergebnis.story = { status: 'fehler', grund: meldung(err) };
  }

  // ── AUFRAEUMEN ────────────────────────────────────────────────────────────
  try {
    ergebnis.aufgeraeumt = await aufraeumen(datum);
  } catch (err) {
    console.warn('[autopilot] Aufraeumen fehlgeschlagen:', err);
  }

  ergebnis.dauerMs = Date.now() - start;
  return ergebnis;
}
