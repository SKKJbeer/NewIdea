import SwiftUI

struct MerklisteView: View {
    @EnvironmentObject private var merkliste: Merkliste

    var body: some View {
        NavigationStack {
            Group {
                if merkliste.karten.isEmpty {
                    ContentUnavailableView("Noch keine Karten gemerkt",
                                           systemImage: "star",
                                           description: Text("Auf einer Karte oben rechts den Stern tippen. Die Merkliste liegt nur auf diesem Gerät."))
                } else {
                    List {
                        ForEach(merkliste.karten) { k in NavigationLink(value: k) { KartenZeile(karte: k) } }
                            .onDelete { merkliste.entfernen(at: $0) }
                        Section {
                            Text("Gespeichert nur auf diesem Gerät. Preise werden beim Öffnen einer Karte neu geladen.")
                                .font(.caption2).foregroundStyle(.secondary)
                        }.listRowBackground(Color.clear)
                    }
                }
            }
            .navigationTitle("Merkliste")
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
        }
    }
}
