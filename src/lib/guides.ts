export interface GuideSection {
  heading: string;
  content: string;
  tip?: string;
  cards?: Array<{ name: string; rarity: string; why: string; imageUrl?: string; setId?: string }>;
}

export interface Guide {
  slug: string;
  title: string;
  metaDescription: string;
  emoji: string;
  badge: string;
  color: string;
  headerGradient: string;
  readingTimeMin: number;
  intro: string;
  sections: GuideSection[];
  keyPoints: string[];
  tags: string[];
}

// PFLICHT-REGELN (CLAUDE.md → Content-Wahrheitspflicht + Content-Tonalität):
// - KEINE Kaufempfehlungen, keine Renditeversprechen, keine Budget-Ratschläge
// - KEINE Preiszahlen im Fließtext (veralten sofort), keine erfundenen Druckraten/Events
// - Guides erklären Marktmechanik und Praxis — sie geben keine Anlageberatung
export const GUIDES: Guide[] = [
  {
    slug: 'pokemon-karten-investment-starter-guide',
    title: 'Pokémon-Karten als Sammlermarkt: Wie Wert entsteht — der Einsteiger-Guide',
    metaDescription: 'Wie entsteht der Wert von Pokémon-Karten? Dieser Guide erklärt die Marktmechanik — von Angebot und Nachfrage bis zu den Faktoren, die Preise bestimmen.',
    emoji: '🚀',
    badge: 'Marktwissen',
    color: 'violet',
    headerGradient: 'from-violet-800 to-indigo-900',
    readingTimeMin: 6,
    intro: 'Pokémon-Karten aus den frühen Jahren des TCG, die damals wenige Euro kosteten, erzielen heute je nach Zustand ein Vielfaches davon auf Cardmarket und eBay — ein dokumentiertes Muster, das sich bei Karten beliebter Pokémon aus ausgelaufenen Sets immer wieder zeigt. Aber nicht jede Karte steigt im Wert — die meisten tun es nicht. Dieser Guide erklärt die Marktmechanik dahinter, damit du den Markt selbst einschätzen kannst. Er ist eine Wissensgrundlage, keine Anlageberatung.',
    sections: [
      {
        heading: '🤔 Warum steigen manche Pokémon-Karten im Wert?',
        content: 'Das Prinzip ist simpel: Angebot und Nachfrage. Pokémon-Karten werden in begrenzten Mengen gedruckt — sobald die Produktion eines Sets endet, gibt es keine neuen mehr. Gleichzeitig gehen Karten durch Nutzung, Verlust und schlechte Lagerung kaputt. Das Angebot schrumpft also konstant, während die Nachfrage durch eine wachsende Nostalgie-Community und neue Fans stabil bleibt oder steigt. Das Ergebnis bei gefragten Karten: Preise, die sich über Jahre nach oben bewegen — besonders bei gut erhaltenen Exemplaren. Bei weniger gefragten Karten passiert dagegen: nichts.',
        tip: '💡 Merke dir: Karten in Topzustand (PSA 9–10) erzielen ein Vielfaches gegenüber der gleichen Karte in schlechtem Zustand. Zustand ist König.',
      },
      {
        heading: '🎯 Was macht eine Karte wertvoll?',
        content: 'Es gibt genau drei Faktoren, die zusammenkommen müssen: Beliebtheit des Pokémon (Charizard, Pikachu, Mewtu und Evoli-Entwicklungen zeigen historisch die stabilste Nachfrage), Seltenheit der Karte (Special Illustration Rares und Hyper Rares sind die seltensten modernen Karten) und der Zustand. Karten in Near-Mint-Qualität erzielen auf Cardmarket ein Vielfaches gegenüber der gleichen Karte mit sichtbaren Kratzern — der Zustandsunterschied kann mehr als die Hälfte des Werts ausmachen. Aktuelle Preise immer direkt auf Cardmarket prüfen.',
        cards: [
          { name: 'Charizard ex (151 Set)', rarity: 'Special Illustration Rare', why: 'Ikonisches Pokémon + höchste Seltenheitsstufe = historisch dauerhaft gefragt', imageUrl: 'https://images.pokemontcg.io/sv3pt5/201.png', setId: 'sv3pt5' },
          { name: 'Pikachu ex (151 Set)', rarity: 'Special Illustration Rare', why: 'Das Maskottchen der Serie — global bekannteste Pokémon-Figur', imageUrl: 'https://images.pokemontcg.io/sv3pt5/205.png', setId: 'sv3pt5' },
          { name: 'Umbreon VMAX', rarity: 'Alternate Art', why: 'Fanfavorit Evoli-Entwicklung + auffälliges Artwork = Kultstatus in der Community', imageUrl: 'https://images.pokemontcg.io/swsh7/215.png', setId: 'swsh7' },
        ],
      },
      {
        heading: '💰 Einzelkarten vs. Boosterpacks: Was die Statistik zeigt',
        content: 'Boosterpacks öffnen ist Unterhaltung — statistisch liegt der erwartete Kartenwert eines Packs unter seinem Kaufpreis. Wer eine bestimmte Karte sucht, findet im gezielten Einzelkauf den effizienteren Weg: Der Zustand ist vorab prüfbar, der Preis vergleichbar, und das Zufallselement entfällt. Beim Einzelkauf zählen zwei Dinge: der Zustand (Near Mint als Standard für werthaltige Karten) und die Verkäuferbewertung auf der Plattform. Aktuelle Marktpreise lassen sich über die Preissuche dieser Seite und direkt auf Cardmarket vergleichen.',
        tip: '🔍 Beobachtung aus den Marktdaten: Direkt nach einem Set-Release sind die Preise am volatilsten — historisch bildet sich ein belastbares Preisniveau erst einige Wochen später.',
      },
      {
        heading: '📋 Drei Prinzipien erfahrener Sammler',
        content: 'Prinzip 1 — Sammeln, was gefällt: Wer Karten besitzt, die ihm unabhängig vom Preis Freude machen, ist gegen Marktschwankungen emotional abgesichert. Prinzip 2 — Streuung statt Konzentration: Sammlungen, die auf einer einzigen Karte basieren, hängen vollständig an deren Einzelschicksal. Prinzip 3 — Lange Zeithorizonte: Die dokumentierten Wertzuwächse im TCG-Markt haben sich über Jahre entwickelt, nicht über Wochen — kurzfristiges Handeln kostet durch Gebühren und Preisspannen. Wichtig: Vergangene Entwicklungen sind keine Garantie für zukünftige.',
      },
    ],
    keyPoints: [
      'Wert entsteht aus Beliebtheit + Seltenheit + Zustand — alle drei müssen zusammenkommen',
      'Zustand ist entscheidend — Near Mint erzielt ein Vielfaches, Sleeves von Anfang an',
      'Einzelkauf ist statistisch effizienter als Packs öffnen — Packs sind Unterhaltung',
      'Dokumentierte Wertzuwächse entstanden über Jahre — keine Garantie für die Zukunft',
    ],
    tags: ['pokemon sammlermarkt', 'pokemon karten wert', 'starter guide', 'tcg marktwissen'],
  },

  {
    slug: 'seltenheitsstufen-pokemon-karten-erklaert',
    title: 'Pokémon Karten Seltenheitsstufen — von Common bis Hyper Rare erklärt',
    metaDescription: 'Was bedeuten die Symbole auf Pokémon Karten? Dieser Guide erklärt alle Seltenheitsstufen — und welche davon im Sammlermarkt eine Rolle spielen.',
    emoji: '💎',
    badge: 'Guide',
    color: 'blue',
    headerGradient: 'from-blue-800 to-blue-950',
    readingTimeMin: 5,
    intro: 'Hast du dich jemals gefragt, was das kleine Symbol unten rechts auf deiner Pokémon-Karte bedeutet? Kreis, Raute, Stern — das ist kein Zufall. Das ist der Schlüssel zum Verständnis, wie selten eine Karte wirklich ist. Dieser Guide erklärt das System von Grund auf — und welche Stufen im Sammlermarkt eine Rolle spielen.',
    sections: [
      {
        heading: '⚪ Common, Uncommon & Rare — das Fundament',
        content: 'Commons (Kreis ●) sind die häufigsten Karten — du findest sie in jedem Pack. Uncommons (Raute ◆) sind etwas seltener, aber immer noch überall verfügbar. Rares (Stern ★) tauchen in jedem Boosterpack mindestens einmal auf, aber nur eine Variante davon. Diese Stufen erzielen auf Cardmarket typischerweise nur geringe Beträge — sie sind perfekt zum Spielen und Sammeln aus Freude, spielen im Wertmarkt aber kaum eine Rolle.',
        tip: '📌 Faustregel: Die Seltenheitsstufe steht klein unten auf der Karte — bei modernen Karten auch als ausgeschriebener Text (z.B. "Special Illustration Rare").',
      },
      {
        heading: '⭐ Rare Holo, Ultra Rare & EX/V-Karten',
        content: 'Hier wird es interessanter. Rare Holos glänzen und schimmern — erkennbar am Glitzer-Hintergrund des Artworks. Ultra Rares sind die klassischen Full-Art-Karten; EX, GX, V und VMAX-Karten fallen in diese Kategorie. Ihre Marktpreise variieren stark je nach Pokémon und Set — aktuelle Werte auf Cardmarket prüfen. Diese Karten bilden das Rückgrat vieler Sammlungen, und bei sehr beliebten Pokémon zeigen sie historisch die deutlichsten Wertbewegungen.',
        cards: [
          { name: 'Charizard V (Celebrations)', rarity: 'Ultra Rare', why: 'Jubiläums-Set + ikonisches Design — in der Community dauerhaft gefragt', imageUrl: 'https://images.pokemontcg.io/cel25/4.png', setId: 'cel25' },
          { name: 'Pikachu VMAX Rainbow (Vivid Voltage)', rarity: 'Ultra Rare Rainbow', why: 'Rainbow Rares sind eine eigene Kategorie mit treuer Fanbasis', imageUrl: 'https://images.pokemontcg.io/swsh4/188.png', setId: 'swsh4' },
        ],
      },
      {
        heading: '✨ Special Illustration Rare (SIR) — das Gold des modernen TCG',
        content: 'Seit Scarlet & Violet (2023) sind Special Illustration Rares (erkennbar an der Aufschrift "Special Illustration Rare" auf der Karte selbst) die begehrtesten modernen Karten. Sie zeigen das Pokémon in einem vollflächigen, künstlerischen Illustrationsstil ohne Textbox-Hintergrund und gehören zu den seltensten Karten ihrer Sets. Im modernen Sammlermarkt stehen SIRs im Zentrum der Nachfrage — ihre Marktpreise reichen je nach Pokémon von moderat bis hoch, aktuelle Werte auf Cardmarket prüfen.',
        tip: '🔥 Marktbeobachtung: SIRs von Charizard, Pikachu, Mewtu und Evoli-Entwicklungen zählen konstant zu den wertvollsten Karten neuer Sets.',
      },
      {
        heading: '👑 Hyper Rare & Gold-Karten — das absolute Rarste',
        content: 'Hyper Rares (früher "Secret Rares") sind die Karten über der normalen Setnummer hinaus — du erkennst sie an einer Nummer wie "200/198". Gold-Karten mit Trainer-Items oder Energie in Gold-Ausführung fallen ebenfalls hierher. Sie sind noch seltener zu ziehen als SIRs — im Markt notieren sie dennoch oft unter vergleichbaren SIRs, weil pro Set mehr verschiedene Hyper Rares existieren und die Sammlernachfrage sich stärker auf die SIR-Artworks konzentriert.',
        cards: [
          { name: 'Pokéball (Gold, 151 Set)', rarity: 'Hyper Rare', why: 'Gold-Trainer-Karten haben eine eigene treue Fanbasis bei Completionists', imageUrl: 'https://images.pokemontcg.io/sv3pt5/207.png', setId: 'sv3pt5' },
          { name: 'Mewtu ex (151 Set)', rarity: 'Special Illustration Rare', why: 'Legendäres Pokémon + limitierte SIR — konstant hohe Sammlernachfrage', imageUrl: 'https://images.pokemontcg.io/sv3pt5/204.png', setId: 'sv3pt5' },
        ],
      },
    ],
    keyPoints: [
      'SIRs (Special Illustration Rares) stehen im Zentrum des modernen Sammlermarkts',
      'Common, Uncommon, Rare — perfekt zum Spielen, kaum Rolle im Wertmarkt',
      'Pokémon-Beliebtheit ist wichtiger als die reine Seltenheitsstufe',
      'Setnummer über der Gesamtzahl (z.B. 200/198) = Secret/Hyper Rare',
    ],
    tags: ['pokemon seltenheit', 'rare karten', 'pokemon symbole', 'special illustration rare'],
  },

  {
    slug: 'pokemon-karten-lagern-und-schuetzen',
    title: 'Pokémon Karten richtig lagern & schützen — der komplette Schutz-Guide',
    metaDescription: 'So lagerst du Pokémon Karten richtig: Sleeves, Toploader, Binder und mehr. Vermeide die häufigsten Fehler, die deinen Karten-Wert zerstören.',
    emoji: '🛡️',
    badge: 'Lagerung',
    color: 'emerald',
    headerGradient: 'from-emerald-800 to-green-950',
    readingTimeMin: 5,
    intro: 'Eine Chase-Card frisch aus dem Pack, perfekter Zustand — und sechs Monate später: ein Kratzer auf der Oberfläche, eine leicht gebogene Ecke, ein Großteil des Werts dahin. Das ist kein Märchen, das passiert ständig. Der häufigste Fehler von Sammlern ist nicht der falsche Kauf, sondern die falsche Lagerung. Dieser Guide zeigt, wie Karten ihren Zustand über Jahre behalten.',
    sections: [
      {
        heading: '🧤 Sleeve direkt beim Öffnen — ohne Ausnahme',
        content: 'Regel Nummer 1: Jede Karte, die aus einem Pack kommt, geht sofort in einen Sleeve. Sleeves (auch "Hüllen") schützen vor Kratzern durch andere Karten, Fingerabdrücken und leichten Biegungen. Für normale Karten reichen günstige Penny Sleeves. Für werthaltige Karten gilt der Community-Standard "double sleeved": erst ein enger Perfect-Fit-Sleeve, dann ein normaler Sleeve darüber.',
        tip: '🎯 Community-Standard: KMC Perfect Fit + Dragon Shield als Outer Sleeve gilt unter Sammlern als Goldstandard.',
      },
      {
        heading: '💪 Toploader & Magnethalter für wertvolle Karten',
        content: 'Sleeves allein reichen für werthaltige Karten nicht — sie können sich trotzdem biegen. Die nächste Schutzstufe ist der Toploader: eine harte, durchsichtige Plastikhülle, in die die gesleevte Karte gesteckt wird. Für die Top-Karten einer Sammlung gibt es Magnethalter (auch "Magnet Cases") — stabile, zweiseitige Hartplastik-Halter mit Magnetverschluss, die die Karte einrahmen. Sie schützen optimal und eignen sich auch fürs Display.',
        tip: '⚠️ Vorsicht: Stecke Karten nie ohne Sleeve direkt in einen Toploader — die Kanten des Toploaders können Schäden anrichten.',
      },
      {
        heading: '📖 Binder für die Sammlung — richtig oder falsch?',
        content: 'Für den Großteil einer Sammlung sind Binder mit Folientaschen perfekt — ordentlich sortiert und jederzeit zugänglich. Achte auf Side-Loading-Binder (Karten fallen nicht heraus) und Folientaschen ohne PVC (PVC kann Karten über Zeit beschädigen). Für die wertvollsten Karten gilt jedoch: nicht in den Binder. Der Reibungskontakt beim Ein- und Ausschieben hinterlässt über Monate feine Kratzer — genau die Mikrodefekte, die später beim Grading die Bestnote kosten.',
        cards: [
          { name: 'Charizard ex (Paldea Evolved)', rarity: 'Ultra Rare', why: 'Typischer Binder-Kandidat — schöne Karte für die sortierte Sammlung', imageUrl: 'https://images.pokemontcg.io/sv2/228.png', setId: 'sv2' },
          { name: 'Charizard ex SIR (151)', rarity: 'Special Illustration Rare', why: 'Chase-Cards gehören NICHT in den Binder — Toploader oder Magnethalter', imageUrl: 'https://images.pokemontcg.io/sv3pt5/201.png', setId: 'sv3pt5' },
        ],
      },
      {
        heading: '🌡️ Die versteckten Feinde: Licht, Feuchtigkeit & Hitze',
        content: 'UV-Licht bleicht Karten aus — wer seine Sammlung im Sonnenlicht ausstellt, riskiert nach Jahren verblasste Farben. Lagere Karten immer dunkel oder hinter UV-Schutzglas. Feuchtigkeit lässt Karten wellen und schimmeln — ideal sind 45–55 % relative Luftfeuchtigkeit. Im Sommer oder in Kellern kann ein Silicagel-Entfeuchter in der Sammelbox helfen. Dauerhafte Hitze (z.B. Dachboden im Sommer) kann Sleeves und Karten verformen.',
        tip: '🌡️ Praxis-Tipp: Wertvolle Karten in verschlossenen Plastikboxen mit Silicagel-Päckchen lagern — schützt vor Feuchtigkeit und Staub.',
      },
    ],
    keyPoints: [
      'Sofort nach dem Öffnen in Sleeve — keine Ausnahmen',
      'Werthaltige Karten in Toploader oder Magnethalter, nicht nur in Sleeves',
      'Kein direktes Sonnenlicht, 45–55 % Luftfeuchtigkeit, keine Hitze',
      'Binder nur für die breite Sammlung — Chase-Cards nicht einschieben',
    ],
    tags: ['pokemon karten lagern', 'sleeve toploader', 'pokemon karten schützen', 'sammlung pflegen'],
  },

  {
    slug: 'psa-grading-pokemon-karten-lohnt-sich',
    title: 'PSA Grading erklärt — wie professionelle Kartenbewertung funktioniert',
    metaDescription: 'PSA, CGC, BGS — professionelles Grading für Pokémon Karten erklärt: Ablauf, Grade-Skala, Kostenfaktoren und die häufigsten Fehler.',
    emoji: '🏆',
    badge: 'Grading',
    color: 'amber',
    headerGradient: 'from-amber-700 to-orange-900',
    readingTimeMin: 7,
    intro: 'Gegradete Exemplare ikonischer Karten — allen voran der Base-Set-Charizard — haben auf Auktionen wiederholt Rekordsummen erzielt, ein Vielfaches des Werts ungegradeter Exemplare. Auch bei normalen Karten werden PSA-10-Exemplare auf einem eigenen Markt deutlich über dem Raw-Wert gehandelt. Was steckt dahinter, wie läuft es ab, und welche Fehler kosten Geld? Alles in diesem Guide.',
    sections: [
      {
        heading: '🔬 Was ist Grading überhaupt?',
        content: 'Grading bedeutet: Ein professioneller Gutachter (bei Firmen wie PSA, CGC oder Beckett/BGS) schaut sich deine Karte genau unter der Lupe an — buchstäblich. Er prüft Ecken, Kanten, Oberfläche und Zentrierung. Das Ergebnis ist ein numerischer Grade von 1 (stark beschädigt) bis 10 (Gem Mint — perfekt). Die Karte wird in einen versiegelten Hartplastik-Slab eingeschlossen. Der Grade steht dann dauerhaft fest und ist öffentlich verifizierbar. Käufer weltweit vertrauen diesen Bewertungen.',
        tip: '📊 Die drei großen Grading-Firmen: PSA (Professional Sports Authenticator) — die bekannteste mit dem größten Markt. CGC (Certified Guaranty Company) — wachsend, oft kürzere Wartezeiten. BGS/Beckett — bekannt für sehr strenge Bewertungen.',
      },
      {
        heading: '📏 Die Grade-Skala erklärt (1–10)',
        content: 'Grade 10 "Gem Mint" — praktisch perfekte Karte, scharf zentriert, keine Fehler erkennbar. Grade 9 "Mint" — minimale Unvollkommenheiten, die man nur bei genauer Betrachtung sieht. Grade 8 "Near Mint-Mint" — leichte Abnutzung sichtbar, aber optisch noch sehr ansprechend. Grade 7 und darunter — sichtbare Gebrauchsspuren, im Sammlermarkt deutlich weniger gefragt. Wichtig: Der Unterschied zwischen PSA 9 und PSA 10 ist mit bloßem Auge oft nicht sichtbar — im Marktpreis aber erheblich.',
        cards: [
          { name: 'Charizard (Base Set)', rarity: 'Holo Rare', why: 'Der Grading-Klassiker — PSA-10-Exemplare werden auf einem eigenen Markt gehandelt', imageUrl: 'https://images.pokemontcg.io/base1/4.png', setId: 'base1' },
          { name: 'Charizard ex SIR (151)', rarity: 'Special Illustration Rare', why: 'Modernes Grading-Ziel — hohe Nachfrage nach PSA-10-Exemplaren', imageUrl: 'https://images.pokemontcg.io/sv3pt5/201.png', setId: 'sv3pt5' },
        ],
        tip: '🔍 Zentrierung prüfen: Halte die Karte schräg ins Licht und schau, ob der weiße Rand auf allen vier Seiten gleich breit ist. Ungleichmäßige Zentrierung ist der häufigste Grund, warum es kein PSA 10 wird.',
      },
      {
        heading: '💶 Die Kostenrechnung: Welche Faktoren zählen',
        content: 'Grading kostet Service-Gebühren (je nach Anbieter und Service-Level unterschiedlich — aktuelle Preise auf den Websites von PSA, CGC und Beckett), plus Versand und ggf. Zoll für den Weg Deutschland → USA. Diese Fixkosten fallen pro Karte an — unabhängig vom Ergebnis. Daraus folgt die Marktlogik: Je niedriger der Raw-Wert einer Karte, desto größer der Anteil, den die Grading-Kosten auffressen. Und: Ein erhoffter Grade ist nie garantiert — viele "Near Mint"-Karten vom Zweitmarkt haben Mikrokratzer, die erst der Gutachter sieht, und kommen als PSA 8 zurück.',
        tip: '⚡ Hinweis: CGC bietet oft günstigere Einstiegsoptionen — für Karten im mittleren Wertbereich in der Community eine viel genutzte Alternative zu PSA.',
      },
      {
        heading: '📦 So bereitest du eine Karte fürs Grading vor',
        content: 'Schritt 1: Karte direkt nach dem Öffnen double sleeved lagern — nie mit bloßen Händen anfassen. Schritt 2: Unter guter Beleuchtung die Zentrierung prüfen und auf Kratzer, Weißkanten und Oberflächen-Dellen untersuchen. Schritt 3: Nur wirklich vielversprechende Karten einsenden — die Fixkosten fallen pro Karte an, unabhängig vom Ergebnis. Schritt 4: Online-Konto beim Grading-Anbieter anlegen, Karte einsenden, Wartezeit einplanen (je nach Service-Level Wochen bis Monate). Schritt 5: Den Slab nach Erhalt direkt auf der Website des Anbieters auf Echtheit verifizieren.',
      },
    ],
    keyPoints: [
      'PSA-10-Exemplare werden auf einem eigenen Markt deutlich über dem Raw-Wert gehandelt',
      'Grading-Fixkosten fallen pro Karte an — bei niedrigem Raw-Wert fressen sie den Mehrwert auf',
      'Zentrierung und Oberflächenzustand sind die wichtigsten Grade-Faktoren',
      'Ein erhoffter Grade ist nie garantiert — Zweitmarkt-Karten vorher unter Lupe prüfen',
    ],
    tags: ['psa grading', 'pokemon karten graden', 'psa 10', 'cgc pokemon', 'grading erklärt'],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
