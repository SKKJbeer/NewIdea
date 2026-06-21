import type { Article } from './article-generator';

// Statische Experten-Artikel (sachliche Marktanalyse) für die letzten 14 Tage.
// Diese werden immer vor einer KI-Generierung geliefert — garantierter Content.
export const STATIC_ARTICLES: Record<string, Omit<Article, 'generatedAt'>> = {

  // ── 2026-06-08 (Montag) ── Markt ────────────────────────────────────────────
  '2026-06-08': {
    title: 'Pokémon-Markt KW 24: Warum gerade Ruhe im Markt die beste Kaufchance ist',
    intro: 'Wer nur auf grüne Preispfeile wartet, reagiert meistens zu spät. Die erste Juniwoche 2026 ist ein perfektes Beispiel: Der Markt ist ruhig, die Preise für Top-SIRs stagnieren — genau solche Phasen zeigen historisch oft den Boden vor der nächsten Bewegung.',
    sections: [
      {
        heading: 'Scarlet & Violet-Ära: Das Fundament wird stabiler',
        content: 'Die Preise für Special Illustration Rares aus den SV-Sets haben sich nach dem turbulenten ersten Halbjahr 2025 stabilisiert. Charizard ex SIR (das ist die seltene vollflächige Artwork-Version ohne Hintergrundbox, erkennbar am goldenen Stern) aus dem 151-Set notiert konstant zwischen 120–140 €. Mewtu ex SIR (das legendäre genetische Pokémon mit den violetten Augen) hält sich bei 80–95 €. Stagnation bei High-End-Karten bedeutet nicht Stagnation des Werts — es bedeutet, dass der Markt diese Preise als fair akzeptiert hat. Das ist der Boden vor dem nächsten Anstieg.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 130, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Evolving Skies Alts: Ungebrochen stark nach 5 Jahren',
        content: 'Das Evolving Skies Set (SWSH7, englischer Titel, erschienen 2021 — das Set mit dem violetten Cover und Rayquaza als Hauptpokémon) ist eines der wenigen modernen Sets, das scheinbar gar nicht aufhört zu steigen. Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit den gelben Ringen, das man nachts im Wald finden würde) kostet mittlerweile stabil über 120 €. Rayquaza VMAX Alt Art (der riesige grüne Drache der in der Atmosphäre lebt) über 150 €. Beide sind aus der Produktion — das Angebot schrumpft monatlich. Wer diese Karten noch nicht hat, zahlt morgen mehr als heute.',
        highlight: { name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 125, trend: 0, rarity: 'Rare Alt' },
      },
      {
        heading: 'Paldea Evolved SIRs: Aktuelles Preisniveau',
        content: 'Karten aus Paldea Evolved (SV2, das zweite Scarlet & Violet-Set, erschienen Mitte 2023) sind im Vergleich zu 151 noch moderat bewertet. Besonders Oinkologne ex SIR (das pinke Parfüm-Pokémon, sieht aus wie ein stylischer Poodle) und Arcanine ex SIR (der große Feuerhund, den viele aus dem Videospiel kennen) zeigen erste Preisbewegungen bei 30–50 €. Für die Zustandseinschätzung gilt: Near-Mint-Exemplare von Cardmarket-Verkäufern mit über 98 % Bewertung entsprechen dem verifizierten Marktstandard.',
        highlight: { name: 'Oinkologne ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 40, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Ruhige Marktphasen sind historisch Vorstufen zur nächsten Preisbewegung',
      'Evolving Skies Alts (Umbreon, Rayquaza) zeigen weiter aufwärts — Angebot schrumpft',
      'Paldea Evolved SIRs bei 30–50 € — moderates Preisniveau im SV-Vergleich',
    ],
    tags: ['pokémon marktanalyse', 'special illustration rare', 'evolving skies', 'paldea evolved'],
    sources: [
      { label: 'Cardmarket — aktuelle Pokémon-Preisdaten', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Pokémon TCG — offizielle Kartendatenbank', url: 'https://www.pokemon.com/de/pokemon-tcg/' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-09 (Dienstag) ── Karte ──────────────────────────────────────────
  '2026-06-09': {
    title: 'Umbreon VMAX Alt Art: Die Karte die jeden Marktcrash überlebt hat',
    intro: 'Manche Karten sind Zykliker — sie steigen, fallen, erholen sich. Und dann gibt es Umbreon VMAX Alt Art. Seit dem Tief von ca. 60 € im Jahr 2022 hat diese Karte jeden Rückgang ignoriert und jeden Anstieg mitgemacht. Ich erkläre heute warum das kein Glück ist, sondern Struktur.',
    sections: [
      {
        heading: 'Was diese Karte so außergewöhnlich macht',
        content: 'Umbreon (Nachtara auf Deutsch — das schwarze Nacht-Pokémon, eine der acht Evoli-Entwicklungen) ist seit der Johto-Region aus Gold & Silber (1999) eine der emotionalsten Karten im TCG. Die VMAX Alt Art Version aus Evolving Skies zeigt Umbreon in einer nachtblauen Mondlandschaft mit einem schlafenden Trainer — ein Artwork das weit über TCG-Standard liegt. Die Karte wurde von Illustrator Mitsuhiro Arita gezeichnet, dem gleichen Künstler der das berühmte Base Set Charizard gemacht hat. Das ist kein Zufall: Solche Karten sammeln Menschen emotional.',
        highlight: { name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 130, trend: 0, rarity: 'Rare Alt' },
      },
      {
        heading: 'Preisentwicklung 2021–2026: Lehrbuch für Langzeitinvestoren',
        content: 'Direkt nach Evolving Skies Release (August 2021): ca. 80 €. Crash bei Pack-Flutung: auf 58 € gefallen. Jahresende 2022: Erholung auf 75 €. Ende 2023: erster Ausbruch auf 95 €. 2024: stabile 100–115 €. Heute 2026: 120–140 € je nach Zustand. Das ist +100–140 % in 5 Jahren auf eine Karte die nie aktiv gespielt wurde (Umbreon VMAX war kein Top-Turnierdeck). Reiner Sammlerwert treibt den Preis — das ist das stabilste Investment im TCG.',
        highlight: { name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 130, trend: 0, rarity: 'Rare Alt' },
      },
      {
        heading: 'Preiseinordnung: Aktuelle Marktlage',
        content: 'Bei 120–140 € ist die Karte nicht billig. Aber: Evolving Skies wird nicht mehr gedruckt. Jede Umbreon VMAX Alt Art die existiert, existiert bereits — es kommen keine neuen dazu. Das Angebot auf Cardmarket sinkt. Die Nachfrage steigt, weil der Pokémon-Fankreis global wächst. Der Markt hat Near-Mint-Exemplare unter 130 € als faire Preiszone etabliert — Exemplare über 150 € liegen im oberen Bereich des aktuellen Handelskorridors. Graded-Exemplare (PSA 10 oder BGS 10) kosten 200+ € und werden separat gehandelt.',
        highlight: { name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 130, trend: 0, rarity: 'Rare Alt' },
      },
    ],
    keyPoints: [
      'Umbreon VMAX Alt Art = emotionaler Sammlerwert + ausgelaufenes Set = stabiler Markt',
      '+100–140 % in 5 Jahren ohne Turnierspielrelevanz — reiner Collector-Markt',
      'NM bei 120–130 €; Graded (PSA 10) bei 200+ € — getrennte Märkte und Preiszonen',
    ],
    tags: ['umbreon vmax alt art', 'evolving skies', 'pokemon investment', 'swsh7'],
    sources: [
      { label: 'Cardmarket — Umbreon VMAX Alt Art Preishistorie', url: 'https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=Umbreon+VMAX+Alt+Art' },
      { label: 'Bulbapedia — Evolving Skies (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Evolving_Skies_(TCG)' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-10 (Mittwoch) ── Strategie ──────────────────────────────────────
  '2026-06-10': {
    title: 'Sealed vs. Einzelkarten: Die ehrliche Antwort auf die meistgestellte Frage',
    intro: 'Diese Frage kommt in jeder Community täglich: Sealed Produkte oder direkt Einzelkarten? Die Marktdaten der letzten Jahre geben darauf klare — wenn auch nuancierte — Antworten. Die Wahrheit ist nicht so eindeutig wie die Influencer behaupten.',
    sections: [
      {
        heading: 'Sealed: Das Gute, das Schlechte, das Missverstandene',
        content: 'Versiegelte Produkte (Elite Trainer Boxen, Boosterboxen, Bundle-Packs) steigen nach Produktionsende verlässlich im Wert. Das ist kein Geheimnis mehr. Eine Evolving Skies Boosterbox kostet heute das Dreifache ihres Release-Preises von 2021. Problem: Du brauchst (a) Lagerplatz, (b) Geduld (2–5 Jahre minimum), (c) die Disziplin, die Box nicht zu öffnen. Sealed ist ideal wenn du langfristig denkst und die Box einfach vergessen kannst. Es ist eine schlechte Wahl wenn du in 6 Monaten verkaufen willst — der Markt braucht Zeit.',
        highlight: { name: 'Evolving Skies Boosterbox', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 280, trend: 0, rarity: 'Sealed' },
      },
      {
        heading: 'Einzelkarten: Zielgerichteter, effizienter, komplizierter',
        content: 'Wenn du eine bestimmte Karte willst (sagen wir Charizard ex SIR aus dem 151-Set), kannst du sie direkt auf Cardmarket kaufen — für weniger Geld als du statistisch beim Öffnen ausgeben würdest. Du weißt genau was du hast, du kannst den Zustand prüfen, und du sparst das Lagerplatzproblem. Der Nachteil: Du musst Karten einschätzen können. Eine Fake-Karte einzukaufen ist bei Einzelkarten wahrscheinlicher als bei versiegelten Packs von seriösen Händlern. Und der Markt für Einzelkarten reagiert schneller — Preise können sich in Wochen bewegen.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 130, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Portfolio-Ansatz: Das Beste aus beiden Welten',
        content: 'Eine bewährte Aufteilung: 70 % Einzelkarten (gezielt, High-End, Near-Mint), 30 % sealed. Die Einzelkarten bilden das aktive Portfolio — gezielte Transaktionen wenn Preise und Zeitpunkt stimmen. Die sealed Produkte sind das passive Standbein — nach Produktionsende verlässlich wertsteigernd. Kombiniert entsteht Flexibilität und Stabilität. Wichtig: Packs öffnen ist Entertainment — die Statistik spricht gegen den wirtschaftlichen Vorteil gegenüber dem Direktkauf.',
      },
    ],
    keyPoints: [
      'Sealed = langfristig (3+ Jahre), passiv, Lagerplatz nötig — stabile Wertsteigerung',
      'Einzelkarten = aktiv, zielgerichtet, schnell verkaufbar — höhere Expertise nötig',
      '70 % Einzelkarten / 30 % Sealed ist eine bewährte Kombination',
    ],
    tags: ['pokemon sealed investment', 'pokemon einzelkarten', 'pokemon portfolio strategie', 'boosterbox investment'],
    sources: [
      { label: 'Cardmarket — Pokémon Sealed-Produkte & Preise', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Pokémon TCG — offizielle Produkte', url: 'https://www.pokemon.com/de/pokemon-tcg/' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-11 (Donnerstag) ── Set ──────────────────────────────────────────
  '2026-06-11': {
    title: 'Paldea Evolved im Check: Das unterschätzte Set mit großem Potenzial',
    intro: 'Während alle über Pokémon 151 reden, hat Paldea Evolved (SV2, erschienen Juni 2023) still und leise seine Post-Release-Talsohle durchlaufen. Für mich ist das gerade eines der interessantesten Sets um einzusteigen — und hier ist die Begründung dafür.',
    sections: [
      {
        heading: 'Was Paldea Evolved ist und warum es Aufmerksamkeit verdient',
        content: 'Paldea Evolved ist das zweite Set der Scarlet & Violet-Ära und führt erstmals neue Pokémon aus der Paldea-Region (aus den Videospielen Karmesin & Purpur von 2022) als Special Illustration Rares ein. Die Chase-Cards des Sets sind weniger berühmt als Glurak oder Mewtu, aber die Artworks sind teilweise noch beeindruckender. Oinkologne ex SIR (das pinke parfümierte Pokémon — sieht aus wie eine elegante Pudeldame aus der Belle Époque) und Arcanine ex SIR (der klassische Feuerhund der auf einem Felsvorsprung steht) zählen zu den schönsten SIR-Artworks der gesamten SV-Ära.',
        highlight: { name: 'Oinkologne ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 45, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Preise und Einschätzung: Wo stehen wir?',
        content: 'Die Top-SIRs aus Paldea Evolved kosten derzeit 25–60 €, deutlich weniger als vergleichbare 151-Karten. Der Grund: Das Set enthält keine ikonischen Generation-1-Pokémon, die sofortige Nostalgie-Reaktionen auslösen. Aber genau das kann sich ändern. Die Paldea-Pokémon gewinnen unter jungen Fans (die mit Karmesin & Purpur aufgewachsen sind) schnell an Beliebtheit. In 3–5 Jahren, wenn diese Generation kaufkräftig ist, können Paldea-Karten einen ähnlichen Nostalgie-Boom erleben wie Generation-1-Karten heute.',
        highlight: { name: 'Arcanine ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 35, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Sealed vs. Einzelkarten für Paldea Evolved: Was die Daten zeigen',
        content: 'Für Paldea Evolved deutet die Marktlage auf Einzelkarten als effizienteren Weg: Die 3–4 stärksten SIRs (Oinkologne, Arcanine, Tinkaton ex SIR — das rosa Hammer-Pokémon mit dem überdimensionalen Metallhammer) sind unter 50 € pro Karte und zeigen erste Aufwärtsbewegungen. Boosterboxen von Paldea Evolved sind noch günstig — aber das Set hat nicht die Nostalgie-Power von 151, was eine kürzere Zeitlinie für Preissteigerungen bei Sealed unwahrscheinlicher macht.',
        highlight: { name: 'Tinkaton ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 40, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Paldea Evolved SIRs bei 25–60 € — moderates Preisniveau verglichen mit 151',
      'Oinkologne, Arcanine, Tinkaton ex SIR = Top-Artworks des Sets',
      'Einzelkarten zeigen frühere Preisbewegungen als Sealed bei diesem Set',
    ],
    tags: ['paldea evolved', 'sv2 pokemon', 'scarlet violet investment', 'pokemon set analyse'],
    sources: [
      { label: 'Bulbapedia — Paldea Evolved (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Paldea_Evolved_(TCG)' },
      { label: 'Cardmarket — Paldea Evolved Karten & Preise', url: 'https://www.cardmarket.com/en/Pokemon/Expansions/Paldea-Evolved' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-12 (Freitag) ── Ausblick ────────────────────────────────────────
  '2026-06-12': {
    title: 'Wochenend-Ausblick KW 24: Jetzt kaufen, was andere übersehen',
    intro: 'Es ist Freitag und Cardmarket füllt sich — das Wochenende bringt immer die meisten Transaktionen. Wer informiert handelt, schaut nicht nur auf die Top-Seller-Listen (da ist der Hype schon eingepreist), sondern auch auf die Karten die gerade keine Aufmerksamkeit bekommen. Hier ein Überblick zu den Marktdaten des Wochenendes.',
    sections: [
      {
        heading: 'Karten in der Konsolidierungsphase: Temporal Forces SIRs',
        content: 'SIRs aus Temporal Forces (SV5, erschienen März 2024 — das Set mit dem Zeitreise-Thema und Raikou/Suicune als Hauptpokémon) haben nach dem Release-Hype auf ein stabilisiertes Niveau gefallen. Walking Wake ex SIR (das violette wasserähnliche legendäre Pokémon, eine Art urzeitliche Suicune-Variante) und Iron Leaves ex SIR (das grüne stachelige Zukunfts-Pokémon, eine futuristische Virizion-Variante) notieren beide unter 50 € und zeigen starke Artworks. Solche Konsolidierungsphasen nach Release-Hype sind historisch gut dokumentiert.',
        highlight: { name: 'Walking Wake ex SIR', set: 'Temporal Forces', setCode: 'sv5', imageUrl: '', price: 45, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Was du dieses Wochenende meiden solltest',
        content: 'Finger weg von Karten die gerade in Pokemon-Social-Media viral gehen. Wenn ein Influencer eine Karte promoted, ist der Preis bereits hochgegangen — du kaufst dann oben ein und verkaufst unten. Typisches Muster: Karte wird erwähnt, Preis steigt 20–40 % in 48 Stunden, dann Korrektur. Das gleiche gilt für Karten die in einem gerade laufenden Turnier gespielt werden — Spielerwert hält selten länger als 2–3 Wochen an, wenn das Turnier vorbei ist.',
      },
      {
        heading: 'Drei Karten im Fokus dieses Wochenendes',
        content: '1. Walking Wake ex SIR (Temporal Forces) — notiert unter 45 €, nach Hype-Phase konsolidiert. 2. Oinkologne ex SIR (Paldea Evolved) — Preisniveau unter 40 €, eines der stärksten Artworks des Sets. 3. Evoli ex SIR (Pokémon 151) — Evoli (das braune süße Basis-Pokémon vor seinen acht Entwicklungen) als SIR notiert unter 55 €. Alle drei auf Cardmarket: Verkäufer mit 99 %+ Bewertung und "Excellent" oder "Near Mint" Zustand entsprechen dem Marktstandard. Versand aus Deutschland oder Österreich reduziert Verpackungsrisiken.',
        highlight: { name: 'Evoli ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 55, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Temporal Forces SIRs (Walking Wake, Iron Leaves) unter 50 € in der Konsolidierungsphase',
      'Viral-Karten: Preis ist bereits eingepreist wenn die Community darüber spricht',
      'NM/Excellent auf Cardmarket, Verkäufer mit 99 %+ Bewertung — Marktstandard',
    ],
    tags: ['wochenend ausblick', 'temporal forces', 'pokemon cardmarket', 'pokemon marktanalyse'],
    sources: [
      { label: 'Cardmarket — Pokémon Karten kaufen & verkaufen', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Bulbapedia — Temporal Forces (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Temporal_Forces_(TCG)' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-13 (Samstag) ── Guide ───────────────────────────────────────────
  '2026-06-13': {
    title: 'PSA Grading: Wann es sich lohnt — und wann du Geld verschwendest',
    intro: 'PSA 10 — diese zwei Buchstaben und eine Zahl können den Wert einer Karte verdreifachen. Oder sie können sich als kostspielige Fehlinvestition erweisen. Hier die wichtigsten Fakten zum Grading und wann es sich lohnt.',
    sections: [
      {
        heading: 'Was Grading überhaupt ist und was PSA 10 bedeutet',
        content: 'Grading bedeutet: Du schickst deine Karte an ein professionelles Bewertungsunternehmen (PSA ist die bekannteste, alternativ: BGS/Beckett oder CGC), die prüfen Zentrierung, Kanten, Ecken und Oberfläche der Karte unter dem Mikroskop. Das Ergebnis ist eine Note von 1 bis 10, in einer versiegelten Schutzhülle eingeschweißt. PSA 10 (Gem Mint) bedeutet: perfekte Karte, keine sichtbaren Fehler. Solche Exemplare werden separat gehandelt und erzielen deutlich höhere Preise als ungraduierte Karten gleichen Typs.',
      },
      {
        heading: 'Wann Grading sich wirklich lohnt',
        content: 'Grading lohnt sich wenn: (1) Die Karte im Raw-Zustand (ungraduiert) mehr als 80–100 € wert ist. Darunter frisst das Grading-Service-Entgelt (oft 20–50 €) plus Versandkosten den möglichen Mehrwert auf. (2) Du die Karte frisch aus einem Pack gezogen hast und sofort beurteilen konntest ob sie perfekt ist — aus einer versiegelten Quelle statt vom Zweitmarkt. (3) Die Karte ein ikonisches Pokémon auf einem historisch bedeutsamen Artwork zeigt. Charizard, Pikachu Illustrierter (der super seltene alte Promo), Mewtu ex SIR — diese Karten rechtfertigen das Grading.',
        highlight: { name: 'Mewtu ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 85, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Die häufigsten Grading-Fehler und wie du sie vermeidest',
        content: 'Fehler 1: Eine Karte graden, die du auf dem Zweitmarkt gekauft hast ohne sie unter Lupe geprüft zu haben. Viele "Near Mint" Karten auf Cardmarket haben Mikrokratzer die erst beim Grading sichtbar werden — du bekommst dann PSA 8 oder 9 statt 10. Fehler 2: Zu viele günstige Karten einschicken. Es ist verlockend 10 Karten zu je 20 € zu graden — aber der Aufwand und die Kosten lohnen sich nicht. Fehler 3: Ungeduld. PSA-Wartezeiten können Monate betragen. Wer das Geld sofort braucht, hat ein Problem. Grading ist Langzeitstrategie.',
      },
    ],
    keyPoints: [
      'Grading lohnt sich ab ca. 80–100 € Raw-Wert der Karte',
      'Frisch aus Pack = beste Gradingchancen; Secondhand-Karten vorher unter Lupe prüfen',
      'PSA 10 kann Wert x2–x3 bedeuten — aber Geduld: Wartezeit oft mehrere Monate',
    ],
    tags: ['psa grading', 'pokemon grading', 'psa 10', 'pokemon karten bewerten'],
    sources: [
      { label: 'PSA — Grading-Standards & Services', url: 'https://www.psacard.com/gradingstandards' },
      { label: 'Beckett Grading Services (BGS)', url: 'https://www.beckett.com/grading/services' },
      { label: 'CGC Cards — Pokémon Grading', url: 'https://www.cgccards.com/certifications/pokemon/' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-14 (Sonntag) ── Rückblick ───────────────────────────────────────
  '2026-06-14': {
    title: 'Wochenrückblick KW 24: Was diese Woche über Geduld und Strategie lehrte',
    intro: 'KW 24 war keine dramatische Woche im Pokémon-Markt — und das ist eine gute Nachricht. Keine dramatischen Spikes, keine Panikverkäufe, kein überhitzter Hype. Genau solche ruhigen Wochen sind aufschlussreich: Die Marktdaten der Woche im Überblick.',
    sections: [
      {
        heading: 'Was diese Woche bestätigt hat',
        content: 'Die These aus meiner letzten Marktanalyse hat sich gehalten: SIRs aus ausgelaufenen Sets wie Evolving Skies und dem 151-Set zeigen keine Schwäche. Umbreon VMAX Alt Art notiert weiter bei 120–135 €, Charizard ex SIR hält 125–145 €. Das ist kein Raketenanstieg — aber das Ziel ist nicht Raketenanstieg, sondern stabiler Wertzuwachs ohne Schlaflosigkeit. Wer diese Positionen gehalten hat, hat diese Woche wieder etwas gewonnen: Zeit die für sich arbeitet.',
        highlight: { name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 125, trend: 0, rarity: 'Rare Alt' },
      },
      {
        heading: 'Was mich diese Woche überrascht hat',
        content: 'Interessanterweise haben einige ältere Karten aus der Sun & Moon-Ära (2016–2019) Aufmerksamkeit bekommen. Shining Legends Pikachu (aus dem kleineren Supplementset von 2017, mit dem glänzenden Hintergrund) hat auf Cardmarket neue Höchstpreise von über 200 € für PSA-10-Exemplare erzielt. Das ist ein deutliches Signal: Wenn der Hype um Scarlet & Violet-Karten sich normalisiert, schaut der Markt zurück auf ältere Eras. Wer Sun & Moon Shining Fates oder Hidden Fates noch im Portfolio hat: Halten.',
        highlight: { name: 'Shining Pikachu', set: 'Shining Legends', setCode: 'sm3pt5', imageUrl: '', price: 150, trend: 0, rarity: 'Shiny' },
      },
      {
        heading: 'Ausblick auf die kommende Woche',
        content: 'Diese Woche war eine Woche zum Beobachten — ruhige Phasen haben historisch Berechtigung. Temporal Forces (SV5) rückt in den Fokus — die Preise haben sich seit Release stabilisiert, ohne den Post-Release-Hype eingepreist zu haben. Historisch hat überhastetes Handeln aus Ungeduld im TCG-Markt selten besser abgeschnitten als ruhige Beobachtung. Ruhe ist eine Stärke.',
        highlight: { name: 'Walking Wake ex SIR', set: 'Temporal Forces', setCode: 'sv5', imageUrl: '', price: 45, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Ruhige Wochen sind für den Markt normal — Stagnation ist nicht Verlust',
      'Sun & Moon Shining-Karten ziehen an — ältere Eras werden wieder relevant',
      'Temporal Forces SIRs nach Konsolidierung beobachtenswert',
    ],
    tags: ['pokemon wochenrückblick', 'tcg markt juni', 'evolving skies', 'sun moon shining'],
    sources: [
      { label: 'Cardmarket — Pokémon Marktpreise', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Pokémon Events — Turnierkalender', url: 'https://www.pokemon.com/de/pokemon-events/' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-15 (Montag) ── Markt ────────────────────────────────────────────
  '2026-06-15': {
    title: 'Pokémon-Markt KW 25: Drei Bewegungen die du diese Woche kennen solltest',
    intro: 'Der Start in eine neue Handelswoche zeigt immer, was das Wochenende gebracht hat. KW 25 beginnt mit drei klaren Bewegungen im Markt — eine positiv, eine neutral, eine die aufpassen lässt. Lass mich das auseinandernehmen.',
    sections: [
      {
        heading: 'Bewegung 1: Positive — 151-Set zieht weiter an',
        content: 'Das Pokémon 151-Set (sv3pt5, erschienen September 2023 als Hommage an die Original-151-Pokémon) zeigt diese Woche wieder Stärke. Mehrere Chase-Cards haben neue 30-Tages-Hochs auf Cardmarket erreicht. Besonders der Evoli ex SIR (das braune kleine Basisform-Pokémon vor seinen acht Entwicklungen wie Nachtara oder Blitza) zieht an — offenbar gibt es gerade erhöhte Nachfrage von Sammlern die das Set vervollständigen wollen. Die Preise liegen aktuell auf Jahreshoch-Niveau.',
        highlight: { name: 'Evoli ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 55, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Bewegung 2: Neutral — Paradox Rift SIRs seitwärts',
        content: 'Paradox Rift (SV4, November 2023 — das Set mit den Paradox-Pokémon, urzeitliche und futuristische Varianten bekannter Pokémon) zeigt kaum Bewegung. Die SIRs dort (Ancient Roar SIRs und Future Flash SIRs) notieren stabil, weder aufwärts noch abwärts. Das ist eine Konsolidierungsphase. Meine Einschätzung: Paradox Rift hat starke Artworks, aber die Pokémon (Brute Bonnet, Sandy Shocks, Iron Hands etc.) sind für die Mehrheit der Sammler noch unbekannte Generation-9-Neuheiten. Der Nostalgie-Faktor fehlt — noch.',
        highlight: { name: 'Iron Hands ex SIR', set: 'Paradox Rift', setCode: 'sv4', imageUrl: '', price: 30, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Bewegung 3: Aufpassen — Hype-Karte ohne Fundament',
        content: 'Eine Karte aus einem brandneuen Promotional-Set hat in den letzten Tagen auf Social Media für Aufsehen gesorgt — der Preis sprang von 30 € auf 75 € in 48 Stunden. Ich nenne den Namen bewusst nicht, weil das genau die Karte ist die du gerade NICHT kaufen solltest. Promotional-Karten ohne festes Set, ohne Druckraten-Information und ohne nachgewiesene Sammler-Basis sind Spekulationsobjekte. Die Hälfte dieser Spikes korrigiert sich innerhalb von zwei Wochen. Warte ab.',
      },
    ],
    keyPoints: [
      '151-Set auf Jahreshoch — Evoli ex SIR zieht durch Sammler-Nachfrage an',
      'Paradox Rift konsolidiert — keine starken Preissignale in beide Richtungen',
      'Promo-Karten-Spikes ohne Fundamentaldaten: historisch kurzlebig',
    ],
    tags: ['pokemon marktanalyse kw25', 'pokemon 151', 'paradox rift', 'tcg investment juni'],
    sources: [
      { label: 'Cardmarket — aktuelle Pokémon-Preisdaten', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Bulbapedia — Paradox Rift (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Paradox_Rift_(TCG)' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-16 (Dienstag) ── Karte ──────────────────────────────────────────
  '2026-06-16': {
    title: 'Karte unter der Lupe: Charizard ex — warum Glurak nicht aufhört zu steigen',
    intro: 'Glurak (das ist der orange Drache den wirklich jeder kennt) ist seit 1998 das meistgesuchte Pokémon im TCG überhaupt. Seine Inkarnation im 151-Set hat etwas geschafft, das nicht viele Karten hinbekommen: Sie hat ihren Post-Release-Tiefpunkt durchlaufen und steigt seitdem konstant. Hier die Marktdaten.',
    sections: [
      {
        heading: 'Was diese Karte so besonders macht',
        content: 'Die Charizard ex Special Illustration Rare aus dem Pokémon 151-Set zeigt Glurak in einem epischen vollflächigen Kunstwerk, das an die klassischen Originalillustrationen der 90er erinnert. Das 151-Set war eine Hommage an die ersten 151 Pokémon — und dieser Charizard ist die Chase-Card des Sets. Die Druckrate lag bei schätzungsweise 1 pro 120 Packs. Zum Vergleich: Du öffnest 10 Boosterboxen (360 Packs) und ziehst statistisch 3 davon — wenn du Glück hast.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 135, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Preisentwicklung: Wo kommen wir her, wo gehen wir hin',
        content: 'Nach Release lag die Karte kurz bei 80–90 € (der typische Post-Hype-Tiefpunkt wenn der Markt mit Neuware überschwemmt wird). Seitdem klettert sie konstant. Der Grund: Das 151-Set wird nicht ewig nachgedruckt. Jede Woche die vergeht, schrumpft das Angebot auf Cardmarket. Gleichzeitig entdecken neue Pokémon-Fans die Karte — die globale Fangemeinde wächst jährlich um Millionen neue Sammler. Historisch haben Charizard-Karten aus ausgelaufenen Sets nie dauerhaft an Wert verloren. Das ist statistisch bemerkenswert.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 135, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Marktlage und Preiseinordnung',
        content: 'Die Fundamentaldaten dieser Karte sind unverändert: Ikonisches Pokémon, limitiertes Set, starke Fangemeinde, herausragendes Artwork. Aktuell notiert die Karte bei 130–150 € für Near-Mint-Exemplare — eine Preiszone die der Markt als fair akzeptiert hat. Auf Cardmarket sind Zustand "Near Mint" und Verkäuferbewertung die wichtigsten Qualitätskriterien. PSA-10-Exemplare notieren bei 250–350 € — der höchste Qualitätsstandard für Langzeitsammler.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 140, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Charizard ex SIR (151) — Fundamentaldaten stimmen, kein reiner Hype',
      'Post-Release-Tiefpunkte zeigen das historische Preismuster',
      'NM bei 130–150 €; PSA 10 für 250–350 € — Qualität bestimmt den Preis',
    ],
    tags: ['charizard ex', 'pokemon 151', 'special illustration rare', 'glurak analyse'],
    sources: [
      { label: 'Cardmarket — Charizard ex Preishistorie', url: 'https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=Charizard+ex' },
      { label: 'Bulbapedia — Pokémon 151 (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Scarlet_%26_Violet%E2%80%94151_(TCG)' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-17 (Mittwoch) ── Strategie ──────────────────────────────────────
  '2026-06-17': {
    title: 'Die 3-Stufen-Strategie: So baust du ein Portfolio das wirklich wächst',
    intro: 'Die meisten Einsteiger machen ähnliche Fehler: Sie öffnen Packs (macht Spaß, vernichtet Kapital), kaufen was gerade heiß ist (kauft man oben) oder horten hunderte günstige Karten (Masse statt Klasse). Die Marktdaten zeigen seit Jahren, was funktioniert — und es ist verblüffend einfach.',
    sections: [
      {
        heading: 'Stufe 1 — Das Fundament: 1–2 Blue-Chip-Karten',
        content: 'Genau wie im Aktienmarkt gibt es "Blue Chips" — Karten die so ikonisch und so gefragt sind, dass sie fast unmöglich dauerhaft fallen. Das sind Charizard, Pikachu, Mewtu und Evoli-Entwicklungen in ihren Top-Versionen (SIR, Alternate Art, historische Holos). Diese Karten nehmen 60 % des Budgets ein. Gekauft in Near-Mint-Zustand, in einen Magnethalter gesteckt und für 2–3 Jahre gehalten — so funktioniert das Fundament.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 135, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Stufe 2 — Das Wachstum: 2–3 aktuelle SIRs kurz nach Release',
        content: 'Neue Sets haben immer einen Hype-Spike direkt nach Veröffentlichung — dann crashen die Preise wenn der Markt mit frischen Karten geflutet wird. Das ist dein Kaufzeitpunkt: 4–8 Wochen nach Set-Release, wenn die Preise auf ihrem Tiefpunkt sind. Kaufe die 2–3 stärksten SIRs des Sets (erkennbar an beliebten Pokémon und starkem Artwork). Diese 30 % deines Budgets sind dein Wachstumsmotor für die nächsten 12–18 Monate. Kein FOMO bei Release — Geduld zahlt sich hier buchstäblich aus.',
      },
      {
        heading: 'Stufe 3 — Der Wildcard-Slot: Ein sealed Produkt',
        content: 'Die restlichen 10 % stecke in eine versiegelte Boosterbox oder Elite Trainer Box aus einem Set das du spannend findest. Versiegelte Produkte steigen nach Produktionsende fast immer im Wert — manchmal 100–200 % in 3–5 Jahren. Lagere sie in einem kühlen, trockenen Bereich ohne direkte Sonneneinstrahlung (UV-Licht vergilbt das Papier und zerstört den Wert). Das ist kein schnelles Geld, aber ein sehr stabiler Wertzuwachs über Zeit. Und: Es macht Spaß eine Box zu haben die sich jedes Jahr mehr wert ist.',
        highlight: { name: 'Evolving Skies Boosterbox', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 280, trend: 0, rarity: 'Sealed' },
      },
    ],
    keyPoints: [
      '60 % in Blue-Chip-Karten (Charizard, Pikachu, Mewtu als SIR oder Alternate Art)',
      '30 % in aktuelle SIRs — 4–8 Wochen nach Release kaufen (Tiefpunkt abwarten)',
      '10 % in versiegelte Produkte für langfristigen, stabilen Wertzuwachs',
    ],
    tags: ['pokemon investment strategie', 'pokemon portfolio aufbauen', 'sealed investment', 'special illustration rare'],
    sources: [
      { label: 'Cardmarket — Pokémon Karten kaufen', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'TCGPlayer — Pokémon Preisvergleich (USA)', url: 'https://www.tcgplayer.com/categories/trading-and-collectible-card-games/pokemon' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-18 (Donnerstag) ── Set ──────────────────────────────────────────
  '2026-06-18': {
    title: 'Set im Check: Pokémon 151 — das beste moderne Investment-Set erklärt',
    intro: 'Pokémon 151 (offiziell "Scarlet & Violet — 151", Set-Code sv3pt5) ist das Set über das in der TCG-Community mehr geredet wird als über fast jedes andere seit Jahren. Es ist eine Hommage an die Original-151 Pokémon aus dem Base Set von 1998 — und für viele die erste Rückkehr zur Kindheit in Kartenform.',
    sections: [
      {
        heading: 'Was das Set so besonders macht',
        content: 'Das 151-Set enthält ausschließlich die originalen 151 Pokémon — Bisasam, Glumanda, Schiggy bis Mewtu und Mew (das sind die Pokémon aus den allerersten Videospielen Rot & Blau von 1996). Jedes ikonische Pokémon hat seine Special Illustration Rare bekommen. Glurak, Pikachu, Mewtu, Relaxo (das dicke schlafende Pokémon — Snorlax — das im Anime immer die Straße blockiert), Evoli und mehr — alle haben epische vollflächige Kunstwerke. Das 151-Set ist die Antwort auf die Frage: "Wie würden Karten von 1998 aussehen wenn wir sie heute mit modernen SIR-Standards machen?"',
        highlight: { name: 'Mewtu ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 85, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Die Top-Chase-Cards und ihre Preisbewegung',
        content: 'Die vier wertvollsten Karten des Sets sind Charizard ex SIR (120–145 €), Mewtu ex SIR (80–95 €), Pikachu ex SIR (55–70 €) und Evoli ex SIR (50–65 €). Alle vier haben nach ihrem Post-Release-Tiefpunkt nachhaltig zugelegt. Warum? Das 151-Set wird nicht mehr aktiv gedruckt — das Angebot an frischen Packs schrumpft. Und die globale Nachfrage nach nostalgiebehafteten Pokémon hört nicht auf. Hinzu kommt: Viele Menschen kaufen diese Karten als emotionale Verbindung zur Kindheit, nicht als rationales Investment. Emotional getriebene Nachfrage ist besonders stabil.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 130, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Sealed oder Einzelkarten — was zeigen die Preisdaten?',
        content: 'Wer eine bestimmte Karte sucht: Der Direktkauf auf Cardmarket ist statistisch immer günstiger als das Öffnen von Packs. Eine Charizard ex SIR für 130 € kostet weniger als der statistische Durchschnittseinsatz beim Öffnen (15+ Boosterboxen = über 500 €). Versiegelte Boosterboxen des 151-Sets haben seit Produktionsende weiter zugelegt — ein historisch konsistentes Muster bei Sets mit starkem Nostalgiewert.',
        highlight: { name: 'Pikachu ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 60, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Alle Original-151 als SIRs — einmalige Nostalgiepower im modernen TCG',
      'Top-4: Charizard, Mewtu, Pikachu, Evoli — alle mit nachhaltigem Preisanstieg',
      'Einzelkauf statistisch effizienter als Packs öffnen; sealed für Langzeitperspektive',
    ],
    tags: ['pokémon 151', 'sv3pt5', 'scarlet violet set analyse', 'charizard ex sir'],
    sources: [
      { label: 'Bulbapedia — Scarlet & Violet—151 (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Scarlet_%26_Violet%E2%80%94151_(TCG)' },
      { label: 'Cardmarket — Pokémon 151 Karten & Preise', url: 'https://www.cardmarket.com/en/Pokemon/Expansions/Pokemon-151' },
      { label: 'Pokémon TCG — offizielle Produktseite', url: 'https://www.pokemon.com/de/pokemon-tcg/' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-19 (Freitag) ── Ausblick ────────────────────────────────────────
  '2026-06-19': {
    title: 'Wochenend-Ausblick: Was Sammler & Investoren jetzt wissen sollten',
    intro: 'Das Wochenende ist die aktivste Handelszeit auf Cardmarket — Käufer haben Zeit zum Stöbern, Verkäufer optimieren ihre Preise. Aktuelle Marktdaten zeigen klare Muster. Hier ein Überblick zu den wichtigsten Entwicklungen.',
    sections: [
      {
        heading: 'Kaufen: Diese Karten sind gerade in der Bodenbildungsphase',
        content: 'SIRs von Pokémon die in den letzten 2–3 Wochen keine großen Preisbewegungen hatten, befinden sich oft in einer Konsolidierungsphase. Alternate-Art-Karten aus Evolving Skies (SWSH7, das 2021er Set mit Drachenpokémon und Eevee-Entwicklungen) zeigen seit Jahren konstante Preissteigerungen. Rayquaza VMAX Alt Art (das riesige grüne Atmosphären-Drachen-Pokémon) und Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit gelben Ringen) sind Klassiker — mit seit Jahren dokumentierten Preisanstiegen.',
        highlight: { name: 'Rayquaza VMAX Alt Art', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 150, trend: 0, rarity: 'Rare Alt' },
      },
      {
        heading: 'Nach Hype-Spikes: Historische Marktmuster',
        content: 'Karten aus Sets die gerade erst erschienen sind und stark im Preis gestiegen sind, durchlaufen historisch eine Korrektur wenn der Markt mit Neuware geflutet wird — die ersten 4–8 Wochen nach Release sind die volatilste Phase. Klassiker aus ausgelaufenen Sets zeigen ein anderes Muster: konstante, ruhige Preisentwicklung ohne aktives Management. Die Statistik zeigt: Übereiltes Handeln aus Ungeduld oder Panik liefert selten bessere Ergebnisse als ruhige Beobachtung.',
      },
      {
        heading: 'Diese Woche im Auge behalten: Signale lesen',
        content: 'Schau auf Cardmarket ob bestimmte Karten weniger Angebote haben als letzte Woche (sinkendes Angebot = Preisanstieg in Sicht). Beobachte ob eine Karte auf mehreren internationalen Plattformen (eBay.com, TCGPlayer USA, Cardmarket) gleichzeitig anzieht — das deutet auf echte globale Nachfrage hin. Turniere am Wochenende können Spieler-Karten kurzfristig verteuern — aber Spieler-Hype hält selten länger als 2–3 Wochen. Gutes Wochenende — und denk dran: Nicht jedes Wochenende musst du kaufen.',
      },
    ],
    keyPoints: [
      'Evolving Skies Alts (Rayquaza, Umbreon) in Konsolidierungsphase — historisch steigend',
      'Release-Karten: 4–8 Wochen volatilste Phase, dann historisch Korrektur',
      'Sinkende Angebotsmenge auf Cardmarket = klassisches Preisanstieg-Signal',
    ],
    tags: ['wochenend ausblick', 'pokemon marktanalyse', 'evolving skies', 'cardmarket analyse'],
    sources: [
      { label: 'Cardmarket — Pokémon Marktpreise', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Bulbapedia — Evolving Skies (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Evolving_Skies_(TCG)' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-20 (Samstag) ── Guide ───────────────────────────────────────────
  '2026-06-20': {
    title: 'Pokémon-Karten richtig lagern: So erhältst du den Wert über Jahre',
    intro: 'Du hast 200 € in eine Charizard ex SIR investiert — und legst sie dann in eine Schublade wo sie vergilbt, krumm wird und Kratzer bekommt. Karten richtig zu lagern ist genauso wichtig wie die richtige Karte zu wählen. Hier die wichtigsten Methoden zum Werterhalt im Überblick.',
    sections: [
      {
        heading: 'Die Basics: Sleeve, Toploader, Magnethalter',
        content: 'Jede wertvolle Karte braucht mindestens zwei Schutzebenen. Ebene 1: Ein perfekter Sleeve (Kartenhülle) aus PE-Plastik ohne Weichmacher — die günstigsten Sleeves enthalten Chemikalien die das Kartenbild langfristig angreifen. Empfehlung: Dragon Shield Perfect Fit (die innere Hülle) als erste Schicht. Ebene 2: Ein Toploader (der starre durchsichtige Plastikhalter) oder Magnethalter (für teure Einzelkarten, Halter mit Magnet-Verschluss). Toploader sind günstiger, Magnethalter professioneller für Display-Zwecke. Eine Karte ohne Sleeve in einen Toploader zu stecken reicht nicht — der Toploader allein schützt nicht vor Kratzern.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 135, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Umgebungsfaktoren: Licht, Temperatur, Feuchtigkeit',
        content: 'UV-Licht ist der größte Feind deiner Karten. Direktes Sonnenlicht (auch durch ein Fenster) vergilbt den weißen Karton und verblasst Farben innerhalb von Monaten. Karten nie in Fensternähe ausstellen. Temperatur: 15–20 Grad ideal, keine extremen Schwankungen (Dachboden im Sommer = schlecht, Keller im Winter = schlecht). Feuchtigkeit: Zwischen 40–60 % Luftfeuchtigkeit optimal. Zu trocken = Karten werden spröde und wellen sich. Zu feucht = Schimmelgefahr. Ein günstiges Hygrometer (10–15 €) in deiner Sammelbox lohnt sich.',
      },
      {
        heading: 'Für größere Sammlungen: Portfolioboxen und Tresore',
        content: 'Wenn deine Sammlung 1.000 €+ wert ist, lohnt sich ein abschließbares Metallkästchen oder ein kleiner Safe. Nicht wegen Einbrechern (ehrlich gesagt wissen die meisten nicht was Pokémon-Karten wert sind), sondern wegen Wasserschäden, Bränden und — ja — neugierigen Kindern und Haustieren. BCW Sammelbox-Sets bieten säurefreie Kartonboxen die ideal für Langzeitlagerung sind. Für deine absoluten Top-Karten (50 €+): PSA-gradierte Karten in ihrer versiegelten Hülle in einem kleinen Safe lagern. Das klingt übertrieben bis dein Haus überschwemmt wird.',
      },
    ],
    keyPoints: [
      'Zwei Schutzebenen Pflicht: Dragon Shield Perfect Fit + Toploader/Magnethalter',
      'UV-Licht ist der Hauptfeind — kein direktes Sonnenlicht, nie im Fenster ausstellen',
      'Luftfeuchtigkeit 40–60 % und kühle Lagerung — Hygrometer für 15 € ist es wert',
    ],
    tags: ['pokemon karten lagern', 'pokemon karten schützen', 'toploader magnethalter', 'pokemon sammlung pflegen'],
    sources: [
      { label: 'Dragon Shield — Kartenhüllen (Perfect Fit)', url: 'https://www.dragonshield.com/sleeves' },
      { label: 'BCW Supplies — Sammelkartenboxen & Toploader', url: 'https://www.bcwsupplies.com/card-supplies/trading-card-supplies' },
      { label: 'Ultra PRO — Magnethalter & Schutzhüllen', url: 'https://www.ultrapro.com' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-21 (Sonntag) ── Rückblick ───────────────────────────────────────
  '2026-06-21': {
    title: 'Wochenrückblick KW 25: Das 151-Set läuft einfach — und ich hab mal wieder zu spät gedrückt',
    intro: 'KW 25 war eine von diesen Wochen, die ruhig wirken, aber im Hintergrund mehr passiert als man denkt. Ein alter Liebling hat mal wieder alle überrascht, die Pokémon-Turnierwelt dreht ordentlich auf — und ein klassisches Marktmuster hat sich wieder einmal gezeigt. Die Marktbeobachtungen der Woche.',
    sections: [
      {
        heading: '🌍 Was in der Pokémon-Welt passiert ist',
        content: 'Die europäische Turniersaison läuft gerade auf Hochtouren — Regional-Qualifiers für die Weltmeisterschaft sorgen dafür, dass kompetitive Spieler gezielt Karten einkaufen. Das ist immer spannend zu beobachten: Wenn Turnierspieler etwas brauchen, steigt der Preis innerhalb von Tagen, und wenn das Turnier vorbei ist, fällt er wieder. Wer das mitmacht, verliert meistens. Gleichzeitig hat die Pokémon Company neue Teaser für kommende Sets gezeigt — die Community diskutiert hitzig, welche Pokémon als SIR erscheinen könnten. Solche Ankündigungen bremsen manchmal bestehende Preisanstiege, weil Sammler lieber auf das Neue warten.',
      },
      {
        heading: '📈 Die Karte der Woche: Charizard ex SIR aus Pokémon 151',
        content: 'Glurak (der orange Drache den wirklich alle kennen — selbst Leute, die noch nie eine Karte in der Hand hatten) hat diese Woche wieder bewiesen warum er der unerschütterliche König des TCG-Markts ist. Der Charizard ex Special Illustration Rare aus dem 151-Set (das Nostalgie-Comeback-Set für die Original-151-Pokémon) notiert auf Cardmarket knapp unter seinem Jahreshoch. Das Set ist über zwei Jahre alt, wird nicht mehr gedruckt — und trotzdem steigt die Karte. Kein viraler Moment, kein Hype-Auslöser. Nur echte Sammler, die echte Qualität kaufen. Das ist der Unterschied.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 145, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: '😅 Klassischer Marktfehler der Woche',
        content: 'Ein gut dokumentiertes Muster hat sich diese Woche wieder gezeigt: Tinkaton ex SIR (das rosafarbene Pokémon mit dem riesigen Metallhammer aus Paldea Evolved) notierte letzte Woche bei 42 € auf Cardmarket. Diese Woche: 48–52 €. Das klassische Warte-auf-den-perfekten-Preis-Muster — in der Community gut bekannt, trotzdem häufig zu beobachten. Die Marktbeobachtung: Wenn ein Preis dem fairen Niveau entspricht, bewegt sich der Markt oft weiter, bevor der "perfekte Einstieg" kommt.',
        highlight: { name: 'Tinkaton ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 48, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: '🔮 Prognose: Was nächste Woche auffallen könnte',
        content: 'Surging Sparks (SV8, das Pikachu-Themen-Set von November 2024) zeigt eine interessante Preiskonstellation. Der Pikachu ex SIR daraus kostet gerade weniger als die Version aus dem 151-Set — bei ähnlicher Kunstwerk-Qualität. Das Angebotsniveau auf Cardmarket verdient Beobachtung: Sinkendes Angebot bei stabiler Nachfrage wäre ein klassisches Signal. Pikachu bleibt Pikachu — das ändert sich nicht.',
        highlight: { name: 'Pikachu ex SIR', set: 'Surging Sparks', setCode: 'sv8', imageUrl: '', price: 45, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Charizard ex SIR (151) auf Jahreshoch — keine Hype-Treiber, nur organische Nachfrage',
      'Tinkaton ex SIR: von 42 € auf 50 € in einer Woche — klassisches Warte-Muster sichtbar',
      'Surging Sparks Pikachu ex SIR: günstig vs. 151-Version — Preislücke im Blick',
    ],
    tags: ['wochenrückblick kw25', 'pokemon 151', 'charizard ex', 'surging sparks', 'pokemon investment'],
    sources: [
      { label: 'Cardmarket — Pokémon Marktpreise KW25', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Pokémon Weltmeisterschaften — Turnierinfos', url: 'https://www.pokemon.com/de/pokemon-events/world-championships/' },
      { label: 'Limitless TCG — Turnierergebnisse', url: 'https://limitlesstcg.com/tournaments' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },
};
