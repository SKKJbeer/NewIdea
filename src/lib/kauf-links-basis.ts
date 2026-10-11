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

/**
 * Suche in PSAs Auktionspreis-Verzeichnis (Verkäufe gegradeter Karten, eBay USA, USD).
 * Nur ein Prüflink — CardBeacon zeigt keine eigenen PSA-Werte (keine lizenzierte Quelle).
 * Suchbegriff bewusst nur Name + Nummer: PSA schreibt Set-Namen anders
 * („2021 Pokemon Sword & Shield Evolving Skies"), ein zu genauer Begriff findet nichts.
 */
export function psaSuche(name: string, nummer?: string | null): string {
  const nr = (nummer ?? '').trim().replace(/^0+(?=\d)/, '');
  const begriff = `${name} ${/^[A-Za-z]*\d+$/.test(nr) ? nr : ''}`.trim();
  return `https://www.psacard.com/auctionprices/search?q=${encodeURIComponent(begriff)}`;
}
