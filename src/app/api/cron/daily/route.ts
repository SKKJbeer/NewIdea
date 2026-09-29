import { NextResponse } from 'next/server';
import { isCronAuthedFromRequest } from '@/lib/studio-auth';
import { revalidatePath } from 'next/cache';
import { fetchTopValueCards } from '@/lib/pokemon-api';
import { aktuelleTrendKarten } from '@/lib/markt-lage';
import { recordPriceSnapshots } from '@/lib/price-history';
import { isSupabaseConfigured } from '@/lib/supabase';
import { generateArticle, getArticleType } from '@/lib/article-generator';
import { meldeAnIndexNow } from '@/lib/indexnow';
import { verdichteAufrufe } from '@/lib/aufrufe';
import { siteUrl, oeffentlicheBasis } from '@/lib/site';
import { kartenTeil } from '@/lib/sitemap-karten';
import { generateNextGuide } from '@/lib/guide-generator';
import { getHomepageCards } from '@/lib/homepage-data';
import { computePmi, validateMarketData } from '@/lib/market-metrics';
import { saveMarketIndex } from '@/lib/market-index-store';
import { getMarketBasis } from '@/lib/market-basis';
import { warmSearchCache } from '@/lib/search-cache';
import { currentWeek, generateAndSaveMarketReport } from '@/lib/market-report-generator';
import { listMarketReportMeta } from '@/lib/market-report-storage';

// Guide-Generierung: dienstags + freitags — versetzt zu den Artikel-Tagen (So/Do),
// damit über die Woche verteilt frischer Content erscheint.
const GUIDE_DAYS = new Set([2, 5]);

// LAUFZEITGRENZE — sie fehlte hier komplett, und das war der Grund fuer einen
// dreitaegigen Stillstand der Preiserfassung.
//
// BEFUND am 05.08.2026: `price_sweep_state` stand seit dem 02.08. still
// (4.369 Minuten), waehrend DERSELBE Cron am 04.08. um 08:19 UTC einen Guide
// erzeugt hat. Der Cron LIEF also — nur der Anstoss der Erfassung kam nie an.
//
// Ohne diesen Wert gilt die Standard-Laufzeit der Plattform. Die Route, die
// hier aufgerufen wird, hat laengst 300 Sekunden; die Stelle, die sie aufruft,
// hatte gar nichts.
export const maxDuration = 300;

