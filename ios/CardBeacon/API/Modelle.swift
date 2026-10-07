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
    let sprachen: [Sprachpreis]?
    let setInfo: SetEintrag?

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
    // Seit API-Ausbau v6.25.0 — bei älteren Servern nil.
    let breite: Breite?
    let vorwoche: Vorwoche?
    let setBewegung: [SetBewegung]?
    let neuheiten: Neuheiten?

    struct Breite: Codable, Hashable { let steigend: Int; let fallend: Int; let gesamt: Int }
    struct Vorwoche: Codable, Hashable { let wert: Double; let datum: String }
    struct SetBewegung: Codable, Hashable, Identifiable {
        let setCode: String; let name: String; let median: Double; let karten: Int; let datum: String?
        var id: String { setCode }
    }
    struct Neuheiten: Codable, Hashable {
        struct NeuSet: Codable, Hashable, Identifiable { let setCode: String; let name: String; let datum: String; let logo: String?; var id: String { setCode } }
        struct JapanSet: Codable, Hashable, Identifiable { let name: String; let nameEn: String?; let datum: String; let karten: Int; var id: String { name + datum } }
        let neu: [NeuSet]
        let kommend: [NeuSet]
        let japan: [JapanSet]
    }
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

struct Inhalte: Codable {
    struct Bericht: Codable, Hashable { let woche: String; let kw: Int; let erstellt: String }
    struct ArtikelEintrag: Codable, Hashable, Identifiable { let datum: String; let typ: String; let kategorie: String; let titel: String; var id: String { datum } }
    struct GuideEintrag: Codable, Hashable, Identifiable { let slug: String; let titel: String; let beschreibung: String; let lesezeit: Int; var id: String { slug } }
    let bericht: Bericht?
    let artikel: [ArtikelEintrag]
    let guides: [GuideEintrag]
}

struct Marktbericht: Codable {
    let woche: String
    let kw: Int
    let erstellt: String
    let text: String
    let archiv: Bool
    let url: String
}

struct Abschnitt: Codable, Hashable {
    let ueberschrift: String
    let text: String
    let tipp: String?
}

struct Quelle: Codable, Hashable { let label: String; let url: String }

struct Artikel: Codable {
    let datum: String
    let typ: String
    let kategorie: String
    let titel: String
    let intro: String
    let abschnitte: [Abschnitt]
    let kernpunkte: [String]
    let quellen: [Quelle]
    let lesezeit: Int
    let archiv: Bool
    let url: String
}

struct Guide: Codable {
    let slug: String
    let titel: String
    let beschreibung: String
    let intro: String
    let abschnitte: [Abschnitt]
    let kernpunkte: [String]
    let lesezeit: Int
    let url: String
}

struct SetEintrag: Codable, Hashable, Identifiable {
    let setCode: String
    let name: String
    let serie: String
    let datum: String?
    let karten: Int
    let logo: String?
    let symbol: String?
    var id: String { setCode }
    var alsTreffer: SetTreffer { SetTreffer(setCode: setCode, name: name) }
}

struct SetListe: Codable { let sets: [SetEintrag] }

/// JP/KR-Preis — oder der Grund, warum es keinen gibt (nie geraten).
struct Sprachpreis: Codable, Hashable, Identifiable {
    struct Gegenstueck: Codable, Hashable { let name: String; let set: String }
    let sprache: String
    let ok: Bool
    let trend: Double?
    let ab: Double?
    let durchschnitt30: Double?
    let stand: String?
    let gegenstueck: Gegenstueck?
    let grund: String?
    var id: String { sprache }
}
