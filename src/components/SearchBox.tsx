'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, ImageOff, X, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatEur } from '@/lib/format';

interface Suggestion {
  id: string;
  name: string;
  nameDe?: string;
  imageUrl?: string;
  price: number;
  set: string;
}

interface SetVorschlag {
  setCode: string;
  setName: string;
  hoechsterPreis: number;
}

interface SearchBoxProps {
  initialQuery?: string;
  autoFocus?: boolean;
  placeholder?: string;
  searchBtn?: string;
}

// WIEVIELE VORSCHLÄGE SICHTBAR SIND — und warum das nicht dasselbe ist wie
// „wieviele geholt werden".
//
// GEMESSEN: Bei „char" lieferte die Route 16 Treffer, und die Liste rendert
// jeden davon. Das Ergebnis war ein Aufklappfeld von 1015 Pixeln Höhe — auf
// einem 900 Pixel hohen Bildschirm also eine Liste, die unten aus dem Bild
// läuft und deren Ende niemand sieht. Genau das ist die „komische Darstellung".
//
// Acht Zeilen sind die Grenze, ab der ein Vorschlagsfeld aufhört, eine
// Abkürzung zu sein, und anfängt, eine Ergebnisliste zu sein — dafür gibt es
// die Suchseite. Geholt werden trotzdem zwanzig: Die Überzähligen kosten nichts
// (eine Antwort, ein Netzweg) und sind das Futter für den Präfix-Filter unten.
const ANZEIGE_MAX = 8;
const ABRUF_MAX = 20;

// WARTEZEIT NACH DEM LETZTEN TASTENDRUCK.
//
// Vorher 320 ms. Gemessen standen die ersten Vorschläge damit nach 1876 ms —
// und ein knappes Fünftel davon war reines Warten, ohne dass irgendetwas
// passierte. 140 ms liegen unter der Schwelle, ab der eine Verzögerung als
// solche wahrgenommen wird, und bündeln trotzdem die Anschläge innerhalb eines
// Wortes. Die Anfragen selbst kosten nichts extra: Sie werden abgebrochen,
// sobald die nächste startet.
const WARTE_MS = 140;

// GETEILTER SPEICHER ÜBER ALLE SUCHFELDER UND SEITENWECHSEL HINWEG.
//
// Auf Modulebene, NICHT in einem `useRef`: Das Suchfeld wird bei jedem
// Seitenwechsel neu aufgebaut (Kopfleiste, Suchseite, Einstiegsseite sind drei
// Instanzen). Läge der Speicher in der Komponente, wäre er nach jedem Klick
// leer — also genau dann, wenn er gebraucht wird.
const SPEICHER = new Map<string, { treffer: Suggestion[]; sets: SetVorschlag[]; zeit: number }>();
const SPEICHER_MAX = 40;

// FRIST — und zwar nicht, um Speicher zu sparen.
//
// In der Liste stehen PREISE. Der serverseitige Zwischenspeicher hält eine
// Stunde, weil die Kartenseite stündlich neu erzeugt wird — beide Seiten
// derselben Karte sollen nie widersprüchliche Zahlen zeigen. Ein Speicher im
// Browser, der über diese Grenze hinaus gilt, würde genau diesen Widerspruch
// wieder einführen: Wer die Seite lange offen hat, sähe im Vorschlagsfeld
// einen anderen Preis als auf der Karte. Fünf Minuten sind kurz genug dafür
// und lang genug, um eine Suchsitzung abzudecken.
const FRIST_MS = 5 * 60 * 1000;

function ausSpeicherRoh(q: string): { treffer: Suggestion[]; sets: SetVorschlag[] } | undefined {
  const e = SPEICHER.get(q);
  if (!e) return undefined;
  if (Date.now() - e.zeit > FRIST_MS) {
    SPEICHER.delete(q);
    return undefined;
  }
  return e;
}

