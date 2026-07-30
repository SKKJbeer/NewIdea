import axios from 'axios';
import { PokemonCard, CardPrices } from '@/types';
import { germanToEnglishName, englishToGermanName } from './pokemon-names-de';

const TCG_API_BASE = 'https://api.pokemontcg.io/v2';

// Only send the API key header if a key is actually configured.
// An empty X-Api-Key header causes the API to return 403; no header = free-tier access.
function tcgHeaders(): Record<string, string> {
  const key = process.env.POKEMON_TCG_API_KEY;
  return key ? { 'X-Api-Key': key } : {};
}

/**
 * Listen-Abfrage an die TCG-API mit einem Wiederholungsversuch.
 *
 * Hintergrund: Die API antwortet spürbar unzuverlässig — bei zwei Läufen kurz
 * hintereinander scheiterten jeweils ANDERE Abfragen (HTTP 500, leere Antwort).
 * Für Seiten mit ISR ist das besonders teuer: Fällt der Abruf genau während der
 * Neu-Erzeugung aus, wird die LEERE Seite gecacht und stundenlang ausgeliefert
 * (siehe CLAUDE.md, Stolperstelle 19 — genau so war die Startseite ohne Karten).
 * Ein kurzer zweiter Versuch fängt die meisten dieser Aussetzer ab.
 */
async function tcgList(
  params: Record<string, string | number>,
  { retries = 1, timeout = 8000 } = {},
): Promise<unknown[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`${TCG_API_BASE}/cards`, {
        headers: { ...tcgHeaders() },
        params,
        timeout,
      });
      const data = response.data?.data;
      if (Array.isArray(data) && data.length > 0) return data;
      lastError = new Error('leere Antwort');
    } catch (err) {
      lastError = err;
    }
    // Kurz warten — die Aussetzer sind meist sehr kurzlebig.
    if (attempt < retries) await new Promise((r) => setTimeout(r, 400));
  }
  if (lastError) {
    console.warn(
      `TCG-Abfrage ohne Ergebnis (${JSON.stringify(params).slice(0, 80)}):`,
      lastError instanceof Error ? lastError.message : lastError,
    );
  }
  return [];
}

/** Der in der UI angezeigte Marktpreis einer Karte (EUR Cardmarket > TCGplayer Holo > 0). */
export function displayPrice(card: PokemonCard): number {
  return card.prices.market || card.prices.holofoil?.market || 0;
}

/**
 * Eine Karte ist nur dann anzeigbar, wenn sie einen echten Marktpreis UND ein Bild hat.
 * Unveröffentlichte/Preview-Karten in der TCG-Datenbank (z.B. künftige Sets) haben weder
 * Preis noch Bild — sie würden sonst als leere Platzhalter-Zeilen in Suche/Ergebnissen
 * erscheinen. Ein Preis-Tracking-Marktplatz zeigt nur handelbare, vollständige Karten.
 */
export function isDisplayableCard(card: PokemonCard): boolean {
  return displayPrice(card) > 0 && !!card.imageUrl;
}

/** Mappt die API-Antwort und entfernt nicht-anzeigbare (Preview-)Karten — zentrale Stelle. */
function mapAndFilter(data: unknown[]): PokemonCard[] {
  return (data as Array<Record<string, unknown>>)
    .map(mapApiCardToCard)
    .filter(isDisplayableCard);
}

/** Sortiert Karten nach Marktpreis absteigend (höchster Wert zuerst). */
function byPriceDesc(a: PokemonCard, b: PokemonCard): number {
  return displayPrice(b) - displayPrice(a);
}

// Deterministisch per ISO-Kalenderwoche — gleiche Woche, gleiche Karten, cachebar.
function weeklySetIndex(count: number): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 86400000));
  return week % count;
}

export async function fetchTrendingCards(limit = 20): Promise<PokemonCard[]> {
  const sets = ['sv8', 'sv7', 'sv6', 'sv5', 'sv4', 'sv3pt5'];
  const start = weeklySetIndex(sets.length);

  // Vorher: eine einzige Abfrage OHNE Fehlerbehandlung — schlug sie fehl, warf
  // die Funktion und riss Artikel-Erzeugung, Marktbericht und Reels mit. Jetzt
  // mit Wiederholungsversuch und Durchrotieren der übrigen Sets.
  for (let i = 0; i < sets.length; i++) {
    const selectedSet = sets[(start + i) % sets.length];
    const data = await tcgList({
      q: `set.id:${selectedSet} (rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:"Special Illustration Rare")`,
      pageSize: limit,
    });
    const cards = mapAndFilter(data);
    if (cards.length > 0) return cards.sort(byPriceDesc);
  }
  return [];
}

