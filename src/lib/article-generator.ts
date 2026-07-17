import Anthropic from '@anthropic-ai/sdk';
import { fetchTrendingCards } from './pokemon-api';
import { STATIC_ARTICLES } from './static-articles';
import { loadArticle, saveArticle } from './article-storage';
import type { PokemonCard } from '@/types';

export type ArticleType = 'markt' | 'karte' | 'strategie' | 'set' | 'ausblick' | 'guide' | 'rueckblick';

export interface FeaturedCard {
  name: string;
  imageUrl: string;
  price: number;
  trend: number;
  rarity: string;
  set: string;
  setCode: string;
}

export interface Article {
  title: string;
  intro: string;
  featuredCards?: FeaturedCard[];
  sections: Array<{ heading: string; content: string; highlight?: FeaturedCard }>;
  keyPoints: string[];
  tags: string[];
  sources?: Array<{ label: string; url: string }>;
  readingTimeMin: number;
  generatedAt: string;
  isStatic?: boolean;
}

// Static preview titles shown in the blog listing (without date params)
export const ARTICLE_PREVIEW_TITLES: Record<ArticleType, string> = {
  markt:      'Pokémon-Markt im Überblick: Preisbewegungen und Trends der Woche',
  karte:      'Karte im Fokus: Charizard ex — Preisentwicklung und Marktanalyse',
  strategie:  'Portfolio-Strategie: Wie Pokémon-Sammler ihr Portfolio aufbauen',
  set:        'Set-Analyse: Pokémon 151 — Marktdaten und Preisübersicht',
  ausblick:   'Wochenend-Ausblick: Aktuelle Entwicklungen für Sammler & Investoren',
  guide:      'Pokémon-Fälschungen erkennen: Prüfmethoden im Überblick',
  rueckblick: 'Wochenrückblick: Was der Markt diese Woche gezeigt hat',
};

// Short teaser line shown under each title in the listing
export const ARTICLE_PREVIEW_SUBTITLES: Record<ArticleType, string> = {
  markt:      'Welche Karten diese Woche gestiegen und gefallen sind — mit echten Zahlen.',
  karte:      'Eine Karte im Spotlight: Geschichte, Preis und Marktdaten.',
  strategie:  'Verschiedene Ansätze analysiert — mit Blick auf Risiken und Marktmuster.',
  set:        'Welche Chase-Cards stechen hervor? Sealed oder Einzelkarten? Die Datenlage.',
  ausblick:   'Welche Entwicklungen das Wochenende prägen — Überblick der Marktlage.',
  guide:      'Schritt für Schritt erklärt — praktisch für Einsteiger und Fortgeschrittene.',
  rueckblick: 'Was lief, was fiel auf, was zeigen die Daten — sachlich analysiert.',
};

// Legacy — kept for backwards compatibility with existing article pages/Supabase entries
export const DAY_TYPE: Record<number, ArticleType> = {
  0: 'rueckblick',
  1: 'markt',
  2: 'karte',
  3: 'strategie',
  4: 'set',
  5: 'ausblick',
  6: 'guide',
};

// ── Publish schedule: only Sunday (Wochenrückblick) + Thursday (rotating) ────
export const PUBLISH_DAYS = new Set([0, 4]); // 0 = Sunday, 4 = Thursday

const THURSDAY_ROTATION: ArticleType[] = ['markt', 'karte', 'strategie', 'set', 'ausblick', 'guide'];

/**
 * Returns the article type for a given ISO date string, or null if that date
 * is not a scheduled publish day (only Sunday and Thursday are published).
 */
export function getArticleType(dateStr: string): ArticleType | null {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();
  if (dow === 0) return 'rueckblick';
  if (dow === 4) {
    const weeksSinceEpoch = Math.floor(d.getTime() / (7 * 24 * 3600 * 1000));
    return THURSDAY_ROTATION[weeksSinceEpoch % THURSDAY_ROTATION.length];
  }
  return null;
}

export const ARTICLE_META: Record<ArticleType, { label: string; category: string; emoji: string; color: string }> = {
  markt:      { label: 'Wöchentliche Marktanalyse',  category: 'Markt',      emoji: '📊', color: 'violet'  },
  karte:      { label: 'Karte im Fokus',             category: 'Spotlight',  emoji: '🃏', color: 'blue'    },
  strategie:  { label: 'Investment-Strategie',       category: 'Strategie',  emoji: '💡', color: 'emerald' },
  set:        { label: 'Set-Analyse',                category: 'Analyse',    emoji: '📦', color: 'amber'   },
  ausblick:   { label: 'Wochenend-Ausblick',         category: 'Prognose',   emoji: '🔮', color: 'rose'    },
  guide:      { label: 'Sammler-Guide',              category: 'Guide',      emoji: '📚', color: 'indigo'  },
  rueckblick: { label: 'Wochenrückblick',            category: 'Rückblick',  emoji: '🔄', color: 'gray'    },
};

const JSON_SCHEMA = `{
  "title": "SEO-Titel (60-80 Zeichen, Pokémon-Keyword enthalten)",
  "intro": "2-3 packende Eröffnungssätze — starte mit einer überraschenden Zahl oder Aussage",
  "featuredCards": [
    {"name": "Exakter englischer Kartenname aus TCG-Datenbank"},
    {"name": "Weiterer Kartenname"}
  ],
  "sections": [
    {"heading": "Konkrete Aussage als Überschrift (keine Fragen)", "content": "3-4 lockere, konkrete Sätze mit Zahlen", "cardRef": "Optionaler englischer Kartenname für Bild in dieser Sektion"},
    {"heading": "Zweite Abschnittsaussage", "content": "..."},
    {"heading": "Dritte Abschnittsaussage", "content": "..."}
  ],
  "keyPoints": ["Takeaway 1 — kurz und merkbar", "Takeaway 2", "Takeaway 3"],
  "tags": ["pokémon karten", "tcg", "investment", "weiteres keyword"],
  "sources": [
    {"label": "Quelle oder Plattform — was dort zu finden ist", "url": "https://..."},
    {"label": "Weitere Quelle", "url": "https://..."}
  ]
}`;

