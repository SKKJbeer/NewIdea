import { NextResponse } from 'next/server';
import { fetchCardById } from '@/lib/pokemon-api';
import { karteMitFrischpreis, mitIndexPreis } from '@/lib/frischpreis-karte';
import { cardsFromIndex, cardIndexStand } from '@/lib/card-index';
import { fetchCMLanguagePrice, type CardLanguage } from '@/lib/cardmarket-api';
import { PriceDataPoint, PokemonCard } from '@/types';
import { getStoredPriceHistories, mergePriceHistory, recordPriceSnapshots } from '@/lib/price-history';
import { buildCardmarketHistory } from '@/lib/pokemon-api';
import { sprachpreiseFuerKarte, type SprachGrund } from '@/lib/sprachpreise';
import { after } from 'next/server';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';

// MENGENBREMSE (seit v6.10.2): Eine Anfrage loest bis zu 50 Abrufe bei der
// Kartendatenbank (mit unserem Schluessel) und bei TCGdex aus. Ohne Grenze
// liesse sich ueber diese offene Route beides leerziehen. 30 je Minute und
// Adresse sind fuer jedes echte Portfolio reichlich.
const bremse = createRateLimiter({ limit: 30, windowMs: 60_000 });
const SPRACHEN = new Set<CardLanguage>(['EN', 'DE', 'JP', 'KR']);

export const maxDuration = 30;

interface CardRequest {
  id: string;
  language: CardLanguage;
  name: string;
}

interface LiveCardData {
  price: number;
  priceHistory: PriceDataPoint[];
  /**
   * Wie viele Punkte der Reihe echte Tages-Snapshots sind (nicht Cardmarket-Anker).
   *
   * Die Oberfläche sagt damit ehrlich, worauf die Kurve beruht. Ohne diese
   * Angabe sieht eine Reihe aus drei Ankerpunkten genauso aus wie eine aus
   * neunzig Tageswerten — und erweckt den Eindruck einer Messung, die es
   * nicht gab.
   */
  dailyPoints: number;
  name: string;
  set: string;
  setCode: string;
  imageUrl: string;
  priceLanguage: CardLanguage;
  /**
   * Woher der Preis stammt.
   *
   * `live`  — direkt von der Kartendatenbank, so aktuell wie sie selbst.
   * `index` — aus dem eigenen Kartenindex, weil der Abruf ausfiel. So aktuell
   *           wie der letzte Preis-Durchlauf.
   *
   * Die Unterscheidung MUSS nach aussen: Ein Preis vom Vortag ist brauchbar,
   * aber er darf nicht aussehen wie einer von jetzt.
   */
  quelle: 'live' | 'index';
  /** Datenstand des Index — nur bei `quelle: 'index'` gesetzt. */
  indexStand?: string | null;
  /** JP/KR: Stand des Cardmarket-Preisverzeichnisses und die zugeordnete Ausgabe. */
  sprachStand?: string;
  gegenstueck?: { id: string; name: string; setName: string };
  /** JP/KR ohne eigenen Preis: warum (dann steht `price` fuer die EN-Notierung). */
  sprachGrund?: SprachGrund;
}

