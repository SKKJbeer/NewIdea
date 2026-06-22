import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';

export const maxDuration = 120;

const GRAPH = 'https://graph.facebook.com/v19.0';

async function pollContainerStatus(containerId: string, token: string): Promise<string> {
  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${token}`);
    const data = await res.json() as { status_code?: string };
    if (data.status_code && data.status_code !== 'IN_PROGRESS') return data.status_code;
  }
  return 'TIMEOUT';
}

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !accountId) {
    return NextResponse.json({
      stubbed: true,
      message: 'INSTAGRAM_ACCESS_TOKEN und INSTAGRAM_BUSINESS_ACCOUNT_ID in Vercel eintragen, dann wird dieser Button aktiv.',
    });
  }

  const { videoUrl, caption } = await request.json().catch(() => ({}));
  if (!videoUrl || !caption) {
    return NextResponse.json({ error: 'videoUrl und caption erforderlich' }, { status: 400 });
  }

  // 1. Container erstellen
  const containerRes = await fetch(`${GRAPH}/${accountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'REELS', video_url: videoUrl, caption, access_token: token }),
  });
  const containerData = await containerRes.json() as { id?: string; error?: { message: string } };
  if (containerData.error) {
    return NextResponse.json({ error: containerData.error.message }, { status: 500 });
  }
  const containerId = containerData.id!;

  // 2. Auf Verarbeitung warten
  const statusCode = await pollContainerStatus(containerId, token);
  if (statusCode !== 'FINISHED') {
    return NextResponse.json({ error: `Container-Status: ${statusCode}` }, { status: 500 });
  }

  // 3. Veröffentlichen
  const publishRes = await fetch(`${GRAPH}/${accountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  const publishData = await publishRes.json() as { id?: string; error?: { message: string } };
  if (publishData.error) {
    return NextResponse.json({ error: publishData.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mediaId: publishData.id });
}
