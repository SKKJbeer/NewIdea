import { describe, it, expect } from 'vitest';
import { buildNewsletterHtml } from '@/lib/newsletter-template';
import {
  parseWatchlist,
  isWatched,
  toggleWatch,
  watchChange,
  type WatchlistItem,
} from '@/lib/watchlist';
import type { PokemonCard } from '@/types';

// Zwei Bereiche, die bisher gar nicht (Newsletter) bzw. nur oberflächlich
// (Merkliste) geprüft waren. Beim Newsletter geht es zusätzlich um rechtliche
// Pflichten: Affiliate-Kennzeichnung und ein funktionierender Abmeldeweg.

// ── Newsletter ──────────────────────────────────────────────────────────────

const DATEN = {
  subject: 'Wochenanalyse',
  intro: 'Der Markt hat sich diese Woche bewegt.',
  cardHighlights: [
    { name: 'Charizard ex', set: 'Obsidian Flames', price: '235,71 €', trend: '+12,3 %', score: 82, reason: 'Starke Nachfrage.' },
    { name: 'Pikachu ex', set: 'Paldea Evolved', price: '48,00 €', trend: '-4,1 %', score: 55, reason: 'Ruhige Woche.' },
  ],
  tip: 'Der 30-Tage-Schnitt sagt mehr als ein einzelner Tag.',
  tipTitle: 'Beobachtung',
  ctaText: '',
};

const KARTEN: PokemonCard[] = [
  {
    id: 'obf-125',
    name: 'Charizard ex',
    set: 'Obsidian Flames',
    setCode: 'obf',
    rarity: 'Special Illustration Rare',
    imageUrl: 'https://images.pokemontcg.io/obf/125.png',
    prices: { market: 235.71 },
  } as PokemonCard,
];

describe('Newsletter-Vorlage — Aufbau', () => {
  const html = buildNewsletterHtml(DATEN, KARTEN);

  it('erzeugt ein vollständiges HTML-Dokument', () => {
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html.match(/<table/g)!.length).toBe(html.match(/<\/table>/g)!.length);
  });

  it('nimmt jede übergebene Karte auf', () => {
    for (const c of DATEN.cardHighlights) {
      expect(html).toContain(c.name);
      expect(html).toContain(c.set);
      expect(html).toContain(c.price);
      expect(html).toContain(c.trend);
    }
  });

  it('bindet das echte Kartenbild ein, wenn es vorliegt', () => {
    expect(html).toContain('https://images.pokemontcg.io/obf/125.png');
  });

  it('kommt ohne passendes Kartenbild aus', () => {
    // Die KI nennt gelegentlich eine Karte, die im Datensatz fehlt.
    const ohne = buildNewsletterHtml(DATEN, []);
    expect(ohne).toContain('Charizard ex');
    expect(ohne).not.toContain('<img src=""');
  });

  it('verkraftet eine leere Kartenliste', () => {
    const leer = buildNewsletterHtml({ ...DATEN, cardHighlights: [] }, []);
    expect(leer).toContain('<html');
    expect(leer.length).toBeGreaterThan(500);
  });
});

describe('Newsletter-Vorlage — rechtliche Pflichten', () => {
  const html = buildNewsletterHtml(DATEN, KARTEN);

  it('kennzeichnet jeden Affiliate-Link technisch korrekt', () => {
    // Pflicht laut CLAUDE.md: rel="noopener noreferrer sponsored".
    const links = html.match(/<a [^>]*href="https?:\/\/(www\.)?(cardmarket|amazon)[^"]*"[^>]*>/g) ?? [];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link, link).toContain('sponsored');
      expect(link, link).toContain('noopener');
    }
  });

  it('weist sichtbar auf die Affiliate-Links hin', () => {
    expect(html).toContain('Affiliate-Link');
  });

  it('führt einen echten Abmeldeweg statt eines toten Links', () => {
    // Ein `href="#"` beim Abmelden ist nicht nur unhöflich — der Widerspruch
    // muss tatsächlich möglich sein.
    const fusszeile = html.slice(html.indexOf('Abmelden') - 200, html.indexOf('Abmelden') + 400);
    expect(fusszeile).not.toMatch(/<a href="#"/);
    expect(fusszeile).toContain('/datenschutz');
    expect(fusszeile).toContain('/impressum');
  });

  it('enthält den Haftungsausschluss', () => {
    expect(html).toContain('kein Finanzberater');
    expect(html).toContain('ohne Gewähr');
  });
});

describe('Newsletter-Vorlage — Tonalität und Zeichen', () => {
  const html = buildNewsletterHtml({ ...DATEN, ctaText: '' }, KARTEN);

  it('fordert nicht zum Kauf auf', () => {
    // Content-Tonalität: Beobachtung und Einordnung, nie Empfehlung.
    expect(html).not.toMatch(/jetzt kaufen|Deals sichern|kaufenswert|Pflichtkauf/i);
  });

  it('nutzt keine Emojis in den Schaltflächen', () => {
    // Icon-Regel seit v2.16.0. Sprach-Flaggen wären erlaubt, hier kommen keine vor.
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/u;
    expect(emoji.test(html), 'Emoji im Newsletter gefunden').toBe(false);
  });

  it('übernimmt einen mitgelieferten Aufruftext', () => {
    const eigener = buildNewsletterHtml({ ...DATEN, ctaText: 'Zur Wochenanalyse' }, KARTEN);
    expect(eigener).toContain('Zur Wochenanalyse');
  });
});

