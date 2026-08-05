import { displayPrice } from '@/lib/pokemon-api';
import { cachedSearchCards } from '@/lib/search-cache';
import { searchSetIndex, type SetTreffer } from '@/lib/card-index';
import { NextResponse } from 'next/server';

// VORSCHLÄGE BEIM TIPPEN
//
// Diese Route wird pro Suchbegriff mehrfach aufgerufen — nach jeder Pause im
// Tippen. Sie ist damit der meistgenutzte Weg zur Kartendatenbank überhaupt,
// und ausgerechnet sie ging bis eben bei jedem Aufruf voll durch: Der
// Zwischenspeicher in `searchCards` liegt im Arbeitsspeicher einer Instanz, und
// auf Vercel beantwortet praktisch jede Anfrage eine andere.
//
// Die `Cache-Control`-Kopfzeile darunter half nur, wenn ZWEI Besucher denselben
// Begriff tippen, und auch nur am Rand des Netzes. Der geteilte Datenspeicher
// wirkt dagegen auch beim ersten Besucher, sobald irgendein Server denselben
// Begriff schon einmal gesehen hat.
//
// Beides bleibt: Der Datenspeicher spart den Weg zur Quelle, die Kopfzeile
// spart zusätzlich den Weg zum Server.

// Der Client bestimmt, wieviele er braucht — aber nur innerhalb einer Grenze.
// Ohne Deckel wäre `?n=5000` ein Weg, über die Vorschlagsroute die halbe
// Datenbank abzuziehen; ohne Untergrenze käme eine leere Liste zurück, die wie
// „keine Treffer" aussieht.
const N_MIN = 5;
const N_MAX = 20;

// EINE Form der Antwort, auch im Fehlerfall. Zwei verschiedene Formen (mal
// Liste, mal Objekt) waeren eine Fallunterscheidung im Client, die niemand
// mitpflegt.
const LEER = { cards: [], sets: [] };

function grenze(roh: string | null): number {
  const n = Number.parseInt(roh ?? '', 10);
  if (!Number.isFinite(n)) return N_MAX;
  return Math.min(Math.max(n, N_MIN), N_MAX);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json(LEER);

  try {
    // Karten und Sets NEBENEINANDER, nicht nacheinander: Die Set-Suche geht in
    // dieselbe Datenbank und würde sonst die Antwortzeit verdoppeln.
    const [cards, sets] = await Promise.all([
      cachedSearchCards(q, grenze(searchParams.get('n'))),
      // Ein Ausfall der Set-Suche darf die Kartenvorschläge nicht mitreißen —
      // sie sind der Hauptzweck dieser Route.
      searchSetIndex(q, 2).catch(() => [] as SetTreffer[]),
    ]);
    const suggestions = cards.map((c) => ({
      id: c.id,
      name: c.name,
      nameDe: c.nameDe,
      imageUrl: c.imageUrl,
      price: displayPrice(c),
      set: c.set,
    }));
    return NextResponse.json(
      { cards: suggestions, sets },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch {
    // catch erlaubt: Vorschläge sind eine Zugabe — ohne sie funktioniert die
    // Suche weiterhin über die Eingabetaste.
    return NextResponse.json(LEER);
  }
}
