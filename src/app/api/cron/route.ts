import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary, generateNewsletterContent, generateVideoScript, generateSocialPosts } from '@/lib/ai-generator';
import { sendNewsletter } from '@/lib/newsletter';
import { runFullVideoPipeline } from '@/lib/video-pipeline';
import { scheduleAllPosts } from '@/lib/social-media';

// Called by Vercel Cron or external scheduler (e.g. every Monday 07:00)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    console.log('🤖 Starting weekly automation pipeline...');

    // 1. Fetch latest card data
    const cards = await fetchTrendingCards(20);
    console.log(`✅ Fetched ${cards.length} cards`);

    // 2. Generate AI market summary
    const sorted = [...cards].sort((a, b) => (b.trendPercent || 0) - (a.trendPercent || 0));
    const summary = await generateMarketSummary(cards, sorted.slice(0, 5), sorted.slice(-5).reverse());
    results.marketSummary = 'generated';
    console.log('✅ Market summary generated');

    // 3. Generate newsletter
    const newsletter = await generateNewsletterContent(summary, cards);
    const newsletterSent = await sendNewsletter(newsletter);
    results.newsletter = newsletterSent ? 'scheduled' : 'failed';
    console.log(`${newsletterSent ? '✅' : '❌'} Newsletter ${newsletterSent ? 'scheduled' : 'failed'}`);

    // 4. Generate YouTube video script + trigger pipeline
    const youtubeScript = await generateVideoScript(cards, 'youtube');
    const ytResult = await runFullVideoPipeline(youtubeScript, cards);
    results.youtubeVideo = ytResult;
    console.log(`✅ YouTube pipeline: voiceover=${ytResult.voiceoverReady}, render=${ytResult.renderTriggered}`);

    // 5. Generate Shorts/TikTok script
    const shortsScript = await generateVideoScript(cards.slice(0, 3), 'shorts');
    const shortsResult = await runFullVideoPipeline(shortsScript, cards);
    results.shortsVideo = shortsResult;
    console.log(`✅ Shorts pipeline: voiceover=${shortsResult.voiceoverReady}`);

    // 6. Generate & schedule social media posts
    const socialPosts = await generateSocialPosts(cards, summary);
    await scheduleAllPosts(socialPosts);
    results.socialPosts = `${socialPosts.length} posts scheduled`;
    console.log(`✅ ${socialPosts.length} social posts scheduled`);

    // Trigger marktbericht page regeneration
    revalidatePath('/marktbericht');
    results.marktbericht = 'revalidated';
    console.log('✅ Marktbericht revalidated');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Cron pipeline error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      partial: results,
    }, { status: 500 });
  }
}
