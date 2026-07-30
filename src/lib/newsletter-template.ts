import { PokemonCard } from '@/types';
import { escapeHtml } from './json-ld';

interface NewsletterData {
  subject: string;
  intro: string;
  cardHighlights: Array<{ name: string; set: string; price: string; trend: string; score: number; reason: string }>;
  tip: string;
  tipTitle: string;
  ctaText: string;
}

function formatWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `KW ${week} · ${now.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

// Bildquellen im Newsletter: nur https und nur die bekannten Bild-Hosts.
// Eine URL aus einer externen API landet sonst ungeprüft in einem
// `src`-Attribut — mit `"` darin ließe sich ein `onerror`-Handler anhängen.
const IMAGE_HOSTS = ['images.pokemontcg.io', 'assets.pokemon.com'];

function safeImageSrc(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return '';
    if (!IMAGE_HOSTS.includes(parsed.hostname)) return '';
    return escapeHtml(parsed.toString());
  } catch {
    // catch erlaubt: eine unparsbare URL ist schlicht keine Bildquelle.
    return '';
  }
}

export function buildNewsletterHtml(data: NewsletterData, cards: PokemonCard[]): string {
  const week = formatWeek();
  const cardmarket = process.env.NEXT_PUBLIC_CARDMARKET_URL || 'https://www.cardmarket.com/en/Pokemon';
  const amazon = process.env.NEXT_PUBLIC_AMAZON_URL || 'https://www.amazon.de/s?k=pokemon+booster';
  // Fußzeilen-Links müssen auf echte Seiten zeigen. Ein totes „Abmelden" ist
  // nicht nur unhöflich, sondern verletzt die Pflicht zum Widerspruch.
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarket-intelligence.vercel.app';

  const cardRows = data.cardHighlights
    .map((card, i) => {
      const apiCard = cards.find((c) => c.name.toLowerCase().includes(card.name.toLowerCase().split(' ')[0]));
      const imgSrc = safeImageSrc(apiCard?.imageUrl || '');
      const trendColor = card.trend.startsWith('+') ? '#16a34a' : '#dc2626';
      const scoreColor = card.score >= 70 ? '#16a34a' : card.score >= 50 ? '#ca8a04' : '#6b7280';
      return `
        <tr>
          <td style="padding:12px 8px; border-bottom:1px solid #f3f4f6; vertical-align:middle; width:48px;">
            <span style="font-size:22px; font-weight:900; color:#7c3aed;">${i + 1}</span>
          </td>
          ${imgSrc ? `<td style="padding:12px 8px; border-bottom:1px solid #f3f4f6; vertical-align:middle; width:52px;">
            <img src="${imgSrc}" width="44" height="62" alt="${escapeHtml(card.name)}" style="border-radius:4px; display:block;" />
          </td>` : ''}
          <td style="padding:12px 8px; border-bottom:1px solid #f3f4f6; vertical-align:middle;">
            <p style="margin:0; font-size:14px; font-weight:700; color:#111827;">${escapeHtml(card.name)}</p>
            <p style="margin:2px 0 0; font-size:11px; color:#9ca3af;">${escapeHtml(card.set)}</p>
            <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">${escapeHtml(card.reason)}</p>
          </td>
          <td style="padding:12px 8px; border-bottom:1px solid #f3f4f6; vertical-align:middle; text-align:right; white-space:nowrap;">
            <p style="margin:0; font-size:15px; font-weight:900; color:#111827;">${escapeHtml(card.price)}</p>
            <p style="margin:2px 0 0; font-size:12px; font-weight:700; color:${trendColor};">${escapeHtml(card.trend)}</p>
            <p style="margin:2px 0 0; font-size:11px; color:${scoreColor};">Score: ${escapeHtml(card.score)}</p>
          </td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(data.subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f3ff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff; padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr><td style="background:linear-gradient(135deg, #4c1d95 0%, #3730a3 100%); border-radius:16px 16px 0 0; padding:32px 32px 28px; text-align:center;">
          <p style="margin:0 0 6px; font-size:11px; font-weight:700; letter-spacing:3px; color:#c4b5fd; text-transform:uppercase;">PokéMarket Intelligence</p>
          <h1 style="margin:0 0 8px; font-size:26px; font-weight:900; color:#ffffff; line-height:1.2;">Wöchentliche Marktanalyse</h1>
          <p style="margin:0; font-size:13px; color:#a5b4fc;">${escapeHtml(week)}</p>
        </td></tr>
        <tr><td style="background:#ffffff; padding:28px 32px 20px;">
          <p style="margin:0 0 4px; font-size:11px; font-weight:700; letter-spacing:2px; color:#7c3aed; text-transform:uppercase;">Marktanalyse</p>
          <p style="margin:8px 0 0; font-size:15px; line-height:1.7; color:#374151;">${escapeHtml(data.intro)}</p>
        </td></tr>
        <tr><td style="background:#ffffff; padding:0 32px 24px;">
          <p style="margin:0 0 16px; font-size:11px; font-weight:700; letter-spacing:2px; color:#7c3aed; text-transform:uppercase;">Karten im Fokus</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6; border-radius:12px; overflow:hidden;">${cardRows}</table>
        </td></tr>
        <tr><td style="background:#ffffff; padding:0 32px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #faf5ff, #ede9fe); border-radius:12px; border-left:4px solid #7c3aed;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:2px; color:#7c3aed; text-transform:uppercase;">${escapeHtml(data.tipTitle || 'Beobachtung der Woche')}</p>
              <p style="margin:0; font-size:14px; line-height:1.7; color:#374151;">${escapeHtml(data.tip)}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff; padding:0 32px 32px; text-align:center;">
          <p style="margin:0 0 16px; font-size:13px; color:#6b7280;">${escapeHtml(data.ctaText || 'Alle Preise und Verläufe auf der Seite:')}</p>
          <a href="${escapeHtml(cardmarket)}" rel="noopener noreferrer sponsored" style="display:inline-block; background:#7c3aed; color:#ffffff; font-size:14px; font-weight:700; padding:12px 28px; border-radius:10px; text-decoration:none; margin:0 6px 12px;">Auf Cardmarket ansehen</a>
          <a href="${escapeHtml(amazon)}" rel="noopener noreferrer sponsored" style="display:inline-block; background:#f59e0b; color:#111827; font-size:14px; font-weight:700; padding:12px 28px; border-radius:10px; text-decoration:none; margin:0 6px 12px;">Booster auf Amazon</a>
          <p style="margin:16px 0 0; font-size:11px; color:#9ca3af;">* Affiliate-Links</p>
        </td></tr>
        <tr><td style="background:#ffffff; border-radius:0 0 16px 16px; padding:20px 32px; text-align:center;">
          <p style="margin:0; font-size:11px; color:#9ca3af;">
            <a href="${escapeHtml(site)}/newsletter" style="color:#7c3aed; text-decoration:none;">Abmelden</a> ·
            <a href="${escapeHtml(site)}/datenschutz" style="color:#7c3aed; text-decoration:none;">Datenschutz</a> ·
            <a href="${escapeHtml(site)}/impressum" style="color:#7c3aed; text-decoration:none;">Impressum</a>
          </p>
          <p style="margin:12px 0 0; font-size:11px; color:#d1d5db;">PokéMarket Intelligence ist kein Finanzberater. Alle Preisangaben ohne Gewähr.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
