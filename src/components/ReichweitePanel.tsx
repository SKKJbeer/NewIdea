'use client';

import { BarChart3, TriangleAlert, CircleAlert, Search, Share2, Link2, Megaphone, MousePointerClick, ArrowRightLeft } from 'lucide-react';
import { formatCount } from '@/lib/format';

// REICHWEITE — wie viele Aufrufe, und ueber welchen Weg sie kamen.
//
// Gestaltungsentscheidungen, die keine Geschmacksfrage sind:
//
//   - „Aufrufe", nirgends „Besucher". Ohne Kennzeichen im Browser lassen sich
//     Aufrufe nicht zu Personen zusammenfassen. Eine Besucherzahl waere
//     geschaetzt, und geschaetzte Zahlen stehen auf dieser Seite nirgends.
//   - Weg und Herkunft beziehen sich auf EINSTIEGE, nicht auf alle Aufrufe.
//     Ein Seitenwechsel im Browser hat keine Herkunft; zaehlte er mit, stuende
//     „Seitenwechsel innerhalb der Seite" mit ueber der Haelfte an der Spitze
//     und verdraengte genau die Angabe, wegen der man herkommt.
//   - „Direkt" bekommt eine Fussnote. Es heisst nicht „hat die Adresse
//     getippt", sondern „der Browser hat keinen Verweis mitgeschickt" — das
//     trifft auch auf Links aus Apps, Mail-Programmen und PDF-Dateien zu.

export interface ZeileMitAnteil { name: string; aufrufe: number; anteil: number }
export interface TagesZeile { tag: string; aufrufe: number }

export interface AufrufStatistikDaten {
  konfiguriert: boolean;
  fehltAufbau: boolean;
  fehler: string | null;
  tage: number;
  gesamt: number;
  heute: number;
  einstiege: number;
  proTag: TagesZeile[];
  topSeiten: ZeileMitAnteil[];
  kanaele: ZeileMitAnteil[];
  herkuenfte: ZeileMitAnteil[];
  kampagnen: ZeileMitAnteil[];
  geraete: ZeileMitAnteil[];
  abgeschnitten: boolean;
  setupSql: string | null;
}

const KANAL_TEXT: Record<string, { label: string; icon: typeof Search; hinweis?: string }> = {
  suche: { label: 'Suchmaschine', icon: Search },
  sozial: { label: 'Soziale Netze', icon: Share2 },
  verweis: { label: 'Verweis von anderen Seiten', icon: Link2 },
  kampagne: { label: 'Kampagnenlink (utm)', icon: Megaphone },
  direkt: {
    label: 'Ohne Verweis',
    icon: MousePointerClick,
    hinweis: 'Adresse getippt, Lesezeichen — oder ein Link aus einer App, die keinen Verweis mitschickt',
  },
  intern: { label: 'Seitenwechsel innerhalb der Seite', icon: ArrowRightLeft },
};

