import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  bauZuordnung, seltenheitWiderspricht, preiseAusVerzeichnis, verzeichnisStand, ZUORDNUNGS_REGELN,
  type Katalog, type KatalogKarte,
} from '@/lib/sprach-zuordnung';
import {
  sprachAngaben, eintragFuer, sprachpreisGate, standJung, MIN_JP_PAARE, SPRACHPREIS_MAX_TAGE,
  type ZuordnungsDatei, type PreisDatei,
} from '@/lib/sprachpreise';

// SPRACHPREISE: Nutzer-Auftrag 28.09.2026 — „die preise muessen korrekt sein
// und nie erfunden oder geraten". Jede Schranke der Zuordnung ist hier mit
// dem Fall belegt, der sie noetig gemacht hat.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

// ── Testdaten: ein kleines Set-Paar nach dem Muster 151 ↔ SV2a ────────────

const k = (id: string, set: string, name: string, ill: string | null, rarity: string | null, produkt: number | null): KatalogKarte =>
  ({ id, set, name, illustrator: ill, rarity, produkt });

/** Metakarte = Name + Attacken; hier nach Namen vergeben. */
const META = new Map<number, number>([
  [101, 1], [102, 2], [103, 3], [104, 4], [105, 1], [106, 5],
  [201, 1], [202, 2], [203, 3], [204, 4], [206, 5],
  [301, 1],
]);

function en(zusatz: KatalogKarte[] = [], sets: Katalog['sets'] = {}): Katalog {
  return {
    sets: { sv035: { id: 'sv035', name: '151', datum: '2023-09-22', fehlend: 0 }, ...sets },
    karten: [
      k('sv035-006', 'sv035', 'Charizard ex', 'PLANETA', 'Double rare', 101),
      k('sv035-010', 'sv035', 'Bulbasaur', 'Mizue', 'Common', 102),
      k('sv035-020', 'sv035', 'Pikachu', 'Kagemaru', 'Common', 103),
      k('sv035-030', 'sv035', 'Mew', 'Saya', 'Rare', 104),
      k('sv035-199', 'sv035', 'Charizard ex', 'miki kudo', 'Special illustration rare', 105),
      ...zusatz,
    ],
  };
}

function ja(zusatz: KatalogKarte[] = [], sets: Katalog['sets'] = {}): Katalog {
  return {
    sets: {
      SV2a: { id: 'SV2a', name: 'ポケモンカード151', datum: '2023-06-16', fehlend: 0 },
      ...sets,
    },
    karten: [
      k('SV2a-006', 'SV2a', 'リザードンex', 'PLANETA', 'Double rare', 201),
      k('SV2a-001', 'SV2a', 'フシギダネ', 'Mizue', 'Common', 202),
      k('SV2a-025', 'SV2a', 'ピカチュウ', 'Kagemaru', 'Common', 203),
      k('SV2a-151', 'SV2a', 'ミュウ', 'Saya', 'Rare', 204),
      k('SV2a-201', 'SV2a', 'リザードンex', 'miki kudo', 'Special illustration rare', 301),
      ...zusatz,
    ],
  };
}
// 301 hat dieselbe Metakarte wie 101/201 (Charizard ex) — der SIR-Druck.

describe('Zuordnung EN → JP: der Normalfall', () => {
  const r = bauZuordnung(en(), ja(), META);

  it('ordnet jede Karte ihrem Gegenstueck zu', () => {
    expect(r.paare.get('sv035-006')?.ziel.id).toBe('SV2a-006');
    expect(r.paare.get('sv035-199')?.ziel.id).toBe('SV2a-201');
    expect(r.paare.get('sv035-010')?.ziel.id).toBe('SV2a-001');
    expect(r.statistik.eindeutig).toBe(5);
  });
  it('erkennt das Set-Paar', () => {
    expect(r.setPaare).toEqual([['sv035', 'SV2a']]);
  });
});

