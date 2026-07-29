import { describe, it, expect } from 'vitest';
import { mergeHoldings, rowToHolding, holdingToRow, removedIds } from '@/lib/portfolio-sync';
import { normalizeHolding, type PortfolioHolding } from '@/lib/portfolio';
import { displayName, isAuthConfigured, AUTH_PROVIDERS, PROVIDER_LABEL } from '@/lib/supabase-auth';

// Die Zusammenführung läuft bei JEDEM Login. Geht sie schief, verliert jemand
// sein Portfolio oder besitzt plötzlich doppelt so viele Karten — beides
// bemerkt man erst, wenn es passiert ist. Deshalb hier besonders gründlich.

function h(over: Partial<PortfolioHolding> & { cardId: string }): PortfolioHolding {
  return normalizeHolding({
    cardName: 'Karte',
    setName: 'Set',
    setCode: 'st',
    imageUrl: 'https://images.pokemontcg.io/st/1.png',
    quantity: 1,
    purchasePrice: 100,
    purchaseDate: '2026-07-01',
    language: 'EN',
    addedAt: '2026-07-01T10:00:00Z',
    ...over,
  });
}

describe('mergeHoldings — niemand verliert eine Position', () => {
  it('übernimmt einen rein lokalen Bestand vollständig', () => {
    const lokal = [h({ cardId: 'a' }), h({ cardId: 'b' })];
    expect(mergeHoldings(lokal, []).map((x) => x.cardId)).toEqual(['a', 'b']);
  });

  it('übernimmt einen reinen Konto-Bestand vollständig', () => {
    const konto = [h({ cardId: 'x' }), h({ cardId: 'y' })];
    expect(mergeHoldings([], konto).map((x) => x.cardId)).toEqual(['x', 'y']);
  });

  it('vereinigt beide Seiten ohne Verlust', () => {
    const lokal = [h({ cardId: 'lokal-1' })];
    const konto = [h({ cardId: 'konto-1' })];
    const ergebnis = mergeHoldings(lokal, konto);
    expect(ergebnis.map((x) => x.cardId).sort()).toEqual(['konto-1', 'lokal-1']);
  });

  it('stellt den Konto-Bestand voran und hängt Lokales an', () => {
    // Stabile Anzeige: Wer schon ein Konto-Portfolio hatte, sieht es oben.
    const lokal = [h({ cardId: 'neu' })];
    const konto = [h({ cardId: 'alt-1' }), h({ cardId: 'alt-2' })];
    expect(mergeHoldings(lokal, konto).map((x) => x.cardId)).toEqual(['alt-1', 'alt-2', 'neu']);
  });
});

describe('mergeHoldings — dieselbe Karte auf beiden Seiten', () => {
  it('addiert die Stückzahlen NICHT', () => {
    // Sonst würde das Portfolio bei jedem Login größer.
    const lokal = [h({ cardId: 'a', quantity: 3 })];
    const konto = [h({ cardId: 'a', quantity: 3 })];
    const ergebnis = mergeHoldings(lokal, konto);
    expect(ergebnis).toHaveLength(1);
    expect(ergebnis[0].quantity).toBe(3);
  });

  it('lässt den zuletzt hinzugefügten Eintrag gewinnen', () => {
    const lokal = [h({ cardId: 'a', quantity: 5, addedAt: '2026-07-20T10:00:00Z' })];
    const konto = [h({ cardId: 'a', quantity: 2, addedAt: '2026-07-01T10:00:00Z' })];
    expect(mergeHoldings(lokal, konto)[0].quantity).toBe(5);
  });

  it('behält den Konto-Eintrag, wenn er der jüngere ist', () => {
    const lokal = [h({ cardId: 'a', quantity: 5, addedAt: '2026-07-01T10:00:00Z' })];
    const konto = [h({ cardId: 'a', quantity: 2, addedAt: '2026-07-20T10:00:00Z' })];
    expect(mergeHoldings(lokal, konto)[0].quantity).toBe(2);
  });

  it('lässt einen datierten Eintrag gegen einen undatierten gewinnen', () => {
    const lokal = [h({ cardId: 'a', quantity: 9, addedAt: '2026-07-20T10:00:00Z' })];
    const konto = [h({ cardId: 'a', quantity: 2, addedAt: '', purchaseDate: '' })];
    expect(mergeHoldings(lokal, konto)[0].quantity).toBe(9);
  });

  it('bevorzugt bei gleichem Zeitstempel den Konto-Eintrag', () => {
    // Gleichstand muss zu einem festen Ergebnis führen, nicht zu einem
    // zufälligen — sonst springt der Bestand zwischen zwei Logins hin und her.
    const zeit = '2026-07-10T10:00:00Z';
    const lokal = [h({ cardId: 'a', quantity: 5, addedAt: zeit })];
    const konto = [h({ cardId: 'a', quantity: 2, addedAt: zeit })];
    expect(mergeHoldings(lokal, konto)[0].quantity).toBe(2);
  });
});

describe('mergeHoldings — Idempotenz', () => {
  it('ändert bei erneuter Ausführung nichts mehr', () => {
    // Die wichtigste Eigenschaft: Der Ablauf läuft bei JEDEM Login.
    const lokal = [h({ cardId: 'a', quantity: 3 }), h({ cardId: 'b' })];
    const konto = [h({ cardId: 'a', quantity: 1, addedAt: '2026-06-01T00:00:00Z' })];

    const einmal = mergeHoldings(lokal, konto);
    const zweimal = mergeHoldings(einmal, einmal);
    const dreimal = mergeHoldings(zweimal, zweimal);

    expect(zweimal).toEqual(einmal);
    expect(dreimal).toEqual(einmal);
  });

  it('bleibt stabil, wenn das Ergebnis zum neuen Konto-Bestand wird', () => {
    // Genau das passiert nach dem ersten Hochladen.
    const lokal = [h({ cardId: 'a' }), h({ cardId: 'b' })];
    const ersteRunde = mergeHoldings(lokal, []);
    expect(mergeHoldings(lokal, ersteRunde)).toEqual(ersteRunde);
  });
});

