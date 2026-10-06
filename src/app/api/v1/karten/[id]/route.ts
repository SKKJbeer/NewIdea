import { NextResponse } from 'next/server';
import { cardsFromIndex } from '@/lib/card-index';
import { getStoredPriceHistory } from '@/lib/price-history';
import { karteMitFrischpreis } from '@/lib/frischpreis-karte';
import { siteUrlOrLocal } from '@/lib/site';
import { APP_CACHE, detailDto } from '@/lib/app-api';

// Kartendetail (v1): Stammdaten + Preis aus dem eigenen Index, Cardmarket-
// Aufschlüsselung vom Vortag (TCGdex, Zeitgrenze 4 s, wirft nie), echte
// Tageswerte. Nichts wird interpoliert — zu wenige Punkte zeigt die App ehrlich an.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(id)) return NextResponse.json({ error: 'ungueltig' }, { status: 400 });
  try {
    const treffer = (await cardsFromIndex([id])).get(id);
    if (!treffer) return NextResponse.json({ error: 'nicht-gefunden' }, { status: 404 });
    const [karte, verlauf] = await Promise.all([karteMitFrischpreis(treffer), getStoredPriceHistory(id, 90)]);
    // Der Index-Stand bleibt erhalten; die Aufschlüsselung kommt aus dem Tagesabruf.
    return NextResponse.json(detailDto({ ...karte, indexStand: treffer.indexStand }, verlauf, siteUrlOrLocal()), {
      headers: { 'Cache-Control': APP_CACHE },
    });
  } catch (err) {
    console.error('[api/v1/karten]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
