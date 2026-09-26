import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  einordnen,
  hostVon,
  pfadBereinigen,
  geraetVonBreite,
  wirdGezaehlt,
  auswerten,
  AUFRUFE_SETUP_SQL,
  type AufrufZeile,
} from '@/lib/aufrufe';

const WURZEL = process.cwd();
const lies = (d: string) => readFileSync(join(WURZEL, d), 'utf8');

/** Kommentare entfernen, bevor nach verbotenen Zeichenfolgen gesucht wird. */
function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const EIGENER = 'new-idea-livid.vercel.app';
const basis = { verweis: '', parameter: '', eigenerHost: EIGENER, einstieg: true };

describe('Herkunft wird aus Verweis und Kampagnenparametern abgeleitet', () => {
  it('erkennt Suchmaschinen — auch mit Landesendung und www', () => {
    for (const url of ['https://www.google.de/search?q=x', 'https://duckduckgo.com/', 'https://ecosia.org/x']) {
      expect(einordnen({ ...basis, verweis: url }).kanal).toBe('suche');
    }
  });

  it('erkennt soziale Netze, auch die Kurzadressen', () => {
    for (const url of ['https://t.co/abc', 'https://l.instagram.com/?u=x', 'https://www.reddit.com/r/x']) {
      expect(einordnen({ ...basis, verweis: url }).kanal).toBe('sozial');
    }
  });

  it('nennt fremde Seiten Verweis und behaelt den Hostnamen ohne www', () => {
    const e = einordnen({ ...basis, verweis: 'https://www.pokewiki.de/seite' });
    expect(e.kanal).toBe('verweis');
    expect(e.herkunft).toBe('pokewiki.de');
  });

  it('ohne Verweis ist der Kanal „direkt", nicht „unbekannt"', () => {
    expect(einordnen({ ...basis, verweis: '' }).kanal).toBe('direkt');
  });

  it('der eigene Host ist keine Herkunft', () => {
    expect(einordnen({ ...basis, verweis: `https://${EIGENER}/sets` }).kanal).toBe('intern');
    // Auch mit www davor — sonst zaehlte die halbe eigene Seite als Verweis.
    expect(einordnen({ ...basis, verweis: `https://www.${EIGENER}/sets` }).kanal).toBe('intern');
  });

  // DER TEURE FEHLER, DEN ES HIER ZU VERHINDERN GILT:
  // `document.referrer` bleibt bei einem Seitenwechsel im Browser stehen. Ohne
  // die Unterscheidung `einstieg` wuerde ein Besuch mit fuenf Seitenwechseln
  // fuenfmal als „von Google gekommen" gezaehlt — die Herkunftsstatistik waere
  // um die Seitentiefe aufgeblaeht.
  it('ein Seitenwechsel im Browser hat keine Herkunft, egal was der Verweis sagt', () => {
    const e = einordnen({ ...basis, verweis: 'https://www.google.de/search?q=x', einstieg: false });
    expect(e.kanal).toBe('intern');
    expect(e.herkunft).toBe('intern');
  });

  it('utm-Parameter schlagen den Verweis — und das Medium bestimmt den Kanal', () => {
    const e = einordnen({
      ...basis,
      verweis: 'https://www.google.de/',
      parameter: '?utm_source=instagram&utm_medium=reel&utm_campaign=top-mover',
    });
    expect(e.kanal).toBe('sozial');
    expect(e.herkunft).toBe('instagram');
    expect(e.kampagne).toBe('top-mover');
  });

  it('eine Quelle ohne Medium wird am Namen erkannt', () => {
    expect(einordnen({ ...basis, parameter: '?utm_source=instagram' }).kanal).toBe('sozial');
    expect(einordnen({ ...basis, parameter: '?utm_source=newsletter' }).kanal).toBe('kampagne');
  });

  it('ein unbrauchbarer Verweis wirft nicht, sondern gilt als kein Host', () => {
    expect(hostVon('nicht-mal-eine-url')).toBe('');
    expect(einordnen({ ...basis, verweis: 'kaputt' }).kanal).toBe('direkt');
  });
});

describe('Der gemeldete Pfad wird begrenzt, nicht bereinigt', () => {
  it('nimmt normale Pfade und wirft Abfrageteil und Anker weg', () => {
    expect(pfadBereinigen('/karten/sv3pt5-4?utm_source=x#top')).toBe('/karten/sv3pt5-4');
  });

  it('vereinheitlicht den Schraegstrich am Ende — sonst zaehlt eine Seite zweimal', () => {
    expect(pfadBereinigen('/sets/')).toBe('/sets');
    expect(pfadBereinigen('/')).toBe('/');
  });

  it('weist ab statt zu reparieren: Steuerzeichen, Rueckstriche, fremde Adressen, Ueberlaenge', () => {
    expect(pfadBereinigen('https://boese.example/x')).toBeNull();
    expect(pfadBereinigen('/x\\y')).toBeNull();
    expect(pfadBereinigen('/x\u0009y')).toBeNull();
    expect(pfadBereinigen(`/${'a'.repeat(300)}`)).toBeNull();
    expect(pfadBereinigen(42)).toBeNull();
    expect(pfadBereinigen(null)).toBeNull();
  });

  it('die eigenen Werkzeuge zaehlen nicht als Publikum', () => {
    expect(wirdGezaehlt('/studio')).toBe(false);
    expect(wirdGezaehlt('/monitoring')).toBe(false);
    expect(wirdGezaehlt('/studio/irgendwas')).toBe(false);
    expect(wirdGezaehlt('/')).toBe(true);
    // Keine Praefix-Verwechslung: /studios waere eine echte Seite.
    expect(wirdGezaehlt('/studios')).toBe(true);
  });

  it('die Geraeteklasse hat drei Stufen und faellt nie aus', () => {
    expect(geraetVonBreite(390)).toBe('mobil');
    expect(geraetVonBreite(820)).toBe('tablet');
    expect(geraetVonBreite(1440)).toBe('desktop');
    expect(geraetVonBreite(undefined)).toBe('desktop');
    expect(geraetVonBreite(NaN)).toBe('desktop');
  });
});

