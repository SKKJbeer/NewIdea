import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  erweiterungFuerSet, kartenSchluessel, ordneKartenZu, versiegeltMitPreis, preisKarte, bewegung30, nummernGleich,
  type CmEinzel, type CmVersiegelt, type NeuKarte,
} from '@/lib/neuheiten-zuordnung';
import { neuheitenAktuell, themenKontext, ohnePreisKarten, sucheOhnePreis, druckeFuerKarte, type NeuheitenDatei } from '@/lib/neuheiten';
import { kartenNummer } from '@/lib/format';

// NEUE SETS & THEMEN: Nutzer-Auftrag 28.09.2026 — Trends, Hypes, Neuheiten
// („30 Jahre") sichtbar machen, ohne einen Preis zu raten. Jede Schranke der
// Zuordnung ist hier mit dem Fall belegt, der sie nötig gemacht hat.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

// Echtes Muster der Kataloge vom 28.09.2026: vier Erweiterungen „30th Celebration“.
const VERSIEGELT: CmVersiegelt[] = [
  { idProduct: 1, name: '30th Celebration Booster', idExpansion: 6601 },
  { idProduct: 2, name: '30th Celebration Elite Trainer Box', idExpansion: 6601 },
  { idProduct: 3, name: '30th Celebration JP Booster', idExpansion: 6602 },
  { idProduct: 4, name: '30th Celebration Simplified Chinese Booster', idExpansion: 6603 },
  { idProduct: 5, name: 'Pitch Black Booster', idExpansion: 6569 },
];

const karte = (id: string, name: string, attacken: string[] = [], faehigkeiten: string[] = []): NeuKarte => ({
  id, name, localId: id.split('-')[1] ?? id, rarity: null, bild: null, faehigkeiten, attacken,
});

describe('Erweiterung eines neuen Sets', () => {
  it('findet die internationale Erweiterung, nicht JP/Chinesisch', () => {
    expect(erweiterungFuerSet(['30th Celebration'], VERSIEGELT)).toBe(6601);
  });
  it('Schreibweisen mit Doppelpunkt zählen gleich', () => {
    expect(erweiterungFuerSet(['Mega Evolution: Pitch Black', 'Pitch Black'], VERSIEGELT)).toBe(6569);
  });
  it('kein passendes Produkt → keine Erweiterung', () => {
    expect(erweiterungFuerSet(['Unbekanntes Set'], VERSIEGELT)).toBeNull();
  });
  it('zwei internationale Erweiterungen mit gleichem Namen → null statt raten', () => {
    const doppelt = [...VERSIEGELT, { idProduct: 9, name: '30th Celebration Booster Bundle', idExpansion: 7000 }];
    expect(erweiterungFuerSet(['30th Celebration'], doppelt)).toBeNull();
  });
  it('nur JP-Produkte → null (Sprachzusatz schließt aus)', () => {
    expect(erweiterungFuerSet(['30th Celebration'], VERSIEGELT.filter((p) => p.idExpansion !== 6601))).toBeNull();
  });
});

describe('Karten → Cardmarket-Produkte', () => {
  const einzel: CmEinzel[] = [
    { idProduct: 100, name: 'Pikachu [Thunder Shock]', idExpansion: 6601 },
    { idProduct: 101, name: 'Mew ex [Genome Hacking]', idExpansion: 6601 },
    { idProduct: 102, name: 'Mew ex [Genome Hacking]', idExpansion: 6601 },
    { idProduct: 103, name: 'Professor\'s Research', idExpansion: 6601 },
    { idProduct: 200, name: 'Pikachu [Thunder Shock]', idExpansion: 6602 },
  ];
  const karten = [
    karte('30th-001', 'Pikachu', ['Thunder Shock']),
    karte('30th-050', 'Mew ex', ['Genome Hacking']),
    karte('30th-150', 'Mew ex', ['Genome Hacking']),
    karte('30th-080', "Professor's Research"),
    karte('30th-099', 'Glurak', ['Feuerwirbel']),
  ];
  const z = ordneKartenZu(karten, einzel, 6601);

  it('Schlüssel = Name [Fähigkeit | Attacke]', () => {
    expect(kartenSchluessel(karte('x-1', 'Pikachu', ['A', 'B'], ['F']))).toBe('Pikachu [F | A | B]');
    expect(kartenSchluessel(karte('x-2', 'Trainer'))).toBe('Trainer');
  });
  it('eindeutige Karte bekommt ihr Produkt, nur aus der eigenen Erweiterung', () => {
    expect(z.paare.find((p) => p.karte.id === '30th-001')?.produkt).toBe(100);
  });
  it('zwei Drucke mit identischen Attacken → mehrdeutig, KEIN Einzelpreis', () => {
    expect(z.paare.some((p) => p.karte.name === 'Mew ex')).toBe(false);
    expect(z.mehrdeutig).toEqual([{ schluessel: 'Mew ex [Genome Hacking]', karten: ['30th-050', '30th-150'], produkte: [101, 102] }]);
  });
  it('Karte ohne Produkt bleibt ohne Preis', () => {
    expect(z.ohneProdukt).toEqual(['30th-099']);
  });
  it('Trainer ohne Attacke über den Namen', () => {
    expect(z.paare.find((p) => p.karte.id === '30th-080')?.produkt).toBe(103);
  });
});

