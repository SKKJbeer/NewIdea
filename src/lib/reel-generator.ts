// Auto-Reel-Generator: Rendert ein fertiges 1080x1920-Reel (Instagram/TikTok/
// Shorts) DIREKT aus Live-Marktdaten — ohne manuelles Videomaterial.
//
// Aufbau: Intro (Brand + Titel) → 1 Segment pro Karte (Kartenbild mit sanftem
// Zoom, Name, Preis, Trend) → Outro (CTA zur Website). Segmente werden einzeln
// gerendert und per concat-Demuxer verlustfrei zusammengefügt.
//
// Reichweiten-Prinzip: Jede Caption endet mit dem Site-Link inkl. UTM-Parametern
// — Vercel Analytics weist die Besucher damit dem Kanal zu.

import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ensureFfmpeg } from '@/lib/ffmpeg-setup';
import { hookFrame, cardFrame, insightFrame, outroFrame } from '@/lib/reel-frames';
import type { ReelStory } from '@/lib/reel-concepts';

ensureFfmpeg();

// Die Schriftart wird beim Bild-Rendern in reel-frames.tsx geladen —
// FFmpeg zeichnet keinen Text mehr.

const W = 1080;
const H = 1920;
const FPS = 30;
const SEG_SECONDS = 3.6;
const INTRO_SECONDS = 2.4;
const OUTRO_SECONDS = 3.0;
// Weiche Blende zwischen den Abschnitten — professionelles Tempo statt Hartschnitt.
const FADE_SECONDS = 0.28;

const BG = '#0a0a0f';
const SITE_LABEL = 'pokemarket-intelligence';

function run(cmd: ffmpeg.FfmpegCommand, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd
      .on('end', () => resolve())
      // WICHTIG: Die echte FFmpeg-Ursache steht im stderr, nicht in err.message.
      // Ohne stderr bekommt man nur „ffmpeg exited with code 1" ohne den Grund.
      .on('error', (err: Error, _stdout: string | null, stderr: string | null) => {
        const tail = stderr ? String(stderr).trim().split('\n').slice(-3).join(' | ') : '';
        reject(new Error(`ffmpeg: ${err?.message || 'error'}${tail ? ' :: ' + tail : ''}`));
      })
      .save(outputPath);
  });
}

/**
 * Ein fertiges Standbild wird zum Videosegment.
 *
 * FFmpeg zeichnet hier KEINEN Text mehr — die Bilder kommen fertig aus
 * reel-frames.tsx. Grund: Die mitgelieferte FFmpeg-Binary enthält den
 * `drawtext`-Filter nicht (486 Filter, keiner davon drawtext), weshalb der
 * frühere Aufbau nie ein Reel erzeugen konnte.
 */
async function frameToSegment(
  imgPath: string,
  seconds: number,
  outPath: string,
  { zoom = false, drift = 0 }: { zoom?: boolean; drift?: number } = {},
): Promise<void> {
  const frames = Math.round(seconds * FPS);
  const filters: string[] = [];

  if (zoom) {
    // Langsames Heranfahren mit leichtem Versatz — gibt dem Standbild Leben.
    // Der Versatz wechselt je Segment die Richtung, damit es nicht monoton wirkt.
    const dx = drift === 0 ? "iw/2-(iw/zoom/2)" : `iw/2-(iw/zoom/2)+${drift}*on/${frames}`;
    filters.push(
      `scale=${W * 2}:-1`,
      `zoompan=z='min(zoom+0.0009,1.12)':x='${dx}':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`,
    );
  } else {
    filters.push(`scale=${W}:${H}`, `fps=${FPS}`);
  }

  // Dezente Randabdunklung — lenkt den Blick zur Mitte (Terminal-Anmutung).
  filters.push('vignette=PI/5');

  // Weiches Ein- und Ausblenden statt harter Schnitte.
  const fadeOutStart = Math.max(0, seconds - FADE_SECONDS).toFixed(2);
  filters.push(
    `fade=t=in:st=0:d=${FADE_SECONDS}`,
    `fade=t=out:st=${fadeOutStart}:d=${FADE_SECONDS}`,
  );

  const cmd = ffmpeg()
    .input(imgPath)
    .inputOptions(['-loop 1'])
    .videoFilters(filters)
    .videoCodec('libx264')
    .outputOptions(['-t', String(seconds), '-crf 21', '-preset fast', '-pix_fmt yuv420p', '-an']);
  await run(cmd, outPath);
}

/**
 * Rendert eine Geschichte (siehe reel-concepts.ts) zum fertigen MP4.
 *
 * Der Generator kennt keine Formate — er setzt nur Szenen um. Neue Formate
 * entstehen deshalb in reel-concepts.ts, ohne dass hier etwas angefasst wird.
 */
export async function renderStory(story: ReelStory): Promise<Buffer> {
  if (story.scenes.length === 0) throw new Error('Geschichte ohne Szenen');

  const uid = randomUUID();
  const tmp = (name: string) => join(tmpdir(), `reel-${uid}-${name}`);
  const cleanup: string[] = [];
  const segments: string[] = [];

  // Kartenbilder einmal laden und wiederverwenden (Quiz zeigt dieselbe Karte zweimal).
  const imageCache = new Map<string, string>();
  async function dataUri(url: string): Promise<string | null> {
    const cached = imageCache.get(url);
    if (cached) return cached;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const uri = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
      imageCache.set(url, uri);
      return uri;
    } catch {
      return null;
    }
  }

  try {
    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      const imgPath = tmp(`scene-${i}.png`);
      let zoom = false;

      if (scene.kind === 'hook') {
        await writeFile(imgPath, await hookFrame(scene.headline, scene.sub, scene.accent));
      } else if (scene.kind === 'insight') {
        await writeFile(imgPath, await insightFrame(scene.headline, scene.body));
      } else if (scene.kind === 'outro') {
        await writeFile(imgPath, await outroFrame(scene.line));
      } else {
        const uri = await dataUri(scene.card.imageUrl);
        if (!uri) continue; // Karte überspringen, Reel bleibt gültig
        const quiz = scene.kind === 'quiz';
        await writeFile(
          imgPath,
          await cardFrame(scene.card, scene.rank, scene.total, uri, {
            label: scene.kind === 'card' ? scene.label : 'PREIS-CHECK',
            metric: scene.kind === 'card' ? scene.metric : 'price',
            hideValue: quiz,
          }),
        );
        zoom = true;
      }

      cleanup.push(imgPath);
      const segPath = tmp(`seg-${i}.mp4`);
      await frameToSegment(imgPath, scene.seconds, segPath, {
        zoom,
        drift: i % 2 === 0 ? 60 : -60,
      });
      cleanup.push(segPath);
      segments.push(segPath);
    }

    if (segments.length < 2) throw new Error('Zu wenige verwertbare Szenen für ein Reel');

    const listPath = tmp('list.txt');
    await writeFile(listPath, segments.map((s) => `file '${s}'`).join('\n'));
    cleanup.push(listPath);

    const finalPath = tmp('final.mp4');
    cleanup.push(finalPath);
    await run(
      ffmpeg().input(listPath).inputOptions(['-f concat', '-safe 0']).outputOptions(['-c copy', '-movflags +faststart']),
      finalPath,
    );
    return await readFile(finalPath);
  } finally {
    await Promise.all(cleanup.map((f) => unlink(f).catch(() => {})));
  }
}
