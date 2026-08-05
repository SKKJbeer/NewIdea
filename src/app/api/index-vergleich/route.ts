import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { getSupabase } from '@/lib/supabase';
import { getHomepageCards } from '@/lib/homepage-data';
import { computePmi, marketBreadth } from '@/lib/market-metrics';
import type { PokemonCard } from '@/types';

// NUR MESSEN, NICHTS ÄNDERN.
//
// Diese Route beantwortet EINE Frage: Wie sähen CBI und Marktbreite aus, wenn
// sie nicht auf der heutigen Stichprobe von rund 250 Karten rechneten, sondern
// auf dem gesamten erfassten Bestand?
//
// Sie ist bewusst getrennt von dem, was die Startseite anzeigt. Eine Kennzahl
// umzustellen, ohne vorher zu wissen, wie stark sie sich dadurch ändert, wäre
// bei einer Marktaussage das Falscheste überhaupt — man würde eine andere Zahl
// ausliefern und sie für dieselbe halten.
//
// Passwortgeschützt wie /monitoring: Das ist eine Entscheidungsgrundlage, kein
// Seiteninhalt.

export const maxDuration = 60;

/** Supabase liefert höchstens 1000 Zeilen je Anfrage. */
const SEITE = 1000;
const MAX_SEITEN = 30;

interface IndexZeile {
  set_code: string;
  price: number;
  trend: number | null;
  real_data: boolean;
}

/** Nur die vier Felder, die in die Kennzahlen eingehen — nicht die ganze Zeile. */
async function ganzenIndexLesen(): Promise<{ zeilen: IndexZeile[]; vollstaendig: boolean }> {
  const sb = getSupabase();
  if (!sb) return { zeilen: [], vollstaendig: false };

  const zeilen: IndexZeile[] = [];
  for (let seite = 0; seite < MAX_SEITEN; seite++) {
    const von = seite * SEITE;
    const { data, error } = await sb
      .from('cards_index')
      .select('set_code,price,trend,real_data')
      .order('price', { ascending: false })
      .range(von, von + SEITE - 1);
    if (error) throw new Error(error.message);
    const stapel = (data ?? []) as IndexZeile[];
    zeilen.push(...stapel);
    if (stapel.length < SEITE) return { zeilen, vollstaendig: true };
  }
  // Grenze erreicht: Das Ergebnis ist dann NICHT der ganze Bestand, und das
  // muss dranstehen — sonst wäre die Vergleichszahl selbst eine Behauptung.
  return { zeilen, vollstaendig: false };
}

function alsKarte(z: IndexZeile): PokemonCard {
  return {
    id: '',
    name: '',
    set: '',
    setCode: z.set_code,
    rarity: '',
    imageUrl: '',
    prices: { market: Number(z.price) },
    trendPercent: z.trend === null ? undefined : Number(z.trend),
    realData: z.real_data,
  } as PokemonCard;
}

// Diese Route liefert JSON zur internen Entscheidung, keinen Seitentext. Die
// Zahlen werden nur gekuerzt, nicht fuer die Anzeige formatiert — deutsche
// Schreibweise waere in JSON sogar falsch.
function kennzahlen(karten: PokemonCard[]) {
  const pmi = computePmi(karten);
  const breite = marketBreadth(karten);
  return {
    karten: karten.length,
    gemessen: pmi.cardCount,
    sets: pmi.setCount,
    // toFixed erlaubt: JSON-Diagnose, kein Seitentext (siehe oben).
    cbi: pmi.sufficient ? Number(pmi.value.toFixed(3)) : null,
    belastbar: pmi.sufficient,
    // toFixed erlaubt: JSON-Diagnose, kein Seitentext (siehe oben).
    marktbreite: breite.total > 0 ? Number(breite.pct.toFixed(1)) : null,
    hoch: breite.up,
    runter: breite.down,
  };
}

export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const [{ zeilen, vollstaendig }, stichprobe] = await Promise.all([
      ganzenIndexLesen(),
      getHomepageCards(250).catch(() => [] as PokemonCard[]),
    ]);

    const alle = zeilen.map(alsKarte);
    // Die Schwellen sind der eigentliche Zweck: „alle Karten" und „alle Karten
    // ab einem Cent-Betrag" sind zwei sehr verschiedene Märkte, und welcher
    // gemeint ist, entscheidet sich an diesen Zahlen.
    const schwellen = [0, 0.1, 0.5, 1, 5, 20];

    return NextResponse.json({
      stand: new Date().toISOString(),
      indexVollstaendigGelesen: vollstaendig,
      zeilenImIndex: zeilen.length,
      heute: {
        quelle: 'fetchTopValueCards / getHomepageCards — Stichprobe nach Seltenheit',
        ...kennzahlen(stichprobe),
      },
      ausDemIndex: schwellen.map((ab) => ({
        abPreis: ab,
        ...kennzahlen(alle.filter((k) => (k.prices.market ?? 0) >= ab)),
      })),
    });
  } catch (error) {
    console.error('[index-vergleich] fehlgeschlagen:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
