import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');
const route = lies('src/app/api/monitoring/route.ts');
const panel = lies('src/components/MonitoringPanel.tsx');
const vercel = JSON.parse(lies('vercel.json')) as { crons: Array<{ path: string; schedule: string }> };

// DAS MONITORING SAGT JEDE SACHE GENAU EINMAL — UND SAGT SIE RICHTIG.
//
// Zwei Befunde aus dem Aufraeumen haben diese Tests ausgeloest:
//
//   1. Der Block „features" zaehlte auf, welche Funktionen konfiguriert sind,
//      und sagte damit zum DRITTEN Mal dasselbe: `apiKeys` nennt die
//      Konfiguration, `health` nennt die Ergebnisse. Drei Darstellungen
//      derselben Sache koennen auseinanderlaufen — und dann glaubt man der
//      falschen.
//
//   2. „aktiv" haengte an NEXT_PUBLIC_SITE_URL. Die zeigt auf eine nie
//      verbundene Domain, ist also nicht gesetzt — das Monitoring meldete
//      beide Cron-Jobs als INAKTIV, waehrend sie nachweislich jeden Tag
//      liefen. Eine Falschmeldung ist schlimmer als eine fehlende.

describe('Keine dritte Darstellung derselben Sache', () => {
  it('der Block „features" ist weg — aus der Antwort UND aus der Anzeige', () => {
    expect(route).not.toMatch(/^\s*features: \{/m);
    expect(panel).not.toMatch(/data\.features/);
    expect(panel).not.toMatch(/featureEntries|featuresWorking/);
  });

  it('Konfiguration steht bei den Keys, Ergebnisse beim Betriebszustand', () => {
    expect(route).toContain('apiKeys');
    expect(route).toContain('health');
  });
});

describe('Workflows beschreiben den tatsaechlichen Ablauf', () => {
  it('„aktiv" haengt nur am Secret, nicht an einer ungenutzten Adresse', () => {
    // Die Cron-Routen nutzen `url.origin` — die Adresse, unter der sie gerade
    // laufen. NEXT_PUBLIC_SITE_URL brauchen sie nicht und duerfen deshalb
    // nicht daran gemessen werden.
    expect(route).toContain("getWorkflows(env('CRON_SECRET'))");
    expect(route).not.toMatch(/getWorkflows\(env\('CRON_SECRET'\) && !!siteUrl\)/);
  });

  it('jeder in vercel.json eingetragene Cron kommt auch vor', () => {
    for (const cron of vercel.crons) {
      expect(route, cron.path).toContain(cron.path);
      expect(route, cron.schedule).toContain(cron.schedule);
    }
  });

  it('nennt die Preiserfassung — den wichtigsten Ablauf ueberhaupt', () => {
    // Sie stand nicht drin, obwohl sie entscheidet, ob die Kartenpreise
    // aktuell sind.
    expect(route).toContain('/api/cron/price-sweep');
    expect(route).toMatch(/Flächendeckende Preiserfassung/);
  });

  it('nennt Artikel- und Guide-Tage, weil der taegliche Cron sie erzeugt', () => {
    expect(route).toMatch(/Sonntag \+ Donnerstag/);
    expect(route).toMatch(/Dienstag \+ Freitag/);
  });
});

describe('Der Betriebszustand zeigt die Erfassung als Arbeit, nicht als Zeitstempel', () => {
  it('zeigt Fortschritt, Seitenstand und Stillstand', () => {
    // „Die Tabelle wurde heute angefasst" und „die Arbeit ist fertig" sind
    // zwei verschiedene Aussagen. Nur die zweite beantwortet, ob die Karten
    // aktuell sind.
    expect(panel).toContain('Preiserfassung heute');
    expect(panel).toMatch(/health\.sweep\.anteil/);
    expect(panel).toMatch(/health\.sweep\.stillstandMinuten/);
    expect(panel).toMatch(/health\.sweep\.fertig/);
  });
});
