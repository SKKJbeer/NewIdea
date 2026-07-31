import { NextResponse } from 'next/server';
import { getHomepageCards } from '@/lib/homepage-data';
import { computePmi, validateMarketData } from '@/lib/market-metrics';

// Liefert den CardBeacon Index als Zahl — Grundlage für den Vergleich
// „mein Bestand gegen den Markt" auf der Portfolio-Seite.
//
// BEWUSST OHNE ANMELDUNG, aber auch bewusst OHNE KI: Diese Route liest nur
// bereits vorhandene Kartendaten und rechnet. Sie kann kein Guthaben
// verbrauchen — anders als `/api/market`, die eine vollständige Generierung
// auslöste und deshalb einen Zugriffsschutz bekommen hat (v2.34.0).
//
// Die Antwort ist eine Stunde lang zwischenspeicherbar; der PMI ändert sich
// nicht schneller als die zugrunde liegenden Kursdaten.

export const revalidate = 3600;

export async function GET() {
  try {
    // Dieselbe Stichprobengröße wie die Startseite — sonst nennt die Seite eine
    // andere Kartenzahl als die Schnittstelle, die denselben Index ausliefert.
    const cards = await getHomepageCards(250);
    // Dieselbe Prüfung wie auf der Startseite — sonst könnten hier andere
    // Zahlen stehen als dort.
    const pmi = computePmi(validateMarketData(cards).clean);

    return NextResponse.json(
      {
        value: pmi.sufficient ? Math.round(pmi.value * 100) / 100 : null,
        sufficient: pmi.sufficient,
        cardCount: pmi.cardCount,
        setCount: pmi.setCount,
        windowDays: pmi.windowDays,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } },
    );
  } catch (err) {
    // Keine internen Details nach außen (Code-Regel 3).
    console.error('Index konnte nicht berechnet werden:', err);
    return NextResponse.json({ value: null, sufficient: false }, { status: 200 });
  }
}
