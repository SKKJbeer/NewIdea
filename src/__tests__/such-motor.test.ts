import { describe, expect, it } from 'vitest';
import { SuchMotor, distanz, hinweisText, normal, nummerForm, type SuchKarte } from '@/lib/such-motor';

// Bestand nach echten Karten (Namen, Sets, Nummern wie bei pokemontcg.io / TCGdex).
const k = (id: string, name: string, de: string[], set: string, setDe: string | null, nummer: string, seltenheit: string, preis: number): SuchKarte => ({
  id, name, de, set, setDe, setCode: id.split('-')[0], nummer, seltenheit, preis,
});
const BESTAND: SuchKarte[] = [
  k('base1-4', 'Charizard', ['Glurak'], 'Base', 'Grundset', '4', 'Rare Holo', 400),
  k('sv3pt5-199', 'Charizard ex', ['Glurak-ex'], '151', '151', '199', 'Special Illustration Rare', 300),
  k('sv3pt5-6', 'Charizard ex', ['Glurak-ex'], '151', '151', '6', 'Double Rare', 8),
  k('swsh35-74', 'Charizard VMAX', ['Glurak-VMAX'], "Champion's Path", 'Weg des Champs', '74', 'Rare Secret', 120),
  k('swsh7-215', 'Umbreon VMAX', ['Nachtara-VMAX'], 'Evolving Skies', 'Drachenwandel', '215', 'Rare Secret', 1300),
  k('swsh7-94', 'Umbreon V', ['Nachtara-V'], 'Evolving Skies', 'Drachenwandel', '94', 'Rare Ultra', 12),
  k('si1-1', 'Mew', [], 'Southern Islands', null, '1', 'Promo', 500),
  k('sv3pt5-151', 'Mew ex', [], '151', '151', '151', 'Double Rare', 5),
  k('base1-10', 'Mewtwo', ['Mewtu'], 'Base', 'Grundset', '10', 'Rare Holo', 60),
  k('neo2-7', 'Ho-Oh', [], 'Neo Revelation', 'Neo Revelation', '7', 'Rare Holo', 90),
  k('swsh1-183', 'Poké Ball', ['Pokéball'], 'Sword & Shield', 'Schwert & Schild', '164', 'Uncommon', 0.2),
  k('sv1-189', "Professor's Research", ['Forschung des Professors'], 'Scarlet & Violet', 'Karmesin & Purpur', '189', 'Rare Ultra', 3),
  k('swsh35-68', 'Super Potion', ['Supertrank'], "Champion's Path", 'Weg des Champs', '68', 'Uncommon', 0.1),
  k('swsh1-92', "Galarian Farfetch'd", ['Galar-Porenta'], 'Sword & Shield', 'Schwert & Schild', '94', 'Common', 0.1),
  k('swsh9-TG05', 'Pikachu', ['Pikachu'], 'Brilliant Stars Trainer Gallery', 'Strahlende Sterne', 'TG05', 'Trainer Gallery Rare Holo', 15),
  k('base1-58', 'Pikachu', [], 'Base', 'Grundset', '58', 'Common', 6),
  k('ex14-4', 'Charizard δ', ['Glurak δ'], 'Crystal Guardians', null, '4', 'Rare Holo', 200),
  k('swsh12-186', 'Lugia V', ['Lugia-V'], 'Silver Tempest', 'Silberne Sturmwinde', '186', 'Rare Ultra', 180),
  k('swsh12-138', 'Lugia V', ['Lugia-V'], 'Silver Tempest', 'Silberne Sturmwinde', '138', 'Rare Holo V', 3),
  k('base1-2', 'Articuno', ['Arktos'], 'Fossil', 'Fossil', '2', 'Rare Holo', 30),
  k('ex1-1', 'Altaria', ['Altaria'], 'Dragon', 'Dragon', '1', 'Rare Holo', 4),
].map((x) => ({ ...x, gesamt: x.setCode === 'base1' ? 102 : x.setCode === 'ex14' ? 100 : null }));
const motor = new SuchMotor(BESTAND);
const ids = (q: string, n = 5) => motor.suche(q, n).ids;

describe('Suchmotor: Bausteine', () => {
  it('normal/nummerForm/distanz', () => {
    expect(normal("Farfetch'd Poké")).toBe('farfetchd poke');
    expect(nummerForm('004')).toBe('4');
    expect(nummerForm('TG05')).toBe('tg5');
    expect(distanz('glurk', 'glurak', 2)).toBe(1);
    expect(distanz('umbreno', 'umbreon', 2)).toBe(1); // Vertauschung zählt 1
    expect(distanz('abc', 'xyzxyz', 1)).toBe(2); // Abbruch über max
  });
});

