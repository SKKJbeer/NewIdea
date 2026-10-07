import SwiftUI

struct MerklisteView: View {
    @EnvironmentObject private var merkliste: Merkliste
    @State private var fehler: String?

    var body: some View {
        NavigationStack {
            Group {
                if merkliste.karten.isEmpty {
                    ContentUnavailableView("Noch keine Karten gemerkt",
                                           systemImage: "star",
                                           description: Text("Auf einer Kartenseite „Merken“ tippen. Die Merkliste liegt nur auf diesem Gerät."))
                } else {
                    List {
                        if let fehler {
                            Label(fehler, systemImage: "exclamationmark.triangle").font(.callout).foregroundStyle(Theme.warnung)
                                .listRowBackground(Theme.karte)
                        }
                        Section {
                            ForEach(merkliste.karten) { k in
                                NavigationLink(value: k) { KartenZeile(karte: k) }
                                    .listRowBackground(Theme.karte)
                            }
                            .onDelete { merkliste.entfernen(at: $0) }
                        } header: {
                            Abschnittsmarke(text: "\(merkliste.karten.count) Karte\(merkliste.karten.count == 1 ? "" : "n")")
                        }
                        Section {
                            Text("Gespeichert nur auf diesem Gerät. Preise: Cardmarket-Preis-Trend, beim Öffnen und Herunterziehen neu geladen.")
                                .font(.caption2).foregroundStyle(.secondary)
                        }.listRowBackground(Color.clear)
                    }
                    .dunkleListe()
                    .refreshable { await auffrischen() }
                    .toolbar { EditButton() }
                }
            }
            .background(Theme.hintergrund)
            .navigationTitle("Merkliste")
            .task { await auffrischen() }
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
            .navigationDestination(for: SetTreffer.self) { SetView(set: $0) }
        }
    }

    /// Gemerkte Karten tragen den Preis vom Merken — hier werden sie auf den aktuellen Stand gebracht.
    private func auffrischen() async {
        let ids = merkliste.karten.map(\.id)
        guard !ids.isEmpty else { return }
        do {
            for teil in stride(from: 0, to: ids.count, by: 100) {
                let antwort = try await APIClient.shared.preise(Array(ids[teil..<min(teil + 100, ids.count)]))
                antwort.karten.forEach { merkliste.aktualisieren($0) }
            }
            fehler = nil
        } catch {
            fehler = "Preise konnten nicht aktualisiert werden — angezeigt wird der Stand vom Merken."
        }
    }
}
