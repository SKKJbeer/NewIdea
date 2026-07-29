import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'fs';
import { join } from 'path';

// Architektur-Regeln aus CLAUDE.md, repo-weit durchgesetzt.
//
// Diese Tests prüfen keine Funktion, sondern eine EIGENSCHAFT des Quelltexts.
// Jede Regel hier stammt aus einem echten Vorfall — sie verhindern nicht, dass
// jemand einen Fehler macht, sondern dass derselbe Fehler zum zweiten Mal
// unbemerkt live geht.

const SRC = process.cwd();

function sourceFiles(pattern = 'src/**/*.{ts,tsx}'): string[] {
  return globSync(pattern, { cwd: SRC }).filter((f) => !f.includes('__tests__'));
}

function read(file: string): string {
  return readFileSync(join(SRC, file), 'utf8');
}

/** Zeilen einer Datei, die auf ein Muster passen — mit Zeilennummer für die Fehlermeldung. */
function hits(file: string, pattern: RegExp): string[] {
  return read(file)
    .split('\n')
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => pattern.test(line))
    .map(({ line, n }) => `${file}:${n}  ${line.trim()}`);
}

describe('Der Test-Sucher findet überhaupt Dateien', () => {
  it('erfasst die Quelldateien des Projekts', () => {
    // Ohne diese Zusicherung würden alle folgenden Prüfungen stillschweigend
    // bestehen, sobald sich die Verzeichnisstruktur ändert.
    expect(sourceFiles().length).toBeGreaterThan(50);
  });
});