describe('TCGdex mit unvollständigen Attacken (gemessen 12.10.2026: 30th-065 Mew)', () => {
  // Cardmarket: vier Drucke „Mew [Psychic | 30C]" (normal + RGB Mew R/G/B), TCGdex nur „Psychic".
  const einzel: CmEinzel[] = [
    { idProduct: 907672, name: 'Mew [Psychic | 30C]', idExpansion: 6601 },
    { idProduct: 909509, name: 'Mew [Psychic | 30C]', idExpansion: 6601 },
    { idProduct: 909510, name: 'Mew [Psychic | 30C]', idExpansion: 6601 },
    { idProduct: 909511, name: 'Mew [Psychic | 30C]', idExpansion: 6601 },
    { idProduct: 500, name: 'Eevee [Tackle | Quick Attack]', idExpansion: 6601 },
    { idProduct: 600, name: 'Snorlax [Rest | Body Slam]', idExpansion: 6601 },
    { idProduct: 601, name: 'Snorlax [Rest | Heavy Press]', idExpansion: 6601 },
  ];
  const z = ordneKartenZu([
    karte('30th-065', 'Mew', ['Psychic']),
    karte('30th-010', 'Eevee', ['Tackle']),
    karte('30th-020', 'Snorlax', ['Rest']),
  ], einzel, 6601);

  it('eindeutige Obermenge mit mehreren Drucken → mehrdeutig mit ALLEN Preisen', () => {
    expect(z.mehrdeutig).toEqual([{ schluessel: 'Mew [Psychic | 30C]', karten: ['30th-065'], produkte: [907672, 909509, 909510, 909511] }]);
  });
  it('unvollständige Angabe begründet nie einen Einzelpreis (ein Produkt → ohne Preis)', () => {
    expect(z.paare).toEqual([]);
    expect(z.ohneProdukt).toContain('30th-010');
  });
  it('zwei passende Obermengen → keine Zuordnung', () => {
    expect(z.ohneProdukt).toContain('30th-020');
  });
  it('genau passende andere Karte behält ihre Produkte', () => {
    const z2 = ordneKartenZu([karte('a', 'Mew', ['Psychic']), karte('b', 'Mew', ['Psychic', '30C'])], einzel, 6601);
    expect(z2.mehrdeutig.map((m) => m.karten)).toEqual([['b']]);
    expect(z2.ohneProdukt).toEqual(['a']);
  });
});

describe('Preise aus dem Verzeichnis', () => {
  const preise = preisKarte([
    { idProduct: 1, trend: 6.5, avg: 6.2, low: 5, avg7: 6.4, avg30: 5.0 },
    { idProduct: 2, trend: 89.9, avg30: null },
    { idProduct: 3, trend: 0 },
    { idProduct: 5, trend: 4 },
  ]);
  it('ohne positiven Trend kein Preis', () => {
    expect(preise.has(3)).toBe(false);
    expect(preise.get(2)?.avg30).toBeNull();
  });
  it('versiegelt: nur eigene Erweiterung, teuerste zuerst', () => {
    expect(versiegeltMitPreis(VERSIEGELT, 6601, preise).map((p) => p.produkt)).toEqual([2, 1]);
  });
  it('Bewegung nur mit Ø 30', () => {
    expect(bewegung30(preise.get(1)!)).toBe(30);
    expect(bewegung30(preise.get(2)!)).toBeNull();
  });
  it('Nummern pokemontcg ↔ TCGdex', () => {
    expect(nummernGleich('015', '15')).toBe(true);
    expect(nummernGleich('CC01', 'CC1')).toBe(true);
    expect(nummernGleich('15', '16')).toBe(false);
  });
});

describe('Themen-Datei', () => {
  const jetzt = Date.parse('2026-09-28T12:00:00Z');
  const datei: NeuheitenDatei = {
    stand: '2026-09-28T02:47:59+0200',
    sets: [{
      setCode: 'me55', name: '30th Celebration', datum: '2026-09-16', gesamt: 161, zugeordnet: 85,
      erweiterung: 6601, versiegelt: [{ produkt: 2, name: '30th Celebration Elite Trainer Box', art: null, preis: { trend: 89.9, avg: null, low: null, avg7: null, avg30: null } }],
      mehrdeutig: [],
    }],
    japan: [],
    kommend: [],
  } as unknown as NeuheitenDatei;

  it('älter als 3 Tage gilt nicht als aktuell', () => {
    expect(neuheitenAktuell(datei, jetzt)).toBe(true);
    expect(neuheitenAktuell(datei, jetzt + 4 * 86_400_000)).toBe(false);
    expect(neuheitenAktuell(null, jetzt)).toBe(false);
  });
  it('Artikel-Kontext nennt das Set, aber KEINE Preiszahl', () => {
    const k = themenKontext(datei, jetzt);
    expect(k).toContain('30th Celebration');
    expect(k).not.toMatch(/\d+,\d{2}\s?€|€\s?\d|89[.,]9/);
  });
  it('veraltete Datei → kein Kontext', () => {
    expect(themenKontext(datei, jetzt + 5 * 86_400_000)).toBe('');
  });
});