describe('Die Auswertung zaehlt Aufrufe, nicht Besucher', () => {
  const zeilen: AufrufZeile[] = [
    { tag: '2026-09-26', pfad: '/', kanal: 'suche', herkunft: 'google.com', kampagne: '', geraet: 'mobil', aufrufe: 10 },
    { tag: '2026-09-26', pfad: '/sets', kanal: 'intern', herkunft: 'intern', kampagne: '', geraet: 'mobil', aufrufe: 7 },
    { tag: '2026-09-25', pfad: '/', kanal: 'sozial', herkunft: 'instagram', kampagne: 'top-mover', geraet: 'desktop', aufrufe: 3 },
  ];

  it('zaehlt alle Aufrufe, aber nur Einstiege in die Herkunft', () => {
    const s = auswerten(zeilen, 30, '2026-09-26');
    expect(s.gesamt).toBe(20);
    expect(s.heute).toBe(17);
    // 10 + 3 — die sieben internen Wechsel sind Aufrufe, aber keine Einstiege.
    expect(s.einstiege).toBe(13);
    expect(s.herkuenfte.map((h) => h.name)).toEqual(['google.com', 'instagram']);
    expect(s.herkuenfte.find((h) => h.name === 'intern')).toBeUndefined();
  });

  // Der Seitenwechsel darf die Wegeaufstellung nicht anfuehren: Mit ihm stuende
  // die uninteressanteste Zeile ganz oben und verdraengte die Frage, wegen der
  // man herkommt.
  it('fuehrt „intern" nicht als Weg auf', () => {
    const s = auswerten(zeilen, 30, '2026-09-26');
    expect(s.kanaele.map((k) => k.name).sort()).toEqual(['sozial', 'suche']);
    expect(s.kanaele.reduce((n, k) => n + k.aufrufe, 0)).toBe(s.einstiege);
    // Anteile beziehen sich damit auf die Einstiege, nicht auf alle Aufrufe.
    expect(Math.round(s.kanaele.find((k) => k.name === 'suche')!.anteil)).toBe(Math.round((10 / 13) * 100));
  });

  // Die Geraeteklasse gilt dagegen fuer JEDEN Aufruf — dort ist der
  // Seitenwechsel eine echte Beobachtung, keine Verwaesserung.
  it('zaehlt Geraete ueber alle Aufrufe', () => {
    const s = auswerten(zeilen, 30, '2026-09-26');
    expect(s.geraete.reduce((n, g) => n + g.aufrufe, 0)).toBe(s.gesamt);
  });

  it('bezieht Herkunfts-Anteile auf die Einstiege, nicht auf alle Aufrufe', () => {
    const s = auswerten(zeilen, 30, '2026-09-26');
    const google = s.herkuenfte.find((h) => h.name === 'google.com')!;
    expect(Math.round(google.anteil)).toBe(Math.round((10 / 13) * 100));
  });

  it('der Tagesverlauf steht aufsteigend, sonst laeuft die Grafik rueckwaerts', () => {
    expect(auswerten(zeilen, 30, '2026-09-26').proTag.map((t) => t.tag)).toEqual(['2026-09-25', '2026-09-26']);
  });

  it('kuerzt einen Zeitstempel auf das Datum (Stolperstelle 46)', () => {
    const s = auswerten(
      [{ ...zeilen[0], tag: '2026-09-26T00:00:00+00:00' }],
      30,
      '2026-09-26',
    );
    expect(s.heute).toBe(10);
  });

  it('ignoriert unbrauchbare Anzahlen, statt NaN zu summieren', () => {
    const s = auswerten(
      [{ ...zeilen[0], aufrufe: null }, { ...zeilen[0], aufrufe: -5 }, zeilen[0]],
      30,
      '2026-09-26',
    );
    expect(s.gesamt).toBe(10);
  });

  it('ohne Daten ist alles null und nichts geraten', () => {
    const s = auswerten([], 30, '2026-09-26');
    expect(s.gesamt).toBe(0);
    expect(s.kanaele).toEqual([]);
    expect(s.herkuenfte).toEqual([]);
  });
});

