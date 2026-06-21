import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { generateArticle } from '@/lib/article-generator';
import type { ArticleType } from '@/lib/article-generator';

export const maxDuration = 60;

// Jeden Mittwoch 09:00 UTC: einen zusätzlichen Artikel generieren.
// Thema rotiert wöchentlich durch alle 6 Typen (außer Wochenrückblick — der hat einen eigenen Cron).
const ROTATING_TYPES: ArticleType[] = ['markt', 'karte', 'strategie', 'set', 'ausblick', 'guide'];

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const weekNum = getISOWeek(now);
  const type = ROTATING_TYPES[weekNum % ROTATING_TYPES.length];

  try {
    const article = await generateArticle(type, date);
    revalidatePath('/artikel');
    return NextResponse.json({ ok: true, date, type, title: article.title, week: weekNum });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
