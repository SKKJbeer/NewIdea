import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  marktLageText, trendKarten, AUSBLICK_REGELN, LEERE_LAGE, setBewegungen, istModern, versiegeltFuerText, wertVorWoche,
  SET_MIN_KARTEN, relevanteBewegungen, ohneDuenneAusreisser, type MarktLage,
} from '@/lib/markt-lage';
import { ohneUeberschriften } from '@/lib/ai-generator';
import { zuletztGezeigt } from '@/lib/instagram-autopilot';
import { besteKarte } from '@/lib/article-generator';
import { Prose } from '@/components/Prose';
import type { PokemonCard } from '@/types';
import type { NeuheitenDatei } from '@/lib/neuheiten';

// AUTOMATISCHE BERICHTE MIT ECHTEN TRENDS — Nutzer-Auftrag 28.09.2026:
// „stelle sicher, dass die automatisierten Berichte auch Trends und Ausblicke
// mit wirklich aktuellen Trends generieren". Vorher liefen Artikel, Newsletter
// und Studio-Texte über eine feste Set-Liste von 2023/24 mit alten Preisen,
// und der Marktbericht sah zehn Karten ohne Index, Sets oder Neuheiten.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const JETZT = Date.parse('2026-09-28T12:00:00Z');

const karte = (id: string, name: string, set: string, trend: number, preis = 20): PokemonCard =>
  ({ id, name, set, setCode: id.split('-')[0], rarity: 'Rare', imageUrl: `https://x/${id}.png`, prices: { market: preis }, trendPercent: trend, realData: true }) as PokemonCard;

const NEU = {
  stand: '2026-09-28T00:47:59.000Z',
  sets: [{
    setCode: 'me55', name: '30th Celebration', datum: '2026-09-16', gesamt: 161, zugeordnet: 85, erweiterung: 6601,
    versiegelt: [{ produkt: 2, name: '30th Celebration Elite Trainer Box', art: null, preis: { trend: 139.17, avg: null, low: null, avg7: null, avg30: 120 } }],
    mehrdeutig: [],
  }],
  japan: [{ id: 'M6', name: 'ストームエメラルダ', nameEn: 'Storm Emeralda', datum: '2026-07-31', gesamt: 113, versiegelt: [], karten: [{ id: 'M6-113', name: 'メガレックウザex', nameEn: 'Mega Rayquaza ex', nummer: '113', rarity: null, bild: null, preis: { trend: 386.49, avg: null, low: null, avg7: null, avg30: null } }] }],
  kommend: [],
} as unknown as NeuheitenDatei;

const LAGE: MarktLage = {
  ...LEERE_LAGE,
  stand: '2026-09-27',
  pool: [karte('sv3pt5-199', 'Charizard ex', '151', 2, 90), karte('swsh7-215', 'Umbreon VMAX', 'Evolving Skies', -1, 1289)],
  bestaetigt: [
    { karte: karte('southernislands-1', 'Mew', 'Southern Islands', 193.5, 1457.53), bewegung: 193.5, preis: 1457.53, modern: false },
    { karte: karte('me55c-4', 'Charizard', '30th Celebration: Classic Collection', 18.4, 158.83), bewegung: 18.4, preis: 158.83, modern: true },
    { karte: karte('sv8-238', 'Pikachu ex', 'Surging Sparks', -12.1, 310), bewegung: -12.1, preis: 310, modern: true },
  ],
  sets: [
    { setCode: 'me5', name: 'Pitch Black', jahr: '2026', datum: '2026-07-17', karten: 88, median: 9.5, spitze: { name: 'Crushing Hammer', trend: 21 } },
    { setCode: 'sv1', name: 'Scarlet & Violet', jahr: '2023', datum: '2023-12-31', karten: 140, median: -4.2, spitze: null },
    { setCode: 'me55', name: '30th Celebration', jahr: '2026', datum: '2026-09-16', karten: 28, median: -41, spitze: null },
    { setCode: 'xy0', name: 'Kalos Starter Set', jahr: '2013', datum: '2013-11-08', karten: 29, median: 49, spitze: null },
  ],
  cbi: { wert: 3.5, karten: 14985 },
  vorwoche: { wert: 1.2, datum: '2026-09-21' },
  breite: { steigend: 8000, fallend: 6000, gesamt: 14985 },
  neuheiten: NEU,
  letzterBericht: { woche: 39, anfang: 'Mew aus Southern Islands trägt den Markt.' },
};