describe('Die Zaehlung bleibt ohne Kennzeichen und ohne Speicher im Browser', () => {
  const zaehler = ohneKommentare(lies('src/components/Seitenzaehler.tsx'));
  const route = ohneKommentare(lies('src/app/api/zaehler/route.ts'));
  const bibliothek = ohneKommentare(lies('src/lib/aufrufe.ts'));

  it('setzt weder Cookie noch lokalen Speicher — sonst braeuchte es ein Einwilligungsbanner', () => {
    for (const quelle of [zaehler, route, bibliothek]) {
      expect(quelle).not.toMatch(/localStorage|sessionStorage|document\.cookie|crypto\.randomUUID/);
    }
  });

  it('speichert weder IP-Adresse noch Browserkennung', () => {
    // `clientIp` darf vorkommen — es ist die Missbrauchsbremse. Was nicht
    // vorkommen darf, ist die Adresse als Feld im Eintrag.
    expect(route).not.toMatch(/user-agent|userAgent/i);
    expect(bibliothek).not.toMatch(/user-agent|userAgent|ip_adresse|\bip:/i);
  });

  it('meldet den Verweis nur beim ersten Aufruf eines Seitenladens', () => {
    expect(zaehler).toMatch(/einstieg \? document\.referrer : ''/);
  });

  it('ordnet auf dem Server ein — im Browser waere die Herkunft frei waehlbar', () => {
    expect(zaehler).not.toMatch(/\bkanal\b/);
    expect(route).toMatch(/einordnen\(/);
  });
});

describe('Der Aufbau der Datenbank ist vollstaendig beschrieben', () => {
  it('nennt Tabelle UND Zaehlfunktion — ohne eine von beiden zaehlt nichts', () => {
    expect(AUFRUFE_SETUP_SQL).toMatch(/CREATE TABLE IF NOT EXISTS page_views/);
    expect(AUFRUFE_SETUP_SQL).toMatch(/CREATE OR REPLACE FUNCTION zaehle_aufruf/);
    expect(AUFRUFE_SETUP_SQL).toMatch(/ON CONFLICT/);
  });

  // Die Tabelle steht in derselben Datenbank wie die Portfolios. Sobald der
  // oeffentliche anon-Schluessel gesetzt ist, ist alles ohne Zeilenschutz
  // fuer jeden lesbar -- auch die eigene Reichweite.
  it('schaltet den Zeilenschutz ein', () => {
    expect(AUFRUFE_SETUP_SQL).toMatch(/ALTER TABLE page_views ENABLE ROW LEVEL SECURITY/);
  });

  // SECURITY DEFINER waere hier ein Loch: Die Zaehlfunktion liesse sich dann
  // mit dem oeffentlichen Schluessel direkt aufrufen, an der Missbrauchsbremse
  // in /api/zaehler vorbei.
  it('laesst die Zaehlfunktion mit den Rechten des Aufrufers laufen', () => {
    expect(AUFRUFE_SETUP_SQL).not.toMatch(/SECURITY DEFINER/);
  });

  it('legt den Tag als DATE an, nicht als Zeitstempel (Stolperstelle 46)', () => {
    expect(AUFRUFE_SETUP_SQL).toMatch(/tag\s+DATE NOT NULL/);
    expect(AUFRUFE_SETUP_SQL).not.toMatch(/tag\s+TIMESTAMPTZ/);
  });

  it('das Monitoring bietet das SQL an, wenn der Aufbau fehlt', () => {
    const api = lies('src/app/api/monitoring/route.ts');
    expect(api).toMatch(/AUFRUFE_SETUP_SQL/);
    expect(api).toMatch(/ladeAufrufStatistik/);
  });
});

describe('Der Zaehler nimmt die Seite nicht aus der statischen Erzeugung', () => {
  // `useSearchParams` ohne Suspense-Grenze macht JEDE Seite dynamisch —
  // dieselbe Falle wie `cookies()` in einem Server-Baustein (Stolperstelle 8).
  // Ein Zaehler, der die ganze Seite verlangsamt, kostet mehr, als er misst.
  it('steht im Grundgeruest in einer Suspense-Grenze', () => {
    const layout = lies('src/app/layout.tsx');
    expect(layout).toMatch(/<Suspense[^>]*>\s*<Seitenzaehler \/>\s*<\/Suspense>/);
  });
});

describe('Die Datenschutzerklaerung beschreibt die eigene Zaehlung', () => {
  const text = lies('src/app/datenschutz/page.tsx');

  it('nennt den Endpunkt und die gespeicherten Angaben', () => {
    expect(text).toMatch(/\/api\/zaehler/);
    expect(text).toMatch(/utm_/);
  });

  it('haelt fest, dass weder Cookie noch IP noch Browserkennung gespeichert werden', () => {
    expect(text).toMatch(/kein Cookie gesetzt/);
    expect(text).toMatch(/IP-Adresse noch deine[\s\S]{0,40}Browserkennung/);
  });

  it('begruendet, warum keine Einwilligung noetig ist', () => {
    expect(text).toMatch(/§ 25 TDDDG ist nicht einschl|§ 25 TDDDG nicht einschl/);
  });
});
