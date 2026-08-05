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

/**
 * Kandidaten für einen belastbaren Indexwert — zum Vergleich, nicht zum Einbau.
 *
 * BEFUND, der sie nötig macht: Auf dem Gesamtbestand ergibt der heutige,
 * preisgewichtete Mittelwert +28,7 %, während der MEDIAN aller 19.063
 * gemessenen Trends bei 0 % liegt. Zehn Karten von 19.063 tragen zusammen rund
 * 12 der 28,7 Prozentpunkte — alles Karten aus alten Sets (pop5, base1, ex7),
 * bei denen ein Cardmarket-30-Tage-Schnitt aus wenigen Verkäufen entsteht und
 * dadurch dreistellige Prozentwerte zeigen kann.
 *
 * Der Mittelwert ohne Ausreißerschutz war auf einer gleichartigen Stichprobe
 * unauffällig. Auf dem ganzen Markt ist er es nicht.
 */
function robusteVarianten(karten: PokemonCard[]) {
  const mit = karten.filter(
    (k) => typeof k.trendPercent === 'number' && !(k.trendPercent === 0 && k.realData !== true),
  );
  if (mit.length === 0) return null;

  const trends = mit.map((k) => k.trendPercent as number).sort((a, b) => a - b);
  const perzentil = (q: number) => trends[Math.floor((trends.length - 1) * q)];

  // 1. Median, ungewichtet — die typische Karte.
  const median = perzentil(0.5);

  // 2. Preisgewichtet, aber die äußersten Prozent gestutzt (nicht entfernt):
  //    Ein Ausreißer zählt mit dem Wert der Grenze, nicht mit seinem eigenen.
  const unten = perzentil(0.01);
  const oben = perzentil(0.99);
  let gs = 0;
  let ts = 0;
  for (const k of mit) {
    const g = k.prices.market || 1;
    const t = Math.min(Math.max(k.trendPercent as number, unten), oben);
    ts += t * g;
    gs += g;
  }
  const gestutzt = gs > 0 ? ts / gs : 0;

  // 3. Preisgewichtet mit Gewichtsdeckel: Keine Karte darf mehr als ein halbes
  //    Prozent des Gesamtgewichts stellen. Das begrenzt genau den Effekt, den
  //    die Liste `groessteBeitraege` sichtbar macht.
  const gesamtGewicht = mit.reduce((s, k) => s + (k.prices.market || 1), 0);
  const deckel = gesamtGewicht * 0.005;
  let gs2 = 0;
  let ts2 = 0;
  for (const k of mit) {
    const g = Math.min(k.prices.market || 1, deckel);
    ts2 += (k.trendPercent as number) * g;
    gs2 += g;
  }
  const gedeckelt = gs2 > 0 ? ts2 / gs2 : 0;

  // toFixed erlaubt: JSON-Diagnose, kein Seitentext.
  const r = (x: number) => Number(x.toFixed(2));
  return { median: r(median), gestutztP1P99: r(gestutzt), gewichtsdeckel: r(gedeckelt) };
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
    robust: robusteVarianten(karten),
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

    // WOHER KOMMT DIE ZAHL? Ohne diese Aufschlüsselung wäre der Vergleich oben
    // nur ein zweiter Wert, kein Argument. Der CBI ist preisgewichtet und hat
    // keinerlei Ausreißerschutz — auf einer gleichartigen Stichprobe fällt das
    // nie auf, auf dem Gesamtbestand entscheidet es alles.
    const gemessen = alle.filter(
      (k) => typeof k.trendPercent === 'number' && !(k.trendPercent === 0 && k.realData !== true),
    );
    const trends = gemessen.map((k) => k.trendPercent as number).sort((a, b) => a - b);
    const p = (q: number) => (trends.length ? trends[Math.floor((trends.length - 1) * q)] : null);

    // Die zehn Karten mit dem größten Beitrag zum gewichteten Mittel:
    // Preis × Trend. Genau sie machen den Unterschied zwischen −0,2 und +28.
    const beitraege = gemessen
      .map((k) => ({
        preis: k.prices.market ?? 0,
        trend: k.trendPercent as number,
        beitrag: (k.prices.market ?? 0) * (k.trendPercent as number),
        set: k.setCode,
      }))
      .sort((a, b) => Math.abs(b.beitrag) - Math.abs(a.beitrag))
      .slice(0, 10);

    const gewichtSumme = gemessen.reduce((s, k) => s + (k.prices.market || 1), 0);

    return NextResponse.json({
      stand: new Date().toISOString(),
      verteilung: {
        n: trends.length,
        min: p(0),
        p01: p(0.01),
        p10: p(0.1),
        median: p(0.5),
        p90: p(0.9),
        p99: p(0.99),
        max: p(1),
        ueber100Prozent: trends.filter((t) => t > 100).length,
        ueber1000Prozent: trends.filter((t) => t > 1000).length,
        unterMinus50: trends.filter((t) => t < -50).length,
      },
      groessteBeitraege: beitraege.map((b) => ({
        ...b,
        // Wieviel Prozentpunkte des Gesamtindex geht auf DIESE eine Karte?
        anteilAmIndex: gewichtSumme > 0 ? b.beitrag / gewichtSumme : 0,
      })),
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
