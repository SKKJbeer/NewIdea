export type Lang = 'de' | 'en';

const de = {
  // Nav
  nav_search: 'Suche',
  nav_blog: 'Blog',
  nav_newsletter: 'Newsletter',
  nav_market_report: 'Marktbericht',
  nav_studio: 'Studio',

  // Hero / Home
  hero_badge: 'Echte Cardmarket-Preise · täglich aktualisiert',
  hero_h1_a: 'Was ist deine Pokémon-Karte',
  hero_h1_b: 'wert?',
  hero_sub: 'Suche jede Karte, sieh den aktuellen Marktwert, Trend und Preisverlauf.',
  hero_placeholder: 'Karte suchen, z.B. Glurak oder Charizard …',

  // Market movers
  section_market_label: 'Markt-Bewegungen',
  section_market_h2: 'Gewinner & Verlierer (30 Tage)',
  list_gainers: 'Top 10 Gewinner',
  list_losers: 'Top 10 Verlierer',

  // Blog
  section_blog_label: 'Blog',
  section_blog_h2: 'Täglich neue Analysen',
  section_blog_all: 'Alle ansehen',
  blog_item_1_label: 'Marktanalyse',
  blog_item_1_sub: 'Jeden Montag',
  blog_item_2_label: 'Karte im Fokus',
  blog_item_2_sub: 'Jeden Dienstag',
  blog_item_3_label: 'Investment-Tipp',
  blog_item_3_sub: 'Jeden Mittwoch',

  // Cards section
  section_cards_label: 'Karten',
  section_cards_h2: 'Wertvollste Karten',
  section_cards_all: 'Alle durchsuchen',

  // Search page
  search_badge: 'Karten-Suche',
  search_h1_a: 'Was ist deine Karte',
  search_h1_b: 'wert?',
  search_sub: 'Suche eine Pokémon-Karte und sieh sofort Marktwert, Trend und 30-Tage-Preisverlauf.',
  search_placeholder: 'Pokémon-Karte suchen, z.B. Charizard …',
  search_btn: 'Suchen',
  search_min_chars: 'Gib mindestens 2 Zeichen ein, z. B. „Pikachu", „Charizard" oder „Mewtu".',
  search_error: 'Suche momentan nicht verfügbar',
  search_error_sub: 'Bitte versuche es später erneut.',
  search_no_results_pre: 'Keine Karten für',
  search_no_results_post: 'gefunden.',
  search_no_results_tip: 'Tipp: Versuche den englischen Kartennamen (z. B. „Charizard" statt „Glurak").',
  search_results_count: 'Treffer für',
  search_loading: 'Karten werden gesucht …',

  // Autocomplete
  autocomplete_placeholder: 'Tip: Kartennamen auf Deutsch oder Englisch',

  // Card detail
  card_back: 'Alle Karten',
  card_buy_cm: 'Auf Cardmarket kaufen',
  card_buy_amz: 'Amazon',
  card_market_price: 'Marktpreis',
  card_investment_score: 'Investment-Score',
  card_score_strong: 'Starkes Investment',
  card_score_medium: 'Mittleres Potenzial',
  card_score_low: 'Vorsicht geboten',
  card_price_history: 'Preis-Historie',
  card_history_real: 'Echte Preise · täglich erfasst',
  card_history_cm: 'Cardmarket-Durchschnitte',
  card_history_sample: 'Beispielhafter Verlauf',

  // Footer
  footer_partner: 'Partner & Affiliate-Links',
  footer_disclaimer:
    'PokéMarket Intelligence ist kein Finanzberater. Alle Preisangaben (Cardmarket, EUR) ohne Gewähr.',
  footer_affiliate: 'Affiliate-Links: Bei Käufen über unsere Links erhalten wir eine kleine Provision.',
  footer_impressum: 'Impressum',
  footer_datenschutz: 'Datenschutz',

  // Errors
  error_cards_title: 'Kartendaten momentan nicht verfügbar',
  error_cards_sub: 'Bitte später erneut versuchen.',

  // Language toggle label (shown as the target language)
  lang_toggle: 'EN',
} as const;

const en: Record<keyof typeof de, string> = {
  nav_search: 'Search',
  nav_blog: 'Blog',
  nav_newsletter: 'Newsletter',
  nav_market_report: 'Market Report',
  nav_studio: 'Studio',

  hero_badge: 'Real Cardmarket Prices · updated daily',
  hero_h1_a: 'What is your Pokémon card',
  hero_h1_b: 'worth?',
  hero_sub: 'Search any card, see current market value, trend and price history.',
  hero_placeholder: 'Search card, e.g. Charizard or Pikachu …',

  section_market_label: 'Market Moves',
  section_market_h2: 'Winners & Losers (30 days)',
  list_gainers: 'Top 10 Gainers',
  list_losers: 'Top 10 Losers',

  section_blog_label: 'Blog',
  section_blog_h2: 'Fresh analysis daily',
  section_blog_all: 'See all',
  blog_item_1_label: 'Market Analysis',
  blog_item_1_sub: 'Every Monday',
  blog_item_2_label: 'Card Spotlight',
  blog_item_2_sub: 'Every Tuesday',
  blog_item_3_label: 'Investment Tip',
  blog_item_3_sub: 'Every Wednesday',

  section_cards_label: 'Cards',
  section_cards_h2: 'Most Valuable Cards',
  section_cards_all: 'Browse all',

  search_badge: 'Card Search',
  search_h1_a: 'What is your card',
  search_h1_b: 'worth?',
  search_sub: 'Search a Pokémon card and instantly see market value, trend and 30-day price history.',
  search_placeholder: 'Search Pokémon card, e.g. Charizard …',
  search_btn: 'Search',
  search_min_chars: 'Enter at least 2 characters, e.g. "Pikachu", "Charizard" or "Mewtwo".',
  search_error: 'Search temporarily unavailable',
  search_error_sub: 'Please try again later.',
  search_no_results_pre: 'No cards found for',
  search_no_results_post: '',
  search_no_results_tip: 'Tip: Try the English card name (e.g. "Charizard" instead of "Glurak").',
  search_results_count: 'results for',
  search_loading: 'Searching cards …',

  autocomplete_placeholder: 'Tip: search in German or English',

  card_back: 'All Cards',
  card_buy_cm: 'Buy on Cardmarket',
  card_buy_amz: 'Amazon',
  card_market_price: 'Market Price',
  card_investment_score: 'Investment Score',
  card_score_strong: 'Strong Investment',
  card_score_medium: 'Medium Potential',
  card_score_low: 'Use Caution',
  card_price_history: 'Price History',
  card_history_real: 'Real Prices · recorded daily',
  card_history_cm: 'Cardmarket Averages',
  card_history_sample: 'Sample Curve',

  footer_partner: 'Partners & Affiliate Links',
  footer_disclaimer:
    'PokéMarket Intelligence is not a financial advisor. All prices (Cardmarket, EUR) without warranty.',
  footer_affiliate: 'Affiliate links: We earn a small commission on purchases through our links.',
  footer_impressum: 'Imprint',
  footer_datenschutz: 'Privacy Policy',

  error_cards_title: 'Card data currently unavailable',
  error_cards_sub: 'Please try again later.',

  lang_toggle: 'DE',
};

export const translations: Record<Lang, Record<string, string>> = { de, en };

export function t(lang: Lang, key: keyof typeof de): string {
  return (translations[lang]?.[key] ?? de[key]) as string;
}
