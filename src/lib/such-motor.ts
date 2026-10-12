// SUCHMOTOR — rein, ohne Netz, getestet (such-motor.test.ts).
//
// Nutzer-Auftrag (12.10.2026): „aktuell ist es schwierig Karten zu finden, weil
// man den ganz genauen Namen eingeben muss … optimiere das für die bestmögliche
// User Experience."
//
// GEMESSEN an der Produktion vor dem Umbau (12.10.2026), Vorschläge leer bei:
//   „glurk", „charizrd", „umbreon vmx"        — Tippfehler
//   „glurak 151", „charizard base"             — Name + Set
//   „Glurak 4/102"                             — Name + Nummer
//   „Pokeball", „Supertrank", „Professor Forschung", „hooh", „Farfetchd"
// Ursache: Die Datenbank-Suche war EIN Muster `%wort1%wort2%` über den Namen —
// jedes Wort in Reihenfolge im Namen, kein Set, keine Nummer, keine Toleranz.
//
// Hier: Jedes Suchwort muss IRGENDWO passen — Name (englisch oder deutsch),
// Set (englisch oder deutsch, Set-Code), Nummer oder Seltenheit —, in beliebiger
// Reihenfolge. Tippfehler werden über die Editierdistanz zu ECHTEN Wörtern aus
// den Kartennamen korrigiert (kein Raten: es wird nur auf Wörter korrigiert, die
// es im Bestand gibt, und der Hinweis sagt, wonach tatsächlich gesucht wurde).

export interface SuchKarte {
  id: string;
  name: string;
  /** Deutsche Namen (Kartenindex, TCGdex) — ohne den englischen. */
  de: string[];
  set: string;
  setDe: string | null;
  setCode: string;
  nummer: string | null;
  /** Gedruckte Gesamtzahl des Sets („4/102" → 102), falls bekannt. */
  gesamt?: number | null;
  seltenheit: string | null;
  preis: number;
}

export interface SuchHinweis {
  /** Tippfehler, die auf ein Wort aus dem Bestand korrigiert wurden. */
  korrigiert: Array<{ von: string; zu: string }>;
  /** Wörter, ohne die gesucht wurde, weil sonst nichts gepasst hätte. */
  ignoriert: string[];
}

export interface SuchErgebnis {
  ids: string[];
  hinweis: SuchHinweis | null;
}

/** Klein, ohne Akzente, ß → ss, Apostrophe weg, ♀/♂ als eigene Wörter. */
export function normal(t: string): string {
  return t
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/♀/g, ' f ')
    .replace(/♂/g, ' m ')
    .replace(/['’`´]/g, '');
}

export function woerter(t: string): string[] {
  return normal(t).split(/[^a-z0-9]+/).filter(Boolean);
}

/** Nummern vergleichbar machen: „004" ≡ „4", „TG05" ≡ „tg5". */
export function nummerForm(n: string): string {
  const m = /^([a-z]*)0*(\d+)([a-z]*)$/.exec(n.toLowerCase());
  return m ? `${m[1]}${m[2]}${m[3]}` : n.toLowerCase();
}

/** Wörter, die bei Suchen oft mitgetippt werden, aber nichts eingrenzen („glurak karte wert"). */
const FUELLWOERTER = new Set(['karte', 'karten', 'card', 'cards', 'pokemon', 'tcg', 'preis', 'preise', 'wert', 'kaufen', 'price', 'value']);
/** Werden nur weggelassen, wenn sie nichts treffen („base set charizard": Set heißt „Base"). */
const WEICHE_FUELLWOERTER = new Set(['set', 'serie', 'edition', 'de', 'deutsch', 'englisch', 'english']);

/**
 * Seltenheits-Schlüsselwörter → Prüfung gegen die Seltenheit aus der Quelle.
 * NUR, was die Seltenheitsangabe selbst belegt. „gold" fehlt bewusst: Ob eine
 * Karte golden ist, steht in keiner Seltenheitsangabe — das wäre geraten.
 */
const SELTENHEIT: Record<string, (s: string) => boolean> = {
  sir: (s) => s === 'special illustration rare',
  ir: (s) => s === 'illustration rare',
  secret: (s) => s.includes('secret'),
  hyper: (s) => s.includes('hyper'),
  rainbow: (s) => s.includes('rainbow'),
  shiny: (s) => s.includes('shiny'),
  promo: (s) => s.includes('promo'),
  holo: (s) => s.includes('holo'),
  amazing: (s) => s.includes('amazing'),
  radiant: (s) => s.includes('radiant'),
  ace: (s) => s.includes('ace spec'),
};

/** Optimal-String-Alignment-Distanz (Vertauschung zählt 1), mit Abbruch über `max`. */
export function distanz(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = a.length, m = b.length;
  let vorvor = new Array<number>(m + 1).fill(0);
  let vor = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const akt = new Array<number>(m + 1);
    akt[0] = i;
    let zeileMin = akt[0];
    for (let j = 1; j <= m; j++) {
      const k = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(vor[j] + 1, akt[j - 1] + 1, vor[j - 1] + k);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, vorvor[j - 2] + 1);
      akt[j] = v;
      if (v < zeileMin) zeileMin = v;
    }
    if (zeileMin > max) return max + 1;
    vorvor = vor;
    vor = akt;
  }
  return vor[m];
}