function merken(q: string, treffer: Suggestion[], sets: SetVorschlag[]) {
  SPEICHER.delete(q);
  SPEICHER.set(q, { treffer, sets, zeit: Date.now() });
  // Ältester Eintrag zuerst raus — `Map` merkt sich die Einfügereihenfolge.
  while (SPEICHER.size > SPEICHER_MAX) {
    const aeltester = SPEICHER.keys().next().value;
    if (aeltester === undefined) break;
    SPEICHER.delete(aeltester);
  }
}

function passt(s: Suggestion, q: string): boolean {
  return s.name.toLowerCase().includes(q) || (s.nameDe?.toLowerCase().includes(q) ?? false);
}

/**
 * Sofort-Antwort aus dem Speicher — ohne Netzweg.
 *
 * Zwei Fälle: Der Begriff wurde schon einmal gesucht (Rückschritt, zweiter
 * Besuch), oder ein KÜRZERER Begriff wurde gesucht und der neue ist eine
 * Verlängerung davon. Wer „char" getippt hat und „chari" ergänzt, bekommt die
 * Verfeinerung damit ohne einen einzigen Netzaufruf.
 *
 * Das ist keine erfundene Vorschau: Es sind dieselben Karten mit denselben
 * Preisen aus derselben Antwort. Der echte Abruf läuft parallel weiter und
 * ersetzt die Liste, sobald er da ist — die Speicher-Antwort kann nur zu
 * WENIG zeigen (die kurze Liste war abgeschnitten), nie etwas Falsches.
 */
function ausSpeicher(q: string): { treffer: Suggestion[]; sets: SetVorschlag[] } | null {
  const genau = ausSpeicherRoh(q);
  if (genau) return genau;

  for (let i = q.length - 1; i >= 2; i--) {
    const kurz = ausSpeicherRoh(q.slice(0, i));
    if (!kurz) continue;
    const passend = kurz.treffer.filter((s) => passt(s, q));
    // Set-Namen aus dem kürzeren Begriff gelten nur weiter, wenn sie den
    // längeren auch enthalten — sonst stünde „Black Bolt" noch über
    // „black boltx".
    const passendeSets = kurz.sets.filter((s) => s.setName.toLowerCase().includes(q));
    // Kein Treffer im Präfix heißt NICHT „es gibt keine" — die kurze Liste war
    // bei zwanzig Einträgen abgeschnitten. Also weitersuchen statt behaupten.
    if (passend.length > 0 || passendeSets.length > 0) {
      return { treffer: passend, sets: passendeSets };
    }
  }
  return null;
}

