import type { PokemonCard } from '@/types';
import { getHomepageCards } from './homepage-data';
import { getMarketBasis } from './market-basis';
import { cardsFromIndex } from './card-index';
import { leseFrischpreise } from './frischpreise';
import { leseNeuheiten, neuheitenAktuell, type NeuheitenDatei } from './neuheiten';
import { bewegung30 } from './neuheiten-zuordnung';
import { rankSets, computePmi, marketBreadth, validateMarketData, type SetRank } from './market-metrics';
import { fetchTrendingCards } from './pokemon-api';

// MARKTLAGE — EIN Faktenblock für alle automatisch erzeugten Texte.
//
// Befund 28.09.2026 (Nutzer: Berichte „zu steril", ohne echte aktuelle Trends):
//  - Artikel, Newsletter, Studio-Texte und Reels holten ihre Karten über
//    `fetchTrendingCards` — eine feste Set-Liste von 2023/24 (sv3pt5 … sv8)
//    mit pokemontcg.io-Preisen, die Monate alt sind (Stolperstelle 62).
//  - Der Marktbericht hatte frische Karten, bekam im Prompt aber nur zehn
//    davon: kein Index, keine Marktbreite, keine Set-Bewegung, keine neuen
//    Sets, kein Japan-Vorlauf. Worüber das Modell nichts weiß, darüber
//    schreibt es nicht — oder es füllt die Lücke mit Allgemeinplätzen.
//
// Hier steht alles, was „aktueller Trend" bei uns heißen darf, mit Quelle:
//  - BESTÄTIGTE Bewegungen aus dem Tagesstand der 400 wertvollsten Karten
//    (Trend gegen Ø 30, durch die Verkäufe der letzten sieben Tage gedeckt —
//    `bestaetigteBewegung`). Ein Einzelangebot macht keinen Trend.
//  - Index (Median) und Marktbreite aus dem ganzen frischen Bestand.
//  - Set-Bewegung (Median je Set) aus den frischen Karten.
//  - Neuheiten, versiegelte Produkte, Japan zuerst, Angekündigtes
//    (`themen/neuheiten.json`).
// Was keine Quelle belegt, steht nicht im Block — und darf deshalb auch nicht
// im Text stehen (die Prompts sagen das ausdrücklich).

/** Kleinere Bewegungen sind Rauschen, keine Nachricht. */
export const MIN_TREND_BEWEGUNG = 5;
/** Unter diesem Preis bewegt ein einzelner Verkauf den Trend um zweistellige Prozente. */
export const MIN_TREND_PREIS = 2;

export interface BestaetigteBewegung {
  karte: PokemonCard;
  /** Trend gegen Ø 30 in Prozent, durch Ø 7 bestätigt. */
  bewegung: number;
  preis: number;
}

export interface MarktLage {
  /** Quellstand der Preise (YYYY-MM-DD), soweit bekannt. */
  stand: string | null;
  /** Frische Karten aus dem eigenen Index (wertvollste zuerst). */
  pool: PokemonCard[];
  bestaetigt: BestaetigteBewegung[];
  sets: SetRank[];
  cbi: { wert: number; karten: number } | null;
  breite: { steigend: number; fallend: number; gesamt: number } | null;
  neuheiten: NeuheitenDatei | null;
}

const LEER: MarktLage = { stand: null, pool: [], bestaetigt: [], sets: [], cbi: null, breite: null, neuheiten: null };

/** Lädt die Marktlage. Wirft nie — fehlende Teile bleiben leer und fehlen im Text. */
export async function ladeMarktLage(): Promise<MarktLage> {
  const [pool, basis, frisch, neuheiten] = await Promise.all([
    getHomepageCards(250).catch(() => [] as PokemonCard[]),
    getMarketBasis().catch(() => null),
    leseFrischpreise().catch(() => null),
    leseNeuheiten().catch(() => null),
  ]);
  const lage: MarktLage = { ...LEER, pool, neuheiten: neuheitenAktuell(neuheiten) ? neuheiten : null };

  if (basis && basis.quelle === 'index') {
    const sauber = validateMarketData(basis.karten).clean;
    const pmi = computePmi(sauber);
    if (pmi.sufficient) lage.cbi = { wert: pmi.value, karten: pmi.cardCount };
    const b = marketBreadth(sauber);
    if (b.total > 0) lage.breite = { steigend: b.up, fallend: b.down, gesamt: b.total };
    lage.stand = basis.stand ?? null;
  }

  lage.sets = rankSets(validateMarketData(pool).clean, 40);

  if (frisch) {
    lage.stand = lage.stand ?? frisch.datum;
    const kandidaten = frisch.karten.filter(
      (k) => k.bewegung !== null && Math.abs(k.bewegung) >= MIN_TREND_BEWEGUNG && k.preis >= MIN_TREND_PREIS,
    );
    // Stammdaten (Name, Set, Bild) aus dem Index — in Stücken, cardsFromIndex
    // kappt bei 200 (Stolperstelle 54).
    const ids = kandidaten.map((k) => k.id);
    const karten = new Map<string, PokemonCard>();
    for (let i = 0; i < ids.length; i += 200) {
      const m = await cardsFromIndex(ids.slice(i, i + 200)).catch(() => new Map<string, PokemonCard>());
      for (const [id, k] of m) karten.set(id, k);
    }
    lage.bestaetigt = kandidaten
      .flatMap((k) => {
        const karte = karten.get(k.id);
        return karte ? [{ karte: { ...karte, trendPercent: k.bewegung as number, realData: true }, bewegung: k.bewegung as number, preis: k.preis }] : [];
      })
      .sort((a, b) => Math.abs(b.bewegung) - Math.abs(a.bewegung));
  }
  return lage;
}