type Art = 'name' | 'set' | 'nummer' | 'seltenheit';
interface Treffer { punkte: number; art: Art }

function hinzu(map: Map<string, Set<number>>, schluessel: string, i: number) {
  const s = map.get(schluessel);
  if (s) s.add(i); else map.set(schluessel, new Set([i]));
}

export class SuchMotor {
  readonly karten: SuchKarte[];
  private nameWort = new Map<string, Set<number>>();
  private kompakt = new Map<string, Set<number>>();
  private setWort = new Map<string, Set<number>>();
  private nummer = new Map<string, Set<number>>();
  private nameVokabular: string[];
  private setVokabular: string[];
  /** Je Karte: Namensformen als Wortlisten (englisch + deutsch). */
  private formen: string[][][];

  constructor(karten: SuchKarte[]) {
    this.karten = karten;
    this.formen = karten.map((k, i) => {
      const formen = [k.name, ...k.de].map(woerter).filter((f) => f.length > 0);
      for (const f of formen) {
        for (const w of f) hinzu(this.nameWort, w, i);
        // Zusammengeschrieben: „hooh" ↔ „Ho-Oh", „pokeball" ↔ „Poké Ball", „mrmime".
        if (f.length > 1) hinzu(this.kompakt, f.join(''), i);
        for (let j = 0; j + 1 < f.length; j++) hinzu(this.kompakt, f[j] + f[j + 1], i);
      }
      for (const w of [...woerter(k.set), ...(k.setDe ? woerter(k.setDe) : [])]) hinzu(this.setWort, w, i);
      hinzu(this.setWort, k.setCode.toLowerCase(), i);
      if (k.nummer) hinzu(this.nummer, nummerForm(k.nummer), i);
      return formen;
    });
    this.nameVokabular = [...this.nameWort.keys()];
    this.setVokabular = [...this.setWort.keys()];
  }

  /** Beste Wortkorrektur aus dem Namensbestand — das Wort mit den meisten Karten bei gleicher Distanz. */
  private korrektur(t: string): { wort: string; d: number } | null {
    if (t.length < 3 || /\d/.test(t)) return null;
    const max = t.length >= 7 ? 2 : 1;
    let best: { wort: string; d: number; n: number } | null = null;
    for (const w of this.nameVokabular) {
      if (w.length < 3) continue;
      const d = distanz(t, w, max);
      if (d > max) continue;
      const n = this.nameWort.get(w)!.size;
      if (!best || d < best.d || (d === best.d && n > best.n)) best = { wort: w, d, n };
    }
    return best ? { wort: best.wort, d: best.d } : null;
  }

  /** Treffer eines Suchworts je Karte (bestes Ergebnis über alle Arten). */
  private trefferFuer(t: string, letztes: boolean, nummerToken: string | null, gesamt: number | null = null): { map: Map<number, Treffer>; korrigiert?: string } {
    const map = new Map<number, Treffer>();
    const setze = (ids: Iterable<number> | undefined, punkte: number, art: Art) => {
      if (!ids) return;
      for (const i of ids) {
        const alt = map.get(i);
        if (!alt || alt.punkte < punkte) map.set(i, { punkte, art });
      }
    };

    if (nummerToken) {
      // „4/102": Gesamtzahl muss passen, wo sie bekannt ist (sonst Nr. 4 aus jedem Set).
      const ids = [...(this.nummer.get(nummerForm(nummerToken)) ?? [])];
      const mitGesamt = gesamt ? ids.filter((i) => this.karten[i].gesamt === gesamt) : [];
      setze(mitGesamt.length ? mitGesamt : ids, mitGesamt.length ? 9 : 8, 'nummer');
      return { map };
    }
    const sel = SELTENHEIT[t];
    if (sel) {
      this.karten.forEach((k, i) => { if (k.seltenheit && sel(k.seltenheit.toLowerCase())) setze([i], 6, 'seltenheit'); });
    }

    // Name: genau > zusammengeschrieben > Wortanfang.
    setze(this.nameWort.get(t), 10, 'name');
    setze(this.kompakt.get(t), 9, 'name');
    if (t.length >= 3 || letztes) {
      for (const w of this.nameVokabular) if (w !== t && w.startsWith(t)) setze(this.nameWort.get(w), 7, 'name');
    }
    // Set: Code > Wort > Wortanfang.
    setze(this.setWort.get(t), /\d/.test(t) && /[a-z]/.test(t) ? 8 : 6, 'set');
    if (t.length >= 3) for (const w of this.setVokabular) if (w !== t && w.startsWith(t)) setze(this.setWort.get(w), 4, 'set');
    // Reine Zahl: auch als Kartennummer („glurak 4").
    if (/^\d{1,3}$/.test(t)) setze(this.nummer.get(nummerForm(t)), 7, 'nummer');

    if (map.size > 0) return { map };

    // Nichts gefunden → Tippfehler? Nur auf echte Wörter aus dem Bestand.
    const k = this.korrektur(t);
    if (k) {
      setze(this.nameWort.get(k.wort), k.d === 1 ? 5 : 3, 'name');
      return { map, korrigiert: k.wort };
    }
    if (t.length >= 5) {
      for (const w of this.setVokabular) {
        if (w.length >= 4 && distanz(t, w, 1) <= 1) setze(this.setWort.get(w), 3, 'set');
      }
    }
    return { map };
  }