// Spezielles Schema für den Wochenrückblick — reichhaltiger, unterhaltsamer
const RUECKBLICK_SCHEMA = `{
  "title": "Wochenrückblick [KW X]: Lustiger, einprägsamer Titel mit Pokémon-Bezug",
  "intro": "2-3 humorvolle Sätze die die Woche zusammenfassen — wie ein Freund der dir davon erzählt",
  "featuredCards": [
    {"name": "Die Karte der Woche — exakter englischer Name"},
    {"name": "Weiterer Highlight"},
    {"name": "Ein Verlierer oder Überraschung"}
  ],
  "sections": [
    {
      "heading": "🌍 Was in der Pokémon-Welt passiert ist",
      "content": "Anime-News, Spiel-Ankündigungen, Turniere, Social-Media-Momente — alles was die Community bewegt hat. Locker erzählt, als wärst du dabei gewesen.",
      "cardRef": "Passende Karte zum Thema"
    },
    {
      "heading": "📈 Die Karte der Woche: [Name eintragen]",
      "content": "Eine Karte die diese Woche besonders aufgefallen ist — Preisbewegung, Grund, lustige Analogie warum sie gestiegen oder gefallen ist. Pokémon kurz beschreiben für Neulinge.",
      "cardRef": "Diese Karte"
    },
    {
      "heading": "😅 Marktmuster der Woche",
      "content": "Ein typisches, allgemein bekanntes Marktverhaltensmuster (z.B. Hype-Käufe, Ankereffekt, Panikverkäufe) — humorvoll erklärt, aber mit echtem Lernwert. KEINE erfundenen konkreten Preisbewegungen als Beispiel.",
      "cardRef": "Optionale Beispielkarte"
    },
    {
      "heading": "🔮 Prognose: Was nächste Woche auffallen könnte",
      "content": "1-2 sachliche Einschätzungen — ehrlich über Unsicherheiten. Eine Karte oder ein Trend auf dem Radar.",
      "cardRef": "Karte die im Fokus steht"
    }
  ],
  "keyPoints": ["Das wichtigste Takeaway der Woche", "Was der Markt diese Woche gezeigt hat", "Die Überraschung der Woche"],
  "tags": ["wochenrückblick", "pokemon tcg", "pokémon news", "investment woche"],
  "sources": [
    {"label": "Cardmarket — Preisdaten dieser Woche", "url": "https://www.cardmarket.com/en/Pokemon"},
    {"label": "Weitere verwendete Quelle", "url": "https://..."}
  ]
}`;

