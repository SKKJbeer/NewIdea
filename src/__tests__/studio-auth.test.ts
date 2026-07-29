import { describe, it, expect, afterEach } from 'vitest';
import { makeToken, isStudioAuthedFromRequest, COOKIE_NAME } from '@/lib/studio-auth';

// Der Studio-Zugang schützt /studio, /monitoring und die Auslöser für
// Marktbericht, Artikel und Guides. Eine Regression hier öffnet die
// Inhaltserzeugung für jeden — deshalb die härtesten Tests des Projekts.
//
// Zwei Regeln aus den Code-Qualitäts-Regeln (CLAUDE.md) werden hier
// festgenagelt:
//   1. Auth-Vergleiche timing-safe (nie ===)
//   2. Fail-closed in Production, wenn das Passwort fehlt

const ORIGINAL_PASSWORD = process.env.STUDIO_PASSWORD;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

function setEnv(key: 'STUDIO_PASSWORD' | 'NODE_ENV', value: string | undefined) {
  // NODE_ENV ist in den Typen readonly, zur Laufzeit aber ein normales Feld.
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

function requestWithCookie(cookie: string | null): Request {
  return new Request('https://example.test/api/monitoring', {
    headers: cookie === null ? {} : { cookie },
  });
}

afterEach(() => {
  setEnv('STUDIO_PASSWORD', ORIGINAL_PASSWORD);
  setEnv('NODE_ENV', ORIGINAL_NODE_ENV);
});

describe('makeToken', () => {
  it('erzeugt einen stabilen SHA-256-Hex-Wert', () => {
    const a = makeToken('geheim');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(makeToken('geheim')).toBe(a);
  });

  it('erzeugt für unterschiedliche Passwörter unterschiedliche Token', () => {
    expect(makeToken('geheim')).not.toBe(makeToken('geheim2'));
    // Kein Präfix-Zusammenhang: ein längeres Passwort darf den kurzen Token
    // nicht enthalten (sonst wäre ein Präfix-Angriff denkbar).
    expect(makeToken('geheim2')).not.toContain(makeToken('geheim').slice(0, 32));
  });

  it('gibt das Passwort nicht im Klartext preis', () => {
    expect(makeToken('supersecret')).not.toContain('supersecret');
  });

  it('bindet den Token an dieses Projekt (fester Präfix)', () => {
    // Ein blanker SHA-256 des Passworts darf NICHT gültig sein — sonst würde
    // ein anderswo geleakter Hash desselben Passworts hier funktionieren.
    const plainSha = '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'; // sha256("foo")
    expect(makeToken('foo')).not.toBe(plainSha);
  });
});

describe('isStudioAuthedFromRequest — mit gesetztem Passwort', () => {
  const PASSWORD = 'test-passwort';
  const TOKEN = makeToken(PASSWORD);

  function authed(cookie: string | null): boolean {
    setEnv('STUDIO_PASSWORD', PASSWORD);
    setEnv('NODE_ENV', 'production');
    return isStudioAuthedFromRequest(requestWithCookie(cookie));
  }

  it('lässt den korrekten Token durch', () => {
    expect(authed(`${COOKIE_NAME}=${TOKEN}`)).toBe(true);
  });

  it('weist einen falschen Token ab', () => {
    expect(authed(`${COOKIE_NAME}=${makeToken('falsch')}`)).toBe(false);
  });

  it('weist einen fehlenden Cookie-Header ab', () => {
    expect(authed(null)).toBe(false);
  });

  it('weist einen leeren Token ab', () => {
    expect(authed(`${COOKIE_NAME}=`)).toBe(false);
  });

  it('weist Token abweichender Länge ab, ohne zu werfen', () => {
    // timingSafeEqual wirft bei ungleicher Länge — der try/catch in safeEqual
    // muss das auffangen, sonst wird aus einem Angriffsversuch ein 500er.
    expect(authed(`${COOKIE_NAME}=zukurz`)).toBe(false);
    expect(authed(`${COOKIE_NAME}=${TOKEN}${TOKEN}`)).toBe(false);
  });

  it('findet den Token zwischen anderen Cookies', () => {
    expect(authed(`lang=de; ${COOKIE_NAME}=${TOKEN}; theme=dark`)).toBe(true);
    expect(authed(`${COOKIE_NAME}=${TOKEN}; lang=de`)).toBe(true);
  });

  it('verwechselt keinen ähnlich benannten Cookie', () => {
    // Namen, die den echten enthalten oder erweitern, dürfen nicht greifen.
    expect(authed(`x${COOKIE_NAME}=${TOKEN}`)).toBe(false);
    expect(authed(`${COOKIE_NAME}_alt=${TOKEN}`)).toBe(false);
  });

  it('akzeptiert keinen Token, der nur ein Präfix des richtigen ist', () => {
    expect(authed(`${COOKIE_NAME}=${TOKEN.slice(0, 63)}`)).toBe(false);
  });

  it('unterscheidet Groß- und Kleinschreibung im Token', () => {
    expect(authed(`${COOKIE_NAME}=${TOKEN.toUpperCase()}`)).toBe(false);
  });
});

describe('isStudioAuthedFromRequest — ohne gesetztes Passwort', () => {
  it('SPERRT in Production (fail-closed)', () => {
    // Die wichtigste Zusicherung der ganzen Datei: Fehlt in Production das
    // Passwort, darf NICHT geöffnet werden. Ein `if (!secret) return true`
    // ohne Dev-Guard würde Studio und Monitoring öffentlich machen.
    setEnv('STUDIO_PASSWORD', undefined);
    setEnv('NODE_ENV', 'production');
    expect(isStudioAuthedFromRequest(requestWithCookie(null))).toBe(false);
    expect(isStudioAuthedFromRequest(requestWithCookie(`${COOKIE_NAME}=irgendwas`))).toBe(false);
  });

  it('öffnet in der Entwicklung', () => {
    setEnv('STUDIO_PASSWORD', undefined);
    setEnv('NODE_ENV', 'development');
    expect(isStudioAuthedFromRequest(requestWithCookie(null))).toBe(true);
  });

  it('behandelt ein leeres Passwort wie ein fehlendes', () => {
    // '' ist falsy — ohne den Production-Guard wäre das ein offenes Tor.
    setEnv('STUDIO_PASSWORD', '');
    setEnv('NODE_ENV', 'production');
    expect(isStudioAuthedFromRequest(requestWithCookie(null))).toBe(false);
  });
});
