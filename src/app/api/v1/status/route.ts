import { NextResponse } from 'next/server';
import { indexStandTag } from '@/lib/card-index';
import { APP_API_VERSION, MIN_APP_BUILD } from '@/lib/app-api';

// Status für die App (v1): Schnittstellenversion, Mindest-Build (erzwungenes
// Update statt stillem Bruch) und Datenstand des Kartenindex.
export async function GET() {
  const datenStand = await indexStandTag().catch(() => null);
  return NextResponse.json(
    { api: APP_API_VERSION, minAppBuild: MIN_APP_BUILD, datenStand },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } },
  );
}
