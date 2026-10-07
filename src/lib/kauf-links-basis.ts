// Reine Link-Bausteine ohne Serverabhängigkeiten — auch in Client-Komponenten nutzbar.

/** Suche bei Cardmarket — Rückfall, wenn kein geprüftes Ziel vorliegt (und für JP/KR). */
export function cardmarketSuche(name: string): string {
  return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}`;
}

/** Amazon-Suche; mit Partner-Kennung, sobald `NEXT_PUBLIC_AMAZON_TAG` gesetzt ist. */
export function amazonSuche(begriff: string): string {
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG?.trim();
  const zusatz = tag && /^[A-Za-z0-9-]{3,40}$/.test(tag) ? `&tag=${tag}` : '';
  return `https://www.amazon.de/s?k=${encodeURIComponent(begriff)}${zusatz}`;
}
