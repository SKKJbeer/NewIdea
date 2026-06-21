import { NextResponse } from 'next/server';
import { generateArticle } from '@/lib/article-generator';

export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find current Monday in UTC (cron fires on Monday 06:00 UTC)
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const offset = day === 0 ? -6 : 1 - day; // days back to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + offset);
  const date = monday.toISOString().split('T')[0];

  try {
    const article = await generateArticle('rueckblick', date);
    return NextResponse.json({ ok: true, date, title: article.title });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
