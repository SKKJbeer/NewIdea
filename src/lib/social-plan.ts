import { formatCount, formatPercent } from '@/lib/format';
import { weekIndex } from '@/lib/reel-concepts';
import { BUY_ADVICE, FIRST_PERSON, PERSONA_NAME, AI_PHRASES } from '@/lib/content-rules';
import type { Marktlage } from '@/lib/marktbilder';
import type { Vorlage } from '@/lib/marktbilder';

// WAS WANN AUF INSTAGRAM ERSCHEINT — ein Plan, eine Stelle.
//
// Reels bringen auf Instagram die groesste Reichweite an Nicht-Follower, weil
// sie im Reels-Reiter und in der Erkunden-Ansicht laufen. Karussells bringen
// die meisten Speicherungen — und gespeicherte Beitraege gewichtet der
// Algorithmus hoch. Deshalb beides im Wechsel, Reels etwas haeufiger.
//
// Zusaetzlich jeden Tag eine Story mit der Marktlage: Stories erreichen die
// eigenen Follower zuverlaessig und kosten keine Feed-Flaeche.

export type Beitragsart = 'reel' | 'karussell';

/** Berliner Wochentag (0 = Sonntag) → Beitragsart. */
export const WOCHENPLAN: Readonly<Record<number, Beitragsart>> = {
  0: 'reel',
  1: 'reel',
  2: 'karussell',
  3: 'reel',
  4: 'karussell',
  5: 'reel',
  6: 'karussell',
};

/** Reihenfolge der Karussell-Bilder: Ueberblick zuerst, dann Einzelheiten. */
export const KARUSSELL_VORLAGEN: readonly Vorlage[] = ['market-state', 'big-mover', 'card-vs-market', 'set-battle'];

export function berlinerWochentag(d: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', weekday: 'short' }).format(d);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
}

const REEL_TAGE = Object.entries(WOCHENPLAN)
  .filter(([, art]) => art === 'reel')
  .map(([tag]) => Number(tag))
  .sort((a, b) => a - b);

/**
 * Rotationszaehler fuer Reels.
 *
 * Mit der blossen Wochennummer kaeme an allen Reel-Tagen einer Woche dasselbe
 * Format. Mit dem Tag des Jahres kaemen bei Reels an Mo/Mi/Fr/So nur zwei von
 * vier Formaten vor (Abstand 2 Tage, vier Formate). Richtig ist: Woche mal
 * Reels je Woche plus Platz in der Woche — so laeuft jede Woche jedes Format.
 */
export function reelRotation(d: Date): number {
  const platz = Math.max(0, REEL_TAGE.indexOf(berlinerWochentag(d)));
  return weekIndex(d) * REEL_TAGE.length + platz;
}

export interface Plan {
  art: Beitragsart;
  rotation: number;
  wochentag: number;
}

export function planFuer(d: Date): Plan {
  const wochentag = berlinerWochentag(d);
  return { art: WOCHENPLAN[wochentag] ?? 'karussell', rotation: reelRotation(d), wochentag };
}

// ── Bildunterschriften ──────────────────────────────────────────────────────

export const HASHTAGS =
  '#Pokemon #PokemonTCG #PokemonKarten #Cardmarket #Sammelkarten #TCG #PokemonDeutschland #Kartenpreise';

/**
 * Link mit Kampagnenkennung.
 *
 * In Instagram-Bildunterschriften sind Links nicht anklickbar — der Link steht
 * trotzdem da, weil ihn manche kopieren, und weil er in der Reichweitenmessung
 * als Kampagne auftaucht, sobald ihn jemand oeffnet. Der eigentliche Weg ist
 * der Link in der Bio.
 */
export function kampagnenLink(siteUrl: string, medium: 'reel' | 'post' | 'story', kampagne: string): string {
  return `${siteUrl}?utm_source=instagram&utm_medium=${medium}&utm_campaign=${kampagne}`;
}

export function karussellCaption(lage: Marktlage, siteUrl: string): string {
  const zeilen: string[] = [`Pokémon-Kartenmarkt am ${lage.datenstand}`, ''];
  zeilen.push(
    `CardBeacon Index: ${formatPercent(lage.cbi.value)} — Median aus ${formatCount(lage.cbi.cardCount)} Karten, aktueller Preis gegen den 30-Tage-Schnitt.`,
  );
  if (lage.mover) {
    zeilen.push(`Stärkste Bewegung: ${lage.mover.name} (${lage.mover.set}) ${formatPercent(lage.mover.trend)}`);
  }
  const s = lage.setsSortiert;
  if (s.length >= 2) {
    zeilen.push(
      `Stärkstes Set: ${s[0].name} ${formatPercent(s[0].avgTrend)} · Schwächstes Set: ${s[s.length - 1].name} ${formatPercent(s[s.length - 1].avgTrend)}`,
    );
  }
  zeilen.push(
    '',
    'Zum Durchblättern: Marktlage, stärkste Bewegung, Karte gegen Markt, Set-Duell.',
    '',
    'Alle Preise und Verläufe kostenlos — Link in der Bio',
    kampagnenLink(siteUrl, 'post', 'marktlage'),
    '',
    HASHTAGS,
  );
  return zeilen.join('\n');
}

/**
 * Prueft eine Bildunterschrift gegen die Inhaltsregeln der Seite.
 *
 * Instagram ist oeffentlich und automatisch — ein Regelverstoss liesse sich
 * nicht mehr zurueckholen, bevor ihn jemand gesehen hat. Deshalb dieselbe
 * Schranke wie bei generierten Guides: Verstoss → nicht veroeffentlichen.
 * Preisangaben sind hier erlaubt (sie stammen aus der Messung, nicht aus
 * erfundenem Fliesstext), Emojis ebenso (Plattform-Konvention laut CLAUDE.md).
 */
export function captionVerstoesse(caption: string): string[] {
  const v: string[] = [];
  if (BUY_ADVICE.test(caption)) v.push('Kaufempfehlung');
  if (FIRST_PERSON.test(caption)) v.push('Ich-Form');
  if (PERSONA_NAME.test(caption)) v.push('Persona-Name');
  if (AI_PHRASES.test(caption)) v.push('KI-Floskel');
  // Instagram schneidet bei 2.200 Zeichen ab und lehnt mehr als 30 Hashtags ab.
  if (caption.length > 2200) v.push('laenger als 2.200 Zeichen');
  if ((caption.match(/#\w/g) ?? []).length > 30) v.push('mehr als 30 Hashtags');
  return v;
}
