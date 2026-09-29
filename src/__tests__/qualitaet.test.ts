import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  zahlenImText, unbelegteZahlen, berichtVerstoesse, artikelVerstoesse, korrekturHinweis,
  mitQualitaetsschranke, mitWiederholung,
} from '@/lib/qualitaet';
import { preisUnplausibel } from '@/lib/preis-durchlauf';
import { bewerte, type Eingaben } from '@/lib/gesundheit';

// QUALITÄTSSCHRANKEN + WIEDERHOLUNGEN — Nutzer-Auftrag 29.09.2026: „damit wir
// uns wirklich auf die Daten immer verlassen können".

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

const DATEN = `MARKTLAGE (Cardmarket, Quellstand 2026-09-28):
- Marktindex (Median der 30-Tage-Bewegung über 15389 Karten): +1,9 %
- Moderne Sets: Flareon ex (Prismatic Evolutions) +29,7 %, 208,51 €; Mega Lucario ex (Mega Evolution) -16,6 %, 167,71 €
- Klassiker: Mew (Southern Islands) +193,5 %, 1457,53 €`;

describe('Zahlenprobe: jede Prozent-/Euro-Angabe muss belegt sein', () => {
  it('liest deutsche Schreibweisen (Tausenderpunkt, Komma, Wort-Einheit, Minuszeichen)', () => {
    const z = zahlenImText('Mew steht bei 1.457,53 € (+193,5 %), Lucario −16,6 Prozent, Index +1,9 %.');
    expect(z.map((x) => [x.wert, x.einheit])).toEqual([[1457.53, '€'], [193.5, '%'], [-16.6, '%'], [1.9, '%']]);
  });
  it('belegt: wörtlich, mit anderem Vorzeichenwort und gerundet auf die geschriebenen Stellen', () => {
    expect(unbelegteZahlen('Flareon ex legt 29,7 % zu und notiert bei 208,51 €.', DATEN)).toEqual([]);
    expect(unbelegteZahlen('Mega Lucario ex verliert 16,6 Prozent.', DATEN)).toEqual([]);
    expect(unbelegteZahlen('Flareon ex legt rund 30 % zu.', DATEN)).toEqual([]);
    expect(unbelegteZahlen('Mew notiert bei 1.457,53 €.', DATEN)).toEqual([]);
  });
  it('unbelegt: erfundene, gerechnete oder falsch gerundete Werte', () => {
    expect(unbelegteZahlen('Flareon ex legt 31,2 % zu.', DATEN).map((z) => z.roh)).toEqual(['31,2 %']);
    // Differenz selbst gerechnet (29,7 − 1,9): nicht in den Daten
    expect(unbelegteZahlen('27,8 % besser als der Markt.', DATEN).map((z) => z.roh)).toEqual(['27,8 %']);
    expect(unbelegteZahlen('Preis 210 €.', DATEN).map((z) => z.roh)).toEqual(['210 €']);
  });
  it('Zahlen ohne Einheit (Kartenanzahl, Jahre) prüft die Probe nicht', () => {
    expect(unbelegteZahlen('15.389 Karten seit 2026.', DATEN)).toEqual([]);
  });
});

describe('Berichts-Schranke', () => {
  const gut = `Flareon ex führt mit +29,7 %. ${'x'.repeat(320)}\n\n## Marktlage\nIndex +1,9 %.\n\n## Trends\nMew +193,5 %, dünn gehandelt.\n\n## Ausblick\nBleibt abzuwarten.`;
  it('ein belegter, vollständiger Bericht besteht', () => {
    expect(berichtVerstoesse(gut, DATEN, 300)).toEqual([]);
  });
  it('fehlende Pflicht-Abschnitte, erfundene Zahl, Ich-Form und unbelegte Ursache fallen durch', () => {
    const schlecht = `${gut.replace('## Ausblick', '## Sonstiges')} Ich finde 45,0 % realistisch. Der Grund liegt in der Nachfrage.`;
    const regeln = berichtVerstoesse(schlecht, DATEN, 300).map((v) => v.regel);
    expect(regeln).toEqual(expect.arrayContaining(['abschnitt-fehlt', 'unbelegte-zahl', 'erste-person', 'behauptete-ursache']));
  });
  it('zu kurz fällt durch', () => {
    expect(berichtVerstoesse('## Marktlage ## Trends ## Ausblick', DATEN, 300).map((v) => v.regel)).toContain('zu-kurz');
  });
});