// Vollwertige Evergreen-Artikel als Fallback — sachliche Marktanalyse, keine Persona.
// Diese laufen wenn kein ANTHROPIC_API_KEY gesetzt ist oder die KI-Generierung scheitert.
//
// PFLICHT-REGELN (CLAUDE.md → Content-Wahrheitspflicht):
// - KEINE Preiszahlen im Fließtext/keyPoints, keine erfundenen Events/Trajektorien
// - KEINE Kaufempfehlungen, keine Renditeversprechen, keine Ich-Form
// Exportiert für den Compliance-Test (content-compliance.test.ts).
export function fallbackArticle(type: ArticleType, dateLabel: string, _cardSummary: string): Article {
  const meta = ARTICLE_META[type];

  const data: Record<ArticleType, Omit<Article, 'readingTimeMin' | 'generatedAt' | 'featuredCards'>> = {
    markt: {
      title: `Pokémon-Markt im Überblick: Preisbewegungen und Trends (${dateLabel})`,
      intro: 'Langfristig zeigt der Pokémon-Kartenmarkt ein wiederkehrendes Muster: Qualität überdauert Hype. Was hinter den aktuellen Bewegungen steckt.',
      sections: [
        {
          heading: 'Special Illustration Rares dominieren weiterhin',
          content: 'SIRs (Special Illustration Rares — das sind die Karten mit dem vollflächigen Kunstwerk ohne Hintergrundbox, erkennbar am goldenen Stern-Symbol) sind seit Scarlet & Violet 2023 die gefragteste moderne Kartenklasse. Warum? Weil ihre Druckrate sehr niedrig ist und die Artworks weit über dem TCG-Standard liegen. Karten wie der Charizard ex SIR aus dem 151-Set oder Mewtu ex zeigen seit ihrem Post-Release-Tiefpunkt eine nachhaltige Erholung — aktuelle Notierungen direkt auf Cardmarket prüfen. Der Markt behandelt diese Karten zunehmend als die Klassiker der nächsten Generation.',
        },
        {
          heading: 'Wer gewinnt, wer verliert — und warum',
          content: 'Stabil zeigen sich Karten von ikonischen Pokémon (Glurak/Charizard, Pikachu, Mewtu, Evoli/Eevee und seine Entwicklungen), die gleichzeitig aus Sets stammen, die nicht mehr gedruckt werden. Schwächer laufen Generic-Ultra-Rares von weniger bekannten Pokémon — dort verpufft der Hype nach Set-Release oft innerhalb von Wochen. Ein beobachtbares Muster: Wenn ein Pokémon auch von jemandem erkannt wird, der kaum spielt, zeigt die Karte historisch die stabilere Nachfrage.',
        },
        {
          heading: 'Marktphase: Konsolidierung und ihre Bedeutung',
          content: 'Konsolidierungsphasen — keine wilden Spikes, keine Panikverkäufe — sind ein normaler Teil jedes Marktzyklus und historisch oft die Basis vor weiteren Bewegungen. Für alle Karten gilt: Der Zustand bestimmt den Wert maßgeblich. Near-Mint-Exemplare erzielen ein Vielfaches gegenüber Exemplaren mit sichtbaren Gebrauchsspuren.',
        },
      ],
      keyPoints: [
        'SIRs von ikonischen Pokémon zeigen die stabilste Preisentwicklung',
        'Konsolidierungsphasen sind historisch Vorstufen zur nächsten Bewegung',
        'Zustand ist entscheidend — nur NM behält langfristig den vollen Wert',
      ],
      tags: ['pokémon marktanalyse', 'special illustration rare', 'tcg preise', 'pokemon markt'],
    },
    karte: {
      title: 'Karte im Fokus: Charizard ex — Preisentwicklung und Marktanalyse',
      intro: 'Glurak (das ist der orange Drache den wirklich jeder kennt) ist seit 1998 das meistgesuchte Pokémon im TCG überhaupt. Seine Inkarnation im 151-Set hat etwas geschafft, das nicht viele Karten hinbekommen: Sie hat ihren Post-Release-Tiefpunkt durchlaufen und steigt seitdem konstant. Hier die Marktdaten.',
      sections: [
        {
          heading: 'Was diese Karte so besonders macht',
          content: 'Die Charizard ex Special Illustration Rare aus dem Pokémon 151-Set (Set-Code sv3pt5) zeigt Glurak in einem epischen vollflächigen Kunstwerk, das an die klassischen Originalillustrationen der 90er erinnert. Das 151-Set war eine Hommage an die ersten 151 Pokémon — und dieser Charizard ist die Chase-Card des Sets. SIRs gehören zu den seltensten Karten moderner Sets — die Wahrscheinlichkeit, ein bestimmtes Exemplar aus Packs zu ziehen, ist gering.',
        },
        {
          heading: 'Preisentwicklung: Wo kommen wir her, wo gehen wir hin',
          content: 'Das typische Muster: Nach Release notiert die Karte zunächst günstiger wenn der Markt mit Neuware geflutet wird — der Post-Hype-Tiefpunkt. Seitdem klettert sie konstant nach oben. Der Grund: Das 151-Set wird nicht ewig gedruckt. Jede Woche, die vergeht, wird das Angebot auf Cardmarket kleiner. Gleichzeitig entdecken neue Pokémon-Fans die Karte — die globale Fangemeinde wächst. Historisch gesehen haben Charizard-Karten aus ausgelaufenen Sets nie dauerhaft an Wert verloren.',
        },
        {
          heading: 'Marktlage und Preiseinordnung',
          content: 'Die Fundamentaldaten dieser Karte sind klar: Ikonisches Pokémon, limitiertes Set, starke Fangemeinde, herausragendes Artwork. Aktuelle Marktpreise für Near-Mint-Exemplare direkt auf Cardmarket prüfen — die Preissuche auf dieser Seite zeigt den tagesaktuellen Stand. Auf Cardmarket sind Zustand "Near Mint" und Verkäuferbewertung die wichtigsten Qualitätskriterien. Gradierte Exemplare (PSA 10, BGS 10) werden auf einem separaten Markt gehandelt und erzielen deutlich höhere Preise.',
        },
      ],
      keyPoints: [
        'Charizard ex SIR (151) — Fundamentaldaten stimmen, kein reiner Hype',
        'Post-Release-Tiefpunkte zeigen das historische Preismuster',
        'Qualität bestimmt den Preis — NM deutlich mehr wert als Karten mit Kratzern',
      ],
      tags: ['charizard ex', 'pokemon 151', 'special illustration rare', 'karte im fokus'],
    },
    strategie: {
      title: 'Marktstrukturen verstehen: Wie sich Sammlerportfolios im TCG zusammensetzen',
      intro: 'Im Pokémon-Sammlermarkt lassen sich wiederkehrende Verhaltensmuster beobachten: Pack-Öffnen aus Unterhaltung, Käufe auf dem Hype-Höhepunkt, Anhäufung vieler günstiger Karten. Die Marktdaten der letzten Jahre zeigen, welche Strukturen sich historisch als stabil erwiesen haben — eine Analyse, keine Anlageberatung.',
      sections: [
        {
          heading: 'Struktur-Baustein 1: Ikonische Karten als stabiler Kern',
          content: 'Im Sammlermarkt gibt es Karten, deren Nachfrage historisch außergewöhnlich stabil ist: Charizard, Pikachu, Mewtu und Evoli-Entwicklungen in ihren Top-Versionen (SIR, Alternate Art, historische Holos). Ihre Nachfrage speist sich aus einer globalen, wachsenden Fangemeinde — nicht aus kurzfristigen Trends. Sammlungen, die auf solchen Karten in Near-Mint-Zustand aufbauen, zeigen historisch die geringste Volatilität. Keine Karte ist jedoch gegen Wertverlust immun.',
        },
        {
          heading: 'Struktur-Baustein 2: Der Release-Zyklus als Muster',
          content: 'Neue Sets zeigen ein dokumentiertes Muster: Hype-Spike direkt nach Veröffentlichung, dann Preisrückgang, wenn der Markt mit frischen Karten geflutet wird. Historisch stabilisieren sich die Preise einige Wochen nach Set-Release auf einem Tiefpunkt, bevor sich langfristige Trends herausbilden. Käufe auf dem Release-Hype haben in den Marktdaten wiederholt schlechter abgeschnitten als geduldiges Beobachten dieses Zyklus.',
        },
        {
          heading: 'Struktur-Baustein 3: Sealed als passives Segment',
          content: 'Versiegelte Produkte (Boosterboxen, Elite Trainer Boxen) zeigen nach Produktionsende historisch eine Aufwärtstendenz, weil das Angebot nicht mehr wächst — mit unterschiedlicher Ausprägung je nach Nostalgiefaktor des Sets. Der Zeithorizont ist lang, und kühle, trockene, UV-geschützte Lagerung ist Voraussetzung für den Werterhalt. Pack-Öffnen bleibt statistisch Unterhaltung: Der erwartete Kartenwert liegt unter dem Produktpreis.',
        },
      ],
      keyPoints: [
        'Ikonische Karten (Charizard, Pikachu, Mewtu, Evoli) zeigen historisch die stabilste Nachfrage',
        'Release-Zyklus: Hype-Spike, Korrektur, Stabilisierung — ein dokumentiertes Muster',
        'Sealed nach Produktionsende: historische Aufwärtstendenz, aber langer Zeithorizont',
      ],
      tags: ['pokemon marktstruktur', 'pokemon portfolio', 'special illustration rare', 'tcg marktmuster'],
    },
    set: {
      title: 'Set-Analyse: Pokémon 151 — Marktdaten und Preisübersicht',
      intro: 'Pokémon 151 (offiziell "Scarlet & Violet — 151", Set-Code sv3pt5) ist das Set über das in der TCG-Community mehr geredet wird als über fast jedes andere seit Jahren. Es ist eine Hommage an die Original-151 Pokémon aus dem Base Set von 1998 — und für viele die erste Rückkehr zur Kindheit in Kartenform. Die Preisdaten zeigen: Diese Begeisterung hat sich im Markt niedergeschlagen.',
      sections: [
        {
          heading: 'Was das Set so besonders macht',
          content: 'Das 151-Set enthält ausschließlich die originalen 151 Pokémon — Bisasam, Glumanda, Schiggy bis Mewtu und Mew. Jedes ikonische Pokémon hat seine Special Illustration Rare-Version bekommen. Das bedeutet: Alle Pokémon, an die Fans mit Nostalgie denken — Glurak, Pikachu, Mewtu, Relaxo (das dicke schlafende Pokémon), Evoli und mehr — haben epische Kunstwerke auf exklusiven SIR-Karten. Diese Kombination ist im modernen TCG einmalig.',
        },
        {
          heading: 'Die Top-Chase-Cards und ihre Preisbewegung',
          content: 'Die vier wertvollsten Karten des Sets sind der Charizard ex SIR, der Mewtu ex SIR, der Pikachu ex SIR und der Evoli ex SIR (Eevee — das süße braune Basisform-Pokémon vor seinen 8 Entwicklungen) — aktuelle Notierungen direkt auf Cardmarket prüfen. Alle vier haben nach ihrem Post-Release-Tiefpunkt nachhaltig zugelegt. Das liegt daran, dass das 151-Set nicht mehr aktiv gedruckt wird — das Angebot an frischen Packs schrumpft.',
        },
        {
          heading: 'Sealed oder Einzelkarten — was zeigen die Preisdaten?',
          content: 'Wer eine bestimmte Karte sucht: Der Direktkauf auf Cardmarket ist statistisch günstiger als das Öffnen von Packs — die Wahrscheinlichkeit, eine bestimmte SIR zu ziehen, ist gering, und der erwartete Einsatz beim Öffnen übersteigt den Direktkaufpreis deutlich. Versiegelte Boosterboxen des 151-Sets haben seit Produktionsende weiter zugelegt — ein historisch konsistentes Muster bei Sets mit starkem Nostalgiewert.',
        },
      ],
      keyPoints: [
        'Alle Original-151 als SIRs — einmalige Nostalgiepower',
        'Top-4: Charizard, Mewtu, Pikachu, Evoli — alle mit nachhaltigem Preisanstieg',
        'Einzelkarten statistisch effizienter als Packs öffnen; sealed für Langzeitperspektive',
      ],
      tags: ['pokémon 151', 'set analyse', 'scarlet violet', 'sv3pt5 investment'],
    },
    ausblick: {
      title: 'Wochenend-Ausblick: Aktuelle Entwicklungen für Sammler & Investoren',
      intro: 'Das Wochenende ist die aktivste Handelszeit auf Cardmarket. Käufer haben mehr Zeit zum Stöbern, Verkäufer passen ihre Preise an — die Marktdaten zeigen dabei wiederkehrende Muster.',
      sections: [
        {
          heading: 'Karten in der Konsolidierungsphase: Aktuelle Daten',
          content: 'SIRs von Pokémon die in den letzten 2–3 Wochen keine großen Preisbewegungen gezeigt haben, befinden sich oft in einer Konsolidierungsphase. Alternate-Art-Karten aus Evolving Skies (das 2021er Set mit Drachenpokémon und Eevee-Entwicklungen) zeigen seit Jahren konstante Preissteigerungen. Der Rayquaza VMAX Alt Art (das riesige grüne Drachen-Pokémon) und der Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit den gelben Ringen) sind dokumentierte Beispiele für dieses Muster.',
        },
        {
          heading: 'Nach Hype-Spikes: Marktmuster beobachten',
          content: 'Karten aus Sets die gerade erst erschienen sind und stark im Preis gestiegen sind, durchlaufen historisch eine Korrektur wenn der Markt mit Neuware geflutet wird — meist in den ersten 4–8 Wochen nach Release. Klassiker und gut erhaltene Karten aus ausgelaufenen Sets zeigen ein anderes Muster: konstante, ruhige Preisentwicklung ohne aktives Management.',
        },
        {
          heading: 'Diese Woche im Auge behalten',
          content: 'Auf Cardmarket lohnt es sich, die Angebotsmenge zu beobachten: Sinkt die Zahl der Angebote einer bestimmten Karte (weniger verfügbar = Preisanstieg in Sicht). Beobachtungen auf mehreren internationalen Plattformen gleichzeitig (eBay.com, TCGPlayer USA, Cardmarket) deuten auf globale Nachfrage hin. Turniere am Wochenende können Spieler-Karten kurzfristig verteuern — Spieler-Hype hält selten länger als 2–3 Wochen an.',
        },
      ],
      keyPoints: [
        'SIRs in Konsolidierungsphase — historisch oft Vorstufe zur nächsten Bewegung',
        'Release-Phasen zeigen regelmäßig das gleiche Muster: Hype, dann Korrektur',
        'Sinkende Angebotsmenge auf Cardmarket = klassisches Preisanstieg-Signal',
      ],
      tags: ['wochenend ausblick', 'pokemon cardmarket', 'tcg investment', 'pokemon marktentwicklung'],
    },
    guide: {
      title: 'Pokémon-Fälschungen erkennen: Prüfmethoden im Überblick',
      intro: 'Fälschungen im Pokémon-TCG sind ein wachsendes Problem — mit steigenden Kartenpreisen steigt der Anreiz für Fälscher. Eine teuer gekaufte Chase-Card, die als Fälschung ankommt, bedeutet verlorenes Geld und verlorenes Vertrauen. Hier sind die wichtigsten Methoden zur Echtheitsprüfung.',
      sections: [
        {
          heading: 'Der Lichttest — 30 Sekunden, keine Ausrüstung nötig',
          content: 'Echte Pokémon-Karten haben eine charakteristische schwarze Schicht in der Mitte des Kartonverbunds — das sieht man wenn man die Karte schräg gegen eine Lampe hält. Fälschungen fehlt diese Schicht oft, oder sie ist zu dünn. Zweite Methode: Karte leicht biegen (nicht falten!). Echte Karten haben eine gewisse Steifigkeit und schnappen sofort zurück. Fakes sind oft entweder zu weich oder zu steif.',
        },
        {
          heading: 'Druckqualität und Textur prüfen',
          content: 'Echte Pokémon-Karten haben eine sehr gleichmäßige, leicht raue Textur auf der Vorderseite — das Druckbild ist unter dem Finger spürbar. Fälschungen fühlen sich oft zu glatt an (zu viel Beschichtung) oder haben eine ungleichmäßige Oberfläche. Der Hologrammeffekt auf Rare-Karten sollte fließend und tiefgründig wirken — bei Fakes sieht er oft flach und zu symmetrisch aus. Pixeliger oder leicht verschwommener Text ist ein Alarmzeichen.',
        },
        {
          heading: 'Den Verkäufer und Preis prüfen',
          content: 'Die beste Fälschungsprävention passiert vor dem Kauf. Auf Cardmarket sollten Verkäufer eine Bewertung über 98 % und mindestens 50 Transaktionen haben. Privat-Verkäufe auf Facebook-Gruppen oder Ebay-Kleinanzeigen sind deutlich riskanter — Fotos unter Tageslicht und nach dem Lichttest-Foto verlangen. Preise die 30 % unter dem Cardmarket-Durchschnitt liegen, sind ein Warnsignal: Zu günstig bedeutet fast immer gefälscht oder stark beschädigt.',
        },
      ],
      keyPoints: [
        'Lichttest: Schwarze Mittelschicht + Steifigkeit = Echtheitssignale',
        'Druckqualität: Klarer Text, fließender Hologrammeffekt = echt',
        'Cardmarket: Nur Verkäufer mit 98 %+ Bewertung und 50+ Transaktionen',
      ],
      tags: ['pokemon fälschungen erkennen', 'fake pokemon karten', 'pokemon karten prüfen', 'cardmarket sicher kaufen'],
    },
    rueckblick: {
      title: 'Wochenrückblick: Was der Markt diese Woche gezeigt hat',
      intro: 'Jede Woche im Pokémon-Kartenmarkt ist ein Lehrstück in Marktpsychologie, Angebot und Nachfrage. Die Muster wiederholen sich — wer sie kennt, sieht klarer. Hier die wichtigsten Marktbeobachtungen der vergangenen Woche.',
      sections: [
        {
          heading: 'Was diese Woche bestätigt hat',
          content: 'Die Datenlage bestätigt sich: SIRs aus ausgelaufenen Sets wie Evolving Skies und dem 151-Set zeigen keine Schwäche. Umbreon VMAX Alt Art und Charizard ex SIR halten ihr Preisniveau stabil. Kein dramatischer Anstieg — aber Qualitätsinvestments zeichnen sich durch Konstanz aus, nicht durch Volatilität. Aktuelle Preise immer direkt auf Cardmarket prüfen.',
        },
        {
          heading: 'Was diese Woche als Lehrstück diente',
          content: 'Das Release-Muster bleibt das konstanteste Phänomen im TCG-Markt: Chase-Cards notieren direkt nach Set-Release auf ihrem Hype-Hoch, gefolgt von einer deutlichen Korrektur, sobald der Markt mit frischer Ware geflutet ist. Das ist kein neues Phänomen und wird sich nicht ändern — die Marktpsychologie wiederholt sich. Der erste Preis nach Release ist historisch selten der faire Preis; erst einige Wochen später bildet sich ein belastbares Niveau.',
        },
        {
          heading: 'Ausblick auf die kommende Woche',
          content: 'Der Markt ist gerade in einem ruhigen Fahrwasser — kein ausgeprägter Aufwärts- oder Abwärtsdruck. Interessant sind SIRs die in den letzten 30 Tagen im Preis gefallen sind, ohne dass fundamentale Gründe erkennbar sind (kein gestiegenes Angebot, kein neues ähnliches Produkt). Überhastetes Handeln aus Ungeduld hat historisch selten besser abgeschnitten als das Halten bestehender Positionen.',
        },
      ],
      keyPoints: [
        'Geduld schlägt Hype — ausgelaufene Set-Karten zeigen das Woche für Woche',
        'Release-Preise sind Hype-Preise — der faire Preis bildet sich historisch erst Wochen später',
        'Ruhige Marktphasen sind historisch Vorstufen zur nächsten Preisbewegung',
      ],
      tags: ['pokemon wochenrückblick', 'tcg markt', 'pokemon investment', 'cardmarket analyse'],
    },
  };

  const a = data[type];
  const wordCount = [a.intro, ...a.sections.map((s) => s.content)].join(' ').split(' ').length;
  return {
    ...a,
    title: a.title || meta.label,
    readingTimeMin: Math.max(3, Math.ceil(wordCount / 200)),
    generatedAt: new Date().toISOString(),
    isStatic: true,
  };
}

