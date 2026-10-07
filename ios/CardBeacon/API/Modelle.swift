import Foundation

// Datenformen der Schnittstelle /api/v1 (src/lib/app-api.ts). Felder werden
// serverseitig nur ergänzt, nie umbenannt — unbekannte Felder ignoriert der
// Decoder, fehlende optionale Felder sind `nil`.

struct Karte: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let nameDe: String?
    let set: String
    let setCode: String
    let nummer: String?
    let seltenheit: String?
    let bild: String
    /// Cardmarket-Preis-Trend in EUR. `nil` = kein Preis.
    let preis: Double?
    /// Preis gegen Ø 30 Tage in Prozent.
    let trend30: Double?
    /// Quellstand des Preises (YYYY-MM-DD).
    let preisStand: String?
    /// Quellstand höchstens 3 Tage alt.
    let frisch: Bool
    let url: String

    var anzeigeName: String { nameDe ?? name }
}

struct Aufschluesselung: Codable, Hashable {
    let trend: Double?
    let ab: Double?
    let durchschnittVerkauf: Double?
    let durchschnitt30: Double?
}

struct Verlaufspunkt: Codable, Hashable, Identifiable {
    let datum: String
    let preis: Double
    var id: String { datum }
    var tag: Date? { Format.isoTag(datum) }
}

struct KartenDetail: Codable, Hashable {
    let id: String
    let name: String
    let nameDe: String?
    let set: String
    let setCode: String
    let nummer: String?
    let seltenheit: String?
    let bild: String
    let preis: Double?
    let trend30: Double?
    let preisStand: String?
    let frisch: Bool
    let url: String
    let aufschluesselung: Aufschluesselung
    let verlauf: [Verlaufspunkt]

    var alsKarte: Karte {
        Karte(id: id, name: name, nameDe: nameDe, set: set, setCode: setCode, nummer: nummer, seltenheit: seltenheit,
              bild: bild, preis: preis, trend30: trend30, preisStand: preisStand, frisch: frisch, url: url)
    }
}

struct IndexStand: Codable, Hashable {
    let wert: Double
    let datum: String
    let karten: Int
    let sets: Int
    let fensterTage: Int
}

struct IndexPunkt: Codable, Hashable, Identifiable {
    let datum: String
    let wert: Double
    var id: String { datum }
    var tag: Date? { Format.isoTag(datum) }
}

struct Markt: Codable, Hashable {
    let index: IndexStand?
    let indexVerlauf: [IndexPunkt]
    let aufwaerts: [Karte]
    let abwaerts: [Karte]
    let datenStand: String?
}

struct SetTreffer: Codable, Hashable, Identifiable {
    let setCode: String
    let name: String
    var id: String { setCode }
}

struct Suchergebnis: Codable {
    let karten: [Karte]
    let sets: [SetTreffer]
}

struct SetDetail: Codable {
    let setCode: String
    let name: String
    let karten: [Karte]
}

struct Status: Codable {
    let api: Int
    let minAppBuild: Int
    let datenStand: String?
}

struct PreisAntwort: Codable {
    let karten: [Karte]
    let fehlend: [String]
}

struct VerlaufAntwort: Codable {
    let tage: Int
    let verlauf: [String: [Verlaufspunkt]]
}