describe('Artikel-Schranke', () => {
  it('prüft Titel, Intro, Abschnitte und Kernpunkte einzeln', () => {
    const v = artikelVerstoesse(
      { title: 'Flareon ex +29,7 %', intro: 'ok', sections: [{ heading: 'A', content: 'Mew +200 %' }], keyPoints: ['Jetzt kaufen'] },
      DATEN,
    );
    expect(v.map((x) => x.regel)).toEqual(expect.arrayContaining(['unbelegte-zahl']));
    expect(v.find((x) => x.regel === 'unbelegte-zahl')?.detail).toContain('abschnitt 1');
  });
  it('Korrekturhinweis nennt die Befunde konkret', () => {
    expect(korrekturHinweis([{ regel: 'unbelegte-zahl', detail: '31,2 %' }])).toMatch(/unbelegte-zahl: 31,2 %[\s\S]*wörtlich/);
    expect(korrekturHinweis([])).toBe('');
  });
});

describe('Wiederholung mit Schranke', () => {
  it('wiederholt mit Korrekturhinweis, bis die Schranke hält', async () => {
    const hinweise: string[] = [];
    const r = await mitQualitaetsschranke(
      async (h, n) => { hinweise.push(h); return n; },
      (n) => (n < 3 ? [{ regel: 'unbelegte-zahl', detail: `${n}` }] : []),
      { warteMs: 0 },
    );
    expect(r).toMatchObject({ ergebnis: 3, versuche: 3, verstoesse: [] });
    expect(hinweise[0]).toBe('');
    expect(hinweise[1]).toContain('KORREKTUR');
  });
  it('gibt nach dem letzten Versuch auf — ohne Ergebnis, mit Befund', async () => {
    const r = await mitQualitaetsschranke(async () => 'x', () => [{ regel: 'zu-kurz', detail: '1' }], { max: 2, warteMs: 0 });
    expect(r.ergebnis).toBeNull();
    expect(r.verstoesse[0].regel).toBe('zu-kurz');
  });
  it('ein Fehler zählt als Fehlversuch, erst der letzte wirft', async () => {
    let n = 0;
    const r = await mitQualitaetsschranke(async () => { if (++n < 2) throw new Error('Aussetzer'); return 'ok'; }, () => [], { warteMs: 0 });
    expect(r.ergebnis).toBe('ok');
    await expect(mitQualitaetsschranke(async () => { throw new Error('tot'); }, () => [], { max: 2, warteMs: 0 })).rejects.toThrow('tot');
  });
  it('mitWiederholung: wiederholt Abrufe und reicht den letzten Fehler weiter', async () => {
    let n = 0;
    expect(await mitWiederholung(async () => { if (++n < 3) throw new Error('x'); return n; }, { warteMs: 0 })).toBe(3);
    await expect(mitWiederholung(async () => { throw new Error('immer'); }, { max: 2, warteMs: 0 })).rejects.toThrow('immer');
  });
});

describe('Plausibilitätsschranke der Tagespreise', () => {
  const jetzt = Date.parse('2026-09-29T03:00:00Z');
  const alt = { price: 20, updated_at: '2026-09-28T00:00:00Z' };
  it('normale Bewegungen gehen durch', () => {
    expect(preisUnplausibel({ trend: 25, avg7: 22, avg30: 20 }, alt, jetzt)).toBe(false);
  });
  it('Sprung gegen Ø 7 UND Ø 30 UND Vortag → unplausibel (alter Wert bleibt)', () => {
    expect(preisUnplausibel({ trend: 150, avg7: 21, avg30: 20 }, alt, jetzt)).toBe(true);
  });
  it('bestätigt der Vortag den neuen Wert (Sprung war gestern schon da), gilt er', () => {
    expect(preisUnplausibel({ trend: 150, avg7: 21, avg30: 20 }, { price: 140, updated_at: '2026-09-28T00:00:00Z' }, jetzt)).toBe(false);
  });
  it('Sprung nur gegen einen der Schnitte ist kein Befund (echte Bewegung läuft über Ø 7 mit)', () => {
    expect(preisUnplausibel({ trend: 150, avg7: 120, avg30: 20 }, alt, jetzt)).toBe(false);
  });
  it('ohne frischen Vortagswert entscheiden die eigenen Schnitte der Quelle', () => {
    expect(preisUnplausibel({ trend: 150, avg7: 21, avg30: 20 }, { price: 20, updated_at: '2026-06-01T00:00:00Z' }, jetzt)).toBe(true);
  });
});

