import { describe, it, expect } from 'vitest';
import { buildStory, CONCEPTS, weekIndex, toSceneCard } from '@/lib/reel-concepts';
import type { ReelStory, ReelScene } from '@/lib/reel-concepts';
import type { PokemonCard } from '@/types';

// Die Reel-Formate sind der Reichweiten-Motor. Diese Tests sichern zwei
// Dinge ab, die man an einem fertigen Video nicht sieht:
//   1. Die Dramaturgie aus CLAUDE.md (Haken zuerst, Einordnung, Marke zuletzt)
//   2. Dass ein Format bei dünner Datenlage `null` liefert statt Unsinn —
//      sonst greift die Rotation nicht und es entsteht gar kein Reel.

const SITE = 'https://example.test';

function card(over: Partial<PokemonCard> & { id: string }): PokemonCard {
  return {
    name: `Card ${over.id}`,
    set: 'Test-Set',
    setCode: 'tst',
    rarity: 'Rare',
    imageUrl: `https://images.pokemontcg.io/tst/${over.id}.png`,
    prices: { market: 50 },
    trendPercent: 5,
    ...over,
  } as PokemonCard;
}

/** Ein Kartensatz, der für alle vier Formate reicht. */
function fullDeck(): PokemonCard[] {
  return [
    card({ id: '1', name: 'Alpha', nameDe: 'Alpha DE', prices: { market: 200 }, trendPercent: 21.4, cmPrices: { trend: 200, avg30: 150 } }),
    card({ id: '2', name: 'Beta', prices: { market: 150 }, trendPercent: -18.2, cmPrices: { trend: 150, avg30: 190 } }),
    card({ id: '3', name: 'Gamma', prices: { market: 120 }, trendPercent: 12.0, cmPrices: { trend: 120, avg30: 100 } }),
    card({ id: '4', name: 'Delta', prices: { market: 90 }, trendPercent: -7.5, cmPrices: { trend: 90, avg30: 95 } }),
    card({ id: '5', name: 'Epsilon', prices: { market: 60 }, trendPercent: 3.1, cmPrices: { trend: 60, avg30: 58 } }),
  ];
}

function cardScenes(story: ReelStory): Extract<ReelScene, { rank: number }>[] {
  return story.scenes.filter(
    (s): s is Extract<ReelScene, { rank: number }> => 'rank' in s,
  );
}

describe('toSceneCard', () => {
  it('bevorzugt den deutschen Namen', () => {
    expect(toSceneCard(card({ id: '1', name: 'Charizard', nameDe: 'Glurak' })).name).toBe('Glurak');
  });

  it('fällt auf den englischen Namen zurück', () => {
    expect(toSceneCard(card({ id: '1', name: 'Charizard' })).name).toBe('Charizard');
  });

  it('setzt einen fehlenden Trend auf 0 statt undefined', () => {
    expect(toSceneCard(card({ id: '1', trendPercent: undefined })).trendPercent).toBe(0);
  });
});

