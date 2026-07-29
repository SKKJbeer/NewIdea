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
import type { PokemonCard } from '@/types';
import { displayPrice } from '@/lib/pokemon-api';
import { ensureFfmpeg } from '@/lib/ffmpeg-setup';
import { introFrame, cardFrame, outroFrame } from '@/lib/reel-frames';

ensureFfmpeg();

// Die Schriftart wird beim Bild-Rendern in reel-frames.tsx geladen —
// FFmpeg zeichnet keinen Text mehr.

const W = 1080;
const H = 1920;
const FPS = 30;
const SEG_SECONDS = 3.6;
const INTRO_SECONDS = 2.4;
const OUTRO_SECONDS = 3.0;

const BG = '#0a0a0f';
const SITE_LABEL = 'pokemarket-intelligence';

export interface ReelCard {
  name: string;
  price: number;
  trendPercent: number;
  imageUrl: string;
}

export function toReelCards(cards: PokemonCard[], max = 5): ReelCard[] {
  return cards
    .filter((c) => c.imageUrl && displayPrice(c) > 0)
    .slice(0, max)
    .map((c) => ({
      name: c.nameDe ?? c.name,
      price: displayPrice(c),
      trendPercent: c.trendPercent ?? 0,
      imageUrl: c.imageUrl,
    }));
}

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
async function frameToSegment(imgPath: string, seconds: number, outPath: string, zoom = false): Promise<void> {
  const frames = Math.round(seconds * FPS);
  const filters = zoom
    ? [
        `scale=${W * 2}:-1`,
        `zoompan=z='min(zoom+0.0008,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`,
      ]
    : [`scale=${W}:${H}`, `fps=${FPS}`];

  const cmd = ffmpeg()
    .input(imgPath)
    .inputOptions(['-loop 1'])
    .videoFilters(filters)
    .videoCodec('libx264')
    .outputOptions(['-t', String(seconds), '-crf 22', '-preset fast', '-pix_fmt yuv420p', '-an']);
  await run(cmd, outPath);
}

/**
 * Rendert das komplette Reel und liefert den MP4-Buffer.
 * Wirft bei Fehlern — der Aufrufer entscheidet über die Fehlerantwort.
 */
export async function renderMarketReel(cards: ReelCard[], title: string, dateLabel: string): Promise<Buffer> {
  if (cards.length === 0) throw new Error('Keine Karten mit Bild + Preis für das Reel');

  const uid = randomUUID();
  const tmp = (name: string) => join(tmpdir(), `reel-${uid}-${name}`);
  const cleanup: string[] = [];

  try {
    // 1. Kartenbilder laden (hires bevorzugt der Aufrufer via imageUrl)
    const segments: string[] = [];

    // Intro als fertiges Bild rendern, dann zum Segment machen
    const introImg = tmp('intro.png');
    await writeFile(introImg, await introFrame(title, dateLabel));
    cleanup.push(introImg);
    const introPath = tmp('intro.mp4');
    await frameToSegment(introImg, INTRO_SECONDS, introPath);
    cleanup.push(introPath);
    segments.push(introPath);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const res = await fetch(card.imageUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue; // Karte überspringen, Reel bleibt gültig
      // Kartenbild als Data-URI in den fertigen Rahmen einbetten
      const raw = Buffer.from(await res.arrayBuffer());
      const dataUri = `data:image/png;base64,${raw.toString('base64')}`;
      const framePath = tmp(`frame-${i}.png`);
      await writeFile(framePath, await cardFrame(card, i + 1, dataUri));
      cleanup.push(framePath);

      const segPath = tmp(`seg-${i}.mp4`);
      await frameToSegment(framePath, SEG_SECONDS, segPath, true);
      cleanup.push(segPath);
      segments.push(segPath);
    }

    if (segments.length < 2) throw new Error('Kein Kartenbild konnte geladen werden');

    const outroImg = tmp('outro.png');
    await writeFile(outroImg, await outroFrame());
    cleanup.push(outroImg);
    const outroPath = tmp('outro.mp4');
    await frameToSegment(outroImg, OUTRO_SECONDS, outroPath);
    cleanup.push(outroPath);
    segments.push(outroPath);

    // 2. Concat-Demuxer (verlustfrei, alle Segmente haben identische Parameter)
    const listPath = tmp('list.txt');
    await writeFile(listPath, segments.map((s) => `file '${s}'`).join('\n'));
    cleanup.push(listPath);

    const finalPath = tmp('final.mp4');
    cleanup.push(finalPath);
    await run(
      ffmpeg()
        .input(listPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy', '-movflags +faststart']),
      finalPath,
    );

    return await readFile(finalPath);
  } finally {
    await Promise.all(cleanup.map((f) => unlink(f).catch(() => {})));
  }
}

/** Caption mit UTM-Link — der Reichweiten-Rückkanal zur Website. */
export function buildReelCaption(cards: ReelCard[], siteUrl: string): string {
  const lines = cards
    .slice(0, 3)
    .map((c) => {
      const up = c.trendPercent >= 0;
      return `${c.name}: ${up ? '+' : ''}${c.trendPercent.toFixed(1).replace('.', ',')}%`;
    })
    .join('\n');

  const utmUrl = `${siteUrl}?utm_source=instagram&utm_medium=reel&utm_campaign=top-mover`;

  return `Top-Mover der Woche im Pokémon-Kartenmarkt 📈\n\n${lines}\n\nAlle Preise täglich aktuell — Link in der Bio\n${utmUrl}\n\n#Pokemon #PokemonTCG #PokemonKarten #Cardmarket #TCG #Sammelkarten #PokemonDeutschland #KartenPreise`;
}
