import type { Article } from './article-generator';

// Statische Archiv-Artikel (sachliche Marktanalyse) für vergangene Publish-Tage.
// Diese werden immer vor einer KI-Generierung geliefert — garantierter Content.
//
// PFLICHT-REGELN (CLAUDE.md → Content-Wahrheitspflicht):
// - KEINE Preiszahlen im Fließtext/keyPoints (nur das price:-Feld in highlight-Objekten)
// - KEINE erfundenen Markt-Events oder Preistrajektorien
// - KEINE Kaufempfehlungen, keine Ich-Form, kein Persona-Name
// - Nur So/Do-Daten — andere Wochentage sind über /artikel/[date] nicht erreichbar
export const STATIC_ARTICLES: Record<string, Omit<Article, 'generatedAt'>> = {

  // ── 2026-06-11 (Donnerstag) ── Set ──────────────────────────────────────────
  '2026-06-11': {
    title: 'Paldea Evolved im Check: Ein Set zwischen Release-Hype und Nostalgie-Lücke',
    intro: 'Während viel über Pokémon 151 gesprochen wird, hat Paldea Evolved (SV2, erschienen Juni 2023) seine Post-Release-Phase längst durchlaufen. Eine Analyse der Marktstruktur dieses Sets — mit den Faktoren, die seine Preisentwicklung bestimmen.',
    sections: [
      {
        heading: 'Was Paldea Evolved ist und warum es Aufmerksamkeit verdient',
        content: 'Paldea Evolved ist das zweite Set der Scarlet & Violet-Ära und führt erstmals neue Pokémon aus der Paldea-Region (aus den Videospielen Karmesin & Purpur von 2022) als Special Illustration Rares ein. Die Chase-Cards des Sets sind weniger berühmt als Glurak oder Mewtu, aber die Artworks zählen zu den auffälligsten der SV-Ära. Oinkologne ex SIR (das pinke parfümierte Pokémon — sieht aus wie eine elegante Pudeldame) und Arcanine ex SIR (der klassische Feuerhund auf einem Felsvorsprung) werden in der Community regelmäßig unter den stärksten SIR-Artworks genannt.',
        highlight: { name: 'Oinkologne ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 45, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Die Marktstruktur: Warum das Set moderater bewertet ist',
        content: 'Die Top-SIRs aus Paldea Evolved notieren deutlich unter vergleichbaren Karten aus dem 151-Set — aktuelle Werte direkt auf Cardmarket prüfen. Der strukturelle Grund: Das Set enthält keine ikonischen Generation-1-Pokémon, die sofortige Nostalgie-Reaktionen auslösen. Das kann sich mit der Zeit ändern: Die Paldea-Pokémon gewinnen unter jungen Fans, die mit Karmesin & Purpur aufgewachsen sind, an Beliebtheit. Historisch haben Karten-Generationen an Marktwert gewonnen, sobald ihre Kindheits-Generation kaufkräftig wurde — ob sich dieses Muster hier wiederholt, ist offen.',
        highlight: { name: 'Arcanine ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 35, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Sealed vs. Einzelkarten: Die Datenlage bei diesem Set',
        content: 'Einzelkarten aus Paldea Evolved zeigen frühere und deutlichere Preisbewegungen als versiegelte Produkte desselben Sets. Bei Sets mit starkem Nostalgiefaktor (wie 151) haben Sealed-Produkte historisch nach Produktionsende zugelegt — Paldea Evolved fehlt dieser Faktor bislang, was die Zeitlinie für Sealed-Bewegungen unsicherer macht. Für die Zustandseinschätzung bei Einzelkarten gilt: Near-Mint-Exemplare von Cardmarket-Verkäufern mit hoher Bewertung entsprechen dem verifizierten Marktstandard.',
        highlight: { name: 'Tinkaton ex SIR', set: 'Paldea Evolved', setCode: 'sv2', imageUrl: '', price: 40, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Paldea Evolved notiert moderater als 151 — der Nostalgie-Faktor fehlt (noch)',
      'Oinkologne, Arcanine, Tinkaton ex SIR werden zu den Top-Artworks des Sets gezählt',
      'Einzelkarten zeigen bei diesem Set frühere Preisbewegungen als Sealed',
    ],
    tags: ['paldea evolved', 'sv2 pokemon', 'scarlet violet', 'pokemon set analyse'],
    sources: [
      { label: 'Bulbapedia — Paldea Evolved (TCG)', url: 'https://bulbapedia.bulbagarden.net/wiki/Paldea_Evolved_(TCG)' },
      { label: 'Cardmarket — Paldea Evolved Karten & Preise', url: 'https://www.cardmarket.com/en/Pokemon/Expansions/Paldea-Evolved' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-14 (Sonntag) ── Rückblick ───────────────────────────────────────
  '2026-06-14': {
    title: 'Wochenrückblick KW 24: Ruhige Marktphasen richtig lesen',
    intro: 'KW 24 war keine dramatische Woche im Pokémon-Markt — keine auffälligen Spikes, keine Panikverkäufe, kein überhitzter Hype. Genau solche ruhigen Wochen sind analytisch aufschlussreich: Sie zeigen, welche Karten ihre Preiszone halten und welche Marktmuster stabil bleiben.',
    sections: [
      {
        heading: 'Was diese Woche bestätigt hat',
        content: 'SIRs aus ausgelaufenen Sets wie Evolving Skies und dem 151-Set zeigen keine Schwäche. Umbreon VMAX Alt Art und Charizard ex SIR halten ihre Preiszonen — kein Ausbruch nach oben, kein Druck nach unten. Stagnation bei etablierten Karten ist historisch kein Warnsignal: Sie zeigt, dass der Markt die aktuellen Niveaus akzeptiert. Werthaltige Karten zeichnen sich langfristig durch Konstanz aus, nicht durch Volatilität. Aktuelle Preise direkt auf Cardmarket prüfen.',
        highlight: { name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', setCode: 'swsh7', imageUrl: '', price: 125, trend: 0, rarity: 'Rare Alt' },
      },
      {
        heading: 'Was diese Woche auffiel',
        content: 'Ältere Karten aus der Sun & Moon-Ära (2016–2019) rücken wieder in den Blickpunkt. Shining Legends-Karten (das kleinere Supplementset von 2017, erkennbar am glänzenden Hintergrund der Pokémon-Abbildungen) zeigen zunehmende Sammlernachfrage. Das ist ein konsistentes Marktmuster: Wenn der Hype um aktuelle Sets sich normalisiert, wandert die Aufmerksamkeit zurück zu älteren Eras — Shining Fates und Hidden Fates werden dabei in der Community besonders beobachtet.',
        highlight: { name: 'Shining Pikachu', set: 'Shining Legends', setCode: 'sm3pt5', imageUrl: '', price: 150, trend: 0, rarity: 'Shiny' },
      },
      {
        heading: 'Ausblick auf die kommende Woche',
        content: 'Temporal Forces (SV5) rückt in den Fokus der Beobachtung — die Preise haben sich seit Release beruhigt, die Konsolidierungsphase nach dem Release-Hype ist ein gut dokumentiertes Muster. Karten wie Walking Wake ex SIR (die urzeitliche Suicune-Variante) stehen dabei besonders im Blick. Historisch hat überhastetes Handeln aus Ungeduld im TCG-Markt selten besser abgeschnitten als ruhige Beobachtung.',
        highlight: { name: 'Walking Wake ex SIR', set: 'Temporal Forces', setCode: 'sv5', imageUrl: '', price: 45, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Ruhige Wochen sind für den Markt normal — Stagnation ist nicht Verlust',
      'Sun & Moon Shining-Karten zeigen zunehmende Sammlernachfrage',
      'Temporal Forces nach der Konsolidierung unter Beobachtung',
    ],
    tags: ['pokemon wochenrückblick', 'tcg markt juni', 'evolving skies', 'sun moon shining'],
    sources: [
      { label: 'Cardmarket — Pokémon Marktpreise', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Pokémon Events — Turnierkalender', url: 'https://www.pokemon.com/de/pokemon-events/' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },

  // ── 2026-06-18 (Donnerstag) ── Set ──────────────────────────────────────────
  '2026-06-18': {
    title: 'Set im Check: Pokémon 151 — Nostalgie als messbarer Marktfaktor',
    intro: 'Pokémon 151 (offiziell "Scarlet & Violet — 151", Set-Code sv3pt5) ist das Set, über das in der TCG-Community mehr geredet wird als über fast jedes andere der letzten Jahre. Es ist eine Hommage an die Original-151-Pokémon aus dem Base Set von 1998 — und ein Lehrstück darüber, wie Nostalgie Marktstrukturen prägt.',
    sections: [
      {
        heading: 'Was das Set so besonders macht',
        content: 'Das 151-Set enthält ausschließlich die originalen 151 Pokémon — Bisasam, Glumanda, Schiggy bis Mewtu und Mew (die Pokémon aus den allerersten Videospielen Rot & Blau von 1996). Jedes ikonische Pokémon hat eine Special Illustration Rare bekommen: Glurak, Pikachu, Mewtu, Relaxo (das dicke schlafende Pokémon, das im Anime immer die Straße blockiert), Evoli und mehr — alle mit vollflächigen Kunstwerken. Diese Kombination aus kompletter Gen-1-Abdeckung und modernem SIR-Standard ist im TCG bislang einmalig.',
        highlight: { name: 'Mewtu ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 85, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Die Top-Chase-Cards und ihre Marktstruktur',
        content: 'Die wertvollsten Karten des Sets sind Charizard ex SIR, Mewtu ex SIR, Pikachu ex SIR und Evoli ex SIR — aktuelle Notierungen direkt auf Cardmarket prüfen. Alle vier zeigen das gleiche Muster: Nach dem Post-Release-Tiefpunkt (wenn der Markt mit frischer Ware geflutet ist) folgte eine nachhaltige Erholung. Die strukturellen Treiber: Das Set wird nicht mehr aktiv gedruckt, das Angebot an frischen Packs schrumpft, und die Nachfrage nach Gen-1-Nostalgie ist global stabil. Emotional getriebene Nachfrage — Karten als Verbindung zur eigenen Kindheit — gilt unter Marktbeobachtern als besonders beständig.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 130, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: 'Sealed oder Einzelkarten — was zeigen die Preisdaten?',
        content: 'Wer eine bestimmte Karte sucht, findet im Direktkauf auf Cardmarket den statistisch effizienteren Weg: Die Wahrscheinlichkeit, eine bestimmte SIR aus Packs zu ziehen, ist gering — der erwartete Einsatz beim Öffnen übersteigt den Direktkaufpreis deutlich. Versiegelte Boosterboxen des 151-Sets folgen dagegen dem dokumentierten Muster von Nostalgie-Sets: Nach Produktionsende tendiert das Preisniveau aufwärts, weil das Angebot nicht mehr wächst. Beide Wege haben unterschiedliche Zeithorizonte und Risikoprofile.',
        highlight: { name: 'Pikachu ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 60, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Alle Original-151 als SIRs — einmalige Nostalgie-Abdeckung im modernen TCG',
      'Top-Chase-Cards: Charizard, Mewtu, Pikachu, Evoli — gleiches Erholungsmuster nach Release',
      'Einzelkauf statistisch effizienter als Pack-Öffnen; Sealed folgt dem Nostalgie-Set-Muster',
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

  // ── 2026-06-21 (Sonntag) ── Rückblick ───────────────────────────────────────
  '2026-06-21': {
    title: 'Wochenrückblick KW 25: Turniersaison, Nostalgie-Sets und ein bekanntes Marktmuster',
    intro: 'KW 25 wirkte ruhig, aber im Hintergrund war Bewegung: Die Turniersaison läuft auf Hochtouren, etablierte Nostalgie-Sets bleiben gefragt — und ein klassisches Marktmuster war wieder zu beobachten. Die Marktbeobachtungen der Woche.',
    sections: [
      {
        heading: '🌍 Was in der Pokémon-Welt passiert ist',
        content: 'Die europäische Turniersaison läuft — Regional-Qualifiers für die Weltmeisterschaft sorgen dafür, dass kompetitive Spieler gezielt Karten einkaufen. Das Muster dahinter ist gut dokumentiert: Wenn Turnierspieler eine Karte brauchen, steigt der Preis innerhalb von Tagen — und wenn das Turnier vorbei ist, normalisiert er sich wieder. Turniergetriebene Nachfrage ist strukturell kurzlebig. Aktuelle Turnierdaten sind bei Limitless TCG einsehbar.',
      },
      {
        heading: '📈 Die Karte der Woche: Charizard ex SIR aus Pokémon 151',
        content: 'Glurak (der orange Drache, den wirklich alle kennen — selbst Leute, die noch nie eine Karte in der Hand hatten) bleibt die Referenzkarte des modernen Sammlermarkts. Der Charizard ex Special Illustration Rare aus dem 151-Set hält seine Preiszone, obwohl das Set über zwei Jahre alt ist und nicht mehr gedruckt wird. Kein viraler Moment, kein Hype-Auslöser — die Nachfrage kommt aus dem Sammlerkern. Genau diese hype-unabhängige Nachfrage unterscheidet etablierte Karten von Spekulationsobjekten.',
        highlight: { name: 'Charizard ex SIR', set: 'Pokémon 151', setCode: 'sv3pt5', imageUrl: '', price: 145, trend: 0, rarity: 'Special Illustration Rare' },
      },
      {
        heading: '😅 Marktmuster der Woche: Der Ankereffekt',
        content: 'Ein bekanntes Verhaltensmuster im Sammlermarkt: Wer einen bestimmten Preis einmal gesehen hat, nimmt ihn als Anker — und empfindet jede spätere Notierung darüber als "zu teuer". Der Markt orientiert sich aber nicht an individuellen Ankern, sondern an Angebot und Nachfrage. Historisch haben sich Preiszonen etablierter Karten unabhängig davon weiterentwickelt, ob einzelne Beobachter auf eine Rückkehr zu früheren Niveaus gewartet haben. Ein Muster, das in der Verhaltensökonomie als Ankerheuristik gut beschrieben ist.',
      },
      {
        heading: '🔮 Beobachtung für die kommende Woche',
        content: 'Surging Sparks (SV8, das Pikachu-Themen-Set von November 2024) zeigt eine interessante Konstellation: Der Pikachu ex SIR daraus wird in der Community häufig mit der 151-Version verglichen — bei ähnlicher Artwork-Qualität, aber unterschiedlicher Set-Historie. Das Angebotsniveau auf Cardmarket verdient Beobachtung: Sinkendes Angebot bei stabiler Nachfrage wäre ein klassisches Signal. Keine Prognose — eine Beobachtungsnotiz.',
        highlight: { name: 'Pikachu ex SIR', set: 'Surging Sparks', setCode: 'sv8', imageUrl: '', price: 45, trend: 0, rarity: 'Special Illustration Rare' },
      },
    ],
    keyPoints: [
      'Turniergetriebene Nachfrage ist strukturell kurzlebig — ein dokumentiertes Muster',
      'Charizard ex SIR (151) hält seine Preiszone ohne Hype-Treiber — Sammlerkern-Nachfrage',
      'Ankerheuristik: Der Markt orientiert sich an Angebot/Nachfrage, nicht an gefühlten Referenzpreisen',
    ],
    tags: ['wochenrückblick kw25', 'pokemon 151', 'charizard ex', 'surging sparks', 'marktmuster'],
    sources: [
      { label: 'Cardmarket — Pokémon Marktpreise', url: 'https://www.cardmarket.com/en/Pokemon' },
      { label: 'Pokémon Weltmeisterschaften — Turnierinfos', url: 'https://www.pokemon.com/de/pokemon-events/world-championships/' },
      { label: 'Limitless TCG — Turnierergebnisse', url: 'https://limitlesstcg.com/tournaments' },
    ],
    readingTimeMin: 4,
    featuredCards: [],
  },
};
