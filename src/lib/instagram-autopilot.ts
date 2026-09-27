import sharp from 'sharp';
import { getHomepageCards } from '@/lib/homepage-data';
import { buildStory } from '@/lib/reel-concepts';
import { renderStory } from '@/lib/reel-generator';
import { ladeMarktlage, rendereMarktbild } from '@/lib/marktbilder';
import { siteUrlOrLocal } from '@/lib/site';
import {
  planFuer,
  karussellCaption,
  captionVerstoesse,
  KARUSSELL_VORLAGEN,
  type Beitragsart,
} from '@/lib/social-plan';
import { ablegen, aufraeumen } from '@/lib/social-speicher';
import {
  igKonfig,
  bildContainer,
  karussellContainer,
  reelContainer,
  warteAufContainer,
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
  status: 'veroeffentlicht' | 'trocken' | 'uebersprungen' | 'fehler';
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

interface Vorbereitet {
  caption: string;
  dateien: string[];
  veroeffentlichen: (k: IgKonfig) => Promise<string>;
}

async function bereiteKarussellVor(datum: string, siteUrl: string): Promise<Vorbereitet> {
  const lage = await ladeMarktlage();
  if (!lage) throw new Error('Zu wenig Marktdaten fuer ein Karussell');

  const urls: string[] = [];
  for (const vorlage of KARUSSELL_VORLAGEN) {
    const png = await rendereMarktbild(vorlage, lage, 'post');
    if (!png) continue; // diese Vorlage hat heute keine Grundlage
    const ablage = await ablegen(datum, `karussell-${urls.length + 1}-${vorlage}.jpg`, await alsJpeg(png), 'image/jpeg');
    urls.push(ablage.url);
  }
  if (urls.length < 2) throw new Error(`Nur ${urls.length} Bild(er) mit Datengrundlage — Karussell braucht mindestens zwei`);

  const caption = karussellCaption(lage, siteUrl);
  return {
    caption,
    dateien: urls,
    async veroeffentlichen(k) {
      const kinder: string[] = [];
      for (const url of urls) kinder.push(await bildContainer(k, url, { karussellElement: true }));
      for (const kind of kinder) await warteAufContainer(k, kind, 60_000, 3_000);
      const container = await karussellContainer(k, kinder, caption);
      await warteAufContainer(k, container, 60_000, 3_000);
      return veroeffentliche(k, container);
    },
  };
}

async function bereiteReelVor(datum: string, siteUrl: string, rotation: number): Promise<Vorbereitet> {
  // Dieselbe Grundlage wie die Startseite — mit Rueckfall auf den letzten
  // gespeicherten Marktbericht, wenn die Kartendatenbank gerade nicht antwortet.
  const karten = await getHomepageCards(250);
  const story = buildStory(karten, siteUrl, { rotation });
  if (!story) throw new Error('Keine ausreichenden Marktdaten fuer ein Reel');

  const mp4 = await renderStory(story);
  const ablage = await ablegen(datum, `reel-${story.conceptId}.mp4`, mp4, 'video/mp4');
  return {
    caption: story.caption,
    dateien: [ablage.url],
    async veroeffentlichen(k) {
      const container = await reelContainer(k, ablage.url, story.caption);
      await warteAufContainer(k, container, 170_000, 6_000);
      return veroeffentliche(k, container);
    },
  };
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
    let schonDa = false;
    if (k && !opt.erzwingen && !trocken) {
      schonDa = heuteSchonGepostet(await letzteBeitraege(k, 10), datum);
    }
    if (schonDa) {
      ergebnis.feed = { status: 'uebersprungen', grund: `Am ${datum} gibt es bereits einen Feed-Beitrag` };
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
        const mediaId = await vorbereitet.veroeffentlichen(k);
        ergebnis.feed = { status: 'veroeffentlicht', mediaId, dateien: vorbereitet.dateien };
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
      // Im Wechsel: die Karte mit der staerksten Bewegung (mit Kartenbild —
      // im Hochformat das staerkste Motiv) und die Marktlage. Hat die Karte
      // heute keine Grundlage, springt die Marktlage ein.
      const bevorzugt = plan.wochentag % 2 === 0 ? 'big-mover' : 'market-state';
      const png =
        (await rendereMarktbild(bevorzugt, lage, 'reel')) ??
        (await rendereMarktbild('market-state', lage, 'reel'));
      if (!png) throw new Error('Marktlage ohne Grundlage');
      const ablage = await ablegen(datum, `story-${bevorzugt}.jpg`, await alsJpeg(png), 'image/jpeg');

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