export async function POST(request: Request) {
  const grenze = bremse(clientIp(request));
  if (!grenze.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(grenze.retryAfterSeconds) } });
  }
  const body = (await request.json().catch(() => ({}))) as {
    cards?: unknown[];
    cardIds?: unknown[];
  };

  let cards: CardRequest[];

  if (Array.isArray(body.cards)) {
    cards = (body.cards as Array<Record<string, unknown>>)
      .filter((c) => typeof c.id === 'string' && /^[a-zA-Z0-9.-]{1,40}$/.test(c.id as string))
      .map((c) => ({
        id: c.id as string,
        // Nur bekannte Sprachen — alles andere gilt als Englisch, statt
        // ungeprueft an die Cardmarket-Abfrage zu gehen.
        language: SPRACHEN.has(c.language as CardLanguage) ? (c.language as CardLanguage) : 'EN',
        name: typeof c.name === 'string' ? c.name.slice(0, 120) : '',
      }))
      .slice(0, 50);
  } else if (Array.isArray(body.cardIds)) {
    // Legacy format — treat all as English
    cards = (body.cardIds as string[])
      .filter((id) => typeof id === 'string' && /^[a-zA-Z0-9.-]{1,40}$/.test(id))
      .map((id) => ({ id, language: 'EN' as CardLanguage, name: '' }))
      .slice(0, 50);
  } else {
    return NextResponse.json({});
  }

  if (cards.length === 0) return NextResponse.json({});

  // Begrenzt jede Karten-Verarbeitung zeitlich, damit eine hängende Upstream-API (TCG/Cardmarket)
  // nicht die ganze Funktion bis zum Vercel-Hardlimit (maxDuration) blockiert.
  const PER_CARD_TIMEOUT_MS = 8000;
  function withTimeout<T>(p: Promise<T>): Promise<T | null> {
    return Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), PER_CARD_TIMEOUT_MS)),
    ]);
  }

  // Echte Tages-Snapshots für ALLE angefragten Karten in einer Abfrage holen.
  // Vorher bekam das Portfolio nur die Cardmarket-Anker (höchstens vier Punkte
  // je Karte) — die vorhandene Tages-Historie blieb ungenutzt.
  const storedByCard = await getStoredPriceHistories(cards.map((c) => c.id), 365);

  // Den Rueckfall VORAB in EINER Abfrage holen, nicht je gescheiterter Karte.
  // Er kostet nichts, wenn er nicht gebraucht wird, und verzoegert nichts,
  // wenn doch.
  const [ausIndex, indexInfo] = await Promise.all([
    cardsFromIndex(cards.map((c) => c.id)).catch(() => new Map()),
    cardIndexStand().catch(() => ({ zeilen: 0, stand: null })),
  ]);
  const indexStand = indexInfo.stand;

  const results = await Promise.allSettled(
    cards.map(async (c) => {
      // RUECKFALL AUF DEN EIGENEN INDEX, wenn der Abruf ausfaellt.
      //
      // Vorher stand hier `return null` — die Position verschwand dann
      // vollstaendig aus der Antwort, und die Oberflaeche zeigte „Kein
      // Marktpreis geladen". Bei einer Quelle, die auf etwa jede dritte
      // Anfrage mit einem Fehler antwortet, traf das regelmaessig die Haelfte
      // eines Portfolios.
      const roh = await withTimeout(fetchCardById(c.id));
      // Frischer Cardmarket-Stand (TCGdex, Vortag) — wirft nie, faellt still
      // auf den alten Stand zurueck (siehe frischpreis-karte.ts).
      const frisch = roh ? await karteMitFrischpreis(roh) : null;
      // Live-Abruf bei TCGdex gescheitert → frischer Preis aus dem Index.
      const ausIdx = ausIndex.get(c.id);
      const live = frisch && frisch.cmPrices?.quelle !== 'tcgdex' && ausIdx ? mitIndexPreis(frisch, ausIdx) : frisch;
      const card = live ?? ausIndex.get(c.id) ?? null;
      if (!card) return null;
      const quelle: 'live' | 'index' = live ? 'live' : 'index';

      let price = card.prices.market || card.prices.holofoil?.market || 0;
      let priceLanguage: CardLanguage = 'EN';

      const stored = storedByCard[c.id] ?? [];
      // Ohne `realData`-Bedingung: `priceHistory` wird ohnehin nur gesetzt,
      // wenn echte Cardmarket-Daten vorliegen — eine zusätzliche Prüfung würde
      // hier nur bestehendes Verhalten verengen.
      const anchors = card.priceHistory ?? [];
      let priceHistory = mergePriceHistory(anchors, stored);
      let dailyPoints = stored.length;
      let sprach: Pick<LiveCardData, 'sprachStand' | 'gegenstueck' | 'sprachGrund'> = {};

      if (c.language === 'JP' || c.language === 'KR') {
        // Eigene Notierung der japanischen/koreanischen Ausgabe — nur bei
        // EINDEUTIGER Zuordnung (sprach-zuordnung.ts). Verlauf dann aus
        // DEREN Cardmarket-Schnitten, nie aus den englischen Tageswerten:
        // Eine Kurve aus EN-Preisen mit einem JP-Endpunkt waere erfunden.
        const angabe = (await withTimeout(sprachpreiseFuerKarte(card)))?.find((a) => a.sprache === c.language);
        if (angabe?.ok) {
          price = angabe.preis.trend;
          priceLanguage = c.language;
          priceHistory = buildCardmarketHistory({
            trendPrice: angabe.preis.trend,
            averageSellPrice: angabe.preis.avg ?? 0,
            avg7: angabe.preis.avg7 ?? 0,
            avg30: angabe.preis.avg30 ?? 0,
            avg1: 0,
          });
          dailyPoints = 0;
          sprach = {
            sprachStand: angabe.stand,
            gegenstueck: { id: angabe.gegenstueck.id, name: angabe.gegenstueck.name, setName: angabe.gegenstueck.setName },
          };
        } else {
          sprach = { sprachGrund: angabe && !angabe.ok ? angabe.grund : 'nicht-geladen' };
        }
      } else if (c.language === 'DE' && card.cmPrices?.produkt) {
        // Deutsch: dasselbe Cardmarket-Produkt wie Englisch. Einen reinen
        // DE-Wert gibt es nur ueber die Cardmarket-API — und nur mit der
        // GENAUEN Produktnummer, nie per Namenssuche.
        const langPrice = await withTimeout(fetchCMLanguagePrice(card.cmPrices.produkt, 'DE'));
        if (langPrice !== null) {
          price = langPrice;
          priceLanguage = 'DE';
        }
      }

      return {
        id: c.id,
        card,
        data: {
          price,
          priceHistory,
          dailyPoints,
          name: card.name,
          set: card.set,
          setCode: card.setCode,
          imageUrl: card.imageUrl,
          priceLanguage,
          quelle,
          indexStand: quelle === 'index' ? indexStand : undefined,
          ...sprach,
        } satisfies LiveCardData,
      };
    }),
  );

  const data: Record<string, LiveCardData> = {};
  const abgerufen: PokemonCard[] = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      data[result.value.id] = result.value.data;
      // NUR live abgerufene Karten als Messpunkt zurueckschreiben. Ein Preis
      // aus dem Index ist eine Kopie von gestern — ihn als heutigen Snapshot
      // zu speichern waere eine erfundene Messung.
      if (result.value.data.quelle === 'live') abgerufen.push(result.value.card);
    }
  });

  // Den heutigen Preis der Portfolio-Karten mitschreiben. Ohne das bauen genau
  // die Karten, die jemanden interessieren, NIE eine Tages-Historie auf — sie
  // stehen weder in den Top-Karten des Cron-Laufs noch werden ihre Detailseiten
  // zwangsläufig aufgerufen. Nach der Antwort, damit es nichts verzögert.
  if (abgerufen.length > 0) {
    after(async () => {
      await recordPriceSnapshots(abgerufen).catch((err) =>
        console.error('Preis-Snapshots des Portfolios nicht gespeichert:', err),
      );
    });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
