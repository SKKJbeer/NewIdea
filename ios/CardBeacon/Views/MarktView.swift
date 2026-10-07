import SwiftUI
import Charts

struct MarktView: View {
    @State private var infoOffen = false

    var body: some View {
        NavigationStack {
            Laden(laden: { try await APIClient.shared.markt() }) { markt in
                List {
                    Section { IndexKachel(markt: markt) }
                    if !markt.aufwaerts.isEmpty {
                        Section("Aufwärts · 30 Tage") {
                            ForEach(markt.aufwaerts) { k in NavigationLink(value: k) { KartenZeile(karte: k) } }
                        }
                    }
                    if !markt.abwaerts.isEmpty {
                        Section("Abwärts · 30 Tage") {
                            ForEach(markt.abwaerts) { k in NavigationLink(value: k) { KartenZeile(karte: k) } }
                        }
                    }
                    Section { PreisHinweis() }.listRowBackground(Color.clear)
                }
            }
            .navigationTitle("Markt")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { infoOffen = true } label: { Image(systemName: "info.circle") }
                        .accessibilityLabel("Info und Hinweise")
                }
            }
            .sheet(isPresented: $infoOffen) { InfoView() }
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
        }
    }
}

struct IndexKachel: View {
    let markt: Markt

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("CardBeacon Index").font(.caption.weight(.bold)).textCase(.uppercase).foregroundStyle(.secondary)
            if let index = markt.index {
                Text(Format.prozent(index.wert)).font(.system(size: 40, weight: .bold).monospacedDigit())
                    .foregroundStyle(Theme.trendFarbe(index.wert))
                Text("Median der \(index.fensterTage)-Tage-Bewegung über \(index.karten.formatted(.number.locale(Locale(identifier: "de_DE")))) Karten · Stand \(Format.tag(index.datum))")
                    .font(.caption).foregroundStyle(.secondary)
                // Eine Kurve erst ab zwei echten Punkten — sonst nichts zeichnen.
                let punkte = markt.indexVerlauf.compactMap { p in p.tag.map { (tag: $0, wert: p.wert) } }
                if punkte.count >= 2 {
                    Chart(punkte, id: \.tag) { p in
                        LineMark(x: .value("Tag", p.tag), y: .value("Index", p.wert))
                            .foregroundStyle(Theme.akzent)
                    }
                    .chartYAxis { AxisMarks(position: .trailing) }
                    .frame(height: 120)
                }
            } else {
                Text("Kein aktueller Indexstand.").foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
    }
}
