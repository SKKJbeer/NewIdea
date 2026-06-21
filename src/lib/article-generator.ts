import Anthropic from '@anthropic-ai/sdk';
import { fetchTrendingCards } from './pokemon-api';
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
  sections: Array<{ heading: string; content: string }>;
  keyPoints: string[];
  tags: string[];
  readingTimeMin: number;
  generatedAt: string;
}

// Static preview titles shown in the blog listing (without date params)
export const ARTICLE_PREVIEW_TITLES: Record<ArticleType, string> = {
  markt:      'Pokémon-Markt im Check: Was sich gerade wirklich lohnt',
  karte:      'Karte unter der Lupe: Charizard ex — warum Glurak nicht aufhört zu steigen',
  strategie:  'Die 3-Stufen-Strategie: So baust du ein Portfolio das wirklich wächst',
  set:        'Set im Check: Pokémon 151 — das beste moderne Investment-Set erklärt',
  ausblick:   'Wochenend-Ausblick: Was Sammler & Investoren jetzt wissen sollten',
  guide:      'Pokémon-Fälschungen erkennen: So schützt du dich vor gefakten Karten',
  rueckblick: 'Wochenrückblick: Was der Markt diese Woche gelehrt hat',
};

// Short teaser line shown under each title in the listing
export const ARTICLE_PREVIEW_SUBTITLES: Record<ArticleType, string> = {
  markt:      'Welche Karten diese Woche gewinnen und verlieren — mit echten Zahlen.',
  karte:      'Eine Karte im Spotlight: Geschichte, Preis und Zukunftspotenzial.',
  strategie:  'Konkrete Tipps: wie du kaufst, wann du kaufst — ehrlich über Risiken.',
  set:        'Welche Chase-Cards lohnen sich? Sealed oder Einzelkarten? Der Check.',
  ausblick:   'Was kaufen, was meiden, worauf achten — dein Überblick fürs Wochenende.',
  guide:      'Schritt für Schritt erklärt — praktisch für Einsteiger und Fortgeschrittene.',
  rueckblick: 'Was lief gut, was schlecht, was lernen wir — ungeschönt.',
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
    {"heading": "Konkrete Aussage als Überschrift (keine Fragen)", "content": "3-4 lockere, konkrete Sätze mit Zahlen"},
    {"heading": "Zweite Abschnittsaussage", "content": "..."},
    {"heading": "Dritte Abschnittsaussage", "content": "..."}
  ],
  "keyPoints": ["Takeaway 1 — kurz und merkbar", "Takeaway 2", "Takeaway 3"],
  "tags": ["pokémon karten", "tcg", "investment", "weiteres keyword"]
}`;

// Vollwertige Evergreen-Artikel als Fallback — im Marco-Persona-Stil.
// Diese laufen wenn kein ANTHROPIC_API_KEY gesetzt ist oder die KI-Generierung scheitert.
function fallbackArticle(type: ArticleType, dateLabel: string, _cardSummary: string): Article {
  const meta = ARTICLE_META[type];

  const data: Record<ArticleType, Omit<Article, 'readingTimeMin' | 'generatedAt' | 'featuredCards'>> = {
    markt: {
      title: `Pokémon-Markt im Check: Was sich gerade wirklich lohnt (${dateLabel})`,
      intro: 'Der Pokémon-Kartenmarkt schläft nie — und wenn du kurz nicht hinschaust, hast du eine Preisbewegung von 40 % verpasst. Ich beobachte diesen Markt seit über 15 Jahren und eines hat sich nie geändert: Qualität schlägt Hype, früher oder später. Heute schauen wir uns an, was gerade wirklich passiert.',
      sections: [
        {
          heading: 'Special Illustration Rares dominieren weiterhin',
          content: 'SIRs (Special Illustration Rares — das sind die Karten mit dem vollflächigen Kunstwerk ohne Hintergrundbox, erkennbar am goldenen Stern-Symbol) sind seit Scarlet & Violet 2023 die absoluten Hochperformer. Warum? Weil ihre Druckrate extrem niedrig ist — oft 1 Karte auf 80–100 Boosterpacks — und weil die Artworks schlicht atemberaubend sind. Karten wie der Charizard ex SIR aus dem 151-Set oder Mewtu ex haben sich seit ihrem Tiefpunkt kurz nach Release teils verdoppelt. Der Markt hat verstanden, dass diese Karten die Originale der nächsten Generation sind.',
        },
        {
          heading: 'Wer gewinnt, wer verliert — und warum',
          content: 'Gewinner sind gerade Karten von ikonischen Pokémon (Glurak/Charizard, Pikachu, Mewtu, Evoli/Eevee und seine Entwicklungen), die gleichzeitig aus Sets stammen, die nicht mehr gedruckt werden. Verlierer sind Generic-Ultra-Rares von weniger bekannten Pokémon — da ist der Hype nach Set-Release oft innerhalb von Wochen wieder verpufft. Eine gute Faustregel: Wenn dich ein Pokémon auch als jemand, der kaum spielt, sofort erkennt, hat die Karte davon auch langfristig Wertpotenzial.',
        },
        {
          heading: 'Meine ehrliche Einschätzung für diese Woche',
          content: 'Der Markt ist gerade in einer gesunden Konsolidierungsphase — keine wilden Spikes, aber auch keine Panikverkäufe. Das ist eine gute Zeit zum Kaufen, nicht zum Verkaufen. Wer jetzt gezielt SIRs von Top-Pokémon aus dem letzten Jahr einsammelt, der kauft zu Preisen, die in 12–18 Monaten wahrscheinlich deutlich höher liegen werden. Wichtig: Nur Karten in Near-Mint-Zustand — ein Kratzer kostet dich beim Wiederverkauf oft 30–50 % des Werts.',
        },
      ],
      keyPoints: [
        'SIRs von ikonischen Pokémon sind die sicherste langfristige Wahl',
        'Kaufphase: Konsolidierung ist günstiger Einstiegszeitpunkt',
        'Zustand ist König — nur NM oder besser kaufen',
      ],
      tags: ['pokémon marktanalyse', 'special illustration rare', 'tcg preise', 'pokemon investment'],
    },
    karte: {
      title: 'Karte unter der Lupe: Charizard ex — warum Glurak einfach nicht aufhört zu steigen',
      intro: 'Es gibt Karten die man kauft, weil sie gerade heiß sind — und dann gibt es Charizard ex. Glurak (das ist der orange Drache den wirklich jeder kennt, auch deine Oma) ist seit 1998 das meistgesuchte Pokémon im TCG überhaupt. Seine neueste Inkarnation im 151-Set hat etwas geschafft, das nicht viele Karten hinbekommen: Sie hat ihren Post-Release-Tiefpunkt durchlaufen und steigt seitdem konstant. Hier ist warum das kein Zufall ist.',
      sections: [
        {
          heading: 'Was diese Karte so besonders macht',
          content: 'Die Charizard ex Special Illustration Rare aus dem Pokémon 151-Set (Set-Code sv3pt5) zeigt Glurak in einem epischen vollflächigen Kunstwerk, das an die klassischen Originalillustrationen der 90er erinnert. Das 151-Set war eine Hommage an die ersten 151 Pokémon — und dieser Charizard ist die Chase-Card des Sets. Die Druckrate lag bei schätzungsweise 1:120 Packs. Zum Vergleich: Du öffnest 10 Boosterboxen (360 Packs) und ziehst statistisch 3 davon — wenn du Glück hast.',
        },
        {
          heading: 'Preisentwicklung: Wo kommen wir her, wo gehen wir hin',
          content: 'Nach Release lag die Karte kurz bei 80–90 € (der typische Post-Hype-Tiefpunkt wenn der Markt überschwemmt wird). Seitdem klettert sie konstant nach oben. Der Grund: Das 151-Set wird nicht ewig gedruckt. Jede Woche, die vergeht, wird das Angebot auf Cardmarket kleiner. Gleichzeitig entdecken neue Pokémon-Fans die Karte — die globale Fangemeinde wächst. Historisch gesehen haben Charizard-Karten aus ausgelaufenen Sets nie dauerhaft an Wert verloren.',
        },
        {
          heading: 'Kaufen, halten oder warten?',
          content: 'Meine klare Meinung: Wer diese Karte noch nicht hat und auf Wertzuwachs setzt, sollte jetzt kaufen — nicht warten. Nicht weil ich Preisprognosen verspreche (das tue ich nie), sondern weil die Fundamentaldaten stimmen: Ikonisches Pokémon, limitiertes Set, starke Fangemeinde, herausragendes Artwork. Einen Kauf unter 150 € für eine NM-Karte würde ich als fairen Einstieg betrachten. Achte auf den Cardmarket-Zustand "Near Mint" und kaufe nur bei Verkäufern mit guter Bewertung.',
        },
      ],
      keyPoints: [
        'Charizard ex SIR (151) = Fundamentaldaten stimmen, kein reiner Hype',
        'Post-Release-Tiefpunkte sind Kaufmöglichkeiten, keine Alarmsignale',
        'Nur NM-Exemplare kaufen — Zustand bestimmt 40–60 % des Wiederverkaufswerts',
      ],
      tags: ['charizard ex', 'pokemon 151', 'special illustration rare', 'karte im fokus'],
    },
    strategie: {
      title: 'Die 3-Stufen-Strategie: So baust du ein Pokémon-Portfolio das wirklich wächst',
      intro: 'Die meisten Leute machen es falsch: Sie öffnen Packs (macht Spaß, vernichtet Kapital), kaufen was gerade heiß ist (kauft man oben) oder horten hunderte günstige Karten (Masse statt Klasse). Nach 15 Jahren im Markt habe ich gesehen, was wirklich funktioniert — und es ist verblüffend einfach. Hier ist die Strategie, die ich selbst anwende.',
      sections: [
        {
          heading: 'Stufe 1 — Das Fundament: 1–2 Blue-Chip-Karten',
          content: 'Genau wie im Aktienmarkt gibt es "Blue Chips" — Karten die so ikonisch und so gefragt sind, dass sie fast unmöglich dauerhaft fallen. Das sind Charizard, Pikachu, Mewtu und Evoli-Entwicklungen in ihren Top-Versionen (SIR, Alternate Art, historische Holos). Diese Karten nehmen 60 % deines Budgets ein. Sie sind dein Anker. Du kaufst sie in Near-Mint-Zustand, steckst sie in einen Magnethalter und vergisst sie für 2–3 Jahre.',
        },
        {
          heading: 'Stufe 2 — Das Wachstum: 2–3 aktuelle SIRs kurz nach Release',
          content: 'Neue Sets haben immer einen Hype-Spike direkt nach Veröffentlichung — dann crashen die Preise wenn der Markt mit frischen Karten geflutet wird. Das ist dein Kaufzeitpunkt: 4–8 Wochen nach Set-Release, wenn die Preise auf ihrem Tiefpunkt sind. Kaufe die 2–3 stärksten SIRs des Sets (erkennbar an beliebten Pokémon und starkem Artwork). Diese 30 % deines Budgets sind dein Wachstumsmotor für die nächsten 12–18 Monate.',
        },
        {
          heading: 'Stufe 3 — Der Wildcard-Slot: Ein sealed Produkt',
          content: 'Die restlichen 10 % stecke in eine versiegelte Boosterbox oder Elite Trainer Box aus einem Set, das du spannend findest. Versiegelte Produkte steigen nach Produktionsende fast immer im Wert — manchmal 100–200 % in 3–5 Jahren. Lagere sie in einem kühlen, trockenen Bereich ohne direkte Sonneneinstrahlung. Das ist kein schnelles Geld, aber ein sehr stabiler Wertzuwachs über Zeit.',
        },
      ],
      keyPoints: [
        '60 % in Blue-Chip-Karten (Charizard, Pikachu, Mewtu als SIR oder Alternate Art)',
        '30 % in aktuelle SIRs — 4–8 Wochen nach Release kaufen (Tiefpunkt)',
        '10 % in versiegelte Produkte für langfristigen, stabilen Wertzuwachs',
      ],
      tags: ['pokemon investment strategie', 'pokemon portfolio', 'special illustration rare', 'sealed investment'],
    },
    set: {
      title: 'Set im Check: Pokémon 151 — das beste moderne Investment-Set erklärt',
      intro: 'Pokémon 151 (offiziell "Scarlet & Violet — 151", Set-Code sv3pt5) ist das Set, über das in der TCG-Community mehr geredet wird als über fast jedes andere seit Jahren. Es ist eine Hommage an die Original-151 Pokémon aus dem Base Set von 1998 — und für viele die erste Rückkehr zur Kindheit in Kartenform. Ich habe das Set von Anfang an beobachtet und kann sagen: Diese Begeisterung ist berechtigt.',
      sections: [
        {
          heading: 'Was das Set so besonders macht',
          content: 'Das 151-Set enthält ausschließlich die originalen 151 Pokémon — Bisasam, Glumanda, Schiggy bis Mewtu und Mew. Jedes ikonische Pokémon ist dabei, und jedes hat seine Special Illustration Rare-Version bekommen. Das bedeutet: Alle Pokémon, an die Fans mit Nostalgie denken — Glurak, Pikachu, Mewtu, Relaxo (das dicke schlafende Pokémon), Evoli und mehr — haben epische Kunstwerke auf exklusiven SIR-Karten. Das ist eine Zusammenstellung die man so nicht noch einmal sehen wird.',
        },
        {
          heading: 'Die Top-Chase-Cards und ihre Preisbewegung',
          content: 'Die vier wertvollsten Karten des Sets sind der Charizard ex SIR (ab 120 €), der Mewtu ex SIR (ab 80 €), der Pikachu ex SIR (ab 60 €) und der Evoli ex SIR (Eevee — das süße braune Basisform-Pokémon vor seinen 8 Entwicklungen, ab 50 €). Alle vier haben nach ihrem Post-Release-Tiefpunkt nachhaltig zugelegt. Das liegt daran, dass das 151-Set bereits nicht mehr aktiv gedruckt wird — das Angebot an frischen Packs schrumpft.',
        },
        {
          heading: 'Sealed oder Einzelkarten — was lohnt sich mehr?',
          content: 'Wenn du ein klares Ziel hast (eine bestimmte Karte), kaufe die Einzelkarte direkt auf Cardmarket. Packs öffnen ist eine Glücksspirale — du gibst statistisch mehr aus als die Karte einzeln kostet. Wenn du auf Wertzuwachs aus bist und Geduld hast: Eine versiegelte Boosterbox des 151-Sets ist eine solide langfristige Position. Sie kostet heute deutlich mehr als zum Release, aber Sets mit dieser Nostalgiepower haben historisch immer weiter zugelegt, wenn die Produktion endet.',
        },
      ],
      keyPoints: [
        'Alle Original-151 als SIRs — einmalige Nostalgiepower',
        'Top-4: Charizard, Mewtu, Pikachu, Evoli — alle mit nachhaltigem Preisanstieg',
        'Sealed nur für Geduldige; Einzelkarten effizienter für gezielte Sammler',
      ],
      tags: ['pokémon 151', 'set analyse', 'scarlet violet', 'sv3pt5 investment'],
    },
    ausblick: {
      title: 'Wochenend-Ausblick: Was Sammler & Investoren jetzt im Blick haben sollten',
      intro: 'Das Wochenende ist die aktivste Handelszeit auf Cardmarket — Käufer haben mehr Zeit zum Stöbern, Verkäufer optimieren ihre Preise. Als jemand der seit Jahren jeden Samstag den Markt beobachtet, habe ich gelernt: Kleine Informationsvorteile machen den Unterschied. Hier ist was du dieses Wochenende wissen solltest.',
      sections: [
        {
          heading: 'Kaufen: Diese Karten sind gerade unterbewertet',
          content: 'Schau dir gezielt SIRs von Pokémon an, die in den letzten 2–3 Wochen keine großen Preisbewegungen hatten — das sind oft Karten in einer Bodenbildungsphase. Besonders interessant: Alternate-Art-Karten aus Evolving Skies (Set mit Drachenpokémon und Eevee-Entwicklungen), die 2021 veröffentlicht wurden und seitdem konstant steigen. Der Rayquaza VMAX Alt Art (das riesige grüne Drachen-Pokémon) und der Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit den gelben Ringen) sind klassische Beispiele.',
        },
        {
          heading: 'Halten oder verkaufen: Nach Hype-Spikes aufpassen',
          content: 'Falls du Karten aus einem Set hast, das gerade erst erschienen ist und stark im Preis gestiegen ist: Überlege genau. Die ersten 4–8 Wochen nach einem Set-Release sind die volatilste Phase. Danach kommt fast immer eine Korrektur, wenn der Markt mit Neuware überflutet wird. Klassiker und gut erhaltene Karten aus ausgelaufenen Sets hältst du einfach — die brauchen Zeit, kein aktives Management.',
        },
        {
          heading: 'Diese Woche im Auge behalten',
          content: 'Schau auf Cardmarket ob bestimmte Karten plötzlich weniger Angebote haben (sinkendes Angebot = Preisanstieg in Sicht) oder ob eine Karte auf mehreren internationalen Plattformen gleichzeitig anzieht (deutet auf echte Nachfrage hin, nicht nur deutschen Einzelhandel). Turniere am Wochenende können Spieler-Karten kurzfristig verteuern — aber Spieler-Hype hält selten länger als 2–3 Wochen an.',
        },
      ],
      keyPoints: [
        'SIRs in Bodenbildungsphase kaufen — ruhige Märkte sind Kaufchancen',
        'Nach Set-Release 4–8 Wochen warten, nicht in den Hype kaufen',
        'Angebotsmenge auf Cardmarket beobachten — sinkendes Angebot = Preisanstieg',
      ],
      tags: ['wochenend ausblick', 'pokemon cardmarket', 'pokemon karten kaufen', 'tcg investment'],
    },
    guide: {
      title: 'Pokémon-Fälschungen erkennen: So schützt du dich vor gefakten Karten',
      intro: 'Es ist passiert: Du kaufst eine Charizard ex SIR für 90 €, sie kommt an, und irgendetwas fühlt sich seltsam an. Das Rot ist zu grell. Der Glitzer ist zu gleichmäßig. Das Papier zu dünn. Du hast eine Fälschung. Willkommen in der Schattenwelt des Pokémon-TCG — ein Problem das mit steigenden Kartenpreisen immer schlimmer wird. Nach 15 Jahren und vermutlich 50.000+ geprüften Karten zeige ich dir die einfachsten Tests.',
      sections: [
        {
          heading: 'Der Lichttest — 30 Sekunden, keine Ausrüstung nötig',
          content: 'Halte die Karte schräg gegen eine Lampe oder ins Tageslicht. Echte Pokémon-Karten haben eine charakteristische schwarze Schicht in der Mitte des Kartonverbunds — das sieht man wenn man von der Seite schaut. Fälschungen fehlt diese Schicht oft, oder sie ist zu dünn. Zweite Methode: Biege die Karte leicht (nicht falten!). Echte Karten haben eine gewisse Steifigkeit und schnappen sofort zurück. Fakes sind oft entweder zu weich und bieglos oder zu steif wie Pappe.',
        },
        {
          heading: 'Druckqualität und Textur prüfen',
          content: 'Echte Pokémon-Karten haben eine sehr gleichmäßige, leicht raue Textur auf der Vorderseite — du spürst das Druckbild unter dem Finger. Fälschungen fühlen sich oft zu glatt an (zu viel Beschichtung) oder haben eine ungleichmäßige Oberfläche. Der Hologrammeffekt auf Rare-Karten sollte fließend und tiefgründig wirken — bei Fakes sieht er oft flach und zu symmetrisch aus. Schau auch auf den Text: Echte Karten haben scharfe, klare Buchstaben. Pixeliger oder leicht verschwommener Text ist ein Alarmzeichen.',
        },
        {
          heading: 'Den Verkäufer und Preis prüfen',
          content: 'Die beste Fälschungsprävention passiert vor dem Kauf. Kaufe auf Cardmarket nur bei Verkäufern mit Bewertung über 98 % und mindestens 50 Transaktionen. Privat-Verkäufe auf Facebook-Gruppen oder Ebay-Kleinanzeigen sind deutlich riskanter — immer Fotos unter Tageslicht verlangen und nach dem Lichttest-Foto fragen. Preise die 30 % unter dem Cardmarket-Durchschnitt liegen sollten Alarm auslösen: Zu günstig bedeutet fast immer gefälscht oder stark beschädigt.',
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
      title: 'Wochenrückblick: Was der Markt diese Woche gelehrt hat — und was ich daraus mitnehme',
      intro: 'Jede Woche im Pokémon-Kartenmarkt ist ein kleines Lehrstück in Psychologie, Angebot und Nachfrage und der ewigen menschlichen Tendenz, erst zu kaufen und dann zu denken. Ich schaue mir das schon seit 15 Jahren an und lerne noch immer Neues. Hier ist mein persönliches Fazit zur vergangenen Woche — ungeschönt.',
      sections: [
        {
          heading: 'Was diese Woche gut lief',
          content: 'Karten aus ausgelaufenen Sets haben wieder bewiesen, dass Geduld belohnt wird. Wer vor 6–12 Monaten in SIRs aus dem 151-Set oder Alternate Arts aus Evolving Skies (das Set mit Drachenpokémon-Artworks aus 2021) investiert hat, schaut auf solide Gewinne. Kein dramatischer Anstieg, aber genau das ist es was Qualitätsinvestments auszeichnet: konstant, nicht volatil. Speziell Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit Mond-Motiv) hat diese Woche nochmal angezogen.',
        },
        {
          heading: 'Was diese Woche eine Lektion war',
          content: 'Ein neues Set hat Release-Hype ausgelöst — Preise für Chase-Cards sofort nach Release stiegen auf 200+ €. Innerhalb von 10 Tagen: -35 %. Wer in den ersten zwei Wochen nach Release kauft, zahlt fast immer den Hype-Preis. Das ist kein neues Phänomen und wird sich auch nicht ändern — die Psychologie ist immer gleich. Merke: Der erste Preis nach Release ist selten der faire Preis. Warte. Lass den Markt atmen.',
        },
        {
          heading: 'Was ich für die kommende Woche erwarte',
          content: 'Der Markt ist gerade in einem ruhigen Fahrwasser — ideal zum Kaufen, schwierig zum Verkaufen mit schnellem Gewinn. Ich werde gezielt Cardmarket-Angebote nach SIRs durchsuchen, die in den letzten 30 Tagen im Preis gefallen sind, aber keine fundamentalen Gründe für den Fall haben (kein gestiegenes Angebot, kein neues ähnliches Produkt). Das sind oft versteckte Gelegenheiten. Ansonsten: Bestehende Position halten, nicht aus Ungeduld handeln.',
        },
      ],
      keyPoints: [
        'Geduld schlägt immer Hype — ausgelaufene Set-Karten beweisen das woche für woche',
        'Release-Preise sind Hype-Preise — 4–8 Wochen warten spart oft 30–40 %',
        'Ruhige Marktphasen = Kaufchancen; aktives Handeln nur mit klarer Begründung',
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
  const persona = `Du bist Marco, Pokémon-TCG-Experte mit 15+ Jahren Erfahrung. Du hast die Base-Set-Ära live miterlebt, auf Turnieren gespielt und Tausende Karten bewertet. Du schreibst für einen deutschen Blog — locker, konkret und leicht unterhaltsam. Wichtig: Einfache Sprache, Fachbegriffe immer kurz erklären. Wenn du ein Pokémon erwähnst das nicht jeder kennt, beschreibe es kurz in Klammern (z.B. "Umbreon VMAX (das schwarze Nacht-Pokémon mit den gelben Ringen)"). Nutze echte Zahlen und Karten-Namen. Kein Finanz-Bullshit, klare Meinung. Antworte NUR mit validem JSON:\n${JSON_SCHEMA}`;

  const contexts: Record<ArticleType, string> = {
    markt:      `Schreibe eine Marktanalyse für ${dateLabel}. Starte mit einer überraschenden Preisveränderung. Analysiere Trends, nenne Gewinner und Verlierer. Füge 3-4 konkrete Karten in featuredCards ein.\n\nAktuelle Marktdaten:\n${cards}`,
    karte:      `Wähle die spannendste Karte aus den Daten und analysiere sie tiefgehend (Geschichte, Artwork, Preisentwicklung, Zukunftspotenzial). Stand: ${dateLabel}. Füge diese Karte + 2-3 vergleichbare in featuredCards ein.\n\nAktuelle Karten:\n${cards}`,
    strategie:  `Erkläre eine konkrete, umsetzbare Investment-Strategie für ${dateLabel}. Sei ehrlich über Risiken. Gib Beispielkarten für die Strategie — in featuredCards eintragen.\n\nMarktdaten:\n${cards}`,
    set:        `Analysiere ein aktuell interessantes Pokémon-TCG-Set. Welche Chase-Cards lohnen sich? Sealed oder Einzelkarten? Stand: ${dateLabel}. Die Top-Karten des Sets in featuredCards eintragen.\n\nKarten (mit Set-Info):\n${cards}`,
    ausblick:   `Gib einen konkreten Ausblick: Was kaufen, was meiden, worauf achten — für das Wochenende ab ${dateLabel}. Empfohlene Karten in featuredCards.\n\nAktuelle Daten:\n${cards}`,
    guide:      `Schreibe einen unterhaltsamen Guide — praktisch für Einsteiger, trotzdem interessant für Fortgeschrittene. Mit echten Karten-Beispielen. Stand: ${dateLabel}. Beispielkarten in featuredCards.\n\nKontext:\n${cards}`,
    rueckblick: `Wochenrückblick ${dateLabel}: Was lief gut, was schlecht, was lernen wir daraus? Locker und ehrlich. Die Karten der Woche in featuredCards.\n\nWochendaten:\n${cards}`,
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

export async function generateArticle(type: ArticleType, date: string): Promise<Article> {
  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

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
    sections: Array<{ heading: string; content: string }>;
    keyPoints: string[];
    tags: string[];
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
    return {
      title: data.title,
      intro: data.intro || '',
      featuredCards: matchFeaturedCards(data.featuredCards || [], trendingCards),
      sections: data.sections || [],
      keyPoints: data.keyPoints || [],
      tags: data.tags || [],
      readingTimeMin: Math.max(1, Math.ceil(wordCount / 200)),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    const fallback = fallbackArticle(type, dateLabel, cardSummary);
    fallback.featuredCards = matchFeaturedCards([], trendingCards);
    return fallback;
  }
}
