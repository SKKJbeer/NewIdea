import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';
import {
  MODEL_PRICES,
  estimateCostUsd,
  totalInputTokens,
  summarize,
  AI_USAGE_SETUP_SQL,
} from '@/lib/ai-usage';

// Anlass: Ein aufgebrauchtes Guthaben, ohne sagen zu können wofür. Diese
// Erfassung ist die Antwort — und muss deshalb selbst stimmen.

describe('Preistabelle', () => {
  it('kennt das eingesetzte Modell', () => {
    const eingesetzt = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
    expect(MODEL_PRICES[eingesetzt], `Preis für ${eingesetzt} fehlt`).toBeDefined();
  });

  it('führt für jedes Modell beide Preise', () => {
    for (const [modell, preis] of Object.entries(MODEL_PRICES)) {
      expect(preis.input, modell).toBeGreaterThan(0);
      expect(preis.output, modell).toBeGreaterThan(preis.input);
    }
  });
});

describe('estimateCostUsd', () => {
  it('rechnet Opus-Preise korrekt ($5 / $25 je Million)', () => {
    // 1 Mio Eingabe + 1 Mio Ausgabe = 5 + 25 = 30 USD
    const kosten = estimateCostUsd('claude-opus-4-8', {
      input_tokens: 1_000_000,
      output_tokens: 1_000_000,
    });
    expect(kosten).toBeCloseTo(30, 6);
  });

  it('rechnet einen typischen Artikel realistisch', () => {
    // Rund 4.000 Eingabe- und 6.000 Ausgabe-Token.
    const kosten = estimateCostUsd('claude-opus-4-8', {
      input_tokens: 4_000,
      output_tokens: 6_000,
    });
    expect(kosten).toBeCloseTo(0.17, 2);
  });

  it('zeigt, wie teuer Opus gegenüber Haiku ist', () => {
    const gleich = { input_tokens: 100_000, output_tokens: 100_000 };
    const opus = estimateCostUsd('claude-opus-4-8', gleich);
    const haiku = estimateCostUsd('claude-haiku-4-5', gleich);
    expect(opus / haiku).toBeCloseTo(5, 1);
  });

  it('berücksichtigt zwischengespeicherte Eingaben günstiger', () => {
    const normal = estimateCostUsd('claude-opus-4-8', { input_tokens: 1_000_000 });
    const ausCache = estimateCostUsd('claude-opus-4-8', { cache_read_input_tokens: 1_000_000 });
    expect(ausCache).toBeCloseTo(normal * 0.1, 6);
  });

  it('berücksichtigt das Schreiben in den Cache teurer', () => {
    const normal = estimateCostUsd('claude-opus-4-8', { input_tokens: 1_000_000 });
    const inCache = estimateCostUsd('claude-opus-4-8', { cache_creation_input_tokens: 1_000_000 });
    expect(inCache).toBeCloseTo(normal * 1.25, 6);
  });

  it('schätzt ein unbekanntes Modell lieber zu hoch als zu niedrig', () => {
    const unbekannt = estimateCostUsd('irgendein-neues-modell', { output_tokens: 1_000_000 });
    const haiku = estimateCostUsd('claude-haiku-4-5', { output_tokens: 1_000_000 });
    expect(unbekannt).toBeGreaterThan(haiku);
  });

  it('gibt bei fehlenden Angaben 0 zurück statt NaN', () => {
    expect(estimateCostUsd('claude-opus-4-8', {})).toBe(0);
    expect(Number.isFinite(estimateCostUsd('claude-opus-4-8', {}))).toBe(true);
  });
});

describe('totalInputTokens', () => {
  it('zählt Cache-Token mit — sie werden abgerechnet', () => {
    expect(
      totalInputTokens({
        input_tokens: 100,
        cache_read_input_tokens: 200,
        cache_creation_input_tokens: 50,
      }),
    ).toBe(350);
  });
});