// ── Merkliste ───────────────────────────────────────────────────────────────

function item(over: Partial<WatchlistItem> & { cardId: string }): WatchlistItem {
  return {
    cardName: 'Karte',
    setName: 'Set',
    setCode: 'st',
    imageUrl: 'https://images.pokemontcg.io/st/1.png',
    priceAtAdd: 100,
    addedAt: '2026-07-01',
    ...over,
  };
}

describe('parseWatchlist — beschädigte Daten', () => {
  it('gibt bei einem JSON-Objekt statt einer Liste eine leere Liste zurück', () => {
    expect(parseWatchlist('{"cardId":"a"}')).toEqual([]);
  });

  it('verwirft Einträge mit falschen Feldtypen', () => {
    const roh = JSON.stringify([
      { cardId: 'gut', cardName: 'Karte' },
      { cardId: 123, cardName: 'Zahl-ID' },
      { cardId: 'ohne-namen' },
      null,
      'text',
    ]);
    const liste = parseWatchlist(roh);
    expect(liste.map((i) => i.cardId)).toEqual(['gut']);
  });

  it('behält die gespeicherte Reihenfolge', () => {
    const roh = JSON.stringify([item({ cardId: 'c' }), item({ cardId: 'a' }), item({ cardId: 'b' })]);
    expect(parseWatchlist(roh).map((i) => i.cardId)).toEqual(['c', 'a', 'b']);
  });

  it('gibt bei leerem oder kaputtem Rohwert eine leere Liste zurück', () => {
    for (const roh of [null, '', '{', 'null', '[', 'undefined']) {
      expect(parseWatchlist(roh), String(roh)).toEqual([]);
    }
  });
});

describe('toggleWatch', () => {
  it('setzt eine neue Karte an den Anfang', () => {
    const liste = [item({ cardId: 'alt' })];
    const neu = toggleWatch(liste, item({ cardId: 'neu' }));
    expect(neu.map((i) => i.cardId)).toEqual(['neu', 'alt']);
  });

  it('entfernt eine bereits beobachtete Karte', () => {
    const liste = [item({ cardId: 'a' }), item({ cardId: 'b' })];
    expect(toggleWatch(liste, item({ cardId: 'a' })).map((i) => i.cardId)).toEqual(['b']);
  });

  it('verändert die übergebene Liste nicht', () => {
    const liste = [item({ cardId: 'a' })];
    toggleWatch(liste, item({ cardId: 'b' }));
    expect(liste).toHaveLength(1);
  });

  it('führt zweimaliges Umschalten auf den Ausgangszustand zurück', () => {
    const liste = [item({ cardId: 'a' })];
    const neu = item({ cardId: 'b' });
    expect(toggleWatch(toggleWatch(liste, neu), neu)).toEqual(liste);
  });

  it('legt keine Karte doppelt an, auch bei abweichenden Nebendaten', () => {
    // Der Preis beim Vormerken kann sich unterscheiden — entscheidend ist die ID.
    const liste = [item({ cardId: 'a', priceAtAdd: 100 })];
    const ergebnis = toggleWatch(liste, item({ cardId: 'a', priceAtAdd: 250 }));
    expect(ergebnis).toHaveLength(0);
  });
});

describe('isWatched', () => {
  it('erkennt eine vorgemerkte Karte', () => {
    expect(isWatched([item({ cardId: 'a' })], 'a')).toBe(true);
  });

  it('unterscheidet ähnliche IDs', () => {
    expect(isWatched([item({ cardId: 'sv3pt5-25' })], 'sv3pt5-2')).toBe(false);
    expect(isWatched([item({ cardId: 'sv3pt5-25' })], 'SV3PT5-25')).toBe(false);
  });

  it('gibt bei leerer Liste false zurück', () => {
    expect(isWatched([], 'a')).toBe(false);
  });
});

describe('watchChange', () => {
  it('rechnet Gewinn und Verlust korrekt', () => {
    expect(watchChange(100, 125)).toEqual({ abs: 25, pct: 25 });
    expect(watchChange(200, 150)).toEqual({ abs: -50, pct: -25 });
  });

  it('gibt ohne Startpreis null zurück statt unendlich', () => {
    // Ohne diesen Schutz stünde in der Merkliste „Infinity %".
    expect(watchChange(0, 120)).toBeNull();
    expect(watchChange(-5, 120)).toBeNull();
  });

  it('gibt ohne aktuellen Preis null zurück', () => {
    expect(watchChange(100, 0)).toBeNull();
  });

  it('meldet bei unverändertem Preis null Prozent, nicht null', () => {
    expect(watchChange(100, 100)).toEqual({ abs: 0, pct: 0 });
  });

  it('bleibt bei sehr kleinen Startpreisen endlich', () => {
    const r = watchChange(0.01, 500)!;
    expect(Number.isFinite(r.pct)).toBe(true);
    expect(r.pct).toBeCloseTo(4999900, 0);
  });
});
