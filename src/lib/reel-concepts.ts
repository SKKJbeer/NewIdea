// Instagram-Konzepte: Formate + Dramaturgie für automatisch erzeugte Reels.
//
// ZWECK: Ein einzelnes wiederkehrendes Format ermüdet — Zuschauer erkennen es
// nach dem dritten Mal und scrollen weiter. Hier stehen mehrere Formate, die
// sich alle AUS DEN VORHANDENEN DATEN bauen lassen und automatisch rotieren.
// Niemand muss wöchentlich entscheiden, was gepostet wird.
//
// ── DRAMATURGIE (gilt für jedes Format) ─────────────────────────────────────
// 1. HAKEN ZUERST. Die ersten 1,5 Sekunden entscheiden. Eine Zahl, eine Frage
//    oder eine Behauptung — NIEMALS ein Marken-Intro. (Der erste Reel-Aufbau
//    startete mit 2,4 s Logo; genau das kostet Reichweite.)
// 2. EINE AUSSAGE pro Reel. Nicht „Markt allgemein", sondern ein Gedanke.
// 3. ZAHLEN SIND DER HELD. Groß, farbig, sofort lesbar. Text erklärt die Zahl,
//    nicht umgekehrt.
// 4. EINORDNUNG STATT ROHDATEN. Am Ende steht, was die Bewegung bedeutet —
//    sonst ist es eine Tabelle mit Musik.
// 5. MARKE ZULETZT. Wer bis zum Schluss bleibt, darf wissen, von wem es kam.
// 6. KEINE KAUFAUFFORDERUNG. Beobachtung und Einordnung, nie „jetzt kaufen"
//    (siehe CLAUDE.md → Content-Tonalität). Gilt auch für Captions.

import type { PokemonCard } from '@/types';
import { displayPrice } from './pokemon-api';
import { formatEur, formatPercent } from './format';

export interface SceneCard {
  name: string;
  price: number;
  trendPercent: number;
  imageUrl: string;
  set: string;
}

export type ReelScene =
  /** Einstieg: Behauptung oder Frage, die zum Bleiben bewegt. */
  | { kind: 'hook'; seconds: number; headline: string; sub?: string; accent?: 'violet' | 'up' | 'down' }
  /** Karte mit Kennzahl — das Arbeitspferd. */
  | { kind: 'card'; seconds: number; card: SceneCard; rank: number; total: number; label: string; metric: 'trend' | 'price' | 'change30' }
  /** Quiz-Frage: Karte sichtbar, Wert verdeckt. */
  | { kind: 'quiz'; seconds: number; card: SceneCard; rank: number; total: number }
  /** Quiz-Auflösung: derselbe Rahmen, jetzt mit Wert. */
  | { kind: 'reveal'; seconds: number; card: SceneCard; rank: number; total: number }
  /** Einordnung: was die Zahlen bedeuten. */
  | { kind: 'insight'; seconds: number; headline: string; body: string }
  /** Abspann mit Marke. */
  | { kind: 'outro'; seconds: number; line: string };

export interface ReelStory {
  conceptId: string;
  title: string;
  scenes: ReelScene[];
  caption: string;
}

export function toSceneCard(card: PokemonCard): SceneCard {
  return {
    name: card.nameDe ?? card.name,
    price: displayPrice(card),
    trendPercent: card.trendPercent ?? 0,
    imageUrl: card.imageUrl,
    set: card.set,
  };
}

function usable(cards: PokemonCard[]): PokemonCard[] {
  return cards.filter((c) => c.imageUrl && displayPrice(c) > 0);
}

/** Gemeinsamer Caption-Fuß: Link mit UTM + Hashtags. Ohne Kaufaufforderung. */
function captionFooter(siteUrl: string, campaign: string): string {
  const url = `${siteUrl}?utm_source=instagram&utm_medium=reel&utm_campaign=${campaign}`;
  return (
    `Alle Preise und Verläufe kostenlos auf der Seite — Link in der Bio\n${url}\n\n` +
    '#Pokemon #PokemonTCG #PokemonKarten #Cardmarket #Sammelkarten #TCG #PokemonDeutschland #Kartenpreise'
  );
}