/**
 * Karten für Themenwahl, Newsletter, Reels: bestätigte Bewegungen zuerst,
 * danach die wertvollsten frischen Karten. Ersetzt `fetchTrendingCards`
 * (alte Set-Liste, alte Preise) — der bleibt nur Rückfall, wenn der eigene
 * Index gar nichts liefert.
 */
export function trendKarten(lage: MarktLage, anzahl: number): PokemonCard[] {
  const aus: PokemonCard[] = [];
  const gesehen = new Set<string>();
  for (const k of [...lage.bestaetigt.map((b) => b.karte), ...lage.pool]) {
    if (aus.length >= anzahl) break;
    if (gesehen.has(k.id)) continue;
    gesehen.add(k.id);
    aus.push(k);
  }
  return aus;
}

export async function aktuelleTrendKarten(anzahl = 30): Promise<PokemonCard[]> {
  const karten = trendKarten(await ladeMarktLage(), anzahl);
  if (karten.length > 0) return karten;
  console.warn('[Marktlage] Eigener Index ohne Karten — Rückfall auf pokemontcg.io (alte Preise)');
  return fetchTrendingCards(anzahl);
}

// ── Text für die Prompts ────────────────────────────────────────────────────

// toFixed erlaubt: Prompt-Text für die KI, wird nie angezeigt (deutsches Komma trotzdem,
// damit das Modell die Zahlen so übernimmt, wie die Seite sie schreibt).
const pz = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}\u00A0%`;
// toFixed erlaubt: Prompt-Text für die KI, wird nie angezeigt
const eur = (v: number) => `${v.toFixed(2).replace('.', ',')}\u00A0€`;
const tageSeit = (iso: string, jetzt: number) => Math.max(0, Math.floor((jetzt - Date.parse(iso.slice(0, 10))) / 86_400_000));

export interface TextOptionen {
  /** Euro-Beträge in den Block aufnehmen. Artikel: nein (keine Preise im Fließtext). */
  preise: boolean;
  jetzt?: number;
}

/**
 * Die Marktlage als Prompt-Block. Rein — getestet. Jede Zeile nennt ihre
 * Messgröße, damit das Modell „30-Tage-Bewegung" nicht zu „diese Woche" macht.
 */
export function marktLageText(lage: MarktLage, opt: TextOptionen): string {
  const jetzt = opt.jetzt ?? Date.now();
  const z: string[] = [];
  const mitPreis = (p: number) => (opt.preise ? `, ${eur(p)}` : '');

  if (lage.cbi) z.push(`- Marktindex (Median der 30-Tage-Bewegung über ${lage.cbi.karten} Karten): ${pz(lage.cbi.wert)}`);
  if (lage.breite) {
    const anteil = Math.round((lage.breite.steigend / lage.breite.gesamt) * 100);
    z.push(`- Marktbreite: ${anteil}\u00A0% der Karten liegen über ihrem 30-Tage-Schnitt (${lage.breite.steigend} steigend, ${lage.breite.fallend} fallend)`);
  }

  const hoch = lage.bestaetigt.filter((b) => b.bewegung > 0).slice(0, 6);
  const runter = lage.bestaetigt.filter((b) => b.bewegung < 0).slice(0, 6);
  const zeile = (b: BestaetigteBewegung) => `${b.karte.name} (${b.karte.set}) ${pz(b.bewegung)}${mitPreis(b.preis)}`;
  if (hoch.length) z.push(`- Bestätigte Aufwärtsbewegungen (Preis-Trend gegen Ø 30 Tage, durch die Verkäufe der letzten 7 Tage gedeckt): ${hoch.map(zeile).join('; ')}`);
  if (runter.length) z.push(`- Bestätigte Abwärtsbewegungen (gleiche Messung): ${runter.map(zeile).join('; ')}`);

  const mitTrend = lage.sets.filter((s) => s.avgTrend !== null);
  const setsHoch = [...mitTrend].filter((s) => (s.avgTrend as number) > 0).sort((a, b) => (b.avgTrend as number) - (a.avgTrend as number)).slice(0, 4);
  const setsRunter = [...mitTrend].filter((s) => (s.avgTrend as number) < 0).sort((a, b) => (a.avgTrend as number) - (b.avgTrend as number)).slice(0, 3);
  const setZeile = (s: SetRank) => `${s.name} ${pz(s.avgTrend as number)} (${s.count} Karten${s.topMover ? `, stärkste Karte ${s.topMover.name} ${pz(s.topMover.trend)}` : ''})`;
  if (setsHoch.length) z.push(`- Sets mit der stärksten 30-Tage-Bewegung (Median je Set): ${setsHoch.map(setZeile).join('; ')}`);
  if (setsRunter.length) z.push(`- Sets mit der schwächsten 30-Tage-Bewegung: ${setsRunter.map(setZeile).join('; ')}`);

  const n = lage.neuheiten;
  const neu: string[] = [];
  if (n) {
    for (const s of n.sets.slice(0, 4)) {
      const produkte = s.versiegelt.slice(0, 4).map((p) => {
        const b = bewegung30(p.preis);
        return `${p.name}${mitPreis(p.preis.trend)}${b !== null ? ` (30 Tage ${pz(b)})` : ''}`;
      });
      neu.push(`- Neues Set „${s.name}“ (${s.setCode}), erschienen am ${s.datum}, vor ${tageSeit(s.datum, jetzt)} Tagen, ${s.gesamt} Karten${produkte.length ? `; versiegelte Produkte: ${produkte.join('; ')}` : ''}`);
    }
    for (const j of n.japan.slice(0, 2)) {
      const karten = j.karten.slice(0, 3).map((k) => `${k.nameEn ?? k.name}${mitPreis(k.preis.trend)}`).join('; ');
      neu.push(`- Bereits in Japan erschienen: „${j.nameEn ?? j.name}“ (${j.id}) am ${j.datum}; eine englische Ausgabe führen die Quellen noch nicht. Teuerste japanische Karten: ${karten}`);
    }
    if (n.kommend.length) {
      neu.push(`- Angekündigte englische Sets mit Erscheinungsdatum: ${n.kommend.map((k) => `„${k.name}“ am ${k.datum}`).join('; ')}`);
    } else {
      neu.push('- Angekündigte englische Sets mit Erscheinungsdatum: keine in den Quellen');
    }
  }

  if (z.length === 0 && neu.length === 0) return '';
  const teile = [`MARKTLAGE (Cardmarket, Quellstand ${lage.stand ?? 'unbekannt'} — NUR diese Fakten verwenden, nichts dazu erfinden):`];
  if (z.length) teile.push(...z);
  if (neu.length) teile.push('', 'NEUHEITEN UND AUSBLICK-FAKTEN:', ...neu);
  return teile.join('\n');
}

/** Regeln für Trend- und Ausblick-Abschnitte — in jedem Prompt dieselben. */
export const AUSBLICK_REGELN = `TRENDS UND AUSBLICK — Pflicht, wenn die MARKTLAGE Fakten dazu liefert:
- Trends: Benenne die bestätigten Bewegungen und die Set-Bewegungen konkret (Kartenname, Set, Prozentwert, Messgröße „gegen den 30-Tage-Schnitt"). Ordne ein, WARUM — nur mit belegbaren Gründen aus den Fakten: Set-Alter (neu erschienen / seit Jahren im Umlauf), Jubiläum, versiegelte Produkte, japanischer Vorlauf.
- Ausblick: Was in den nächsten Wochen Beobachtung verdient — ausschließlich abgeleitet aus den Fakten (Sets kurz nach Erscheinen, in Japan bereits erschienene Sets, angekündigte Sets, laufende Bewegungen) und aus allgemein belegten Marktmustern (z. B. „Preise neuer Sets finden ihren Boden historisch einige Wochen nach Erscheinen").
- VERBOTEN im Ausblick: Preisprognosen („wird steigen", Zielpreise), erfundene Erscheinungstermine oder Ankündigungen, Kaufempfehlungen. Neutrale Formulierungen: „verdient Beobachtung", „historisch folgte darauf", „bleibt abzuwarten".
- Ein Zeitraum heißt nur so, wie er gemessen ist: „gegen den 30-Tage-Schnitt", nie „diese Woche".`;
