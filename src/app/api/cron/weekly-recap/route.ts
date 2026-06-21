import { NextResponse } from 'next/server';
import { generateArticle } from '@/lib/article-generator';

export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cron fires Monday 06:00 UTC — recap is dated to the previous Sunday
  // (day 0 = Sun: today; day 1 = Mon: yesterday; etc.)
  const now = new Date();
  const sunday = new Date(now);
  sunday.setUTCDate(now.getUTCDate() - now.getUTCDay());
  const date = sunday.toISOString().split('T')[0];

  try {
    const article = await generateArticle('rueckblick', date);
    return NextResponse.json({ ok: true, date, title: article.title });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
