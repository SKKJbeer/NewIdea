import { NextResponse } from 'next/server';
import { fetchCardById } from '@/lib/pokemon-api';
import { cardsFromIndex, cardIndexStand } from '@/lib/card-index';
import { fetchCMLanguagePrice, type CardLanguage } from '@/lib/cardmarket-api';
import { PriceDataPoint, PokemonCard } from '@/types';
import { getStoredPriceHistories, mergePriceHistory, recordPriceSnapshots } from '@/lib/price-history';
import { after } from 'next/server';

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
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    cards?: unknown[];
    cardIds?: unknown[];
  };

  let cards: CardRequest[];

  if (Array.isArray(body.cards)) {
    cards = (body.cards as Array<Record<string, unknown>>)
      .filter((c) => typeof c.id === 'string')
      .map((c) => ({
        id: c.id as string,
        language: ((c.language as string) || 'EN') as CardLanguage,
        name: (c.name as string) || '',
      }))
      .slice(0, 50);
  } else if (Array.isArray(body.cardIds)) {
    // Legacy format — treat all as English
    cards = (body.cardIds as string[])
      .filter((id) => typeof id === 'string')
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
      const live = await withTimeout(fetchCardById(c.id));
      const card = live ?? ausIndex.get(c.id) ?? null;
      if (!card) return null;
      const quelle: 'live' | 'index' = live ? 'live' : 'index';

      let price = card.prices.market || card.prices.holofoil?.market || 0;
      let priceLanguage: CardLanguage = 'EN';

      if (c.language !== 'EN') {
        const langPrice = await withTimeout(fetchCMLanguagePrice(c.name || card.name, c.language));
        if (langPrice !== null) {
          price = langPrice;
          priceLanguage = c.language;
        }
        // If CM not configured or no result, fall back to English Cardmarket price
      }

      const stored = storedByCard[c.id] ?? [];
      // Ohne `realData`-Bedingung: `priceHistory` wird ohnehin nur gesetzt,
      // wenn echte Cardmarket-Daten vorliegen — eine zusätzliche Prüfung würde
      // hier nur bestehendes Verhalten verengen.
      const anchors = card.priceHistory ?? [];

      return {
        id: c.id,
        card,
        data: {
          price,
          priceHistory: mergePriceHistory(anchors, stored),
          dailyPoints: stored.length,
          name: card.name,
          set: card.set,
          setCode: card.setCode,
          imageUrl: card.imageUrl,
          priceLanguage,
          quelle,
          indexStand: quelle === 'index' ? indexStand : undefined,
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
