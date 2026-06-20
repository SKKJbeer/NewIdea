import axios from 'axios';
import { NewsletterContent } from '@/types';

const BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2';

export async function sendNewsletter(content: NewsletterContent): Promise<boolean> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !publicationId) { console.error('Beehiiv credentials missing'); return false; }
  try {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    nextMonday.setHours(9, 0, 0, 0);
    const postResponse = await axios.post(
      `${BEEHIIV_API_BASE}/publications/${publicationId}/posts`,
      { subject: content.subject, preview_text: content.preheader, content: { free: { html: content.htmlContent } }, status: 'draft', send_at: nextMonday.toISOString() },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    console.log(`Newsletter draft created: ${postResponse.data.data.id}`);
    return true;
  } catch (error) { console.error('Newsletter creation failed:', error); return false; }
}

export async function addSubscriber(email: string, name?: string): Promise<boolean> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !publicationId) return false;
  try {
    await axios.post(
      `${BEEHIIV_API_BASE}/publications/${publicationId}/subscriptions`,
      { email, utm_source: 'website', utm_medium: 'organic', ...(name && { first_name: name }), reactivate_existing: false, send_welcome_email: true },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (error) { console.error('Subscriber add failed:', error); return false; }
}