describe('Schranken — jede einzeln', () => {
  it('1: ein Produkt, das in TCGdex zwei Karten traegt, wird nie zugeordnet (Jungle 1–8)', () => {
    const r = bauZuordnung(en([k('sv035-006b', 'sv035', 'Charizard ex', 'PLANETA', 'Double rare', 101)]), ja(), META);
    expect(r.paare.has('sv035-006')).toBe(false);
    expect(r.statistik['en-produkt-doppelt']).toBe(2);
  });

  it('3: ohne Illustrator auf einer Seite keine Zuordnung', () => {
    const r = bauZuordnung(en(), ja([], {}), META);
    const ohne = bauZuordnung(
      { ...en(), karten: en().karten.map((c) => (c.id === 'sv035-030' ? { ...c, illustrator: null } : c)) },
      ja(), META,
    );
    expect(r.paare.has('sv035-030')).toBe(true);
    expect(ohne.paare.has('sv035-030')).toBe(false);
  });

  it('3: anderer Illustrator = andere Karte', () => {
    const j = ja();
    j.karten = j.karten.map((c) => (c.id === 'SV2a-151' ? { ...c, illustrator: 'Jemand anderes' } : c));
    expect(bauZuordnung(en(), j, META).paare.has('sv035-030')).toBe(false);
  });

  it('4: ein spaeterer japanischer Nachdruck faellt aus dem Zeitfenster (Ho-Oh GX → SM8b)', () => {
    // Nachdruck-Set drei Jahre spaeter mit denselben Karten
    const nach = ja(
      [
        k('X-1', 'NACH', 'リザードンex', 'PLANETA', 'Double rare', 206),
      ],
      { NACH: { id: 'NACH', name: 'Nachdruck', datum: '2026-06-01', fehlend: 0 } },
    );
    const meta = new Map(META); meta.set(206, 1);
    const r = bauZuordnung(en(), nach, meta);
    expect(r.setPaare).not.toContainEqual(['sv035', 'NACH']);
    expect(r.paare.get('sv035-006')?.ziel.id).toBe('SV2a-006');
  });

  it('4: das Fenster ist nicht aufgeweicht', () => {
    expect(ZUORDNUNGS_REGELN.FENSTER_NACH_TAGE).toBeLessThanOrEqual(60);
    expect(ZUORDNUNGS_REGELN.FENSTER_VOR_TAGE).toBeLessThanOrEqual(400);
    expect(ZUORDNUNGS_REGELN.MIN_SETPAAR_KARTEN).toBeGreaterThanOrEqual(3);
  });

  it('4: einzelne zufaellige Treffer begruenden kein Set-Paar', () => {
    const fremd = ja(
      [k('Y-1', 'EINZEL', 'ピカチュウ', 'Kagemaru', 'Common', 207)],
      { EINZEL: { id: 'EINZEL', name: 'Einzel', datum: '2023-07-01', fehlend: 0 } },
    );
    const meta = new Map(META); meta.set(207, 3);
    const r = bauZuordnung(en(), fremd, meta);
    expect(r.setPaare).not.toContainEqual(['sv035', 'EINZEL']);
  });

  it('5: Gold-Karte ↔ gewoehnliche Karte ist nie dieselbe (Crushing Hammer sm5-166 → SM5M-054)', () => {
    expect(seltenheitWiderspricht('Secret Rare', 'Uncommon')).toBe(true);
    expect(seltenheitWiderspricht('Special illustration rare', 'Common')).toBe(true);
    expect(seltenheitWiderspricht('Rare', 'Illustration rare')).toBe(false); // Gallery-Karten
    expect(seltenheitWiderspricht('Ultra Rare', 'Double rare')).toBe(false);
    expect(seltenheitWiderspricht('Shiny rare', null)).toBe(false);
    const gold = en([k('sv035-210', 'sv035', 'Bulbasaur', 'Mizue', 'Hyper rare', 106)]);
    const meta = new Map(META); meta.set(106, 2);
    const r = bauZuordnung(gold, ja(), meta);
    expect(r.paare.has('sv035-210')).toBe(false);
    // … und die gewoehnliche Karte bleibt korrekt zugeordnet
    expect(r.paare.get('sv035-010')?.ziel.id).toBe('SV2a-001');
  });

  it('6: zwei gleichwertige Kandidaten → keine Zuordnung', () => {
    const doppelt = ja([k('SV2a-152', 'SV2a', 'ミュウ', 'Saya', 'Rare', 208)]);
    const meta = new Map(META); meta.set(208, 4);
    const r = bauZuordnung(en(), doppelt, meta);
    expect(r.paare.has('sv035-030')).toBe(false);
    expect(r.statistik.mehrdeutig).toBeGreaterThanOrEqual(1);
  });

  it('6: zeigen zwei englische Karten auf dieselbe japanische, bekommt keine sie (Bijektion)', () => {
    const zweiEn = en([k('sv035-031', 'sv035', 'Mew', 'Saya', 'Rare', 109)]);
    const meta = new Map(META); meta.set(109, 4);
    const r = bauZuordnung(zweiEn, ja(), meta);
    expect(r.paare.has('sv035-030')).toBe(false);
    expect(r.paare.has('sv035-031')).toBe(false);
    expect(r.statistik['rueckwaerts-mehrdeutig']).toBe(2);
  });

  it('ein lueckenhaft eingelesenes Partner-Set sperrt das ganze englische Set', () => {
    const r = bauZuordnung(en(), ja([], { SV2a: { id: 'SV2a', name: '151', datum: '2023-06-16', fehlend: 1 } }), META);
    expect(r.paare.size).toBe(0);
    expect(r.statistik['set-lueckenhaft']).toBe(5);
  });
});