// Harte Wahrheits- und Neutralitätsregeln — werden JEDEM Generierungs-Prompt vorangestellt.
// Quelle: CLAUDE.md → Content-Wahrheitspflicht + Content-Tonalität.
const CONTENT_RULES = `ABSOLUTE REGELN (Verstoß = unbrauchbarer Artikel):
1. WAHRHEIT: Verwende Zahlen und Preise AUSSCHLIESSLICH aus den unten gelieferten Marktdaten. Erfinde NIEMALS Preise, Preisverläufe, Prozentbewegungen, Auktionsergebnisse, Turnierergebnisse, Ankündigungen, Druckraten oder Illustratoren-Namen. Wenn du eine Zahl nicht aus den Daten belegen kannst, formuliere qualitativ ("zeigt zunehmende Nachfrage", "notiert stabil").
2. KEINE ANLAGEBERATUNG: Keine Kaufempfehlungen ("kaufenswert", "jetzt kaufen", "Pflichtkauf", "Kaufchance"), keine Budget-Aufteilungen, keine Renditeversprechen, keine Kauf-/Verkaufszeitpunkte als Handlungsanweisung. Nur Marktbeobachtungen, historische Muster und sachliche Einschätzungen.
3. KEINE PERSONA: Keine Ich-Form, kein Erzähler-Name. Impersonale Analyse ("Der Markt zeigt", "Die Daten bestätigen").
4. QUELLEN: Im sources-Array nur echte, existierende URLs (Cardmarket, Bulbapedia, pokemon.com, Limitless TCG, PSA). Keine erfundenen Links.`;

