import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { findeZubehoer, hatZubehoer, MAX_LINKS } from '@/lib/accessory-mentions';
import type { AccessoryType } from '@/components/AccessoryLink';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');

// KAUFLINKS DUERFEN VORKOMMEN — ABER NICHT DOMINIEREN.
//
// „Nicht dominant" ist hier eine Zahl, keine Haltung: hoechstens ein Link je
// Zubehoerart und Beitrag, hoechstens vier insgesamt. Ohne die erste Regel
// bekaeme ein Lagerungs-Guide, der zwoelfmal „Toploader" schreibt, zwoelf
// Links — und laese sich wie eine Anzeige.

describe('Zubehoer im Fliesstext', () => {
  it('erkennt die gaengigen Begriffe', () => {
    const b = new Set<AccessoryType>();
    const seg = findeZubehoer('Wer Karten schuetzt, greift zu Sleeves.', b);
    expect(seg.find((s) => s.type)?.type).toBe('sleeve');
  });

  it('verlinkt je Zubehoerart nur die ERSTE Erwaehnung im ganzen Beitrag', () => {
    const b = new Set<AccessoryType>();
    const a1 = findeZubehoer('Toploader schuetzen die Kanten.', b);
    const a2 = findeZubehoer('Ein Toploader kostet wenig. Noch ein Toploader.', b);
    expect(a1.filter((s) => s.type)).toHaveLength(1);
    expect(a2.filter((s) => s.type)).toHaveLength(0);
  });

  it('erlaubt verschiedene Arten im selben Absatz', () => {
    const b = new Set<AccessoryType>();
    const seg = findeZubehoer('Erst Sleeves, dann Toploader, dann ins Sammelalbum.', b);
    expect(seg.filter((s) => s.type).map((s) => s.type).sort()).toEqual(['binder', 'sleeve', 'toploader']);
  });

  it('deckelt die Gesamtzahl', () => {
    const b = new Set<AccessoryType>(['sleeve', 'toploader', 'binder', 'storage'] as AccessoryType[]);
    expect(b.size).toBe(MAX_LINKS);
    expect(findeZubehoer('Sleeves und Toploader.', b).filter((s) => s.type)).toHaveLength(0);
    expect(MAX_LINKS).toBeLessThanOrEqual(4);
  });

  it('schlaegt nicht mitten in einem Wort an', () => {
    const b = new Set<AccessoryType>();
    expect(findeZubehoer('Die Sleevesammlung wuchs.', b).filter((s) => s.type)).toHaveLength(0);
  });

  it('laesst Texte ohne Zubehoer unberuehrt', () => {
    const b = new Set<AccessoryType>();
    const t = 'Der Markt bewegte sich ueber 30 Tage kaum.';
    expect(findeZubehoer(t, b)).toEqual([{ text: t }]);
    expect(hatZubehoer([t])).toBe(false);
  });
});

describe('Kennzeichnung', () => {
  it('erscheint NUR, wo auch wirklich ein Link steht', () => {
    // Ein Hinweis unter einem Text ohne Links waere eine Behauptung ueber
    // etwas, das gar nicht da ist.
    expect(hatZubehoer(['Nur Marktzahlen, kein Zubehoer.'])).toBe(false);
    expect(hatZubehoer(['Karten gehoeren in ein Sammelalbum.'])).toBe(true);
  });

  it('steht auf allen drei Inhaltsflaechen', () => {
    for (const datei of [
      'src/app/guides/[slug]/page.tsx',
      'src/app/artikel/[date]/page.tsx',
      'src/app/marktbericht/page.tsx',
    ]) {
      expect(lies(datei), datei).toContain('AffiliateNote');
    }
  });

  it('nennt Provision und Preisneutralitaet', () => {
    const note = lies('src/components/AffiliateNote.tsx');
    expect(note).toContain('Affiliate-Links');
    expect(note).toMatch(/Provision/);
    expect(note).toMatch(/Preis nicht/);
  });
});

describe('Die Erzeugung weiss davon', () => {
  it('beide Generatoren fordern Zubehoer-Erwaehnung, aber kein Markup', () => {
    for (const datei of ['src/lib/guide-generator.ts', 'src/lib/article-generator.ts']) {
      const t = lies(datei);
      expect(t, datei).toContain('ZUBEHÖR BEIM NAMEN NENNEN');
      expect(t, datei).toMatch(/KEINE Links und KEIN Markup/);
      // Keine Kaufaufforderung — die Tonalitaetsregel gilt weiter.
      expect(t, datei).toMatch(/keine Kaufaufforderung/i);
    }
  });
});
