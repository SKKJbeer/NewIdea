import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PMI_MIN_CARDS, FEAR_GREED_WEIGHTS } from '@/lib/market-metrics';
import { MIN_POINTS_FOR_SCORE, MIN_POINTS_FOR_VOLATILITY } from '@/lib/card-metrics';

// Eine Methodikseite, die etwas anderes sagt als die Berechnung, ist schlimmer
// als gar keine. Deshalb importiert die Seite ihre Schwellenwerte aus dem Code
// statt sie abzutippen — und dieser Test hält das fest.

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), 'utf8');
const seite = lies('src/app/methodik/page.tsx');

describe('Methodik-Seite', () => {
  it('tippt keine Schwellenwerte ab, sondern importiert sie', () => {
    expect(seite).toContain("from '@/lib/market-metrics'");
    expect(seite).toContain("from '@/lib/card-metrics'");
    for (const name of [
      'PMI_MIN_CARDS',
      'FEAR_GREED_WEIGHTS',
      'MIN_POINTS_FOR_SCORE',
      'MIN_POINTS_FOR_VOLATILITY',
      'MAX_PLAUSIBLE_TREND',
      'MAX_PLAUSIBLE_PRICE',
    ]) {
      expect(seite, `${name} muss aus dem Code kommen`).toContain(name);
    }
  });

  it('beantwortet alle geforderten Fragen', () => {
    const themen = [
      'Woher die Preise kommen',
      'Wie oft die Daten aktualisiert werden',
      'Wie Preisänderungen berechnet werden',
      'CardBeacon Index',
      'Markttemperatur',
      'Markt-Score',
      'Datenprüfung',
      'Grenzen dieser Daten',
    ];
    for (const t of themen) expect(seite, t).toContain(t);
  });

  it('nennt die Datenquelle beim Namen', () => {
    expect(seite).toContain('Cardmarket');
    expect(seite).toContain('pokemontcg.io');
  });

  it('weist den Score ausdrücklich als keine Anlageberatung aus', () => {
    expect(seite).toContain('keine Anlageberatung');
  });

  it('verspricht keine Datenqualität, die es nicht gibt', () => {
    // Marketingwörter, die mehr Genauigkeit suggerieren als vorhanden ist.
    for (const wort of ['Echtzeit', 'lückenlos', 'vollständige Historie', 'garantiert']) {
      expect(seite.toLowerCase(), wort).not.toContain(wort.toLowerCase());
    }
  });

  it('ist indexierbar und in der Sitemap', () => {
    expect(seite).toMatch(/canonical: '\/methodik'/);
    expect(lies('src/app/sitemap.ts')).toContain('/methodik');
  });

  it('ist von jeder Seite aus erreichbar', () => {
    expect(lies('src/components/SiteFooter.tsx')).toContain("href: '/methodik'");
  });
});

describe('Die Kennzahlen verweisen auf die Methodik', () => {
  it.each([
    ['src/components/FearGreedPanel.tsx', 'Markttemperatur'],
    ['src/components/CardMetricPanels.tsx', 'PMI Score'],
  ])('%s verlinkt die Erklärung', (datei) => {
    expect(lies(datei)).toContain('/methodik');
  });
});

describe('Die dokumentierten Werte stimmen mit dem Code überein', () => {
  it('die Gewichte von Angst & Gier ergeben 1', () => {
    expect(Object.values(FEAR_GREED_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
  });

  it('die Schwellen sind gesetzt und plausibel', () => {
    expect(PMI_MIN_CARDS).toBeGreaterThanOrEqual(10);
    expect(MIN_POINTS_FOR_SCORE).toBeGreaterThanOrEqual(3);
    expect(MIN_POINTS_FOR_VOLATILITY).toBeGreaterThanOrEqual(MIN_POINTS_FOR_SCORE);
  });
});