// ── Preise ──────────────────────────────────────────────────────────────────

describe('Preise aus dem offiziellen Cardmarket-Preisverzeichnis', () => {
  it('nimmt nur gesuchte Produkte mit positivem Trend — 0 ist kein Preis', () => {
    const p = preiseAusVerzeichnis(
      [
        { idProduct: 719654, trend: 350.45, avg: 382.53, low: 224.9, avg7: 348.64, avg30: 397.08 },
        { idProduct: 1, trend: 0, avg: 5 },
        { idProduct: 2, trend: 9 },
        { idProduct: 3, trend: null },
      ],
      new Set([719654, 1, 3]),
    );
    expect(Object.keys(p)).toEqual(['719654']);
    expect(p['719654']).toEqual({ trend: 350.45, avg: 382.53, low: 224.9, avg7: 348.64, avg30: 397.08 });
  });

  it('liest den Stand im Cardmarket-Format (ohne Doppelpunkt im Versatz)', () => {
    expect(verzeichnisStand('2026-09-28T02:47:59+0200')).toBe('2026-09-28T00:47:59.000Z');
    expect(verzeichnisStand('kaputt')).toBeNull();
    expect(verzeichnisStand(undefined)).toBeNull();
  });
});

const ZUORDNUNG: ZuordnungsDatei = {
  erstellt: '2026-09-28T01:40:00.000Z',
  statistik: {
    JP: { eindeutig: 5679, 'en-unvollstaendig': 0, 'en-produkt-doppelt': 0, 'set-lueckenhaft': 0, 'kein-kandidat': 0, mehrdeutig: 0, 'rueckwaerts-mehrdeutig': 0 },
    KR: { eindeutig: 40, 'en-unvollstaendig': 0, 'en-produkt-doppelt': 0, 'set-lueckenhaft': 0, 'kein-kandidat': 0, mehrdeutig: 0, 'rueckwaerts-mehrdeutig': 0 },
  },
  setPaare: { JP: [['sv03.5', 'SV2a']], KR: [] },
  karten: {
    'sv03.5-199': {
      enName: 'Charizard ex',
      enProdukt: 733794,
      JP: { id: 'SV2a-201', name: 'リザードンex', set: 'SV2a', setName: 'ポケモンカード151', produkt: 719654 },
    },
  },
};
const JETZT = Date.parse('2026-09-28T12:00:00Z');
const PREISE: PreisDatei = {
  stand: '2026-09-28T00:47:59.000Z',
  abgerufen: '2026-09-28T01:41:00.000Z',
  preise: { '719654': { trend: 350.45, avg: 382.53, low: 224.9, avg7: 348.64, avg30: 397.08 } },
};
const DEX_SETS = [{ id: 'sv03.5', name: '151' }];
const KARTE = { name: 'Charizard ex', setCode: 'sv3pt5', set: '151', number: '199' };

describe('Abfrage je Karte', () => {
  it('findet den Eintrag ueber Set, Nummer und Namensprobe', () => {
    expect(eintragFuer(KARTE, ZUORDNUNG, DEX_SETS)?.JP?.id).toBe('SV2a-201');
  });
  it('anderer Name unter derselben Nummer → kein Eintrag', () => {
    expect(eintragFuer({ ...KARTE, name: 'Blastoise ex' }, ZUORDNUNG, DEX_SETS)).toBeNull();
  });
  it('widerspricht das bekannte EN-Produkt der Karte, gibt es keinen Eintrag', () => {
    expect(eintragFuer({ ...KARTE, cmPrices: { produkt: 999 } }, ZUORDNUNG, DEX_SETS)).toBeNull();
    expect(eintragFuer({ ...KARTE, cmPrices: { produkt: 733794 } }, ZUORDNUNG, DEX_SETS)?.JP?.produkt).toBe(719654);
  });

  it('JP mit Preis und Stand, KR ohne Zuordnung', () => {
    const [jp, kr] = sprachAngaben(eintragFuer(KARTE, ZUORDNUNG, DEX_SETS), PREISE, JETZT);
    expect(jp).toMatchObject({ sprache: 'JP', ok: true, stand: PREISE.stand, preis: { trend: 350.45 } });
    expect(kr).toEqual({ sprache: 'KR', ok: false, grund: 'keine-zuordnung' });
  });
  it('ein Preisstand aelter als drei Tage wird nicht gezeigt', () => {
    const [jp] = sprachAngaben(ZUORDNUNG.karten['sv03.5-199'], PREISE, JETZT + (SPRACHPREIS_MAX_TAGE + 1) * 86_400_000);
    expect(jp).toEqual({ sprache: 'JP', ok: false, grund: 'veraltet' });
  });
  it('zugeordnet, aber ohne Preis im Verzeichnis → kein Preis', () => {
    const [jp] = sprachAngaben(ZUORDNUNG.karten['sv03.5-199'], { ...PREISE, preise: {} }, JETZT);
    expect(jp).toEqual({ sprache: 'JP', ok: false, grund: 'kein-preis' });
  });
  it('ungueltiger Stand ist nie jung (Stolperstelle 46)', () => {
    expect(standJung('kaputt', JETZT)).toBe(false);
  });
});

