import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json();
  const secret = process.env.STUDIO_PASSWORD;
  // If no STUDIO_PASSWORD is set (local dev), allow access
  if (!secret || password === secret) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
