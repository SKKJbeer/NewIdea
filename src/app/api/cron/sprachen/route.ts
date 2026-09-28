import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest, isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { sprachLauf, leseSprachStand, sprachpreisGate } from '@/lib/sprachpreise';

// PREISE JAPANISCHER UND KOREANISCHER AUSGABEN — taeglich (siehe sprachpreise.ts).
//
// STATUS 500, wenn die Qualitaetsschranke nicht haelt (keine Zuordnung, zu
// wenige Paare, Preisstand aelter als drei Tage). Ein stiller Ausfall waere
// hier besonders tueckisch: Die Kartenseite zeigt dann einfach keinen
// JP-Preis — das sieht aus wie „keine Zuordnung", nicht wie eine Stoerung.

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request) && !isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // `?nur=stand` — Diagnose ohne Lauf.
  if (new URL(request.url).searchParams.get('nur') === 'stand') {
    const { zuordnung, preise } = await leseSprachStand();
    const gate = sprachpreisGate(zuordnung, preise);
    return NextResponse.json({
      gate,
      zuordnung: zuordnung ? { erstellt: zuordnung.erstellt, statistik: zuordnung.statistik, setPaare: zuordnung.setPaare } : null,
      preise: preise ? { stand: preise.stand, abgerufen: preise.abgerufen, anzahl: Object.keys(preise.preise).length } : null,
    }, { status: gate.ok ? 200 : 500 });
  }
  try {
    const lauf = await sprachLauf(240_000);
    console.log('[cron/sprachen]', JSON.stringify(lauf));
    return NextResponse.json({ ok: lauf.gate.ok, ...lauf }, { status: lauf.gate.ok ? 200 : 500 });
  } catch (err) {
    console.error('[cron/sprachen] fehlgeschlagen:', err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