describe('mergeHoldings — Randfälle', () => {
  it('gibt bei zwei leeren Beständen eine leere Liste zurück', () => {
    expect(mergeHoldings([], [])).toEqual([]);
  });

  it('normalisiert beschädigte Einträge beider Seiten', () => {
    const kaputt = [{ cardId: 'a', quantity: undefined } as never];
    const ergebnis = mergeHoldings(kaputt, []);
    expect(ergebnis[0].quantity).toBe(1);
    expect(Number.isFinite(ergebnis[0].purchasePrice)).toBe(true);
  });

  it('entfernt Dubletten innerhalb einer Seite', () => {
    const lokal = [h({ cardId: 'a', quantity: 1 }), h({ cardId: 'a', quantity: 2 })];
    expect(mergeHoldings(lokal, [])).toHaveLength(1);
  });

  it('verändert die übergebenen Listen nicht', () => {
    const lokal = [h({ cardId: 'a' })];
    const konto = [h({ cardId: 'b' })];
    mergeHoldings(lokal, konto);
    expect(lokal).toHaveLength(1);
    expect(konto).toHaveLength(1);
  });
});

describe('Übersetzung Datenbank ↔ Oberfläche', () => {
  it('überführt einen Eintrag verlustfrei hin und zurück', () => {
    const original = h({ cardId: 'sv3pt5-25', cardName: 'Glurak ex', quantity: 3, purchasePrice: 235.71, language: 'DE' });
    const zurueck = rowToHolding(holdingToRow(original, 'user-1'));
    expect(zurueck).toEqual(original);
  });

  it('schreibt ein leeres Kaufdatum als NULL', () => {
    // Postgres lehnt '' für eine DATE-Spalte ab — der Eintrag würde verloren.
    const row = holdingToRow(h({ cardId: 'a', purchaseDate: '' }), 'user-1');
    expect(row.purchase_date).toBeNull();
    expect(row.added_at).not.toBe('');
  });

  it('hängt die Nutzer-Kennung an jede Zeile', () => {
    expect(holdingToRow(h({ cardId: 'a' }), 'user-42').user_id).toBe('user-42');
  });

  it('verkraftet eine unvollständige Datenbankzeile', () => {
    const eintrag = rowToHolding({ card_id: 'a' });
    expect(eintrag.cardId).toBe('a');
    expect(eintrag.quantity).toBe(1);
    expect(eintrag.purchasePrice).toBe(0);
    expect(eintrag.language).toBe('EN');
  });

  it('macht aus NULL-Spalten keine Fehlwerte', () => {
    const eintrag = rowToHolding({ card_id: 'a', purchase_date: null, added_at: null, quantity: null as never });
    expect(eintrag.purchaseDate).toBe('');
    expect(eintrag.addedAt).toBe('');
    expect(eintrag.quantity).toBe(1);
  });
});

describe('removedIds', () => {
  it('nennt die Karten, die nicht mehr im Bestand sind', () => {
    const vorher = [h({ cardId: 'a' }), h({ cardId: 'b' }), h({ cardId: 'c' })];
    const nachher = [h({ cardId: 'b' })];
    expect(removedIds(vorher, nachher).sort()).toEqual(['a', 'c']);
  });

  it('meldet nichts, wenn nichts entfernt wurde', () => {
    const bestand = [h({ cardId: 'a' })];
    expect(removedIds(bestand, bestand)).toEqual([]);
  });

  it('meldet alles, wenn der Bestand geleert wurde', () => {
    expect(removedIds([h({ cardId: 'a' }), h({ cardId: 'b' })], [])).toHaveLength(2);
  });
});

describe('Anmeldung — Konfiguration und Anzeige', () => {
  it('gilt ohne öffentliche Zugangsdaten als nicht eingerichtet', () => {
    // Die Portfolio-Seite muss dann unverändert mit dem Browser-Speicher
    // funktionieren — keine toten Anmeldeknöpfe.
    const alt = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SUPABASE_URL;
    expect(isAuthConfigured()).toBe(false);
    if (alt) process.env.NEXT_PUBLIC_SUPABASE_URL = alt;
  });

  it('bietet Google und Apple an', () => {
    expect([...AUTH_PROVIDERS].sort()).toEqual(['apple', 'google']);
    for (const p of AUTH_PROVIDERS) {
      expect(PROVIDER_LABEL[p]).toMatch(/anmelden/i);
    }
  });

  it('zeigt bevorzugt den vollen Namen', () => {
    expect(displayName({ email: 'a@b.de', user_metadata: { full_name: 'Max Mustermann' } } as never)).toBe('Max Mustermann');
  });

  it('fällt auf die E-Mail-Adresse zurück', () => {
    expect(displayName({ email: 'a@b.de', user_metadata: {} } as never)).toBe('a@b.de');
  });

  it('erfindet keinen Namen, wenn nichts vorliegt', () => {
    expect(displayName({ email: null, user_metadata: {} } as never)).toBe('Angemeldet');
    expect(displayName(null)).toBe('');
  });
});