describe('Stolperstelle 26 — deutsche Zahlenformate', () => {
  // toFixed() gibt englisch aus: „235.71 €" statt „235,71 €". Erlaubt bleibt
  // es nur dort, wo ein Punkt technisch verlangt ist.
  // Ausnahmen werden NICHT hier gepflegt, sondern im Quelltext markiert:
  // eine Zeile `// toFixed erlaubt: <Grund>` direkt darüber oder daneben.
  // So steht die Begründung dort, wo sie beim Lesen gebraucht wird, und eine
  // neue Verwendung ohne Begründung fällt sofort auf.
  const MARKER = /toFixed erlaubt/;

  it('nutzt toFixed nur mit begründeter Ausnahme im Quelltext', () => {
    const verstoesse: string[] = [];
    for (const file of sourceFiles()) {
      if (file === 'src/lib/format.ts') continue; // die zentrale Umsetzung selbst
      const lines = read(file).split('\n');
      lines.forEach((line, i) => {
        if (!/\.toFixed\(/.test(line)) return;
        const umfeld = [lines[i - 2], lines[i - 1], line].filter(Boolean).join(' ');
        if (MARKER.test(umfeld)) return;
        verstoesse.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(
      verstoesse,
      'Sichtbare Zahlen müssen über src/lib/format.ts laufen. Ist die Stelle ' +
        'technisch (JSON-LD, Eingabefeld, SVG-Koordinate, FFmpeg-Filter), eine ' +
        `Zeile "// toFixed erlaubt: <Grund>" darüber setzen:\n${verstoesse.join('\n')}`,
    ).toEqual([]);
  });

  it('hält die Formatierung an einer Stelle', () => {
    // Die frühere Doppel-Implementierung in portfolio.ts war die Ursache
    // dafür, dass die korrekte Intl-Variante nur an einer Stelle wirkte.
    const portfolio = read('src/lib/portfolio.ts');
    expect(portfolio).toMatch(/from '\.\/format'/);
    expect(portfolio).not.toMatch(/new Intl\.NumberFormat/);
  });
});

describe('UI-Design-Regel — durchgehend dunkel', () => {
  it('verwendet keine hellen Tailwind-Flächen', () => {
    // Bloomberg/TradingView-Look, global bindend. Eine einzelne weiße Karte
    // fällt im dunklen Umfeld sofort auf.
    const verboten = /className=[^>]*\b(bg-white|bg-gray-(50|100|200)|text-gray-(400|500|900))\b/;
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/**/*.tsx')) {
      verstoesse.push(...hits(file, verboten));
    }
    expect(
      verstoesse,
      `Helle Tokens gefunden — Dark-Mode-Token aus CLAUDE.md verwenden:\n${verstoesse.join('\n')}`,
    ).toEqual([]);
  });

  it('nutzt für Trendfarben emerald/rose, nicht green/red', () => {
    const verboten = /\b(text|bg|border)-(green|red)-\d{3}\b/;
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/**/*.tsx')) {
      verstoesse.push(...hits(file, verboten));
    }
    expect(verstoesse, verstoesse.join('\n')).toEqual([]);
  });
});

describe('Sicherheitsregeln (Backend)', () => {
  it('vergleicht Secrets nirgends mit ===', () => {
    // Timing-Oracle. Der einzige zulässige Weg ist crypto.timingSafeEqual.
    const verboten = /(token|secret|password|session)\w*\s*===\s*(?!undefined|null|'')/i;
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/{lib,app}/**/*.ts')) {
      verstoesse.push(...hits(file, verboten));
    }
    expect(verstoesse, verstoesse.join('\n')).toEqual([]);
  });

  it('nutzt in studio-auth einen zeitkonstanten Vergleich', () => {
    const src = read('src/lib/studio-auth.ts');
    expect(src).toMatch(/timingSafeEqual/);
    // Fail-closed: Ohne Dev-Guard wäre ein fehlendes Passwort ein offenes Tor.
    expect(src).toMatch(/NODE_ENV/);
  });

  it('gibt keine internen Fehlerdetails an Clients zurück', () => {
    // String(error) in einer API-Antwort verrät Pfade, Keys und Architektur.
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/app/api/**/*.ts')) {
      verstoesse.push(...hits(file, /(NextResponse\.json|Response\.json)[^\n]*String\(\s*(err|error)/));
      verstoesse.push(...hits(file, /error:\s*(err|error)\.stack/));
    }
    expect(verstoesse, verstoesse.join('\n')).toEqual([]);
  });

  it('sichert die Auslöser für Inhalte hinter dem Studio-Zugang', () => {
    // Wer diese Endpunkte erreicht, kann KI-Aufrufe auslösen — das kostet Geld
    // und kann veröffentlichte Inhalte überschreiben.
    for (const route of [
      'src/app/api/market-report/generate/route.ts',
      'src/app/api/articles/generate/route.ts',
      'src/app/api/guides/generate/route.ts',
      'src/app/api/video/auto-reel/route.ts',
    ]) {
      expect(read(route), `${route} ohne Auth`).toMatch(/isStudioAuthed(FromRequest)?\(/);
    }
  });
});

describe('Stolperstelle 30 — FFmpeg zeichnet keinen Text', () => {
  it('verwendet nirgends den drawtext-Filter', () => {
    // Die mitgelieferte Binary enthält ihn NICHT (486 Filter, keiner davon).
    // Jeder Aufruf lässt das gesamte Rendering scheitern.
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/**/*.{ts,tsx}')) {
      verstoesse.push(...hits(file, /drawtext=/));
    }
    expect(verstoesse, verstoesse.join('\n')).toEqual([]);
  });

  it('verwendet lavfi nicht als Eingabeformat', () => {
    // fluent-ffmpeg prüft Eingabeformate gegen `ffmpeg -formats`; lavfi ist
    // ein Device und steht dort nicht — der Aufruf wird immer abgelehnt.
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/**/*.{ts,tsx}')) {
      verstoesse.push(...hits(file, /inputFormat\(['"]lavfi|['"]-f lavfi/));
    }
    expect(verstoesse, verstoesse.join('\n')).toEqual([]);
  });
});

describe('Stolperstellen 21/22 — keine stillen Fehler', () => {
  it('umgibt nirgends einen Aufruf mit einem leeren catch', () => {
    // Ein nacktes `catch {}` hat wochenlang verdeckt, dass jede Artikel-
    // Generierung an einem zu knappen Token-Limit scheiterte. Ein Fehler darf
    // verschluckt werden — seine Ursache nicht.
    // Wie bei toFixed: Ausnahmen werden im Quelltext begründet, nicht hier
    // gepflegt — `// catch erlaubt: <Grund>`.
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/{lib,app}/**/*.{ts,tsx}')) {
      const lines = read(file).split('\n');
      lines.forEach((line, i) => {
        const code = line.trim();
        // Kommentar- und Doku-Zeilen sind kein Code.
        if (code.startsWith('//') || code.startsWith('*')) return;
        if (!/catch\s*\{\s*\}/.test(line)) return;
        const umfeld = [lines[i - 2], lines[i - 1], line].filter(Boolean).join(' ');
        if (/catch erlaubt/.test(umfeld)) return;
        verstoesse.push(`${file}:${i + 1}  ${code}`);
      });
    }
    expect(
      verstoesse,
      'Leeres catch — Ursache gehört ins Log. Ist das Schlucken beabsichtigt, ' +
        `eine Zeile "// catch erlaubt: <Grund>" darüber setzen:\n${verstoesse.join('\n')}`,
    ).toEqual([]);
  });

  it('bemisst jedes Token-Limit für Langtext großzügig', () => {
    // Stolperstelle 22: 2048 reichten für einen Artikel nicht, die Antwort
    // brach mitten im JSON ab. Kurze Ausgaben (Social-Captions) dürfen klein
    // bleiben — alles darüber gehört auf 16.000.
    const zuKnapp: string[] = [];
    for (const file of ['src/lib/ai-generator.ts', 'src/lib/article-generator.ts', 'src/lib/guide-generator.ts']) {
      for (const treffer of hits(file, /max_tokens:\s*\d+/)) {
        const wert = Number(treffer.match(/max_tokens:\s*(\d+)/)![1]);
        if (wert < 16000 && wert > 1024) zuKnapp.push(`${treffer} (${wert})`);
      }
    }
    expect(zuKnapp, `Zu knappe Token-Limits:\n${zuKnapp.join('\n')}`).toEqual([]);
  });

  it('prüft bei jedem KI-Aufruf, ob die Antwort abgeschnitten wurde', () => {
    // Ohne diese Prüfung tarnt sich ein erreichtes Token-Limit als Formatfehler.
    for (const file of ['src/lib/ai-generator.ts', 'src/lib/article-generator.ts', 'src/lib/guide-generator.ts']) {
      expect(read(file), `${file}: stop_reason wird nicht ausgewertet`).toMatch(/stop_reason/);
    }
  });

  it('meldet Speicherfehler mit Ursache statt nur mit false', () => {
    // `return false` verschluckt die Diagnose — genau daran ist die
    // Guide-Pipeline über einen Monat lautlos gescheitert.
    for (const file of ['src/lib/guide-storage.ts', 'src/lib/market-report-storage.ts']) {
      expect(read(file), `${file} sollte { ok, error } zurückgeben`).toMatch(/ok:\s*(false|true)/);
    }
  });
});

describe('Externe Aufrufe haben ein Zeitlimit', () => {
  it('begrenzt jeden fetch zu einer fremden Adresse', () => {
    // Ohne Zeitlimit hängt die Funktion bis zum Vercel-Hardlimit.
    //
    // Die Prüfung erfasst bewusst AUCH `fetch(url, …)` mit einer Variablen:
    // Die erste Fassung suchte nur nach `fetch('https://…')` und übersah
    // deshalb beide Cardmarket-Aufrufe, die ihre URL vorher zusammenbauen.
    // Ausgenommen sind nur eigene Endpunkte (`fetch('/api/…')`).
    const verstoesse: string[] = [];
    for (const file of sourceFiles('src/{lib,app}/**/*.{ts,tsx}')) {
      const lines = read(file).split('\n');
      lines.forEach((line, i) => {
        const m = line.match(/\bfetch\(\s*(.)/);
        if (!m) return;
        // Eigene Route (relativer Pfad) — läuft im Browser gegen die eigene Domain.
        if (/\bfetch\(\s*[`'"]\//.test(line)) return;
        const umfeld = lines.slice(i, i + 10).join(' ');
        if (/AbortSignal\.timeout|signal:|withTimeout|Promise\.race/.test(umfeld)) return;
        verstoesse.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(verstoesse, `fetch ohne Zeitlimit:\n${verstoesse.join('\n')}`).toEqual([]);
  });
});

describe('Veröffentlichungsplan ist nur an einer Stelle definiert', () => {
  it('definiert PUBLISH_DAYS ausschließlich in publish-days.ts', () => {
    const definitionen = sourceFiles('src/**/*.ts').filter((f) =>
      /export const PUBLISH_DAYS\s*=/.test(read(f)),
    );
    expect(definitionen).toEqual(['src/lib/publish-days.ts']);
  });

  it('veröffentlicht sonntags und donnerstags', () => {
    expect(read('src/lib/publish-days.ts')).toMatch(/new Set\(\[0,\s*4\]\)/);
  });
});
