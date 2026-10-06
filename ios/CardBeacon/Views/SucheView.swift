import SwiftUI

struct SucheView: View {
    @State private var begriff = ""
    @State private var ergebnis: Suchergebnis?
    @State private var fehler: String?
    @State private var laedt = false

    var body: some View {
        NavigationStack {
            List {
                if let fehler {
                    Label(fehler, systemImage: "exclamationmark.triangle").foregroundStyle(Theme.warnung)
                }
                if let ergebnis {
                    if !ergebnis.sets.isEmpty {
                        Section("Sets") {
                            ForEach(ergebnis.sets) { s in
                                NavigationLink(value: s) { Label(s.name, systemImage: "square.stack.3d.up") }
                            }
                        }
                    }
                    Section("Karten") {
                        if ergebnis.karten.isEmpty {
                            Text("Keine Karten für „\(begriff)“ gefunden. Tipp: englischer Kartenname (z. B. „Charizard“).")
                                .font(.callout).foregroundStyle(.secondary)
                        }
                        ForEach(ergebnis.karten) { k in NavigationLink(value: k) { KartenZeile(karte: k) } }
                    }
                } else if !laedt {
                    Text("Name einer Karte oder eines Sets eingeben, z. B. „Glurak“, „Pikachu“ oder „151“.")
                        .font(.callout).foregroundStyle(.secondary)
                }
            }
            .overlay { if laedt && ergebnis == nil { ProgressView() } }
            .navigationTitle("Suche")
            .searchable(text: $begriff, prompt: "Karte oder Set")
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .task(id: begriff) { await suchen() }
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
            .navigationDestination(for: SetTreffer.self) { SetView(set: $0) }
        }
    }

    /// Wartet kurz nach dem letzten Tastendruck; ein neuer Begriff bricht die laufende Suche ab.
    private func suchen() async {
        let q = begriff.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else { ergebnis = nil; fehler = nil; return }
        try? await Task.sleep(nanoseconds: 300_000_000)
        guard !Task.isCancelled else { return }
        laedt = true
        defer { laedt = false }
        do {
            let r = try await APIClient.shared.suche(q)
            guard !Task.isCancelled else { return }
            ergebnis = r
            fehler = nil
        } catch {
            guard !Task.isCancelled else { return }
            fehler = (error as? LocalizedError)?.errorDescription
        }
    }
}

struct SetView: View {
    let set: SetTreffer

    var body: some View {
        Laden(laden: { try await APIClient.shared.setKarten(set.setCode) }) { detail in
            List {
                ForEach(detail.karten) { k in NavigationLink(value: k) { KartenZeile(karte: k) } }
                Section { PreisHinweis() }.listRowBackground(Color.clear)
            }
        }
        .navigationTitle(set.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
