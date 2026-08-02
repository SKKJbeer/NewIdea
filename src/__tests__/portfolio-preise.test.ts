import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');
const route = lies('src/app/api/portfolio/prices/route.ts');
const seite = lies('src/app/portfolio/page.tsx');
const index = lies('src/lib/card-index.ts');

// DAS PORTFOLIO MUSS IMMER EINEN STAND ZEIGEN.
//
// BEFUND AUS DER LIVE-ANSICHT: Von sechs Positionen standen drei auf „Kein
// Marktpreis geladen". Ursache war `return null`, sobald der Abruf bei der
// Kartendatenbank scheiterte — und die antwortet dokumentiert auf etwa jede
// dritte Anfrage mit einem Fehler (Stolperstelle 28). Die Position verschwand
// dann komplett aus der Antwort.
//
// Der eigene Kartenindex hat dieselben Karten samt Preis und kann nicht
// aussetzen. Diese Tests halten fest, dass er als Rueckfall dient — und dass
// er als solcher AUSGEWIESEN wird.

describe('Preisabruf des Portfolios', () => {
  it('faellt auf den eigenen Kartenindex zurueck, statt die Position fallenzulassen', () => {
    expect(route).toContain('cardsFromIndex');
    expect(route).toMatch(/const card = live \?\? ausIndex\.get\(c\.id\) \?\? null/);
  });

  it('holt den Rueckfall in EINER Abfrage, nicht je gescheiterter Karte', () => {
    // Eine Abfrage je Karte waere langsamer als das, was sie ersetzt.
    expect(index).toMatch(/\.in\('id', ids/);
    expect(route).toMatch(/cardsFromIndex\(cards\.map\(\(c\) => c\.id\)\)/);
  });

  it('weist aus, woher der Preis stammt', () => {
    // Ein Preis vom Vortag ist brauchbar — er darf nur nicht aussehen wie
    // einer von jetzt.
    expect(route).toMatch(/quelle: 'live' \| 'index'/);
    expect(seite).toMatch(/quelle === 'index'/);
    expect(seite).toContain('indexStand');
  });

  it('schreibt einen Index-Preis NICHT als heutigen Messpunkt zurueck', () => {
    // Er ist eine Kopie von gestern. Ihn als heutige Messung zu speichern
    // waere eine erfundene Messung (Preis-Wahrheitspflicht).
    expect(route).toMatch(/quelle === 'live'\) abgerufen\.push/);
  });

  it('unterscheidet „Abruf gescheitert" von „Karte hat keinen Preis"', () => {
    // Das eine behebt sich von selbst, das andere nie. Ein gemeinsamer Satz
    // laesst jemanden auf etwas warten, das nicht kommt.
    expect(seite).toContain('Preis gerade nicht abrufbar');
    expect(seite).toContain('liegt kein Marktpreis vor');
    expect(seite).not.toContain('Kein Marktpreis geladen — Kaufpreis');
  });
});