describe('Suchmotor: Fälle, die vor dem Umbau leer blieben (gemessen 12.10.2026)', () => {
  it('Tippfehler → echtes Wort aus dem Bestand, mit Hinweis', () => {
    const r = motor.suche('glurk');
    expect(r.ids[0]).toBe('base1-4');
    expect(r.hinweis?.korrigiert).toEqual([{ von: 'glurk', zu: 'glurak' }]);
    expect(ids('charizrd')).toContain('base1-4');
    expect(ids('umbreon vmx')[0]).toBe('swsh7-215');
  });
  it('Name + Set (englisch oder deutsch), Reihenfolge egal', () => {
    expect(ids('glurak 151').slice(0, 2).sort()).toEqual(['sv3pt5-199', 'sv3pt5-6']);
    expect(ids('charizard base')[0]).toBe('base1-4');
    expect(ids('base set charizard')[0]).toBe('base1-4');
    expect(ids('nachtara drachenwandel')[0]).toBe('swsh7-215');
    expect(ids('evolving skies umbreon')[0]).toBe('swsh7-215');
  });
  it('Name + Nummer', () => {
    expect(ids('Glurak 4/102')).toEqual(['base1-4']); // Gesamtzahl passt nur beim Grundset
    expect(ids('Glurak 4')).toEqual(expect.arrayContaining(['base1-4', 'ex14-4']));
    expect(ids('glurak 199')[0]).toBe('sv3pt5-199');
    expect(ids('pikachu tg05')[0]).toBe('swsh9-TG05');
    expect(ids('umbreon #215')[0]).toBe('swsh7-215');
  });
  it('zusammen- oder getrennt geschrieben, Akzente egal', () => {
    expect(ids('hooh')[0]).toBe('neo2-7');
    expect(ids('ho oh')[0]).toBe('neo2-7');
    expect(ids('pokeball')[0]).toBe('swsh1-183');
    expect(ids('farfetchd')[0]).toBe('swsh1-92');
  });
  it('deutsche Trainer- und Pokémon-Namen (TCGdex)', () => {
    expect(ids('forschung des professors')[0]).toBe('sv1-189');
    expect(ids('professor forschung')[0]).toBe('sv1-189');
    expect(ids('supertrank')[0]).toBe('swsh35-68');
    expect(ids('porenta')[0]).toBe('swsh1-92');
  });
  it('Seltenheit als Wort (nur, was die Quelle belegt)', () => {
    expect(ids('glurak sir')).toEqual(['sv3pt5-199']);
    expect(ids('mew promo')).toEqual(['si1-1']);
  });
});

describe('Suchmotor: Rangfolge und Hinweise', () => {
  it('genau so benannt vor „fängt so an" vor „Wortanfang eines anderen Namens"', () => {
    const r = ids('mew', 5);
    expect(r[0]).toBe('si1-1');
    expect(r.indexOf('sv3pt5-151')).toBeLessThan(r.indexOf('base1-10')); // Mew ex vor Mewtwo
  });
  it('Wortanfang beim Tippen', () => {
    expect(ids('glur')[0]).toBe('base1-4');
    expect(ids('nachtara v')).toContain('swsh7-215');
  });
  it('„gold" wird nicht geraten, sondern ausgewiesen', () => {
    const r = motor.suche('gold glurak');
    expect(r.ids[0]).toBe('base1-4');
    expect(r.hinweis?.ignoriert).toEqual(['gold']);
    expect(hinweisText(r.hinweis)).toContain('„gold“ nicht berücksichtigt');
  });
  it('mehrere unpassende Wörter („lugia v alt art") → schwächste zuerst weglassen', () => {
    const r = motor.suche('lugia v alt art');
    expect(r.ids.slice(0, 2).sort()).toEqual(['swsh12-138', 'swsh12-186']);
    expect(r.hinweis?.ignoriert.sort()).toEqual(['alt', 'art']);
  });
  it('Füllwörter stören nicht', () => {
    expect(ids('glurak karte wert')[0]).toBe('base1-4');
  });
  it('nichts Passendes → leer, kein beliebiger Treffer', () => {
    expect(motor.suche('xqzv').ids).toEqual([]);
    expect(motor.suche('').ids).toEqual([]);
  });
  it('Sets über deutschen Namen und Code', () => {
    expect(motor.sets('drachenwandel')[0]?.setCode).toBe('swsh7');
    expect(motor.sets('grundset')[0]?.setCode).toBe('base1');
    expect(motor.sets('evolving')[0]?.setCode).toBe('swsh7');
  });
});