describe('Qualitaetsschranke', () => {
  it('haelt mit Zuordnung, jungem Stand und Preisen', () => {
    expect(sprachpreisGate(ZUORDNUNG, PREISE, JETZT).ok).toBe(true);
  });
  it('faellt ohne Zuordnung, ohne Preise, bei altem Stand, bei zu wenigen Paaren', () => {
    expect(sprachpreisGate(null, PREISE, JETZT).ok).toBe(false);
    expect(sprachpreisGate(ZUORDNUNG, null, JETZT).ok).toBe(false);
    expect(sprachpreisGate(ZUORDNUNG, PREISE, JETZT + 5 * 86_400_000).ok).toBe(false);
    const klein = { ...ZUORDNUNG, statistik: { ...ZUORDNUNG.statistik, JP: { ...ZUORDNUNG.statistik.JP, eindeutig: MIN_JP_PAARE - 1 } } };
    expect(sprachpreisGate(klein, PREISE, JETZT).ok).toBe(false);
  });
  it('faellt, wenn die Haelfte der Produkte keinen Preis hat', () => {
    expect(sprachpreisGate(ZUORDNUNG, { ...PREISE, preise: {} }, JETZT).ok).toBe(false);
  });
});

describe('Verankerung', () => {
  it('eigener taeglicher Cron, der bei Verstoss 500 meldet', () => {
    const crons = (JSON.parse(lies('vercel.json')) as { crons: Array<{ path: string }> }).crons;
    expect(crons.some((c) => c.path === '/api/cron/sprachen')).toBe(true);
    const route = lies('src/app/api/cron/sprachen/route.ts');
    expect(route).toMatch(/status: lauf\.gate\.ok \? 200 : 500/);
    expect(route).toMatch(/isCronAuthedFromRequest/);
  });

  it('ein Neuaufbau mit zu wenigen Paaren ersetzt die alte Zuordnung nicht', () => {
    const src = lies('src/lib/sprachpreise.ts');
    expect(src).toMatch(/if \(paare >= MIN_JP_PAARE\) \{\s*await schreibeJson\(PFAD_ZUORDNUNG/);
  });

  it('kein Namensraten mehr bei der Cardmarket-API', () => {
    const src = lies('src/lib/cardmarket-api.ts');
    expect(src).not.toMatch(/products\/find/);
    expect(src).toMatch(/export async function fetchCMLanguagePrice\(\s*idProduct: number/);
  });

  it('die Kartenseite zeigt keinen EN-Preis unter JP/KR-Beschriftung', () => {
    const src = lies('src/components/CardLangPrice.tsx');
    expect(src).not.toMatch(/fetch\(/);
    expect(src).toMatch(/price = null;/);
  });

  it('die Aufschluesselung folgt der Sprachwahl — keine EN-Werte unter JP (Befund iPhone 28.09.)', () => {
    const seite = lies('src/app/karten/[id]/page.tsx');
    expect(seite).toContain('<SprachwahlProvider>');
    expect(seite).toMatch(/<CmAufschluesselung[\s\S]*sprachen=\{sprachen\}/);
    // Die frühere, fest englische Aufschlüsselung steht nicht mehr in der Seite
    expect(seite).not.toContain('card.cmPrices.avgSell');
    // EN-gemessene Abschnitte sind bei JP/KR gekennzeichnet
    expect(seite.match(/<NurEnDe>/g)?.length).toBeGreaterThanOrEqual(2);
    expect(lies('src/components/CardLangPrice.tsx')).toMatch(/useSprachwahl\(\)/);
  });

  it('die Suche ersetzt Preise nur durch echte Sprachpreise', () => {
    expect(lies('src/components/SearchResultsLang.tsx')).toMatch(/d\.priceLanguage === language\) overrides/);
  });
});
