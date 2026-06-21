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

export const DAY_TYPE: Record<number, ArticleType> = {
  0: 'rueckblick',
  1: 'markt',
  2: 'karte',
  3: 'strategie',
  4: 'set',
  5: 'ausblick',
  6: 'guide',
};

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
      "heading": "😅 Der Fehler der Woche — damit du ihn nicht machst",
      "content": "Ein typischer Anfänger- oder Fortgeschrittenen-Fehler der diese Woche im Markt sichtbar wurde. Humorvoll erklärt, aber mit echtem Lernwert.",
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
function fallbackArticle(type: ArticleType, dateLabel: string, _cardSummary: string): Article {
  const meta = ARTICLE_META[type];

  const data: Record<ArticleType, Omit<Article, 'readingTimeMin' | 'generatedAt' | 'featuredCards'>> = {
    markt: {
      title: `Pokémon-Markt im Überblick: Preisbewegungen und Trends (${dateLabel})`,
      intro: 'Der Pokémon-Kartenmarkt schläft nie — wer kurz nicht hinschaut, hat eine Preisbewegung von 40 % verpasst. Qualität schlägt Hype, früher oder später — das zeigen die Daten immer wieder. Hier ein Überblick zu den aktuellen Marktbewegungen.',
      sections: [
        {
          heading: 'Special Illustration Rares dominieren weiterhin',
          content: 'SIRs (Special Illustration Rares — das sind die Karten mit dem vollflächigen Kunstwerk ohne Hintergrundbox, erkennbar am goldenen Stern-Symbol) sind seit Scarlet & Violet 2023 die absoluten Hochperformer. Warum? Weil ihre Druckrate extrem niedrig ist — oft 1 Karte auf 80–100 Boosterpacks — und weil die Artworks schlicht atemberaubend sind. Karten wie der Charizard ex SIR aus dem 151-Set oder Mewtu ex haben sich seit ihrem Tiefpunkt kurz nach Release teils verdoppelt. Der Markt zeigt: Diese Karten sind die Klassiker der nächsten Generation.',
        },
        {
          heading: 'Wer gewinnt, wer verliert — und warum',
          content: 'Gewinner sind gerade Karten von ikonischen Pokémon (Glurak/Charizard, Pikachu, Mewtu, Evoli/Eevee und seine Entwicklungen), die gleichzeitig aus Sets stammen, die nicht mehr gedruckt werden. Verlierer sind Generic-Ultra-Rares von weniger bekannten Pokémon — da ist der Hype nach Set-Release oft innerhalb von Wochen wieder verpufft. Eine gute Faustregel: Wenn ein Pokémon auch von jemandem erkannt wird, der kaum spielt, hat die Karte langfristig Wertpotenzial.',
        },
        {
          heading: 'Marktphase: Konsolidierung und ihre Bedeutung',
          content: 'Der Markt befindet sich in einer Konsolidierungsphase — keine wilden Spikes, aber auch keine Panikverkäufe. Solche Phasen sind historisch oft der Boden vor weiteren Bewegungen. Für alle Karten gilt: Nur Near-Mint-Exemplare haben langfristig den vollen Wert — ein Kratzer kostet beim Wiederverkauf oft 30–50 % des Werts.',
        },
      ],
      keyPoints: [
        'SIRs von ikonischen Pokémon zeigen die stabilste Preisentwicklung',
        'Konsolidierungsphasen sind historisch Vorstufen zur nächsten Bewegung',
        'Zustand ist entscheidend — nur NM behält langfristig den vollen Wert',
      ],
      tags: ['pokémon marktanalyse', 'special illustration rare', 'tcg preise', 'pokemon investment'],
    },
    karte: {
      title: 'Karte im Fokus: Charizard ex — Preisentwicklung und Marktanalyse',
      intro: 'Glurak (das ist der orange Drache den wirklich jeder kennt) ist seit 1998 das meistgesuchte Pokémon im TCG überhaupt. Seine Inkarnation im 151-Set hat etwas geschafft, das nicht viele Karten hinbekommen: Sie hat ihren Post-Release-Tiefpunkt durchlaufen und steigt seitdem konstant. Hier die Marktdaten.',
      sections: [
        {
          heading: 'Was diese Karte so besonders macht',
          content: 'Die Charizard ex Special Illustration Rare aus dem Pokémon 151-Set (Set-Code sv3pt5) zeigt Glurak in einem epischen vollflächigen Kunstwerk, das an die klassischen Originalillustrationen der 90er erinnert. Das 151-Set war eine Hommage an die ersten 151 Pokémon — und dieser Charizard ist die Chase-Card des Sets. Die Druckrate lag bei schätzungsweise 1:120 Packs. Zum Vergleich: 10 Boosterboxen (360 Packs) ergeben statistisch 3 Exemplare.',
        },
        {
          heading: 'Preisentwicklung: Wo kommen wir her, wo gehen wir hin',
          content: 'Nach Release lag die Karte kurz bei 80–90 € (der typische Post-Hype-Tiefpunkt wenn der Markt mit Neuware überschwemmt wird). Seitdem klettert sie konstant nach oben. Der Grund: Das 151-Set wird nicht ewig gedruckt. Jede Woche, die vergeht, wird das Angebot auf Cardmarket kleiner. Gleichzeitig entdecken neue Pokémon-Fans die Karte — die globale Fangemeinde wächst. Historisch gesehen haben Charizard-Karten aus ausgelaufenen Sets nie dauerhaft an Wert verloren.',
        },
        {
          heading: 'Marktlage und Preiseinordnung',
          content: 'Die Fundamentaldaten dieser Karte sind klar: Ikonisches Pokémon, limitiertes Set, starke Fangemeinde, herausragendes Artwork. Aktuell notiert die Karte bei 120–150 € für Near-Mint-Exemplare — eine Preiszone die der Markt als fair akzeptiert hat. Auf Cardmarket sind Zustand "Near Mint" und Verkäuferbewertung die wichtigsten Qualitätskriterien. PSA-10-Exemplare notieren bei 250–350 € — der höchste Qualitätsstandard für Langzeitsammler.',
        },
      ],
      keyPoints: [
        'Charizard ex SIR (151) — Fundamentaldaten stimmen, kein reiner Hype',
        'Post-Release-Tiefpunkte zeigen das historische Preismuster',
        'NM-Exemplare bei 120–150 €; PSA 10 für 250–350 € — Qualität bestimmt den Preis',
      ],
      tags: ['charizard ex', 'pokemon 151', 'special illustration rare', 'karte im fokus'],
    },
    strategie: {
      title: 'Portfolio-Strategie: Wie Pokémon-Sammler ihr Portfolio aufbauen',
      intro: 'Die meisten Einsteiger machen ähnliche Fehler: Sie öffnen Packs (macht Spaß, vernichtet Kapital), kaufen was gerade viral geht (kauft man oben) oder horten hunderte günstige Karten (Masse statt Klasse). Die Marktdaten zeigen seit Jahren, was funktioniert — und es ist verblüffend einfach.',
      sections: [
        {
          heading: 'Stufe 1 — Das Fundament: 1–2 Blue-Chip-Karten',
          content: 'Genau wie im Aktienmarkt gibt es "Blue Chips" — Karten die so ikonisch und so gefragt sind, dass sie fast unmöglich dauerhaft fallen. Das sind Charizard, Pikachu, Mewtu und Evoli-Entwicklungen in ihren Top-Versionen (SIR, Alternate Art, historische Holos). Diese Karten nehmen 60 % des Budgets ein. Gekauft in Near-Mint-Zustand, in einen Magnethalter gesteckt und für 2–3 Jahre gehalten — so funktioniert das Fundament.',
        },
        {
          heading: 'Stufe 2 — Das Wachstum: 2–3 aktuelle SIRs kurz nach Release',
          content: 'Neue Sets haben immer einen Hype-Spike direkt nach Veröffentlichung — dann crashen die Preise wenn der Markt mit frischen Karten geflutet wird. Historisch liegt der optimale Zeitpunkt 4–8 Wochen nach Set-Release, wenn die Preise auf ihrem Tiefpunkt sind. Die 2–3 stärksten SIRs des Sets (erkennbar an beliebten Pokémon und starkem Artwork) bilden den Wachstumsanteil für die nächsten 12–18 Monate. FOMO bei Release hat historisch selten gut abgeschnitten.',
        },
        {
          heading: 'Stufe 3 — Der Wildcard-Slot: Ein sealed Produkt',
          content: 'Eine bewährte Aufteilung: 70 % Einzelkarten (gezielt, High-End, Near-Mint), 30 % sealed. Versiegelte Produkte steigen nach Produktionsende fast immer im Wert — manchmal 100–200 % in 3–5 Jahren. Kühle, trockene Lagerung ohne direkte Sonneneinstrahlung ist entscheidend. Packs öffnen ist Entertainment — die Statistik spricht gegen den wirtschaftlichen Vorteil gegenüber dem Direktkauf.',
        },
      ],
      keyPoints: [
        '60 % in Blue-Chip-Karten (Charizard, Pikachu, Mewtu als SIR oder Alternate Art)',
        '30 % in aktuelle SIRs — 4–8 Wochen nach Release historisch der optimale Zeitpunkt',
        '10 % in versiegelte Produkte für langfristigen, stabilen Wertzuwachs',
      ],
      tags: ['pokemon investment strategie', 'pokemon portfolio', 'special illustration rare', 'sealed investment'],
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
          content: 'Die vier wertvollsten Karten des Sets sind der Charizard ex SIR (ab 120 €), der Mewtu ex SIR (ab 80 €), der Pikachu ex SIR (ab 60 €) und der Evoli ex SIR (Eevee — das süße braune Basisform-Pokémon vor seinen 8 Entwicklungen, ab 50 €). Alle vier haben nach ihrem Post-Release-Tiefpunkt nachhaltig zugelegt. Das liegt daran, dass das 151-Set nicht mehr aktiv gedruckt wird — das Angebot an frischen Packs schrumpft.',
        },
        {
          heading: 'Sealed oder Einzelkarten — was zeigen die Preisdaten?',
          content: 'Wer eine bestimmte Karte sucht: Der Direktkauf auf Cardmarket ist statistisch immer günstiger als das Öffnen von Packs. Eine Charizard ex SIR für 130 € kostet weniger als der statistische Durchschnittseinsatz beim Öffnen (15+ Boosterboxen = über 500 €). Versiegelte Boosterboxen des 151-Sets haben seit Produktionsende weiter zugelegt — ein historisch konsistentes Muster bei Sets mit starkem Nostalgiewert.',
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
      intro: 'Das Wochenende ist die aktivste Handelszeit auf Cardmarket — Käufer haben mehr Zeit zum Stöbern, Verkäufer optimieren ihre Preise. Aktuelle Marktdaten zeigen klare Muster. Hier ein Überblick zu den wichtigsten Entwicklungen.',
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
      intro: 'Fälschungen im Pokémon-TCG sind ein wachsendes Problem — mit steigenden Kartenpreisen steigt der Anreiz für Fälscher. Eine Charizard ex SIR für 90 € die als Fälschung ankommt, bedeutet verlorenes Geld und verlorenes Vertrauen. Hier sind die wichtigsten Methoden zur Echtheitsprüfung.',
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
          content: 'Die Datenlage aus den letzten Wochen bestätigt sich: SIRs aus ausgelaufenen Sets wie Evolving Skies und dem 151-Set zeigen keine Schwäche. Umbreon VMAX Alt Art notiert weiter bei 120–135 €, Charizard ex SIR hält 125–145 €. Kein dramatischer Anstieg — aber Qualitätsinvestments zeichnen sich durch Konstanz aus, nicht durch Volatilität. Speziell Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit Mond-Motiv) zog diese Woche nochmal an.',
        },
        {
          heading: 'Was diese Woche als Lehrstück diente',
          content: 'Ein neues Set hat Release-Hype ausgelöst — Preise für Chase-Cards sofort nach Release stiegen auf 200+ €. Innerhalb von 10 Tagen: -35 %. Das ist kein neues Phänomen und wird sich nicht ändern — die Marktpsychologie ist immer gleich. Der erste Preis nach Release ist selten der faire Preis. 4–8 Wochen Wartezeit nach Release zeigen historisch einen deutlichen Preisunterschied.',
        },
        {
          heading: 'Ausblick auf die kommende Woche',
          content: 'Der Markt ist gerade in einem ruhigen Fahrwasser — kein ausgeprägter Aufwärts- oder Abwärtsdruck. Interessant sind SIRs die in den letzten 30 Tagen im Preis gefallen sind, ohne dass fundamentale Gründe erkennbar sind (kein gestiegenes Angebot, kein neues ähnliches Produkt). Überhastetes Handeln aus Ungeduld hat historisch selten besser abgeschnitten als das Halten bestehender Positionen.',
        },
      ],
      keyPoints: [
        'Geduld schlägt Hype — ausgelaufene Set-Karten zeigen das woche für woche',
        'Release-Preise sind Hype-Preise — historisch 4–8 Wochen für den fairen Preis warten',
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
  };
}

