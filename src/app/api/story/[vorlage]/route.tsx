import { getHomepageCards } from '@/lib/homepage-data';
import {
  computePmi,
  computeFearGreed,
  marketBreadth,
  rankSets,
  splitMovers,
  validateMarketData,
  fearGreedLabel,
} from '@/lib/market-metrics';
import { displayPrice } from '@/lib/pokemon-api';
import { getMarketBenchmark } from '@/lib/market-context';
import {
  rendereStory,
  BigMover,
  SetBattle,
  MarketState,
  CardVsMarket,
  STORY_FORMATE,
  type StoryFormat,
} from '@/lib/story-frames';

// BILDER AUS ECHTEN MARKTDATEN
//
// Diese Route erzeugt die Marktgeschichten als PNG — für Instagram, für
// Teilen-Vorschauen, für Beitragsköpfe.
//
// SIE NIMMT KEINEN TEXT ENTGEGEN. Die einzigen Parameter sind die Vorlage und
// das Format; alle Zahlen und Namen stammen aus derselben Marktstichprobe wie
// die Startseite. Das ist keine Bequemlichkeit, sondern die Bedingung dafür,
// dass es diese Route überhaupt geben darf: Eine öffentliche Adresse, die
// beliebigen Text im CardBeacon-Layout setzt, wäre eine Fläche, auf der jeder
// eine Behauptung erzeugen kann, die aussieht wie eine Messung von uns.
//
// Reicht die Datenlage nicht, entsteht KEIN Bild. Ein Marktbild ohne
// belastbaren Index wäre genau die erfundene Kennzahl, die dieses Projekt
// sonst überall vermeidet.

export const revalidate = 3600;

const VORLAGEN = ['big-mover', 'set-battle', 'market-state', 'card-vs-market'] as const;
type Vorlage = (typeof VORLAGEN)[number];

function istVorlage(v: string): v is Vorlage {
  return (VORLAGEN as readonly string[]).includes(v);
}

function istFormat(f: string): f is StoryFormat {
  return f in STORY_FORMATE;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vorlage: string }> },
) {
  const { vorlage } = await params;
  if (!istVorlage(vorlage)) {
    return new Response('unbekannte Vorlage', { status: 404 });
  }

  const roh = new URL(request.url).searchParams.get('format') ?? 'post';
  const format: StoryFormat = istFormat(roh) ? roh : 'post';

  const cards = validateMarketData(await getHomepageCards(250)).clean;
  const berechnet = computePmi(cards);

  // DER INDEXWERT KOMMT AUS DEM GESPEICHERTEN TAGESSTAND, nicht aus dieser
  // Stichprobe.
  //
  // BEFUND beim ersten Rendern: Das Bild zeigte „CBI +28,6 %", während die
  // Startseite −0,2 % auswies. Beide rechneten für sich, mit unterschiedlich
  // vollständigen Stichproben — und ein geteiltes Bild lebt länger als der
  // Moment, in dem es entstand. Ein Beitrag, der einen anderen Marktstand nennt
  // als die verlinkte Seite, beschädigt genau das, wofür dieses Produkt da ist.
  //
  // Der gespeicherte Stand ist dieselbe Zahl, die auch Kartenseiten und Suche
  // verwenden. Fehlt er, greift die eigene Rechnung — dann ist wenigstens
  // nachvollziehbar, woher sie kommt.
  const gespeichert = await getMarketBenchmark().catch(() => null);
  const indexWert = gespeichert?.value ?? (berechnet.sufficient ? berechnet.value : null);
  if (indexWert === null) {
    return new Response('zu wenig Daten für eine Marktaussage', { status: 503 });
  }
  const cbi = {
    value: indexWert,
    cardCount: gespeichert?.cardCount ?? berechnet.cardCount,
    setCount: gespeichert?.setCount ?? berechnet.setCount,
  };

  const datenstand = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const { gainers } = splitMovers(cards, 3);
  const spitze = gainers[0];
  const mover = spitze && {
    name: spitze.nameDe ?? spitze.name,
    set: spitze.set,
    trend: spitze.trendPercent as number,
    preis: displayPrice(spitze),
    gegenMarkt: (spitze.trendPercent as number) - cbi.value,
  };

  let element: React.ReactElement;

  switch (vorlage) {
    case 'big-mover': {
      if (!mover) return new Response('keine gemessene Bewegung', { status: 503 });
      element = <BigMover karte={mover} format={format} datenstand={datenstand} />;
      break;
    }
    case 'set-battle': {
      // Stärkstes gegen schwächstes Set — beide müssen gemessen sein.
      const sets = rankSets(cards, 99).filter(
        (s): s is typeof s & { avgTrend: number } => typeof s.avgTrend === 'number',
      );
      if (sets.length < 2) return new Response('zu wenige gemessene Sets', { status: 503 });
      const sortiert = [...sets].sort((a, b) => b.avgTrend - a.avgTrend);
      element = (
        <SetBattle
          a={{ name: sortiert[0].name, trend: sortiert[0].avgTrend }}
          b={{ name: sortiert[sortiert.length - 1].name, trend: sortiert[sortiert.length - 1].avgTrend }}
          format={format}
          datenstand={datenstand}
        />
      );
      break;
    }
    case 'market-state': {
      const breite = marketBreadth(cards);
      const temperatur = computeFearGreed(cards);
      element = (
        <MarketState
          markt={{
            cbi: cbi.value,
            breite: breite.pct,
            temperatur: temperatur.sufficient ? fearGreedLabel(temperatur.value) : '—',
            karten: cbi.cardCount,
            sets: cbi.setCount,
          }}
          format={format}
          datenstand={datenstand}
        />
      );
      break;
    }
    case 'card-vs-market': {
      if (!mover) return new Response('keine gemessene Bewegung', { status: 503 });
      element = <CardVsMarket karte={mover} cbi={cbi.value} format={format} datenstand={datenstand} />;
      break;
    }
  }

  const png = await rendereStory(element, format);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // Eine Stunde — dieselbe Frist wie die Startseite, aus der die Zahlen
      // stammen. Ein Bild, das länger gilt als seine Quelle, zeigt irgendwann
      // einen Stand, den es auf der Seite nicht mehr gibt.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
