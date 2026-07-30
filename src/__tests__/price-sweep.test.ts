import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  needsSnapshot,
  seitenGesamt,
  leererStand,
  HEARTBEAT_DAYS,
  SWEEP_PAGE_SIZE,
} from '@/lib/price-sweep';

// ANLASS: Die Preis-Historie entstand nur dort, wo jemand geklickt hat. Eine
// Karte, die niemand aufruft, bekam nie einen Messpunkt — und verpasste Zeit
// lässt sich nicht nachholen, Preise von gestern gibt es nirgends zu kaufen.

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), 'utf8');

describe('needsSnapshot — wann ein Messpunkt entsteht', () => {
  it('schreibt für eine Karte ohne jeden Messpunkt', () => {
    expect(needsSnapshot(12.5, undefined, '2026-07-30')).toBe(true);
  });

  it('schreibt bei geändertem Preis', () => {
    expect(needsSnapshot(13.0, { price: 12.5, date: '2026-07-29' }, '2026-07-30')).toBe(true);
  });

  it('schreibt NICHT zweimal am selben Tag', () => {
    // Der Durchlauf kann nach einem Abbruch dieselbe Seite erneut verarbeiten.
    expect(needsSnapshot(12.5, { price: 12.5, date: '2026-07-30' }, '2026-07-30')).toBe(false);
  });

  it('schreibt bei unverändertem Preis erst nach dem Lebenszeichen-Abstand', () => {
    // Zwischen zwei gleichen Preisen liegt eine gerade Linie — genau die
    // zeichnet das Diagramm ohnehin. Täglich dieselbe Zahl zu speichern kostet
    // Platz, ohne eine einzige zusätzliche Aussage zu liefern.
    const gestern = { price: 12.5, date: '2026-07-29' };
    expect(needsSnapshot(12.5, gestern, '2026-07-30')).toBe(false);

    const alt = { price: 12.5, date: '2026-07-23' };
    expect(needsSnapshot(12.5, alt, '2026-07-30')).toBe(true);
  });

  it('ignoriert Karten ohne Preis', () => {
    // Preis-Wahrheitspflicht: Eine 0 ist keine Messung.
    expect(needsSnapshot(0, undefined, '2026-07-30')).toBe(false);
    expect(needsSnapshot(-1, undefined, '2026-07-30')).toBe(false);
  });

  it('hält den Lebenszeichen-Abstand über genau eine Woche', () => {
    expect(HEARTBEAT_DAYS).toBe(7);
  });

  it('verliert keine Preisänderung, egal wie klein', () => {
    // Jede Änderung wird erfasst — nur die Wiederholung derselben Zahl nicht.
    expect(needsSnapshot(12.51, { price: 12.5, date: '2026-07-29' }, '2026-07-30')).toBe(true);
  });
});

describe('Seitenaufteilung', () => {
  it('rechnet die letzte, angebrochene Seite mit', () => {
    expect(seitenGesamt(20479, 250)).toBe(82);
    expect(seitenGesamt(500, 250)).toBe(2);
    expect(seitenGesamt(501, 250)).toBe(3);
  });

  it('meldet ohne bekannte Gesamtzahl keine Seiten', () => {
    // Sonst gälte der Durchlauf sofort als fertig.
    expect(seitenGesamt(0)).toBe(0);
  });

  it('nutzt die größtmögliche Seite der API', () => {
    expect(SWEEP_PAGE_SIZE).toBe(250);
  });
});

describe('Tageswechsel', () => {
  it('beginnt einen neuen Tag bei Seite 1', () => {
    const stand = leererStand('2026-07-31');
    expect(stand).toMatchObject({ nextPage: 1, runDate: '2026-07-31', seen: 0, saved: 0 });
  });
});

