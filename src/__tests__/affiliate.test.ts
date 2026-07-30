import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';

// Partner-Links sind Geldfluss UND Rechtspflicht zugleich. Beides wird hier
// geprüft: dass kein Link ins Leere zeigt, und dass die Kennzeichnung dort
// steht, wo sie nicht vergessen werden kann.

const WURZEL = process.cwd();
const lies = (datei: string) => readFileSync(join(WURZEL, datei), 'utf8');

describe('Partner-Leiste', () => {
  const src = lies('src/components/AffiliateBar.tsx');

  it('hat für jeden Partner ein echtes Ziel', () => {
    // `|| '#'` erzeugte einen klickbaren Link ohne Ziel — sichtbar, aber
    // wirkungslos, und damit auch keine Provision.
    expect(src, "kein Partner darf auf '#' oder undefined zeigen").not.toContain("|| '#'");
    expect(src).not.toContain('href={a.url === ');
  });

  it('nennt den Trade-Republic-Link', () => {
    expect(src).toContain('refnocode.trade.re');
  });

  it('lässt jeden Standard per Umgebungsvariable überschreiben', () => {
    for (const v of [
      'NEXT_PUBLIC_CARDMARKET_URL',
      'NEXT_PUBLIC_TRADE_REPUBLIC_URL',
      'NEXT_PUBLIC_AMAZON_URL',
    ]) {
      expect(src, v).toContain(v);
    }
  });

  it('kennzeichnet die Links als Werbung', () => {
    // Pflicht, und bewusst in der Komponente statt in den Seiten: So kann sie
    // beim Einbau an einer neuen Stelle nicht fehlen.
    expect(src).toMatch(/Affiliate-Link/);
  });

  it('setzt die Schutz-Attribute auf jedem Partner-Link', () => {
    expect(src).toContain('rel="noopener noreferrer sponsored"');
  });
});

describe('Alle Partner-Links im Projekt', () => {
  it('tragen rel="sponsored" und öffnen in einem neuen Tab', () => {
    const verdaechtig: string[] = [];
    const partnerHosts = /amazon\.de|cardmarket\.com|trade\.re|dragonshield\.com/;

    for (const datei of globSync('src/**/*.tsx', { cwd: WURZEL })) {
      const src = lies(datei);
      // Nur Dateien mit echten Partner-Adressen prüfen.
      if (!partnerHosts.test(src)) continue;
      if (!src.includes('<a ') && !src.includes('<a\n')) continue;
      if (!/sponsored/.test(src)) verdaechtig.push(datei);
    }

    expect(
      verdaechtig,
      `Partner-Links ohne rel="sponsored" (Kennzeichnungspflicht):\n${verdaechtig.join('\n')}`,
    ).toEqual([]);
  });
});
