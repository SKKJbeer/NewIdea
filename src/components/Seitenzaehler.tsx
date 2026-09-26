'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// MELDET EINEN AUFRUF. Ein Baustein ohne Darstellung.
//
// ZWEI FALLEN, die hier bewusst umgangen sind:
//
//   1. `document.referrer` AENDERT SICH BEI EINEM SEITENWECHSEL NICHT. Next
//      tauscht nur den Inhalt aus; der Verweis bleibt der des urspruenglichen
//      Ladens stehen. Wuerde er jedes Mal mitgeschickt, zaehlte ein einziger
//      Besuch mit fuenf Seitenwechseln fuenfmal „von Google gekommen".
//      Deshalb `einstieg`: nur beim ersten Aufruf je Seitenladen wahr.
//
//   2. IM ENTWICKLUNGSMODUS LAEUFT EIN EFFEKT ZWEIMAL (Strict Mode). Ohne
//      Sperre zaehlte jeder Aufruf dort doppelt — und man merkt es nicht,
//      weil die Zahl ja ploetzlich groesser ist.

export function Seitenzaehler() {
  const pfad = usePathname();
  const parameter = useSearchParams();
  // Modul-uebergreifend reicht nicht — der Baustein bleibt beim Seitenwechsel
  // haengen, also ist eine Referenz genau richtig.
  const schonGemeldet = useRef<string | null>(null);
  const ersterAufruf = useRef(true);

  const abfrage = parameter.toString();

  useEffect(() => {
    const schluessel = `${pfad}?${abfrage}`;
    if (schonGemeldet.current === schluessel) return;
    schonGemeldet.current = schluessel;

    const einstieg = ersterAufruf.current;
    ersterAufruf.current = false;

    const nutzlast = JSON.stringify({
      pfad,
      parameter: abfrage,
      verweis: einstieg ? document.referrer : '',
      einstieg,
      breite: window.innerWidth,
    });

    // `sendBeacon` ueberlebt das Schliessen des Reiters — ein `fetch` wird
    // dabei abgebrochen, und genau der letzte Aufruf einer Sitzung ginge
    // sonst regelmaessig verloren.
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/zaehler', new Blob([nutzlast], { type: 'application/json' }));
        return;
      }
    } catch {
      // catch erlaubt: faellt auf fetch zurueck, kein Grund fuer eine Meldung
    }

    fetch('/api/zaehler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: nutzlast,
      keepalive: true,
    }).catch(() => {
      // catch erlaubt: eine fehlgeschlagene Zaehlung darf den Besuch nicht
      // stoeren, und der Besucher kann daran nichts aendern. Der Ausfall wird
      // im Monitoring sichtbar, nicht in seiner Konsole.
    });
  }, [pfad, abfrage]);

  return null;
}
