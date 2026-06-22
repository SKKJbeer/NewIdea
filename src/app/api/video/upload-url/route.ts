import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });

  const { filename } = await request.json().catch(() => ({}));
  if (!filename) return NextResponse.json({ error: 'filename fehlt' }, { status: 400 });

  // Bucket anlegen falls noch nicht vorhanden
  await sb.storage.createBucket('videos', {
    public: false,
    fileSizeLimit: 500 * 1024 * 1024,
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
  }).catch(() => {}); // ignore if bucket already exists

  const safeName = filename.replace(/[^a-z0-9._-]/gi, '_');
  const path = `raw/${Date.now()}-${safeName}`;

  const { data, error } = await sb.storage.from('videos').createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Upload-URL konnte nicht erstellt werden' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path });
}
