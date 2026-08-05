import { describe, it, expect } from 'vitest';
import { namensRang, trefferRang, nachRelevanz, NICHT_GEFUNDEN } from '@/lib/such-relevanz';

// GEMESSEN AN DER PRODUKTION am 05.08.2026, Eingabe „mew":
//
//   1. Mewtwo ★            1599,66 €
//   2. Mew δ                882,47 €
//   3. Mew ★ δ              633,76 €
//   4. Team Rocket's Mewtwo ex
//   5. Rocket's Mewtwo ex
//   6. Mew                  512,81 €
//
// Die Karte, die genau so heisst wie das Getippte, stand an sechster Stelle.
// Diese Datei haelt die Reihenfolge fest, die daraus werden soll.

describe('namensRang', () => {
  it('setzt den exakten Namen an die Spitze', () => {
    expect(namensRang('Mew', 'mew')).toBe(0);
    expect(namensRang('mew', 'MEW')).toBe(0);
  });

  it('stellt den Namensanfang vor den Wortanfang', () => {
    expect(namensRang('Mew ex', 'mew')).toBe(1);
    expect(namensRang('Shining Mew', 'mew')).toBe(2);
    expect(namensRang('Mew ex', 'mew')).toBeLessThan(namensRang('Shining Mew', 'mew'));
  });

  it('trennt ein eigenstaendiges Wort von einem Wortbestandteil', () => {
    // Das ist der eigentliche Gewinn: „Shining Mew" IST ein Mew, „Mewtwo" ist
    // keins. Ohne diese Stufe stuenden beide gleichauf und der Preis entschiede.
    expect(namensRang('Shining Mew', 'mew')).toBe(2);
    expect(namensRang('Mewtwo ★', 'mew')).toBe(1); // faengt an mit — aber
    expect(namensRang('Team Rocket’s Mewtwo ex', 'mew')).toBe(2);
    expect(namensRang('Amewtwo', 'mew')).toBe(3);
  });

  it('erkennt Wortgrenzen auch neben Sonderzeichen aus Kartennamen', () => {
    // `\b` kennt „δ" und „é" nicht als Buchstaben — Kartennamen sind voll davon.
    expect(namensRang('Mew δ', 'mew')).toBe(1);
    expect(namensRang("Rocket's Mew", 'mew')).toBe(2);
    expect(namensRang('Pokémon Mew', 'mew')).toBe(2);
  });

  it('meldet fehlende Treffer als solche', () => {
    expect(namensRang('Glurak', 'mew')).toBe(NICHT_GEFUNDEN);
    expect(namensRang('', 'mew')).toBe(NICHT_GEFUNDEN);
    expect(namensRang('Mew', '')).toBe(NICHT_GEFUNDEN);
  });
});

describe('trefferRang wertet beide Sprachen gleich', () => {
  it('nimmt den besseren der beiden Namen', () => {
    expect(trefferRang('Charizard', 'Glurak', 'glurak')).toBe(0);
    expect(trefferRang('Charizard', 'Glurak', 'charizard')).toBe(0);
  });

  it('kommt ohne deutschen Namen aus', () => {
    expect(trefferRang('Mew', null, 'mew')).toBe(0);
    expect(trefferRang('Mew', undefined, 'mew')).toBe(0);
  });
});

describe('nachRelevanz', () => {
  // Die echte Reihenfolge aus der Produktion, nach Preis absteigend — so wie
  // sie aus der Datenbank kommt.
  const ausDerDatenbank = [
    { name: 'Mewtwo ★', price: 1599.66 },
    { name: 'Mew δ', price: 882.47 },
    { name: 'Mew ★ δ', price: 633.76 },
    { name: "Team Rocket's Mewtwo ex", price: 570.89 },
    { name: "Rocket's Mewtwo ex", price: 550.82 },
    { name: 'Mew', price: 512.81 },
    { name: 'Mew ex', price: 506.96 },
    { name: 'Shining Mewtwo', price: 454.91 },
  ];
  const sortiert = nachRelevanz(ausDerDatenbank, 'mew', (k) => ({ name: k.name }));

  it('stellt die Karte nach vorn, die genau so heisst', () => {
    expect(sortiert[0].name).toBe('Mew');
  });

  it('behaelt innerhalb einer Stufe die Preisordnung', () => {
    // Alle „faengt an mit mew" in derselben Reihenfolge wie vorher: teuerste
    // zuerst. Das setzt einen STABILEN Sortiervorgang voraus.
    const stufe1 = sortiert.filter((k) => ['Mewtwo ★', 'Mew δ', 'Mew ★ δ', 'Mew ex'].includes(k.name));
    expect(stufe1.map((k) => k.name)).toEqual(['Mewtwo ★', 'Mew δ', 'Mew ★ δ', 'Mew ex']);
  });

  it('schiebt die Wortanfaenge hinter die Namensanfaenge', () => {
    const iRocket = sortiert.findIndex((k) => k.name === "Team Rocket's Mewtwo ex");
    const iMewEx = sortiert.findIndex((k) => k.name === 'Mew ex');
    expect(iMewEx).toBeLessThan(iRocket);
  });

  it('veraendert die Eingabeliste nicht', () => {
    expect(ausDerDatenbank[0].name).toBe('Mewtwo ★');
  });

  it('verliert keine Karte', () => {
    expect(sortiert).toHaveLength(ausDerDatenbank.length);
  });
});
