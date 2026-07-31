import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { STORY_FORMATE } from '@/lib/story-formats';

const lies = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');
const ohneKommentare = (p: string) =>
  lies(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// MARKT-GESCHICHTEN — die Website als Quelle fuer alles, was nach aussen geht.

describe('Ein Layout, drei Formate', () => {
  it('kennt Reel, Beitrag und Teilen-Vorschau', () => {
    expect(Object.keys(STORY_FORMATE).sort()).toEqual(['og', 'post', 'reel']);
    expect(STORY_FORMATE.reel).toEqual({ width: 1080, height: 1920 });
    expect(STORY_FORMATE.post).toEqual({ width: 1080, height: 1350 });
    expect(STORY_FORMATE.og).toEqual({ width: 1200, height: 630 });
  });

  it('die Vorlagen kennen ihre Groesse nicht', () => {
    // Sonst gibt es dieselbe Geschichte dreimal, und beim vierten Format
    // vergisst jemand eine.
    const frames = ohneKommentare('src/lib/story-frames.tsx');
    const vorlagen = frames.slice(frames.indexOf('export function BigMover'));
    expect(vorlagen).not.toMatch(/width: 1080|height: 1920|height: 1350/);
  });
});

describe('Bilder aus echten Marktdaten', () => {
  const route = ohneKommentare('src/app/api/story/[vorlage]/route.tsx');

  it('nimmt KEINEN Text aus der Adresse entgegen', () => {
    // Eine oeffentliche Adresse, die beliebigen Text im CardBeacon-Layout
    // setzt, waere eine Flaeche, auf der jeder eine Behauptung erzeugen kann,
    // die aussieht wie eine Messung von uns.
    expect(route).not.toMatch(/searchParams\.get\('(titel|text|name|wert|trend)'\)/);
    // Der einzige Parameter neben der Vorlage ist das Format.
    const parameter = [...route.matchAll(/searchParams\.get\('([^']+)'\)/g)].map((m) => m[1]);
    expect(parameter).toEqual(['format']);
  });

  it('prueft Vorlage und Format gegen feste Listen', () => {
    expect(route).toMatch(/function istVorlage/);
    expect(route).toMatch(/function istFormat/);
  });

  it('nimmt den Indexwert aus dem gespeicherten Tagesstand', () => {
    // BEFUND beim ersten Rendern: Das Bild zeigte „CBI +28,6 %", waehrend die
    // Startseite −0,2 % auswies — beide rechneten fuer sich. Ein geteiltes Bild
    // lebt laenger als der Moment, in dem es entstand.
    expect(route).toContain('getMarketBenchmark()');
    expect(route).toMatch(/gespeichert\?\.value \?\?/);
  });

  it('erzeugt bei zu duenner Datenlage KEIN Bild', () => {
    // Ein Marktbild ohne belastbaren Index waere genau die erfundene Kennzahl,
    // die dieses Projekt sonst ueberall vermeidet.
    expect(route).toMatch(/zu wenig Daten für eine Marktaussage/);
    expect(route).toMatch(/keine gemessene Bewegung/);
    expect(route).toMatch(/zu wenige gemessene Sets/);
  });

  it('vergleicht im Set-Duell nur gemessene Sets', () => {
    expect(route).toMatch(/typeof s\.avgTrend === 'number'/);
  });

  it('haelt das Bild nicht laenger vor als seine Quelle', () => {
    // Ein Bild, das laenger gilt als die Seite, aus der die Zahlen stammen,
    // zeigt irgendwann einen Stand, den es dort nicht mehr gibt.
    expect(route).toMatch(/s-maxage=3600/);
  });
});

describe('Die Bilder nutzen dieselbe Formatierung wie die Seite', () => {
  it('keine handgebauten Zahlen', () => {
    const frames = ohneKommentare('src/lib/story-frames.tsx');
    expect(frames).toContain('formatPercent');
    expect(frames).toContain('formatPp');
    expect(frames).not.toMatch(/toFixed\(/);
  });

  it('Gruen und Rot bleiben der Richtung vorbehalten', () => {
    const frames = ohneKommentare('src/lib/story-frames.tsx');
    expect(frames).toMatch(/wert > 0 \? UP : wert < 0 \? DOWN : HELL/);
  });
});

describe('Marktbilder im Studio', () => {
  const panel = ohneKommentare('src/components/StoryPanel.tsx');
  const formate = ohneKommentare('src/lib/story-formats.ts');

  it('die Masse liegen in einer Datei ohne Abhaengigkeiten', () => {
    // BEFUND: Importiert ein Client-Bauteil sie aus der Renderdatei, zieht es
    // `next/og` und `fs/promises` ins Browser-Paket — der Bau bricht dann mit
    // "module not found" ab, und zwar erst beim Buendeln, nicht bei der
    // Typpruefung.
    expect(formate).not.toMatch(/import .*(next\/og|fs\/promises)/);
    expect(panel).toContain("from '@/lib/story-formats'");
    expect(panel).not.toContain("from '@/lib/story-frames'");
  });

  it('das Vorschaufeld reserviert das Seitenverhaeltnis', () => {
    // Sonst springt es, sobald das Bild eintrifft.
    expect(panel).toMatch(/aspectRatio/);
  });

  it('laedt die Vorschauen einzeln auf Anforderung', () => {
    // BEFUND: Alle vier gleichzeitig — vier PNGs mit je 1,4 Megapixeln, jedes
    // aus einem eigenen Bildaufbau am Server. Der Browser im Test ist dabei
    // abgestuerzt; auf einem Telefon waere es minutenlanges Warten fuer vier
    // Bilder, von denen man eines braucht.
    expect(panel).toContain('Vorschau laden');
    expect(panel).toMatch(/geladen\.has\(v\.id\)/);
    // Das Herunterladen bleibt ohne Vorschau moeglich.
    expect(panel).toContain('download=');
  });

  it('erzwingt beim Neuladen ein frisches Bild', () => {
    // Ohne Zaehler liefert der Browser dasselbe Bild aus seinem
    // Zwischenspeicher, und man glaubt, die Erneuerung habe nicht gewirkt.
    expect(panel).toMatch(/&v=\$\{stand\}/);
  });

  it('bietet Herunterladen, aber KEIN Veroeffentlichen', () => {
    // Ein Bild, das automatisch hinausgeht, sieht sich niemand mehr an — und
    // bei Inhalten, die Marktzahlen behaupten, ist der Blick davor der
    // eigentliche Schutz.
    expect(panel).toContain('download=');
    expect(panel).not.toMatch(/instagram|publish|veroeffentlich/i);
  });
});
