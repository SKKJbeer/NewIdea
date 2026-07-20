import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { getSupabase } from '@/lib/supabase';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 300;

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

// Mitgelieferte Schriftart für drawtext — Vercel hat keine System-Fonts.
const FONT = join(process.cwd(), 'src/assets/fonts/reel-font.ttf');

function processVideo(inputPath: string, outputPath: string, clipDuration: number, startTime?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath);

    if (startTime !== undefined && startTime >= 0) {
      // Pre-input seek to specific position (fast; frame-accurate enough for social content)
      cmd.inputOptions([`-ss ${startTime}`]);
    } else {
      // Seek from end — cuts last N seconds without needing total duration
      cmd.inputOptions([`-sseof -${clipDuration}`]);
    }

    cmd
      .videoFilters([
        'crop=ih*9/16:ih:(iw-ih*9/16)/2:0',
        'scale=1080:1920:flags=lanczos',
        `drawtext=fontfile=${FONT}:text='PokéMarket Intel':fontsize=38:x=(w-text_w)/2:y=h-70:fontcolor=white:shadowcolor=black@0.8:shadowx=2:shadowy=2`,
      ])
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        ...(startTime !== undefined ? [`-t ${clipDuration}`] : []),
        '-crf 23', '-preset fast', '-movflags +faststart', '-pix_fmt yuv420p',
      ])
      .on('end', () => resolve())
      .on('error', (err: Error, _stdout: string | null, stderr: string | null) => {
        const tail = stderr ? String(stderr).trim().split('\n').slice(-3).join(' | ') : '';
        reject(new Error(`ffmpeg: ${err?.message || 'error'}${tail ? ' :: ' + tail : ''}`));
      })
      .save(outputPath);
  });
}

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });

  const { path, clipDuration = 30, description = '', startTime } = await request.json().catch(() => ({}));
  if (!path) return NextResponse.json({ error: 'path fehlt' }, { status: 400 });

  const uid = randomUUID();
  const inputPath = join(tmpdir(), `pm-in-${uid}.mp4`);
  const outputPath = join(tmpdir(), `pm-out-${uid}.mp4`);

  try {
    // Download raw video from Supabase Storage
    const { data: dl, error: dlErr } = await sb.storage.from('videos').download(path);
    if (dlErr || !dl) throw new Error(`Download fehlgeschlagen: ${dlErr?.message}`);

    await writeFile(inputPath, Buffer.from(await dl.arrayBuffer()));

    // Cut + crop + brand
    await processVideo(inputPath, outputPath, clipDuration, typeof startTime === 'number' ? startTime : undefined);

    // Upload processed Reel
    const outputBuffer = await readFile(outputPath);
    const reelPath = `reels/${Date.now()}-reel.mp4`;
    const { error: upErr } = await sb.storage.from('videos').upload(reelPath, outputBuffer, {
      contentType: 'video/mp4',
      upsert: false,
    });
    if (upErr) throw new Error(`Upload fehlgeschlagen: ${upErr.message}`);

    // Signed preview URL (valid 2h — enough for Instagram upload too)
    const { data: urlData } = await sb.storage.from('videos').createSignedUrl(reelPath, 7200);

    // KI-Caption generieren
    let caption = generateFallbackCaption(description);
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const client = new Anthropic({ apiKey: anthropicKey });
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 250,
          messages: [{
            role: 'user',
            content: `Schreib einen knappen Instagram-Caption für ein Pokémon Pack-Opening-Reel auf Deutsch. ${description ? `Kontext: ${description}. ` : ''}Sachlich und enthusiastisch, keine Kaufempfehlungen. Max. 120 Zeichen Caption-Text, dann Leerzeile, dann 6-8 Hashtags. Nur Caption + Hashtags, kein anderer Text.`,
          }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : null;
        if (text) caption = text;
      } catch { /* fallback caption */ }
    }

    return NextResponse.json({ reelPath, reelUrl: urlData?.signedUrl ?? null, caption });
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

function generateFallbackCaption(description: string) {
  const base = description ? `${description}\n\n` : '';
  return `${base}🎴 Pack Opening Highlight\n\n#Pokemon #PokemonTCG #PackOpening #PokemonCards #Pokémon #Sammelkarten #TCG`;
}
