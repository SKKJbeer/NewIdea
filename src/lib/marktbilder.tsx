import { getHomepageCards } from '@/lib/homepage-data';
import { wertvollsteAusIndex, cardsFromIndex } from '@/lib/card-index';
import { leseFrischpreise } from '@/lib/frischpreise';
import type { PokemonCard } from '@/types';
import {
  computePmi,
  computeFearGreed,
  marketBreadth,
  rankSets,
  splitMovers,
  validateMarketData,
  fearGreedLabel,
} from '@/lib/market-metrics';
import { displayPrice } from '@/lib/pokemon-api';
import { getMarketBenchmark } from '@/lib/market-context';
import {
  rendereStory,
  BigMover,
  SetBattle,
  MarketState,
  CardVsMarket,
  type MoverDaten,
  type StoryFormat,
} from '@/lib/story-frames';

// MARKTBILDER AUS ECHTEN DATEN — eine Quelle fuer Route und Autopilot.
//
// Frueher stand diese Logik in der Route `/api/story/[vorlage]`. Mit dem
// Instagram-Autopiloten gab es einen zweiten Abnehmer. Eine zweite Fassung
// haette genau das Risiko erzeugt, das die Route verhindern soll: Ein Beitrag,
// der einen anderen Marktstand nennt als die verlinkte Seite.
//
// Die Marktlage wird EINMAL geladen und fuer alle Bilder eines Karussells
// verwendet — vier Bilder aus vier Abrufen koennten vier verschiedene Staende
// zeigen, wenn dazwischen die Erfassung weiterlaeuft.

export const VORLAGEN = ['big-mover', 'set-battle', 'market-state', 'card-vs-market'] as const;
export type Vorlage = (typeof VORLAGEN)[number];

export function istVorlage(v: string): v is Vorlage {
  return (VORLAGEN as readonly string[]).includes(v);
}

export interface Marktlage {
  /**
   * `frisch`: tagesaktuelle Cardmarket-Werte der wertvollsten Karten (TCGdex,
   * siehe `frischpreise.ts`) — die einzige Quelle mit belegter Aktualitaet.
   * `index`: Tagesstand aus dem eigenen Kartenindex. ACHTUNG: Der Index wird
   * zwar taeglich geschrieben, die Preise darin stammen aber aus pokemontcg.io
   * und sind dort drei bis zehn Monate alt (gemessen 27.09.2026).
   * `stichprobe`: Rueckfall auf den Live-Abruf der Startseite. Der Autopilot
   * veroeffentlicht daraus NICHTS (siehe `wertvollsteAusIndex`).
   */
  quelle: 'frisch' | 'index' | 'stichprobe';
  /** Datum der Daten (YYYY-MM-DD), nicht des Renderns. `null` = unbekannt. */
  datenTag: string | null;
  cbi: { value: number; cardCount: number; setCount: number };
  mover: MoverDaten | null;
  /** Staerkste Anstiege, absteigend — mit Kartenbild (fuer Karussells). */
  gewinner: MoverDaten[];
  /** Staerkste Rueckgaenge — mit Kartenbild. */
  verlierer: MoverDaten[];
  setsSortiert: Array<{ name: string; avgTrend: number }>;
  breitePct: number;
  temperatur: string;
  datenstand: string;
}

/**
 * Laedt ein Kartenbild als Data-URI fuer Satori.
 *
 * Satori holt entfernte Bilder zwar selbst, bricht dann aber das ganze Rendern
 * ab, wenn der Abruf scheitert. Vorher laden heisst: Scheitert er, entsteht
 * das Bild eben ohne Karte.
 */