describe('Gesundheitsprüfung (zeitbewusst)', () => {
  const alles: Eingaben = {
    preisStand: { datum: '2026-09-29', offset: 100, fertig: true, geprueft: 100, frisch: 90, ohneFrischpreis: 10, gruende: {}, fehler: 0, schreibFehler: null, begonnen: '', aktualisiert: '', etappen: 1 },
    sprachGate: { ok: true, befund: 'ok' },
    neuheiten: { stand: '2026-09-29T00:47:59Z', sets: [], japan: [], kommend: [] } as unknown as Eingaben['neuheiten'],
    frisch: { datum: '2026-09-29', erzeugt: '', quelle: 'tcgdex', karten: Array(400).fill({}) } as unknown as Eingaben['frisch'],
    indexTag: '2026-09-29',
    berichtWoche: '2026-09-28',
    artikel: null,
    letzterGuide: '2026-09-29T08:02:00Z',
  };
  it('alles in Ordnung um 12:30 UTC am Dienstag', () => {
    const p = bewerte(alles, new Date('2026-09-29T12:30:00Z'));
    expect(p.every((x) => x.ok)).toBe(true);
    expect(p.map((x) => x.name)).toEqual(expect.arrayContaining(['Tagespreise', 'Marktindex', 'Frischpreise Top 400', 'Marktbericht', 'Guide']));
  });
  it('vor den geplanten Läufen wird nichts verlangt (kein Fehlalarm)', () => {
    const p = bewerte({ ...alles, indexTag: '2026-09-28', frisch: null, letzterGuide: null }, new Date('2026-09-29T05:34:00Z'));
    expect(p.find((x) => x.name === 'Marktindex')).toBeUndefined();
    expect(p.find((x) => x.name === 'Guide')).toBeUndefined();
    expect(p.find((x) => x.name === 'Frischpreise Top 400')).toBeUndefined();
  });
  it('fehlender Wochenbericht, offene Nachholung und Ersatz-Artikel werden erkannt', () => {
    const p = bewerte(
      { ...alles, berichtWoche: '2026-09-21', artikel: { vorhanden: true, ersatz: true, altePreise: true } },
      new Date('2026-10-01T12:30:00Z'), // Donnerstag
    );
    expect(p.find((x) => x.name === 'Marktbericht')?.ok).toBe(false);
    expect(p.find((x) => x.name === 'Artikel')).toMatchObject({ ok: false, befund: expect.stringContaining('Ersatztext') });
  });
});

describe('Verdrahtung', () => {
  it('Marktbericht, Artikel und Guides laufen durch die Schranke mit Wiederholung', () => {
    expect(lies('src/lib/market-report-generator.ts')).toMatch(/mitQualitaetsschranke\([\s\S]*berichtVerstoesse/);
    expect(lies('src/lib/article-generator.ts')).toMatch(/mitQualitaetsschranke\(erzeuge, pruefe\)/);
    expect(lies('src/lib/article-generator.ts')).toContain('artikelVerstoesse(d, cardSummary)');
    expect(lies('src/lib/guide-generator.ts')).toMatch(/mitQualitaetsschranke\(erzeuge/);
  });
  it('die Probe prüft gegen dieselben Kartenzeilen, die das Modell sieht', () => {
    expect(lies('src/lib/ai-generator.ts')).toContain('const cardData = berichtKartenDaten(cards);');
    expect(lies('src/lib/market-report-generator.ts')).toContain('berichtKartenDaten(cards)');
  });
  it('Prompt-Zahlen im deutschen Format (sonst liest die Probe „12.3%" als „3 %")', () => {
    expect(lies('src/lib/content-variety.ts')).not.toMatch(/toFixed\(1\)\}%/);
    expect(lies('src/lib/ai-generator.ts')).not.toMatch(/toFixed\(1\)\}%/);
  });
  it('Tagespreise: Wiederholung je Abruf + Plausibilität, Themen-Lauf mit Wiederholung', () => {
    const d = lies('src/lib/preis-durchlauf.ts');
    expect(d).toMatch(/mitWiederholung\(\s*\(\) => pruefeFrischenPreis/);
    expect(d).toContain("grund: 'unplausibel'");
    expect(lies('src/app/api/cron/themen/route.ts')).toContain('mitWiederholung(() => neuheitenLauf()');
  });
  it('Wochenbericht heilt sich im Tageslauf selbst; Gesundheits-Cron ist eingeplant und meldet 500', () => {
    expect(lies('src/app/api/cron/daily/route.ts')).toContain('generateAndSaveMarketReport()');
    expect(lies('vercel.json')).toContain('/api/cron/gesundheit');
    expect(lies('src/app/api/cron/gesundheit/route.ts')).toContain('status: g.ok ? 200 : 500');
    expect(lies('src/lib/system-health.ts')).toContain('DATEN NICHT IN ORDNUNG');
  });
});