// Gültige Set-Codes: nur Kleinbuchstaben/Ziffern/Punkt (z.B. sv3pt5, swsh7, cel25).
// Verhindert Lucene-Query-Injection, da der Code in `set.id:` interpoliert wird.
export function isValidSetCode(setCode: string): boolean {
  return /^[a-z0-9.]{2,20}$/i.test(setCode);
}

export async function fetchCardsBySet(setCode: string): Promise<PokemonCard[]> {
  if (!isValidSetCode(setCode)) return [];
  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: {
      ...tcgHeaders(),
    },
    params: {
      q: `set.id:${setCode}`,
      pageSize: 60,
    },
    timeout: 8000,
  });

  return mapAndFilter(response.data.data).sort(byPriceDesc);
}

export async function fetchTopValueCards(limit = 10): Promise<PokemonCard[]> {
  const queries = [
    '(rarity:"Special Illustration Rare" OR rarity:"Hyper Rare")',
    'rarity:"Rare Holo EX"',
    'set.id:sv8',
  ];

  // Jede Abfrage mit Wiederholungsversuch — und erst aufgeben, wenn ALLE
  // Varianten leer bleiben. Eine leere Startseite ist der teuerste Ausgang.
  for (const q of queries) {
    const data = await tcgList({ q, pageSize: limit });
    const cards = mapAndFilter(data);
    if (cards.length > 0) return cards.sort(byPriceDesc);
  }
  return [];
}

export async function searchCards(query: string, limit = 30): Promise<PokemonCard[]> {
  const term = query.trim();
  if (!term) return [];

  // Deutsche Eingabe (z.B. "Glurak") in den englischen Namen ("Charizard") übersetzen,
  // den die TCG-API erwartet. Englische Eingaben bleiben unverändert.
  const translated = germanToEnglishName(term);

  // TCG-API: Wildcard-Suche über den Kartennamen, z.B. name:"*charizard*"
  // Lucene-Query-Metazeichen entfernen, damit Nutzereingaben nicht aus dem name-Feld
  // ausbrechen können (z.B. `") OR set.id:(*` zur Enumeration beliebiger Karten).
  const escaped = translated.replace(/["*?:()\[\]{}^~\\+\-!&|]/g, '').trim();
  if (!escaped) return [];
  const response = await axios.get(`${TCG_API_BASE}/cards`, {
    headers: {
      ...tcgHeaders(),
    },
    params: {
      q: `name:"*${escaped}*"`,
      pageSize: limit,
      orderBy: '-set.releaseDate',
    },
    timeout: 8000,
  });

  // Nur vollständige, handelbare Karten (Preis + Bild) — nach Marktpreis absteigend.
  return mapAndFilter(response.data.data).sort(byPriceDesc);
}

/**
 * Einzelkarte laden. WICHTIG für Aufrufer:
 * - `null` bedeutet: Die Karte existiert wirklich nicht (echtes HTTP 404) → notFound() ok.
 * - Transiente Fehler (Timeout, 429-Rate-Limit, 5xx) werden nach einem Retry GEWORFEN —
 *   sie dürfen NIE als 404 behandelt werden, sonst wird eine existierende Karte als
 *   "nicht gefunden" gecacht (Ursache des Startseiten-404-Bugs).
 */
export async function fetchCardById(id: string): Promise<PokemonCard | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.get(`${TCG_API_BASE}/cards/${id}`, {
        headers: {
          ...tcgHeaders(),
        },
        timeout: 8000,
      });
      return mapApiCardToCard(response.data.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return null;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
      throw err;
    }
  }
  return null;
}

export interface SetMeta {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  logoUrl: string;
  symbolUrl: string;
}