describe('Dramaturgie — gilt für JEDES Format', () => {
  const stories = CONCEPTS.map((c) => ({
    id: c.id,
    story: buildStory(fullDeck(), SITE, { conceptId: c.id }),
  }));

  it('baut aus vollständigen Daten für alle vier Formate eine Geschichte', () => {
    for (const { id, story } of stories) {
      expect(story, `${id} sollte bauen können`).not.toBeNull();
    }
  });

  it('beginnt mit dem Haken, niemals mit einem Marken-Intro', () => {
    // Regel 1 der Dramaturgie: Die ersten 1,5 Sekunden entscheiden. Ein
    // Logo am Anfang hat den ersten Reel-Aufbau Reichweite gekostet.
    for (const { id, story } of stories) {
      expect(story!.scenes[0].kind, `${id}`).toBe('hook');
      expect(story!.scenes[0].seconds).toBeLessThanOrEqual(2.5);
    }
  });

  it('endet mit der Marke', () => {
    for (const { id, story } of stories) {
      expect(story!.scenes.at(-1)!.kind, `${id}`).toBe('outro');
    }
  });

  it('stellt vor den Abspann eine Einordnung', () => {
    // Regel 4: Einordnung statt Rohdaten — sonst ist es eine Tabelle mit Musik.
    for (const { id, story } of stories) {
      expect(story!.scenes.at(-2)!.kind, `${id}`).toBe('insight');
    }
  });

  it('nummeriert Karten lückenlos und meldet die richtige Gesamtzahl', () => {
    for (const { id, story } of stories) {
      const scenes = cardScenes(story!);
      expect(scenes.length, `${id} braucht Kartenszenen`).toBeGreaterThan(0);
      const distinctRanks = [...new Set(scenes.map((s) => s.rank))].sort((a, b) => a - b);
      expect(distinctRanks, `${id}`).toEqual(
        Array.from({ length: distinctRanks.length }, (_, i) => i + 1),
      );
      for (const s of scenes) expect(s.total, `${id}`).toBe(distinctRanks.length);
    }
  });

  it('gibt jeder Szene eine positive, endliche Dauer', () => {
    for (const { id, story } of stories) {
      for (const s of story!.scenes) {
        expect(s.seconds, `${id}/${s.kind}`).toBeGreaterThan(0);
        expect(Number.isFinite(s.seconds)).toBe(true);
      }
    }
  });

  it('bleibt insgesamt in der Reel-Länge (unter 60 s)', () => {
    for (const { id, story } of stories) {
      const total = story!.scenes.reduce((sum, s) => sum + s.seconds, 0);
      expect(total, `${id}`).toBeLessThan(60);
      expect(total, `${id}`).toBeGreaterThan(8);
    }
  });

  it('verwendet nur echte Kartenbilder', () => {
    for (const { id, story } of stories) {
      for (const s of cardScenes(story!)) {
        expect(s.card.imageUrl, `${id}`).toMatch(/^https:\/\//);
      }
    }
  });
});

describe('Captions', () => {
  const stories = CONCEPTS.map((c) => ({
    id: c.id,
    story: buildStory(fullDeck(), SITE, { conceptId: c.id })!,
  }));

  it('trägt den Link mit der Kampagne des jeweiligen Formats', () => {
    for (const { id, story } of stories) {
      expect(story.caption).toContain(`${SITE}?utm_source=instagram&utm_medium=reel&utm_campaign=${id}`);
    }
  });

  it('enthält keine Kaufaufforderung', () => {
    // Content-Tonalität (CLAUDE.md): Beobachtung und Einordnung, nie Empfehlung.
    const verboten = /\b(jetzt kaufen|kaufenswert|Pflichtkauf|Kaufempfehlung|ich empfehle|solltest du kaufen)\b/i;
    for (const { id, story } of stories) {
      expect(story.caption, `${id}`).not.toMatch(verboten);
    }
  });

  it('spricht nie in der ersten Person Singular über sich selbst', () => {
    for (const { id, story } of stories) {
      expect(story.caption, `${id}`).not.toMatch(/\bIch\b|\bmeine Meinung\b/i);
    }
  });

  it('endet mit Hashtags', () => {
    for (const { id, story } of stories) {
      expect(story.caption.trimEnd(), `${id}`).toMatch(/#Kartenpreise$/);
      expect(story.caption).toContain('#PokemonTCG');
    }
  });

  it('nennt Preise in deutscher Schreibweise', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'teuerste-im-set' })!;
    // formatEur liefert „200,00 €" mit geschütztem Leerzeichen (U+00A0).
    expect(story.caption).toMatch(/\d+,\d{2} €/);
    expect(story.caption).not.toMatch(/\d+\.\d{2} ?€/);
  });

  it('nennt Prozentwerte in deutscher Schreibweise mit Vorzeichen', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'top-mover' })!;
    expect(story.caption).toMatch(/\+21,4 %/);
  });
});