  suche(eingabe: string, limit = 40): SuchErgebnis {
    // Nummern mit Gesamtzahl („4/102") und „#4" vor dem Zerlegen herausziehen.
    const nummern: Array<{ n: string; gesamt: number | null }> = [];
    let rest = normal(eingabe).replace(/#?\b([a-z]{0,3}\d{1,3}[a-z]?)\s*\/\s*([a-z]{0,3})(\d{1,3})\b/g, (_, n: string, praefix: string, g: string) => {
      nummern.push({ n, gesamt: praefix ? null : Number(g) });
      return ' ';
    });
    rest = rest.replace(/#(\d{1,3})\b/g, (_, n: string) => { nummern.push({ n, gesamt: null }); return ' '; });
    const roh = rest.split(/[^a-z0-9]+/).filter(Boolean).filter((w) => !FUELLWOERTER.has(w));

    const tokens: Array<{ t: string; nummer: string | null; gesamt: number | null; weich: boolean }> = [
      ...roh.map((t) => ({ t, nummer: null, gesamt: null, weich: WEICHE_FUELLWOERTER.has(t) })),
      ...nummern.map((x) => ({ t: x.n, nummer: x.n, gesamt: x.gesamt, weich: false })),
    ];
    if (tokens.length === 0) return { ids: [], hinweis: null };

    const korrigiert: SuchHinweis['korrigiert'] = [];
    const ignoriert: string[] = [];
    let teile = tokens.map((tok, idx) => {
      const r = this.trefferFuer(tok.t, idx === roh.length - 1, tok.nummer, tok.gesamt);
      if (r.korrigiert) korrigiert.push({ von: tok.t, zu: r.korrigiert });
      return { ...tok, map: r.map };
    });

    // Wörter ohne jeden Treffer: weiche still weglassen, andere mit Hinweis.
    const leer = teile.filter((x) => x.map.size === 0);
    for (const x of leer) if (!x.weich) ignoriert.push(x.t);
    teile = teile.filter((x) => x.map.size > 0);
    if (teile.length === 0) return { ids: [], hinweis: ignoriert.length ? { korrigiert, ignoriert } : null };

    let treffer = this.schnitt(teile.map((x) => x.map));
    // Jedes Wort passt einzeln, zusammen aber keins („lugia v alt art") — Schritt
    // für Schritt das Wort weglassen, ohne das die besten Treffer übrig bleiben.
    // Höchstens zwei Wörter, und nie alle: lieber leer als beliebig.
    for (let runde = 0; treffer.size === 0 && teile.length > 1 && runde < 2; runde++) {
      let bestes: { ohne: number; wert: number } | null = null;
      for (let i = 0; i < teile.length; i++) {
        const t = this.schnitt(teile.filter((_, j) => j !== i).map((x) => x.map));
        // Bringt Weglassen allein noch nichts: das SCHWÄCHSTE Wort zuerst (nur
        // Wortanfang/Tippfehler statt ganzes Wort), bei Gleichstand das spätere.
        const wert = t.size > 0 ? 1000 + Math.max(...t.values()) : -this.staerke(teile[i].map) + i * 0.01;
        if (!bestes || wert > bestes.wert) bestes = { ohne: i, wert };
      }
      if (!bestes) break;
      if (!teile[bestes.ohne].weich) ignoriert.push(teile[bestes.ohne].t);
      teile = teile.filter((_, j) => j !== bestes!.ohne);
      treffer = this.schnitt(teile.map((x) => x.map));
    }
    if (treffer.size === 0) return { ids: [], hinweis: null };

    // Bonus: heißt genau so („mew" → „Mew" vor „Mew ex" vor „Mewtwo").
    const suchNamen = teile.filter((x) => !x.nummer).map((x) => x.t);
    const kor = new Map(korrigiert.map((k) => [k.von, k.zu]));
    const gewertet = [...treffer.entries()].map(([i, punkte]) => {
      // Je Namensform: genau getroffene Wörter zählen mehr als bloße Wortanfänge,
      // jedes nicht getroffene Wort kostet etwas.
      let bonus = 0;
      for (const f of this.formen[i]) {
        const genau = f.filter((w) => suchNamen.some((t) => w === t || w === kor.get(t))).length;
        const anfang = f.filter((w) => !suchNamen.some((t) => w === t || w === kor.get(t)) && suchNamen.some((t) => t.length >= 2 && w.startsWith(t))).length;
        const fehlt = f.length - genau - anfang;
        const b = fehlt === 0 ? (anfang === 0 ? 12 : 6) : genau > 0 ? 6 - fehlt : anfang > 0 ? 3 - fehlt : 0;
        bonus = Math.max(bonus, b);
      }
      return { i, wert: punkte + bonus };
    });
    gewertet.sort((a, b) => b.wert - a.wert || this.karten[b.i].preis - this.karten[a.i].preis);

    const hinweis = korrigiert.length || ignoriert.length ? { korrigiert, ignoriert } : null;
    return { ids: gewertet.slice(0, limit).map((g) => this.karten[g.i].id), hinweis };
  }