// Schreibstil-Regeln gegen KI-Klang — Kurzform von .claude/commands/schreibstil.md.
// Werden jedem Generierungs-Prompt vorangestellt.
const STYLE_RULES = `SCHREIBSTIL (Texte müssen menschlich und nüchtern klingen, NICHT nach KI):
1. Direkt mit einem Fakt, einer Beobachtung oder einem Kontrast einsteigen. VERBOTEN: "Hier ein Überblick", "In der heutigen Zeit", "Tauchen wir ein", Panorama-Sätze.
2. VERBOTENE Wörter: atemberaubend, revolutionär, bahnbrechend, faszinierend, episch, spektakulär, unglaublich. Stattdessen das konkrete Detail nennen, das den Eindruck erzeugt.
3. Keine Meta-Kommentare ("In diesem Artikel...", "Zusammenfassend...", "Fazit:"). Kein Absatz endet mit einer Zusammenfassung seiner selbst — er endet mit dem letzten Fakt.
4. Satzlängen VARIIEREN: kurze Sätze (3-6 Wörter) einstreuen, dann längere. Nicht jeder Absatz gleich lang, nicht immer drei Beispiele.
5. Faktendichte-Test: Jeder Satz beantwortet Was/Wann/Wie viel/Warum/Woher. Füllsätze ohne Information streichen.
6. Sparsam: max. eine Doppelpunkt-Konstruktion ("Der Grund: ..."), max. eine rhetorische Frage, Gedankenstriche selten. Keine Emojis im Fließtext (nur in Überschriften wo das Schema sie vorgibt).
7. Aktiv statt Passiv, Verben statt Substantivierungen ("Preise steigen" statt "Preissteigerungen sind zu verzeichnen").`;

