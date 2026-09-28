import { notFound } from 'next/navigation';
import { after } from 'next/server';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, ExternalLink, ImageOff } from 'lucide-react';
import { fetchCardById } from '@/lib/pokemon-api';
import { getStoredPriceHistory, recordPriceSnapshot, mergePriceHistory } from '@/lib/price-history';
import { PriceChartLazy } from '@/components/PriceChartLazy';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { CardLangPrice } from '@/components/CardLangPrice';
import { SprachwahlProvider, CmAufschluesselung, NurEnDe } from '@/components/Sprachwahl';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { WatchButton } from '@/components/WatchButton';
import { CardImage } from '@/components/CardImage';
import { ambientFor } from '@/lib/collector';
import type { Metadata } from 'next';
import type { PokemonCard } from '@/types';
import { formatEur, formatPercent } from '@/lib/format';
import { jsonLd } from '@/lib/json-ld';
import { performanceWindows, cardMarketStats, pmiScore } from '@/lib/card-metrics';
import { PerformanceStrip, MarketStatsPanel, PmiScorePanel } from '@/components/CardMetricPanels';
import { Suspense, cache } from 'react';
import { MarketContextSection, MarketContextSkeleton } from '@/components/MarketContextSection';
import { siteUrlOrLocal } from '@/lib/site';
import { frischPreisFuer, mitFrischpreis, mitIndexPreis } from '@/lib/frischpreis-karte';
import { cardsFromIndex } from '@/lib/card-index';
import { sprachpreiseFuerKarte } from '@/lib/sprachpreise';

const SITE_URL = siteUrlOrLocal();

// ISR: Karten-Detailseite pro Karte 1h cachen statt bei jedem Request neu zu rendern.
// Reduziert TCG-API-Last (429-Risiko) und redundante Preis-Snapshots — der `after()`-Hook
// schreibt dann höchstens einmal pro Stunde pro Karte statt bei jedem Aufruf.
//
// generateStaticParams MIT LEERER LISTE — das ist der Schalter fuer den Cache.
//
// Bis v6.8.4 fehlte die Funktion ganz (nach einem Vorfall in v2.12.0, bei dem
// das Vorrendern beim Build 404-Seiten fest einbackte). Ohne sie ist ein
// dynamisches Segment in Next 16 aber DYNAMISCH: `revalidate` wirkt nicht,
// jede Anfrage rendert neu — gemessen 2 bis 6 Sekunden je Kartenaufruf, auch
// beim zweiten und dritten Mal. Eine LEERE Liste backt beim Build nichts ein
// (der alte Vorfall kann nicht wieder auftreten) und macht jede Kartenseite
// beim ersten Aufruf zu einer gecachten Seite.
//
// Ein Datenbank-Aussetzer wirft deshalb, statt eine Fehlerseite zu rendern:
// Eine gerenderte Fehlerseite waere jetzt eine Stunde lang gecacht, ein Wurf
// dagegen nie — beim naechsten Aufruf wird neu versucht (`error.tsx`).
export async function generateStaticParams() {
  return [];
}

export const revalidate = 3600;

