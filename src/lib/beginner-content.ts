// Kuratierte Inhalte für die Einsteiger-Seite (/einsteiger).
// Alle Karten-IDs sind gegen die TCG-API verifiziert (v2.16.0-Regel) — Bild und
// Name stimmen überein. Preise/Verlauf holt die Karten-Detailseite live.

export interface IconicCard {
  id: string;         // TCG-API ID, z.B. "sv3pt5-199"
  setCode: string;    // für BoosterPackImage
  name: string;       // englischer Name (offiziell)
  nameDe: string;     // deutscher Name
  imageUrl: string;   // verifiziertes Kartenbild
  why: string;        // ein Satz, warum diese Karte ikonisch ist
}

export const ICONIC_CARDS: IconicCard[] = [
  {
    id: 'sv3pt5-199', setCode: 'sv3pt5',
    name: 'Charizard ex', nameDe: 'Glurak ex',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/199.png',
    why: 'Der bekannteste Pokémon der Welt — höchste Seltenheitsstufe im 151-Set.',
  },
  {
    id: 'base1-4', setCode: 'base1',
    name: 'Charizard', nameDe: 'Glurak',
    imageUrl: 'https://images.pokemontcg.io/base1/4.png',
    why: 'Der Klassiker aus dem Base Set — die Karte, mit der für viele alles begann.',
  },
  {
    id: 'sv3pt5-173', setCode: 'sv3pt5',
    name: 'Pikachu', nameDe: 'Pikachu',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/173.png',
    why: 'Das Maskottchen der Serie — global bekannteste Pokémon-Figur.',
  },
  {
    id: 'swsh7-215', setCode: 'swsh7',
    name: 'Umbreon VMAX', nameDe: 'Nachtara VMAX',
    imageUrl: 'https://images.pokemontcg.io/swsh7/215.png',
    why: 'Fan-Favorit unter den Evoli-Entwicklungen — auffälliges Alternate-Art.',
  },
  {
    id: 'sv3pt5-205', setCode: 'sv3pt5',
    name: 'Mew ex', nameDe: 'Mew ex',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/205.png',
    why: 'Das mysteriöse Pokémon in Gold-Ausführung — das Hyper-Rare-Highlight des 151-Sets.',
  },
  {
    id: 'sv3pt5-200', setCode: 'sv3pt5',
    name: 'Blastoise ex', nameDe: 'Turtok ex',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/200.png',
    why: 'Einer der drei Kanto-Starter als vollflächige Illustration.',
  },
];

export interface OnboardingStep {
  icon: string;        // ContentIcon-Key
  title: string;
  text: string;
  href: string;
  cta: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: 'search',
    title: 'Wert einer Karte herausfinden',
    text: 'Namen eingeben — du siehst den aktuellen Marktpreis von Cardmarket, den Verlauf und vergleichbare Karten. Deutsche Namen funktionieren.',
    href: '/suche',
    cta: 'Karte suchen',
  },
  {
    icon: 'book',
    title: 'Die Grundlagen verstehen',
    text: 'Was bedeuten die Seltenheits-Symbole? Wie lagert man Karten richtig? Lohnt sich Grading? Kurze, sachliche Guides ohne Fachchinesisch.',
    href: '/guides',
    cta: 'Guides lesen',
  },
  {
    icon: 'card',
    title: 'Sammlung im Blick behalten',
    text: 'Karten auf die Merkliste setzen oder ein Portfolio anlegen — der Wert deiner Sammlung, jederzeit aktuell. Kein Konto nötig, alles lokal.',
    href: '/merkliste',
    cta: 'Merkliste öffnen',
  },
];