describe('summarize', () => {
  const HEUTE = '2026-07-30';
  const rows = [
    { purpose: 'artikel',      input_tokens: 4000, output_tokens: 6000, cost_usd: 0.17, ok: true,  created_at: `${HEUTE}T08:00:00Z` },
    { purpose: 'artikel',      input_tokens: 4000, output_tokens: 6000, cost_usd: 0.17, ok: true,  created_at: '2026-07-20T08:00:00Z' },
    { purpose: 'marktbericht', input_tokens: 8000, output_tokens: 9000, cost_usd: 0.27, ok: true,  created_at: `${HEUTE}T09:00:00Z` },
    { purpose: 'guide',        input_tokens: 0,    output_tokens: 0,    cost_usd: 0,    ok: false, created_at: `${HEUTE}T10:00:00Z` },
  ];

  it('zählt Aufrufe und Fehlschläge getrennt', () => {
    const s = summarize(rows, 30, HEUTE);
    expect(s.totalCalls).toBe(4);
    expect(s.failedCalls).toBe(1);
  });

  it('summiert die Gesamtkosten', () => {
    expect(summarize(rows, 30, HEUTE).totalCostUsd).toBeCloseTo(0.61, 6);
  });

  it('weist die heutigen Kosten getrennt aus', () => {
    // Der Eintrag vom 20. Juli zählt nicht zu heute.
    expect(summarize(rows, 30, HEUTE).todayCostUsd).toBeCloseTo(0.44, 6);
  });

  it('gruppiert nach Zweck, teuerster zuerst', () => {
    const s = summarize(rows, 30, HEUTE);
    expect(s.byPurpose[0].purpose).toBe('artikel');
    expect(s.byPurpose[0].calls).toBe(2);
    expect(s.byPurpose[0].costUsd).toBeCloseTo(0.34, 6);
    expect(s.byPurpose.map((p) => p.purpose)).toEqual(['artikel', 'marktbericht', 'guide']);
  });

  it('zählt gescheiterte Aufrufe je Zweck mit, aber ohne Kosten', () => {
    const guide = summarize(rows, 30, HEUTE).byPurpose.find((p) => p.purpose === 'guide')!;
    expect(guide.calls).toBe(1);
    expect(guide.failed).toBe(1);
    expect(guide.costUsd).toBe(0);
  });

  it('verkraftet leere und unvollständige Einträge', () => {
    expect(summarize([], 30, HEUTE).totalCalls).toBe(0);
    const s = summarize(
      [{ purpose: null, input_tokens: null, output_tokens: null, cost_usd: null, ok: null, created_at: null }],
      30,
      HEUTE,
    );
    expect(s.byPurpose[0].purpose).toBe('unbekannt');
    expect(Number.isFinite(s.totalCostUsd)).toBe(true);
  });
});

describe('Setup-SQL', () => {
  it('legt Tabelle und Index an', () => {
    expect(AI_USAGE_SETUP_SQL).toContain('CREATE TABLE IF NOT EXISTS ai_usage');
    expect(AI_USAGE_SETUP_SQL).toContain('CREATE INDEX IF NOT EXISTS');
    for (const spalte of ['purpose', 'model', 'input_tokens', 'output_tokens', 'cost_usd', 'ok']) {
      expect(AI_USAGE_SETUP_SQL, spalte).toContain(spalte);
    }
  });
});

describe('Kein KI-Endpunkt ohne Zugriffsschutz', () => {
  it('sichert jede Route ab, die eine Generierung auslösen kann', () => {
    // DER teure Fund: /api/market war ein GET ohne jede Prüfung und löste pro
    // Aufruf eine vollständige Opus-Generierung aus — jeder Crawler konnte
    // damit Guthaben verbrennen. Diese Prüfung verhindert eine Wiederholung.
    const generatoren = /generateMarketSummary|generateNewsletterContent|generateVideoScript|generateSocialPosts|generateArticle|generateGuide|generateAndSaveMarketReport/;
    const schutz = /isStudioAuthed(FromRequest)?\(|CRON_SECRET|Authorization/;

    const ungeschuetzt: string[] = [];
    for (const file of globSync('src/app/api/**/route.ts', { cwd: process.cwd() })) {
      const src = readFileSync(join(process.cwd(), file), 'utf8');
      if (!generatoren.test(src)) continue;
      if (schutz.test(src)) continue;
      ungeschuetzt.push(file);
    }

    expect(
      ungeschuetzt,
      'Diese Endpunkte lösen KI-Aufrufe aus und kosten damit Geld — sie brauchen ' +
        `einen Zugriffsschutz:\n${ungeschuetzt.join('\n')}`,
    ).toEqual([]);
  });

  it('erfasst den Verbrauch bei jedem Generator-Modul', () => {
    // Ohne Erfassung ist die Kostenfrage wieder unbeantwortbar.
    for (const file of ['src/lib/ai-generator.ts', 'src/lib/article-generator.ts', 'src/lib/guide-generator.ts']) {
      expect(readFileSync(join(process.cwd(), file), 'utf8'), file).toMatch(/recordAiUsage|await track\(/);
    }
  });
});
