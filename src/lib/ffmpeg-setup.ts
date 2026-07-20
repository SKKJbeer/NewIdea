import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { existsSync, statSync, copyFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Konfiguriert den FFmpeg-Binary-Pfad robust für Vercels serverlose Umgebung.
//
// Problem: `ffmpeg-static` liefert eine Binary in node_modules, aber (a) Next.js
// packt sie nicht automatisch ins Function-Bundle (→ spawn ENOENT) und (b) selbst
// wenn sie da ist, kann das Ausführbar-Bit fehlen (→ EACCES).
//
// (a) lösen wir über outputFileTracingIncludes in next.config.ts (Binary wird
// mitgebündelt). (b) lösen wir hier: fehlt das +x-Bit auf dem (read-only)
// Bundle-Pfad, kopieren wir die Binary einmalig nach /tmp und machen sie dort
// ausführbar.
let configured = false;

export function ensureFfmpeg(): void {
  if (configured) return;
  configured = true;

  const original = ffmpegPath as string | null;
  if (!original) return; // nichts zu tun — fluent-ffmpeg versucht dann "ffmpeg" aus dem PATH

  let bin = original;
  try {
    if (existsSync(bin)) {
      const isExec = (statSync(bin).mode & 0o111) !== 0;
      if (!isExec) {
        const tmp = join(tmpdir(), 'ffmpeg-bin');
        if (!existsSync(tmp)) {
          copyFileSync(bin, tmp);
          chmodSync(tmp, 0o755);
        }
        bin = tmp;
      }
    }
  } catch {
    // Im Zweifel den Original-Pfad nehmen — besser als gar nichts.
    bin = original;
  }

  ffmpeg.setFfmpegPath(bin);
}
