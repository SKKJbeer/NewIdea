import { NextResponse } from 'next/server';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateVideoScript } from '@/lib/ai-generator';
import { runFullVideoPipeline } from '@/lib/video-pipeline';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { format = 'youtube' } = await request.json().catch(() => ({}));
  try {
    const cards = await fetchTrendingCards(10);
    const script = await generateVideoScript(cards, format as 'youtube' | 'shorts' | 'tiktok');
    const result = await runFullVideoPipeline(script, cards);
    return NextResponse.json({ success: result.success, script: { title: script.title, duration: script.duration, sceneCount: script.scenes.length }, pipeline: result });
  } catch (error) {
    // Ursache server-seitig loggen, nach außen generisch antworten:
    // String(error) verrät Pfade, Schlüssel und Architektur.
    console.error('Video-Pipeline fehlgeschlagen:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