// ── Konzept 1: Top-Mover ────────────────────────────────────────────────────
// Die stärksten Bewegungen der Woche. Klassiker, funktioniert immer.
function topMover(cards: PokemonCard[], siteUrl: string): ReelStory | null {
  const pool = usable(cards)
    .filter((c) => Math.abs(c.trendPercent ?? 0) > 0)
    .sort((a, b) => Math.abs(b.trendPercent ?? 0) - Math.abs(a.trendPercent ?? 0))
    .slice(0, 5);
  if (pool.length < 3) return null;

  const scenes: ReelScene[] = [
    {
      kind: 'hook',
      seconds: 2.0,
      headline: `${pool.length} Karten mit der stärksten Bewegung`,
      sub: 'Diese Woche im Pokémon-Kartenmarkt',
      accent: 'violet',
    },
  ];
  pool.forEach((c, i) =>
    scenes.push({
      kind: 'card',
      seconds: 3.2,
      card: toSceneCard(c),
      rank: i + 1,
      total: pool.length,
      label: 'STÄRKSTE BEWEGUNG',
      metric: 'trend',
    }),
  );

  const top = toSceneCard(pool[0]);
  const richtung = top.trendPercent >= 0 ? 'zugelegt' : 'nachgegeben';
  scenes.push({
    kind: 'insight',
    seconds: 3.4,
    headline: 'Was das heißt',
    body: `${top.name} hat am deutlichsten ${richtung}. Einzelne Wochenwerte schwanken stark — aussagekräftig wird ein Preis erst im Verlauf über mehrere Wochen.`,
  });
  scenes.push({ kind: 'outro', seconds: 2.6, line: 'Preise täglich aktuell' });

  const liste = pool
    .slice(0, 3)
    .map((c) => `${c.nameDe ?? c.name}: ${formatPercent(c.trendPercent ?? 0)}`)
    .join('\n');

  return {
    conceptId: 'top-mover',
    title: 'Stärkste Bewegungen',
    scenes,
    caption:
      `Die stärksten Bewegungen dieser Woche im Pokémon-Kartenmarkt.\n\n${liste}\n\n` +
      'Einzelne Wochenwerte schwanken — der Verlauf über mehrere Wochen sagt mehr.\n\n' +
      captionFooter(siteUrl, 'top-mover'),
  };
}

// ── Konzept 2: Preis-Check ──────────────────────────────────────────────────
// Quiz-Format: Karte zeigen, Wert verdeckt, dann auflösen. Erzeugt Kommentare,
// weil Zuschauer mitraten — der stärkste Reichweiten-Hebel der vier Formate.
function preisCheck(cards: PokemonCard[], siteUrl: string): ReelStory | null {
  const pool = usable(cards)
    .sort((a, b) => displayPrice(b) - displayPrice(a))
    .slice(0, 3);
  if (pool.length < 3) return null;

  const scenes: ReelScene[] = [
    {
      kind: 'hook',
      seconds: 2.0,
      headline: 'Was ist diese Karte wert?',
      sub: 'Drei Karten — rate mit',
      accent: 'violet',
    },
  ];
  pool.forEach((c, i) => {
    const sc = toSceneCard(c);
    scenes.push({ kind: 'quiz', seconds: 2.6, card: sc, rank: i + 1, total: pool.length });
    scenes.push({ kind: 'reveal', seconds: 2.4, card: sc, rank: i + 1, total: pool.length });
  });
  scenes.push({
    kind: 'insight',
    seconds: 3.0,
    headline: 'Wie viele hattest du richtig?',
    body: 'Schreib deine Schätzung in die Kommentare. Die Preise stammen von Cardmarket und ändern sich täglich.',
  });
  scenes.push({ kind: 'outro', seconds: 2.6, line: 'Jede Karte nachschlagen' });

  return {
    conceptId: 'preis-check',
    title: 'Preis-Check',
    scenes,
    caption:
      'Preis-Check: Wie gut schätzt du den Wert dieser drei Karten?\n\n' +
      'Schreib deine Schätzung in die Kommentare, bevor du weiterscrollst.\n\n' +
      'Alle Werte sind aktuelle Cardmarket-Preise und ändern sich täglich.\n\n' +
      captionFooter(siteUrl, 'preis-check'),
  };
}