// Called daily at 08:00 to pre-warm today's article so first visitors don't wait
export async function GET(request: Request) {
  if (!isCronAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const beginn = Date.now();

  const results: Record<string, unknown> = { date: today };

  // FLÄCHENDECKENDE ERFASSUNG ANSTOSSEN — ALS ERSTES.
  //
  // Sie stand frueher HINTER dem Schnappschuss-Block. Das war die zweite
  // Ursache des Stillstands: Zwei Netzabrufe ueber eine Quelle mit
  // dokumentierten Aussetzern (Stolperstelle 28) koennen die Laufzeit
  // aufbrauchen, bevor diese Zeile ueberhaupt erreicht ist — und dann wird an
  // dem Tag gar nichts erfasst.
  //
  // Der Anstoss kostet fast nichts: ein Abruf, dessen Antwort nicht abgewartet
  // wird. Er gehoert deshalb an den Anfang. Die Route reicht sich danach selbst
  // weiter, bis der Tag fertig ist.
  //
  // Eigene Adresse statt NEXT_PUBLIC_SITE_URL — dort steht die kuenftige
  // Domain, die noch nicht verbunden ist (siehe price-sweep/route.ts).
  if (isSupabaseConfigured()) {
    const basis = oeffentlicheBasis(request);
    try {
      const antwort = await fetch(`${basis}/api/cron/price-sweep?chain=0`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
        signal: AbortSignal.timeout(3000),
      });
      results.priceSweepStarted = antwort.ok;
      if (!antwort.ok) results.priceSweepError = `HTTP ${antwort.status}`;
    } catch (err) {
      // Das eigene kurze Zeitlimit ist der Normalfall: Die Anfrage ist raus,
      // der Durchlauf arbeitet. Alles andere ist ein echter Abriss und muss in
      // der Antwort stehen — sonst sieht ein Stillstand aus wie ein Erfolg.
      const abgebrochen = err instanceof Error && err.name === 'TimeoutError';
      results.priceSweepStarted = abgebrochen ? 'angestoßen (Antwort nicht abgewartet)' : false;
      if (!abgebrochen) {
        results.priceSweepError = err instanceof Error ? err.message : 'unbekannt';
        console.error('Preis-Durchlauf: Anstoß fehlgeschlagen:', err);
      }
    }
  }

  // Echte Tagespreise erfassen, damit über die Zeit ein echter Verlauf entsteht.
  if (isSupabaseConfigured()) {
    try {
      const [topValue, trending] = await Promise.all([
        fetchTopValueCards(40),
        aktuelleTrendKarten(40),
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

  // SELBSTHEILUNG DES WOCHENBERICHTS (seit v6.16.0): Scheitert der Montags-
  // Lauf (Qualitätsschranke, KI-Ausfall), fehlte der Bericht bisher eine ganze
  // Woche. Jetzt versucht es jeder Tageslauf erneut, solange die laufende Woche
  // keinen Bericht hat. Eigener try/catch — darf nichts anderes mitreißen.
  try {
    const soll = currentWeek().weekStart;
    const letzter = (await listMarketReportMeta().catch(() => []))[0]?.weekStart ?? null;
    // Bis zu drei Erzeugungsversuche à ~40 s: nur, wenn die Zeit sicher reicht.
    if (letzter !== soll && Date.now() - beginn > 150_000) {
      results.marktberichtNachgeholt = 'verschoben (Zeitbudget) — nächster Tageslauf';
    } else if (letzter !== soll) {
      const r = await generateAndSaveMarketReport();
      results.marktberichtNachgeholt = r.status;
      if (r.error) results.marktberichtNachholFehler = r.error;
      if (r.status === 'created') {
        revalidatePath('/marktbericht');
        revalidatePath('/marktbericht/archiv');
        revalidatePath('/');
      }
    }
  } catch (err) {
    results.marktberichtNachholFehler = err instanceof Error ? err.message : 'unbekannt';
  }

  // Revalidate the listing page so it shows today's article fresh
  revalidatePath('/artikel');
  results.listingRevalidated = true;

  // INDEXNOW — geaenderte Seiten an Bing & Co. melden. Eigener try/catch:
  // Ein Aussetzer bei der Meldung darf nichts von oben mitreissen
  // (Stolperstelle 24). Gemeldet wird, was sich heute tatsaechlich geaendert
  // hat: Startseite und Uebersichten (Preise), der heutige Artikel bzw. Guide
  // falls entstanden, und die meistgesuchten Karten, deren Preise der
  // Durchlauf gerade aufgefrischt hat.
  try {
    const basis = siteUrl();
    if (basis) {
      const urls = ['/', '/marktbericht', '/artikel', '/sets', '/guides', '/suche'].map((p) => `${basis}${p}`);
      if (results.articleGenerated === true) urls.push(`${basis}/artikel/${today}`);
      if (typeof results.guideSlug === 'string' && results.guide === 'created') {
        urls.push(`${basis}/guides/${results.guideSlug}`);
      }
      const topKarten = await kartenTeil(0);
      urls.push(...topKarten.slice(0, 300).map((k) => `${basis}/karten/${encodeURIComponent(k.id)}`));
      const meldung = await meldeAnIndexNow(urls);
      results.indexNow = meldung.fehler ? `Fehler: ${meldung.fehler}` : `${meldung.gemeldet} Adressen gemeldet`;
    } else {
      results.indexNow = 'uebersprungen (keine Produktionsadresse)';
    }
  } catch (err) {
    results.indexNow = `Fehler: ${err instanceof Error ? err.message : 'unbekannt'}`;
  }

  // REICHWEITE VERDICHTEN — Einzeldateien abgeschlossener Tage zu einer
  // Tagesdatei. Wirft nie; eigener Block trotzdem, damit die Meldung ankommt.
  const verdichtet = await verdichteAufrufe(today);
  results.aufrufeVerdichtet = verdichtet.fehler
    ? `Fehler: ${verdichtet.fehler}`
    : `${verdichtet.dateien} Aufrufe aus ${verdichtet.tage} Tagen verdichtet`;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
