import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';
import { jsonLd, escapeHtml } from '@/lib/json-ld';
import { safeRedirectPath, DEFAULT_REDIRECT } from '@/lib/safe-redirect';
import { createRateLimiter, clientIp, isValidEmail } from '@/lib/rate-limit';
import { buildNewsletterHtml } from '@/lib/newsletter-template';
import type { PokemonCard } from '@/types';

// Diese Datei prüft nicht Funktionen, sondern Zusagen. Jeder Abschnitt gehört
// zu einem konkreten Befund aus der Sicherheitsdurchsicht v2.35.0 — die
// Prüfung ist der Beleg, dass der Befund geschlossen ist und geschlossen
// bleibt.

const WURZEL = process.cwd();
const lies = (datei: string) => readFileSync(join(WURZEL, datei), 'utf8');

// ── Befund 1: XSS über strukturierte Daten ──────────────────────────────────

describe('jsonLd', () => {
  const AUSBRUCH = 'Glurak</script><script>alert(document.cookie)</script>';

  it('lässt keinen Skriptblock enden', () => {
    const ausgabe = jsonLd({ name: AUSBRUCH });
    expect(ausgabe).not.toContain('</script>');
    expect(ausgabe).not.toContain('<script>');
  });

  it('maskiert die drei gefährlichen Zeichen', () => {
    expect(jsonLd({ a: '<' })).toContain('\\u003c');
    expect(jsonLd({ a: '>' })).toContain('\\u003e');
    expect(jsonLd({ a: '&' })).toContain('\\u0026');
  });

  it('maskiert die Zeilentrenner U+2028 und U+2029', () => {
    // In JSON erlaubt, in JavaScript-Quelltext ein Zeilenumbruch — unmaskiert
    // zerbricht das den eingebetteten Block.
    expect(jsonLd({ a: '\u2028' })).toContain('\\u2028');
    expect(jsonLd({ a: '\u2029' })).toContain('\\u2029');
    expect(jsonLd({ a: '\u2028' })).not.toContain('\u2028');
  });

  it('verändert die Daten inhaltlich nicht', () => {
    const daten = { name: AUSBRUCH, preis: 12.5, liste: ['a<b', '&'], tief: { x: null } };
    expect(JSON.parse(jsonLd(daten))).toEqual(daten);
  });

  it('lässt harmlose Werte unangetastet', () => {
    expect(jsonLd({ name: 'Pikachu' })).toBe('{"name":"Pikachu"}');
  });
});

