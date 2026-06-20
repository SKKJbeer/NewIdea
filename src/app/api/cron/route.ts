import { NextResponse } from 'next/server';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary, generateNewsletterContent, generateVideoScript, generateSocialPosts } from '@/lib/ai-generator';
import { sendNewsletter } from '@/lib/newsletter';
import { runFullVideoPipeline } from '@/lib/video-pipeline';
import { scheduleAllPosts } from '@/lib/social-media';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results: Record<string, unknown> = {};
  try {
    const cards = await fetchTrendingCards(20);
    results.cards = `${cards.length} fetched`;

    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));
    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    results.marketSummary = 'generated';

    const newsletter = await generateNewsletterContent(summary, cards);
    results.newsletter = (await sendNewsletter(newsletter)) ? 'scheduled' : 'failed';

    const ytScript = await generateVideoScript(cards, 'youtube');
    results.youtubeVideo = await runFullVideoPipeline(ytScript, cards);

    const shortsScript = await generateVideoScript(cards.slice(0, 3), 'shorts');
    results.shortsVideo = await runFullVideoPipeline(shortsScript, cards);

    const socialPosts = await generateSocialPosts(cards, summary);
    await scheduleAllPosts(socialPosts);
    results.socialPosts = `${socialPosts.length} posts scheduled`;

    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), partial: results }, { status: 500 });
  }
}
