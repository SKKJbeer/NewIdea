import Foundation

/// Eine Position: eine Karte, gekauft zu einem Preis an einem Tag.
/// Dieselbe Karte darf mehrfach vorkommen (verschiedene Käufe).
struct Position: Codable, Identifiable, Hashable {
    var id = UUID()
    let karteId: String
    var name: String
    var set: String
    /// Set-Code für die Aufteilung; ältere Einträge haben keinen (dann aus der Karten-ID abgeleitet).
    var setCode: String? = nil
    var bild: String
    var menge: Int
    /// Kaufpreis je Stück in EUR.
    var kaufpreis: Double
    var kaufdatum: Date

    var investiert: Double { Double(menge) * kaufpreis }

    /// „sv3pt5-199" → „sv3pt5" (wie setCodeFromId auf der Website).
    var setSchluessel: String {
        if let setCode, !setCode.isEmpty { return setCode }
        guard let i = karteId.lastIndex(of: "-") else { return karteId }
        return String(karteId[..<i])
    }
}

/// Bestand — nur auf diesem Gerät (UserDefaults), ohne Konto.
@MainActor
final class PortfolioSpeicher: ObservableObject {
    @Published private(set) var positionen: [Position] = []
    private let schluessel = "portfolio.v1"
    private let speicher: UserDefaults

    init(speicher: UserDefaults = .standard) {
        self.speicher = speicher
        if let daten = speicher.data(forKey: schluessel),
           let gelesen = try? JSONDecoder().decode([Position].self, from: daten) {
            positionen = gelesen
        }
    }

    var kartenIds: [String] { Array(Set(positionen.map(\.karteId))).sorted() }

    func speichern(_ p: Position) {
        if let i = positionen.firstIndex(where: { $0.id == p.id }) { positionen[i] = p } else { positionen.insert(p, at: 0) }
        sichern()
    }

    func entfernen(_ ids: [UUID]) {
        positionen.removeAll { ids.contains($0.id) }
        sichern()
    }

    private func sichern() {
        if let daten = try? JSONEncoder().encode(positionen) { speicher.set(daten, forKey: schluessel) }
    }
}

/// Rechenregeln — rein und getestet, dieselben wie auf der Website:
/// - Ohne aktuellen Preis zählt eine Position NICHT als Nullbewegung, sie wird ausgewiesen.
/// - Ein Verlaufspunkt entsteht nur an Tagen, für die JEDE gehaltene Karte einen echten Tageswert hat.
/// - Zukäufe im Zeitraum sind kein Gewinn (wie computeRangePerformance).
enum PortfolioRechnung {
    struct Stand: Equatable {
        /// Wert der Positionen mit aktuellem Preis.
        let wert: Double
        /// Kaufsumme derselben Positionen — Bezugsgröße für G/V.
        let investiertMitPreis: Double
        /// Kaufsumme aller Positionen.
        let investiertGesamt: Double
        /// Positionen ohne aktuellen Preis.
        let ohnePreis: Int

        var gewinn: Double { wert - investiertMitPreis }
        var gewinnProzent: Double? { investiertMitPreis > 0 ? gewinn / investiertMitPreis * 100 : nil }
    }

    static func stand(_ positionen: [Position], preise: [String: Double]) -> Stand {
        var wert = 0.0, mitPreis = 0.0, gesamt = 0.0, ohne = 0
        for p in positionen {
            gesamt += p.investiert
            if let preis = preise[p.karteId], preis > 0 {
                wert += Double(p.menge) * preis
                mitPreis += p.investiert
            } else {
                ohne += 1
            }
        }
        return Stand(wert: wert, investiertMitPreis: mitPreis, investiertGesamt: gesamt, ohnePreis: ohne)
    }

    /// Leistung einer Position — nur bewertbar mit Marktpreis.
    struct Leistung: Identifiable, Equatable {
        let position: Position
        let wert: Double
        let gewinn: Double
        let prozent: Double
        var id: UUID { position.id }
    }

