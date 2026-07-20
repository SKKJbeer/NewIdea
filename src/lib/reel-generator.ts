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
import ffmpegPath from 'ffmpeg-static';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { PokemonCard } from '@/types';
import { displayPrice } from '@/lib/pokemon-api';

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

// Mitgelieferte Schriftart — Vercels serverlose Umgebung hat KEINE System-Fonts,
// deshalb scheitert drawtext sonst ("Cannot find a valid font"). Wird via
// outputFileTracingIncludes (next.config.ts) mit ins Function-Bundle gepackt.
const FONT = join(process.cwd(), 'src/assets/fonts/reel-font.ttf');
// Baut einen drawtext-Filter mit fest gesetzter fontfile.
const dt = (opts: string) => `drawtext=fontfile=${FONT}:${opts}`;

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

// drawtext-Sonderzeichen escapen (':' und "'" brechen sonst den Filtergraph)
function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "’").replace(/:/g, '\\:').replace(/%/g, '\\%');
}

function formatEurText(v: number): string {
  return `${v.toFixed(2).replace('.', ',')} EUR`;
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

/** Intro: dunkler Brand-Screen mit Titel + Datum. */
async function renderIntro(title: string, dateLabel: string, outPath: string): Promise<void> {
  const cmd = ffmpeg()
    .input(`color=c=${BG}:s=${W}x${H}:d=${INTRO_SECONDS}:r=${FPS}`)
    .inputFormat('lavfi')
    .videoFilters([
      dt(`text='${esc('POKÉMARKET')}':fontsize=88:fontcolor=white:x=(w-text_w)/2:y=700`),
      dt(`text='${esc('INTELLIGENCE')}':fontsize=88:fontcolor=#a78bfa:x=(w-text_w)/2:y=810`),
      dt(`text='${esc(title)}':fontsize=54:fontcolor=#e2e8f0:x=(w-text_w)/2:y=1010`),
      dt(`text='${esc(dateLabel)}':fontsize=38:fontcolor=#64748b:x=(w-text_w)/2:y=1100`),
    ])
    .videoCodec('libx264')
    .outputOptions(['-t', String(INTRO_SECONDS), '-crf 22', '-preset fast', '-pix_fmt yuv420p', '-an']);
  await run(cmd, outPath);
}

/** Karten-Segment: Kartenbild mit sanftem Zoom + Name/Preis/Trend-Overlays. */
async function renderCardSegment(card: ReelCard, rank: number, imgPath: string, outPath: string): Promise<void> {
  const frames = Math.round(SEG_SECONDS * FPS);
  const up = card.trendPercent >= 0;
  const trendColor = up ? '#34d399' : '#fb7185';
  const trendText = `${up ? '+' : ''}${card.trendPercent.toFixed(1).replace('.', ',')}\\%`;

  const cmd = ffmpeg()
    .input(imgPath)
    .inputOptions(['-loop 1'])
    .videoFilters([
      // Karte auf Reel-Format skalieren (Rand für Overlays lassen), dann Zoom
      `scale=${W * 2}:-1`,
      `zoompan=z='min(zoom+0.0009,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${Math.round(W * 1.396)}:fps=${FPS}`,
      `pad=${W}:${H}:0:(oh-ih)/2:color=${BG}`,
      dt(`text='${esc(`#${rank}  TOP-MOVER DER WOCHE`)}':fontsize=42:fontcolor=#a78bfa:x=(w-text_w)/2:y=150`),
      dt(`text='${esc(card.name)}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=h-360`),
      dt(`text='${esc(formatEurText(card.price))}':fontsize=54:fontcolor=#e2e8f0:x=(w-text_w)/2:y=h-270`),
      dt(`text='${trendText}':fontsize=54:fontcolor=${trendColor}:x=(w-text_w)/2:y=h-190`),
      dt(`text='${esc(SITE_LABEL)}':fontsize=30:fontcolor=#475569:x=(w-text_w)/2:y=h-90`),
    ])
    .videoCodec('libx264')
    .outputOptions(['-t', String(SEG_SECONDS), '-crf 22', '-preset fast', '-pix_fmt yuv420p', '-an']);
  await run(cmd, outPath);
}

/** Outro: CTA zur Website. */
async function renderOutro(outPath: string): Promise<void> {
  const cmd = ffmpeg()
    .input(`color=c=${BG}:s=${W}x${H}:d=${OUTRO_SECONDS}:r=${FPS}`)
    .inputFormat('lavfi')
    .videoFilters([
      dt(`text='${esc('Alle Preise täglich aktuell')}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=800`),
      dt(`text='${esc('Kostenlos & auf Deutsch')}':fontsize=44:fontcolor=#94a3b8:x=(w-text_w)/2:y=900`),
      dt(`text='${esc('Link in der Bio')}':fontsize=54:fontcolor=#a78bfa:x=(w-text_w)/2:y=1040`),
    ])
    .videoCodec('libx264')
    .outputOptions(['-t', String(OUTRO_SECONDS), '-crf 22', '-preset fast', '-pix_fmt yuv420p', '-an']);
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

    const introPath = tmp('intro.mp4');
    await renderIntro(title, dateLabel, introPath);
    cleanup.push(introPath);
    segments.push(introPath);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const res = await fetch(card.imageUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue; // Karte überspringen, Reel bleibt gültig
      const imgPath = tmp(`card-${i}.png`);
      await writeFile(imgPath, Buffer.from(await res.arrayBuffer()));
      cleanup.push(imgPath);

      const segPath = tmp(`seg-${i}.mp4`);
      await renderCardSegment(card, i + 1, imgPath, segPath);
      cleanup.push(segPath);
      segments.push(segPath);
    }

    if (segments.length < 2) throw new Error('Kein Kartenbild konnte geladen werden');

    const outroPath = tmp('outro.mp4');
    await renderOutro(outroPath);
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
