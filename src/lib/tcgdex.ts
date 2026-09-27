// TCGDEX — tagesaktuelle Cardmarket-Preise.
//
// BEFUND (27.09.2026): Die bisherige Preisquelle pokemontcg.io liefert
// Cardmarket-Werte mit `updatedAt` zwischen November 2025 und Juli 2026 —
// drei bis zehn Monate alt; die neuesten Sets haben dort gar keine. Der eigene
// Tagesdurchlauf holt also taeglich dieselben alten Zahlen. TCGdex fuehrt
// dieselben Cardmarket-Felder (trend, avg, low, avg1/7/30) in EUR mit Stand
// des Vortags, auch fuer neue Sets, ohne Schluessel.
//
// PREISE GIBT ES NUR JE KARTE (weder Set-Liste noch GraphQL liefern sie).
// Deshalb nicht fuer alle ~20.000 Karten taeglich — das waere unfaire Last
// auf einer freien Schnittstelle —, sondern fuer die wertvollsten einige
// hundert, die Instagram und die Marktbilder praegen.
//
// ZUORDNUNG: pokemontcg.io und TCGdex benennen Sets verschieden (`sv3pt5` vs.
// `sv03.5`). Gemessen: 167 von 176 Sets eindeutig ueber den Namen, die
// uebrigen neun per Hand. Jede Karte wird zusaetzlich ueber den NAMEN
// gegengeprueft — stimmt er nicht, wird der Preis verworfen. Ein fehlender
// Preis ist besser als der Preis einer anderen Karte.

const BASIS = 'https://api.tcgdex.net/v2/en';
const ZEITLIMIT_MS = 12_000;

/** Sets, die sich nicht ueber den Namen finden lassen (gemessen 27.09.2026). */
export const SET_AUSNAHMEN: Readonly<Record<string, string>> = {
  base1: 'base1',
  hgss1: 'hgss1',
  hgss2: 'hgss2',
  hgss3: 'hgss3',
  hgss4: 'hgss4',
  svp: 'svp',
  sve: 'sve',
  fut20: 'fut2020',
  me55c: '30th-c',
};

export interface DexSet {
  id: string;
  name: string;
}

export interface FrischerPreis {
  /** Cardmarket-Preistrend in EUR. */
  trend: number;
  avg30: number | null;
  avg7: number | null;
  avg1: number | null;
  low: number | null;
  avg: number | null;
  /** Stand bei Cardmarket (ISO). */
  updated: string;
  /** Zugeordnete TCGdex-Karten-ID — fuer die Nachvollziehbarkeit. */
  dexId: string;
}

/** Klein, ohne Akzente, nur Buchstaben und Ziffern — fuer Namens- und Set-Vergleiche. */
export function normiere(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export async function ladeDexSets(): Promise<DexSet[]> {
  const res = await fetch(`${BASIS}/sets`, { signal: AbortSignal.timeout(ZEITLIMIT_MS) });
  if (!res.ok) throw new Error(`TCGdex-Sets: HTTP ${res.status}`);
  const daten = (await res.json()) as Array<{ id: string; name: string }>;
  return daten.map((s) => ({ id: s.id, name: s.name }));
}

/**
 * pokemontcg-Set → TCGdex-Set. Reihenfolge: Ausnahme, eindeutiger Name,
 * gleiche ID. Der Name kommt VOR der gleichen ID, weil gleiche Kuerzel in
 * beiden Quellen verschiedene Sets meinen koennen.
 */
export function dexSetFuer(setCode: string, setName: string, dexSets: DexSet[]): string | null {
  if (SET_AUSNAHMEN[setCode]) return SET_AUSNAHMEN[setCode];
  const n = normiere(setName);
  const perName = dexSets.filter((s) => normiere(s.name) === n);
  if (perName.length === 1) return perName[0].id;
  if (dexSets.some((s) => s.id === setCode)) return setCode;
  return null;
}

/** Moegliche TCGdex-IDs einer Karte: Nummer wie sie ist, und bei reinen Ziffern dreistellig (Promos: svp-001). */
export function dexKandidaten(dexSet: string, nummer: string): string[] {
  const roh = `${dexSet}-${nummer}`;
  if (/^\d+$/.test(nummer) && nummer.length < 3) return [roh, `${dexSet}-${nummer.padStart(3, '0')}`];
  return [roh];
}

interface DexKarte {
  id?: string;
  name?: string;
  pricing?: {
    cardmarket?: {
      updated?: string;
      unit?: string;
      trend?: number | null;
      avg?: number | null;
      low?: number | null;
      avg1?: number | null;
      avg7?: number | null;
      avg30?: number | null;
    } | null;
  } | null;
}

const zahl = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

/**
 * Frischer Cardmarket-Preis einer Karte. `null` bei: nicht zuordenbar,
 * Name weicht ab, kein Cardmarket-Eintrag, keine EUR-Angabe, kein Trend.
 */
export async function holeFrischenPreis(
  karte: { name: string; setCode: string; set: string; number?: string },
  dexSets: DexSet[],
): Promise<FrischerPreis | null> {
  if (!karte.number) return null;
  const dexSet = dexSetFuer(karte.setCode, karte.set, dexSets);
  if (!dexSet) return null;

  for (const id of dexKandidaten(dexSet, karte.number)) {
    const res = await fetch(`${BASIS}/cards/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(ZEITLIMIT_MS) });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`TCGdex ${id}: HTTP ${res.status}`);
    const d = (await res.json()) as DexKarte;
    // Namensprobe: Die Zuordnung ist nur so gut wie diese Zeile.
    if (!d.name || normiere(d.name) !== normiere(karte.name)) return null;
    const cm = d.pricing?.cardmarket;
    if (!cm || (cm.unit && cm.unit !== 'EUR') || !cm.updated) return null;
    const trend = zahl(cm.trend);
    if (trend === null) return null;
    return {
      trend,
      avg30: zahl(cm.avg30),
      avg7: zahl(cm.avg7),
      avg1: zahl(cm.avg1),
      low: zahl(cm.low),
      avg: zahl(cm.avg),
      updated: cm.updated,
      dexId: d.id ?? id,
    };
  }
  return null;
}

/** Bewegung wie auf der ganzen Seite: aktueller Preistrend gegen den 30-Tage-Schnitt, in Prozent. */
export function bewegung(p: Pick<FrischerPreis, 'trend' | 'avg30'>): number | null {
  if (p.avg30 === null || p.avg30 <= 0) return null;
  return ((p.trend - p.avg30) / p.avg30) * 100;
}
