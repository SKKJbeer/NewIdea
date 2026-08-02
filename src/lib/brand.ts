// MARKE — eine Stelle, an der der Produktname steht.
//
// WARUM ZENTRAL: Der Vorgängername stand als Zeichenkette in Metadaten,
// Fußzeile, Newsletter-Vorlage, JSON-LD, Reel-Untertiteln und einem Dutzend
// Überschriften. Eine Umbenennung war damit eine Suchen-und-Ersetzen-Übung mit
// garantierten Resten. Ab hier gibt es genau eine Quelle.

/** Wortmarke. Wird nie zerlegt oder mit Zusätzen versehen. */
export const BRAND = 'CardBeacon';

/**
 * Was das Produkt ist — bewusst ohne Nennung eines einzelnen Kartenspiels.
 *
 * Pokémon ist der erste unterstützte Markt, nicht die Identität des Produkts.
 * Ein an ein Spiel gebundener Name hätte jede Erweiterung (One Piece,
 * Lorcana, Magic) zu einem zweiten Umbenennen gemacht.
 */
export const DESCRIPTOR = 'Trading Card Market Intelligence';

/** Kernaussage. Sparsam einsetzen — die Daten sollen sprechen, nicht der Slogan. */
export const PROMISE = 'Understand the market behind the cards.';

/** Kurzfassung für Stellen, an denen wenig Platz ist. */
export const PROMISE_SHORT = 'See where the market is moving.';

/** Englische Kurzbeschreibung — steht in der Seitenleiste unter der Wortmarke. */
export const DESCRIPTOR_EN = 'Market Intelligence for Collectors';

/** Deutsche Entsprechungen — die Oberfläche ist deutschsprachig. */
export const DESCRIPTOR_DE = 'Marktanalyse für Sammelkarten';
export const PROMISE_DE = 'Den Markt hinter den Karten verstehen.';

/** Der Marktindex. Früher „PMI" — Rechnung und Methodik sind unverändert. */
export const INDEX_SHORT = 'CBI';
export const INDEX_LONG = 'CardBeacon Index';

/**
 * Der erste unterstützte Markt.
 *
 * Steht hier, damit die Oberfläche ihn benennen kann, ohne dass er in
 * Seitentiteln oder Bauteilen festgeschrieben wird. Kommt ein zweiter Markt
 * dazu, ist das eine Datenfrage — keine Umbenennung.
 */
export const MARKETS = [{ id: 'pokemon', label: 'Pokémon', active: true }] as const;

/** Titel-Endung für Seiten. */
export const TITLE_SUFFIX = `${BRAND}`;

/**
 * Rechtlicher Hinweis. Unverändert Pflicht und inhaltlich unangetastet:
 * Der Namenswechsel ändert nichts daran, dass dies eine inoffizielle Seite ist.
 */
export const LEGAL_UNOFFICIAL =
  'Inoffizielle Seite — kein offizielles Pokémon-Produkt. Keine Verbindung zu The Pokémon Company, Nintendo, Creatures, GAME FREAK oder Cardmarket.';
export const LEGAL_NO_ADVICE = 'Keine Anlageberatung. Alle Preise ohne Gewähr.';
export const LEGAL_TRADEMARK =
  'Pokémon ist eine Marke von Nintendo / Creatures Inc. / GAME FREAK Inc.';
