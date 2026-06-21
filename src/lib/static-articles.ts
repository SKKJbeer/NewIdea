import type { Article } from './article-generator';

// Vorgeschriebene Experten-Artikel (Marco-Persona) für die letzten 14 Tage.
// Diese werden immer vor einer KI-Generierung geliefert — garantierter Content.
export const STATIC_ARTICLES: Record<string, Omit<Article, 'generatedAt'>> = {

  // ── 2026-06-08 (Montag) ── Markt ────────────────────────────────────────────
  '2026-06-08': {
    title: 'Pokémon-Markt KW 24: Warum gerade Ruhe im Markt die beste Kaufchance ist',
    intro: 'Wer nur auf grüne Preispfeile wartet, kauft meistens zu spät. Die erste Juniwoche 2026 ist ein perfektes Beispiel: Der Markt ist ruhig, die Preise für Top-SIRs stagnieren — genau deshalb ist jetzt der richtige Zeitpunkt. Ich beobachte dieses Muster seit Jahren.',
    sections: [
      {
        heading: 'Scarlet & Violet-Ära: Das Fundament wird stabiler',
        content: 'Die Preise für Special Illustration Rares aus den SV-Sets haben sich nach dem turbulenten ersten Halbjahr 2025 stabilisiert. Charizard ex SIR (das ist die seltene vollflächige Artwork-Version ohne Hintergrundbox, erkennbar am goldenen Stern) aus dem 151-Set notiert konstant zwischen 120–140 €. Mewtu ex SIR (das legendäre genetische Pokémon mit den violetten Augen) hält sich bei 80–95 €. Stagnation bei High-End-Karten bedeutet nicht Stagnation des Werts — es bedeutet, dass der Markt diese Preise als fair akzeptiert hat. Das ist der Boden vor dem nächsten Anstieg.',
      },
      {
        heading: 'Evolving Skies Alts: Ungebrochen stark nach 5 Jahren',
        content: 'Das Evolving Skies Set (SWSH7, englischer Titel, erschienen 2021 — das Set mit dem violetten Cover und Rayquaza als Hauptpokémon) ist eines der wenigen modernen Sets, das scheinbar gar nicht aufhört zu steigen. Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit den gelben Ringen, das man nachts im Wald finden würde) kostet mittlerweile stabil über 120 €. Rayquaza VMAX Alt Art (der riesige grüne Drache der in der Atmosphäre lebt) über 150 €. Beide sind aus der Produktion — das Angebot schrumpft monatlich. Wer diese Karten noch nicht hat, zahlt morgen mehr als heute.',
      },
      {
        heading: 'Was diese Woche kaufen — klare Empfehlung',
        content: 'Ich schaue gerade besonders auf Karten aus Paldea Evolved (SV2, das zweite Scarlet & Violet-Set, erschienen Mitte 2023). Die SIRs dort sind im Vergleich zu 151 noch moderat bewertet. Besonders Oinkologne ex SIR (das pinke Parfüm-Pokémon, sieht aus wie ein stylischer Poodle) und Arcanine ex SIR (der große Feuerhund, den viele aus dem Videospiel kennen) zeigen erste Preisbewegungen. Wer in solche Karten bei 30–50 € einsteigt, ist in 12–18 Monaten wahrscheinlich im Plus. Wie immer: Nur Near-Mint kaufen, nur auf Cardmarket mit Verkäufern über 98 % Bewertung.',
      },
    ],
    keyPoints: [
      'Ruhige Marktphasen sind Kaufphasen — Preise stagnieren vor dem nächsten Anstieg',
      'Evolving Skies Alts (Umbreon, Rayquaza) steigen weiter — Angebot schrumpft',
      'Paldea Evolved SIRs sind noch moderat bewertet — guter Einstieg',
    ],
    tags: ['pokémon marktanalyse', 'special illustration rare', 'evolving skies', 'paldea evolved'],
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
      },
      {
        heading: 'Preisentwicklung 2021–2026: Lehrbuch für Langzeitinvestoren',
        content: 'Direkt nach Evolving Skies Release (August 2021): ca. 80 €. Crash bei Pack-Flutung: auf 58 € gefallen. Jahresende 2022: Erholung auf 75 €. Ende 2023: erster Ausbruch auf 95 €. 2024: stabile 100–115 €. Heute 2026: 120–140 € je nach Zustand. Das ist +100–140 % in 5 Jahren auf eine Karte die nie aktiv gespielt wurde (Umbreon VMAX war kein Top-Turnierdeck). Reiner Sammlerwert treibt den Preis — das ist das stabilste Investment im TCG.',
      },
      {
        heading: 'Kaufen oder zu teuer?',
        content: 'Bei 120–140 € ist die Karte nicht billig. Aber: Evolving Skies wird nicht mehr gedruckt. Jede Umbreon VMAX Alt Art die existiert, existiert bereits — es kommen keine neuen dazu. Das Angebot auf Cardmarket sinkt. Die Nachfrage steigt, weil der Pokémon-Fankreis global wächst. Meine Meinung: Unter 130 € für ein tadelloses Near-Mint-Exemplar ist das immer noch ein fairer Preis. Über 150 € würde ich warten. Wichtig: Graded-Exemplare (PSA 10 oder BGS 10) kosten 200+ € — wer das Budget hat, zieht selbst die Karte und schickt sie ein.',
      },
    ],
    keyPoints: [
      'Umbreon VMAX Alt Art = emotionaler Sammlerwert + ausgelaufenes Set = Dauerbrenner',
      '+100–140 % in 5 Jahren ohne Turnierspielrelevanz — reiner Collector-Markt',
      'Unter 130 € NM = fairer Einstieg; PSA 10 für 200+ € für ambitionierte Sammler',
    ],
    tags: ['umbreon vmax alt art', 'evolving skies', 'pokemon investment', 'swsh7'],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-10 (Mittwoch) ── Strategie ──────────────────────────────────────
  '2026-06-10': {
    title: 'Sealed vs. Einzelkarten: Die ehrliche Antwort auf die meistgestellte Frage',
    intro: 'Diese Frage kommt in jeder Community täglich: Soll ich sealed Produkte kaufen oder lieber direkt Einzelkarten? Nach 15 Jahren habe ich beide Wege erlebt, beide Fehler gemacht und beide Erfolge gefeiert. Die Antwort ist nicht so eindeutig wie die Influencer behaupten.',
    sections: [
      {
        heading: 'Sealed: Das Gute, das Schlechte, das Missverstandene',
        content: 'Versiegelte Produkte (Elite Trainer Boxen, Boosterboxen, Bundle-Packs) steigen nach Produktionsende verlässlich im Wert. Das ist kein Geheimnis mehr. Eine Evolving Skies Boosterbox kostet heute das Dreifache ihres Release-Preises von 2021. Problem: Du brauchst (a) Lagerplatz, (b) Geduld (2–5 Jahre minimum), (c) die Disziplin, die Box nicht zu öffnen. Sealed ist ideal wenn du langfristig denkst und die Box einfach vergessen kannst. Es ist eine schlechte Wahl wenn du in 6 Monaten verkaufen willst — der Markt braucht Zeit.',
      },
      {
        heading: 'Einzelkarten: Zielgerichteter, effizienter, komplizierter',
        content: 'Wenn du eine bestimmte Karte willst (sagen wir Charizard ex SIR aus dem 151-Set), kannst du sie direkt auf Cardmarket kaufen — für weniger Geld als du statistisch beim Öffnen ausgeben würdest. Du weißt genau was du hast, du kannst den Zustand prüfen, und du sparst das Lagerplatzproblem. Der Nachteil: Du musst Karten einschätzen können. Eine Fake-Karte einzukaufen ist bei Einzelkarten wahrscheinlicher als bei versiegelten Packs von seriösen Händlern. Und der Markt für Einzelkarten reagiert schneller — Preise können sich in Wochen bewegen.',
      },
      {
        heading: 'Mein Portfolio-Rezept: Das Beste aus beiden Welten',
        content: 'Ich empfehle: 70 % Einzelkarten (gezielt, High-End, Near-Mint), 30 % sealed. Die Einzelkarten sind dein aktives Portfolio — du kaufst, beobachtest, verkaufst wenn der Zeitpunkt stimmt. Die sealed Produkte sind dein passives Standbein — du kaufst ein Set das du für stark hältst, lagerst es sicher ein und vergisst es für 3 Jahre. Kombiniert hast du Flexibilität und Stabilität. Und: Eröffne keine Packs um Karten zu ziehen. Das ist Entertainment, kein Investment — die Mathematik verliert du fast immer.',
      },
    ],
    keyPoints: [
      'Sealed = langfristig (3+ Jahre), passiv, Lagerplatz nötig — stabile Wertsteigerung',
      'Einzelkarten = aktiv, zielgerichtet, schnell verkaufbar — höhere Expertise nötig',
      '70 % Einzelkarten / 30 % Sealed ist eine bewährte Kombination',
    ],
    tags: ['pokemon sealed investment', 'pokemon einzelkarten', 'pokemon portfolio strategie', 'boosterbox investment'],
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
      },
      {
        heading: 'Preise und Einschätzung: Wo stehen wir?',
        content: 'Die Top-SIRs aus Paldea Evolved kosten derzeit 25–60 €, deutlich weniger als vergleichbare 151-Karten. Der Grund: Das Set enthält keine ikonischen Generation-1-Pokémon, die sofortige Nostalgie-Reaktionen auslösen. Aber genau das kann sich ändern. Die Paldea-Pokémon gewinnen unter jungen Fans (die mit Karmesin & Purpur aufgewachsen sind) schnell an Beliebtheit. In 3–5 Jahren, wenn diese Generation kaufkräftig ist, können Paldea-Karten einen ähnlichen Nostalgie-Boom erleben wie Generation-1-Karten heute.',
      },
      {
        heading: 'Sealed vs. Einzel — meine Empfehlung für SV2',
        content: 'Bei Paldea Evolved bin ich klar auf Einzelkarten-Seite. Die 3–4 schönsten SIRs direkt kaufen (Oinkologne, Arcanine, Tinkaton ex SIR — das rosa Hammer-Pokémon mit dem überdimensionalen Metallhammer) und für 2–3 Jahre halten. Boosterboxen von Paldea Evolved sind noch günstig, aber das Set hat nicht die Nostalgie-Power von 151 für unmittelbare Preissteigerung. Als Einzelkarten-Einstieg unter 50 € pro Karte: gut. Als sealed-Langzeitinvestment: nur wenn du wirklich viel Geduld hast.',
      },
    ],
    keyPoints: [
      'Paldea Evolved SIRs bei 25–60 € = günstiger Einstieg vor möglichem Nostalgie-Boom',
      'Oinkologne, Arcanine, Tinkaton ex SIR = Top-Artworks des Sets',
      'Einstieg via Einzelkarten besser als Sealed — Nostalgie-Faktor noch nicht aktiv',
    ],
    tags: ['paldea evolved', 'sv2 pokemon', 'scarlet violet investment', 'pokemon set analyse'],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-12 (Freitag) ── Ausblick ────────────────────────────────────────
  '2026-06-12': {
    title: 'Wochenend-Ausblick KW 24: Jetzt kaufen, was andere übersehen',
    intro: 'Es ist Freitag und Cardmarket füllt sich — das Wochenende bringt immer die meisten Transaktionen. Wer strategisch kauft, schaut nicht auf die Top-Seller-Listen (da ist der Hype schon eingepreist), sondern auf die Karten die gerade niemand auf dem Radar hat. Hier ist mein Blick aufs Wochenende.',
    sections: [
      {
        heading: 'Kaufgelegenheiten: Diese Karten sind gerade unterbewertet',
        content: 'Mein Tipp für dieses Wochenende: Schau dir SIRs aus Temporal Forces (SV5, erschienen März 2024 — das Set mit dem Zeitreise-Thema und Raikou/Suicune als Hauptpokémon) an. Die Preise sind nach dem Release-Hype auf ein faires Niveau gefallen und konsolidieren gerade. Walking Wake ex SIR (das violette wasserähnliche legendäre Pokémon, eine Art urzeitliche Suicune-Variante) und Iron Leaves ex SIR (das grüne stachelige Zukunfts-Pokémon, eine futuristische Virizion-Variante) kosten beide unter 50 € und haben starke Artworks. Das könnte sich in 12 Monaten ändern.',
      },
      {
        heading: 'Was du dieses Wochenende meiden solltest',
        content: 'Finger weg von Karten die gerade in Pokemon-Social-Media viral gehen. Wenn ein Influencer eine Karte promoted, ist der Preis bereits hochgegangen — du kaufst dann oben ein und verkaufst unten. Typisches Muster: Karte wird erwähnt, Preis steigt 20–40 % in 48 Stunden, dann Korrektur. Das gleiche gilt für Karten die in einem gerade laufenden Turnier gespielt werden — Spielerwert hält selten länger als 2–3 Wochen an, wenn das Turnier vorbei ist.',
      },
      {
        heading: 'Meine Top-3 für das Wochenende',
        content: '1. Walking Wake ex SIR (Temporal Forces) — unter 45 € kaufenswert. 2. Oinkologne ex SIR (Paldea Evolved) — unter 40 € ein guter Einstieg. 3. Evoli ex SIR (Pokémon 151) — Evoli (das braune süße Basis-Pokémon vor seinen acht Entwicklungen) als SIR ist Pflichtkauf unter 55 €. All diese Karten kaufst du am besten von Cardmarket-Verkäufern mit 99 %+ Bewertung und "Excellent" oder "Near Mint" Zustand. Versand aus Deutschland oder Österreich bevorzugen — schneller und weniger Risiko für Verpackungsschäden.',
      },
    ],
    keyPoints: [
      'Temporal Forces SIRs (Walking Wake, Iron Leaves) unter 50 € = Einstieg lohnt sich',
      'Viral-Karten meiden — Preis ist schon hochgelaufen wenn du es hörst',
      'Nur NM/Excellent auf Cardmarket, Verkäufer mit 99 %+ Bewertung',
    ],
    tags: ['wochenend kauftipps', 'temporal forces', 'pokemon cardmarket', 'pokemon karten kaufen'],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-13 (Samstag) ── Guide ───────────────────────────────────────────
  '2026-06-13': {
    title: 'PSA Grading: Wann es sich lohnt — und wann du Geld verschwendest',
    intro: 'PSA 10 — diese zwei Buchstaben und eine Zahl können den Wert einer Karte verdreifachen. Oder dein Geld verbrennen. Nach 15 Jahren und dutzenden eingesendeten Karten kenne ich beide Enden des Spektrums. Heute gibt es die ungeschönte Wahrheit über Card Grading.',
    sections: [
      {
        heading: 'Was Grading überhaupt ist und was PSA 10 bedeutet',
        content: 'Grading bedeutet: Du schickst deine Karte an ein professionelles Bewertungsunternehmen (PSA ist die bekannteste, alternativ: BGS/Beckett oder CGC), die prüfen Zentrierung, Kanten, Ecken und Oberfläche der Karte unter dem Mikroskop. Das Ergebnis ist eine Note von 1 bis 10, in einer versiegelten Schutzhülle eingeschweißt. PSA 10 (Gem Mint) bedeutet: perfekte Karte, keine sichtbaren Fehler. Solche Exemplare werden separat gehandelt und erzielen deutlich höhere Preise als ungraduierte Karten gleichen Typs.',
      },
      {
        heading: 'Wann Grading sich wirklich lohnt',
        content: 'Grading lohnt sich wenn: (1) Die Karte im Raw-Zustand (ungraduiert) mehr als 80–100 € wert ist. Darunter frisst das Grading-Service-Entgelt (oft 20–50 €) plus Versandkosten den möglichen Mehrwert auf. (2) Du die Karte frisch aus einem Pack gezogen hast und sofort beurteilen konntest ob sie perfekt ist — aus einer versiegelten Quelle statt vom Zweitmarkt. (3) Die Karte ein ikonisches Pokémon auf einem historisch bedeutsamen Artwork zeigt. Charizard, Pikachu Illustrierter (der super seltene alte Promo), Mewtu ex SIR — diese Karten rechtfertigen das Grading.',
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
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-14 (Sonntag) ── Rückblick ───────────────────────────────────────
  '2026-06-14': {
    title: 'Wochenrückblick KW 24: Was diese Woche über Geduld und Strategie lehrte',
    intro: 'KW 24 war keine dramatische Woche im Pokémon-Markt — und das ist eine gute Nachricht. Keine dramatischen Spikes, keine Panikverkäufe, kein überhitzter Hype. Genau solche Wochen zeigen, wer langfristig denkt und wer nur auf Aktion wartet. Mein ehrliches Fazit.',
    sections: [
      {
        heading: 'Was diese Woche bestätigt hat',
        content: 'Die These aus meiner letzten Marktanalyse hat sich gehalten: SIRs aus ausgelaufenen Sets wie Evolving Skies und dem 151-Set zeigen keine Schwäche. Umbreon VMAX Alt Art notiert weiter bei 120–135 €, Charizard ex SIR hält 125–145 €. Das ist kein Raketenanstieg — aber das Ziel ist nicht Raketenanstieg, sondern stabiler Wertzuwachs ohne Schlaflosigkeit. Wer diese Positionen gehalten hat, hat diese Woche wieder etwas gewonnen: Zeit die für sich arbeitet.',
      },
      {
        heading: 'Was mich diese Woche überrascht hat',
        content: 'Interessanterweise haben einige ältere Karten aus der Sun & Moon-Ära (2016–2019) Aufmerksamkeit bekommen. Shining Legends Pikachu (aus dem kleineren Supplementset von 2017, mit dem glänzenden Hintergrund) hat auf Cardmarket neue Höchstpreise von über 200 € für PSA-10-Exemplare erzielt. Das ist ein deutliches Signal: Wenn der Hype um Scarlet & Violet-Karten sich normalisiert, schaut der Markt zurück auf ältere Eras. Wer Sun & Moon Shining Fates oder Hidden Fates noch im Portfolio hat: Halten.',
      },
      {
        heading: 'Mein Plan für die kommende Woche',
        content: 'Diese Woche war eine Woche zum Beobachten, nicht zum Handeln — und das war richtig so. Nächste Woche schaue ich gezielt auf Temporal Forces (SV5) — die Preise dort haben sich genug stabilisiert um als Einstieg interessant zu sein, ohne dass ich den Post-Release-Hype zahle. Ansonsten: Bestehende Positionen halten, keine voreiligen Verkäufe und die Disziplin aufrechterhalten nicht in viral gegangene Karten zu investieren. Ruhe ist im TCG-Markt eine Stärke.',
      },
    ],
    keyPoints: [
      'Ruhige Wochen belohnen Langzeitdenker — Stagnation ist nicht Verlust',
      'Sun & Moon Shining-Karten ziehen an — ältere Eras werden wieder interessant',
      'Temporal Forces SIRs für nächste Woche auf dem Radar',
    ],
    tags: ['pokemon wochenrückblick', 'tcg markt juni', 'evolving skies', 'sun moon shining'],
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
        content: 'Das Pokémon 151-Set (sv3pt5, erschienen September 2023 als Hommage an die Original-151-Pokémon) zeigt diese Woche wieder Stärke. Mehrere Chase-Cards haben neue 30-Tages-Hochs auf Cardmarket erreicht. Besonders der Evoli ex SIR (das braune kleine Basisform-Pokémon vor seinen acht Entwicklungen wie Nachtara oder Blitza) zieht an — offenbar gibt es gerade erhöhte Nachfrage von Sammlern die das Set vervollständigen wollen. Wenn du noch Lücken im 151-Set hast: Jetzt schließen ist günstiger als in drei Monaten.',
      },
      {
        heading: 'Bewegung 2: Neutral — Paradox Rift SIRs seitwärts',
        content: 'Paradox Rift (SV4, November 2023 — das Set mit den Paradox-Pokémon, urzeitliche und futuristische Varianten bekannter Pokémon) zeigt kaum Bewegung. Die SIRs dort (Ancient Roar SIRs und Future Flash SIRs) notieren stabil, weder aufwärts noch abwärts. Das ist eine Konsolidierungsphase. Meine Einschätzung: Paradox Rift hat starke Artworks, aber die Pokémon (Brute Bonnet, Sandy Shocks, Iron Hands etc.) sind für die Mehrheit der Sammler noch unbekannte Generation-9-Neuheiten. Der Nostalgie-Faktor fehlt — noch.',
      },
      {
        heading: 'Bewegung 3: Aufpassen — Hype-Karte ohne Fundament',
        content: 'Eine Karte aus einem brandneuen Promotional-Set hat in den letzten Tagen auf Social Media für Aufsehen gesorgt — der Preis sprang von 30 € auf 75 € in 48 Stunden. Ich nenne den Namen bewusst nicht, weil das genau die Karte ist die du gerade NICHT kaufen solltest. Promotional-Karten ohne festes Set, ohne Druckraten-Information und ohne nachgewiesene Sammler-Basis sind Spekulationsobjekte. Die Hälfte dieser Spikes korrigiert sich innerhalb von zwei Wochen. Warte ab.',
      },
    ],
    keyPoints: [
      '151-Set zieht an — Evoli ex SIR jetzt günstiger kaufen als in 3 Monaten',
      'Paradox Rift konsolidiert — Einstieg möglich aber kein Eile',
      'Promo-Karten-Spikes ignorieren — Hype ohne Fundamentaldaten ist Spekulation',
    ],
    tags: ['pokemon marktanalyse kw25', 'pokemon 151', 'paradox rift', 'tcg investment juni'],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-16 (Dienstag) ── Karte ──────────────────────────────────────────
  '2026-06-16': {
    title: 'Karte unter der Lupe: Charizard ex — warum Glurak nicht aufhört zu steigen',
    intro: 'Es gibt Karten die man kauft, weil sie gerade heiß sind — und dann gibt es Charizard ex. Glurak (das ist der orange Drache den wirklich jeder kennt, auch deine Oma) ist seit 1998 das meistgesuchte Pokémon im TCG überhaupt. Seine Inkarnation im 151-Set hat etwas geschafft, das nicht viele Karten hinbekommen: Sie hat ihren Post-Release-Tiefpunkt durchlaufen und steigt seitdem konstant.',
    sections: [
      {
        heading: 'Was diese Karte so besonders macht',
        content: 'Die Charizard ex Special Illustration Rare aus dem Pokémon 151-Set zeigt Glurak in einem epischen vollflächigen Kunstwerk, das an die klassischen Originalillustrationen der 90er erinnert. Das 151-Set war eine Hommage an die ersten 151 Pokémon — und dieser Charizard ist die Chase-Card des Sets. Die Druckrate lag bei schätzungsweise 1 pro 120 Packs. Zum Vergleich: Du öffnest 10 Boosterboxen (360 Packs) und ziehst statistisch 3 davon — wenn du Glück hast.',
      },
      {
        heading: 'Preisentwicklung: Wo kommen wir her, wo gehen wir hin',
        content: 'Nach Release lag die Karte kurz bei 80–90 € (der typische Post-Hype-Tiefpunkt wenn der Markt mit Neuware überschwemmt wird). Seitdem klettert sie konstant. Der Grund: Das 151-Set wird nicht ewig nachgedruckt. Jede Woche die vergeht, schrumpft das Angebot auf Cardmarket. Gleichzeitig entdecken neue Pokémon-Fans die Karte — die globale Fangemeinde wächst jährlich um Millionen neue Sammler. Historisch haben Charizard-Karten aus ausgelaufenen Sets nie dauerhaft an Wert verloren. Das ist statistisch bemerkenswert.',
      },
      {
        heading: 'Kaufen, halten oder warten?',
        content: 'Meine klare Meinung: Wer diese Karte noch nicht hat und auf Wertzuwachs setzt, sollte jetzt kaufen — nicht warten. Nicht weil ich Preisprognosen verspreche, sondern weil die Fundamentaldaten stimmen: Ikonisches Pokémon, limitiertes Set, starke Fangemeinde, herausragendes Artwork. Einen Kauf unter 150 € für ein Near-Mint-Exemplar würde ich als fairen Einstieg betrachten. Achte auf den Cardmarket-Zustand "Near Mint" und kaufe nur bei Verkäufern mit guter Bewertung. PSA-10-Exemplare kosten 250–350 € — für Langzeitsammler der optimalste Weg.',
      },
    ],
    keyPoints: [
      'Charizard ex SIR (151) — Fundamentaldaten stimmen, kein reiner Hype',
      'Post-Release-Tiefpunkte sind Kaufmöglichkeiten, keine Alarmsignale',
      'Unter 150 € NM = fairer Einstieg; PSA 10 für 250–350 € langfristig optimal',
    ],
    tags: ['charizard ex', 'pokemon 151', 'special illustration rare', 'glurak investment'],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-17 (Mittwoch) ── Strategie ──────────────────────────────────────
  '2026-06-17': {
    title: 'Die 3-Stufen-Strategie: So baust du ein Portfolio das wirklich wächst',
    intro: 'Die meisten Leute machen es falsch: Sie öffnen Packs (macht Spaß, vernichtet Kapital), kaufen was gerade heiß ist (kauft man oben) oder horten hunderte günstige Karten (Masse statt Klasse). Nach 15 Jahren im Markt habe ich gesehen was wirklich funktioniert — und es ist verblüffend einfach. Hier ist die Strategie die ich selbst anwende.',
    sections: [
      {
        heading: 'Stufe 1 — Das Fundament: 1–2 Blue-Chip-Karten',
        content: 'Genau wie im Aktienmarkt gibt es "Blue Chips" — Karten die so ikonisch und so gefragt sind, dass sie fast unmöglich dauerhaft fallen. Das sind Charizard, Pikachu, Mewtu und Evoli-Entwicklungen in ihren Top-Versionen (SIR, Alternate Art, historische Holos). Diese Karten nehmen 60 % deines Budgets ein. Sie sind dein Anker. Du kaufst sie in Near-Mint-Zustand, steckst sie in einen Magnethalter und vergisst sie für 2–3 Jahre. Ich habe nie eine Blue-Chip-Position bereut die ich 3+ Jahre gehalten habe.',
      },
      {
        heading: 'Stufe 2 — Das Wachstum: 2–3 aktuelle SIRs kurz nach Release',
        content: 'Neue Sets haben immer einen Hype-Spike direkt nach Veröffentlichung — dann crashen die Preise wenn der Markt mit frischen Karten geflutet wird. Das ist dein Kaufzeitpunkt: 4–8 Wochen nach Set-Release, wenn die Preise auf ihrem Tiefpunkt sind. Kaufe die 2–3 stärksten SIRs des Sets (erkennbar an beliebten Pokémon und starkem Artwork). Diese 30 % deines Budgets sind dein Wachstumsmotor für die nächsten 12–18 Monate. Kein FOMO bei Release — Geduld zahlt sich hier buchstäblich aus.',
      },
      {
        heading: 'Stufe 3 — Der Wildcard-Slot: Ein sealed Produkt',
        content: 'Die restlichen 10 % stecke in eine versiegelte Boosterbox oder Elite Trainer Box aus einem Set das du spannend findest. Versiegelte Produkte steigen nach Produktionsende fast immer im Wert — manchmal 100–200 % in 3–5 Jahren. Lagere sie in einem kühlen, trockenen Bereich ohne direkte Sonneneinstrahlung (UV-Licht vergilbt das Papier und zerstört den Wert). Das ist kein schnelles Geld, aber ein sehr stabiler Wertzuwachs über Zeit. Und: Es macht Spaß eine Box zu haben die sich jedes Jahr mehr wert ist.',
      },
    ],
    keyPoints: [
      '60 % in Blue-Chip-Karten (Charizard, Pikachu, Mewtu als SIR oder Alternate Art)',
      '30 % in aktuelle SIRs — 4–8 Wochen nach Release kaufen (Tiefpunkt abwarten)',
      '10 % in versiegelte Produkte für langfristigen, stabilen Wertzuwachs',
    ],
    tags: ['pokemon investment strategie', 'pokemon portfolio aufbauen', 'sealed investment', 'special illustration rare'],
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
      },
      {
        heading: 'Die Top-Chase-Cards und ihre Preisbewegung',
        content: 'Die vier wertvollsten Karten des Sets sind Charizard ex SIR (120–145 €), Mewtu ex SIR (80–95 €), Pikachu ex SIR (55–70 €) und Evoli ex SIR (50–65 €). Alle vier haben nach ihrem Post-Release-Tiefpunkt nachhaltig zugelegt. Warum? Das 151-Set wird nicht mehr aktiv gedruckt — das Angebot an frischen Packs schrumpft. Und die globale Nachfrage nach nostalgiebehafteten Pokémon hört nicht auf. Hinzu kommt: Viele Menschen kaufen diese Karten als emotionale Verbindung zur Kindheit, nicht als rationales Investment. Emotional getriebene Nachfrage ist besonders stabil.',
      },
      {
        heading: 'Sealed oder Einzelkarten — was lohnt sich mehr?',
        content: 'Wenn du eine bestimmte Karte willst: kaufe die Einzelkarte direkt auf Cardmarket. Packs öffnen ist statistisch immer teurer als der Direktkauf. Eine Charizard ex SIR einzeln für 130 € kostet weniger als die durchschnittlichen Packs-Kosten um sie zu ziehen (statistisch 15+ Boosterboxen, das sind über 500 €). Wenn du auf Wertzuwachs aus bist und Geduld hast: Eine versiegelte Boosterbox des 151-Sets ist eine solide langfristige Position. Sets mit dieser Nostalgiepower haben historisch immer weiter zugelegt wenn die Produktion endet.',
      },
    ],
    keyPoints: [
      'Alle Original-151 als SIRs — einmalige Nostalgiepower die emotional bindet',
      'Top-4: Charizard, Mewtu, Pikachu, Evoli — alle mit nachhaltigem Preisanstieg',
      'Einzelkarten effizienter als Packs öffnen; sealed nur für Geduldige (3+ Jahre)',
    ],
    tags: ['pokémon 151', 'sv3pt5', 'scarlet violet set analyse', 'charizard ex sir'],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-19 (Freitag) ── Ausblick ────────────────────────────────────────
  '2026-06-19': {
    title: 'Wochenend-Ausblick: Was Sammler & Investoren jetzt wissen sollten',
    intro: 'Das Wochenende ist die aktivste Handelszeit auf Cardmarket — Käufer haben Zeit zum Stöbern, Verkäufer optimieren ihre Preise. Als jemand der seit Jahren jeden Samstag den Markt beobachtet, habe ich gelernt: Kleine Informationsvorteile machen den Unterschied. Hier ist was du dieses Wochenende wissen solltest.',
    sections: [
      {
        heading: 'Kaufen: Diese Karten sind gerade in der Bodenbildungsphase',
        content: 'Schau dir gezielt SIRs von Pokémon an die in den letzten 2–3 Wochen keine großen Preisbewegungen hatten — das sind oft Karten in einer Konsolidierungsphase. Besonders interessant: Alternate-Art-Karten aus Evolving Skies (SWSH7, das 2021er Set mit Drachenpokémon und Eevee-Entwicklungen), die seitdem konstant steigen. Rayquaza VMAX Alt Art (das riesige grüne Atmosphären-Drachen-Pokémon) und Umbreon VMAX Alt Art (das schwarze Nacht-Pokémon mit gelben Ringen) sind Klassiker. Wer sie noch nicht hat, zahlt am Wochenende wahrscheinlich weniger als in zwei Wochen.',
      },
      {
        heading: 'Halten oder verkaufen: Wann du Gewinne mitnehmen solltest',
        content: 'Falls du Karten aus einem Set hast das gerade erst erschienen ist und stark im Preis gestiegen ist: Überlege genau. Die ersten 4–8 Wochen nach einem Set-Release sind die volatilste Phase — danach kommt fast immer eine Korrektur wenn der Markt mit Neuware geflutet wird. Klassiker aus ausgelaufenen Sets hältst du weiter — die brauchen Zeit, kein aktives Management. Eine gute Regel: Verkaufe nie aus Ungeduld, verkaufe nie in Panik. Beide Entscheidungen bereust du statistisch öfter als du denkst.',
      },
      {
        heading: 'Diese Woche im Auge behalten: Signale lesen',
        content: 'Schau auf Cardmarket ob bestimmte Karten weniger Angebote haben als letzte Woche (sinkendes Angebot = Preisanstieg in Sicht). Beobachte ob eine Karte auf mehreren internationalen Plattformen (eBay.com, TCGPlayer USA, Cardmarket) gleichzeitig anzieht — das deutet auf echte globale Nachfrage hin. Turniere am Wochenende können Spieler-Karten kurzfristig verteuern — aber Spieler-Hype hält selten länger als 2–3 Wochen. Gutes Wochenende — und denk dran: Nicht jedes Wochenende musst du kaufen.',
      },
    ],
    keyPoints: [
      'Evolving Skies Alts (Rayquaza, Umbreon) in Bodenbildungsphase — Kaufchance',
      'Verkaufe nie aus Ungeduld oder Panik — beide Entscheidungen bereust du',
      'Sinkende Angebotsmenge auf Cardmarket = nächster Preisanstieg in Sicht',
    ],
    tags: ['wochenend ausblick', 'pokemon kauftipps', 'evolving skies', 'cardmarket strategie'],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-20 (Samstag) ── Guide ───────────────────────────────────────────
  '2026-06-20': {
    title: 'Pokémon-Karten richtig lagern: So erhältst du den Wert über Jahre',
    intro: 'Du hast 200 € in eine Charizard ex SIR investiert — und legst sie dann in eine Schublade wo sie vergilbt, krumm wird und Kratzer bekommt. Ein teurer Fehler den ich in meiner Anfangszeit selbst gemacht habe. Karten richtig zu lagern ist genauso wichtig wie die richtige Karte zu kaufen. Hier ist was wirklich funktioniert.',
    sections: [
      {
        heading: 'Die Basics: Sleeve, Toploader, Magnethalter',
        content: 'Jede wertvolle Karte braucht mindestens zwei Schutzebenen. Ebene 1: Ein perfekter Sleeve (Kartenhülle) aus PE-Plastik ohne Weichmacher — die günstigsten Sleeves enthalten Chemikalien die das Kartenbild langfristig angreifen. Empfehlung: Dragon Shield Perfect Fit (die innere Hülle) als erste Schicht. Ebene 2: Ein Toploader (der starre durchsichtige Plastikhalter) oder Magnethalter (für teure Einzelkarten, Halter mit Magnet-Verschluss). Toploader sind günstiger, Magnethalter professioneller für Display-Zwecke. Eine Karte ohne Sleeve in einen Toploader zu stecken reicht nicht — der Toploader allein schützt nicht vor Kratzern.',
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
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-21 (Sonntag) ── Rückblick ───────────────────────────────────────
  '2026-06-21': {
    title: 'Wochenrückblick KW 25: Starke Woche für Langzeithalter — hier sind die Learnings',
    intro: 'KW 25 ist vorbei und es war eine lehrreiche Woche. Der Markt hat einige interessante Signale gesendet, ein alter Grundsatz hat sich wieder bestätigt, und ich habe eine Kaufentscheidung bereut — nein, das Bereuen nicht, sondern das Warten darauf. Mein ehrliches Fazit.',
    sections: [
      {
        heading: 'Das 151-Set läuft und läuft',
        content: 'Was mich diese Woche beeindruckt hat: Das Pokémon 151-Set (sv3pt5) läuft seit Monaten ohne nennenswerte Korrekturen. Charizard ex SIR, Evoli ex SIR, Mewtu ex SIR — alle auf Jahreshöchstständen oder nahe dran. Das ist ungewöhnlich für ein Set das bereits über 2 Jahre alt ist. Normalerweise sehen wir Korrekturen wenn neue Sets Aufmerksamkeit ablenken. Aber 151 hat offenbar eine so starke nostalgische Basis dass neue Konkurrenz es kaum berührt. Das bestätigt meinen Grundsatz: Emotionale Bindung an Pokémon schlägt rationale Marktbewegung.',
      },
      {
        heading: 'Mein Fehler der Woche: Zu lange gewartet',
        content: 'Ich wollte eine Tinkaton ex SIR (das rosafarbene Pokémon mit dem riesigen Metallhammer aus Paldea Evolved) zu einem bestimmten Preis kaufen. Cardmarket zeigte letzte Woche Angebote bei 42 €. Ich habe auf 38 € gewartet — jetzt notiert die Karte bei 48–52 €. Das klassische "zu günstig warten" Fehler. Es gibt immer einen tieferen Preis irgendwo — aber wenn du eine Karte haben willst zu einem fairen Preis, ist das ein fairer Preis. Nicht warten auf perfekten Einstieg.',
      },
      {
        heading: 'Ausblick: Was mich nächste Woche beschäftigt',
        content: 'Nächste Woche rückt Surging Sparks (SV8, erschienen November 2024 — das Set mit Pikachu als Hauptthema) in meinen Fokus. Die SIRs dort sind nach dem Post-Release-Crash jetzt bei einem interessanten Preisniveau. Pikachu ex SIR aus Surging Sparks kostet gerade weniger als die Version aus dem 151-Set — obwohl beide von ähnlicher Qualität sind. Das könnte eine Unterbewertung sein die sich in 6–12 Monaten korrigiert. Ich schaue mir das genauer an.',
      },
    ],
    keyPoints: [
      '151-Set hält sich auf Jahreshöchstständen — emotionale Bindung ist Investmentfundament',
      'Zu lange auf den "perfekten Preis" warten kostet Geld — fairer Preis ist guter Preis',
      'Surging Sparks SIRs nächste Woche im Fokus — mögliche Unterbewertung',
    ],
    tags: ['wochenrückblick kw25', 'pokemon 151', 'pokemon investment lernen', 'surging sparks'],
    readingTimeMin: 4,
    featuredCards: [],
  },
};
