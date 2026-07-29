// Zusammenführung zwischen lokalem Browser-Portfolio und dem Konto-Portfolio.
//
// Ausgangslage: Vor dem Login liegt das Portfolio ausschließlich im
// localStorage. Meldet sich jemand an, existieren möglicherweise ZWEI Bestände
// — der lokale und der bereits im Konto gespeicherte (etwa vom Handy).
//
// Regeln, bewusst so gewählt:
//  1. Vereinigung über die Karten-ID — niemand verliert eine Position.
//  2. Bei derselben Karte auf beiden Seiten gewinnt der ZULETZT hinzugefügte
//     Eintrag. Nicht die Stückzahlen addieren: Der Nutzer würde sonst bei
//     jedem erneuten Login mehr Karten besitzen.
//  3. Das Ergebnis ist idempotent — dieselbe Zusammenführung noch einmal
//     ausgeführt ändert nichts mehr. Das ist die wichtigste Eigenschaft,
//     weil der Ablauf bei jedem Login erneut durchläuft.
//
// Die Funktionen hier sind rein: kein Netz, kein Speicher, kein React.

import { normalizeHolding, type PortfolioHolding } from './portfolio';

/** Sortierschlüssel eines Eintrags — je später, desto „frischer". */
function addedAtKey(h: PortfolioHolding): string {
  // Fehlt der Zeitstempel (alte Einträge), gilt der Eintrag als sehr alt und
  // verliert damit gegen jeden datierten Eintrag.
  return h.addedAt || h.purchaseDate || '';
}

/**
 * Führt lokalen und Konto-Bestand zusammen.
 *
 * Die Reihenfolge des Ergebnisses folgt dem Konto-Bestand (stabile Anzeige),
 * rein lokale Positionen werden hinten angehängt.
 */
export function mergeHoldings(
  local: PortfolioHolding[],
  remote: PortfolioHolding[],
): PortfolioHolding[] {
  const byId = new Map<string, PortfolioHolding>();

  for (const h of remote) byId.set(h.cardId, normalizeHolding(h));

  for (const h of local) {
    const normalized = normalizeHolding(h);
    const vorhanden = byId.get(normalized.cardId);
    if (!vorhanden) {
      byId.set(normalized.cardId, normalized);
      continue;
    }
    // Gleicher Eintrag auf beiden Seiten: der jüngere gewinnt.
    if (addedAtKey(normalized) > addedAtKey(vorhanden)) {
      byId.set(normalized.cardId, normalized);
    }
  }

  const reihenfolge = [
    ...remote.map((h) => h.cardId),
    ...local.map((h) => h.cardId).filter((id) => !remote.some((r) => r.cardId === id)),
  ];
  const gesehen = new Set<string>();
  const ergebnis: PortfolioHolding[] = [];
  for (const id of reihenfolge) {
    if (gesehen.has(id)) continue;
    gesehen.add(id);
    const eintrag = byId.get(id);
    if (eintrag) ergebnis.push(eintrag);
  }
  return ergebnis;
}

/**
 * Zeile in der Datenbank ↔ Portfolio-Eintrag.
 *
 * Bewusst eine eigene Übersetzung statt `select *`: So bricht die Anzeige
 * nicht, wenn die Tabelle später eine Spalte bekommt, und Datenbankfelder
 * (snake_case) bleiben von der Oberfläche (camelCase) getrennt.
 */
export interface HoldingRow {
  user_id: string;
  card_id: string;
  card_name: string;
  set_name: string;
  set_code: string;
  image_url: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string | null;
  language: string;
  added_at: string | null;
}

export function rowToHolding(row: Partial<HoldingRow>): PortfolioHolding {
  return normalizeHolding({
    cardId: String(row.card_id ?? ''),
    cardName: row.card_name ?? '',
    setName: row.set_name ?? '',
    setCode: row.set_code ?? '',
    imageUrl: row.image_url ?? '',
    quantity: row.quantity ?? undefined,
    purchasePrice: row.purchase_price ?? undefined,
    purchaseDate: row.purchase_date ?? '',
    language: (row.language as PortfolioHolding['language']) ?? undefined,
    addedAt: row.added_at ?? '',
  });
}

export function holdingToRow(h: PortfolioHolding, userId: string): HoldingRow {
  const n = normalizeHolding(h);
  return {
    user_id: userId,
    card_id: n.cardId,
    card_name: n.cardName,
    set_name: n.setName,
    set_code: n.setCode,
    image_url: n.imageUrl,
    quantity: n.quantity,
    purchase_price: n.purchasePrice,
    // Leere Datumsfelder müssen NULL sein — Postgres lehnt '' für DATE ab.
    purchase_date: n.purchaseDate || null,
    language: n.language,
    added_at: n.addedAt || null,
  };
}

/** Karten-IDs, die im Konto stehen, aber nicht mehr im neuen Bestand — zu löschen. */
export function removedIds(vorher: PortfolioHolding[], nachher: PortfolioHolding[]): string[] {
  const behalten = new Set(nachher.map((h) => h.cardId));
  return vorher.map((h) => h.cardId).filter((id) => !behalten.has(id));
}