describe('Verdrahtung', () => {
  it('Themen-Cron ist eingeplant und geschützt', () => {
    expect(lies('vercel.json')).toContain('/api/cron/themen');
    expect(lies('src/app/api/cron/themen/route.ts')).toMatch(/isCronAuthed|studio/i);
  });
  it('/trends steht in der Sitemap', () => {
    expect(lies('src/app/sitemap.ts')).toContain('/trends');
  });
  it('Set-Seite zeigt im Aufbau statt 404', () => {
    expect(lies('src/app/sets/[setCode]/page.tsx')).toContain('SetImAufbau');
  });
});

describe('Karten ohne Preis (Nutzer-Rückmeldung 12.10.2026: „rgb mew fehlt")', () => {
  const pt = [
    { id: 'me55-65', name: 'Mew', number: '65', imageUrl: 'b65' },
    { id: 'me55-R', name: 'Mew', number: 'R', imageUrl: 'bR' },
    { id: 'me55-G', name: 'Mew', number: 'G', imageUrl: 'bG' },
    { id: 'me55-1', name: 'Bulbasaur', number: '1', imageUrl: 'b1' },
    { id: 'me55-63', name: 'Mewtwo', number: '63', imageUrl: 'b63' },
    { id: 'me55-X', name: 'Ohne Bild', number: 'X', imageUrl: null },
  ];
  const ohne = ohnePreisKarten(pt, new Set(['me55-1']));
  const datei = {
    erstellt: '', stand: '', japan: [], kommend: [],
    sets: [{
      setCode: 'me55', dexId: '30th', name: '30th Celebration', datum: '2026-09-16', gesamt: 161, logo: null, erweiterung: 6601,
      versiegelt: [], zugeordnet: 0, ohneZuordnung: 0, indexGeschrieben: 0, ohnePreis: ohne,
      mehrdeutig: [
        { name: 'Mew', preise: [0.02, 2517.06, 2653.27, 2777.22] },
        { name: 'Pikachu ex', preise: [1.12, 38.65] },
        { name: 'Pikachu ex', preise: [1.15, 46.06] },
      ],
    }],
  } as NeuheitenDatei;

  it('nur Karten mit Bild und ohne Indexpreis, nach Nummer', () => {
    expect(ohne.map((k) => k.id)).toEqual(['me55-63', 'me55-65', 'me55-G', 'me55-R']);
  });
  it('„rgb mew" findet die Mew-Karten, nicht Mewtwo', () => {
    expect(sucheOhnePreis(datei, 'rgb mew').map((k) => k.id)).toEqual(['me55-65', 'me55-G', 'me55-R']);
    expect(sucheOhnePreis(datei, 'mewtwo').map((k) => k.id)).toEqual(['me55-63']);
    expect(sucheOhnePreis(datei, 'xy')).toEqual([]);
    expect(sucheOhnePreis(null, 'mew')).toEqual([]);
  });
  it('Kartenseite: alle Drucke-Preise, aber nur bei eindeutigem Namen', () => {
    expect(druckeFuerKarte(datei, 'me55', 'Mew')).toEqual([0.02, 2517.06, 2653.27, 2777.22]);
    expect(druckeFuerKarte(datei, 'me55', 'Pikachu ex')).toBeNull();
    expect(druckeFuerKarte(datei, 'sv1', 'Mew')).toBeNull();
  });
  it('Kartennummer: Gesamtzahl nur bei fortlaufender Nummer', () => {
    expect(kartenNummer('4', 102)).toBe('4/102');
    expect(kartenNummer('R', 128)).toBe('R');
    expect(kartenNummer('TG05', 195)).toBe('TG05');
    expect(kartenNummer(null, 10)).toBe('');
  });
  it('Kartenseite, Set-Seite und Suche binden die Bausteine ein', () => {
    const karte = readFileSync('src/app/karten/[id]/page.tsx', 'utf8');
    expect(karte).toContain('druckeFuerKarte(');
    expect(karte).not.toMatch(/card\.printedTotal \? `\/\$\{card\.printedTotal\}`/);
    expect(readFileSync('src/app/sets/[setCode]/page.tsx', 'utf8')).toContain('<OhnePreisListe');
    expect(readFileSync('src/app/suche/page.tsx', 'utf8')).toContain('ohnePreisTreffer(');
    expect(readFileSync('src/app/api/search/suggestions/route.ts', 'utf8')).toContain('ohnePreisTreffer(');
  });
});