function buildPrompt(type: ArticleType, cards: string, dateLabel: string): string {
  const isRueckblick = type === 'rueckblick';

  const persona = isRueckblick
    ? `Du bist ein Pokémon-TCG-Marktanalyst der einen wöchentlichen Rückblick auf Deutsch schreibt. Stil: leicht lesbar und unterhaltsam, aber ohne persönliche Kaufempfehlungen — nur Beobachtungen, Fakten und Marktanalyse. Unbekannte Pokémon immer kurz in Klammern beschreiben. Kein Finanz-Geschwätz, klare sachliche Aussagen. Alle Altersgruppen ab 10 Jahren — alles jugendfrei.\n\n${CONTENT_RULES}\n\n${STYLE_RULES}\n\nAntworte NUR mit validem JSON:\n${RUECKBLICK_SCHEMA}`
    : `Du bist ein Pokémon-TCG-Marktanalyst der Artikel auf Deutsch verfasst — klar, faktenbasiert und leicht verständlich. Fachbegriffe immer kurz erklären. Wenn du ein Pokémon erwähnst das nicht jeder kennt, beschreibe es kurz in Klammern (z.B. "Umbreon VMAX (das schwarze Nacht-Pokémon mit den gelben Ringen)"). Nutze ausschließlich Zahlen und Karten-Namen aus den gelieferten Daten. Keine persönlichen Kaufempfehlungen — nur Marktbeobachtungen und sachliche Einschätzungen.\n\n${CONTENT_RULES}\n\n${STYLE_RULES}\n\nAntworte NUR mit validem JSON:\n${JSON_SCHEMA}`;

  const contexts: Record<ArticleType, string> = {
    markt:      `Schreibe eine Marktanalyse für ${dateLabel}. Starte mit der auffälligsten Preisveränderung AUS DEN GELIEFERTEN DATEN. Analysiere Trends, nenne Gewinner und Verlierer aus den Daten. Füge 3-4 konkrete Karten in featuredCards ein.\n\nAktuelle Marktdaten:\n${cards}`,
    karte:      `Wähle die spannendste Karte aus den Daten und analysiere sie tiefgehend (Geschichte, Artwork, Preisentwicklung). Stand: ${dateLabel}. Füge diese Karte + 2-3 vergleichbare in featuredCards ein.\n\nAktuelle Karten:\n${cards}`,
    strategie:  `Analysiere eine Strategie oder einen Ansatz im Pokémon-TCG-Markt für ${dateLabel}. Zeige Risiken und historische Muster. Karten in featuredCards eintragen.\n\nMarktdaten:\n${cards}`,
    set:        `Analysiere ein aktuell interessantes Pokémon-TCG-Set. Welche Chase-Cards stechen hervor? Sealed oder Einzelkarten — was zeigen die Preisdaten? Stand: ${dateLabel}. Die Top-Karten des Sets in featuredCards eintragen.\n\nKarten (mit Set-Info):\n${cards}`,
    ausblick:   `Gib einen sachlichen Ausblick auf aktuelle Marktentwicklungen für das Wochenende ab ${dateLabel}. Welche Karten zeigen Bewegungen, welche Risiken gibt es? Keine persönlichen Empfehlungen. Auffällige Karten in featuredCards.\n\nAktuelle Daten:\n${cards}`,
    guide:      `Schreibe einen unterhaltsamen Guide — praktisch für Einsteiger, trotzdem interessant für Fortgeschrittene. Mit echten Karten-Beispielen. Stand: ${dateLabel}. Beispielkarten in featuredCards.\n\nKontext:\n${cards}`,
    rueckblick: `Wochenrückblick für die Woche um ${dateLabel}. Analysiere was die GELIEFERTEN MARKTDATEN diese Woche zeigen: Welche Karte fällt auf? Welches allgemeine Marktmuster war sichtbar? Was verdient nächste Woche Beobachtung? WICHTIG: Erfinde keine Turnierergebnisse, News oder Ankündigungen — wenn du über die Pokémon-Welt schreibst, nur zeitlose, verifizierbare Fakten (z.B. dass Turniersaisons Nachfrage verschieben). Locker erzählt, Zahlen nur aus den Daten. Die Featured Cards sind die Karte der Woche + Überraschungen.\n\nAktuelle Marktdaten:\n${cards}`,
  };

  return `${persona}\n\n${contexts[type]}`;
}

