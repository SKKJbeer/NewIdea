import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchTrendingCards, fetchTopValueCards } from '@/lib/pokemon-api';
import { recordPriceSnapshots } from '@/lib/price-history';
import { isSupabaseConfigured } from '@/lib/supabase';
import { generateArticle, getArticleType } from '@/lib/article-generator';
import { generateNextGuide } from '@/lib/guide-generator';
import { getHomepageCards } from '@/lib/homepage-data';
import { computePmi, validateMarketData } from '@/lib/market-metrics';
import { saveMarketIndex } from '@/lib/market-index-store';
import { getMarketBasis } from '@/lib/market-basis';
import { warmSearchCache } from '@/lib/search-cache';

// Guide-Generierung: dienstags + freitags — versetzt zu den Artikel-Tagen (So/Do),
// damit über die Woche verteilt frischer Content erscheint.
const GUIDE_DAYS = new Set([2, 5]);

// Called daily at 08:00 to pre-warm today's article so first visitors don't wait
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  const results: Record<string, unknown> = { date: today };

  // Echte Tagespreise erfassen, damit über die Zeit ein echter Verlauf entsteht.
  if (isSupabaseConfigured()) {
    try {
      const [topValue, trending] = await Promise.all([
        fetchTopValueCards(40),
        fetchTrendingCards(40),
      ]);
      const byId = new Map<string, (typeof topValue)[number]>();
      for (const c of [...topValue, ...trending]) byId.set(c.id, c);
      const saved = await recordPriceSnapshots([...byId.values()]);
      results.priceSnapshots = saved;
      console.log(`✅ ${saved} Preis-Schnappschüsse gespeichert (${today})`);
    } catch (err) {
      results.priceSnapshotError = String(err);
      console.error('Failed to record price snapshots:', err);
    }

    // INDEXSTAND DES TAGES FESTHALTEN.
    //
    // Die Startseite und die Index-Schnittstelle schreiben ihn ebenfalls, aber
    // beide nur, wenn sie tatsächlich ausgeführt werden — aus dem
    // Zwischenspeicher ausgelieferte Seiten schreiben nichts. Dieser Cron läuft
    // garantiert einmal am Tag und ist damit die verlässliche Untergrenze.
    try {
      const basis = await getMarketBasis();
      const index = computePmi(validateMarketData(basis.karten).clean);
      results.marketIndexQuelle = basis.quelle;
      if (index.sufficient) {
        const fehler = await saveMarketIndex({
          value: index.value,
          cardCount: index.cardCount,
          setCount: index.setCount,
          windowDays: index.windowDays,
        });
        results.marketIndex = fehler ? `Fehler: ${fehler}` : index.value;
      } else {
        results.marketIndex = `zu wenig Daten (${index.cardCount}/${index.minCards})`;
      }
    } catch (err) {
      results.marketIndexError = err instanceof Error ? err.message : 'unbekannt';
      console.error('Indexstand nicht gespeichert:', err);
    }

    // SUCHE VORWÄRMEN.
    //
    // Der erste Aufruf eines Suchbegriffs kostet gemessen 6 bis 13 Sekunden,
    // jeder weitere 0,3. Diesen Preis zahlt sonst der Besucher, der zuerst
    // kommt — hier zahlt ihn der Cron stellvertretend.
    //
    // Die Begriffe kommen aus den Kartennamen der aktuellen Marktstichprobe,
    // nicht aus einer Liste im Code: Was auf der Startseite steht, wird als
    // Nächstes gesucht. Eine fest verdrahtete Liste wäre eine Vermutung und
    // würde mit jedem neuen Set veralten.
    //
    // Wirkt eine Stunde (die Frist des Zwischenspeichers). Der Cron kann das
    // nicht den ganzen Tag halten — er nimmt der ersten Stunde nach dem
    // Datenabgleich die Spitze, mehr nicht. Das ehrlich zu benennen ist besser,
    // als eine Dauerwirkung zu behaupten.
    try {
      const stichprobe = await getHomepageCards(60);
      const namen = [...new Set(stichprobe.map((c) => c.name).filter(Boolean))].slice(0, 20);
      const { warm, fehler } = await warmSearchCache(namen);
      results.suchVorwaermung = `${warm} von ${namen.length} Begriffen (${fehler} ohne Treffer)`;
    } catch (err) {
      results.suchVorwaermungFehler = err instanceof Error ? err.message : 'unbekannt';
    }

    // FLÄCHENDECKENDE ERFASSUNG ANSTOSSEN.
    //
    // Die Zeilen darüber decken rund 80 Karten ab — die wichtigsten, sofort.
    // Sie bleiben als schnelle Absicherung stehen. Den Rest der ~20.500 Karten
    // übernimmt der Durchlauf, der sich selbst weiterreicht, bis der Tag fertig
    // ist. Er läuft absichtlich NEBENHER: Ein Fehler dort darf den Artikel
    // dieses Crons nicht mitreißen.
    // Eigene Adresse statt NEXT_PUBLIC_SITE_URL — dort steht die künftige
    // Domain, die noch nicht verbunden ist (siehe price-sweep/route.ts).
    const basis = new URL(request.url).origin;
    try {
      const antwort = await fetch(`${basis}/api/cron/price-sweep?chain=0`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
        signal: AbortSignal.timeout(3000),
      });
      results.priceSweepStarted = antwort.ok;
      if (!antwort.ok) results.priceSweepError = `HTTP ${antwort.status}`;
    } catch (err) {
      // Der Anstoß kann in ein Zeitlimit laufen, während der Durchlauf längst
      // arbeitet — deshalb ist das eine Notiz, kein Fehlschlag.
      results.priceSweepStarted = 'angestoßen (Antwort nicht abgewartet)';
      console.warn('Preis-Durchlauf: Anstoß ohne Bestätigung:', err);
    }
  } else {
    results.priceSnapshots = 'skipped (Supabase nicht konfiguriert)';
  }

  // dayOfWeek konsistent aus `today` ableiten (gleiche Basis wie getArticleType),
  // damit Publish-Day-Check und Artikeltyp nie auseinanderlaufen.
  const type = getArticleType(today);
  if (type) {
    try {
      // replaceFallback: Hat ein früherer Versuch heute nur den Evergreen-Fallback
      // gespeichert, ersetzt der Cron ihn durch einen echten, datenbasierten Artikel.
      const article = await generateArticle(type, today, { replaceFallback: true });
      results.articleGenerated = true;
      results.articleTitle = article.title;
      results.articleIsFallback = article.isStatic === true;
      console.log(`✅ Article generated (${type}): ${article.title}`);
      // WICHTIG: auch die Detailseite revalidieren, sonst bleibt eine evtl. gecachte
      // "noch nicht verfügbar"-Version bis zum nächsten ISR-Intervall (24h) stehen.
      revalidatePath(`/artikel/${today}`);
    } catch (err) {
      results.articleError = 'generation_failed';
      console.error('Failed to generate article:', err);
    }
  } else {
    const dayOfWeek = new Date(today + 'T12:00:00').getDay();
    results.articleGenerated = false;
    results.articleSkipped = `Kein Publish-Day (Wochentag ${dayOfWeek}) — nur Sonntag (0) und Donnerstag (4)`;
  }

  // Guide-Pipeline: an Guide-Tagen den nächsten Evergreen-Guide aus der
  // Themen-Warteschlange generieren (Qualitäts-Gate im Generator).
  const dow = new Date(today + 'T12:00:00').getDay();
  if (GUIDE_DAYS.has(dow)) {
    const guideResult = await generateNextGuide();
    results.guide = guideResult.status;
    results.guideSlug = guideResult.slug ?? null;
    // Ursache immer mitgeben — ein stiller Fehlschlag hat die Pipeline schon
    // einmal über einen Monat unbemerkt lahmgelegt.
    if (guideResult.error) results.guideError = guideResult.error;
    if (guideResult.violations?.length) {
      results.guideViolations = guideResult.violations.slice(0, 5);
    }
    if (guideResult.status === 'created' && guideResult.slug) {
      results.guideTitle = guideResult.title;
      revalidatePath('/guides');
      revalidatePath(`/guides/${guideResult.slug}`);
      console.log(`✅ Guide generiert: ${guideResult.title}`);
    } else if (guideResult.status === 'rejected_quality') {
      console.error(`⛔ Guide ${guideResult.slug} vom Qualitäts-Gate abgelehnt — nächster Versuch am nächsten Guide-Tag`);
    } else if (guideResult.status === 'failed') {
      console.error(`⛔ Guide ${guideResult.slug} fehlgeschlagen: ${guideResult.error}`);
    }
  }

  // Revalidate the listing page so it shows today's article fresh
  revalidatePath('/artikel');
  results.listingRevalidated = true;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
