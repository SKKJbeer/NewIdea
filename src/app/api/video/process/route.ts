import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { getSupabase } from '@/lib/supabase';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { ensureFfmpeg } from '@/lib/ffmpeg-setup';
import { recordAiUsage } from '@/lib/ai-usage';
import { describeAiError } from '@/lib/ai-error';

export const maxDuration = 300;

// Modell-ID zentral und per Umgebungsvariable überschreibbar — nie als nackter
// String in der Route (Code-Qualitätsregel 7).
const CAPTION_MODEL = process.env.ANTHROPIC_CAPTION_MODEL || 'claude-haiku-4-5';

/**
 * Zwingt eine Zahl aus der Anfrage in einen gültigen Bereich.
 *
 * WARUM: `clipDuration` floss ungeprüft in die FFmpeg-Argumente
 * (`-sseof -${clipDuration}`, `-t ${clipDuration}`). Ein Wert wie
 * `"30 -f mp4 -y /tmp/x"` hätte dort zusätzliche Optionen eingeschleust —
 * jede Zeichenkette wird als eigenes Argument weitergereicht. Eine Zahl mit
 * Grenzen kann das nicht.
 */
function zahlImBereich(wert: unknown, min: number, max: number, standard: number): number {
  const n = Number(wert);
  if (!Number.isFinite(n)) return standard;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Prüft einen Speicherpfad im Supabase-Bucket.
 *
 * Ohne Prüfung ließe sich mit `../` aus dem vorgesehenen Bereich heraus auf
 * andere Objekte zugreifen. Der Zugang ist zwar passwortgeschützt — trotzdem
 * gehört eine Eingabe aus dem Netz nie ungeprüft in einen Pfad.
 */
function istGueltigerSpeicherpfad(pfad: unknown): pfad is string {
  return (
    typeof pfad === 'string' &&
    pfad.length > 0 &&
    pfad.length <= 512 &&
    !pfad.startsWith('/') &&
    !pfad.includes('..') &&
    /^[\w./-]+$/.test(pfad)
  );
}

ensureFfmpeg();

// HINWEIS: Der Branding-Schriftzug wurde entfernt. Die mitgelieferte
// FFmpeg-Binary enthält den Filter `drawtext` NICHT (486 Filter, keiner davon
// drawtext) — jeder Schnitt scheiterte deshalb an dieser einen Zeile. Für
// Text-Overlays auf Video siehe reel-frames.tsx (Bild-Rendering statt drawtext).

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

  const body: Record<string, unknown> = await request
    .json()
    .catch(() => ({} as Record<string, unknown>));
  const path = body.path;
  const description = typeof body.description === 'string' ? body.description : '';
  if (!istGueltigerSpeicherpfad(path)) {
    return NextResponse.json({ error: 'ungueltiger_pfad' }, { status: 400 });
  }

  // Grenzen: höchstens 3 Minuten Clip, höchstens 12 Stunden Vorlauf.
  const clipDuration = zahlImBereich(body.clipDuration ?? 30, 1, 180, 30);
  const startTime =
    body.startTime === undefined || body.startTime === null
      ? undefined
      : zahlImBereich(body.startTime, 0, 43_200, 0);

  const uid = randomUUID();
  const inputPath = join(tmpdir(), `pm-in-${uid}.mp4`);
  const outputPath = join(tmpdir(), `pm-out-${uid}.mp4`);

  try {
    // Download raw video from Supabase Storage
    const { data: dl, error: dlErr } = await sb.storage.from('videos').download(path);
    if (dlErr || !dl) throw new Error(`Download fehlgeschlagen: ${dlErr?.message}`);

    await writeFile(inputPath, Buffer.from(await dl.arrayBuffer()));

    // Cut + crop + brand
    await processVideo(inputPath, outputPath, clipDuration, startTime);

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
          model: CAPTION_MODEL,
          max_tokens: 250,
          messages: [{
            role: 'user',
            content: `Schreib einen knappen Instagram-Caption für ein Pokémon Pack-Opening-Reel auf Deutsch. ${description ? `Kontext: ${description}. ` : ''}Sachlich und enthusiastisch, keine Kaufempfehlungen. Max. 120 Zeichen Caption-Text, dann Leerzeile, dann 6-8 Hashtags. Nur Caption + Hashtags, kein anderer Text.`,
          }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : null;
        if (text) caption = text;
        await recordAiUsage({ purpose: 'social-posts', model: CAPTION_MODEL, usage: msg.usage, ok: true });
      } catch (err) {
        // Ohne Erfassung fehlte dieser Aufruf komplett in der Kostenübersicht.
        const grund = describeAiError(err);
        console.warn('Caption-Generierung fehlgeschlagen:', grund.message);
        await recordAiUsage({ purpose: 'social-posts', model: CAPTION_MODEL, ok: false, error: grund.message });
      }
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
