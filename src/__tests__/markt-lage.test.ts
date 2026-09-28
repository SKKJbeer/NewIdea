import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { marktLageText, trendKarten, AUSBLICK_REGELN, type MarktLage } from '@/lib/markt-lage';
import { ohneUeberschriften } from '@/lib/ai-generator';
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
  stand: '2026-09-27',
  pool: [karte('sv3pt5-199', 'Charizard ex', '151', 2, 90), karte('swsh7-215', 'Umbreon VMAX', 'Evolving Skies', -1, 1289)],
  bestaetigt: [
    { karte: karte('me55c-4', 'Charizard', '30th Celebration: Classic Collection', 18.4, 158.83), bewegung: 18.4, preis: 158.83 },
    { karte: karte('sv8-238', 'Pikachu ex', 'Surging Sparks', -12.1, 310), bewegung: -12.1, preis: 310 },
  ],
  sets: [
    { code: 'me5', name: 'Pitch Black', count: 30, medianPrice: 3, avgTrend: 9.5, topMover: { name: 'Crushing Hammer', trend: 21 } },
    { code: 'sv1', name: 'Scarlet & Violet', count: 40, medianPrice: 1, avgTrend: -4.2, topMover: null },
  ],
  cbi: { wert: 3.5, karten: 14985 },
  breite: { steigend: 8000, fallend: 6000, gesamt: 14985 },
  neuheiten: NEU,
};

describe('Marktlage als Prompt-Block', () => {
  const mitPreis = marktLageText(LAGE, { preise: true, jetzt: JETZT });
  const ohnePreis = marktLageText(LAGE, { preise: false, jetzt: JETZT });

  it('nennt Index, Breite, bestätigte Bewegungen und Set-Bewegung mit Messgröße', () => {
    expect(mitPreis).toContain('Median der 30-Tage-Bewegung über 14985 Karten): +3,5 %');
    expect(mitPreis).toContain('53 % der Karten liegen über ihrem 30-Tage-Schnitt');
    expect(mitPreis).toMatch(/Bestätigte Aufwärtsbewegungen.*Charizard \(30th Celebration: Classic Collection\) \+18,4 %/);
    expect(mitPreis).toMatch(/Bestätigte Abwärtsbewegungen.*Pikachu ex.*-12,1 %/);
    expect(mitPreis).toMatch(/stärksten 30-Tage-Bewegung.*Pitch Black \+9,5 %/);
    expect(mitPreis).toMatch(/schwächsten 30-Tage-Bewegung.*Scarlet & Violet -4,2 %/);
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
    expect(marktLageText({ stand: null, pool: [], bestaetigt: [], sets: [], cbi: null, breite: null, neuheiten: null }, { preise: true })).toBe('');
  });

  it('Ausblick-Regeln verbieten Prognosen, erfundene Termine und Kaufempfehlungen', () => {
    expect(AUSBLICK_REGELN).toMatch(/Preisprognosen/);
    expect(AUSBLICK_REGELN).toMatch(/erfundene Erscheinungstermine/);
    expect(AUSBLICK_REGELN).toMatch(/Kaufempfehlungen/);
    expect(AUSBLICK_REGELN).toMatch(/nie „diese Woche"/);
  });
});

describe('Trend-Karten', () => {
  it('bestätigte Bewegungen zuerst, dann der frische Bestand, ohne Doppelte', () => {
    const k = trendKarten({ ...LAGE, pool: [...LAGE.pool, LAGE.bestaetigt[0].karte] }, 10).map((c) => c.id);
    expect(k).toEqual(['me55c-4', 'sv8-238', 'sv3pt5-199', 'swsh7-215']);
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
    expect(lies('src/lib/market-report-generator.ts')).toMatch(/generateMarketSummary\([^)]*marktLageText\(lage/);
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
