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
/**
 * Langsames Heranfahren mit leichtem Versatz — gibt einem Standbild Leben.
 * Der Versatz wechselt je Segment die Richtung, damit es nicht monoton wirkt.
 */
function motionFilters(frames: number, drift: number): string[] {
  const dx = drift === 0 ? 'iw/2-(iw/zoom/2)' : `iw/2-(iw/zoom/2)+${drift}*on/${frames}`;
  return [
    `scale=${W * 2}:-1`,
    `zoompan=z='min(zoom+0.0009,1.12)':x='${dx}':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`,
  ];
}

/**
 * Unscharfe, bewegte Hintergrundebene aus dem Kartenbild.
 *
 * Die Unschärfe wird BEWUSST auf einem stark verkleinerten Bild gerechnet und
 * danach wieder hochskaliert. Unschärfe ist reine Tieffrequenz — das Ergebnis
 * ist praktisch identisch, kostet aber einen Bruchteil: `gblur` mit großem
 * Sigma auf 1080x1920 dominierte sonst die gesamte Renderzeit.
 */
function backdropFilters(frames: number, drift: number, { soft = false } = {}): string[] {
  // `soft` liegt unter Textbildern: Dort steht Schrift über der GANZEN Fläche,
  // deshalb muss der Hintergrund zu abstrakten Farbfeldern zerfließen. Bei
  // schwächerer Unschärfe erkennt man Kartenkonturen — das wirkt wie ein
  // Schmierfleck, nicht wie Gestaltung.
  const small = soft ? 360 : 540;
  const outW = small / 2;
  const outH = Math.round(outW * (H / W));
  const factor = small / (W * 2); // Versatz in die kleinere Auflösung umrechnen
  const dx =
    drift === 0
      ? 'iw/2-(iw/zoom/2)'
      : `iw/2-(iw/zoom/2)+${(drift * factor).toFixed(2)}*on/${frames}`;
  return [
    `scale=${small}:-1`,
    `zoompan=z='min(zoom+0.0009,1.12)':x='${dx}':y='ih/2-(ih/zoom/2)':d=${frames}:s=${outW}x${outH}:fps=${FPS}`,
    `gblur=sigma=${soft ? 14 : 10}`,
    // Nur leicht abdunkeln und Farbe anheben: Der Hintergrund soll die
    // Farbstimmung DIESER Karte tragen, ohne die Schrift darüber zu stören.
    `eq=brightness=${soft ? '-0.16' : '-0.08'}:saturation=${soft ? '1.4' : '1.7'}:contrast=1.06`,
    `scale=${W}:${H}`,
  ];
}

/** Abschluss jedes Segments: Randabdunklung und weiche Blenden. */
function finishFilters(seconds: number): string[] {
  const fadeOutStart = Math.max(0, seconds - FADE_SECONDS).toFixed(2);
  return [
    // Dezente Randabdunklung — lenkt den Blick zur Mitte (Terminal-Anmutung).
    'vignette=PI/5',
    `fade=t=in:st=0:d=${FADE_SECONDS}`,
    `fade=t=out:st=${fadeOutStart}:d=${FADE_SECONDS}`,
  ];
}