function toFeaturedCard(c: PokemonCard): FeaturedCard {
  return {
    name: c.name,
    imageUrl: c.imageUrl,
    price: c.prices.market || c.prices.holofoil?.market || 0,
    trend: c.trendPercent || 0,
    rarity: c.rarity,
    set: c.set,
    setCode: c.setCode,
  };
}

/**
 * Basisname eines Kartennamens ohne Varianten-Suffixe ("Charizard ex SIR" → "charizard").
 * Für den Text-Abgleich: Nur Karten anzeigen, deren Pokémon im Artikel wirklich vorkommt.
 */
function baseCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(ex|gx|v|vmax|vstar|sir|sar|alt art)\b.*$/i, '')
    .trim();
}

/**
 * BILD-TEXT-KOPPLUNG (PFLICHT): Eine Karte erscheint nur dann als Bild im Artikel,
 * wenn ihr Name (englisch ODER deutsch, z.B. Charizard/Glurak) im Artikeltext vorkommt.
 * Kein Auffüllen mit beliebigen Trending-Karten — sonst zeigt der Artikel Pikachu,
 * während der Text über Glurak spricht.
 */
export function matchCardsFromText(texts: string[], trendingCards: PokemonCard[]): FeaturedCard[] {
  const haystack = texts.join(' ').toLowerCase();
  const matched: FeaturedCard[] = [];
  const usedBases = new Set<string>();

  for (const c of trendingCards) {
    if (!c.imageUrl) continue;
    const baseEn = baseCardName(c.name);
    const baseDe = c.nameDe ? baseCardName(c.nameDe) : '';
    if (baseEn.length < 3) continue;
    if (usedBases.has(baseEn)) continue;
    if (haystack.includes(baseEn) || (baseDe.length >= 3 && haystack.includes(baseDe))) {
      usedBases.add(baseEn);
      matched.push(toFeaturedCard(c));
      if (matched.length >= 4) break;
    }
  }
  return matched;
}

