export interface GuideSection {
  heading: string;
  content: string;
  tip?: string;
  cards?: Array<{ name: string; rarity: string; why: string; imageUrl?: string }>;
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

export const GUIDES: Guide[] = [
  {
    slug: 'pokemon-karten-investment-starter-guide',
    title: 'Pokémon Karten als Investment: Dein kompletter Starter-Guide',
    metaDescription: 'Lohnt sich der Kauf von Pokémon Karten als Investment wirklich? Dieser Guide erklärt alles — von den ersten Schritten bis zur richtigen Strategie.',
    emoji: '🚀',
    badge: 'Investment',
    color: 'violet',
    headerGradient: 'from-violet-800 to-indigo-900',
    readingTimeMin: 6,
    intro: 'Stell dir vor, du hättest 2003 für 5 € eine Charizard-Karte aus dem Base-Set gekauft. Heute würde sie — in gutem Zustand — über 1.000 € wert sein. Kein schlechtes Geschäft, oder? Pokémon-Karten sind heute mehr als nur Nostalgie: Sie sind eine ernsthafte Anlageklasse mit nachgewiesenem Wertzuwachs. Aber nicht jede Karte steigt im Wert. Dieser Guide zeigt dir, wie du die richtigen Karten findest.',
    sections: [
      {
        heading: '🤔 Warum steigen Pokémon-Karten im Wert?',
        content: 'Das Prinzip ist simpel: Angebot und Nachfrage. Pokémon-Karten werden in begrenzten Mengen gedruckt — sobald die Produktion eines Sets endet, gibt es keine neuen mehr. Gleichzeitig gehen Karten durch Nutzung, Verlust und schlechte Lagerung kaputt. Das Angebot schrumpft also konstant, während die Nachfrage durch eine wachsende Nostalgie-Community und neue Fans stabil bleibt oder steigt. Das Ergebnis: Preise, die sich über die Jahre nach oben bewegen — besonders bei gut erhaltenen Exemplaren seltener Karten.',
        tip: '💡 Merke dir: Karten in Topzustand (PSA 9–10) sind oft 3–10× so viel wert wie die gleiche Karte in schlechtem Zustand. Zustand ist König.',
      },
      {
        heading: '🎯 Was macht eine Karte wertvoll?',
        content: 'Es gibt genau drei Faktoren, die zusammenkommen müssen: Beliebtheit des Pokémon (Charizard, Pikachu, Mewtu und Eevee schlagen alles andere), Seltenheit der Karte (Special Illustration Rares und Hyper Rares sind die wertvollsten modernen Karten) und natürlich der Zustand. Ein Charizard ex Special Illustration Rare in perfektem Zustand kann über 300 € erzielen — dieselbe Karte mit einem Kratzer vielleicht nur 80 €.',
        cards: [
          { name: 'Charizard ex (151 Set)', rarity: 'Special Illustration Rare', why: 'Ikonisches Pokémon + höchste Seltenheitsstufe = dauerhaft gefragt', imageUrl: 'https://images.pokemontcg.io/sv3pt5/201.png' },
          { name: 'Pikachu ex (151 Set)', rarity: 'Special Illustration Rare', why: 'Das Maskottchen der Serie — wird nie an Beliebtheit verlieren', imageUrl: 'https://images.pokemontcg.io/sv3pt5/205.png' },
          { name: 'Umbreon VMAX', rarity: 'Alternate Art', why: 'Fansavorit Eevee-Evo + atemberaubendes Artwork = Kultstatus', imageUrl: 'https://images.pokemontcg.io/swsh7/215.png' },
        ],
      },
      {
        heading: '💰 Dein erstes Investment: So startest du richtig',
        content: 'Fang nicht damit an, Boosterpacks zu öffnen — das ist für die Unterhaltung, nicht fürs Investment. Kaufe gezielte Einzelkarten. Mit 50–100 € kannst du 2–3 qualitativ hochwertige Karten aus aktuellen Sets kaufen, die langfristiges Potenzial haben. Wichtig: Kaufe immer in NM (Near Mint) oder besser. Prüfe Cardmarket-Bewertungen des Verkäufers und vergleiche den aktuellen Marktpreis auf unserer Preissuche.',
        tip: '🛒 Profi-Tipp: Kauf kurz nach einem Set-Release — da sind die Preise oft noch günstig. Halte die Karte mindestens 1–2 Jahre. Die meisten Set-Karten erreichen ihren Höhepunkt 6–18 Monate nach Produktionsende.',
      },
      {
        heading: '📋 Die 3 goldenen Regeln',
        content: 'Regel 1 — Kaufe nur was du wirklich magst: Falls der Wert fallen sollte, hast du immer noch eine Karte, die dir gefällt. Regel 2 — Nie alles auf eine Karte setzen: Verteile dein Budget auf 3–5 verschiedene Karten aus verschiedenen Sets. Regel 3 — Geduld schlägt Spekulation: Wer 3–5 Jahre wartet, hat fast immer Gewinn gemacht. Wer nach 3 Wochen wieder verkauft, verliert meist durch Gebühren und Spreads.',
      },
    ],
    keyPoints: [
      'Karten mit beliebtem Pokémon + hoher Seltenheit haben das größte Potenzial',
      'Zustand ist entscheidend — NM oder besser kaufen, immer in Sleeves',
      'Einzelkarten kaufen statt Packs öffnen — bessere Rendite',
      '1–3 Jahre Haltedauer für echten Wertzuwachs einplanen',
    ],
    tags: ['pokemon investment', 'pokemon karten kaufen', 'starter guide', 'tcg investment'],
  },

  {
    slug: 'seltenheitsstufen-pokemon-karten-erklaert',
    title: 'Pokémon Karten Seltenheitsstufen — von Common bis Hyper Rare erklärt',
    metaDescription: 'Was bedeuten die Symbole auf Pokémon Karten? Dieser Guide erklärt alle Seltenheitsstufen — und welche davon wirklich Geld wert sind.',
    emoji: '💎',
    badge: 'Guide',
    color: 'blue',
    headerGradient: 'from-blue-800 to-blue-950',
    readingTimeMin: 5,
    intro: 'Hast du dich jemals gefragt, was das kleine Symbol unten rechts auf deiner Pokémon-Karte bedeutet? Kreis, Raute, Stern — das ist kein Zufall. Das ist der Schlüssel zum Verständnis, wie selten (und wie wertvoll) eine Karte wirklich ist. Dieser Guide erklärt das System von Grund auf — und zeigt dir, welche Stufen du im Auge behalten solltest.',
    sections: [
      {
        heading: '⚪ Common, Uncommon & Rare — das Fundament',
        content: 'Commons (Kreis ●) sind die häufigsten Karten — du findest sie in jedem Pack. Uncommons (Raute ◆) sind etwas seltener, aber immer noch günstig. Rares (Stern ★) tauchen in jedem Boosterpack mindestens einmal auf, aber nur eine Variante davon. Keine dieser Karten ist typischerweise viel wert — du siehst hier selten mehr als 1–2 € auf Cardmarket. Sie sind perfekt zum Spielen, aber nicht zum Investieren.',
        tip: '📌 Faustregel: Wenn du eine Karte aus einem frisch geöffneten Pack ziehst und enttäuscht bist, ist sie wahrscheinlich Common oder Uncommon.',
      },
      {
        heading: '⭐ Rare Holo, Ultra Rare & EX/V-Karten',
        content: 'Hier wird es interessanter. Rare Holos glänzen und schimmern — erkennbar am Stern mit H (★H) oder dem Glitzer-Hintergrund. Ultra Rares (doppelter Stern ★★) sind die klassischen Full-Art-Karten, EX, GX, V und VMAX-Karten fallen hier hinein. Preise: 5–50 € je nach Pokémon und Set. Diese Karten bilden das Rückgrat vieler Sammlungen und können bei sehr beliebten Pokémon deutlich steigen.',
        cards: [
          { name: 'Charizard V (Celebrations)', rarity: 'Ultra Rare', why: 'Hyped Set, ikonisches Design — stabiler Wertzuwachs über die Zeit', imageUrl: 'https://images.pokemontcg.io/cel25/4.png' },
          { name: 'Pikachu VMAX Rainbow (Vivid Voltage)', rarity: 'Ultra Rare Rainbow', why: 'Rainbow Rares sind eine eigene Kategorie mit treuer Fanbasis', imageUrl: 'https://images.pokemontcg.io/swsh4/188.png' },
        ],
      },
      {
        heading: '✨ Special Illustration Rare (SIR) — das Gold des modernen TCG',
        content: 'Seit Scarlet & Violet (2023) sind Special Illustration Rares (erkennbar am goldenen Symbol oder "Special Illustration Rare" auf der Karte selbst) die begehrtesten modernen Karten. Sie zeigen das Pokémon in einem vollflächigen, künstlerischen Illustration-Stil ohne Textbox-Hintergrund. Ihre Druckrate liegt oft bei 1:80–100 Packs — extrem selten. Preise: 30–400 €, je nach Pokémon. Diese Karten sind die Hauptinvestmentziele des modernen TCG.',
        tip: '🔥 Heiß: SIRs von Charizard, Pikachu, Mewtu, Glurak und Evoli-Entwicklungen sind konstant die wertvollsten Karten aus neuen Sets.',
      },
      {
        heading: '👑 Hyper Rare & Gold-Karten — das absolute Rarste',
        content: 'Hyper Rares (früher "Secret Rares") sind die Karten über der normalen Setnummer hinaus — du erkennst sie an der Nummer "200/198" oder ähnlichem. Gold-Karten mit Trainer-Items oder Energie in Gold-Ausführung fallen ebenfalls hierher. Ihre Druckrate ist nochmal deutlich seltener als SIRs. Wertpotenzial: 20–200 €, aber durch die größere Anzahl an Hyper Rares pro Set oft etwas weniger exklusiv als SIRs.',
        cards: [
          { name: 'Pokéball (Gold, 151 Set)', rarity: 'Hyper Rare', why: 'Gold-Trainer-Karten haben eine eigene treue Fanbasis bei Completionists', imageUrl: 'https://images.pokemontcg.io/sv3pt5/207.png' },
          { name: 'Mewtu ex (151 Set)', rarity: 'Special Illustration Rare', why: 'Legendäres Pokémon, limitierte SIR — einer der konstantesten Preisheber', imageUrl: 'https://images.pokemontcg.io/sv3pt5/204.png' },
        ],
      },
    ],
    keyPoints: [
      'SIRs (Special Illustration Rares) sind die wertvollsten modernen Karten',
      'Common, Uncommon, Rare — kaum Investmentwert, perfekt zum Spielen',
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
    intro: 'Eine Charizard ex Special Illustration Rare — frisch aus dem Pack gezogen, perfekter Zustand, 300 € wert. Sechs Monate später: ein Kratzer auf der Oberfläche, eine leicht gebogene Ecke. Neuer Wert: 80 €. Das ist kein Märchen — das passiert ständig. Der häufigste Fehler von Sammlern ist nicht der falsche Kauf, sondern die falsche Lagerung. Dieser Guide rettet dir hunderte Euro.',
    sections: [
      {
        heading: '🧤 Sleeve direkt beim Öffnen — ohne Ausnahme',
        content: 'Regel Nummer 1: Jede Karte, die aus einem Pack kommt, geht sofort in einen Sleeve. Sleeves (auch "Hüllen") schützen vor Kratzern durch andere Karten, Fingerabdrücken und leichten Biegungen. Für normale Karten reichen günstige Penny Sleeves (100 Stück für ~2 €). Für wertvollere Karten: Doppelt sleeved — erst ein enger Perfect Fit Sleeve, dann ein normaler Sleeve drüber. Das ist der Standard für alles über 10 €.',
        tip: '🎯 Marken-Empfehlung: KMC Perfect Fit + Dragon Shield als Outer Sleeve gilt als der Goldstandard unter Sammlern.',
      },
      {
        heading: '💪 Toploader & Magnethalter für wertvolle Karten',
        content: 'Sleeves allein reichen für teure Karten nicht — sie können sich trotzdem biegen. Für alles über 20 € gilt: Ab in den Toploader. Das sind harte Plastik-Hüllen (ca. 0,10–0,50 € pro Stück), in die die gefileeten Karte passt. Für echte Schätze über 50 € gibt es Magnethalter (auch "Magnet Cases") — stabile, zweiseitige Hartplastik-Halter, die die Karte einrahmen. Diese sehen auch toll aus und schützen optimal.',
        tip: '⚠️ Vorsicht: Stecke Karten nie direkt (ohne Sleeve) in Toploader — die Kanten des Toploaders können Schaden anrichten.',
      },
      {
        heading: '📖 Binder für die Sammlung — richtig oder falsch?',
        content: 'Für Karten unter 5 € sind Binder mit Folientaschen perfekt — ordentlich sortiert und jederzeit zugänglich. Achte auf Side-Loading-Binder (Karten fallen nicht raus) und Folientaschen ohne PVC (PVC kann die Karte über Zeit beschädigen). Für Karten über 20 € gilt jedoch: Nicht in den Binder. Der Reibungskontakt beim Ein- und Ausschieben hinterlässt über Monate feine Kratzer.',
        cards: [
          { name: 'Charizard ex (Paldea Evolved)', rarity: 'Ultra Rare', why: 'Typisches Binder-Kandidat — schöne Karte, aber im Binder ok bis ~20 €', imageUrl: 'https://images.pokemontcg.io/sv2/228.png' },
          { name: 'Charizard ex SIR (151)', rarity: 'Special Illustration Rare', why: 'Diese Karte gehört NICHT in den Binder — Toploader oder Magnethalter Pflicht', imageUrl: 'https://images.pokemontcg.io/sv3pt5/201.png' },
        ],
      },
      {
        heading: '🌡️ Die versteckten Feinde: Licht, Feuchtigkeit & Hitze',
        content: 'UV-Licht bleicht Karten aus — wer seine Sammlung im Sonnenlicht ausstellt, riskiert nach Jahren verblasste Farben. Lagere Karten immer dunkel oder hinter UV-Schutzglas. Feuchtigkeit lässt Karten wellen und schimmeln — ideal sind 45–55 % relative Luftfeuchtigkeit. Im Sommer oder in Kellern kann ein günstiger Silicagel-Entfeuchter in der Sammlerbox helfen. Hitze (über 30 °C dauerhaft) kann Sleeves und Karten verformen — Dachböden im Sommer sind tabu.',
        tip: '🌡️ Profi-Move: Wertvolle Karten in verschlossenen Plastikboxen mit Silicagel-Päckchen lagern — schützt vor Feuchtigkeit und Staub.',
      },
    ],
    keyPoints: [
      'Sofort nach dem Öffnen in Sleeve — keine Ausnahmen',
      'Wertvolle Karten (>20 €) in Toploader oder Magnethalter',
      'Kein direktes Sonnenlicht, keine hohe Luftfeuchtigkeit',
      'Binder nur für günstigere Karten — teure Karten nicht einsliden',
    ],
    tags: ['pokemon karten lagern', 'sleeve toploader', 'pokemon karten schützen', 'sammlung pflegen'],
  },

  {
    slug: 'psa-grading-pokemon-karten-lohnt-sich',
    title: 'PSA Grading erklärt — wann lohnt sich das Graden für Pokémon Karten wirklich?',
    metaDescription: 'PSA, CGC, BGS — professionelles Grading für Pokémon Karten erklärt. Wann lohnt es sich und wie viel Wertsteigerung kannst du erwarten?',
    emoji: '🏆',
    badge: 'Grading',
    color: 'amber',
    headerGradient: 'from-amber-700 to-orange-900',
    readingTimeMin: 7,
    intro: 'Eine gegradedte PSA-10 Charizard Shadowless Base Set hat auf Auktionen über 350.000 $ erzielt. Dieselbe Karte ohne Grading: vielleicht 15.000 $. Das klingt extrem — und das ist es auch. Aber auch bei normalen Karten kann Grading den Wert verdoppeln oder verdreifachen. Was steckt dahinter, wann lohnt es sich und was kostet das? Alles in diesem Guide.',
    sections: [
      {
        heading: '🔬 Was ist Grading überhaupt?',
        content: 'Grading bedeutet: Ein professioneller Gutachter (bei Firmen wie PSA, CGC oder Beckett/BGS) schaut sich deine Karte genau unter der Lupe an — buchstäblich. Er prüft Ecken, Kanten, Oberfläche und Zentrierung. Das Ergebnis ist ein numerischer Grade von 1 (stark beschädigt) bis 10 (Gem Mint — perfekt). Die Karte wird in einen versiegelten Hartplastik-Slab eingeschlossen. Der Grade steht dann dauerhaft fest und ist öffentlich verifizierbar. Käufer weltweit vertrauen diesen Bewertungen.',
        tip: '📊 Die drei großen Grading-Firmen: PSA (Professional Sports Authenticator) — mit Abstand die bekannteste und wertvollste. CGC (Certified Guaranty Company) — stärker wachsend, oft günstigere Wartezeiten. BGS/Beckett — bekannt für sehr strenge Bewertungen.',
      },
      {
        heading: '📏 Die Grade-Skala erklärt (1–10)',
        content: 'Grade 10 "Gem Mint" — praktisch perfekte Karte, scharf zentriert, keine Fehler erkennbar. Grade 9 "Mint" — minimale Unvollkommenheiten, die man nur bei genauer Betrachtung sieht. Grade 8 "Near Mint-Mint" — leichte Abnutzung sichtbar, aber optisch noch sehr ansprechend. Grade 7 und darunter — sichtbare Gebrauchsspuren, für Investoren kaum interessant. Wichtig: Der Unterschied zwischen PSA 9 und PSA 10 ist oft nicht sichtbar mit bloßem Auge — kostet aber manchmal das Dreifache.',
        cards: [
          { name: 'Charizard (Base Set Shadowless)', rarity: 'Holo Rare', why: 'PSA-10-Exemplare dieser Karte erzielen 5–10× den Ungraded-Wert — der Grading-Klassiker', imageUrl: 'https://images.pokemontcg.io/base1/4.png' },
          { name: 'Pikachu Illustrator', rarity: 'Promo', why: 'Die wertvollste gegradedte Karte der Welt — PSA-10 erzielte 5,2 Mio $', imageUrl: 'https://images.pokemontcg.io/swsh12pt5gg/GG70.png' },
        ],
        tip: '🔍 Zentrierung prüfen: Halte die Karte schräg ins Licht und schau, ob der weiße Rand auf allen vier Seiten gleich breit ist. Ungleichmäßige Zentrierung ist der häufigste Grund für keinen PSA 10.',
      },
      {
        heading: '💶 Wann lohnt sich Grading — und wann nicht?',
        content: 'Die einfache Faustformel: Eine Karte lohnt sich zu graden, wenn PSA-10-Wert mindestens 4× höher ist als Ungraded-Wert UND die Karte sieht wirklich makellos aus. Kosten für PSA: ca. 25–70 $ pro Karte (Standard-Service), plus Versand und Zoll (Deutschland → USA). Rechne mit 60–100 € Gesamtkosten. Eine Karte, die gegraded 50 € wert ist, lohnt sich also nicht. Karten ab 100 € Rohergebnis, die realistische Chancen auf PSA 9–10 haben, sind kandidaten.',
        tip: '⚡ Alternative für Einsteiger: CGC bietet günstigere Optionen und hat zuletzt stark aufgeholt. Für Karten unter 100 € oft die bessere Wahl als PSA.',
      },
      {
        heading: '📦 So bereitest du eine Karte fürs Grading vor',
        content: 'Schritt 1: Karte direkt nach dem Öffnen doubly sleeved lagern — nie mit bloßen Händen anfassen. Schritt 2: Unter guter Beleuchtung die Zentrierung prüfen und auf Kratzer, Weißränder an Kanten und Oberflächen-Dellen prüfen. Schritt 3: Nur wirklich vielversprechende Karten einsenden — PSA ist kein Spaßprojekt für jede Karte. Schritt 4: Online-Konto bei PSA anlegen, Karte einsenden, 2–6 Monate warten (je nach Service-Level). Schritt 5: Den Slab nach Erhalt direkt auf Echtheit per PSA-Website verifizieren.',
      },
    ],
    keyPoints: [
      'PSA 10 kann den Wert einer Karte 3–10× gegenüber ungegraded steigern',
      'Nur Karten graden, deren Rohwert bereits deutlich über 100 € liegt',
      'Zentrierung und Oberflächenzustand sind die wichtigsten Grade-Faktoren',
      'CGC als günstigere Alternative für Karten im mittleren Preisbereich',
    ],
    tags: ['psa grading', 'pokemon karten graden', 'psa 10', 'cgc pokemon', 'karten wert steigern'],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