async function bildAlsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const typ = res.headers.get('content-type')?.split(';')[0] || 'image/png';
    if (!typ.startsWith('image/')) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:${typ};base64,${bytes.toString('base64')}`;
  } catch (err) {
    console.warn('[marktbilder] Kartenbild nicht geladen:', (err as Error).message);
    return null;
  }
}

/** `null`, wenn die Datenlage keine Marktaussage traegt — dann entsteht kein Bild. */
/** Index-Metadaten in Stuecken zu 200 — `cardsFromIndex` kappt still bei 200. */
async function indexMetadaten(ids: string[]) {
  const alle = new Map<string, PokemonCard>();
  for (let i = 0; i < ids.length; i += 200) {
    const teil = await cardsFromIndex(ids.slice(i, i + 200));
    for (const [id, k] of teil) alle.set(id, k);
  }
  return alle;
}

/**
 * Karten fuer Marktbilder und Reels. Reihenfolge: Frischpreise (belegt
 * aktuell) → Kartenindex → Stichprobe. `quelle` sagt, was es geworden ist —
 * veroeffentlicht wird nur aus `frisch` (siehe `datenTaugen`).
 */
export async function ladeMarktkarten(): Promise<{ karten: PokemonCard[]; quelle: Marktlage['quelle']; datenTag: string | null }> {
  const frisch = await leseFrischpreise().catch(() => null);
  if (frisch && frisch.karten.length >= 50) {
    const meta = await indexMetadaten(frisch.karten.map((k) => k.id));
    const karten: PokemonCard[] = [];
    for (const f of frisch.karten) {
      const m = meta.get(f.id);
      if (!m) continue;
      karten.push({
        ...m,
        prices: { ...m.prices, market: f.preis },
        trendPercent: f.bewegung ?? undefined,
        realData: f.bewegung !== null,
        cmPrices: {
          trend: f.preis,
          low: f.low ?? undefined,
          avgSell: f.avg ?? undefined,
          avg30: f.avg30 ?? undefined,
          updatedAt: f.updated,
        },
      });
    }
    if (karten.length >= 50) return { karten, quelle: 'frisch', datenTag: frisch.datum };
  }

  const ausIndex = await wertvollsteAusIndex(250).catch(() => ({ karten: [], stand: null }));
  // 100 als Schwelle: Darunter ist der Index offensichtlich unvollstaendig
  // (Durchlauf abgebrochen) — dann lieber die Stichprobe, klar gekennzeichnet.
  if (ausIndex.karten.length >= 100) {
    return { karten: ausIndex.karten, quelle: 'index', datenTag: ausIndex.stand };
  }
  return { karten: await getHomepageCards(250), quelle: 'stichprobe', datenTag: null };
}

function datumDeutsch(tag: string): string {
  const [j, m, t] = tag.split('-');
  return `${t}.${m}.${j}`;
}

export async function ladeMarktlage(): Promise<Marktlage | null> {
  const basis = await ladeMarktkarten();
  const cards = validateMarketData(basis.karten).clean;
  const berechnet = computePmi(cards);

  // Der Indexwert kommt aus dem gespeicherten Tagesstand — dieselbe Zahl wie
  // auf der Startseite. Fehlt er, greift die eigene Rechnung.
  const gespeichert = await getMarketBenchmark().catch(() => null);
  const indexWert = gespeichert?.value ?? (berechnet.sufficient ? berechnet.value : null);
  if (indexWert === null) return null;

  const cbi = {
    value: indexWert,
    cardCount: gespeichert?.cardCount ?? berechnet.cardCount,
    setCount: gespeichert?.setCount ?? berechnet.setCount,
  };

  const { gainers, losers } = splitMovers(cards, 3);
  const alsMover = async (k: PokemonCard): Promise<MoverDaten> => ({
    name: k.nameDe ?? k.name,
    set: k.set,
    trend: k.trendPercent as number,
    preis: displayPrice(k),
    gegenMarkt: (k.trendPercent as number) - cbi.value,
    bild: k.imageUrl ? await bildAlsDataUri(k.imageUrl) : null,
  });
  const gewinner = await Promise.all(gainers.slice(0, 3).map(alsMover));
  const verlierer = await Promise.all(losers.slice(0, 1).map(alsMover));
  const mover: MoverDaten | null = gewinner[0] ?? null;

  const setsSortiert = rankSets(cards, 99)
    .filter((s): s is typeof s & { avgTrend: number } => typeof s.avgTrend === 'number')
    .map((s) => ({ name: s.name, avgTrend: s.avgTrend }))
    .sort((a, b) => b.avgTrend - a.avgTrend);

  const temperatur = computeFearGreed(cards);

  return {
    quelle: basis.quelle,
    datenTag: basis.datenTag,
    cbi,
    mover,
    gewinner,
    verlierer,
    setsSortiert,
    breitePct: marketBreadth(cards).pct,
    temperatur: temperatur.sufficient ? fearGreedLabel(temperatur.value) : '—',
    // Das Datum der DATEN. Nur wenn es unbekannt ist (Stichprobe), das heutige —
    // die Stichprobe ist ein Live-Abruf, also tatsaechlich von heute.
    datenstand: basis.datenTag
      ? datumDeutsch(basis.datenTag)
      : new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
}

/** Rendert eine Vorlage. `null`, wenn genau diese Vorlage keine Grundlage hat. */
export async function rendereMarktbild(
  vorlage: Vorlage,
  lage: Marktlage,
  format: StoryFormat,
): Promise<Buffer | null> {
  let element: React.ReactElement;
  switch (vorlage) {
    case 'big-mover':
      if (!lage.mover) return null;
      element = <BigMover karte={lage.mover} format={format} datenstand={lage.datenstand} />;
      break;
    case 'set-battle': {
      const s = lage.setsSortiert;
      if (s.length < 2) return null;
      element = (
        <SetBattle
          a={{ name: s[0].name, trend: s[0].avgTrend }}
          b={{ name: s[s.length - 1].name, trend: s[s.length - 1].avgTrend }}
          format={format}
          datenstand={lage.datenstand}
        />
      );
      break;
    }
    case 'market-state':
      element = (
        <MarketState
          markt={{
            cbi: lage.cbi.value,
            breite: lage.breitePct,
            temperatur: lage.temperatur,
            karten: lage.cbi.cardCount,
            sets: lage.cbi.setCount,
          }}
          format={format}
          datenstand={lage.datenstand}
        />
      );
      break;
    case 'card-vs-market':
      if (!lage.mover) return null;
      element = <CardVsMarket karte={lage.mover} cbi={lage.cbi.value} format={format} datenstand={lage.datenstand} />;
      break;
  }
  return rendereStory(element, format);
}

/** Eine einzelne Bewegung als Bild — fuer das Karussell aus Kartenbildern. */
export async function rendereBewegung(
  mover: MoverDaten,
  lage: Marktlage,
  format: StoryFormat,
  titel: string,
): Promise<Buffer> {
  return rendereStory(<BigMover karte={mover} format={format} datenstand={lage.datenstand} titel={titel} />, format);
}