describe('Zu dünne Datenlage — jedes Format muss null liefern', () => {
  it('top-mover braucht mindestens drei bewegte Karten', () => {
    const zwei = fullDeck().slice(0, 2);
    expect(buildStory(zwei, SITE, { conceptId: 'top-mover' })).toBeNull();
  });

  it('top-mover ignoriert Karten ohne Bewegung', () => {
    const flach = fullDeck().map((c) => ({ ...c, trendPercent: 0 }));
    expect(buildStory(flach, SITE, { conceptId: 'top-mover' })).toBeNull();
  });

  it('preis-check braucht drei Karten', () => {
    expect(buildStory(fullDeck().slice(0, 2), SITE, { conceptId: 'preis-check' })).toBeNull();
  });

  it('teuerste-im-set braucht vier Karten', () => {
    expect(buildStory(fullDeck().slice(0, 3), SITE, { conceptId: 'teuerste-im-set' })).toBeNull();
  });

  it('dreissig-tage braucht echte Cardmarket-Durchschnitte', () => {
    // Ohne cmPrices gibt es keine reale Abweichung — dann lieber kein Reel,
    // statt eine Kennzahl zu erfinden.
    const ohneCm = fullDeck().map(({ cmPrices: _cm, ...rest }) => rest as PokemonCard);
    expect(buildStory(ohneCm, SITE, { conceptId: 'dreissig-tage' })).toBeNull();
  });

  it('verwirft Karten ohne Bild oder ohne Preis', () => {
    const kaputt = fullDeck().map((c, i) =>
      i % 2 === 0 ? { ...c, imageUrl: '' } : { ...c, prices: {} },
    );
    for (const concept of CONCEPTS) {
      expect(buildStory(kaputt, SITE, { conceptId: concept.id }), concept.id).toBeNull();
    }
  });

  it('liefert bei leerer Kartenliste für jedes Format null', () => {
    for (const concept of CONCEPTS) {
      expect(buildStory([], SITE, { conceptId: concept.id }), concept.id).toBeNull();
    }
    expect(buildStory([], SITE)).toBeNull();
  });
});

