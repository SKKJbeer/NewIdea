import SwiftUI
import Charts

struct PortfolioView: View {
    @EnvironmentObject private var portfolio: PortfolioSpeicher
    @State private var preise: [String: Double] = [:]
    @State private var karten: [String: Karte] = [:]
    @State private var verlauf: [PortfolioRechnung.Punkt] = []
    @State private var fehler: String?
    @State private var laedt = false
    @State private var bearbeiten: Position?

    var body: some View {
        NavigationStack {
            Group {
                if portfolio.positionen.isEmpty {
                    ContentUnavailableView {
                        Label("Noch keine Karten im Portfolio", systemImage: "briefcase")
                    } description: {
                        Text("Karte suchen, öffnen und oben rechts „Zum Portfolio" tippen. Das Portfolio liegt nur auf diesem Gerät.")
                    }
                } else {
                    liste
                }
            }
            .navigationTitle("Portfolio")
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
            .sheet(item: $bearbeiten) { p in PositionFormular(position: p) }
            .task(id: portfolio.kartenIds) { await laden() }
        }
    }

    private var liste: some View {
        let stand = PortfolioRechnung.stand(portfolio.positionen, preise: preise)
        return List {
            Section { Zusammenfassung(stand: stand, verlauf: verlauf, positionen: portfolio.positionen, laedt: laedt) }
            if let fehler {
                Label(fehler, systemImage: "exclamationmark.triangle").foregroundStyle(Theme.warnung).font(.callout)
            }
            Section("Positionen") {
                ForEach(portfolio.positionen) { p in
                    PositionZeile(position: p, preis: preise[p.karteId], karte: karten[p.karteId])
                        .contentShape(Rectangle())
                        .onTapGesture { bearbeiten = p }
                        .swipeActions {
                            Button(role: .destructive) { portfolio.entfernen([p.id]) } label: { Label("Löschen", systemImage: "trash") }
                        }
                }
            }
            Section {
                Text("Wert: Cardmarket-Preis-Trend (EN/DE/FR/IT/ES/PT sind bei Cardmarket ein Produkt), Stand Vortag. Gespeichert nur auf diesem Gerät. Keine Anlageberatung.")
                    .font(.caption2).foregroundStyle(.secondary)
            }.listRowBackground(Color.clear)
        }
        .refreshable { await laden() }
    }

    private func laden() async {
        let ids = portfolio.kartenIds
        guard !ids.isEmpty else { preise = [:]; verlauf = []; return }
        laedt = true
        defer { laedt = false }
        do {
            async let p = APIClient.shared.preise(ids)
            async let v = APIClient.shared.verlauf(ids, tage: 90)
            let (pa, va) = try await (p, v)
            var neu: [String: Double] = [:]
            var k: [String: Karte] = [:]
            for karte in pa.karten {
                k[karte.id] = karte
                if let preis = karte.preis { neu[karte.id] = preis }
            }
            preise = neu
            karten = k
            verlauf = PortfolioRechnung.verlauf(portfolio.positionen, tageswerte: va.verlauf)
            fehler = nil
        } catch {
            fehler = "Aktuelle Preise konnten nicht geladen werden — angezeigt werden die Kaufpreise."
        }
    }
}

private struct Zusammenfassung: View {
    let stand: PortfolioRechnung.Stand
    let verlauf: [PortfolioRechnung.Punkt]
    let positionen: [Position]
    let laedt: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Depotwert").font(.caption.weight(.bold)).textCase(.uppercase).foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline) {
                Text(Format.euro(stand.wert)).font(.system(size: 34, weight: .bold).monospacedDigit())
                if laedt { ProgressView().padding(.leading, 4) }
            }
            HStack(spacing: 6) {
                Text(Format.euro(stand.gewinn)).foregroundStyle(Theme.trendFarbe(stand.gewinn))
                Text("(\(Format.prozent(stand.gewinnProzent)))").foregroundStyle(Theme.trendFarbe(stand.gewinn))
                Text("seit Kauf").foregroundStyle(.secondary)
            }
            .font(.subheadline.monospacedDigit())
            Text("Investiert: \(Format.euro(stand.investiertGesamt))").font(.caption).foregroundStyle(.secondary)
            if stand.ohnePreis > 0 {
                Label("\(stand.ohnePreis) Position\(stand.ohnePreis == 1 ? "" : "en") ohne aktuellen Preis — nicht im Wert enthalten",
                      systemImage: "exclamationmark.circle")
                    .font(.caption).foregroundStyle(Theme.warnung)
            }
            if verlauf.count >= 2 {
                Chart(verlauf, id: \.tag) { p in
                    LineMark(x: .value("Tag", p.tag), y: .value("Wert", p.wert)).foregroundStyle(Theme.akzent)
                }
                .chartYAxis { AxisMarks(position: .trailing) }
                .frame(height: 140)
                HStack {
                    Text("\(verlauf.count) echte Tageswerte").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    if let e = PortfolioRechnung.entwicklung(verlauf, positionen: positionen) {
                        Text("Entwicklung ohne Zukäufe: \(Format.prozent(e.prozent))")
                            .font(.caption2.monospacedDigit()).foregroundStyle(Theme.trendFarbe(e.betrag))
                    }
                }
            } else {
                Text("Verlauf wird aufgebaut — es braucht mindestens zwei Tage mit echten Werten für alle Karten.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
    }
}

private struct PositionZeile: View {
    let position: Position
    let preis: Double?
    let karte: Karte?

