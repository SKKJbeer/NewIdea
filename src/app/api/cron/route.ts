import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary, generateNewsletterContent, generateVideoScript, generateSocialPosts } from '@/lib/ai-generator';
import { sendNewsletter } from '@/lib/newsletter';
import { runFullVideoPipeline } from '@/lib/video-pipeline';
import { scheduleAllPosts } from '@/lib/social-media';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    const cards = await fetchTrendingCards(20);
    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));
    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    results.marketSummary = 'generated';

    const newsletter = await generateNewsletterContent(summary, cards);
    const newsletterSent = await sendNewsletter(newsletter);
    results.newsletter = newsletterSent ? 'scheduled' : 'failed';

    const youtubeScript = await generateVideoScript(cards, 'youtube');
    const ytResult = await runFullVideoPipeline(youtubeScript, cards);
    results.youtubeVideo = ytResult;

    const shortsScript = await generateVideoScript(cards.slice(0, 3), 'shorts');
    const shortsResult = await runFullVideoPipeline(shortsScript, cards);
    results.shortsVideo = shortsResult;

    const socialPosts = await generateSocialPosts(cards, summary);
    await scheduleAllPosts(socialPosts);
    results.socialPosts = `${socialPosts.length} posts scheduled`;

    revalidatePath('/marktbericht');
    revalidatePath('/artikel');
    results.revalidated = true;

    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), partial: results }, { status: 500 });
  }
}