function Balken({ zeilen, leerText, bezugLabel }: { zeilen: ZeileMitAnteil[]; leerText: string; bezugLabel: string }) {
  if (zeilen.length === 0) {
    return <p className="text-[11px] text-slate-600">{leerText}</p>;
  }
  return (
    <div className="space-y-1.5">
      {zeilen.map((z) => (
        <div key={z.name}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[11px] text-slate-300" title={z.name}>{z.name}</span>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">
              {formatCount(z.aufrufe)}
              <span className="ml-1 text-[10px] font-normal text-slate-600">
                {z.anteil.toLocaleString('de-DE', { maximumFractionDigits: 0 })} %
              </span>
            </span>
          </div>
          <div className="mt-1 h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-violet-500/70" style={{ width: `${Math.max(z.anteil, 1.5)}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-0.5 text-[10px] text-slate-700">Anteil bezogen auf {bezugLabel}</p>
    </div>
  );
}

/** Aufrufe je Tag als waagerechte Spur — bewusst ohne Bibliothek, es sind Balken. */
function Verlauf({ zeilen }: { zeilen: TagesZeile[] }) {
  if (zeilen.length === 0) return null;
  const hoechst = Math.max(...zeilen.map((z) => z.aufrufe), 1);
  // Nur die letzten 30 Tage; darueber wird jeder Balken zum Strich.
  const sichtbar = zeilen.slice(-30);
  return (
    <div>
      <div className="flex h-16 items-end gap-[3px]">
        {sichtbar.map((z) => (
          <div
            key={z.tag}
            className="flex-1 rounded-t-sm bg-violet-500/60"
            style={{ height: `${Math.max((z.aufrufe / hoechst) * 100, 3)}%` }}
            title={`${z.tag}: ${formatCount(z.aufrufe)} Aufrufe`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-700">
        <span>{sichtbar[0]?.tag}</span>
        <span>{sichtbar[sichtbar.length - 1]?.tag}</span>
      </div>
    </div>
  );
}

export function ReichweitePanel({ daten }: { daten: AufrufStatistikDaten | null }) {
  if (!daten) return null;

  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 size={14} className="text-violet-600" />
        <span className="text-sm font-bold text-slate-200">Reichweite (Aufrufe &amp; Herkunft)</span>
      </div>

      {!daten.konfiguriert ? (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
          <TriangleAlert size={11} className="mr-1 inline" />
          Supabase nicht konfiguriert — Aufrufe werden nicht gespeichert.
        </p>
      ) : daten.fehltAufbau ? (
        <div className="space-y-2">
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-400">
            <CircleAlert size={11} className="mr-1 inline" />
            Tabelle oder Zählfunktion fehlt — es wird nichts gezählt. Beides zusammen anlegen:
          </p>
          {daten.setupSql && (
            <pre className="overflow-x-auto whitespace-pre rounded-lg border border-[#2a2a3a] bg-[#0d0d18] p-2 font-mono text-[10px] text-slate-300">{daten.setupSql}</pre>
          )}
        </div>
      ) : (
        <>
          {daten.fehler && (
            <p className="mb-3 break-words rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-400">
              <span className="font-semibold">Ursache:</span> {daten.fehler}
            </p>
          )}

          {daten.abgeschnitten && (
            <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
              <TriangleAlert size={11} className="mr-1 inline" />
              Lesegrenze erreicht — die Zahlen unten sind zu niedrig. Zeitraum verkürzen.
            </p>
          )}

          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Aufrufe heute', wert: daten.heute },
              { label: `Aufrufe (${daten.tage} Tage)`, wert: daten.gesamt },
              { label: 'davon Einstiege', wert: daten.einstiege },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-[#2a2a3a] bg-[#0e0e18] px-3 py-2.5">
                <p className="text-lg font-black tabular-nums text-slate-100">{formatCount(k.wert)}</p>
                <p className="text-[10px] text-slate-600">{k.label}</p>
              </div>
            ))}
          </div>

          {daten.gesamt === 0 ? (
            <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-slate-500">
              Noch keine Aufrufe erfasst. Die Zählung greift ab dem nächsten Seitenaufruf —
              eigene Aufrufe von /studio und /monitoring zählen nicht mit.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#2a2a3a] bg-[#0e0e18] px-3.5 py-3">
                <p className="mb-2 text-[11px] font-semibold text-slate-200">Aufrufe je Tag</p>
                <Verlauf zeilen={daten.proTag} />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-200">Über welchen Weg</p>
                <Balken
                  zeilen={daten.kanaele.map((k) => ({ ...k, name: KANAL_TEXT[k.name]?.label ?? k.name }))}
                  leerText="Noch keine Einstiege von außen."
                  bezugLabel="Einstiege"
                />
                {daten.kanaele.some((k) => k.name === 'direkt') && (
                  <p className="mt-1.5 text-[10px] text-slate-700">{KANAL_TEXT.direkt.hinweis}</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-200">Konkrete Herkunft</p>
                <Balken zeilen={daten.herkuenfte} leerText="Noch keine Einstiege von außen." bezugLabel="Einstiege" />
              </div>

              {daten.kampagnen.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold text-slate-200">Kampagnen (utm_campaign)</p>
                  <Balken zeilen={daten.kampagnen} leerText="" bezugLabel="Einstiege" />
                </div>
              )}

              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-200">Meistaufgerufene Seiten</p>
                <Balken zeilen={daten.topSeiten} leerText="Noch keine Aufrufe." bezugLabel="alle Aufrufe" />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-200">Gerät</p>
                <Balken zeilen={daten.geraete} leerText="" bezugLabel="alle Aufrufe" />
              </div>
            </div>
          )}

          <p className="mt-3 border-t border-[#1e1e30] pt-2 text-[10px] leading-relaxed text-slate-700">
            Gezählt werden Aufrufe, keine Personen: Es wird kein Cookie gesetzt, kein Kennzeichen
            gespeichert und weder IP-Adresse noch Browserkennung abgelegt. Eine Besucherzahl lässt
            sich daraus nicht ableiten und steht deshalb nirgends. Aufrufe ohne JavaScript — die
            meisten Suchmaschinen-Roboter — werden nicht mitgezählt.
          </p>
        </>
      )}
    </div>
  );
}
