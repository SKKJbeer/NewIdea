import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';
import { BRAND, INDEX_SHORT, INDEX_LONG } from '@/lib/brand';
import { buildMarketContext, CONTEXT_WINDOW_DAYS } from '@/lib/market-context';
import { verteilung } from '@/components/MarketHeader';
import type { PokemonCard } from '@/types';

// Die Zusagen der Umbenennung — als Prüfungen, nicht als Absichtserklärung.

const WURZEL = process.cwd();
const lies = (d: string) => readFileSync(join(WURZEL, d), 'utf8');

/** Quelldateien ohne Tests. Der Verlauf bleibt ausgenommen: Dort steht, wie das
 *  Produkt hieß, und das ist der Zweck eines Verlaufs. */
function quellen(): string[] {
  return globSync('src/**/*.{ts,tsx}', { cwd: WURZEL }).filter(
    (f) => !f.includes('__tests__') && !f.includes('changelog'),
  );
}

function ohneKommentare(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('Die alte Marke ist vollständig verschwunden', () => {
  it('kommt in keiner sichtbaren Zeile mehr vor', () => {
    const treffer: string[] = [];
    for (const datei of quellen()) {
      // AUSNAHME mit Grund: `studio-auth.ts` verwendet die alte Zeichenkette als
      // Salz des Sitzungstokens. Sie ist nirgends sichtbar — sie zu ändern
      // würde ausschließlich alle bestehenden Anmeldungen ungültig machen.
      if (datei.endsWith('studio-auth.ts')) continue;
      for (const zeile of ohneKommentare(lies(datei)).split('\n')) {
        if (/Pok[ée]Market/i.test(zeile)) treffer.push(`${datei}  ${zeile.trim().slice(0, 80)}`);
      }
    }
    expect(treffer, `Alte Marke gefunden:\n${treffer.join('\n')}`).toEqual([]);
  });

  it('steht an genau einer Stelle definiert', () => {
    // Vorher stand der Name als Zeichenkette in Metadaten, Fußzeile,
    // Newsletter-Vorlage, JSON-LD und einem Dutzend Überschriften. Genau
    // deshalb war eine Umbenennung eine Suchen-und-Ersetzen-Übung mit Resten.
    expect(BRAND).toBe('CardBeacon');
    expect(lies('src/lib/brand.ts')).toContain("export const BRAND = 'CardBeacon'");
  });

  it('die Wortmarke bildet kein einzelnes Kartenspiel ab', () => {
    // Ein Pokéball im Logo wäre in dem Moment falsch, in dem ein zweiter Markt
    // dazukommt — und sähe aus wie jedes andere Sammel-Werkzeug.
    // Ohne Kommentare geprüft — die Begründung im Quelltext nennt die
    // vermiedenen Muster absichtlich beim Namen.
    const mark = ohneKommentare(lies('src/components/Wordmark.tsx'));
    expect(mark).not.toMatch(/pok[ée]ball|pokeball/i);
    // Verläufe sind das Erkennungszeichen automatisch erzeugter Logos.
    expect(mark).not.toMatch(/gradient/i);
  });
});

describe('Der Index heißt sichtbar CBI', () => {
  it('trägt Kurz- und Langform', () => {
    expect(INDEX_SHORT).toBe('CBI');
    expect(INDEX_LONG).toBe('CardBeacon Index');
  });

  it('taucht als alte Abkürzung nirgends sichtbar auf', () => {
    // Interne Bezeichner (PMI_MIN_CARDS, computePmi, PmiResult) bleiben —
    // die geprüften Rechenwege umzubenennen brächte Risiko ohne Nutzen.
    const treffer: string[] = [];
    for (const datei of quellen()) {
      if (datei.includes('brand.ts')) continue;
      for (const zeile of ohneKommentare(lies(datei)).split('\n')) {
        const ohneBezeichner = zeile.replace(
          /PMI_MIN_CARDS|PmiResult|computePmi|pmiScore|PmiScorePanel|MIN_POINTS|pmi\b/g,
          '',
        );
        if (/\bPMI\b/.test(ohneBezeichner)) {
          treffer.push(`${datei}  ${zeile.trim().slice(0, 80)}`);
        }
      }
    }
    expect(treffer, `Sichtbares PMI gefunden:\n${treffer.join('\n')}`).toEqual([]);
  });

  it('die Methodik erklärt ihn unter dem neuen Namen', () => {
    const m = lies('src/app/methodik/page.tsx');
    expect(m).toContain('CardBeacon Index');
    expect(m).toContain('CBI = Σ');
  });
});

// ── Marktkontext ────────────────────────────────────────────────────────────

function karte(trend: number | undefined, gemessen = true): PokemonCard {
  return {
    id: 'x-1',
    name: 'Testkarte',
    set: 'Testset',
    setCode: 'tst',
    rarity: 'Rare',
    imageUrl: 'https://images.pokemontcg.io/tst/1.png',
    prices: { market: 10 },
    trendPercent: trend ?? 0,
    realData: trend !== undefined ? gemessen : false,
  } as PokemonCard;
}

describe('Marktkontext vergleicht nur Vergleichbares', () => {
  const markt = { value: -0.2, cardCount: 204, setCount: 15 };
  const set = { code: 'tst', name: 'Testset', value: -4.2, measured: 12, medianPrice: 20 };

  it('stellt Karte, Set und Index nebeneinander', () => {
    const ctx = buildMarketContext(karte(-13.6), set, markt);
    expect(ctx?.rows.map((r) => r.label)).toEqual(['Testkarte', 'Testset', 'CardBeacon Index']);
  });

  it('rechnet den Abstand in Prozentpunkten', () => {
    // −13,6 gegen −0,2 sind 13,4 Prozentpunkte, nicht 13,4 Prozent.
    const ctx = buildMarketContext(karte(-13.6), set, markt);
    expect(ctx?.relativeToMarket).toBeCloseTo(-13.4, 5);
  });

  it('lässt das Set weg, wenn dafür keine Daten vorliegen', () => {
    // Kein Ersatzwert, keine Schätzung — die Zeile entfällt.
    const ctx = buildMarketContext(karte(-13.6), null, markt);
    expect(ctx?.rows).toHaveLength(2);
    expect(ctx?.rows.some((r) => r.label === 'Testset')).toBe(false);
  });

  it('zeigt gar nichts, wenn die Karte selbst nicht gemessen ist', () => {
    expect(buildMarketContext(karte(undefined, false), set, markt)).toBeNull();
  });

  it('zeigt gar nichts, wenn es nichts zu vergleichen gibt', () => {
    // Eine Tabelle mit nur der Karte selbst ist kein Kontext.
    expect(buildMarketContext(karte(-13.6), null, null)).toBeNull();
  });

  it('ohne Index kein Abstand zum Index', () => {
    const ctx = buildMarketContext(karte(-13.6), set, null);
    expect(ctx?.relativeToMarket).toBeNull();
  });

  it('nutzt überall denselben Zeitraum', () => {
    // Ein Vergleich von 30 Tagen gegen 7 Tage sähe aus wie eine Erkenntnis und
    // wäre ein Rechenfehler.
    expect(CONTEXT_WINDOW_DAYS).toBe(30);
    const ctx = buildMarketContext(karte(-13.6), set, markt);
    expect(ctx?.windowDays).toBe(30);
    const quelle = lies('src/lib/market-context.ts');
    expect(quelle).toContain('NUR GLEICHE ZEITRÄUME');
  });

  it('holt Set-Vergleich und Index über dieselbe Mindest-Stichprobe', () => {
    const quelle = lies('src/lib/market-context.ts');
    expect(quelle).toContain('MIN_SET_SAMPLE');
    expect(quelle).toContain('hasRealTrend');
  });
});

describe('Die Verteilung im Marktkopf zählt echte Messwerte', () => {
  it('ordnet jede Bewegung genau einer Klasse zu', () => {
    const werte = [-25, -12, -7, -2, 3, 8, 15, 40];
    const summe = verteilung(werte).reduce((s, k) => s + k.anzahl, 0);
    expect(summe).toBe(werte.length);
  });

  it('trennt an der Null', () => {
    const k = verteilung([-0.1, 0.1]);
    expect(k.find((x) => x.label === '−5 bis 0')?.anzahl).toBe(1);
    expect(k.find((x) => x.label === '0 bis +5')?.anzahl).toBe(1);
  });

  it('erfindet ohne Werte nichts', () => {
    expect(verteilung([]).every((k) => k.anzahl === 0)).toBe(true);
  });
});

describe('Aufbau und Zurückhaltung', () => {
  it('es gibt keinen Balken am oberen Rand', () => {
    // Weder als Ladeanzeige noch als Lesefortschritt: Ein Balken oben sagt
    // „irgendwo passiert etwas" — genau das, was niemand braucht.
    const treffer = quellen().filter((d) => {
      const s = ohneKommentare(lies(d));
      return /fixed (top-0|inset-x-0 top-0)[^"]*h-\[?[0-3]/.test(s) && /scrollY|progress/i.test(s);
    });
    expect(treffer, `Fortschrittsbalken gefunden:\n${treffer.join('\n')}`).toEqual([]);
  });

  it('die Marktseiten kommen ohne Kachel-Radien aus', () => {
    // DESIGN.md §4: Datenflächen haben Kanten. `rounded-2xl` war der Radius
    // der Vorgängerfassung und ließ jede Datenfläche wie ein Werbebanner
    // aussehen.
    for (const datei of [
      'src/app/page.tsx',
      'src/app/research/page.tsx',
      'src/components/MarketHeader.tsx',
      'src/components/MarketModules.tsx',
      'src/components/MarketContextPanel.tsx',
      'src/components/NavBar.tsx',
      'src/components/SiteFooter.tsx',
    ]) {
      expect(lies(datei), datei).not.toContain('rounded-2xl');
    }
  });

  it('die Farbregel steht einmal und wird benutzt', () => {
    expect(lies('src/lib/ui.ts')).toContain('export function toneClass');
    for (const datei of [
      'src/components/MarketHeader.tsx',
      'src/components/MarketModules.tsx',
      'src/components/MarketContextPanel.tsx',
    ]) {
      expect(lies(datei), datei).toContain('toneClass');
    }
  });
});

describe('Suche und Kartenbilder funktionieren verlässlich', () => {
  const api = lies('src/lib/pokemon-api.ts');

  it('die Suche gibt nach einem Aussetzer nicht sofort auf', () => {
    // BEFUND: `searchCards` war der EINZIGE Abruf ohne Wiederholungsversuch —
    // ausgerechnet die Funktion, die immer funktionieren muss. Ein kurzer
    // Aussetzer der Kartendatenbank führte sofort zu „Suche momentan nicht
    // verfügbar", obwohl die Karte existiert.
    const block = api.slice(api.indexOf('export async function searchCards'), api.indexOf('export async function searchCards') + 2600);
    expect(block).toMatch(/tcgList\(/);
    expect(block).toMatch(/retries: 3/);
    // Kein roher Abruf mehr in dieser Funktion.
    expect(block).not.toMatch(/axios\.get\(/);
  });

  it('liefert bei einem Totalausfall die letzten echten Treffer', () => {
    // Gemessen antwortete DIESELBE Suchanfrage zweimal von drei Malen mit
    // HTTP 500. Wiederholungen fangen das meiste ab, aber nicht alles — und
    // eine Suche, die manchmal „nicht verfügbar" sagt, ist für die Benutzung
    // dasselbe wie eine kaputte Suche.
    expect(api).toContain('sucheCache');
    expect(api).toMatch(/SUCHE_CACHE_MS/);
    // Begrenzt, damit der Speicher nicht mit jeder Anfrage wächst.
    expect(api).toMatch(/SUCHE_CACHE_MAX/);
  });

  it('wartet zwischen den Versuchen länger statt gleich lang', () => {
    // Bei flacher Wartezeit landen alle Versuche in derselben Störung.
    expect(api).toMatch(/400 \* 2 \*\* attempt/);
  });

  it('die Set-Karten ebenso', () => {
    const block = api.slice(api.indexOf('export async function fetchCardsBySet'));
    expect(block.slice(0, 900)).toMatch(/tcgList\(/);
    expect(block.slice(0, 900)).not.toMatch(/axios\.get\(/);
  });

  it('das Kartenbild hängt nicht an einem Ereignis', () => {
    // BEFUND: Das Bild startete mit `opacity-0` und wurde erst bei `onLoad`
    // sichtbar. Ist das Bild schon geladen, bevor React den Behandler anhängt,
    // feuert `onLoad` nie — die Karte bleibt dann dauerhaft leer.
    // Ohne Kommentare geprüft — die Begründung nennt beide Muster beim Namen.
    const bild = ohneKommentare(lies('src/components/CardImage.tsx'));
    expect(bild).not.toContain('onLoad');
    expect(bild).not.toContain('opacity-0');
    // Der Platzhalter bleibt — er liegt jetzt hinter dem Bild.
    expect(bild).toContain('shimmer');
  });
});

describe('Die Seite ist bedienbar, bevor sie fertig ist', () => {
  it('das Lade-Skelett trägt die echte Navigation', () => {
    // BEFUND VOM ECHTEN GERÄT: Waehrend des Ladens stand oben ein leerer
    // Streifen. Kein Logo, kein Menue, kein Zurueck — wer weg wollte, konnte
    // nicht. Bei einer langsamen Seite ist das genau der Moment, in dem man
    // weg will, und dann war sie eine Sackgasse.
    const skelett = lies('src/components/RouteSkeleton.tsx');
    expect(skelett).toContain('<NavBar />');
    expect(skelett).not.toMatch(/sticky top-0 z-50 h-14 border-b[^"]*"\s*\/>/);
  });

  it('der Marktkontext blockiert die Kartenseite nicht', () => {
    // Er kostet auf einer kalt gestarteten Instanz mehrere Sekunden. Vorher
    // wartete die GANZE Seite darauf: Kartenbild, Preis, Kaufknoepfe — alles
    // hing an einer Zahl, die ganz unten steht.
    const seite = lies('src/app/karten/[id]/page.tsx');
    expect(seite).toContain('<Suspense fallback={<MarketContextSkeleton />}>');
    // Kein Abwarten mehr im Seitenrumpf.
    expect(seite).not.toContain('await getMarketBenchmark');
    expect(seite).not.toContain('await Promise.all([');
  });

  it('der Vergleich hat eine Obergrenze', () => {
    // Die Einzelabrufe koennten zusammengenommen fast eine Minute laufen.
    const ctx = lies('src/lib/market-context.ts');
    expect(ctx).toContain('BUDGET_MS');
    expect(ctx).toContain('mitZeitgrenze(');
  });

  it('der Platzhalter hat die Form des Abschnitts', () => {
    // Gleiche Hoehe wie der fertige Block — sonst springt der Inhalt beim
    // Nachruecken.
    const abschnitt = lies('src/components/MarketContextSection.tsx');
    expect(abschnitt).toContain('MarketContextSkeleton');
    expect(abschnitt).toContain('aria-busy');
  });
});

describe('Der Indexstand wird gespeichert statt nachgerechnet', () => {
  const ctx = lies('src/lib/market-context.ts');
  const store = lies('src/lib/market-index-store.ts');

  it('liest den gespeicherten Stand VOR einer Neuberechnung', () => {
    // Vorher holte jede kalt gestartete Instanz 250 Karten aus dem Netz — fuer
    // EINE Zahl, die sich einmal am Tag aendert.
    const vorLaden = ctx.indexOf('loadLatestMarketIndex');
    const vorRechnen = ctx.indexOf('getHomepageCards(250)');
    expect(vorLaden).toBeGreaterThan(0);
    expect(vorLaden).toBeLessThan(vorRechnen);
  });

  it('rechnet weiterhin selbst, wenn nichts gespeichert ist', () => {
    // Der Speicher ist eine Abkuerzung, kein Ersatz. Ohne Eintrag muss die
    // Zahl trotzdem entstehen.
    expect(ctx).toContain('getHomepageCards(250)');
  });

  it('haelt kein Fehlergebnis eine Stunde lang fest', () => {
    // ANLASS: Nach dem Anlegen der Tabelle zeigte eine Kartenseite den
    // Marktvergleich und eine andere nicht. Ursache war der Zwischenspeicher im
    // Arbeitsspeicher: Er wurde auch mit `null` befuellt, galt eine Stunde und
    // wird VOR der Datenbankstufe geprueft — eine Instanz, die einmal zu wenig
    // Daten hatte, sah den gespeicherten Tagesstand danach gar nicht mehr an.
    // Zwischengespeichert wird nur, was auch eine Auskunft ist.
    // Die duenne Datenlage fuehrt zu einem Rueckgabewert OHNE Zwischenspeichern.
    expect(ctx).toMatch(/if \(!cbi\.sufficient\) \{[\s\S]{0,800}?return null;\s*\n\s*\}/);
    // Und der frueher benutzte Dreiklang „null oder Wert, dann ablegen" ist weg.
    expect(ctx).not.toContain('cbi.sufficient\n      ?');
    // Der Werttyp des Zwischenspeichers laesst `null` gar nicht erst zu.
    expect(ctx).toMatch(/let cache: \{ wert: MarketBenchmark; zeit: number \} \| null/);
  });

  it('gibt einen zu alten Stand nicht als aktuell aus', () => {
    // Eine Zahl von letzter Woche ist keine Auskunft ueber heute.
    expect(store).toContain('maxAgeDays');
    expect(store).toMatch(/alter > maxAgeDays/);
  });

  it('speichert idempotent je Tag', () => {
    // Die Startseite wird stuendlich neu erzeugt — das darf keine zweite Zeile
    // pro Aufruf anlegen.
    expect(store).toMatch(/onConflict: 'captured_on'/);
  });

  it('gibt die echte Fehlermeldung zurueck', () => {
    // Stolperstelle 21: `return false` verschluckt die Diagnose.
    expect(store).toMatch(/return error \? error\.message : null/);
  });

  it('die Startseite schreibt NACH der Antwort', () => {
    // Der Besucher wartet nicht auf einen Schreibvorgang, von dem er nichts hat.
    const seite = lies('src/app/page.tsx');
    expect(seite).toContain('saveMarketIndex');
    expect(seite).toMatch(/after\(async \(\) => \{[\s\S]{0,200}saveMarketIndex/);
    // Und nur, wenn der Wert ueberhaupt belastbar ist.
    expect(seite).toMatch(/if \(cbi\.sufficient\) \{/);
  });

  it('es gibt eine Stelle, die den Schreibvorgang nachweisbar macht', () => {
    // ANLASS: Zwei Schreibstellen sahen richtig aus und liefen nie — die
    // Startseite kommt aus dem Zwischenspeicher, die Index-Schnittstelle ist
    // beim Bauen vorgerendert. Beide Male war der einzige Nachweis, dass die
    // Tabelle leer blieb.
    const route = lies('src/app/api/studio/market-index/route.ts');
    expect(route).toContain("export const dynamic = 'force-dynamic'");
    expect(route).toContain('isStudioAuthedFromRequest');
    // Das Ergebnis steht in der Antwort, nicht nur im Log.
    expect(route).toMatch(/ok: !fehler/);
  });

  it('der Tages-Cron schreibt ihn als verlaessliche Untergrenze', () => {
    const cron = lies('src/app/api/cron/daily/route.ts');
    expect(cron).toContain('saveMarketIndex');
    // Und legt das Ergebnis in seine Antwort statt nur ins Log.
    expect(cron).toMatch(/results\.marketIndex/);
  });

  it('die fehlende Tabelle ist im Monitoring sichtbar', () => {
    const health = lies('src/lib/system-health.ts');
    expect(health).toContain('CREATE TABLE IF NOT EXISTS market_index');
    expect(health).toMatch(/table: 'market_index'/);
  });
});

describe('Navigation und Adressen', () => {
  it('Research ist ein eigenes Ziel', () => {
    expect(lies('src/components/NavBar.tsx')).toContain("{ href: '/research'");
    expect(() => lies('src/app/research/page.tsx')).not.toThrow();
  });

  it('keine bestehende Adresse hat sich geändert', () => {
    // Eine geänderte Adresse ist ein verlorenes Suchmaschinen-Ergebnis. Die
    // Umbenennung betrifft Texte, nicht Pfade.
    const sitemap = lies('src/app/sitemap.ts');
    for (const pfad of ['/suche', '/sets', '/artikel', '/guides', '/marktbericht', '/methodik', '/portfolio']) {
      expect(sitemap, pfad).toContain(pfad);
    }
  });

  it('die kanonische Adresse kommt aus der Konfiguration', () => {
    // Sie darf nie auf eine geratene Produktionsadresse zeigen.
    // Eine geratene Produktionsadresse ist ausgeschlossen: `site.ts` nimmt nur
    // die bewusst gesetzte Domain oder die Adresse, unter der dieses
    // Deployment tatsächlich läuft.
    expect(lies('src/lib/site.ts')).toContain('NEXT_PUBLIC_SITE_URL');
    expect(lies('src/lib/site.ts')).toContain('VERCEL_PROJECT_PRODUCTION_URL');
    expect(lies('src/lib/site.ts')).not.toMatch(/cardbeacon\.(com|io|app)/i);
    for (const datei of ['src/app/layout.tsx', 'src/app/sitemap.ts', 'src/app/robots.ts']) {
      expect(lies(datei), datei).toContain('siteUrlOrLocal');
    }
  });
});