    /// Beste und schwächste Positionen; ohne Preis oder ohne Kaufpreis nicht bewertbar,
    /// strikt nach Vorzeichen getrennt (wie topPositions auf der Website).
    static func spitzen(_ positionen: [Position], preise: [String: Double], anzahl: Int = 3)
        -> (gewinner: [Leistung], verlierer: [Leistung]) {
        let bewertbar: [Leistung] = positionen.compactMap { p in
            guard let preis = preise[p.karteId], preis > 0, p.investiert > 0 else { return nil }
            let wert = Double(p.menge) * preis
            return Leistung(position: p, wert: wert, gewinn: wert - p.investiert, prozent: (wert - p.investiert) / p.investiert * 100)
        }
        return (Array(bewertbar.filter { $0.gewinn > 0 }.sorted { $0.prozent > $1.prozent }.prefix(anzahl)),
                Array(bewertbar.filter { $0.gewinn < 0 }.sorted { $0.prozent < $1.prozent }.prefix(anzahl)))
    }

    struct SetAnteil: Identifiable, Equatable {
        let setCode: String
        let name: String
        let wert: Double
        let karten: Int
        let anteil: Double
        var id: String { setCode }
    }

    /// Aufteilung nach Set über Positionen MIT Preis — zeigt Klumpen und Treiber.
    static func aufteilung(_ positionen: [Position], preise: [String: Double]) -> [SetAnteil] {
        var nachSet: [String: (name: String, wert: Double, karten: Int)] = [:]
        for p in positionen {
            guard let preis = preise[p.karteId], preis > 0 else { continue }
            let alt = nachSet[p.setSchluessel] ?? (p.set, 0, 0)
            nachSet[p.setSchluessel] = (alt.name, alt.wert + Double(p.menge) * preis, alt.karten + p.menge)
        }
        let gesamt = nachSet.values.reduce(0) { $0 + $1.wert }
        guard gesamt > 0 else { return [] }
        return nachSet.map { SetAnteil(setCode: $0.key, name: $0.value.name, wert: $0.value.wert, karten: $0.value.karten,
                                       anteil: $0.value.wert / gesamt * 100) }
            .sorted { $0.wert > $1.wert }
    }

    /// Positionen nach aktuellem Wert absteigend; ohne Preis zählt der Kaufwert, damit nichts verschwindet.
    static func sortiert(_ positionen: [Position], preise: [String: Double]) -> [Position] {
        func wert(_ p: Position) -> Double { preise[p.karteId].map { Double(p.menge) * $0 } ?? p.investiert }
        return positionen.sorted { wert($0) > wert($1) }
    }

    struct Punkt: Equatable { let tag: Date; let wert: Double }

    /// Depotwert je Tag — nur an vollständig belegten Tagen.
    static func verlauf(_ positionen: [Position], tageswerte: [String: [Verlaufspunkt]]) -> [Punkt] {
        var preisAm: [String: [Date: Double]] = [:]
        var tage = Set<Date>()
        for (id, punkte) in tageswerte {
            for p in punkte {
                guard let t = p.tag else { continue }
                preisAm[id, default: [:]][t] = p.preis
                tage.insert(t)
            }
        }
        var aus: [Punkt] = []
        for tag in tage.sorted() {
            let gehalten = positionen.filter { Calendar.utc.startOfDay(for: $0.kaufdatum) <= tag }
            guard !gehalten.isEmpty else { continue }
            var summe = 0.0
            var vollstaendig = true
            for p in gehalten {
                guard let preis = preisAm[p.karteId]?[tag] else { vollstaendig = false; break }
                summe += Double(p.menge) * preis
            }
            if vollstaendig { aus.append(Punkt(tag: tag, wert: summe)) }
        }
        return aus
    }

    /// Entwicklung über den Verlauf: Zukäufe nach dem ersten Punkt werden herausgerechnet.
    static func entwicklung(_ punkte: [Punkt], positionen: [Position]) -> (betrag: Double, prozent: Double)? {
        guard let start = punkte.first, let ende = punkte.last, punkte.count >= 2 else { return nil }
        let zukaeufe = positionen.filter { Calendar.utc.startOfDay(for: $0.kaufdatum) > start.tag }.reduce(0) { $0 + $1.investiert }
        let basis = start.wert + zukaeufe
        guard basis > 0 else { return nil }
        let betrag = ende.wert - start.wert - zukaeufe
        return (betrag, betrag / basis * 100)
    }
}

extension Calendar {
    static let utc: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }()
}