export function matchFeaturedCards(
  aiNames: Array<{ name: string }>,
  trendingCards: PokemonCard[],
): FeaturedCard[] {
  // KI-genannte Kartennamen gegen echte Kartendaten matchen.
  // KEIN Auffüllen mit unpassenden Trending-Karten — nur Karten, die der Artikel nennt.
  const matched: FeaturedCard[] = [];
  const used = new Set<string>();

  for (const { name } of aiNames) {
    const lower = name.toLowerCase();
    const found = trendingCards.find(
      (c) => !used.has(c.id) && (c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())),
    );
    if (found) {
      used.add(found.id);
      matched.push(toFeaturedCard(found));
    }
  }

  return matched.filter((c) => c.imageUrl);
}

function matchSectionHighlights(
  sections: Array<{ heading: string; content: string; cardRef?: string }>,
  trendingCards: PokemonCard[],
): Article['sections'] {
  return sections.map((s) => {
    if (!s.cardRef) return { heading: s.heading, content: s.content };
    const lower = s.cardRef.toLowerCase();
    const found = trendingCards.find(
      (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()),
    );
    if (!found || !found.imageUrl) return { heading: s.heading, content: s.content };
    return {
      heading: s.heading,
      content: s.content,
      highlight: {
        name: found.name,
        imageUrl: found.imageUrl,
        price: found.prices.market || found.prices.holofoil?.market || 0,
        trend: found.trendPercent || 0,
        rarity: found.rarity,
        set: found.set,
        setCode: found.setCode,
      },
    };
  });
}

/** Read-only: static fallback → Supabase. Returns null if not yet generated. Never calls Claude. */
export async function readArticle(date: string): Promise<Article | null> {
  if (STATIC_ARTICLES[date]) {
    const s = STATIC_ARTICLES[date];
    return { ...s, featuredCards: s.featuredCards?.length ? s.featuredCards : [], generatedAt: new Date().toISOString(), isStatic: true };
  }
  return loadArticle(date);
}

/** Generate + persist. For cron jobs only — never call from a user-facing page. */
export async function generateArticle(type: ArticleType, date: string): Promise<Article> {
  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // 1. Static articles — no network calls, instant response.
  if (STATIC_ARTICLES[date]) {
    const staticArticle = STATIC_ARTICLES[date];
    return {
      ...staticArticle,
      featuredCards: staticArticle.featuredCards?.length ? staticArticle.featuredCards : [],
      generatedAt: new Date().toISOString(),
      isStatic: true,
    };
  }

  // 2. Supabase cache — one fast DB read, previously generated articles.
  const cached = await loadArticle(date);
  if (cached) return cached;

  // 3. Fetch live market data only when we actually need to generate.
  let trendingCards: PokemonCard[] = [];
  let cardSummary = 'Keine aktuellen Daten verfügbar';
  try {
    trendingCards = await fetchTrendingCards(10);
    cardSummary = trendingCards
      .slice(0, 6)
      .map((c) => `${c.name} (${c.set}): ${(c.prices.market || c.prices.holofoil?.market || 0).toFixed(2)}€, Trend: ${(c.trendPercent || 0).toFixed(1)}%`)
      .join('\n');
  } catch {}

  // Ohne API-Key direkt vollwertigen Fallback liefern.
  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback = fallbackArticle(type, dateLabel, cardSummary);
    fallback.featuredCards = matchCardsFromText(
      [fallback.title, fallback.intro, ...fallback.sections.map((s) => `${s.heading} ${s.content}`)],
      trendingCards,
    );
    return fallback;
  }

  interface ArticleData {
    title: string;
    intro: string;
    featuredCards?: Array<{ name: string }>;
    sections: Array<{ heading: string; content: string; cardRef?: string }>;
    keyPoints: string[];
    tags: string[];
    sources?: Array<{ label: string; url: string }>;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildPrompt(type, cardSummary, dateLabel) }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const data: ArticleData = JSON.parse(jsonMatch?.[0] || '{}');

    if (!data.title || !data.sections || data.sections.length === 0) {
      const fallback = fallbackArticle(type, dateLabel, cardSummary);
      fallback.featuredCards = matchCardsFromText(
      [fallback.title, fallback.intro, ...fallback.sections.map((s) => `${s.heading} ${s.content}`)],
      trendingCards,
    );
      return fallback;
    }

    const wordCount = [data.intro, ...(data.sections || []).map((s) => s.content)].join(' ').split(' ').length;
    const article: Article = {
      title: data.title,
      intro: data.intro || '',
      featuredCards: matchFeaturedCards(data.featuredCards || [], trendingCards),
      sections: matchSectionHighlights(data.sections || [], trendingCards),
      keyPoints: data.keyPoints || [],
      tags: data.tags || [],
      sources: data.sources || [],
      readingTimeMin: Math.max(1, Math.ceil(wordCount / 200)),
      generatedAt: new Date().toISOString(),
    };
    // Persist so future requests are instant and the article is available historically.
    await saveArticle(date, type, article).catch(() => {});
    return article;
  } catch {
    const fallback = fallbackArticle(type, dateLabel, cardSummary);
    fallback.featuredCards = matchCardsFromText(
      [fallback.title, fallback.intro, ...fallback.sections.map((s) => `${s.heading} ${s.content}`)],
      trendingCards,
    );
    return fallback;
  }
}