describe('Marktlage als Prompt-Block', () => {
  const mitPreis = marktLageText(LAGE, { preise: true, jetzt: JETZT });
  const ohnePreis = marktLageText(LAGE, { preise: false, jetzt: JETZT });

  it('nennt Index, Breite, bestätigte Bewegungen und Set-Bewegung mit Messgröße', () => {
    expect(mitPreis).toContain('Median der 30-Tage-Bewegung über 14985 Karten): +3,5 %');
    expect(mitPreis).toContain('53 % der Karten liegen über ihrem 30-Tage-Schnitt');
    expect(mitPreis).toMatch(/Moderne Sets.*bestätigte Aufwärtsbewegungen.*Charizard \(30th Celebration: Classic Collection\) \+18,4 %/);
    expect(mitPreis).toMatch(/Moderne Sets, bestätigte Abwärtsbewegungen.*Pikachu ex.*-12,1 %/);
    expect(mitPreis).toContain('eine Woche zuvor (2026-09-21) stand er bei +1,2 %');
    expect(mitPreis).toMatch(/Moderne Sets mit der stärksten 30-Tage-Bewegung.*Pitch Black \(2026\) \+9,5 % über 88 Karten/);
    expect(mitPreis).toMatch(/Moderne Sets mit der schwächsten 30-Tage-Bewegung.*Scarlet & Violet \(2023\) -4,2 %/);
    // Junges Set: Hinweis, dass der 30-Tage-Schnitt die Starttage enthält
    expect(mitPreis).toMatch(/30th Celebration \(2026\) -41,0 % über 28 Karten \[erst 12 Tage im Handel/);
    // Alte Sets getrennt und nicht unter „Moderne Sets"
    expect(mitPreis).toMatch(/Ältere Sets, auffälligste Bewegung.*Kalos Starter Set \(2013\) \+49,0/);
    expect(mitPreis).not.toMatch(/Moderne Sets mit der stärksten[^\n]*Kalos/);
  });

  it('nennt Neuheiten, Japan-Vorlauf und ehrlich „keine angekündigten Sets"', () => {
    expect(mitPreis).toContain('Neues Set „30th Celebration“ (me55), erschienen am 2026-09-16, vor 12 Tagen');
    expect(mitPreis).toContain('30th Celebration Elite Trainer Box, 139,17 € (30 Tage +16,0 %)');
    expect(mitPreis).toContain('Bereits in Japan erschienen: „Storm Emeralda“ (M6)');
    expect(mitPreis).toContain('Angekündigte englische Sets mit Erscheinungsdatum: keine in den Quellen');
  });

  it('für Artikel ohne Euro-Beträge (keine Preise im Fließtext), Prozente bleiben', () => {
    expect(ohnePreis).not.toMatch(/€/);
    expect(ohnePreis).toContain('+18,4 %');
  });

  it('ohne jede Quelle kein Block (nichts erfinden)', () => {
    expect(marktLageText(LEERE_LAGE, { preise: true })).toBe('');
  });

  it('Ausblick-Regeln verbieten Prognosen, erfundene Termine und Kaufempfehlungen', () => {
    expect(AUSBLICK_REGELN).toMatch(/Preisprognosen/);
    expect(AUSBLICK_REGELN).toMatch(/erfundene Erscheinungstermine/);
    expect(AUSBLICK_REGELN).toMatch(/Kaufempfehlungen/);
    expect(AUSBLICK_REGELN).toMatch(/nie „diese Woche"/);
  });
});

describe('Relevanz statt Ausreißer (Probelauf 28.09.2026)', () => {
  const text = marktLageText(LAGE, { preise: true, jetzt: JETZT });
  it('Klassiker getrennt und extreme Ausschläge als dünn gehandelt markiert', () => {
    expect(text).toMatch(/Klassiker \(ältere Sets\), bestätigte Aufwärtsbewegungen: Mew \(Southern Islands\) \+193,5.*dünn gehandelt/);
    expect(text).not.toMatch(/Moderne Sets[^\n]*Mew \(Southern Islands\)/);
  });
  it('Gedächtnis nur auf Wunsch (Marktbericht), mit Auftrag zum anderen Aufhänger', () => {
    expect(text).not.toContain('LETZTER BERICHT');
    const mit = marktLageText(LAGE, { preise: true, gedaechtnis: true, jetzt: JETZT });
    expect(mit).toContain('LETZTER BERICHT (KW 39) begann so: „Mew aus Southern Islands trägt den Markt.“');
    expect(mit).toContain('ANDEREN Aufhänger');
  });
  it('Set-Bewegung: echter Median, Mindestmenge, ohne Pfennigkarten, Spitze erst ab 2 €', () => {
    const zeilen = [
      ...Array.from({ length: SET_MIN_KARTEN }, (_, i) => ({ setCode: 'a', setName: 'A', name: `k${i}`, preis: 5, trend: i < 11 ? 10 : -10 })),
      { setCode: 'a', setName: 'A', name: 'penny', preis: 0.2, trend: 900 },
      { setCode: 'a', setName: 'A', name: 'billig', preis: 1, trend: 60 },
      { setCode: 'a', setName: 'A', name: 'einzelverkauf', preis: 30, trend: 892.9 },
      ...Array.from({ length: SET_MIN_KARTEN - 1 }, (_, i) => ({ setCode: 'b', setName: 'B', name: `b${i}`, preis: 5, trend: 50 })),
    ];
    const r = setBewegungen(zeilen, new Map([['a', '2024/05/24']]));
    expect(r).toHaveLength(1); // B hat zu wenig Karten
    expect(r[0]).toMatchObject({ setCode: 'a', jahr: '2024', datum: '2024-05-24', karten: SET_MIN_KARTEN + 2, median: 10 });
    expect(r[0].spitze?.name).not.toBe('penny');
    expect(r[0].spitze?.name).not.toBe('billig');
    expect(r[0].spitze?.name).not.toBe('einzelverkauf'); // unbestätigte +892,9 % sind keine Spitze
  });
  it('modern = Set höchstens drei Jahre alt; unbekannt bleibt unbekannt', () => {
    const d = new Map([['neu', '2025/03/28'], ['alt', '2002/09/15']]);
    expect(istModern('neu', d, JETZT)).toBe(true);
    expect(istModern('alt', d, JETZT)).toBe(false);
    expect(istModern('x', d, JETZT)).toBeNull();
  });
  it('versiegelt ohne Cases', () => {
    const p = (name: string) => ({ produkt: 1, name, art: null, preis: { trend: 1, avg: null, low: null, avg7: null, avg30: null } });
    expect(versiegeltFuerText([p('X 10 Elite Trainer Box Case'), p('X Booster Box'), p('X Elite Trainer Box')]).map((x) => x.name)).toEqual(['X Booster Box', 'X Elite Trainer Box']);
  });
  it('Vorwoche: Wert 6–9 Tage vor dem jüngsten, sonst keiner', () => {
    const v = [{ date: '2026-09-19', value: 0.5 }, { date: '2026-09-21', value: 1.2 }, { date: '2026-09-28', value: 3.5 }];
    expect(wertVorWoche(v)).toEqual({ wert: 1.2, datum: '2026-09-21' });
    expect(wertVorWoche([{ date: '2026-09-27', value: 1 }, { date: '2026-09-28', value: 2 }])).toBeNull();
  });
});

describe('Trend-Karten', () => {
  it('bestätigte Bewegungen zuerst, dann der frische Bestand, ohne Doppelte', () => {
    const k = trendKarten({ ...LAGE, pool: [...LAGE.pool, LAGE.bestaetigt[1].karte] }, 10).map((c) => c.id);
    // moderne bestätigte zuerst, dann Klassiker, dann der Bestand — ohne Doppelte
    expect(k).toEqual(['me55c-4', 'sv8-238', 'southernislands-1', 'sv3pt5-199', 'swsh7-215']);
  });
  it('hält die Anzahl ein', () => {
    expect(trendKarten(LAGE, 1)).toHaveLength(1);
  });
});

describe('Verdrahtung', () => {
  it('niemand holt mehr Karten über die alte Set-Liste (nur Rückfall in markt-lage / Artikel)', () => {
    const erlaubt = new Set(['src/lib/pokemon-api.ts', 'src/lib/markt-lage.ts', 'src/lib/article-generator.ts']);
    const treffer = globSync('src/**/*.{ts,tsx}')
      .filter((f) => !f.includes('__tests__') && !erlaubt.has(f))
      .filter((f) => /fetchTrendingCards\(/.test(lies(f).replace(/\/\/.*$/gm, '')));
    expect(treffer).toEqual([]);
  });
  it('Marktbericht und Newsletter bekommen die Marktlage', () => {
    expect(lies('src/lib/market-report-generator.ts')).toMatch(/marktLageText\(lage, \{ preise: true, gedaechtnis: true \}\)/);
    expect(lies('src/app/api/cron/route.ts')).toMatch(/marktLageText\(lage/);
  });
  it('Marktbericht-Prompt verlangt Trends und Ausblick als Abschnitte', () => {
    const q = lies('src/lib/ai-generator.ts');
    for (const h of ['## Marktlage', '## Trends', '## Neuheiten', '## Ausblick']) expect(q).toContain(h);
    expect(q).toContain('${AUSBLICK_REGELN}');
  });
  it('Artikel mit Marktbezug bekommen die Trend-Regeln, Guides nicht', () => {
    const q = lies('src/lib/article-generator.ts');
    expect(q).toMatch(/MIT_TRENDS[^=]*= new Set\(\['markt', 'set', 'ausblick', 'rueckblick'\]\)/);
    expect(q).toMatch(/marktLageText\(lage, \{ preise: false \}\)/);
  });
});

describe('Zwischenüberschriften im Bericht', () => {
  const text = 'Der Markt stand still.\n\n## Trends\nCharizard stieg um 18,4 %.\n\n## Ausblick\n\nNeue Sets verdienen Beobachtung.';
  const html = renderToStaticMarkup(createElement(Prose, { text, dropcap: true }));

  it('„## " wird Überschrift, der Text danach bleibt Absatz', () => {
    expect(html).toMatch(/<h3[^>]*>.*Trends<\/h3>/);
    expect(html).toMatch(/<h3[^>]*>.*Ausblick<\/h3>/);
    expect(html).not.toContain('##');
    expect(html).toMatch(/<p[^>]*>.*Charizard stieg/);
  });
  it('Initial nur im ersten echten Absatz', () => {
    expect((html.match(/first-letter:float-left/g) ?? []).length).toBe(1);
  });
  it('Klartext (E-Mail, Auszüge) ohne Überschriften-Zeichen', () => {
    expect(ohneUeberschriften(text)).not.toContain('#');
    expect(ohneUeberschriften(text)).toContain('Neue Sets verdienen Beobachtung.');
  });
});

describe('Instagram: Relevanz und Gedächtnis', () => {
  const d = new Map([['sv8', '2024/11/08'], ['si', '2001/07/31']]);
  const k = (id: string, set: string, t: number) => ({ ...karte(id, id, set, t), setCode: set });
  const karten = [k('mew', 'si', 193.5), k('alt', 'si', 40), k('pika', 'sv8', 12), k('flare', 'sv8', 29.7), k('lucario', 'sv8', -16.6), k('rauschen', 'sv8', 2)];

  it('moderne Karten zuerst, dünn gehandelte Klassiker-Ausreißer raus, Rauschen raus', () => {
    const r = relevanteBewegungen(karten, d, new Set(), JETZT);
    expect(r.gainers.map((c) => c.id)).toEqual(['flare', 'pika', 'alt']);
    expect(r.losers.map((c) => c.id)).toEqual(['lucario']);
  });
  it('Reel: Klassiker-Ausreißer raus, alles andere bleibt', () => {
    expect(ohneDuenneAusreisser(karten, d, JETZT).map((c) => c.id)).toEqual(['alt', 'pika', 'flare', 'lucario', 'rauschen']);
  });
  it('kürzlich Gezeigtes wird ausgelassen', () => {
    expect(relevanteBewegungen(karten, d, new Set(['flare']), JETZT).gainers[0].id).toBe('pika');
  });
  it('Gedächtnis umfasst sechs Tage', () => {
    const datei = { eintraege: [{ datum: '2026-09-20', ids: ['alt'] }, { datum: '2026-09-24', ids: ['flare'] }] };
    expect([...zuletztGezeigt(datei, '2026-09-28')]).toEqual(['flare']);
    expect(zuletztGezeigt(null, '2026-09-28').size).toBe(0);
  });
  it('gemerkt wird erst nach echter Veröffentlichung', () => {
    const q = lies('src/lib/instagram-autopilot.ts');
    const pos = q.indexOf('await merkeGezeigt(datum');
    expect(pos).toBeGreaterThan(q.indexOf('const r = await vorbereitet.veroeffentlichen(k, frist)'));
  });
});

describe('Artikelbilder: die gemeinte Karte (Probelauf: Mew Classic Collection ≠ Mew Southern Islands)', () => {
  const pool = [
    karte('si-1', 'Mew', 'Southern Islands', 193.5),
    karte('me55c-20', 'Mew', '30th Celebration: Classic Collection', -5),
    karte('base-10', 'Mewtwo', 'Base', 3),
    karte('me55c-21', 'Mew-VMAX', '30th Celebration: Classic Collection', -12),
  ];
  it('Set im Artikel entscheidet bei gleichem Namen (auch als Kurzform)', () => {
    expect(besteKarte('Mew', pool, 'Die Classic Collection bringt Mew und Glurak zurück')?.id).toBe('me55c-20');
    expect(besteKarte('Mew', pool, 'Mew aus Southern Islands steht bei +193 %')?.id).toBe('si-1');
  });
  it('exakter Name schlägt Teilstring (kein Mewtwo für „Mew")', () => {
    expect(besteKarte('Mew', [pool[2], pool[0]], '')?.id).toBe('si-1');
  });
  it('bereits verwendete Karten werden übersprungen', () => {
    expect(besteKarte('Mew', pool, 'Classic Collection', new Set(['me55c-20']))?.id).toBe('si-1');
  });
});
