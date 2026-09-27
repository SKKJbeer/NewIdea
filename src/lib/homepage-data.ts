import { fetchTopValueCards } from './pokemon-api';
import { wertvollsteAusIndex } from './card-index';
import { loadLatestMarketReport } from './market-report-storage';
import type { PokemonCard } from '@/types';

// Robuste Kartenquelle für die Startseite.
//
// Problem (Stolperstelle 19): Die Startseite ist `○ Static` mit ISR (1h). Wird sie
// generiert (Build ODER ISR-Revalidierung), während die TCG-API langsam/rate-limitiert
// /down ist, liefert fetchTopValueCards() ein leeres Array — und die LEERE Seite wird
// bis zu 1 Stunde (oder bis zum nächsten Deploy) ausgeliefert: keine Trends, keine Mover.
//
// Lösung: Fällt der Live-Abruf leer/aus, greifen wir auf den letzten in Supabase
// gespeicherten Marktbericht zurück (vom wöchentlichen Cron befüllt, enthält echte
// PokemonCard-Objekte mit Bild + Trend). Lieber leicht veraltete echte Daten als eine
// leere Startseite. Sobald der Live-Abruf wieder klappt, cacht ISR wieder frische Daten.
/** Ab so vielen frischen Karten traegt der Index die Listen allein. */
const INDEX_MINDESTENS = 50;

export async function getHomepageCards(limit = 50): Promise<PokemonCard[]> {
  // ZUERST DER FRISCHE KARTENINDEX (seit v6.10.2).
  //
  // Befund 27.09.2026: Index und Marktbreite standen schon auf Preisen vom
  // Vortag, die Listen daneben („Staerkste Bewegungen", Set-Markt) kamen aber
  // weiter live von pokemontcg.io — mit Werten, die Monate alt sind. Dieselbe
  // Startseite zeigte damit zwei Datenstaende nebeneinander.
  try {
    const { karten } = await wertvollsteAusIndex(limit);
    if (karten.length >= Math.min(INDEX_MINDESTENS, limit)) return karten;
  } catch {
    // catch erlaubt: Index nicht erreichbar — Live-Abruf unten
  }

  try {
    const live = await fetchTopValueCards(limit);
    if (live.length > 0) return live;
  } catch {
    // Live-Abruf fehlgeschlagen — Snapshot-Fallback unten
  }

  const report = await loadLatestMarketReport().catch(() => null);
  if (report) {
    // topValue + topGainers vereinen, Duplikate per id entfernen
    const seen = new Set<string>();
    const unique = [...report.topValue, ...report.topGainers].filter((c) =>
      seen.has(c.id) ? false : (seen.add(c.id), true),
    );
    if (unique.length > 0) return unique;
  }

  return [];
}
