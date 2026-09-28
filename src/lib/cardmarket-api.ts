import 'server-only';
import crypto from 'crypto';
import { median } from '@/lib/portfolio';

export type CardLanguage = 'EN' | 'DE' | 'JP' | 'KR';

// Cardmarket language IDs per API docs
export const CM_LANGUAGE_IDS: Record<CardLanguage, number> = {
  EN: 1,
  DE: 3,
  JP: 8,
  KR: 11,
};

function cmConfigured(): boolean {
  return !!(
    process.env.CARDMARKET_APP_TOKEN &&
    process.env.CARDMARKET_APP_SECRET &&
    process.env.CARDMARKET_USER_TOKEN &&
    process.env.CARDMARKET_USER_SECRET
  );
}

function oauthHeader(method: string, baseUrl: string, queryParams: Record<string, string> = {}): string {
  const appToken = process.env.CARDMARKET_APP_TOKEN!;
  const appSecret = process.env.CARDMARKET_APP_SECRET!;
  const userToken = process.env.CARDMARKET_USER_TOKEN!;
  const userSecret = process.env.CARDMARKET_USER_SECRET!;

  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthBase: Record<string, string> = {
    oauth_consumer_key: appToken,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: userToken,
    oauth_version: '1.0',
  };

  // All params combined for OAuth 1.0 signature base string
  const allParams = { ...queryParams, ...oauthBase };
  const sortedParamString = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(baseUrl),
    encodeURIComponent(sortedParamString),
  ].join('&');

  const signingKey = `${encodeURIComponent(appSecret)}&${encodeURIComponent(userSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  return (
    'OAuth ' +
    Object.entries({ ...oauthBase, oauth_signature: signature })
      .map(([k, v]) => `${k}="${encodeURIComponent(v)}"`)
      .join(', ')
  );
}

// Median-Angebotspreis (ab EX) einer Sprache fuer ein GENAU bekanntes Produkt.
//
// Frueher suchte diese Funktion das Produkt ueber den Kartennamen und nahm den
// ersten Treffer — bei „Charizard ex" eines von Dutzenden Produkten, also
// geraten. Jetzt nur noch mit der Produktnummer, die TCGdex fuer genau diese
// Karte fuehrt (`cmPrices.produkt`). Ohne sie: kein Sprachpreis.
// Liefert null, wenn die Cardmarket-Schluessel fehlen oder nichts gelistet ist.
export async function fetchCMLanguagePrice(
  idProduct: number,
  language: CardLanguage,
): Promise<number | null> {
  if (!cmConfigured()) return null;
  if (!Number.isInteger(idProduct) || idProduct <= 0) return null;

  try {
    const productId = idProduct;
    const langId = CM_LANGUAGE_IDS[language];
    const BASE = `https://api.cardmarket.com/ws/v2.0/output.json/articles/${productId}`;
    const query = { language: String(langId), minCondition: 'EX', maxResults: '20' };
    const auth = oauthHeader('GET', BASE, query);
    const url = `${BASE}?${new URLSearchParams(query).toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { article?: Array<{ price: number }> };
    const prices = (data.article ?? [])
      .map((a) => a.price)
      .filter((p) => typeof p === 'number' && p > 0);

    // Median statt Minimum: ein einzelnes Fake-/Schaden-Listing (Cent-Preise von Bots)
    // verfälscht sonst den gesamten Portfoliowert. Median ist robust gegen Ausreißer.
    const m = median(prices);
    if (m === null) return null;

    return Math.round(m * 100) / 100;
  } catch (err) {
    // Nicht stumm: Ein dauerhaft fehlschlagender Sprachpreis sieht im
    // Portfolio wie „kein Cardmarket-Zugang" aus und bliebe sonst unbemerkt.
    console.warn(`Cardmarket-Sprachpreis für Produkt ${idProduct} (${language}) fehlgeschlagen:`, err);
    return null;
  }
}