describe('Der Durchlauf ist gegen die bekannten Fallen gesichert', () => {
  const sweep = lies('src/lib/price-sweep.ts');
  const api = lies('src/lib/pokemon-api.ts');
  const route = lies('src/app/api/cron/price-sweep/route.ts');

  it('blättert in fester Reihenfolge', () => {
    // Ohne `orderBy` darf die API zwischen zwei Seitenabrufen anders sortieren.
    // Der Seitenzeiger überspränge dann Karten und läse andere doppelt — und
    // zwar unbemerkt, weil beides plausibel aussieht.
    expect(api).toMatch(/orderBy: 'id'/);
  });

  it('schiebt den Zeiger bei einem Fehler NICHT weiter', () => {
    // Sonst entstünde für die fehlgeschlagene Seite ein dauerhaftes Loch:
    // 250 Karten ohne Messpunkt für diesen Tag, ohne dass es auffällt.
    expect(sweep).toMatch(/catch \(err\)[\s\S]{0,400}break;/);
    expect(sweep).not.toMatch(/catch \(err\)[\s\S]{0,200}state\.nextPage \+= 1/);
  });

  it('gibt beim Abruf einer Seite auf statt leer zurückzukommen', () => {
    // Ein leeres Ergebnis wäre vom Ende der Datenbank nicht zu unterscheiden.
    expect(api).toContain('Seitenabruf fehlgeschlagen');
  });

  it('erkennt das Ende an der ungefilterten Seite', () => {
    // Eine Seite kann ausschließlich aus Vorschau-Karten ohne Preis bestehen.
    // Am gefilterten Ergebnis gemessen hätte der Durchlauf dort stumm
    // aufgehört — mit tausenden nie erfassten Karten dahinter.
    expect(sweep).toContain('if (rawCount === 0) break;');
    expect(sweep).not.toContain('if (cards.length === 0) break;');
  });

  it('arbeitet IN der Anfrage, nicht danach', () => {
    // BEFUND: Mit der Arbeit in `after()` brach die Kette reproduzierbar nach
    // fünf bis sechs Übergaben ab — bei Seite 20, 32 und 49 von 82, jedes Mal
    // ohne Fehler und ohne Log. Die nach der Antwort geplante Arbeit wurde
    // schlicht nicht mehr ausgeführt. Was in der Anfrage passiert, läuft.
    // Nur die tatsächliche Verwendung prüfen — der Kommentar nennt den alten
    // Weg absichtlich, damit der Grund am Code steht.
    expect(route).toContain('const progress = await runde();');
    expect(route).not.toContain("from 'next/server';\nimport { after }");
    expect(route).not.toMatch(/^\s*after\(/m);
    expect(lies('src/app/api/studio/price-sweep/route.ts')).not.toMatch(/^\s*after\(/m);
  });

  it('wartet beim Anstoß nicht auf die nächste Runde', () => {
    // Sonst triebe das Warten die eigene Runde über ihre Laufzeitgrenze.
    expect(route).toContain('AbortSignal.timeout(3_000)');
    // Das eigene Zeitlimit ist der Normalfall und darf nicht als Abriss gelten.
    expect(route).toContain("err.name === 'TimeoutError'");
  });

  it('ruft sich unter der eigenen Adresse auf', () => {
    // BEFUND AUS DEM ERSTEN ECHTEN LAUF: Der Folgeaufruf ging an
    // NEXT_PUBLIC_SITE_URL — dort steht die künftige eigene Domain, die noch
    // nicht verbunden ist. Der Durchlauf blieb nach acht von 82 Seiten stehen.
    // Nur die tatsächliche Verwendung prüfen — die Kommentare nennen die alte
    // Variable absichtlich, damit der Grund am Code steht.
    expect(route).toContain('const basis = url.origin;');
    for (const datei of [
      'src/app/api/cron/price-sweep/route.ts',
      'src/app/api/studio/price-sweep/route.ts',
      'src/app/api/cron/daily/route.ts',
    ]) {
      expect(lies(datei), datei).not.toContain('process.env.NEXT_PUBLIC_SITE_URL');
    }
  });

  it('setzt auch nach einem Abruffehler fort', () => {
    // Die Kartendatenbank liefert regelmäßig 500er. Hängt die Fortsetzung an
    // einem fehlerfreien Häppchen, endet der Durchlauf bei der ersten Störung
    // — im echten Lauf blieb er dreimal hintereinander nach ein bis zwei von
    // 82 Seiten stehen.
    const studio = lies('src/app/api/studio/price-sweep/route.ts');
    expect(studio).toContain('if (!erste.done)');
    expect(studio).not.toContain('erste.ok &&');
    expect(route).toContain('if (!progress.done && chain < MAX_CHAIN)');
  });

  it('macht einen abgerissenen Anstoß sichtbar', () => {
    // Sonst sieht ein Stillstand aus wie ein langsamer Durchlauf — im
    // Monitoring stand weiter der alte Abruffehler.
    expect(route).toContain('markChainError');
    expect(sweep).toContain('Fortsetzung nicht angestoßen:');
  });

  it('sichert den Stand nach JEDER Seite', () => {
    // BEFUND: Der Stand wurde erst am Ende einer Runde geschrieben. Wurde die
    // Runde vorzeitig beendet, war ihre gesamte Arbeit für den Seitenzeiger
    // verloren — der Durchlauf kam über Seite 32 von 82 nicht hinaus, ohne
    // einen Fehler zu melden.
    expect(sweep).toMatch(/pagesThisRun \+= 1;[\s\S]{0,900}await saveSweepState\(state\);/);
  });

  it('bleibt mit dem Budget unter der kleinsten Laufzeitgrenze', () => {
    // Ob die längere Laufzeit auf dem gebuchten Tarif gewährt wird, ist von
    // außen nicht erkennbar. Wird eine Runde abgeschnitten, stößt sie die
    // nächste nicht mehr an — und die Kette ist tot.
    const budget = Number(/BUDGET_MS = ([\d_]+)/.exec(route)?.[1].replace(/_/g, ''));
    expect(budget).toBeLessThan(60_000);
  });

  it('lässt den Anstoß nicht zwischenspeichern', () => {
    expect(route).toContain("cache: 'no-store'");
  });

  it('deckelt die Selbstfortsetzung', () => {
    expect(route).toMatch(/MAX_CHAIN = \d+/);
    expect(route).toContain('chain < MAX_CHAIN');
  });

  it('hält das Zeitbudget unter der Funktionslaufzeit', () => {
    // Sonst wird der Aufruf abgeschnitten, bevor der Stand gespeichert ist —
    // und der nächste beginnt wieder an derselben Stelle.
    const budget = Number(/BUDGET_MS = ([\d_]+)/.exec(route)?.[1].replace(/_/g, ''));
    const laufzeit = Number(/maxDuration = (\d+)/.exec(route)?.[1]) * 1000;
    expect(budget).toBeGreaterThan(0);
    expect(budget).toBeLessThan(laufzeit);
  });

  it('ist wie jeder Cron mit dem Geheimnis geschützt', () => {
    expect(route).toContain('Bearer ${process.env.CRON_SECRET}');
    expect(route).toContain('401');
  });

  it('lässt sich von Hand starten, ohne auf den Cron zu warten', () => {
    // Nach dem Anlegen der Tabelle oder nach einem Ausfall müsste man sonst bis
    // zum nächsten Morgen warten — genau dieses Warten hat die Preis-Historie
    // so lange dünn gehalten.
    const studio = lies('src/app/api/studio/price-sweep/route.ts');
    expect(studio).toContain('isStudioAuthedFromRequest');
    // Das Cron-Geheimnis hat in einem Browser nichts verloren.
    expect(studio).not.toMatch(/authHeader !== `Bearer/);
    expect(lies('src/components/MonitoringPanel.tsx')).toContain('/api/studio/price-sweep');
  });

  it('legt die Zustandstabelle im Monitoring als SQL bereit', () => {
    // Stolperstelle 21: Eine fehlende Tabelle legt eine Pipeline still — das
    // muss mit fertigem SQL sichtbar sein, nicht im Log verschwinden.
    const health = lies('src/lib/system-health.ts');
    expect(health).toContain('CREATE TABLE IF NOT EXISTS price_sweep_state');
    expect(health).toContain('price_snapshots_card_date');
  });
});