describe('escapeHtml', () => {
  it('maskiert alle fünf HTML-Sonderzeichen', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('maskiert das kaufmännische Und zuerst — sonst doppelte Maskierung', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('verträgt null und undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('Keine Seite bettet unmaskiertes JSON ein', () => {
  it('nutzt überall jsonLd() statt JSON.stringify', () => {
    const treffer: string[] = [];
    for (const datei of globSync('src/**/*.tsx', { cwd: WURZEL })) {
      const src = lies(datei);
      if (/__html:\s*JSON\.stringify/.test(src)) treffer.push(datei);
    }
    expect(
      treffer,
      'JSON.stringify maskiert `</script>` nicht — diese Dateien brauchen ' +
        `jsonLd() aus @/lib/json-ld:\n${treffer.join('\n')}`,
    ).toEqual([]);
  });

  it('kennt jede Stelle mit dangerouslySetInnerHTML', () => {
    // Absichtlich eine feste Liste: Eine neue Stelle soll auffallen und
    // bewusst freigegeben werden, nicht unbemerkt dazukommen.
    const erlaubt = new Set(['src/app/studio/page.tsx']);
    const unerwartet: string[] = [];

    for (const datei of globSync('src/**/*.tsx', { cwd: WURZEL })) {
      const src = lies(datei);
      if (!src.includes('dangerouslySetInnerHTML')) continue;
      // JSON-LD-Blöcke sind über jsonLd() abgesichert und zählen nicht.
      const roh = src
        .split('\n')
        .filter((z) => z.includes('dangerouslySetInnerHTML') && !z.includes('jsonLd('));
      if (roh.length === 0) continue;
      if (erlaubt.has(datei)) continue;
      unerwartet.push(datei);
    }

    expect(
      unerwartet,
      `Neue Stelle mit rohem HTML — bitte prüfen und bewusst freigeben:\n${unerwartet.join('\n')}`,
    ).toEqual([]);
  });
});

// ── Befund 4: Newsletter-Vorlage setzt Werte ungeprüft ein ──────────────────

describe('Newsletter-Vorlage', () => {
  const karte = (name: string): PokemonCard =>
    ({ id: 'x-1', name, set: 'Testset', setCode: 'tst', imageUrl: 'https://images.pokemontcg.io/tst/1.png' }) as PokemonCard;

  const daten = (überschreibung: Partial<Parameters<typeof buildNewsletterHtml>[0]> = {}) => ({
    subject: 'Betreff',
    intro: 'Einleitung',
    tip: 'Hinweis',
    tipTitle: 'Titel',
    ctaText: 'Aufruf',
    cardHighlights: [
      { name: 'Glurak', set: 'Testset', price: '10 €', trend: '+5%', score: 80, reason: 'Grund' },
    ],
    ...überschreibung,
  });

  it('maskiert einen Kartennamen mit HTML', () => {
    const html = buildNewsletterHtml(
      daten({
        cardHighlights: [
          {
            name: '<img src=x onerror=alert(1)>',
            set: 'Set',
            price: '1 €',
            trend: '+1%',
            score: 50,
            reason: 'Grund',
          },
        ],
      }),
      [],
    );
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('maskiert die von der Generierung gelieferten Texte', () => {
    const html = buildNewsletterHtml(
      daten({ intro: '</p><script>alert(1)</script>', tip: '<b>fett</b>' }),
      [],
    );
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<b>fett</b>');
  });

  it('lässt keine fremde Bildquelle in das src-Attribut', () => {
    const html = buildNewsletterHtml(
      daten(),
      [{ ...karte('Glurak'), imageUrl: 'https://boese.de/x.png" onerror="alert(1)' } as PokemonCard],
    );
    expect(html).not.toContain('boese.de');
    expect(html).not.toContain('onerror');
  });

  it('lässt die erlaubte Bildquelle durch', () => {
    const html = buildNewsletterHtml(daten(), [karte('Glurak')]);
    expect(html).toContain('https://images.pokemontcg.io/tst/1.png');
  });

  it('weist Bildquellen ohne https ab', () => {
    const html = buildNewsletterHtml(
      daten(),
      [{ ...karte('Glurak'), imageUrl: 'http://images.pokemontcg.io/tst/1.png' } as PokemonCard],
    );
    expect(html).not.toContain('images.pokemontcg.io/tst/1.png');
  });

  it('setzt keinen Wert mehr ohne Maskierung ein', () => {
    const src = lies('src/lib/newsletter-template.ts');
    const eingesetzt = src.match(/\$\{[^}]*\}/g) ?? [];
    const unmaskiert = eingesetzt.filter(
      (a) =>
        !a.includes('escapeHtml') &&
        // Berechnete Werte ohne Fremdeinfluss.
        !/\$\{(cardRows|imgSrc|i \+ 1|scoreColor|trendColor|week|now\.)/.test(a),
    );
    expect(unmaskiert, `Ungeprüft eingesetzt: ${unmaskiert.join(', ')}`).toEqual([]);
  });
});

// ── Befund 9: offene Weiterleitung in der Anmelde-Rückkehr ─────────────────

describe('safeRedirectPath', () => {
  const HERKUNFT = 'https://pokemarketintelligence.com';

  it('lässt einen echten eigenen Pfad durch', () => {
    expect(safeRedirectPath('/portfolio', HERKUNFT)).toBe('/portfolio');
    expect(safeRedirectPath('/karten/abc?x=1#y', HERKUNFT)).toBe('/karten/abc?x=1#y');
  });

  it.each([
    ['//boese.de', 'protokollrelativ'],
    ['/\\boese.de', 'Rückstrich zählt wie Schrägstrich'],
    ['/\t/boese.de', 'Tabulator wird vom Parser entfernt'],
    ['/\n//boese.de', 'Zeilenumbruch wird entfernt'],
    ['https://boese.de', 'absolute fremde Adresse'],
    ['http://boese.de', 'absolute fremde Adresse ohne TLS'],
    ['javascript:alert(1)', 'Skript-Schema'],
    ['\\\\boese.de', 'UNC-Schreibweise'],
    ['portfolio', 'kein absoluter Pfad'],
  ])('weist %s ab (%s)', (ziel) => {
    expect(safeRedirectPath(ziel, HERKUNFT)).toBe(DEFAULT_REDIRECT);
  });

  it('landet bei jedem abgewiesenen Ziel auf der eigenen Seite', () => {
    for (const ziel of ['//boese.de', '/\\boese.de', '/\t/boese.de', 'https://boese.de']) {
      const ergebnis = new URL(safeRedirectPath(ziel, HERKUNFT), HERKUNFT);
      expect(ergebnis.origin, ziel).toBe(HERKUNFT);
    }
  });

  it('verträgt fehlende und übergroße Eingaben', () => {
    expect(safeRedirectPath(null, HERKUNFT)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(undefined, HERKUNFT)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('/' + 'a'.repeat(600), HERKUNFT)).toBe(DEFAULT_REDIRECT);
  });

  it('wird in der Anmelde-Rückkehr auch benutzt', () => {
    const src = lies('src/app/auth/callback/route.ts');
    expect(src).toContain("from '@/lib/safe-redirect'");
    expect(src).toMatch(/safeRedirectPath\(.*url\.origin\)/);
  });
});

// ── Befund 7: offener Endpunkt ohne Begrenzung ─────────────────────────────

describe('createRateLimiter', () => {
  it('lässt bis zur Grenze durch und blockt danach', () => {
    const grenze = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(grenze('a', 0).allowed).toBe(true);
    expect(grenze('a', 10).allowed).toBe(true);
    expect(grenze('a', 20).allowed).toBe(true);
    expect(grenze('a', 30).allowed).toBe(false);
  });

  it('trennt die Zähler je Schlüssel', () => {
    const grenze = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(grenze('a', 0).allowed).toBe(true);
    expect(grenze('a', 1).allowed).toBe(false);
    expect(grenze('b', 1).allowed).toBe(true);
  });

  it('gibt nach Ablauf des Zeitfensters wieder frei', () => {
    const grenze = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(grenze('a', 0).allowed).toBe(true);
    expect(grenze('a', 999).allowed).toBe(false);
    expect(grenze('a', 1001).allowed).toBe(true);
  });

  it('nennt eine brauchbare Wartezeit', () => {
    const grenze = createRateLimiter({ limit: 1, windowMs: 60_000 });
    grenze('a', 0);
    const abgelehnt = grenze('a', 10_000);
    expect(abgelehnt.allowed).toBe(false);
    expect(abgelehnt.retryAfterSeconds).toBe(50);
  });

  it('gleitet — kein doppelter Durchlass an der Fenstergrenze', () => {
    const grenze = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(grenze('a', 900).allowed).toBe(true);
    expect(grenze('a', 950).allowed).toBe(true);
    // Bei einem festen Fenster wären hier wieder 2 frei.
    expect(grenze('a', 1010).allowed).toBe(false);
  });

  it('wächst nicht unbegrenzt', () => {
    const grenze = createRateLimiter({ limit: 1, windowMs: 10, maxKeys: 50 });
    for (let i = 0; i < 500; i++) grenze(`schluessel-${i}`, i);
    // Kein Absturz, und der letzte Schlüssel funktioniert weiterhin.
    expect(grenze('schluessel-neu', 1000).allowed).toBe(true);
  });
});

describe('clientIp', () => {
  it('nimmt den ersten Eintrag aus x-forwarded-for', () => {
    const r = new Request('https://x.de', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } });
    expect(clientIp(r)).toBe('1.2.3.4');
  });

  it('fällt auf x-real-ip zurück', () => {
    expect(clientIp(new Request('https://x.de', { headers: { 'x-real-ip': '9.9.9.9' } }))).toBe('9.9.9.9');
  });

  it('liefert einen Ersatzwert statt undefined', () => {
    expect(clientIp(new Request('https://x.de'))).toBe('unbekannt');
  });
});

describe('isValidEmail', () => {
  it.each(['a@b.de', 'vorname.nachname@sub.example.com', 'x+tag@mail.co.uk'])('nimmt %s an', (e) => {
    expect(isValidEmail(e)).toBe(true);
  });

  it.each([
    'keine-mail',
    '@b.de',
    'a@b',
    'a@@b.de',
    'a b@c.de',
    'a@b.de\nBcc: opfer@x.de',
    '',
    'a@.de',
  ])('weist %s ab', (e) => {
    expect(isValidEmail(e)).toBe(false);
  });

  it('weist Nicht-Zeichenketten ab', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail({ email: 'a@b.de' })).toBe(false);
  });

  it('weist übermäßig lange Adressen ab', () => {
    expect(isValidEmail('a'.repeat(250) + '@b.de')).toBe(false);
  });
});

describe('Newsletter-Endpunkt', () => {
  it('begrenzt die Zugriffe und prüft die Adresse', () => {
    const src = lies('src/app/api/newsletter/route.ts');
    expect(src, 'ohne Begrenzung ist der Endpunkt ein Versandwerkzeug').toContain('createRateLimiter');
    expect(src).toContain('isValidEmail');
    expect(src, 'abgewiesene Zugriffe brauchen 429').toContain('429');
  });
});

// ── Befund 3: fehlende Sicherheits-Kopfzeilen ──────────────────────────────

describe('Sicherheits-Kopfzeilen', () => {
  const config = lies('next.config.ts');

  it('liefert Kopfzeilen für jeden Pfad aus', () => {
    expect(config).toMatch(/async headers\(\)/);
    expect(config).toContain("source: '/:path*'");
  });

  it.each([
    ['Content-Security-Policy', 'Grundregeln für alle Quellen'],
    ['X-Frame-Options', 'Clickjacking auf /studio'],
    ['X-Content-Type-Options', 'MIME-Raten'],
    ['Referrer-Policy', 'Verweise nach außen'],
    ['Permissions-Policy', 'Kamera, Mikrofon, Standort'],
  ])('setzt %s (%s)', (kopfzeile) => {
    expect(config).toContain(kopfzeile);
  });

  it('verbietet das Einbetten in fremde Seiten', () => {
    expect(config).toContain("frame-ancestors 'none'");
    expect(config).toContain("value: 'DENY'");
  });

  it('erlaubt kein unsafe-eval', () => {
    // 'unsafe-inline' ist für Next.js unumgänglich, das Ausführen von
    // Zeichenketten als Code nicht. Geprüft wird die Richtlinie selbst, nicht
    // die Kommentare drumherum.
    const richtlinie = config.slice(config.indexOf('const CSP = ['), config.indexOf("].join('; ')"));
    expect(richtlinie).not.toContain('eval');
  });

  it('sperrt Objekte und fremde Basis-Adressen', () => {
    expect(config).toContain("object-src 'none'");
    expect(config).toContain("base-uri 'self'");
  });
});

// ── Befund 5: eingeschleuste FFmpeg-Optionen ───────────────────────────────

describe('Video-Verarbeitung', () => {
  const src = lies('src/app/api/video/process/route.ts');

  it('reicht keine ungeprüfte Zahl an FFmpeg weiter', () => {
    // Die Argumente werden als Zeichenketten zusammengebaut — nur eine
    // begrenzte Zahl kann dort keine zusätzliche Option einschleusen.
    expect(src).toContain('zahlImBereich');
    expect(src).toMatch(/const clipDuration = zahlImBereich\(/);
    expect(src).toMatch(/zahlImBereich\(body\.startTime/);
  });

  it('prüft den Speicherpfad', () => {
    expect(src).toContain('istGueltigerSpeicherpfad');
  });

  it('nennt die Modell-ID nicht mehr als nackten String', () => {
    expect(src).not.toMatch(/model:\s*'claude-/);
    expect(src).toContain('CAPTION_MODEL');
    expect(src).toContain('process.env.ANTHROPIC_CAPTION_MODEL');
  });

  it('erfasst auch diesen KI-Aufruf', () => {
    expect(src, 'sonst fehlt er in der Kostenübersicht').toContain('recordAiUsage');
  });
});

// ── Befund 6: Weiterleitungen im Bild-Proxy ────────────────────────────────

describe('Bild-Proxy', () => {
  const src = lies('src/app/api/img/route.ts');

  it('folgt Weiterleitungen nicht blind', () => {
    expect(src, "ohne redirect: 'manual' gilt die Erlaubnisliste nur für den ersten Sprung").toContain(
      "redirect: 'manual'",
    );
  });

  it('prüft jedes Weiterleitungsziel erneut', () => {
    expect(src).toMatch(/if \(!istErlaubt\(naechstes\)\) return null;/);
  });

  it('begrenzt die Anzahl der Sprünge', () => {
    expect(src).toContain('MAX_REDIRECTS');
  });

  it('bleibt bei https und der Erlaubnisliste', () => {
    expect(src).toContain("url.protocol === 'https:'");
    expect(src).toContain('ALLOWED_HOSTS.has(url.hostname)');
  });
});

// ── Befund 2: veraltete Abhängigkeit ───────────────────────────────────────

describe('Next.js-Version', () => {
  it('liegt nicht unter der Fassung mit den geschlossenen Meldungen', () => {
    const { dependencies } = JSON.parse(lies('package.json')) as { dependencies: Record<string, string> };
    const gefordert = dependencies.next.replace(/^[^0-9]*/, '');
    const [major, minor, patch] = gefordert.split('.').map(Number);
    const mindestens = [16, 2, 12];
    const wert = major * 1e6 + minor * 1e3 + patch;
    const min = mindestens[0] * 1e6 + mindestens[1] * 1e3 + mindestens[2];
    expect(
      wert,
      `next ${gefordert} liegt unter 16.2.12 — darin sind neun Meldungen geschlossen ` +
        '(u. a. SSRF in Server Actions und die Preisgabe interner Server-Function-Endpunkte).',
    ).toBeGreaterThanOrEqual(min);
  });
});

// ── Dauerhafte Grundregeln ─────────────────────────────────────────────────

describe('Grundregeln', () => {
  it('vergleicht Geheimnisse nirgends mit ===', () => {
    const treffer: string[] = [];
    for (const datei of globSync('src/**/*.ts', { cwd: WURZEL })) {
      for (const zeile of lies(datei).split('\n')) {
        if (/(token|secret|password|hash)\w*\s*===\s*\w*(token|secret|password|hash)/i.test(zeile)) {
          treffer.push(`${datei}: ${zeile.trim()}`);
        }
      }
    }
    expect(treffer, `Zeitangriff möglich — timingSafeEqual nutzen:\n${treffer.join('\n')}`).toEqual([]);
  });

  it('setzt das Sitzungs-Cookie mit allen Schutzflaggen', () => {
    const route = lies('src/app/api/studio-auth/route.ts');
    expect(route, 'sonst liest jedes Skript das Cookie aus').toContain('httpOnly: true');
    expect(route, 'schützt vor seitenübergreifenden Anfragen').toMatch(/sameSite:\s*'strict'/);
    expect(route, 'in Produktion nur über TLS').toMatch(/secure:/);
    // Der Vergleich selbst darf keine Rückschlüsse über die Laufzeit erlauben.
    expect(lies('src/lib/studio-auth.ts')).toContain('timingSafeEqual');
  });

  it('gibt in keiner API-Antwort interne Fehlertexte preis', () => {
    const treffer: string[] = [];
    for (const datei of globSync('src/app/api/**/route.ts', { cwd: WURZEL })) {
      const src = lies(datei);
      if (/NextResponse\.json\([^)]*String\(error\)/.test(src)) treffer.push(datei);
    }
    expect(treffer, `Interne Details in der Antwort:\n${treffer.join('\n')}`).toEqual([]);
  });

  it('legt keinen geheimen Wert in eine NEXT_PUBLIC-Variable', () => {
    const verdaechtig: string[] = [];
    for (const datei of globSync('src/**/*.{ts,tsx}', { cwd: WURZEL })) {
      for (const name of lies(datei).match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? []) {
        // Der anon-Key ist zum Veröffentlichen gedacht — geschützt wird über RLS.
        if (name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') continue;
        if (/(SECRET|SERVICE_ROLE|PASSWORD|PRIVATE|_TOKEN)$/.test(name)) verdaechtig.push(`${datei}: ${name}`);
      }
    }
    expect(
      verdaechtig,
      `NEXT_PUBLIC landet im Browser-Bündel — dort gehört kein Geheimnis hin:\n${verdaechtig.join('\n')}`,
    ).toEqual([]);
  });
});