function buildPrompt(type: ArticleType, cards: string, dateLabel: string): string {
  const isRueckblick = type === 'rueckblick';

  const persona = isRueckblick
    ? `Du bist ein Pokémon-TCG-Marktanalyst der einen wöchentlichen Rückblick auf Deutsch schreibt. Stil: leicht lesbar und unterhaltsam, aber ohne persönliche Kaufempfehlungen — nur Beobachtungen, Fakten und Marktanalyse. Unbekannte Pokémon immer kurz in Klammern beschreiben. Kein Finanz-Geschwätz, klare sachliche Aussagen. Alle Altersgruppen ab 10 Jahren — alles jugendfrei. Antworte NUR mit validem JSON:\n${RUECKBLICK_SCHEMA}`
    : `Du bist ein Pokémon-TCG-Marktanalyst der Artikel auf Deutsch verfasst — klar, faktenbasiert und leicht verständlich. Fachbegriffe immer kurz erklären. Wenn du ein Pokémon erwähnst das nicht jeder kennt, beschreibe es kurz in Klammern (z.B. "Umbreon VMAX (das schwarze Nacht-Pokémon mit den gelben Ringen)"). Nutze echte Zahlen und Karten-Namen. Keine persönlichen Kaufempfehlungen — nur Marktbeobachtungen und sachliche Einschätzungen. Antworte NUR mit validem JSON:\n${JSON_SCHEMA}`;

  const contexts: Record<ArticleType, string> = {
    markt:      `Schreibe eine Marktanalyse für ${dateLabel}. Starte mit einer überraschenden Preisveränderung. Analysiere Trends, nenne Gewinner und Verlierer. Füge 3-4 konkrete Karten in featuredCards ein.\n\nAktuelle Marktdaten:\n${cards}`,
    karte:      `Wähle die spannendste Karte aus den Daten und analysiere sie tiefgehend (Geschichte, Artwork, Preisentwicklung). Stand: ${dateLabel}. Füge diese Karte + 2-3 vergleichbare in featuredCards ein.\n\nAktuelle Karten:\n${cards}`,
    strategie:  `Analysiere eine Strategie oder einen Ansatz im Pokémon-TCG-Markt für ${dateLabel}. Zeige Risiken und historische Muster. Karten in featuredCards eintragen.\n\nMarktdaten:\n${cards}`,
    set:        `Analysiere ein aktuell interessantes Pokémon-TCG-Set. Welche Chase-Cards stechen hervor? Sealed oder Einzelkarten — was zeigen die Preisdaten? Stand: ${dateLabel}. Die Top-Karten des Sets in featuredCards eintragen.\n\nKarten (mit Set-Info):\n${cards}`,
    ausblick:   `Gib einen sachlichen Ausblick auf aktuelle Marktentwicklungen für das Wochenende ab ${dateLabel}. Welche Karten zeigen Bewegungen, welche Risiken gibt es? Keine persönlichen Empfehlungen. Auffällige Karten in featuredCards.\n\nAktuelle Daten:\n${cards}`,
    guide:      `Schreibe einen unterhaltsamen Guide — praktisch für Einsteiger, trotzdem interessant für Fortgeschrittene. Mit echten Karten-Beispielen. Stand: ${dateLabel}. Beispielkarten in featuredCards.\n\nKontext:\n${cards}`,
    rueckblick: `Wochenrückblick für die Woche um ${dateLabel}. Erzähl was diese Woche in der Pokémon-Welt passiert ist — Markt, Community, Turniere, Anime-News. Welche Karte hat überrascht? Welcher Fehler war lehrreich? Und was kommt nächste Woche? Locker erzählt, mit echten Zahlen. Die Featured Cards sind die Karte der Woche + Überraschungen.\n\nAktuelle Marktdaten:\n${cards}`,
  };

  return `${persona}\n\n${contexts[type]}`;
}