// ── Konzept 3: Die teuersten Karten eines Sets ──────────────────────────────
// Evergreen mit praktisch unbegrenztem Nachschub — ein Reel pro Set.
function teuersteImSet(cards: PokemonCard[], siteUrl: string): ReelStory | null {
  const pool = usable(cards);
  if (pool.length < 4) return null;

  // Das am häufigsten vertretene Set nehmen — dann passt die Überschrift.
  const bySet = new Map<string, PokemonCard[]>();
  for (const c of pool) {
    const list = bySet.get(c.set) ?? [];
    list.push(c);
    bySet.set(c.set, list);
  }
  const [setName, setCards] = [...bySet.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const top = setCards.sort((a, b) => displayPrice(b) - displayPrice(a)).slice(0, 5);
  if (top.length < 3) return null;

  const scenes: ReelScene[] = [
    {
      kind: 'hook',
      seconds: 2.0,
      headline: `Die teuersten Karten aus ${setName}`,
      sub: `Top ${top.length} nach Marktwert`,
      accent: 'violet',
    },
  ];
  top.forEach((c, i) =>
    scenes.push({
      kind: 'card',
      seconds: 3.0,
      card: toSceneCard(c),
      rank: i + 1,
      total: top.length,
      label: setName.toUpperCase(),
      metric: 'price',
    }),
  );
  scenes.push({
    kind: 'insight',
    seconds: 3.2,
    headline: 'Warum diese Karten',
    body: 'Seltenheit und Artwork bestimmen den Abstand zum Rest des Sets. Sobald ein Set nicht mehr gedruckt wird, wächst das Angebot nicht mehr nach.',
  });
  scenes.push({ kind: 'outro', seconds: 2.6, line: 'Alle Sets auf der Seite' });

  return {
    conceptId: 'teuerste-im-set',
    title: `Teuerste aus ${setName}`,
    scenes,
    caption:
      `Die teuersten Karten aus ${setName} nach aktuellem Marktwert.\n\n` +
      top
        .slice(0, 3)
        .map((c, i) => `${i + 1}. ${c.nameDe ?? c.name} — ${formatEur(displayPrice(c))}`)
        .join('\n') +
      '\n\nSeltenheit und Artwork bestimmen den Abstand zum Rest des Sets.\n\n' +
      captionFooter(siteUrl, 'teuerste-im-set'),
  };
}

// ── Konzept 4: 30 Tage ──────────────────────────────────────────────────────
// Vergleich aktueller Trendpreis gegen den echten 30-Tage-Durchschnitt.
// Nutzt ausschließlich reale Cardmarket-Felder — keine erfundene Kurve.
function dreissigTage(cards: PokemonCard[], siteUrl: string): ReelStory | null {
  const pool = usable(cards)
    .map((c) => {
      const avg30 = c.cmPrices?.avg30 ?? 0;
      const trend = c.cmPrices?.trend ?? 0;
      return { card: c, avg30, trend };
    })
    .filter((e) => e.avg30 > 0 && e.trend > 0)
    .map((e) => ({ card: e.card, change: ((e.trend - e.avg30) / e.avg30) * 100 }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 4);
  if (pool.length < 3) return null;

  const scenes: ReelScene[] = [
    {
      kind: 'hook',
      seconds: 2.0,
      headline: 'Aktueller Preis gegen 30-Tage-Schnitt',
      sub: 'Wo weicht der Markt gerade ab?',
      accent: 'violet',
    },
  ];
  pool.forEach((entry, i) => {
    const sc = toSceneCard(entry.card);
    scenes.push({
      kind: 'card',
      seconds: 3.2,
      // Für dieses Format zeigt die Kennzahl die Abweichung, nicht den Wochentrend.
      card: { ...sc, trendPercent: entry.change },
      rank: i + 1,
      total: pool.length,
      label: 'GEGEN Ø 30 TAGE',
      metric: 'change30',
    });
  });
  scenes.push({
    kind: 'insight',
    seconds: 3.4,
    headline: 'Wozu der Vergleich',
    body: 'Der Tagespreis schwankt, der 30-Tage-Schnitt glättet. Weichen beide stark voneinander ab, ist gerade Bewegung im Markt — nach oben wie nach unten.',
  });
  scenes.push({ kind: 'outro', seconds: 2.6, line: 'Verläufe auf der Seite' });

  return {
    conceptId: 'dreissig-tage',
    title: 'Preis gegen 30-Tage-Schnitt',
    scenes,
    caption:
      'Aktueller Preis gegen den 30-Tage-Durchschnitt — wo weicht der Markt gerade ab?\n\n' +
      pool
        .slice(0, 3)
        .map((e) => `${e.card.nameDe ?? e.card.name}: ${formatPercent(e.change)}`)
        .join('\n') +
      '\n\nDer Tagespreis schwankt, der Schnitt glättet. Große Abweichung heißt: gerade Bewegung.\n\n' +
      captionFooter(siteUrl, 'dreissig-tage'),
  };
}

export type ConceptBuilder = (cards: PokemonCard[], siteUrl: string) => ReelStory | null;

export const CONCEPTS: Array<{ id: string; label: string; build: ConceptBuilder }> = [
  { id: 'top-mover', label: 'Stärkste Bewegungen', build: topMover },
  { id: 'preis-check', label: 'Preis-Check (Quiz)', build: preisCheck },
  { id: 'teuerste-im-set', label: 'Teuerste Karten eines Sets', build: teuersteImSet },
  { id: 'dreissig-tage', label: 'Preis gegen 30-Tage-Schnitt', build: dreissigTage },
];

/** Kalenderwoche — steuert die Rotation, damit sich Formate abwechseln. */
export function weekIndex(now: Date = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  return Math.floor((now.getTime() - start) / (7 * 24 * 3600 * 1000));
}

/**
 * Baut die Geschichte für diese Woche.
 *
 * Rotiert automatisch durch die Formate. Liefert ein Format zu wenig Daten
 * (z.B. keine Cardmarket-Durchschnitte), wird das nächste versucht — es kommt
 * lieber ein anderes Format als gar keins.
 */
export function buildStory(
  cards: PokemonCard[],
  siteUrl: string,
  options: { conceptId?: string; now?: Date } = {},
): ReelStory | null {
  if (options.conceptId) {
    const chosen = CONCEPTS.find((c) => c.id === options.conceptId);
    return chosen ? chosen.build(cards, siteUrl) : null;
  }
  const start = weekIndex(options.now ?? new Date()) % CONCEPTS.length;
  for (let i = 0; i < CONCEPTS.length; i++) {
    const story = CONCEPTS[(start + i) % CONCEPTS.length].build(cards, siteUrl);
    if (story) return story;
  }
  return null;
}
