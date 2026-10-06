import Foundation

/// Gemerkte Karten — nur auf diesem Gerät (UserDefaults), ohne Konto.
/// Gespeichert wird die Karten-ID samt letzter Anzeige; der Preis wird beim
/// Öffnen immer frisch geholt.
@MainActor
final class Merkliste: ObservableObject {
    @Published private(set) var karten: [Karte] = []
    private let schluessel = "merkliste.v1"
    private let speicher: UserDefaults

    init(speicher: UserDefaults = .standard) {
        self.speicher = speicher
        if let daten = speicher.data(forKey: schluessel),
           let gelesen = try? JSONDecoder().decode([Karte].self, from: daten) {
            karten = gelesen
        }
    }

    func enthaelt(_ id: String) -> Bool { karten.contains { $0.id == id } }

    func umschalten(_ karte: Karte) {
        if enthaelt(karte.id) {
            karten.removeAll { $0.id == karte.id }
        } else {
            karten.insert(karte, at: 0)
        }
        sichern()
    }

    func entfernen(at offsets: IndexSet) {
        karten.remove(atOffsets: offsets)
        sichern()
    }

    /// Ersetzt die gespeicherte Anzeige einer Karte durch den frisch geladenen Stand.
    func aktualisieren(_ karte: Karte) {
        guard let i = karten.firstIndex(where: { $0.id == karte.id }) else { return }
        karten[i] = karte
        sichern()
    }

    private func sichern() {
        if let daten = try? JSONEncoder().encode(karten) { speicher.set(daten, forKey: schluessel) }
    }
}
