import { NextResponse } from 'next/server';
import { wertvollsteAusIndex } from '@/lib/card-index';
import { loadLatestMarketIndex, loadMarketIndexHistory } from '@/lib/market-index-store';
import { siteUrlOrLocal } from '@/lib/site';
import { ladeSetListe } from '@/lib/set-liste';
import { ohneDuenneAusreisser } from '@/lib/markt-lage';
import { APP_CACHE, bewegungen, indexDto, karteDto, type MarktDto } from '@/lib/app-api';

// Marktüberblick (v1): CardBeacon Index (nur Stände ≤ 3 Tage), dessen echte
// Tagesreihe und die stärksten Bewegungen aus dem Tagesstand der 500
// wertvollsten Karten (nur junge Preise — dieselbe Grundlage wie Instagram).
export async function GET() {
  try {
    const basis = siteUrlOrLocal();
    const [index, verlauf, wertvollste, setListe] = await Promise.all([
      loadLatestMarketIndex(3),
      loadMarketIndexHistory(90),
      wertvollsteAusIndex(500),
      ladeSetListe(250).catch(() => null),
    ]);
    // Dieselbe Relevanzregel wie Website und Instagram (markt-lage.ts): Klassiker
    // mit mehr als 100 % sind dünn gehandelt (ein Einzelverkauf), keine Marktbewegung.
    // Ohne Erscheinungsdaten gilt jede Karte als Klassiker — lieber eine Bewegung zu wenig.
    const setDatum = new Map((setListe?.sets ?? []).map((s) => [s.id, s.releaseDate] as [string, string]));
    const karten = ohneDuenneAusreisser(wertvollste.karten, setDatum).map((k) => karteDto(k, basis));
    const antwort: MarktDto = {
      index: indexDto(index),
      indexVerlauf: verlauf.filter((p) => Number.isFinite(p.value)).map((p) => ({ datum: p.date, wert: p.value })),
      ...bewegungen(karten),
      datenStand: wertvollste.stand,
    };
    return NextResponse.json(antwort, { headers: { 'Cache-Control': APP_CACHE } });
  } catch (err) {
    console.error('[api/v1/markt]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'nicht-verfuegbar' }, { status: 503 });
  }
}
