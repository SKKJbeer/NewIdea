import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { generateAndSaveMarketReport } from '@/lib/market-report-generator';

// MARKTBERICHT DER LAUFENDEN WOCHE NEU ERZEUGEN — derselbe Ablauf wie der
// Montags-Cron (inkl. Qualitätsschranke), aber aus dem Studio auslösbar.
// Anlass 28.09.2026: Der Bericht der Woche entstand morgens noch mit dem alten
// Prompt; ohne diesen Weg hätte er bis zum nächsten Montag gestanden.
// Überschreibt nur die LAUFENDE Woche (week_start), nie eine vergangene.

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const r = await generateAndSaveMarketReport();
  if (r.status === 'created') {
    revalidatePath('/marktbericht');
    revalidatePath('/marktbericht/archiv');
    if (r.weekStart) revalidatePath(`/marktbericht/${r.weekStart}`);
    revalidatePath('/');
  }
  return NextResponse.json(r, { status: r.status === 'created' ? 200 : 500 });
}