function matchFeaturedCards(
  aiNames: Array<{ name: string }>,
  trendingCards: PokemonCard[],
): FeaturedCard[] {
  // Try to match AI-suggested card names against fetched card data
  const matched: FeaturedCard[] = [];
  const used = new Set<string>();

  for (const { name } of aiNames) {
    const lower = name.toLowerCase();
    const found = trendingCards.find(
      (c) => !used.has(c.id) && (c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())),
    );
    if (found) {
      used.add(found.id);
      matched.push({
        name: found.name,
        imageUrl: found.imageUrl,
        price: found.prices.market || found.prices.holofoil?.market || 0,
        trend: found.trendPercent || 0,
        rarity: found.rarity,
        set: found.set,
        setCode: found.setCode,
      });
    }
  }

  // Pad with top trending cards that have images if we have fewer than 3
  if (matched.length < 3) {
    for (const c of trendingCards) {
      if (matched.length >= 4) break;
      if (used.has(c.id) || !c.imageUrl) continue;
      used.add(c.id);
      matched.push({
        name: c.name,
        imageUrl: c.imageUrl,
        price: c.prices.market || c.prices.holofoil?.market || 0,
        trend: c.trendPercent || 0,
        rarity: c.rarity,
        set: c.set,
        setCode: c.setCode,
      });
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
    fallback.featuredCards = matchFeaturedCards([], trendingCards);
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
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildPrompt(type, cardSummary, dateLabel) }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const data: ArticleData = JSON.parse(jsonMatch?.[0] || '{}');

    if (!data.title || !data.sections || data.sections.length === 0) {
      const fallback = fallbackArticle(type, dateLabel, cardSummary);
      fallback.featuredCards = matchFeaturedCards([], trendingCards);
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
    fallback.featuredCards = matchFeaturedCards([], trendingCards);
    return fallback;
  }
}