/**
 * Set-Abruf MIT Wiederholung.
 *
 * ANLASS: `fetchRecentSets` hatte weder Wiederholung noch Fehlerbehandlung.
 * Die Seite fing den Fehler mit `.catch(() => [])` ab — und weil sie mit
 * `revalidate = 86400` gecacht wird, blieb ein einziger Aussetzer der TCG-API
 * einen GANZEN TAG als „Set-Daten momentan nicht verfügbar" stehen. Genau die
 * Falle aus Stolperstelle 28, nur für Sets statt für Karten.
 *
 * Wirft nach dem letzten Versuch bewusst weiter: Next.js behält dann die
 * zuletzt erfolgreich erzeugte Seite im Cache, statt den Leerzustand
 * einzufrieren. Der Fehlerzustand erscheint nur bei kaltem Cache.
 */
async function tcgSets(params: Record<string, string | number>, retries = 2): Promise<Array<Record<string, unknown>>> {
  let lastError: unknown;
  for (let versuch = 0; versuch <= retries; versuch++) {
    try {
      const response = await axios.get(`${TCG_API_BASE}/sets`, {
        headers: { ...tcgHeaders() },
        params,
        timeout: 8000,
      });
      const data = response.data?.data;
      if (Array.isArray(data) && data.length > 0) return data as Array<Record<string, unknown>>;
      lastError = new Error('leere Antwort');
    } catch (err) {
      lastError = err;
    }
    if (versuch < retries) await new Promise((r) => setTimeout(r, 400 * (versuch + 1)));
  }
  console.warn('Set-Abfrage ohne Ergebnis:', lastError instanceof Error ? lastError.message : lastError);
  throw lastError instanceof Error ? lastError : new Error('Set-Abfrage fehlgeschlagen');
}

export async function fetchRecentSets(limit = 24): Promise<SetMeta[]> {
  const daten = await tcgSets({ orderBy: '-releaseDate', pageSize: limit });

  return daten.map((set) => {
    const images = (set.images as { logo?: string; symbol?: string } | undefined) ?? {};
    return {
      id: set.id as string,
      name: set.name as string,
      series: (set.series as string) || '',
      releaseDate: (set.releaseDate as string) || '',
      total: (set.total as number) || 0,
      logoUrl: images.logo || '',
      symbolUrl: images.symbol || '',
    };
  });
}

/**
 * Baut aus den echten Cardmarket-Durchschnittsfeldern ehrliche Ankerpunkte —
 * KEINE erfundene Tagesgranularität, KEINE lineare Interpolation.
 *
 * Cardmarket liefert über die pokemontcg.io-API echte, zeitbezogene Durchschnitte:
 * avg30 (Ø 30 Tage), avg7 (Ø 7 Tage), avg1 (Ø gestern) und trendPrice (aktueller
 * Trend). Das sind die einzigen realen Verlaufsdaten, die die API kennt — also
 * geben wir genau diese Punkte zurück (an ihrem nominalen Alter datiert). Der
 * Chart verbindet sie auf einer ZEIT-Achse mit weicher Kurve; die echte
 * Tages-Historie entsteht separat aus den Supabase-Snapshots (record-on-view).
 */
