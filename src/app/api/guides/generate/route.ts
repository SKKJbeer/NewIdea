import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { generateNextGuide } from '@/lib/guide-generator';
import { revalidatePath } from 'next/cache';

// Manueller Auslöser für die Guide-Pipeline (passwortgeschützt, Studio/Monitoring).
//
// Zweck: Eine Reparatur sofort überprüfen, statt bis zum nächsten Guide-Tag
// (Di/Fr) zu warten. Liefert das vollständige Ergebnis inklusive Klartext-Fehler.
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await generateNextGuide();
    if (result.status === 'created' && result.slug) {
      revalidatePath('/guides');
      revalidatePath(`/guides/${result.slug}`);
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Manuelle Guide-Generierung fehlgeschlagen:', err);
    return NextResponse.json({ status: 'failed', error: 'internal_error' }, { status: 500 });
  }
}
