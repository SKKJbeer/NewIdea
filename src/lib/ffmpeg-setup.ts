import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { existsSync, statSync, copyFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// FFMPEG AUF VERCEL — wo die Binary wirklich liegt.
//
// BEFUND (27.09.2026, erster echter Lauf auf Produktion):
//   `spawn /ROOT/node_modules/ffmpeg-static/ffmpeg ENOENT`
// Die Binary WAR im Bundle (`outputFileTracingIncludes` in next.config.ts). Nur
// der Pfad stimmte nicht: `ffmpeg-static` berechnet ihn ueber `__dirname`, und
// Turbopack ersetzt `__dirname` in gebuendelten Modulen durch den Platzhalter
// `/ROOT`. Auf Vercel liegt die Datei aber unter `/var/task/node_modules/…`.
// Kein einziges Reel ist dadurch je auf Produktion entstanden — alle frueheren
// Korrekturen (Schriftart, Buendeln, Ausfuehrbar-Bit) waren echt, kamen aber
// nie zum Zug, weil der Aufruf schon am Pfad scheiterte.
//
// REGEL: Der Pfad wird aus dem Arbeitsverzeichnis abgeleitet, das auf Vercel
// das Funktionsverzeichnis ist und in dem die mitgebuendelten Dateien ihre
// relative Lage behalten. Der vom Paket gemeldete Pfad ist nur noch Rueckfall,
// und auch das nur, wenn er nicht mit dem Platzhalter beginnt.
//
// `turbopackIgnore` an jedem Dateizugriff: Mit variablem Pfad nimmt Turbopack
// sonst das GANZE Projekt in die Funktion auf („Dynamic filesystem access
// causes tracing of the whole project"). Bei einer Funktion, die bereits die
// ~75 MB grosse Binary traegt, gefaehrdet das Vercels Groessengrenze. Die
// Binary selbst kommt ausdruecklich ueber `outputFileTracingIncludes` mit.

let configured = false;

/** Kandidaten in Vorrangfolge — exportiert, damit ein Test die Reihenfolge festhalten kann. */
export function ffmpegKandidaten(): string[] {
  const kandidaten = [join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg')];
  const vomPaket = ffmpegPath as string | null;
  if (vomPaket && !vomPaket.startsWith('/ROOT/')) kandidaten.push(vomPaket);
  return kandidaten;
}

export function ensureFfmpeg(): void {
  if (configured) return;
  configured = true;

  const gefunden = ffmpegKandidaten().find((p) => {
    try {
      return existsSync(/*turbopackIgnore: true*/ p);
    } catch {
      // catch erlaubt: ein nicht pruefbarer Pfad ist schlicht kein Kandidat
      return false;
    }
  });

  if (!gefunden) {
    // Laut, nicht still: Ohne Binary scheitert jedes Rendering, und die
    // Ursache soll im Log stehen statt als ENOENT drei Aufrufe spaeter.
    console.error('[ffmpeg] Keine Binary gefunden. Geprueft:', ffmpegKandidaten().join(', '));
    return;
  }

  let bin = gefunden;
  try {
    const ausfuehrbar = (statSync(/*turbopackIgnore: true*/ bin).mode & 0o111) !== 0;
    if (!ausfuehrbar) {
      // Das Bundle ist schreibgeschuetzt; ohne +x-Bit einmalig nach /tmp kopieren.
      const tmp = join(tmpdir(), 'ffmpeg-bin');
      if (!existsSync(/*turbopackIgnore: true*/ tmp)) {
        copyFileSync(/*turbopackIgnore: true*/ bin, tmp);
        chmodSync(tmp, 0o755);
      }
      bin = tmp;
    }
  } catch (err) {
    console.warn('[ffmpeg] Ausfuehrbar-Pruefung fehlgeschlagen, nehme Fundstelle direkt:', err);
  }

  ffmpeg.setFfmpegPath(bin);
}
