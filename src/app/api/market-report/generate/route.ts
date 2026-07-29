import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { generateAndSaveMarketReport } from '@/lib/market-report-generator';

// Manueller Auslöser für den Wochen-Marktbericht (passwortgeschützt).
//
// Zweck: Sofort einen echten Bericht erzeugen, statt bis zum nächsten Montag zu
// warten — und im Fehlerfall die Ursache im Klartext sehen.
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await generateAndSaveMarketReport();

  if (result.status === 'created') {
    revalidatePath('/marktbericht');
    revalidatePath('/marktbericht/archiv');
    revalidatePath('/');
  }

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
