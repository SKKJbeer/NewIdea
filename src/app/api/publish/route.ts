import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest } from '@/lib/studio-auth';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  if (!isCronAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/marktbericht');

  return NextResponse.json({
    revalidated: true,
    path: '/marktbericht',
    timestamp: new Date().toISOString(),
  });
}
