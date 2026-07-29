import { describe, it, expect } from 'vitest';
import { translations, t } from '@/lib/i18n';
import { DE_TO_EN, EN_TO_DE, germanToEnglishName, englishToGermanName } from '@/lib/pokemon-names-de';

// Die Seite ist zweisprachig (DE Standard, EN per Cookie) und übersetzt
// Kartennamen in beide Richtungen — Suche nach „Glurak" muss „Charizard"
// finden, angezeigt wird wieder „Glurak". Fehlt ein Schlüssel oder kippt eine
// Zuordnung, merkt man es sonst erst auf der Live-Seite.

describe('Übersetzungen', () => {
  const deKeys = Object.keys(translations.de);
  const enKeys = Object.keys(translations.en);

  it('hat überhaupt Schlüssel', () => {
    expect(deKeys.length).toBeGreaterThan(20);
  });

  it('kennt jeden deutschen Schlüssel auch auf Englisch', () => {
    const fehlend = deKeys.filter((k) => !enKeys.includes(k));
    expect(fehlend, `Fehlende englische Übersetzungen: ${fehlend.join(', ')}`).toEqual([]);
  });

  it('führt keine englischen Schlüssel ohne deutsches Gegenstück', () => {
    const verwaist = enKeys.filter((k) => !deKeys.includes(k));
    expect(verwaist, `Verwaiste englische Schlüssel: ${verwaist.join(', ')}`).toEqual([]);
  });

  it('hat im Deutschen nirgends einen leeren Text', () => {
    // Deutsch ist die Standardsprache und zugleich der Rückfall für t() —
    // ein leerer Wert würde als Lücke in der Oberfläche sichtbar.
    for (const [key, value] of Object.entries(translations.de)) {
      expect(value.trim(), `de.${key} ist leer`).not.toBe('');
    }
  });

  it('lässt englische Leerwerte nur dort zu, wo sie beabsichtigt sind', () => {
    // Satzbau-Bausteine: Deutsch braucht ein nachgestelltes „gefunden.",
    // Englisch nicht. Die Ausnahmen stehen hier namentlich, damit ein
    // versehentlich leer gebliebener Schlüssel auffällt.
    const beabsichtigtLeer = new Set(['search_no_results_post']);
    const unerwartet = Object.entries(translations.en)
      .filter(([key, value]) => value.trim() === '' && !beabsichtigtLeer.has(key))
      .map(([key]) => key);
    expect(unerwartet, `Unerwartet leere englische Texte: ${unerwartet.join(', ')}`).toEqual([]);
  });

  it('gibt für beide Sprachen den passenden Text zurück', () => {
    const key = Object.keys(translations.de)[0] as keyof typeof translations.de;
    expect(t('de', key)).toBe(translations.de[key]);
    expect(t('en', key)).toBe(translations.en[key]);
  });

  it('fällt bei unbekannter Sprache auf Deutsch zurück', () => {
    const key = Object.keys(translations.de)[0] as keyof typeof translations.de;
    // @ts-expect-error absichtlich ungültige Sprache
    expect(t('fr', key)).toBe(translations.de[key]);
  });

  it('enthält keine Emojis (UI-Design-Regel seit v2.16.0)', () => {
    // Visuelle Anker kommen ausschließlich aus lucide-react. Ausgenommen sind
    // Sprach-Flaggen als funktionale Indikatoren.
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/u;
    const flagge = /[\u{1F1E6}-\u{1F1FF}]/u;
    for (const lang of ['de', 'en'] as const) {
      for (const [key, value] of Object.entries(translations[lang])) {
        if (flagge.test(value)) continue;
        expect(emoji.test(value), `${lang}.${key} enthält ein Emoji: ${value}`).toBe(false);
      }
    }
  });
});

