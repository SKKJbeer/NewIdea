import axios from 'axios';
import { SocialPost } from '@/types';

const BUFFER_API = 'https://api.bufferapp.com/1';

export async function schedulePost(post: SocialPost): Promise<boolean> {
  const accessToken = process.env.BUFFER_ACCESS_TOKEN;
  const profileIds = getProfileIds(post.platform);
  if (!accessToken || profileIds.length === 0) { console.warn(`Buffer not configured for ${post.platform}`); return false; }
  const fullText = `${post.caption}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`;
  const bestHours: Record<string, number> = { instagram: 18, twitter: 12, tiktok: 19 };
  const optimal = new Date();
  optimal.setDate(optimal.getDate() + 1);
  optimal.setHours(bestHours[post.platform] || 12, 0, 0, 0);
  try {
    await axios.post(`${BUFFER_API}/updates/create.json`, { text: fullText, profile_ids: profileIds, scheduled_at: post.scheduledFor || optimal.toISOString() }, { params: { access_token: accessToken } });
    return true;
  } catch (error) { console.error(`Social post failed for ${post.platform}:`, error); return false; }
}

export async function scheduleAllPosts(posts: SocialPost[]): Promise<void> {
  for (const post of posts) await schedulePost(post);
}

function getProfileIds(platform: string): string[] {
  switch (platform) {
    case 'instagram': return process.env.BUFFER_INSTAGRAM_ID ? [process.env.BUFFER_INSTAGRAM_ID] : [];
    case 'twitter': return process.env.BUFFER_TWITTER_ID ? [process.env.BUFFER_TWITTER_ID] : [];
    case 'tiktok': return process.env.BUFFER_TIKTOK_ID ? [process.env.BUFFER_TIKTOK_ID] : [];
    default: return [];
  }
}
