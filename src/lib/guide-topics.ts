// Themen-Warteschlange für die automatisierte Guide-Generierung.
// Kuratiert nach echter Sammler-Such-Intention (Google: "pokemon karten ...").
// Der Cron arbeitet die Liste der Reihe nach ab — bereits generierte Slugs
// werden übersprungen. Neue Themen unten anhängen, Reihenfolge = Priorität.

export interface GuideTopic {
  slug: string;
  title: string;
  /** Icon-Key für <ContentIcon> (Lucide) — keine Emojis, siehe CLAUDE.md UI-Regeln */
  icon: string;
  badge: string;
  color: string;
  headerGradient: string;
  /** Such-Intention + inhaltlicher Auftrag an die Generierung. */
  brief: string;
  /** Grobe Sektions-Struktur als Leitplanke (die KI darf abweichen, nicht kürzen). */
  outline: string[];
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    slug: 'pokemon-karten-verkaufen-wo-und-wie',
    title: 'Pokémon Karten verkaufen — wo und wie es wirklich funktioniert',
    icon: 'coins',
    badge: 'Verkaufen',
    color: 'emerald',
    headerGradient: 'from-emerald-800 to-green-950',
    brief: 'Suchintention: "pokemon karten verkaufen". Sammler wollen wissen, welche Plattform (Cardmarket, eBay, lokale Händler, Kleinanzeigen) sich wofür eignet, welche Gebühren anfallen, wie man Karten korrekt beschreibt/fotografiert und wie Versand sicher funktioniert. Neutral vergleichen, keine Verkaufsempfehlung für eine Plattform.',
    outline: ['Die Verkaufswege im Vergleich (Plattform-Mechanik, Gebührenlogik, Zielgruppe)', 'Zustand ehrlich einstufen — warum Überbewertung nach hinten losgeht', 'Fotos und Beschreibung, die Käufer überzeugen', 'Versand: Schutz, Nachweis, typische Fehler'],
  },
  {
    slug: 'was-ist-meine-pokemon-sammlung-wert',
    title: 'Was ist meine Pokémon-Sammlung wert? So findest du es systematisch heraus',
    icon: 'search',
    badge: 'Bewertung',
    color: 'violet',
    headerGradient: 'from-violet-800 to-indigo-900',
    brief: 'Suchintention: "pokemon karten wert herausfinden". Schritt-für-Schritt: Karten identifizieren (Set-Symbol, Nummer, Seltenheit), Preise auf Cardmarket nachschlagen, Zustand einordnen, typische Anfängerfehler (Massenkarten überschätzen). Verweis auf die Preissuche dieser Seite.',
    outline: ['Karte identifizieren: Set-Symbol, Kartennummer, Seltenheitszeichen', 'Preis nachschlagen: Cardmarket richtig lesen (Trend vs. Angebote)', 'Zustand einordnen — der größte Werthebel', 'Realistische Erwartung: warum die meisten Karten wenig wert sind'],
  },
  {
    slug: 'pokemon-erstauflage-erkennen-1st-edition',
    title: 'Erstauflage erkennen: 1st Edition, Shadowless & Unlimited unterscheiden',
    icon: 'medal',
    badge: 'Vintage',
    color: 'amber',
    headerGradient: 'from-amber-700 to-orange-900',
    brief: 'Suchintention: "pokemon 1st edition erkennen". Die Merkmale: 1st-Edition-Stempel, Shadowless-Merkmale beim Base Set, Unlimited-Unterschiede, deutsche vs. englische Auflagen. Nur dokumentierte, verifizierbare Merkmale (Bulbapedia als Quelle) — keine erfundenen Details.',
    outline: ['Der 1st-Edition-Stempel: wo er sitzt und wie er aussieht', 'Shadowless beim Base Set: die Merkmale im Detail', 'Unlimited und spätere Drucke unterscheiden', 'Deutsche Auflagen: was anders ist'],
  },
  {
    slug: 'psa-vs-cgc-vs-bgs-grading-vergleich',
    title: 'PSA vs. CGC vs. BGS: Die Grading-Anbieter im sachlichen Vergleich',
    icon: 'scale',
    badge: 'Grading',
    color: 'blue',
    headerGradient: 'from-blue-800 to-blue-950',
    brief: 'Suchintention: "psa oder cgc pokemon". Sachlicher Anbieter-Vergleich: Bewertungsskalen, Marktakzeptanz, Slab-Formate, typische Bearbeitungswege aus Deutschland. Keine Preisangaben (ändern sich) — auf die offiziellen Preisseiten verweisen. Keine Empfehlung, nur Kriterien.',
    outline: ['Die drei Anbieter und ihre Bewertungsphilosophie', 'Marktakzeptanz: wie der Sammlermarkt die Slabs behandelt', 'Ablauf aus Deutschland: Weg, Zoll, Wartezeit-Logik', 'Entscheidungskriterien je nach Kartentyp'],
  },
  {
    slug: 'booster-box-vs-etb-vs-einzelkarten',
    title: 'Booster Box, ETB oder Einzelkarten: Was die Produktformen unterscheidet',
    icon: 'package',
    badge: 'Produkte',
    color: 'indigo',
    headerGradient: 'from-indigo-800 to-indigo-950',
    brief: 'Suchintention: "pokemon booster box oder etb". Die Produktformen erklären: Display/Booster Box, Elite Trainer Box, Bundles, Tins, Einzelkarten. Inhalt, Pull-Logik, Sealed-Markt-Verhalten nach Produktionsende. Statistik: Packs öffnen vs. Direktkauf. Keine Kaufempfehlung.',
    outline: ['Die Produktformen und was drinsteckt', 'Die Statistik des Pack-Öffnens: Erwartungswert verstehen', 'Sealed nach Produktionsende: das dokumentierte Marktmuster', 'Welche Form zu welchem Sammlertyp passt — Kriterien statt Empfehlung'],
  },
  {
    slug: 'pokemon-karten-zustand-bewerten-nm-bis-poor',
    title: 'Kartenzustand bewerten: Von Near Mint bis Poor — das Cardmarket-System',
    icon: 'microscope',
    badge: 'Zustand',
    color: 'emerald',
    headerGradient: 'from-emerald-800 to-green-950',
    brief: 'Suchintention: "pokemon karten zustand near mint". Die Cardmarket-Zustandsstufen (MT/NM/EX/GD/LP/PL/PO) im Detail: worauf bei Ecken, Kanten, Oberfläche, Zentrierung achten. Wie sich Zustand auf den Marktwert auswirkt (qualitativ). Whitening, Kratzer, Knicke erkennen.',
    outline: ['Die Cardmarket-Skala von Mint bis Poor', 'Die vier Prüfzonen: Ecken, Kanten, Oberfläche, Zentrierung', 'Typische Schäden und wie man sie erkennt (Whitening, Clouding, Knicke)', 'Zustand und Marktwert: das Verhältnis verstehen'],
  },
  {
    slug: 'japanische-pokemon-karten-sammeln',
    title: 'Japanische Pokémon-Karten: Was Sammler über den JP-Markt wissen sollten',
    icon: 'map',
    badge: 'Japan',
    color: 'rose',
    headerGradient: 'from-rose-800 to-rose-950',
    brief: 'Suchintention: "japanische pokemon karten unterschied". Unterschiede JP vs. EN/DE: Druckqualität-Ruf, Set-Struktur (andere Set-Namen/-Nummern), Preisniveau-Struktur, Verfügbarkeit in Europa. Nur verifizierbare Fakten, Bulbapedia als Set-Quelle.',
    outline: ['Wie sich japanische Sets von westlichen unterscheiden', 'Druck und Verarbeitung: der Ruf japanischer Karten', 'Preisstruktur: warum JP-Karten oft anders notieren', 'Kaufwege in Europa und worauf beim Import zu achten ist'],
  },
  {
    slug: 'pokemon-karten-fuer-kinder-sammeln-eltern-guide',
    title: 'Pokémon-Karten fürs Kind: Der Eltern-Guide ohne Fachchinesisch',
    icon: 'users',
    badge: 'Eltern',
    color: 'violet',
    headerGradient: 'from-violet-800 to-indigo-900',
    brief: 'Suchintention: Eltern, deren Kind mit Pokémon-Karten anfängt. Was kaufen (Themendecks vs. Booster), was sind die Karten im Schulhof-Tausch "wert", wie teure Karten des Kindes schützen, Fälschungen auf Spielzeugmärkten erkennen. Zugänglich, kein Jargon ohne Erklärung.',
    outline: ['Der Einstieg: was ein Kind wirklich braucht', 'Schulhof-Tausch: faire Tauschregeln und Wert-Grundgefühl', 'Die erste teure Karte: schützen statt verbieten', 'Fälschungen im Spielwarenhandel erkennen'],
  },
  {
    slug: 'pokemon-sets-rotation-standard-format',
    title: 'Set-Rotation und Standard-Format: Warum Spielkarten an Wert verlieren können',
    icon: 'refresh',
    badge: 'Format',
    color: 'blue',
    headerGradient: 'from-blue-800 to-blue-950',
    brief: 'Suchintention: "pokemon rotation was passiert mit karten". Die jährliche Format-Rotation erklärt: Regulation Marks, was aus dem Standard fällt, wie sich das historisch auf Spieler-Karten vs. Sammler-Karten auswirkt. Limitless TCG als Quelle für Formatdaten.',
    outline: ['Wie die Rotation funktioniert: Regulation Marks lesen', 'Spielwert vs. Sammlerwert: zwei getrennte Märkte', 'Das dokumentierte Muster: Turnier-Karten nach der Rotation', 'Was Rotation für reine Sammler bedeutet: wenig'],
  },
  {
    slug: 'pokemon-promo-karten-verstehen',
    title: 'Promo-Karten verstehen: Black Star, Stempel und Event-Karten',
    icon: 'sparkles',
    badge: 'Promos',
    color: 'amber',
    headerGradient: 'from-amber-700 to-orange-900',
    brief: 'Suchintention: "pokemon promo karte wert". Was Promos sind (Black Star Promos, Stamped-Versionen, Event-/Turnier-Promos, Produkt-Beilagen), wie man sie identifiziert (Promo-Nummern), warum ihre Marktpreise stark streuen. Bulbapedia als Promo-Listen-Quelle.',
    outline: ['Die Promo-Kategorien und ihre Nummernsysteme', 'Identifizieren: Promo-Stern, Stempel, Set-Zugehörigkeit', 'Warum Promo-Preise so stark streuen', 'Dokumentierte Beispiele besonders gefragter Promos'],
  },
  {
    slug: 'pokemon-karten-versichern-dokumentieren',
    title: 'Sammlung dokumentieren und absichern: Inventar, Fotos, Versicherungsfragen',
    icon: 'folder',
    badge: 'Absicherung',
    color: 'emerald',
    headerGradient: 'from-emerald-800 to-green-950',
    brief: 'Suchintention: Sammler mit wachsendem Sammlungswert. Inventarliste führen (welche Daten pro Karte), Fotodokumentation, was Hausratversicherungen typischerweise abdecken (allgemein, keine Rechtsberatung — auf Versicherer verweisen), Portfolio-Tracker dieser Seite erwähnen.',
    outline: ['Das Minimal-Inventar: welche Daten pro Karte erfasst gehören', 'Fotodokumentation: was im Schadensfall zählt', 'Versicherungsfragen: was allgemein gilt und wen man fragt', 'Digitale Helfer: vom Spreadsheet zum Portfolio-Tracker'],
  },
  {
    slug: 'alte-pokemon-karten-1999-wert-check',
    title: 'Alte Pokémon-Karten von früher gefunden? Der systematische Wert-Check',
    icon: 'clock',
    badge: 'Vintage',
    color: 'amber',
    headerGradient: 'from-amber-700 to-orange-900',
    brief: 'Suchintention: "alte pokemon karten 1999 wert" — Dachbodenfund-Szenario. Systematisch prüfen: Welche Ära (Rückseiten-Design, Copyright-Zeile), welche Karten überhaupt Potenzial haben (Holos, Erstauflage), Zustand realistisch einschätzen, nächste Schritte. Erwartungsmanagement: die meisten Funde sind Massenware.',
    outline: ['Die Ära bestimmen: Copyright-Zeile und Set-Symbol lesen', 'Welche Karten aus alten Sammlungen Potenzial haben — und welche nicht', 'Zustand nach Jahren im Karton: realistisch bleiben', 'Die nächsten Schritte: prüfen, dokumentieren, bewerten lassen'],
  },
];

/** Slugs aller statischen + generierbaren Guides dürfen nicht kollidieren. */
export function getTopicBySlug(slug: string): GuideTopic | undefined {
  return GUIDE_TOPICS.find((t) => t.slug === slug);
}