    var body: some View {
        HStack(spacing: 12) {
            KartenBild(quelle: position.bild, breite: 128).frame(width: 40)
            VStack(alignment: .leading, spacing: 3) {
                Text(position.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                Text("\(position.menge) × \(Format.euro(position.kaufpreis)) · \(position.set)")
                    .font(.caption).foregroundStyle(.secondary).lineLimit(1)
                if let karte, !karte.frisch {
                    Label("Stand \(Format.tag(karte.preisStand))", systemImage: "clock").font(.caption2).foregroundStyle(Theme.warnung)
                }
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 3) {
                if let preis {
                    let wert = Double(position.menge) * preis
                    Text(Format.euro(wert)).font(.subheadline.monospacedDigit().weight(.semibold))
                    Text(Format.prozent(position.investiert > 0 ? (wert - position.investiert) / position.investiert * 100 : nil))
                        .font(.caption.monospacedDigit()).foregroundStyle(Theme.trendFarbe(wert - position.investiert))
                } else {
                    Text("kein Preis").font(.caption).foregroundStyle(Theme.warnung)
                }
            }
        }
    }
}

/// Neue Position anlegen oder bestehende bearbeiten.
struct PositionFormular: View {
    @EnvironmentObject private var portfolio: PortfolioSpeicher
    @Environment(\.dismiss) private var schliessen
    @State var position: Position
    var aktuellerPreis: Double?
    @State private var preisText = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack(spacing: 12) {
                        KartenBild(quelle: position.bild, breite: 128).frame(width: 44)
                        VStack(alignment: .leading) {
                            Text(position.name).font(.headline)
                            Text(position.set).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                Section("Kauf") {
                    Stepper("Menge: \(position.menge)", value: $position.menge, in: 1...999)
                    HStack {
                        Text("Preis je Stück")
                        Spacer()
                        TextField("0,00", text: $preisText)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: 120)
                        Text("€")
                    }
                    if let aktuellerPreis {
                        Button("Aktuellen Marktwert übernehmen (\(Format.euro(aktuellerPreis)))") {
                            preisText = Self.zahlText(aktuellerPreis)
                        }
                        .font(.callout)
                    }
                    DatePicker("Kaufdatum", selection: $position.kaufdatum, in: ...Date(), displayedComponents: .date)
                        .environment(\.locale, Locale(identifier: "de_DE"))
                }
            }
            .navigationTitle(portfolio.positionen.contains { $0.id == position.id } ? "Position bearbeiten" : "Zum Portfolio")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { schliessen() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern") {
                        position.kaufpreis = Self.zahl(preisText) ?? 0
                        portfolio.speichern(position)
                        schliessen()
                    }
                    .disabled(Self.zahl(preisText) == nil)
                }
            }
            .onAppear { if position.kaufpreis > 0 { preisText = Self.zahlText(position.kaufpreis) } }
        }
    }

    /// Deutsche Eingabe „12,50" oder „12.50" → 12.5; leer oder ungültig → nil.
    static func zahl(_ text: String) -> Double? {
        let t = text.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: ".", with: "").replacingOccurrences(of: ",", with: ".")
        guard let d = Double(t), d >= 0, d < 10_000_000 else { return nil }
        return d
    }

    static func zahlText(_ d: Double) -> String { String(format: "%.2f", d).replacingOccurrences(of: ".", with: ",") }
}