export function SearchBox({
  initialQuery = '',
  autoFocus = false,
  placeholder = 'Pokémon-Karte suchen, z.B. Charizard …',
  searchBtn = 'Suchen',
}: SearchBoxProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sets, setSets] = useState<SetVorschlag[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [open, setOpen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abbruchRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listeRef = useRef<HTMLUListElement>(null);

  const sichtbar = suggestions.slice(0, ANZEIGE_MAX);

  // Aufklappfeld schließen, wenn daneben geklickt wird
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ABRUF DER VORSCHLÄGE.
  //
  // Der Abbruch (`AbortController`) ist hier nicht nur eine Sparmaßnahme,
  // sondern eine Richtigkeits-Frage: Ohne ihn konnte eine langsame frühere
  // Antwort eine neuere überschreiben — der Besucher tippt „charizard" und
  // sieht die Treffer zu „chari", weil die zuerst gestartete Anfrage zuletzt
  // ankam. Zusätzlich prüft die Auswertung den Begriff gegen den aktuellen
  // Stand, falls eine Antwort den Abbruch überholt.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim().toLowerCase();

    if (q.length < 2) {
      abbruchRef.current?.abort();
      setSuggestions([]);
      setSets([]);
      setLoadingSuggestions(false);
      setOpen(false);
      setAktiv(-1);
      return;
    }

    // Erst der Speicher — das ist der Unterschied zwischen „sofort" und
    // „nach einer Sekunde".
    const sofort = ausSpeicher(q);
    if (sofort) {
      setSuggestions(sofort.treffer);
      setSets(sofort.sets);
      setOpen(sofort.treffer.length > 0 || sofort.sets.length > 0);
      setAktiv(-1);
    }
    // Ein exakter, noch gültiger Treffer im Speicher ist die vollständige
    // Antwort — der Netzweg würde dasselbe liefern.
    if (ausSpeicherRoh(q)) {
      setLoadingSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abbruchRef.current?.abort();
      const controller = new AbortController();
      abbruchRef.current = controller;
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(q)}&n=${ABRUF_MAX}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(String(res.status));
        const roh = await res.json();
        if (controller.signal.aborted) return;
        // BEIDE FORMEN VERTRAGEN. Die Route gab bis v5.6.2 eine nackte Liste
        // zurück und liefert jetzt `{ cards, sets }`. Zwischen Auslieferung und
        // Ablauf des Zwischenspeichers (fünf Minuten) beantwortet das Netz
        // beide Formen — ein Client, der nur die neue kennt, zeigt in dieser
        // Zeit gar nichts.
        const data: Suggestion[] = Array.isArray(roh) ? roh : (roh?.cards ?? []);
        const gefundeneSets: SetVorschlag[] = Array.isArray(roh) ? [] : (roh?.sets ?? []);
        merken(q, data, gefundeneSets);
        setSuggestions(data);
        setSets(gefundeneSets);
        setOpen(data.length > 0 || gefundeneSets.length > 0);
        setAktiv(-1);
      } catch (err) {
        // catch erlaubt: Ein abgebrochener Abruf ist der Normalfall beim
        // Weitertippen und darf nichts zurücksetzen. Fällt der Abruf echt aus,
        // bleibt stehen, was schon da ist — die Eingabetaste führt weiterhin
        // zur vollständigen Suchseite.
        if ((err as Error)?.name === 'AbortError') return;
        console.warn('[suche] Vorschläge nicht abrufbar:', err);
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    }, WARTE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const zurSuche = useCallback(() => {
    const q = value.trim();
    if (q.length < 2) return;
    setOpen(false);
    router.push(`/suche?q=${encodeURIComponent(q)}`);
  }, [value, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Ist eine Zeile mit den Pfeiltasten ausgewählt, meint die Eingabetaste
    // diese Karte — nicht die Ergebnisliste.
    if (open && aktiv >= 0 && sichtbar[aktiv]) {
      setOpen(false);
      router.push(`/karten/${sichtbar[aktiv].id}`);
      return;
    }
    zurSuche();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      setAktiv(-1);
      return;
    }
    if (!open || sichtbar.length === 0) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const richtung = e.key === 'ArrowDown' ? 1 : -1;
      const naechster = (aktiv + richtung + sichtbar.length + 1) % (sichtbar.length + 1);
      // Der Index `sichtbar.length` ist die Zeile „Alle Ergebnisse" — deshalb
      // eins mehr im Ring. `-1` gibt es nach dem Öffnen, danach nicht mehr.
      setAktiv(naechster === sichtbar.length ? -1 : naechster);
      const el = listeRef.current?.children[naechster] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={submit} className="relative">
        {loadingSuggestions ? (
          <Loader2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400 animate-spin pointer-events-none" />
        ) : (
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        )}
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => (suggestions.length > 0 || sets.length > 0) && setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Pokémon-Karte suchen"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="suche-vorschlaege"
          aria-activedescendant={aktiv >= 0 ? `suche-vorschlag-${aktiv}` : undefined}
          className="w-full appearance-none rounded-full border border-[#2a2a3a] bg-[#13131e] py-3 pl-11 pr-28 text-sm text-slate-200 shadow-sm placeholder:text-slate-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />
        {/* EIGENES LEEREN-ZEICHEN statt des eingebauten.
            `type="search"` zeichnet in Safari und Chrome ein graues Kreuz in
            einem Kreis, in Firefox gar nichts — auf dem Mac sass es dadurch als
            fremder heller Fleck direkt neben der violetten Schaltflaeche. Das
            eingebaute ist oben abgeschaltet; dieses hier gehoert zur Gestaltung
            und sieht ueberall gleich aus. */}
        {value.length > 0 && (
          <button
            type="button"
            aria-label="Suche leeren"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setValue('');
              setOpen(false);
              setAktiv(-1);
            }}
            className="absolute right-[5.5rem] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-700"
        >
          {searchBtn}
        </button>
      </form>

      {open && (sichtbar.length > 0 || sets.length > 0) && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#13131e] shadow-xl">
          {/* SETS ZUERST, und ausserhalb des Rollbereichs.

              Wer einen Set-Namen tippt, meint das Set — nicht die dreissig
              Karten daraus, die zufaellig denselben Namen im Set-Feld tragen.
              Stuende es unten in der Liste, muesste man dafuer scrollen.

              Es ist bewusst NICHT Teil der Pfeiltasten-Auswahl: Die fuehrt
              durch Karten, und ein Eintrag anderer Art mittendrin macht die
              Reihenfolge unvorhersehbar. Ein Klick genuegt hier. */}
          {sets.length > 0 && (
            <div className="border-b border-[#1e1e30] bg-white/[0.02]">
              {sets.map((s) => (
                <Link
                  key={s.setCode}
                  href={`/sets/${s.setCode}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#1a1a28]"
                >
                  <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-violet-500/10 text-violet-400">
                    <Layers size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-200">{s.setName}</p>
                    <p className="truncate text-xs text-slate-500">Alle Karten dieses Sets</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                    Set
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Die Höhe ist gedeckelt, NICHT die Liste allein: Der Weg zur
              vollständigen Suche steht unter dem Rollbereich und bleibt damit
              immer sichtbar — auch wenn oben gescrollt wird. */}
          <ul
            id="suche-vorschlaege"
            ref={listeRef}
            role="listbox"
            className="max-h-[min(58vh,22rem)] overflow-y-auto overscroll-contain"
          >
            {sichtbar.map((s, i) => (
              <li key={s.id} id={`suche-vorschlag-${i}`} role="option" aria-selected={i === aktiv}>
                <Link
                  href={`/karten/${s.id}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setAktiv(i)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    i === aktiv
                      ? // Die ausgewaehlte Zeile braucht mehr als den Mauszeiger-Ton:
                        // Bei Tastaturbedienung gibt es keinen Zeiger, der zeigt,
                        // wo man ist. Der violette Balken links ist das Einzige,
                        // was die Auswahl auf einen Blick sichtbar macht.
                        'bg-[#1e1e2e] shadow-[inset_2px_0_0_0_#8b5cf6]'
                      : 'hover:bg-[#1a1a28]'
                  }`}
                >
                  <div className="relative flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[#1a1a28]">
                    {s.imageUrl ? (
                      <Image src={s.imageUrl} alt={s.name} fill sizes="32px" className="object-contain" />
                    ) : (
                      <ImageOff size={14} className="text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-200">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.nameDe && s.nameDe.toLowerCase() !== s.name.toLowerCase() ? s.nameDe : s.set}
                    </p>
                  </div>
                  {s.price > 0 && (
                    <span className="shrink-0 text-sm font-bold text-slate-300 tabular-nums">
                      {formatEur(s.price)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-[#1e1e30] px-4 py-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={zurSuche}
              className="min-h-[36px] text-xs font-semibold text-violet-400 hover:text-violet-300"
            >
              Alle Ergebnisse für „{value.trim()}" anzeigen →
            </button>
            {suggestions.length > ANZEIGE_MAX && (
              <span className="hidden shrink-0 text-[10px] text-slate-600 tabular-nums sm:block">
                {suggestions.length - ANZEIGE_MAX} weitere
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
