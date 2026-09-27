import { NextResponse, after } from 'next/server';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';
import {
  einordnen,
  pfadBereinigen,
  geraetVonBreite,
  wirdGezaehlt,
  zaehleAufruf,
} from '@/lib/aufrufe';

// DER ZAEHLPUNKT. Nimmt einen Aufruf entgegen und legt ihn verdichtet ab.
//
// WARUM DIE EINORDNUNG HIER LIEGT und nicht im Browser: Der Browser meldet
// nur Rohwerte (Pfad, Verweis, Abfrageteil, Fensterbreite). Waere die
// Zuordnung zu Kanaelen dort, koennte sie jeder beliebig setzen — und eine
// Herkunftsstatistik, die der Aufrufer selbst bestimmt, ist keine Messung.
//
// ES WIRD NICHTS GESPEICHERT, WAS AUF EINE PERSON ZEIGT: kein Kennzeichen,
// keine IP, kein User-Agent. Die IP wird nur fuer die Missbrauchsbremse
// gelesen und bleibt im Arbeitsspeicher dieser Instanz.

export const runtime = 'nodejs';

// 120 Aufrufe je Minute und Adresse. Grosszuegig, weil hinter einer Adresse
// ein ganzes Netz stecken kann (Mobilfunk, Firma) — und eng genug, um eine
// Schleife zu stoppen, die die Tabelle aufblaeht.
const bremse = createRateLimiter({ limit: 120, windowMs: 60_000 });

export async function POST(request: Request) {
  const grenze = bremse(clientIp(request));
  if (!grenze.allowed) {
    // 429 ohne Inhalt: Der Absender ist `sendBeacon` und liest die Antwort
    // ohnehin nicht.
    return new NextResponse(null, {
      status: 429,
      headers: { 'Retry-After': String(grenze.retryAfterSeconds) },
    });
  }

  let koerper: unknown;
  try {
    koerper = await request.json();
  } catch {
    // catch erlaubt: fremder Koerper, unlesbar heisst schlicht „ungueltig"
    return NextResponse.json({ error: 'ungueltig' }, { status: 400 });
  }

  const daten = (koerper ?? {}) as Record<string, unknown>;
  const pfad = pfadBereinigen(daten.pfad);
  if (!pfad) return NextResponse.json({ error: 'ungueltig' }, { status: 400 });

  // Die eigenen Werkzeuge zaehlen nicht mit — sonst verkauft man sich die
  // eigene Arbeit als Publikum. Trotzdem 204: Der Browser soll daraus keinen
  // Fehler in der Konsole machen.
  if (!wirdGezaehlt(pfad)) return new NextResponse(null, { status: 204 });

  const einordnung = einordnen({
    verweis: typeof daten.verweis === 'string' ? daten.verweis.slice(0, 500) : '',
    parameter: typeof daten.parameter === 'string' ? daten.parameter.slice(0, 500) : '',
    // Der eigene Host kommt aus der Anfrage, nicht aus NEXT_PUBLIC_SITE_URL:
    // Die Variable zeigt auf eine nie verbundene Domain, und ein falscher
    // eigener Host wuerde jeden internen Wechsel als fremden Verweis zaehlen.
    eigenerHost: new URL(request.url).hostname,
    einstieg: daten.einstieg === true,
  });

  const eintrag = {
    pfad,
    kanal: einordnung.kanal,
    herkunft: einordnung.herkunft,
    kampagne: einordnung.kampagne,
    geraet: geraetVonBreite(daten.breite),
    tag: new Date().toISOString().slice(0, 10),
  };

  // NACH der Antwort speichern: Der Besucher wartet nicht auf den Speicher.
  after(async () => {
    const ergebnis = await zaehleAufruf(eintrag);
    if (!ergebnis.ok) {
      // Die Ursache gehoert ins Log, nicht in die Antwort (keine internen
      // Details nach aussen) — aber sie darf auch nicht verschwinden.
      console.warn('[Zaehler] nicht gespeichert:', ergebnis.fehler);
    }
  });

  // Immer 204, auch wenn das Speichern scheiterte: Der Browser kann daran
  // nichts aendern, und ein Fehler in der Konsole eines Besuchers hilft
  // niemandem. Sichtbar wird der Ausfall im Monitoring.
  return new NextResponse(null, { status: 204 });
}
