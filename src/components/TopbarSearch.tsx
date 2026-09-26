'use client';

import { usePathname } from 'next/navigation';
import { SearchBox } from '@/components/SearchBox';

/**
 * Seiten, die ein EIGENES Suchfeld im Seitenkopf tragen.
 *
 * Auf diesen Seiten ist das Feld Teil der Seitenaussage — auf `/suche` steht
 * darin die laufende Anfrage, auf `/einsteiger` ist es die Handlungsaufforderung
 * der ganzen Seite. Ein zweites Feld daneben ist keine Bequemlichkeit, sondern
 * eine Frage: In welches soll ich tippen?
 */
const SEITEN_MIT_EIGENER_SUCHE = new Set(['/suche', '/einsteiger']);

/**
 * Das Suchfeld der Kopfleiste — sichtbar überall AUSSER dort, wo die Seite
 * selbst eines mitbringt.
 *
 * GEMESSEN am 26.09.2026 auf 1536 px: Auf `/suche` und `/einsteiger` standen
 * zwei sichtbare Suchfelder übereinander — eines bei y=20 (Kopfleiste, 640 px),
 * eines bei y≈274 (Seitenkopf, 576 px).
 *
 * WARUM DIE KOPFLEISTE WEICHT und nicht die Seite: Das Feld im Seitenkopf trägt
 * Zustand (die laufende Suchanfrage) und Gestaltung (Überschrift, Erklärung,
 * Beispiele). Das der Kopfleiste ist überall gleich und trägt nichts davon. Wer
 * eines von beiden entfernt, entfernt das leere.
 *
 * WARUM EINE CLIENT-KOMPONENTE: Die Anwendungshülle ist eine Server-Komponente
 * im Grundgerüst und kennt die aufgerufene Route nicht — `usePathname` schon.
 * Die Alternative wäre CSS mit `:has()` über Seitengrenzen hinweg gewesen: Das
 * funktioniert, aber niemand findet die Regel wieder, wenn sie einmal stört.
 */
export function TopbarSearch() {
  const pfad = usePathname();
  if (SEITEN_MIT_EIGENER_SUCHE.has(pfad)) return null;
  return <SearchBox placeholder="Suche Karten, Sets, …" searchBtn="Suchen" />;
}
