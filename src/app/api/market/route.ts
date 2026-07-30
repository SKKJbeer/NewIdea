import { NextResponse } from 'next/server';
import { fetchTrendingCards } from '@/lib/pokemon-api';
import { generateMarketSummary } from '@/lib/ai-generator';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { splitMovers } from '@/lib/market-metrics';

// ACHTUNG: Dieser Endpunkt löst pro Aufruf eine vollständige KI-Generierung aus
// und kostet damit echtes Geld. Er war ohne jede Prüfung per GET erreichbar —
// jeder Crawler, Bot oder Scanner konnte ihn auslösen. Genau so lässt sich ein
// Guthaben leerlaufen, ohne dass ein einziger Besucher etwas davon hat.
export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cards = await fetchTrendingCards(20);
    // Vorzeichen-Filter über die zentrale Stelle — NICHT dieselbe Liste
    // zweimal sortieren und oben bzw. unten abschneiden. Genau das stand hier:
    // Bei nur zwei gestiegenen Karten enthielten die „Gewinner" drei gefallene,
    // und eine Karte konnte in beiden Listen auftauchen. Auf der Startseite war
    // dieser Fehler seit v3.0.0 behoben — hier lief er weiter und speiste den
    // Marktbericht.
    const { gainers, losers } = splitMovers(cards, 5);
    const summary = await generateMarketSummary(cards, gainers, losers);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Market summary error:', error);
    return NextResponse.json({ error: 'Failed to generate market summary' }, { status: 500 });
  }
}