  /** Wie gut ein Wort überhaupt passt: bestes Einzelergebnis (ganzes Wort 10, Wortanfang 7 …). */
  private staerke(map: Map<number, Treffer>): number {
    let max = 0;
    for (const t of map.values()) if (t.punkte > max) max = t.punkte;
    return max;
  }

  /** Karten, die in ALLEN Treffer-Listen stehen, mit Punktsumme. */
  private schnitt(maps: Array<Map<number, Treffer>>): Map<number, number> {
    const aus = new Map<number, number>();
    if (maps.length === 0) return aus;
    const sortiert = [...maps].sort((a, b) => a.size - b.size);
    for (const [i, t] of sortiert[0]) {
      let summe = t.punkte;
      let alle = true;
      for (let k = 1; k < sortiert.length; k++) {
        const x = sortiert[k].get(i);
        if (!x) { alle = false; break; }
        summe += x.punkte;
      }
      if (alle) aus.set(i, summe);
    }
    return aus;
  }

  /** Sets zu einer Eingabe (englischer oder deutscher Name, Set-Code) — alle Wörter müssen passen. */
  sets(eingabe: string, max = 4): Array<{ setCode: string; set: string; setDe: string | null; hoechsterPreis: number }> {
    const ws = woerter(eingabe).filter((w) => !FUELLWOERTER.has(w) && !WEICHE_FUELLWOERTER.has(w));
    if (ws.length === 0 || ws.join('').length < 3) return [];
    const jeSet = new Map<string, { setCode: string; set: string; setDe: string | null; preis: number; hoechsterPreis: number }>();
    for (const k of this.karten) {
      const e = jeSet.get(k.setCode);
      if (e) { e.preis += k.preis; e.hoechsterPreis = Math.max(e.hoechsterPreis, k.preis); }
      else jeSet.set(k.setCode, { setCode: k.setCode, set: k.set, setDe: k.setDe, preis: k.preis, hoechsterPreis: k.preis });
    }
    const passt = (w: string, setW: string[]) =>
      setW.some((s) => s === w || (w.length >= 3 && s.startsWith(w)) || (w.length >= 5 && distanz(w, s, 1) <= 1));
    return [...jeSet.values()]
      .filter((s) => {
        const setW = [...woerter(s.set), ...(s.setDe ? woerter(s.setDe) : []), s.setCode.toLowerCase()];
        return ws.every((w) => passt(w, setW));
      })
      .sort((a, b) => b.preis - a.preis)
      .slice(0, max)
      .map(({ setCode, set, setDe, hoechsterPreis }) => ({ setCode, set, setDe, hoechsterPreis }));
  }
}

/** Hinweis als Satz für die Oberfläche (deutsch) — null ohne Hinweis. */
export function hinweisText(h: SuchHinweis | null): string | null {
  if (!h) return null;
  const teile: string[] = [];
  if (h.korrigiert.length) teile.push(`Gesucht nach ${h.korrigiert.map((k) => `„${k.zu}“ (statt „${k.von}“)`).join(', ')}`);
  if (h.ignoriert.length) teile.push(`${h.ignoriert.map((w) => `„${w}“`).join(', ')} nicht berücksichtigt — keine Karte passt dazu`);
  return teile.length ? `${teile.join(' · ')}.` : null;
}