// EIN ABRUF PRO ANFRAGE, nicht zwei.
//
// `generateMetadata` und die Seite fragten die Karte jeweils selbst ab.
// `fetchCardById` nutzt axios, nicht `fetch` — Next dedupliziert das also
// NICHT. Jede Kartenseite kostete damit zwei Aufrufe der TCG-API. Seit v6.6.0
// stehen alle ~20.000 Kartenseiten in der Sitemap; wenn Google sie abarbeitet,
// haette das die Last verdoppelt. `cache()` teilt das Ergebnis innerhalb
// derselben Anfrage.
//
// Der frische Preis (TCGdex, Stand Vortag) wird hier EINMAL uebergelegt —
// Metadaten, Seite und Preis-Snapshot sehen dieselbe Zahl.
//
// RUECKFALL AUF DEN EIGENEN KARTENINDEX: pokemontcg.io antwortet messbar oft
// mit HTTP 500 (27.09.2026 direkt nachgemessen, auch nach der Wiederholung
// in `fetchCardById`). Ohne Rueckfall war das jedes Mal eine Fehlerseite.
// Der Index hat Name, Set, Nummer, Bild und Preis — genug fuer die Seite, und
// der frische Preis kommt ohnehin von TCGdex. Nur wenn auch der Index die
// Karte nicht kennt, wird geworfen.
//
// PARALLEL STATT NACHEINANDER (v6.12.3). Gemessen 28.09.2026 an zwölf
// Alpollo-Karten beim ersten Aufruf: 0,8 bis 11 s. pokemontcg.io antwortete bei
// jeder zweiten Karte mit 502; `fetchCardById` wiederholte bis zum Budget von
// 8 s, erst DANACH kam der Index und erst danach der Tagespreis von TCGdex —
// alles hintereinander. Jetzt: Index (schnell, eigene Datenbank) sofort; mit
// Set und Nummer daraus startet der Tagespreis sofort parallel. Die
// Stammdaten bekommen höchstens `STAMMDATEN_WARTEN_MS` — kennt der Index die
// Karte, baut die Seite sonst aus ihm auf. Nur eine Karte, die der Index
// nicht kennt, wartet das volle Budget ab (und wirft danach → error.tsx).
const KARTE_BUDGET_MS = 8_000;
const STAMMDATEN_WARTEN_MS = 1_500;
const warte = (ms: number) => new Promise<null>((r) => setTimeout(() => r(null), ms));
const karteLaden = cache(async (id: string): Promise<PokemonCard | null> => {
  const rohLaden = fetchCardById(id, { gesamtMs: KARTE_BUDGET_MS });
  rohLaden.catch(() => {}); // Fehler wird unten ausgewertet, nicht verschluckt
  const ausIndex = (await cardsFromIndex([id]).catch(() => null))?.get(id) ?? null;
  const preisLaden = ausIndex
    ? frischPreisFuer(ausIndex)
    : rohLaden.then((r) => (r ? frischPreisFuer(r) : null), () => null);

  let karte: PokemonCard | null;
  if (ausIndex) {
    karte = await Promise.race([rohLaden.catch(() => null), warte(STAMMDATEN_WARTEN_MS)]);
    if (!karte) {
      console.warn(`[karte] ${id}: Stammdaten nicht rechtzeitig, Aufbau aus dem Index`);
      karte = ausIndex;
    }
  } else {
    karte = await rohLaden; // wirft bei Ausfall → error.tsx; null = echte 404
  }
  if (!karte) return null;
  const frisch = await preisLaden;
  if (frisch) return mitFrischpreis(karte, frisch);
  // Live-Abruf gescheitert: frischer Preis aus dem eigenen Index (Stand Vortag).
  return ausIndex ? mitIndexPreis(karte, ausIndex) : karte;
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Metadata darf bei API-Fehlern nie den Seitenaufbau verhindern
  const card = await karteLaden(id).catch(() => null);
  if (!card) return { title: 'Pokémon Karte' };

  const price = card.prices.market || card.prices.holofoil?.market || 0;
  const priceStr = price > 0 ? ` — ${formatEur(price)}` : '';
  const nameStr = card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase()
    ? `${card.name} (${card.nameDe})`
    : card.name;

  // Die Kartennummer gehört in den Titel: Danach wird gesucht („199/165"),
  // und sie unterscheidet gleichnamige Karten verschiedener Sets voneinander.
  const nummer = card.number
    ? ` ${card.number}${card.printedTotal ? `/${card.printedTotal}` : ''}`
    : '';

  return {
    title: `${nameStr}${nummer} Preis & Wert`,
    description: `Aktueller Marktpreis, Preisentwicklung und historische Marktdaten für ${card.name}${nummer} aus ${card.set}. Cardmarket-Preis: ${price > 0 ? formatEur(price) : 'k. A.'}, Seltenheit: ${card.rarity}.`,
    openGraph: {
      siteName: 'CardBeacon',
      title: `${card.name}${nummer} — Preis & Wert`,
      description: `Aktueller Cardmarket-Preis für ${card.name} (${card.set}): ${price > 0 ? formatEur(price) : 'k. A.'}.`,
      images: card.imageUrlHiRes ? [{ url: card.imageUrlHiRes, alt: card.name }] : undefined,
      type: 'article',
    },
    alternates: {
      canonical: `${SITE_URL}/karten/${id}`,
    },
  };
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;

  // API-Fehler (Timeout/Rate-Limit) ≠ "Karte existiert nicht": Fehler-UI statt 404.
  // notFound() nur bei echtem 404 der Datenbank (fetchCardById liefert dann null).
  // Wirft bei Aussetzern — siehe generateStaticParams oben.
  // Verlauf aus der eigenen Datenbank hängt nicht an der Karte — parallel starten.
  const verlaufLaden = getStoredPriceHistory(id, 90);
  verlaufLaden.catch(() => {});
  const card = await karteLaden(id);
  if (!card) notFound();

  const price = card.prices.market || card.prices.holofoil?.market || 0;
  const trend = card.trendPercent || 0;

  after(async () => {
    await recordPriceSnapshot(card);
  });

  // Preis-Historie ehrlich zusammensetzen:
  // - echte Tages-Snapshots aus Supabase (record-on-view, wächst mit der Zeit)
  // - Cardmarket-Ankerpunkte (Ø 30/7/1 Tage + Trend) als reale Referenz
  // Bei Datumskollision gewinnt IMMER der echte Snapshot. Keine erfundenen Punkte.
  // Sprachausgaben (JP/KR) laufen parallel zum Verlauf — wirft nie, hoechstens
  // 2 s (Dateien je Instanz 30 min vorgehalten, sprachpreise.ts).
  const sprachenLaden = sprachpreiseFuerKarte(card, 2_000);
  const stored = await verlaufLaden;
  const sprachen = await sprachenLaden;
  const anchors = card.realData && card.priceHistory ? card.priceHistory : [];
  // Zusammenführung liegt zentral in price-history.ts — dieselbe Funktion nutzt
  // das Portfolio (Code-Regel 10: keine zweite Umsetzung derselben Logik).
  const history = mergePriceHistory(anchors, stored);

  const hasChart = history.length >= 2;
  // 'daily' = mind. 2 echte Tages-Snapshots vorhanden, sonst Cardmarket-Referenz
  const historyKind: 'daily' | 'cardmarket' = stored.length >= 2 ? 'daily' : 'cardmarket';
  const realData = card.realData || stored.length > 0;

  // Trend passend zum Chart: aus echten Snapshots (erster→letzter), sonst Cardmarket (ggü. Ø30).
  // NUR wenn die Snapshots wirklich ~30 Tage umfassen: Die Anzeige nennt den
  // Wert „30 Tage". Aus zwei Tageswerten waere es eine Tagesbewegung unter
  // falscher Ueberschrift.
  let displayTrend = trend;
  const spanneTage = stored.length >= 2
    ? (Date.parse(stored[stored.length - 1].date) - Date.parse(stored[0].date)) / 86_400_000
    : 0;
  if (spanneTage >= 25 && stored[0].price > 0) {
    displayTrend = Math.round(((stored[stored.length - 1].price - stored[0].price) / stored[0].price) * 1000) / 10;
  }

  // Datenstand der Cardmarket-Preise ehrlich anzeigen — die pokemontcg.io-Quelle
  // aktualisiert nicht täglich, manche Karten sind Monate alt.
  let cmDataAge: string | null = null;
  if (card.cmPrices?.updatedAt) {
    const parsed = new Date(card.cmPrices.updatedAt.replace(/\//g, '-'));
    if (!isNaN(parsed.getTime())) {
      const label = parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
      cmDataAge = days > 45
        ? ` Datenstand: ${label} — kann veraltet sein, aktuelle Preise bitte auf Cardmarket prüfen.`
        : ` Datenstand Cardmarket: ${label}.`;
    }
  }

  // Kennzahlen aus der echten Preisreihe. Jede Funktion liefert nichts, wenn
  // die Datenlage nicht reicht — kein Zeitraum ohne Messung.
  const perfWindows = performanceWindows(history, price);
  const marktStats = cardMarketStats(history, price);
  const score2 = pmiScore(history, price, displayTrend);

  // Ambient-Ton aus dem Energietyp der Karte — eine veröffentlichte Eigenschaft,
  // keine Farbanalyse des Bildes. Ohne Typ greift der Markenton.
  const ambient = ambientFor(card.types);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.name,
    description: `Pokémon-Sammelkarte ${card.name} aus dem Set ${card.set}. Seltenheit: ${card.rarity}.`,
    image: card.imageUrlHiRes || card.imageUrl,
    brand: { '@type': 'Brand', name: 'Pokémon TCG' },
    category: 'Pokémon Sammelkarte',
    ...(price > 0 && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        // toFixed erlaubt: JSON-LD, schema.org verlangt den Punkt als Trennzeichen
        price: price.toFixed(2),
        priceValidUntil: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/karten/${id}`,
        seller: { '@type': 'Organization', name: 'Cardmarket' },
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#070810] text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      {/* DIE KARTE FAERBT DEN RAUM.
          Der Hof nimmt den Energietyp der Karte auf — dieselbe Quelle wie der
          Schimmer hinter dem Bild, nur ueber die obere Seitenhaelfte. Damit
          fuehlt sich eine Feuer-Karte anders an als eine Wasser-Karte, ohne
          dass irgendein Bedienelement die Farbe wechselt. */}
      <div className="relative">
        <AmbientBackdrop mode="karte" akzent={ambient.ambient} typ={card.types?.[0]} className="h-[70vh]" />

        {/* DAS ARTWORK DIESER KARTE ALS RAUMFARBE.
            Bis hierher kam die Farbe aus dem Energietyp — richtig, aber grob:
            Jede Feuer-Karte faerbte den Raum gleich, obwohl ein Vulkan-Artwork
            und eine helle Illustration nichts gemeinsam haben. Das Bild selbst
            ist die genauere Quelle, und es kostet nichts: Es steht zwanzig
            Zentimeter weiter oben ohnehin in voller Groesse, der Browser hat
            es also schon.

            ZUR RECHTSLAGE, weil das die Frage ist, an der es haengt: Das ist
            KEIN zusaetzliches Material. Es ist das Bild DIESER Karte auf DEREN
            Seite — derselbe informierende Zusammenhang wie die Preisangabe
            darunter. Was ausgeschlossen bleibt, ist dasselbe Bild als Tapete
            einer beliebigen anderen Seite, losgeloest von der Karte, zu der es
            gehoert.

            WINZIG ANGEFORDERT, NICHT GROSS UND DANN WEICHGEZEICHNET. Der erste
            Entwurf holte das Bild ueber den Zwischenspeicher-Proxy: 160 KB,
            das groesste Asset der ganzen Seite — fuer eine Flaeche, auf der bei
            90 px Unschaerfe nichts mehr zu erkennen ist. Ueber den
            Bildoptimierer mit `sizes="64px"` sind es wenige Kilobyte, und das
            Ergebnis sieht identisch aus. Die ROHE Adresse, nicht die des
            Zwischenspeicher-Proxys: Der Optimierer lehnt Proxy-Adressen mit
            HTTP 400 ab (Stolperstelle 18). */}
        {card.imageUrl && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] overflow-hidden">
            <Image
              src={card.imageUrl}
              alt=""
              fill
              sizes="64px"
              quality={40}
              className="scale-125 object-cover opacity-[0.10] blur-[90px] saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#070810]/30 via-[#070810]/70 to-[#070810]" />
          </div>
        )}

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex min-h-[32px] items-center gap-2 text-violet-400 hover:text-violet-300 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} />Alle Karten
        </Link>

        {/* KURZFASSUNG AM HANDY. Befund 27.09.2026: Im ersten Bildschirm
            standen nur Bild und Kaufknoepfe — Name und Preis, weswegen man
            die Seite oeffnet, kamen erst nach einem ganzen Bildschirm
            Scrollen. Auf breiten Bildschirmen stehen sie ohnehin daneben. */}
        <div className="md:hidden border-t border-[#1c1c24] pt-4 pb-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">{card.set}</p>
          <p className="mt-0.5 text-xl font-black text-white">{card.name}</p>
          {price > 0 && (
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-white">{formatEur(price)}</span>
              <span className="text-[10px] font-semibold text-slate-600">EN/DE</span>
              {displayTrend !== 0 && (
                <span className={`text-sm font-semibold tabular-nums ${displayTrend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent(displayTrend)} (30 T)
                </span>
              )}
            </p>
          )}
        </div>

        <SprachwahlProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DIE KARTE ALS OBJEKT.
              Vorher lag das Bild in einem grauen Kasten mit dem Seitenverhältnis
              3:4 — beides falsch. Eine Sammelkarte misst 63×88 mm, das ist
              schmaler; im 3:4-Rahmen stand links und rechts graue Fläche, und
              der Kasten sah aus wie ein Datei-Vorschaufeld.
              Jetzt: echtes Kartenformat, kein Rahmen, dahinter ein sehr
              schwacher Schimmer im Energieton der Karte (siehe collector.ts).
              Der Folienstreifen läuft nur auf Karten, die auch wirklich
              glänzen. */}
          <div className="group border-t border-[#1c1c24] p-6 flex flex-col items-center">
            <div className="relative w-full max-w-[250px] md:max-w-[340px]">
              <div
                aria-hidden
                className={`absolute -inset-6 rounded-[50%] blur-3xl ${ambient.glow}`}
              />
              {card.imageUrlHiRes || card.imageUrl ? (
                <div
                  className={`lift relative aspect-[63/88] w-full overflow-hidden rounded-xl ring-1 ${ambient.ring} foil`}
                >
                  <CardImage
                    src={card.imageUrlHiRes || card.imageUrl || ''}
                    alt={`${card.name} Pokémon Karte`}
                    sizes="(max-width: 768px) 80vw, 340px"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="relative flex aspect-[63/88] items-center justify-center rounded-xl bg-[#0e0e13] text-slate-700">
                  <ImageOff size={48} />
                </div>
              )}
            </div>
            <div className="mt-4 w-full space-y-3">
              {/* Primäre Funktion: Karte merken */}
              <WatchButton
                cardId={card.id}
                cardName={card.name}
                setName={card.set}
                setCode={card.setCode}
                imageUrl={card.imageUrl}
                price={price}
              />

              {/* Sekundär & dezent: Kauf-Links */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2 text-center">Kaufen bei</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2a2a3a] bg-[#1a1a28] hover:border-violet-500/40 hover:bg-[#20202e] text-slate-300 hover:text-white text-xs font-semibold py-2 transition-colors"
                  >
                    <ShoppingCart size={13} /> Cardmarket <ExternalLink size={10} className="opacity-40" />
                  </a>
                  <a
                    href={`https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${card.name} Karte`)}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2a2a3a] bg-[#1a1a28] hover:border-amber-500/40 hover:bg-[#20202e] text-slate-300 hover:text-white text-xs font-semibold py-2 transition-colors"
                  >
                    Amazon <ExternalLink size={10} className="opacity-40" />
                  </a>
                </div>
                <p className="text-[10px] text-slate-700 text-center mt-1.5">* Affiliate-Links</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-t border-[#1c1c24] pt-5">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">{card.set}</p>
              <h1 className="text-2xl font-black text-white">{card.name}</h1>
              {card.nameDe && card.nameDe.toLowerCase() !== card.name.toLowerCase() && (
                <p className="text-sm font-semibold text-violet-400 mt-0.5">🇩🇪 {card.nameDe}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">
                {card.rarity}
                {card.number && (
                  <span className="ml-2 tabular-nums text-slate-700">
                    Nr. {card.number}
                    {card.printedTotal ? `/${card.printedTotal}` : ''}
                  </span>
                )}
              </p>
              <div className="mt-4">
                <CardLangPrice
                  sprachen={sprachen}
                  defaultPrice={price}
                  trendPercent={displayTrend}
                  realData={realData}
                  priceSource={card.priceSource}
                />
              </div>
            </div>

            {/* Aufschluesselung folgt der Sprachwahl (Sprachwahl.tsx). */}
            <CmAufschluesselung
              kartenName={card.name}
              en={card.cmPrices ?? null}
              enStand={cmDataAge}
              sprachen={sprachen}
            />

            {/* MARKTKONTEXT — die eigentliche Produktaussage.
                Steht bewusst VOR den Einzelkennzahlen: Die Frage „ist das viel?"
                beantwortet der Vergleich, nicht die Zahl allein.

                In einer eigenen Ladegrenze, weil der Indexvergleich auf einer
                kalt gestarteten Instanz mehrere Sekunden kostet. Vorher hing die
                GANZE Seite daran — Kartenbild, Preis und Kaufknöpfe warteten auf
                eine Zahl, die ganz unten steht. */}
            <NurEnDe>
            <Suspense fallback={<MarketContextSkeleton />}>
              <MarketContextSection card={card} />
            </Suspense>

            {/* Wertentwicklung über mehrere Zeiträume — nur dort, wo eine
                Messung vorliegt. */}
            <PerformanceStrip windows={perfWindows} />

            <MarketStatsPanel stats={marktStats} />

            {/* Ersetzt den früheren Investment-Score. Der vergab Punkte nach
                Preisstufen („über 100 € = +20") und beschriftete das Ergebnis
                mit „Starkes Investment" bzw. „Vorsicht geboten" — beides
                Handlungsempfehlungen, die auf einer Analyseplattform nichts zu
                suchen haben. */}
            <PmiScorePanel score={score2} />
            </NurEnDe>

            {card.setCode && (
              <div className="border-t border-[#1c1c24] pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4">Aus diesem Booster-Set</p>
                <div className="flex flex-col items-center">
                  <BoosterPackImage
                    setCode={card.setCode}
                    setName={card.set}
                    className="h-48 w-auto max-w-full object-contain drop-shadow-xl"
                  />
                  <p className="text-sm font-semibold text-slate-400 mt-3 text-center leading-snug">{card.set}</p>
                </div>
                <a
                  href={`https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${card.set} Booster`)}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-500 text-[#0a0a0f] rounded-md py-2.5 font-semibold text-sm transition-colors"
                >
                  Booster auf Amazon kaufen <ExternalLink size={13} className="opacity-70" />
                </a>
                <p className="text-xs text-slate-700 text-center mt-1.5">* Affiliate-Link</p>
              </div>
            )}
          </div>
        </div>

        <NurEnDe>
        <div className="border-t border-[#1c1c24] pt-5 mt-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="font-bold text-slate-200">Preis-Historie</h2>
            {hasChart && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                {historyKind === 'daily' ? '✓ Echte Tagespreise' : '✓ Cardmarket-Referenz'}
              </span>
            )}
          </div>
          {hasChart ? (
            <>
              <PriceChartLazy data={history} />
              {historyKind === 'daily' ? (
                <p className="text-xs text-slate-600 mt-3">
                  Täglich erfasste Cardmarket-Preise für diese Karte — der Verlauf wird mit jedem Tag genauer.
                </p>
              ) : (
                <p className="text-xs text-slate-600 mt-3">
                  Echte Cardmarket-Durchschnitte (Ø 30 / 7 / 1 Tage &amp; aktueller Trend). Ab jetzt kommen täglich echte Tagespreise dazu.
                </p>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-2xl font-black text-white">{price > 0 ? formatEur(price) : '—'}</p>
              <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Aktueller Marktpreis. Der Preisverlauf für diese Karte wird ab jetzt täglich aufgebaut und erscheint hier, sobald mehrere Datenpunkte vorliegen.
              </p>
            </div>
          )}
        </div>
        </NurEnDe>
        </SprachwahlProvider>

        <p className="text-xs text-slate-700 text-center mt-6">
          Preise: Cardmarket (EUR), ohne Gewähr. Kein Anlageversprechen.
        </p>
      </div>
      </div>
    </div>
  );
}