async function frameToSegment(
  imgPath: string,
  seconds: number,
  outPath: string,
  {
    zoom = false,
    drift = 0,
    backdrop,
    softBackdrop = false,
  }: { zoom?: boolean; drift?: number; backdrop?: string; softBackdrop?: boolean } = {},
): Promise<void> {
  const frames = Math.round(seconds * FPS);

  const cmd = ffmpeg().input(imgPath).inputOptions(['-loop 1']);

  if (backdrop) {
    // Zweilagiger Aufbau: Das Kartenbild läuft als unscharfe, abgedunkelte
    // Fläche im Hintergrund und bewegt sich; darüber liegt das fertig
    // gerenderte Textbild pixelscharf. So bekommt jedes Segment die
    // Farbstimmung SEINER Karte, ohne dass die Schrift weich wird.
    //
    // Der Weg über Unschärfe im Video ist nötig, weil Satori kein `blur()`
    // kennt (siehe reel-frames.tsx).
    cmd.input(backdrop).inputOptions(['-loop 1']);

    cmd.complexFilter(
      [
        `[1:v]${backdropFilters(frames, -drift, { soft: softBackdrop }).join(',')}[bg]`,
        `[0:v]scale=${W}:${H},format=rgba[fg]`,
        `[bg][fg]overlay=0:0:format=auto,${finishFilters(seconds).join(',')}[v]`,
      ],
      'v',
    );
  } else {
    const filters = zoom ? motionFilters(frames, drift) : [`scale=${W}:${H}`, `fps=${FPS}`];
    cmd.videoFilters([...filters, ...finishFilters(seconds)]);
  }

  cmd
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
  // Das Bild wird zweimal gebraucht: als Data-URI im gerenderten Standbild und
  // als Datei für die unscharfe Hintergrundebene in FFmpeg.
  const imageCache = new Map<string, { uri: string; file: string }>();
  async function cardImage(url: string): Promise<{ uri: string; file: string } | null> {
    const cached = imageCache.get(url);
    if (cached) return cached;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const bytes = Buffer.from(await res.arrayBuffer());
      const file = tmp(`card-${imageCache.size}.png`);
      await writeFile(file, bytes);
      cleanup.push(file);
      const entry = { uri: `data:image/png;base64,${bytes.toString('base64')}`, file };
      imageCache.set(url, entry);
      return entry;
    } catch {
      return null;
    }
  }

  try {
    // Die erste Karte der Geschichte liefert die Farbstimmung für Haken,
    // Einordnung und Abspann. Ohne sie wären das drei fast schwarze Bilder
    // zwischen bunten Kartenbildern — mit ihr hat das Reel von der ersten
    // Sekunde an Farbe. Schlägt der Abruf fehl, bleibt der schlichte Grund.
    const firstCard = story.scenes.find((s) => s.kind === 'card' || s.kind === 'quiz' || s.kind === 'reveal');
    const hero = firstCard && 'card' in firstCard ? await cardImage(firstCard.card.imageUrl) : null;

    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      const imgPath = tmp(`scene-${i}.png`);
      // Textbilder fahren selbst sanft heran (mittig, ohne Versatz — sonst
      // liefe Schrift aus dem Bild). Kartenbilder bleiben scharf stehen,
      // dort bewegt sich stattdessen die unscharfe Hintergrundebene.
      let zoom = true;
      let drift = 0;
      let backdrop: string | undefined;
      let softBackdrop = false;

      if (scene.kind === 'hook' || scene.kind === 'insight' || scene.kind === 'outro') {
        const tinted = Boolean(hero);
        if (scene.kind === 'hook') {
          await writeFile(imgPath, await hookFrame(scene.headline, scene.sub, scene.accent, tinted));
        } else if (scene.kind === 'insight') {
          await writeFile(imgPath, await insightFrame(scene.headline, scene.body, tinted));
        } else {
          await writeFile(imgPath, await outroFrame(scene.line, tinted));
        }
        if (hero) {
          backdrop = hero.file;
          softBackdrop = true;
          zoom = false;
          drift = i % 2 === 0 ? 40 : -40;
        }
      } else {
        const image = await cardImage(scene.card.imageUrl);
        if (!image) continue; // Karte überspringen, Reel bleibt gültig
        const quiz = scene.kind === 'quiz';
        await writeFile(
          imgPath,
          await cardFrame(scene.card, scene.rank, scene.total, image.uri, {
            label: scene.kind === 'card' ? scene.label : 'PREIS-CHECK',
            metric: scene.kind === 'card' ? scene.metric : 'price',
            hideValue: quiz,
            translucent: true,
          }),
        );
        // Die Bewegung übernimmt der Hintergrund — der Text bleibt scharf.
        backdrop = image.file;
        zoom = false;
        drift = i % 2 === 0 ? 60 : -60;
      }

      cleanup.push(imgPath);
      const segPath = tmp(`seg-${i}.mp4`);
      await frameToSegment(imgPath, scene.seconds, segPath, { zoom, backdrop, drift, softBackdrop });
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
