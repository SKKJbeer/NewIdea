import 'server-only';
import crypto from 'crypto';

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

async function findCMProductId(cardName: string): Promise<number | null> {
  const BASE = 'https://api.cardmarket.com/ws/v2.0/output.json/products/find';
  const query = { search: cardName, exact: 'false', onlyExact: 'false', idGame: '3' };
  const auth = oauthHeader('GET', BASE, query);
  const url = `${BASE}?${new URLSearchParams(query).toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: auth },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { product?: Array<{ idProduct: number }> };
  return data.product?.[0]?.idProduct ?? null;
}

// Returns the median price (EX+ condition) for the given language from Cardmarket.
// Returns null when not configured or no listings found.
export async function fetchCMLanguagePrice(
  cardName: string,
  language: CardLanguage,
): Promise<number | null> {
  if (!cmConfigured()) return null;

  try {
    const productId = await findCMProductId(cardName);
    if (!productId) return null;

    const langId = CM_LANGUAGE_IDS[language];
    const BASE = `https://api.cardmarket.com/ws/v2.0/output.json/articles/${productId}`;
    const query = { language: String(langId), minCondition: 'EX', maxResults: '20' };
    const auth = oauthHeader('GET', BASE, query);
    const url = `${BASE}?${new URLSearchParams(query).toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: auth },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { article?: Array<{ price: number }> };
    const prices = (data.article ?? []).map((a) => a.price).sort((a, b) => a - b);

    if (prices.length === 0) return null;

    return Math.round(prices[0] * 100) / 100;
  } catch {
    return null;
  }
}
