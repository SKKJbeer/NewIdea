import SwiftUI
import Charts

struct KarteView: View {
    let karte: Karte
    @EnvironmentObject private var merkliste: Merkliste
    @State private var neuePosition: Position?
    @State private var marktwert: Double?

    var body: some View {
        Laden(laden: { try await APIClient.shared.karte(karte.id) }) { d in
            ScrollView {
                VStack(spacing: 20) {
                    KartenBild(quelle: d.bild, breite: 640).frame(maxWidth: 260).shadow(radius: 12)

                    VStack(spacing: 4) {
                        Text(d.nameDe ?? d.name).font(.title2.bold()).multilineTextAlignment(.center)
                        if d.nameDe != nil { Text(d.name).font(.subheadline).foregroundStyle(.secondary) }
                        Text([d.set, d.nummer.map { "#\($0)" }, d.seltenheit].compactMap { $0 }.joined(separator: " · "))
                            .font(.caption).foregroundStyle(.secondary)
                    }

                    PreisBlock(d: d)
                    VerlaufBlock(punkte: d.verlauf)

                    if let link = URL(string: d.url) {
                        Link(destination: link) { Label("Auf cardbeacon.de öffnen", systemImage: "safari") }
                            .font(.callout)
                    }
                    PreisHinweis()
                }
                .padding()
            }
            .onAppear { merkliste.aktualisieren(d.alsKarte); marktwert = d.preis }
        }
        .sheet(item: $neuePosition) { p in PositionFormular(position: p, aktuellerPreis: marktwert ?? karte.preis) }
        .navigationTitle(karte.anzeigeName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    neuePosition = Position(karteId: karte.id, name: karte.anzeigeName, set: karte.set, bild: karte.bild,
                                            menge: 1, kaufpreis: 0, kaufdatum: Date())
                } label: { Image(systemName: "briefcase") }
                .accessibilityLabel("Zum Portfolio")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { merkliste.umschalten(karte) } label: {
                    Image(systemName: merkliste.enthaelt(karte.id) ? "star.fill" : "star")
                }
                .accessibilityLabel(merkliste.enthaelt(karte.id) ? "Von Merkliste entfernen" : "Merken")
            }
        }
    }
}

private struct PreisBlock: View {
    let d: KartenDetail

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(Format.euro(d.preis)).font(.system(size: 34, weight: .bold).monospacedDigit())
                Spacer()
                VStack(alignment: .trailing) {
                    Text(Format.prozent(d.trend30)).font(.headline.monospacedDigit())
                        .foregroundStyle(Theme.trendFarbe(d.trend30))
                    Text("gegen Ø 30 Tage").font(.caption2).foregroundStyle(.secondary)
                }
            }
            Label(d.frisch ? "Cardmarket-Stand \(Format.tag(d.preisStand))" : "Älterer Stand: \(Format.tag(d.preisStand)) — kann veraltet sein",
                  systemImage: d.frisch ? "checkmark.seal" : "clock")
                .font(.caption).foregroundStyle(d.frisch ? Color.secondary : Theme.warnung)

            Divider()
            zeile("Preis-Trend (Marktwert)", d.aufschluesselung.trend)
            zeile("Günstigstes Angebot (ab)", d.aufschluesselung.ab)
            zeile("Ø Verkaufspreis", d.aufschluesselung.durchschnittVerkauf)
            zeile("Ø 30 Tage", d.aufschluesselung.durchschnitt30)
            Text("„ab“ ist das günstigste einzelne Angebot, oft in schlechterem Zustand — der Trend ist der faire Marktwert.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Theme.karte, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.rand))
    }

    private func zeile(_ titel: String, _ wert: Double?) -> some View {
        HStack {
            Text(titel).font(.callout).foregroundStyle(.secondary)
            Spacer()
            Text(Format.euro(wert)).font(.callout.monospacedDigit())
        }
    }
}

/// Echte Tageswerte. Unter zwei Punkten gibt es keine Kurve — nur den Hinweis.
private struct VerlaufBlock: View {
    let punkte: [Verlaufspunkt]

    var body: some View {
        let daten = punkte.compactMap { p in p.tag.map { (tag: $0, preis: p.preis) } }
        VStack(alignment: .leading, spacing: 8) {
            Text("Preisverlauf").font(.headline)
            if daten.count >= 2 {
                Chart(daten, id: \.tag) { p in
                    LineMark(x: .value("Tag", p.tag), y: .value("Preis", p.preis))
                        .foregroundStyle(Theme.akzent)
                    PointMark(x: .value("Tag", p.tag), y: .value("Preis", p.preis))
                        .symbolSize(daten.count < 15 ? 20 : 0)
                        .foregroundStyle(Theme.akzent)
                }
                .chartYAxis { AxisMarks(position: .trailing) }
                .frame(height: 180)
                Text("\(daten.count) echte Tageswerte").font(.caption2).foregroundStyle(.secondary)
            } else {
                Text("Verlauf wird aufgebaut — bisher zu wenige Tageswerte.").font(.callout).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Theme.karte, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.rand))
    }
}