describe('Format-Rotation', () => {
  it('zählt Kalenderwochen aufsteigend', () => {
    const kw1 = weekIndex(new Date('2026-01-05T00:00:00Z'));
    const kw2 = weekIndex(new Date('2026-01-12T00:00:00Z'));
    expect(kw2).toBe(kw1 + 1);
  });

  it('liefert für jeden Tag einer Woche denselben Index', () => {
    // Montag bis Sonntag derselben Woche. Die frühere Rechnung ab 1. Januar
    // legte die Grenze auf einen beliebigen Wochentag und wechselte das
    // Format mitten in der Woche.
    const montag = weekIndex(new Date('2026-03-02T00:00:00Z'));
    for (let d = 2; d <= 8; d++) {
      expect(weekIndex(new Date(Date.UTC(2026, 2, d, 23, 59)))).toBe(montag);
    }
    expect(weekIndex(new Date('2026-03-09T00:00:00Z'))).toBe(montag + 1);
  });

  it('wählt innerhalb derselben Woche immer dasselbe Format', () => {
    const montag = new Date('2026-03-02T08:00:00Z');
    const freitag = new Date('2026-03-06T20:00:00Z');
    const sonntag = new Date('2026-03-08T23:00:00Z');
    const a = buildStory(fullDeck(), SITE, { now: montag })!;
    const b = buildStory(fullDeck(), SITE, { now: freitag })!;
    const c = buildStory(fullDeck(), SITE, { now: sonntag })!;
    expect(a.conceptId).toBe(b.conceptId);
    expect(a.conceptId).toBe(c.conceptId);
  });

  it('wechselt über vier aufeinanderfolgende Wochen durch alle Formate', () => {
    const ids = new Set<string>();
    for (let w = 0; w < CONCEPTS.length; w++) {
      const now = new Date(Date.UTC(2026, 2, 2 + w * 7));
      ids.add(buildStory(fullDeck(), SITE, { now })!.conceptId);
    }
    expect(ids.size).toBe(CONCEPTS.length);
  });

  it('nimmt das nächste Format, wenn das der Woche nicht bauen kann', () => {
    // Ohne cmPrices scheidet dreissig-tage aus — es darf trotzdem ein Reel
    // entstehen (lieber ein anderes Format als keins).
    const ohneCm = fullDeck().map(({ cmPrices: _cm, ...rest }) => rest as PokemonCard);
    for (let w = 0; w < 8; w++) {
      const now = new Date(Date.UTC(2026, 2, 2 + w * 7));
      const story = buildStory(ohneCm, SITE, { now });
      expect(story, `Woche ${w}`).not.toBeNull();
      expect(story!.conceptId).not.toBe('dreissig-tage');
    }
  });

  it('lässt sich manuell auf ein Format festlegen', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'preis-check' })!;
    expect(story.conceptId).toBe('preis-check');
  });

  it('gibt bei unbekanntem Format null zurück statt still zu rotieren', () => {
    // Ein Tippfehler im Studio soll auffallen, nicht heimlich etwas anderes posten.
    expect(buildStory(fullDeck(), SITE, { conceptId: 'gibt-es-nicht' })).toBeNull();
  });

  it('hat eindeutige Format-Kennungen', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Format-Eigenheiten', () => {
  it('preis-check zeigt jede Karte zweimal: verdeckt, dann aufgelöst', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'preis-check' })!;
    const quiz = story.scenes.filter((s) => s.kind === 'quiz');
    const reveal = story.scenes.filter((s) => s.kind === 'reveal');
    expect(quiz).toHaveLength(3);
    expect(reveal).toHaveLength(3);
    // Direkt aufeinanderfolgend und dieselbe Karte — sonst löst das Quiz
    // die falsche Karte auf.
    for (let i = 0; i < quiz.length; i++) {
      const qi = story.scenes.indexOf(quiz[i]);
      expect(story.scenes[qi + 1]).toBe(reveal[i]);
      expect(reveal[i]).toMatchObject({ card: (quiz[i] as { card: unknown }).card });
    }
  });

  it('top-mover sortiert nach der Stärke der Bewegung, nicht nach Vorzeichen', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'top-mover' })!;
    const werte = cardScenes(story).map((s) => Math.abs(s.card.trendPercent));
    expect(werte).toEqual([...werte].sort((a, b) => b - a));
    // Die stärkste Bewegung im Testsatz ist +21,4 — Verluste dürfen mitkommen.
    expect(werte[0]).toBeCloseTo(21.4, 5);
    expect(cardScenes(story).some((s) => s.card.trendPercent < 0)).toBe(true);
  });

  it('teuerste-im-set sortiert absteigend nach Preis', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'teuerste-im-set' })!;
    const preise = cardScenes(story).map((s) => s.card.price);
    expect(preise).toEqual([...preise].sort((a, b) => b - a));
  });

  it('dreissig-tage rechnet die Abweichung aus echten Feldern', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'dreissig-tage' })!;
    const scenes = cardScenes(story);
    // Alpha: trend 200 gegen avg30 150 → +33,33 %
    const alpha = scenes.find((s) => s.card.name === 'Alpha DE');
    expect(alpha).toBeDefined();
    expect(alpha!.card.trendPercent).toBeCloseTo(33.333, 2);
  });

  it('dreissig-tage kennzeichnet die Kennzahl als 30-Tage-Vergleich', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'dreissig-tage' })!;
    for (const s of cardScenes(story)) {
      if (s.kind === 'card') expect(s.metric).toBe('change30');
    }
  });

  it('teuerste-im-set nennt das Set im Titel und im Haken', () => {
    const story = buildStory(fullDeck(), SITE, { conceptId: 'teuerste-im-set' })!;
    expect(story.title).toContain('Test-Set');
    const hook = story.scenes[0] as Extract<ReelScene, { kind: 'hook' }>;
    expect(hook.headline).toContain('Test-Set');
  });

  it('teuerste-im-set wählt das am stärksten vertretene Set', () => {
    const gemischt = [
      ...fullDeck(),
      card({ id: '9', set: 'Klein-Set', prices: { market: 999 } }),
    ];
    const story = buildStory(gemischt, SITE, { conceptId: 'teuerste-im-set' })!;
    expect(story.title).toContain('Test-Set');
    expect(cardScenes(story).every((s) => s.card.set === 'Test-Set')).toBe(true);
  });
});
