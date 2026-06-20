import Anthropic from '@anthropic-ai/sdk';
import { fetchTrendingCards } from './pokemon-api';

export type ArticleType = 'markt' | 'karte' | 'strategie' | 'set' | 'ausblick' | 'guide' | 'rueckblick';

export interface Article {
  title: string;
  intro: string;
  sections: Array<{ heading: string; content: string }>;
  keyPoints: string[];
  tags: string[];
  readingTimeMin: number;
  generatedAt: string;
}

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
  "title": "SEO-optimierter Titel (60-80 Zeichen, mit 'Pokémon' Keyword)",
  "intro": "Einleitung (2-3 packende Sätze)",
  "sections": [
    {"heading": "Abschnittstitel", "content": "3-4 Sätze Inhalt"},
    {"heading": "Abschnittstitel", "content": "3-4 Sätze Inhalt"},
    {"heading": "Abschnittstitel", "content": "3-4 Sätze Inhalt"}
  ],
  "keyPoints": ["Kernaussage 1", "Kernaussage 2", "Kernaussage 3"],
  "tags": ["pokémon karten", "tcg", "investment", "weiteres keyword"]
}`;

// Vollwertige Evergreen-Artikel als Fallback — damit jeder Blog-Titel echten Inhalt hat,
// auch ohne ANTHROPIC_API_KEY oder wenn die KI-Generierung scheitert.
function fallbackArticle(type: ArticleType, dateLabel: string, cardSummary: string): Article {
  const meta = ARTICLE_META[type];
  const cardsBlock = cardSummary && cardSummary !== 'Keine aktuellen Daten verfügbar'
    ? cardSummary
    : 'Aktuell stehen mehrere hochbewertete Karten aus den neuesten Scarlet-&-Violet-Sets im Fokus der Sammler.';

  const data: Record<ArticleType, Omit<Article, 'readingTimeMin' | 'generatedAt'>> = {
    markt: {
      title: `Pokémon-Karten Marktanalyse — Trends & Preise (${dateLabel})`,
      intro: 'Der Pokémon-Kartenmarkt bewegt sich ständig. In dieser Analyse schauen wir auf die aktuellen Preistrends und was sie für Sammler und Investoren bedeuten.',
      sections: [
        { heading: 'Aktuelle Marktlage', content: `Die Nachfrage nach seltenen Pokémon-Karten bleibt stabil hoch, besonders bei modernen Special-Illustration- und Hyper-Rare-Karten. Diese Karten:\n${cardsBlock}` },
        { heading: 'Was die Preise treibt', content: 'Knappheit, der Reiz beliebter Pokémon wie Pikachu, Glurak und Mewtu sowie der Zustand (Grading) sind die wichtigsten Preistreiber. Frisch erschienene Sets sind anfangs günstig, gewinnen aber an Wert, sobald die Booster-Produktion ausläuft.' },
        { heading: 'Einschätzung für Investoren', content: 'Wer langfristig denkt, setzt auf gut erhaltene Karten in PSA/CGC-Grading 9–10 von ikonischen Pokémon. Kurzfristige Spekulation auf Hype-Karten ist riskant — Geduld und ein gutes Auge für unterbewertete Klassiker zahlen sich eher aus.' },
      ],
      keyPoints: ['Nachfrage nach Special Illustration Rares bleibt stark', 'Grading erhöht den Wert deutlich', 'Langfristig schlagen Klassiker den Hype'],
      tags: ['pokémon karten', 'marktanalyse', 'investment', 'tcg preise'],
    },
    karte: {
      title: 'Karte im Fokus — Diese Pokémon-Karte lohnt sich genauer anzuschauen',
      intro: 'Jede Woche nehmen wir eine besonders spannende Pokémon-Karte unter die Lupe — von Preisentwicklung über Seltenheit bis zum Investment-Potenzial.',
      sections: [
        { heading: 'Warum diese Karte spannend ist', content: `Karten mit auffälligem Artwork, geringer Auflage und einem beliebten Pokémon ziehen die meiste Aufmerksamkeit auf sich. Im aktuellen Markt fallen besonders auf:\n${cardsBlock}` },
        { heading: 'Preisentwicklung verstehen', content: 'Schau dir immer den 30-Tage- und 90-Tage-Verlauf an, bevor du kaufst. Ein stetiger Aufwärtstrend ist gesünder als ein plötzlicher Hype-Spike, der oft genauso schnell wieder abfällt. Nutze unsere Karten-Suche, um den Verlauf jeder Karte zu prüfen.' },
        { heading: 'Kaufen oder warten?', content: 'Bei einer Karte mit starkem Investment-Score und moderatem Preis lohnt sich oft ein Einstieg. Bei überhitzten Preisen lieber abwarten — der Markt korrigiert sich häufig nach dem ersten Hype.' },
      ],
      keyPoints: ['Artwork + Seltenheit + Beliebtheit = Wert', 'Immer den Preisverlauf prüfen', 'Hype-Spikes mit Vorsicht genießen'],
      tags: ['pokémon karten', 'karte im fokus', 'sammelkarten', 'investment'],
    },
    strategie: {
      title: 'Investment-Strategie für Pokémon-Karten — so baust du eine Sammlung mit Wert auf',
      intro: 'Pokémon-Karten als Investment? Mit der richtigen Strategie kann eine Sammlung über Jahre an Wert gewinnen. Hier sind die wichtigsten Prinzipien.',
      sections: [
        { heading: 'Setze auf Qualität statt Masse', content: 'Wenige hochwertige, gut erhaltene Karten schlagen langfristig hunderte Allerweltskarten. Konzentriere dich auf ikonische Pokémon und limitierte Rares aus den neuesten Sets.' },
        { heading: 'Diversifiziere klug', content: `Mische Klassiker (stabile Wertanlage) mit ausgewählten modernen Karten (Wachstumschance). Aktuell beobachtenswert:\n${cardsBlock}` },
        { heading: 'Grading & Lagerung', content: 'Lasse wertvolle Karten professionell graden (PSA, CGC) und lagere sie in Sleeves und Toploadern, geschützt vor Licht und Feuchtigkeit. Der Zustand entscheidet über einen großen Teil des Werts.' },
      ],
      keyPoints: ['Qualität vor Quantität', 'Klassiker + moderne Rares kombinieren', 'Grading & richtige Lagerung schützen den Wert'],
      tags: ['pokémon karten', 'investment strategie', 'sammeln', 'grading'],
    },
    set: {
      title: 'Set-Analyse — welche Pokémon-TCG-Sets sich für Sammler lohnen',
      intro: 'Nicht jedes Pokémon-Set ist gleich. Wir analysieren, welche aktuellen Sets das beste Verhältnis aus Sammelspaß und Wertpotenzial bieten.',
      sections: [
        { heading: 'Was ein gutes Set ausmacht', content: 'Starke Chase-Karten, attraktive Illustrationen und eine begrenzte Druckdauer machen ein Set wertstabil. Sets mit beliebten Pokémon auf den Top-Karten performen meist besser.' },
        { heading: 'Aktuelle Highlights', content: `Die neuesten Scarlet-&-Violet-Sets liefern starke Special Illustration Rares. Beispiele aus dem aktuellen Markt:\n${cardsBlock}` },
        { heading: 'Versiegelt oder Einzelkarten?', content: 'Versiegelte Booster-Boxen gewinnen nach dem Produktionsende oft deutlich an Wert — ideal für geduldige Investoren. Wer gezielt Wert aufbauen will, kauft hingegen die Top-Einzelkarten in Top-Zustand.' },
      ],
      keyPoints: ['Chase-Karten bestimmen den Set-Wert', 'Versiegelte Boxen sind ein Langzeit-Play', 'Produktionsende treibt die Preise'],
      tags: ['pokémon karten', 'set analyse', 'booster box', 'tcg'],
    },
    ausblick: {
      title: 'Wochenend-Ausblick — was Pokémon-Investoren jetzt beachten sollten',
      intro: 'Das Wochenende ist oft die aktivste Handelszeit. Hier ist dein Ausblick, worauf du bei Käufen und Verkäufen achten solltest.',
      sections: [
        { heading: 'Kaufen', content: `Unterbewertete Karten mit gutem Investment-Score und stabilem Verlauf sind jetzt interessant. Im Blick behalten:\n${cardsBlock}` },
        { heading: 'Verkaufen / Halten', content: 'Karten, die zuletzt einen steilen Hype-Anstieg hatten, sind Kandidaten für Gewinnmitnahmen. Klassiker in Top-Zustand hält man dagegen besser langfristig.' },
        { heading: 'Augen offen halten', content: 'Neue Set-Ankündigungen, Turnier-Ergebnisse und Restock-Wellen beeinflussen die Preise kurzfristig. Wer Nachrichten verfolgt, erkennt Chancen früher.' },
      ],
      keyPoints: ['Unterbewertete Karten mit gutem Score kaufen', 'Nach Hype Gewinne mitnehmen', 'News & Restocks im Blick behalten'],
      tags: ['pokémon karten', 'ausblick', 'kaufen verkaufen', 'investment'],
    },
    guide: {
      title: 'Sammler-Guide — der Einstieg in Pokémon-Karten für Anfänger & Fortgeschrittene',
      intro: 'Ob du gerade erst anfängst oder deine Sammlung professionalisieren willst — dieser Guide gibt dir die wichtigsten Grundlagen an die Hand.',
      sections: [
        { heading: 'Seltenheitsstufen verstehen', content: 'Von Common über Rare Holo bis Special Illustration Rare und Hyper Rare — die Seltenheit steht meist unten auf der Karte und bestimmt maßgeblich den Wert. Je seltener und beliebter, desto wertvoller.' },
        { heading: 'Zustand & Echtheit prüfen', content: 'Achte auf scharfe Ecken, zentriertes Druckbild und makellose Oberfläche. Bei teuren Karten lohnt professionelles Grading. Vorsicht vor Fälschungen — kaufe bei seriösen Händlern und prüfe Hologramm und Schriftbild.' },
        { heading: 'Richtig aufbewahren', content: `Nutze Penny Sleeves, Toploader oder Magnetholder und lagere trocken sowie lichtgeschützt. So bleibt der Wert deiner Karten erhalten. Aktuell gefragte Karten zum Üben:\n${cardsBlock}` },
      ],
      keyPoints: ['Seltenheitsstufen kennen', 'Zustand & Echtheit immer prüfen', 'Sleeves + Toploader schützen den Wert'],
      tags: ['pokémon karten', 'sammler guide', 'anfänger', 'aufbewahrung'],
    },
    rueckblick: {
      title: 'Wochenrückblick — was im Pokémon-Kartenmarkt passiert ist',
      intro: 'Ein Blick zurück auf die vergangene Woche im Pokémon-TCG-Markt — und was wir daraus für die kommende Woche lernen können.',
      sections: [
        { heading: 'Die Highlights der Woche', content: `Im Markt standen erneut hochwertige Rares im Mittelpunkt. Diese Karten waren besonders gefragt:\n${cardsBlock}` },
        { heading: 'Was wir gelernt haben', content: 'Beliebtheit und Seltenheit setzen sich langfristig durch. Kurzfristige Ausschläge gleichen sich oft wieder aus — wer ruhig bleibt und auf Qualität setzt, fährt am besten.' },
        { heading: 'Blick nach vorn', content: 'Behalte kommende Set-Releases und mögliche Restocks im Auge. Nutze ruhige Marktphasen, um gezielt unterbewertete Karten einzusammeln.' },
      ],
      keyPoints: ['Qualität setzt sich durch', 'Ruhe schlägt Hektik', 'Auf kommende Releases vorbereiten'],
      tags: ['pokémon karten', 'wochenrückblick', 'markt', 'tcg'],
    },
  };

  const a = data[type];
  const wordCount = [a.intro, ...a.sections.map((s) => s.content)].join(' ').split(' ').length;
  return {
    ...a,
    title: a.title || meta.label,
    readingTimeMin: Math.max(2, Math.ceil(wordCount / 200)),
    generatedAt: new Date().toISOString(),
  };
}

function buildPrompt(type: ArticleType, cards: string, dateLabel: string): string {
  const base = `Du bist ein Pokémon-TCG-Investment-Experte und schreibst für einen deutschen Blog. Antworte NUR mit validem JSON, kein Text davor oder danach:\n${JSON_SCHEMA}`;

  const contexts: Record<ArticleType, string> = {
    markt: `Schreibe eine Marktanalyse für ${dateLabel}. Analysiere die Trends und gib Investment-Einschätzungen.\n\nAktuelle Karten-Preise:\n${cards}`,
    karte: `Wähle die spannendste Karte aus den aktuellen Daten und analysiere sie tiefgehend für ${dateLabel}.\n\nAktuelle Karten-Preise:\n${cards}`,
    strategie: `Erkläre eine konkrete Investment-Strategie für Pokémon-Karten, relevant für ${dateLabel}.\n\nAktuelle Marktdaten:\n${cards}`,
    set: `Analysiere ein aktuell interessantes Pokémon-TCG-Set basierend auf den Daten vom ${dateLabel}.\n\nAktuelle Karten (mit Set-Info):\n${cards}`,
    ausblick: `Gib einen Ausblick auf das Wochenende — was sollten Investoren kaufen/verkaufen? Stand: ${dateLabel}.\n\nAktuelle Marktdaten:\n${cards}`,
    guide: `Schreibe einen praktischen Sammler-Guide, der für Anfänger und Fortgeschrittene nützlich ist. Stand: ${dateLabel}.\n\nKontext — aktuelle Top-Karten:\n${cards}`,
    rueckblick: `Blicke auf die vergangene Woche zurück und ziehe Lehren für die kommende Woche. Stand: ${dateLabel}.\n\nDiese Woche im Markt:\n${cards}`,
  };

  return `${base}\n\n${contexts[type]}`;
}

export async function generateArticle(type: ArticleType, date: string): Promise<Article> {
  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  let cardSummary = 'Keine aktuellen Daten verfügbar';
  try {
    const cards = await fetchTrendingCards(10);
    cardSummary = cards
      .slice(0, 6)
      .map((c) => `${c.name} (${c.set}): ${(c.prices.market || c.prices.holofoil?.market || 0).toFixed(2)}€, Trend: ${(c.trendPercent || 0).toFixed(1)}%`)
      .join('\n');
  } catch {}

  // Ohne API-Key gar nicht erst die KI ansprechen — direkt vollwertigen Fallback liefern.
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackArticle(type, dateLabel, cardSummary);
  }

  interface ArticleData {
    title: string;
    intro: string;
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

    // Unvollständige KI-Antwort? Dann lieber den vollwertigen Fallback.
    if (!data.title || !data.sections || data.sections.length === 0) {
      return fallbackArticle(type, dateLabel, cardSummary);
    }

    const wordCount = [data.intro, ...(data.sections || []).map((s) => s.content)].join(' ').split(' ').length;
    return {
      title: data.title,
      intro: data.intro || '',
      sections: data.sections || [],
      keyPoints: data.keyPoints || [],
      tags: data.tags || [],
      readingTimeMin: Math.max(1, Math.ceil(wordCount / 200)),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    // KI nicht erreichbar / Fehler → vollwertiger Fallback statt leerer Seite.
    return fallbackArticle(type, dateLabel, cardSummary);
  }
}
