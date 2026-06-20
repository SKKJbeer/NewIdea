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
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