export function buildCardmarketHistory(cm: Record<string, number>): { date: string; price: number }[] {
  const today = new Date();
  const mk = (daysAgo: number, price: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    return { date: d.toISOString().split('T')[0], price: Math.round(price * 100) / 100 };
  };

  const byDate = new Map<string, number>();
  const add = (daysAgo: number, price: number) => {
    if (price > 0) {
      const p = mk(daysAgo, price);
      byDate.set(p.date, p.price); // spätere (jüngere) Punkte gewinnen bei Datumskollision
    }
  };
  add(30, cm.avg30);
  add(7, cm.avg7);
  // avg1 (Ø gestern) nur übernehmen, wenn es kein grober Ausreißer ggü. den
  // stabilen Schnitten ist — ein einzelnes Fake-Listing verzerrt sonst die Kurve.
  const ref = cm.avg7 || cm.avg30 || cm.trendPrice;
  if (cm.avg1 > 0 && ref > 0 && cm.avg1 <= ref * 3 && cm.avg1 >= ref / 3) add(1, cm.avg1);
  add(0, cm.trendPrice || cm.averageSellPrice);

  if (byDate.size < 2) return [];
  return [...byDate.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Hinweis: Es gibt bewusst KEINE Funktion, die einen synthetischen/zufälligen
// Preisverlauf erzeugt. Verläufe stammen ausschließlich aus echten Quellen —
// Supabase-Tages-Snapshots und Cardmarket-Durchschnitten (buildCardmarketHistory).
// Liegen zu wenige echte Punkte vor, zeigt die UI KEINEN Chart, sondern nur den
// aktuellen Preis (siehe karten/[id]). Keine erfundenen Preise. (v2.19.1)

export function calculateInvestmentScore(card: PokemonCard): number {
  let score = 50;
  const price = card.prices.market || card.prices.holofoil?.market || 0;

  if (price > 100) score += 20;
  else if (price > 50) score += 10;
  else if (price > 20) score += 5;

  if (card.rarity === 'Special Illustration Rare') score += 15;
  if (card.rarity === 'Hyper Rare') score += 20;
  if (card.rarity === 'Rare Ultra') score += 10;

  if (card.trendPercent && card.trendPercent > 10) score += 10;
  if (card.trendPercent && card.trendPercent < -10) score -= 15;

  return Math.min(100, Math.max(0, score));
}

function mapApiCardToCard(apiCard: Record<string, unknown>): PokemonCard {
  const tcgprices = apiCard.tcgplayer as Record<string, unknown> | undefined;
  const priceData = (tcgprices?.prices as Record<string, unknown>) || {};

  // Cardmarket = echte EUR-Daten (für deutsche Community bevorzugt)
  const cmRoot = apiCard.cardmarket as Record<string, unknown> | undefined;
  const cm = (cmRoot?.prices as Record<string, number>) || undefined;

  const eurPrice = cm ? (cm.trendPrice || cm.averageSellPrice || cm.avg7 || cm.avg30 || 0) : 0;
  const tcgHolo = priceData.holofoil as CardPrices['holofoil'];
  const tcgNormal = priceData.normal as CardPrices['normal'];
  const tcgMarket = tcgHolo?.market || tcgNormal?.market || 0;

  const prices: CardPrices = {
    market: eurPrice || tcgMarket,
    holofoil: tcgHolo,
    reverseHolofoil: priceData.reverseHolofoil as CardPrices['reverseHolofoil'],
    normal: tcgNormal,
  };

  // Echter Trend aus Cardmarket: aktueller Trendpreis vs. 30-Tage-Schnitt.
  // avg1 (Ø gestern) wird NICHT als "aktuell" genutzt — ein einzelner Tag ist zu
  // verrauscht (kann durch ein Fake-/Ausreißer-Listing komplett verzerrt sein).
  let trendPercent = 0;
  let realData = false;
  let priceHistory: PokemonCard['priceHistory'];
  if (cm && cm.avg30 > 0) {
    const current = cm.trendPrice || cm.averageSellPrice || cm.avg7 || cm.avg30;
    trendPercent = ((current - cm.avg30) / cm.avg30) * 100;
    realData = true;
    const hist = buildCardmarketHistory(cm);
    if (hist.length >= 2) priceHistory = hist;
  }

  // Echte Cardmarket-Aufschlüsselung für transparente Anzeige (Trend / ab / Ø).
  const cmMeta = cmRoot as Record<string, unknown> | undefined;
  const cmPrices = cm
    ? {
        trend: cm.trendPrice || undefined,
        low: cm.lowPrice || undefined,
        avgSell: cm.averageSellPrice || undefined,
        avg30: cm.avg30 || undefined,
        updatedAt: (cmMeta?.updatedAt as string) || undefined,
      }
    : undefined;

  const images = apiCard.images as Record<string, string> | undefined;
  const setData = apiCard.set as Record<string, unknown> | undefined;

  const cardName = apiCard.name as string;
  const card: PokemonCard = {
    id: apiCard.id as string,
    name: cardName,
    nameDe: englishToGermanName(cardName) || undefined,
    set: (setData?.name as string) || '',
    setCode: (setData?.id as string) || '',
    rarity: (apiCard.rarity as string) || 'Unknown',
    imageUrl: images?.small || '',
    imageUrlHiRes: images?.large,
    prices,
    priceHistory,
    trendPercent: Math.round(trendPercent * 10) / 10,
    priceSource: eurPrice ? 'cardmarket' : tcgMarket ? 'tcgplayer' : 'none',
    realData,
    cmPrices,
  };

  card.investmentScore = calculateInvestmentScore(card);
  return card;
}
