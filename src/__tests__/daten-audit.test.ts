import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sweepUeberfaellig } from '@/lib/system-health';
import { artikelPreiseVeraltet, ARTIKEL_PREISE_FRISCH_AB } from '@/lib/article-generator';

// DATEN-AUDIT 29.09.2026 — auf Produktion gefundene Lücken in den
// automatischen Aktualisierungen. Jeder Test belegt einen Befund.

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('Preisdurchlauf holt Netzfehler nach (Befund: 1.000 Karten ohne Nachholung)', () => {
  const q = lies('src/lib/preis-durchlauf.ts');
  it('merkt sich Karten mit Netz-/Serverfehler', () => {
    expect(q).toMatch(/\(stand\.nachholen \?\?= \[\]\)\.push\(teil\[k\]\.id\)/);
  });
  it('ein „fertiger" Durchlauf mit offenen Fehlern ist NICHT erledigt', () => {
    expect(q).toContain('if (stand.fertig && !stand.nachholen?.length) return stand;');
    expect(q).toContain('if (stand.fertig) return nachholRunde(');
  });
  it('verbucht erst nach erfolgreichem Schreiben', () => {
    const runde = q.slice(q.indexOf('async function nachholRunde'));
    expect(runde.indexOf('await schreibe(frisch)')).toBeLessThan(runde.indexOf('stand.fehler = Math.max(0, stand.fehler - 1)'));
  });
});

describe('Monitoring: kein Fehlalarm vor dem geplanten Lauf (Sweep 06:10 UTC)', () => {
  it('vor 06:40 UTC ist „gestern" planmäßig', () => {
    expect(sweepUeberfaellig('2026-09-28', new Date('2026-09-29T05:34:00Z'))).toBe(false);
  });
  it('nach 06:40 UTC ohne heutigen Lauf: überfällig', () => {
    expect(sweepUeberfaellig('2026-09-28', new Date('2026-09-29T07:00:00Z'))).toBe(true);
  });
  it('älter als gestern: immer überfällig; heute gelaufen: nie', () => {
    expect(sweepUeberfaellig('2026-09-27', new Date('2026-09-29T01:00:00Z'))).toBe(true);
    expect(sweepUeberfaellig('2026-09-29', new Date('2026-09-29T23:00:00Z'))).toBe(false);
  });
  it('die Meldung behauptet nicht mehr, die Kartenpreise stammten vom Sweep', () => {
    expect(lies('src/lib/system-health.ts')).not.toContain('Die Kartenpreise stammen von diesem Tag');
  });
});

describe('Sitemap: ehrliches lastmod, Sets mit Rückfall', () => {
  const q = lies('src/app/sitemap.ts');
  it('kein Eintrag trägt pauschal den Abrufzeitpunkt', () => {
    expect(q).not.toMatch(/lastModified: now/);
    expect(q).not.toMatch(/const now = new Date\(\)/);
  });
  it('Sets kommen über die gesicherte Liste, nicht nur live', () => {
    expect(q).toContain('ladeSetListe(250)');
    expect(q).not.toContain('fetchRecentSets');
  });
});

describe('Artikel und Berichte mit Preisen aus der alten Quelle sind gekennzeichnet', () => {
  it('vor der Umstellung erzeugt → Hinweis', () => {
    expect(artikelPreiseVeraltet({ generatedAt: '2026-09-27T08:01:00Z' })).toBe(true);
    expect(artikelPreiseVeraltet({ generatedAt: `${ARTIKEL_PREISE_FRISCH_AB}T08:00:00Z` })).toBe(false);
    expect(artikelPreiseVeraltet({ isStatic: true, generatedAt: '2026-10-01T08:00:00Z' })).toBe(true);
    expect(artikelPreiseVeraltet({})).toBe(true);
  });
  it('Artikelseite und Archiv-Bericht zeigen den Hinweis', () => {
    expect(lies('src/app/artikel/[date]/page.tsx')).toContain('artikelPreiseVeraltet(article)');
    expect(lies('src/app/marktbericht/[week]/page.tsx')).toContain('report.weekStart < ARTIKEL_PREISE_FRISCH_AB');
  });
  it('das Studio kann einen echten Artikel bewusst ersetzen', () => {
    expect(lies('src/app/api/articles/generate/route.ts')).toContain('neuErzeugen: neu === true');
  });
});