describe('Kartennamen — Zuordnungstabelle', () => {
  it('enthält eine belastbare Anzahl Namen', () => {
    expect(Object.keys(DE_TO_EN).length).toBeGreaterThan(100);
  });

  it('führt alle deutschen Schlüssel klein geschrieben', () => {
    // germanToEnglishName vergleicht gegen die klein geschriebene Eingabe —
    // ein großgeschriebener Schlüssel wäre unerreichbar.
    const falsch = Object.keys(DE_TO_EN).filter((k) => k !== k.toLowerCase());
    expect(falsch, `Nicht klein geschrieben: ${falsch.join(', ')}`).toEqual([]);
  });

  it('hat keine leeren Zuordnungen', () => {
    for (const [de, en] of Object.entries(DE_TO_EN)) {
      expect(de.trim()).not.toBe('');
      expect(en.trim(), `${de} hat keinen englischen Namen`).not.toBe('');
    }
  });

  it('baut die Rückrichtung vollständig auf', () => {
    // Mehrere deutsche Namen können auf denselben englischen zeigen; die
    // Rückrichtung ist deshalb höchstens so groß wie die Hinrichtung.
    expect(Object.keys(EN_TO_DE).length).toBeGreaterThan(0);
    expect(Object.keys(EN_TO_DE).length).toBeLessThanOrEqual(Object.keys(DE_TO_EN).length);
  });

  it('schreibt die deutschen Namen in der Rückrichtung groß', () => {
    for (const value of Object.values(EN_TO_DE)) {
      expect(value[0]).toBe(value[0].toUpperCase());
    }
  });
});

describe('germanToEnglishName', () => {
  it('übersetzt einen reinen Namen', () => {
    expect(germanToEnglishName('Glurak')).toBe('Charizard');
    expect(germanToEnglishName('Pikachu')).toBe('Pikachu');
  });

  it('ignoriert Groß- und Kleinschreibung sowie Leerzeichen', () => {
    expect(germanToEnglishName('  GLURAK  ')).toBe('Charizard');
    expect(germanToEnglishName('glurak')).toBe('Charizard');
  });

  it('übersetzt den Namen innerhalb eines Kartentitels', () => {
    expect(germanToEnglishName('Glurak ex')).toBe('Charizard ex');
  });

  it('gibt unbekannte Eingaben unverändert zurück', () => {
    expect(germanToEnglishName('Fantasiename')).toBe('Fantasiename');
    expect(germanToEnglishName('')).toBe('');
  });
});

describe('englishToGermanName', () => {
  it('übersetzt einen reinen Namen', () => {
    expect(englishToGermanName('Charizard')).toBe('Glurak');
  });

  it('übersetzt den Namen innerhalb eines Kartentitels', () => {
    expect(englishToGermanName('Charizard ex')).toBe('Glurak ex');
  });

  it('gibt null zurück, wenn es keine Übersetzung gibt', () => {
    // Wichtig: null, nicht der Originaltext — sonst würde `nameDe` mit dem
    // englischen Namen belegt und die Karte doppelt gleich beschriftet.
    expect(englishToGermanName('Völlig Unbekannt')).toBeNull();
  });

  it('übersetzt hin und zurück auf denselben Namen', () => {
    for (const de of ['Glurak', 'Bisaflor', 'Turtok', 'Mewtu', 'Simsala']) {
      const en = germanToEnglishName(de);
      expect(en, `${de} steht nicht in der Tabelle`).not.toBe(de);
      expect(englishToGermanName(en), `${de} → ${en} → ?`).toBe(de);
    }
  });

  it('gibt bei sprachgleichen Namen null zurück', () => {
    // „Pikachu" heißt in beiden Sprachen gleich und steht deshalb nicht in
    // der Tabelle. null ist hier richtig: Die Karte bekommt kein `nameDe`
    // und wird nicht zweimal identisch beschriftet.
    expect(englishToGermanName('Pikachu')).toBeNull();
    expect(germanToEnglishName('Pikachu')).toBe('Pikachu');
  });

  it('prüft die gesamte Tabelle auf Hin- und Rückübersetzbarkeit', () => {
    // Läuft über alle Einträge — findet Tippfehler und doppelte englische
    // Namen, die eine Rückübersetzung auf den falschen deutschen Namen
    // schicken würden.
    const kaputt: string[] = [];
    for (const [de, en] of Object.entries(DE_TO_EN)) {
      const zurueck = EN_TO_DE[en.toLowerCase()];
      if (!zurueck) kaputt.push(`${de} → ${en} → (nichts)`);
    }
    expect(kaputt, kaputt.slice(0, 10).join(' | ')).toEqual([]);
  });
});
