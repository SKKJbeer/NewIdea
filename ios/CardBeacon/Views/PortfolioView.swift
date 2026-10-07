import SwiftUI
import Charts

/// Portfolio wie auf der Website: Depotwert mit Zeitraum, Auswertung (Spitzen, Aufteilung, Positionen)
/// und Sammlung (Galerie). Karten werden direkt hier gesucht und hinzugefügt.
struct PortfolioView: View {
    @EnvironmentObject private var portfolio: PortfolioSpeicher
    @State private var preise: [String: Double] = [:]
    @State private var karten: [String: Karte] = [:]
    @State private var tageswerte: [String: [Verlaufspunkt]] = [:]
    @State private var fehler: String?
    @State private var laedt = false
    @State private var bearbeiten: Position?
    @State private var suche = false
    @State private var zeitraum: Zeitraum = .monate3
    @State private var ansicht: Ansicht = .auswertung
    @State private var pfad = NavigationPath()

    enum Zeitraum: Int, CaseIterable, Identifiable {
        case monat = 30, monate3 = 90, jahr = 365
        var id: Int { rawValue }
        var titel: String { switch self { case .monat: "1M"; case .monate3: "3M"; case .jahr: "1J" } }
    }

    enum Ansicht: String, CaseIterable { case auswertung = "Auswertung", sammlung = "Sammlung" }

    var body: some View {
        NavigationStack(path: $pfad) {
            Group {
                if portfolio.positionen.isEmpty { leer } else { inhalt }
            }
            .background(Theme.hintergrund)
            .navigationTitle("Portfolio")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { suche = true } label: { Image(systemName: "plus.circle.fill").font(.title3) }
                        .accessibilityLabel("Karte hinzufügen")
                }
            }
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
            .navigationDestination(for: SetTreffer.self) { SetView(set: $0) }
            .sheet(item: $bearbeiten) { p in PositionFormular(position: p, aktuellerPreis: preise[p.karteId]) }
            .sheet(isPresented: $suche) { KartenAuswahl() }
            .task(id: "\(portfolio.kartenIds.joined(separator: ","))|\(zeitraum.rawValue)") { await laden() }
            .sensoryFeedback(.success, trigger: portfolio.positionen.count)
        }
    }

    // MARK: Leerzustand

    private var leer: some View {
        ScrollView {
            VStack(spacing: 22) {
                ZStack {
                    Circle().fill(Theme.verlauf).frame(width: 96, height: 96).blur(radius: 30).opacity(0.6)
                    Image(systemName: "briefcase.fill").font(.system(size: 40)).foregroundStyle(.white)
                        .frame(width: 84, height: 84)
                        .background(Theme.verlauf, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
                }
                .padding(.top, 40)
                VStack(spacing: 8) {
                    Text("Deine Sammlung im Blick").font(.title2.bold())
                    Text("Karten mit Kaufpreis und Datum erfassen — die App rechnet täglich mit dem Cardmarket-Preis-Trend: Depotwert, Gewinn und Verlust, Verlauf aus echten Tageswerten.")
                        .font(.callout).foregroundStyle(.secondary).multilineTextAlignment(.center)
                }
                AktionsKnopf(titel: "Erste Karte hinzufügen", symbol: "plus") { suche = true }
                    .padding(.horizontal, 30)
                VStack(alignment: .leading, spacing: 12) {
                    merkmal("chart.line.uptrend.xyaxis", "Wertentwicklung", "Zukäufe werden herausgerechnet — nur echte Marktbewegung zählt.")
                    merkmal("square.grid.2x2", "Aufteilung nach Set", "Wo steckt der Wert, welche Sets treiben ihn?")
                    merkmal("lock.shield", "Bleibt auf dem Gerät", "Kein Konto, keine Übertragung des Bestands.")
                }
                .kachel()
                .padding(.horizontal)
            }
            .padding(.bottom, 30)
        }
    }

    private func merkmal(_ symbol: String, _ titel: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol).foregroundStyle(Theme.akzent).frame(width: 28, height: 28)
                .background(Theme.akzent.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 2) {
                Text(titel).font(.subheadline.weight(.semibold))
                Text(text).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: Inhalt

    private var inhalt: some View {
        let stand = PortfolioRechnung.stand(portfolio.positionen, preise: preise)
        let verlauf = PortfolioRechnung.verlauf(portfolio.positionen, tageswerte: tageswerte)
        return ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                DepotKopf(stand: stand, verlauf: verlauf, positionen: portfolio.positionen, laedt: laedt, zeitraum: $zeitraum)
                if let fehler {
                    Label(fehler, systemImage: "exclamationmark.triangle").font(.callout).foregroundStyle(Theme.warnung)
                        .kachel(innen: 12)
                }
                Picker("Ansicht", selection: $ansicht) {
                    ForEach(Ansicht.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)

                if ansicht == .auswertung { auswertung } else { sammlung }

                Text("Wert: Cardmarket-Preis-Trend (EN/DE/FR/IT/ES/PT sind bei Cardmarket ein Produkt), Stand Vortag. Gespeichert nur auf diesem Gerät. Keine Anlageberatung.")
                    .font(.caption2).foregroundStyle(.secondary).padding(.top, 4)
            }
            .padding()
        }
        .refreshable { await laden() }
    }

    @ViewBuilder private var auswertung: some View {
        let spitzen = PortfolioRechnung.spitzen(portfolio.positionen, preise: preise)
        if !spitzen.gewinner.isEmpty || !spitzen.verlierer.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Abschnittsmarke(text: "Seit Kauf")
                HStack(alignment: .top, spacing: 12) {
                    SpitzenSpalte(titel: "Vorne", eintraege: spitzen.gewinner)
                    SpitzenSpalte(titel: "Hinten", eintraege: spitzen.verlierer)
                }
            }
            .kachel()
        }

        let anteile = PortfolioRechnung.aufteilung(portfolio.positionen, preise: preise)
        if anteile.count > 1 {
            AufteilungKachel(anteile: anteile)
        }

        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Abschnittsmarke(text: "Positionen (\(portfolio.positionen.count))")
                Spacer()
                Button { suche = true } label: { Label("Hinzufügen", systemImage: "plus") }.font(.caption.weight(.semibold))
            }
            .padding(.bottom, 8)
            let reihe = PortfolioRechnung.sortiert(portfolio.positionen, preise: preise)
            ForEach(reihe) { p in
                PositionZeile(position: p, preis: preise[p.karteId], karte: karten[p.karteId])
                    .padding(.vertical, 10)
                    .contentShape(Rectangle())
                    .onTapGesture { bearbeiten = p }
                    .contextMenu {
                        Button { bearbeiten = p } label: { Label("Bearbeiten", systemImage: "pencil") }
                        if let k = karten[p.karteId] {
                            Button { pfad.append(k) } label: { Label("Karte öffnen", systemImage: "rectangle.portrait") }
                        }
                        Button(role: .destructive) { portfolio.entfernen([p.id]) } label: { Label("Löschen", systemImage: "trash") }
                    }
                if p.id != reihe.last?.id { Divider().overlay(Theme.rand) }
            }
            Text("Tippen zum Bearbeiten · lange drücken für mehr").font(.caption2).foregroundStyle(.secondary).padding(.top, 6)
        }
        .kachel()
    }

    private var sammlung: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 104), spacing: 12)], spacing: 16) {
            ForEach(PortfolioRechnung.sortiert(portfolio.positionen, preise: preise)) { p in
                Button { bearbeiten = p } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        ZStack(alignment: .topTrailing) {
                            KartenBild(quelle: p.bild, breite: 256).shadow(color: .black.opacity(0.5), radius: 6, y: 3)
                            if p.menge > 1 {
                                Text("×\(p.menge)").font(.caption2.bold()).padding(.horizontal, 6).padding(.vertical, 2)
                                    .background(.black.opacity(0.7), in: Capsule()).padding(4)
                            }
                        }
                        Text(p.name).font(.caption.weight(.semibold)).lineLimit(1)
                        Text(preise[p.karteId].map { Format.euro(Double(p.menge) * $0) } ?? "kein Preis")
                            .font(.caption2.monospacedDigit()).foregroundStyle(preise[p.karteId] == nil ? Theme.warnung : .secondary)
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func laden() async {
        let ids = portfolio.kartenIds
        guard !ids.isEmpty else { preise = [:]; tageswerte = [:]; return }
        laedt = true
        defer { laedt = false }
        do {
            async let p = APIClient.shared.preise(ids)
            async let v = APIClient.shared.verlauf(ids, tage: zeitraum.rawValue)
            let (pa, va) = try await (p, v)
            var neu: [String: Double] = [:]
            var k: [String: Karte] = [:]
            for karte in pa.karten {
                k[karte.id] = karte
                if let preis = karte.preis { neu[karte.id] = preis }
            }
            preise = neu
            karten = k
            tageswerte = va.verlauf
            fehler = nil
        } catch {
            guard !Task.isCancelled else { return }
            fehler = "Aktuelle Preise konnten nicht geladen werden — nach unten ziehen zum Wiederholen."
        }
    }
}

// MARK: - Depotwert

private struct DepotKopf: View {
    let stand: PortfolioRechnung.Stand
    let verlauf: [PortfolioRechnung.Punkt]
    let positionen: [Position]
    let laedt: Bool
    @Binding var zeitraum: PortfolioView.Zeitraum
    @State private var auswahl: Date?

    var body: some View {
        let entwicklung = PortfolioRechnung.entwicklung(verlauf, positionen: positionen)
        let markiert = auswahl.flatMap { a in verlauf.min { abs($0.tag.timeIntervalSince(a)) < abs($1.tag.timeIntervalSince(a)) } }
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Abschnittsmarke(text: markiert.map { "Depotwert am \(Format.tag(Format.isoText($0.tag)))" } ?? "Depotwert")
                Spacer()
                if laedt { ProgressView().controlSize(.small) }
            }
            Text(Format.euro(markiert?.wert ?? stand.wert))
                .font(.system(size: 40, weight: .heavy, design: .rounded).monospacedDigit())
                .contentTransition(.numericText())
            HStack(spacing: 6) {
                Image(systemName: stand.gewinn >= 0 ? "arrow.up.right" : "arrow.down.right")
                Text("\(Format.euro(stand.gewinn)) (\(Format.prozent(stand.gewinnProzent)))")
                Text("seit Kauf").foregroundStyle(.secondary)
            }
            .font(.subheadline.monospacedDigit().weight(.semibold))
            .foregroundStyle(Theme.trendFarbe(stand.gewinn))

            if verlauf.count >= 2 {
                let werte = verlauf.map(\.wert)
                let unten = (werte.min() ?? 0) * 0.98, oben = (werte.max() ?? 1) * 1.02
                Chart {
                    ForEach(verlauf, id: \.tag) { p in
                        AreaMark(x: .value("Tag", p.tag), yStart: .value("Basis", unten), yEnd: .value("Wert", p.wert))
                            .foregroundStyle(LinearGradient(colors: [Theme.akzent.opacity(0.35), .clear], startPoint: .top, endPoint: .bottom))
                            .interpolationMethod(.monotone)
                        LineMark(x: .value("Tag", p.tag), y: .value("Wert", p.wert))
                            .foregroundStyle(Theme.akzent).lineStyle(StrokeStyle(lineWidth: 2.2))
                            .interpolationMethod(.monotone)
                    }
                    if let markiert {
                        RuleMark(x: .value("Tag", markiert.tag)).foregroundStyle(.white.opacity(0.4))
                        PointMark(x: .value("Tag", markiert.tag), y: .value("Wert", markiert.wert)).foregroundStyle(.white)
                    }
                }
                .chartYScale(domain: unten...oben)
                .chartYAxis { AxisMarks(position: .trailing) { _ in
                    AxisGridLine().foregroundStyle(Theme.rand)
                    AxisValueLabel()
                } }
                .chartXAxis { AxisMarks(values: .automatic(desiredCount: 4)) { _ in AxisValueLabel(format: .dateTime.day().month(.abbreviated)) } }
                .chartXSelection(value: $auswahl)
                .frame(height: 170)
                HStack {
                    Text("\(verlauf.count) echte Tageswerte").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    if let entwicklung {
                        Text("Im Zeitraum ohne Zukäufe: \(Format.prozent(entwicklung.prozent))")
                            .font(.caption2.monospacedDigit().weight(.semibold)).foregroundStyle(Theme.trendFarbe(entwicklung.betrag))
                    }
                }
            } else {
                Text("Verlauf wird aufgebaut — es braucht mindestens zwei Tage mit echten Werten für alle Karten im Zeitraum.")
                    .font(.caption).foregroundStyle(.secondary)
            }

            Picker("Zeitraum", selection: $zeitraum) {
                ForEach(PortfolioView.Zeitraum.allCases) { Text($0.titel).tag($0) }
            }
            .pickerStyle(.segmented)

            Divider().overlay(Theme.rand)
            HStack {
                kennzahl("Investiert", Format.euro(stand.investiertGesamt))
                kennzahl("Positionen", Format.anzahl(positionen.count))
                kennzahl("Karten", Format.anzahl(positionen.reduce(0) { $0 + $1.menge }))
            }
            if stand.ohnePreis > 0 {
                Label("\(stand.ohnePreis) Position\(stand.ohnePreis == 1 ? "" : "en") ohne aktuellen Preis — nicht im Wert enthalten",
                      systemImage: "exclamationmark.circle")
                    .font(.caption).foregroundStyle(Theme.warnung)
            }
        }
        .kachel(innen: 18)
        .animation(.snappy, value: stand.wert)
    }

    private func kennzahl(_ titel: String, _ wert: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(titel).font(.caption2).foregroundStyle(.secondary)
            Text(wert).font(.subheadline.monospacedDigit().weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Auswertung

private struct SpitzenSpalte: View {
    let titel: String
    let eintraege: [PortfolioRechnung.Leistung]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(titel).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            if eintraege.isEmpty {
                Text("—").font(.caption).foregroundStyle(.secondary)
            }
            ForEach(eintraege) { l in
                HStack(spacing: 8) {
                    KartenBild(quelle: l.position.bild, breite: 128).frame(width: 26)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(l.position.name).font(.caption.weight(.semibold)).lineLimit(1)
                        Text(Format.prozent(l.prozent)).font(.caption2.monospacedDigit().weight(.bold))
                            .foregroundStyle(Theme.trendFarbe(l.gewinn))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct AufteilungKachel: View {
    let anteile: [PortfolioRechnung.SetAnteil]
    private let farben: [Color] = [Theme.akzent, Theme.fuchsia, Theme.aufwaerts, Theme.warnung,
                                   Color(red: 0.38, green: 0.65, blue: 0.98), .secondary]

    var body: some View {
        let gezeigt = Array(anteile.prefix(5))
        let rest = anteile.dropFirst(5).reduce(0) { $0 + $1.anteil }
        VStack(alignment: .leading, spacing: 12) {
            Abschnittsmarke(text: "Aufteilung nach Set")
            GeometryReader { geo in
                HStack(spacing: 2) {
                    ForEach(Array(gezeigt.enumerated()), id: \.element.id) { i, a in
                        farben[i].frame(width: max(3, geo.size.width * a.anteil / 100))
                    }
                    if rest > 0 { farben[5].opacity(0.4).frame(width: max(3, geo.size.width * rest / 100)) }
                }
                .clipShape(Capsule())
            }
            .frame(height: 10)
            ForEach(Array(gezeigt.enumerated()), id: \.element.id) { i, a in
                HStack(spacing: 8) {
                    Circle().fill(farben[i]).frame(width: 8, height: 8)
                    Text(a.name).font(.caption).lineLimit(1)
                    Text("· \(Format.anzahl(a.karten)) Karte\(a.karten == 1 ? "" : "n")").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    Text(Format.euro(a.wert)).font(.caption.monospacedDigit())
                    Text(Format.zahl(a.anteil, stellen: 0) + "\u{00A0}%").font(.caption.monospacedDigit().weight(.semibold))
                        .frame(width: 44, alignment: .trailing)
                }
            }
            if rest > 0 {
                Text("Weitere Sets: \(Format.zahl(rest, stellen: 0))\u{00A0}%").font(.caption2).foregroundStyle(.secondary)
            }
        }
        .kachel()
    }
}

private struct PositionZeile: View {
    let position: Position
    let preis: Double?
    let karte: Karte?

    var body: some View {
        HStack(spacing: 12) {
            KartenBild(quelle: position.bild, breite: 128).frame(width: 42)
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
                        .font(.caption.monospacedDigit().weight(.semibold)).foregroundStyle(Theme.trendFarbe(wert - position.investiert))
                } else {
                    Text("kein Preis").font(.caption).foregroundStyle(Theme.warnung)
                }
            }
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Karte suchen und hinzufügen

/// Suche im Portfolio selbst — Treffer antippen, Kauf erfassen, fertig.
struct KartenAuswahl: View {
    @EnvironmentObject private var portfolio: PortfolioSpeicher
    @Environment(\.dismiss) private var schliessen
    @State private var begriff = ""
    @State private var treffer: [Karte] = []
    @State private var fehler: String?
    @State private var laedt = false

    var body: some View {
        NavigationStack {
            List {
                if let fehler {
                    Label(fehler, systemImage: "exclamationmark.triangle").foregroundStyle(Theme.warnung)
                }
                if begriff.trimmingCharacters(in: .whitespaces).count < 2 {
                    Text("Kartenname eingeben, z. B. „Glurak ex“, „Umbreon VMAX“ oder „Pikachu 151“.")
                        .font(.callout).foregroundStyle(.secondary).listRowBackground(Color.clear)
                } else if treffer.isEmpty && !laedt && fehler == nil {
                    Text("Keine Karte gefunden. Tipp: englischer Kartenname.").font(.callout).foregroundStyle(.secondary)
                }
                ForEach(treffer) { k in
                    NavigationLink(value: k) {
                        HStack {
                            KartenZeile(karte: k)
                            if portfolio.kartenIds.contains(k.id) {
                                Image(systemName: "briefcase.fill").foregroundStyle(Theme.akzent).font(.caption)
                            }
                        }
                    }
                    .listRowBackground(Theme.karte)
                }
            }
            .dunkleListe()
            .overlay { if laedt && treffer.isEmpty { ProgressView() } }
            .navigationTitle("Karte hinzufügen")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $begriff, placement: .navigationBarDrawer(displayMode: .always), prompt: "Kartenname")
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .task(id: begriff) { await suchen() }
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Fertig") { schliessen() } } }
            .navigationDestination(for: Karte.self) { k in
                PositionFormularInhalt(position: Position.neu(aus: k), aktuellerPreis: k.preis, fertig: { schliessen() })
            }
        }
    }

    private func suchen() async {
        let q = begriff.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else { treffer = []; fehler = nil; return }
        try? await Task.sleep(nanoseconds: 300_000_000)
        guard !Task.isCancelled else { return }
        laedt = true
        defer { laedt = false }
        do {
            let r = try await APIClient.shared.suche(q)
            guard !Task.isCancelled else { return }
            treffer = r.karten
            fehler = nil
        } catch {
            guard !Task.isCancelled else { return }
            fehler = (error as? LocalizedError)?.errorDescription ?? "Suche fehlgeschlagen."
        }
    }
}

extension Position {
    static func neu(aus k: Karte) -> Position {
        Position(karteId: k.id, name: k.anzeigeName, set: k.set, setCode: k.setCode, bild: k.bild,
                 menge: 1, kaufpreis: 0, kaufdatum: Date())
    }
}

// MARK: - Formular

/// Eigenes Blatt (Bearbeiten, Kartenseite).
struct PositionFormular: View {
    @Environment(\.dismiss) private var schliessen
    let position: Position
    var aktuellerPreis: Double?

    var body: some View {
        NavigationStack {
            PositionFormularInhalt(position: position, aktuellerPreis: aktuellerPreis, mitAbbrechen: true, fertig: { schliessen() })
        }
    }
}

/// Neue Position anlegen oder bestehende bearbeiten.
struct PositionFormularInhalt: View {
    @EnvironmentObject private var portfolio: PortfolioSpeicher
    @State var position: Position
    var aktuellerPreis: Double?
    var mitAbbrechen = false
    let fertig: () -> Void
    @State private var preisText = ""
    @State private var loeschenFragen = false

    private var vorhanden: Bool { portfolio.positionen.contains { $0.id == position.id } }

    var body: some View {
        Form {
            Section {
                HStack(spacing: 14) {
                    KartenBild(quelle: position.bild, breite: 256).frame(width: 64)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(position.name).font(.headline)
                        Text(position.set).font(.caption).foregroundStyle(.secondary)
                        if let aktuellerPreis {
                            Text("Marktwert \(Format.euro(aktuellerPreis))").font(.caption.monospacedDigit().weight(.semibold))
                                .foregroundStyle(Theme.akzent)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
            .listRowBackground(Theme.karte)
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
                    Button("Marktwert übernehmen (\(Format.euro(aktuellerPreis)))") { preisText = Self.zahlText(aktuellerPreis) }
                        .font(.callout)
                }
                DatePicker("Kaufdatum", selection: $position.kaufdatum, in: ...Date(), displayedComponents: .date)
                    .environment(\.locale, Locale(identifier: "de_DE"))
                if let z = Self.zahl(preisText), z > 0 {
                    LabeledContent("Investiert", value: Format.euro(Double(position.menge) * z)).monospacedDigit()
                }
            }
            .listRowBackground(Theme.karte)
            if vorhanden {
                Section {
                    Button("Position löschen", role: .destructive) { loeschenFragen = true }
                }
                .listRowBackground(Theme.karte)
            }
        }
        .dunkleListe()
        .navigationTitle(vorhanden ? "Position bearbeiten" : "Zum Portfolio")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if mitAbbrechen {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { fertig() } }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Speichern") {
                    position.kaufpreis = Self.zahl(preisText) ?? 0
                    portfolio.speichern(position)
                    fertig()
                }
                .fontWeight(.semibold)
                .disabled(Self.zahl(preisText) == nil)
            }
        }
        .confirmationDialog("Position löschen?", isPresented: $loeschenFragen, titleVisibility: .visible) {
            Button("Löschen", role: .destructive) { portfolio.entfernen([position.id]); fertig() }
        }
        .onAppear { if position.kaufpreis > 0 { preisText = Self.zahlText(position.kaufpreis) } }
    }

    /// Deutsche Eingabe „12,50" oder „12.50" → 12.5; leer oder ungültig → nil.
    static func zahl(_ text: String) -> Double? {
        var t = text.trimmingCharacters(in: .whitespaces)
        if t.contains(",") { t = t.replacingOccurrences(of: ".", with: "").replacingOccurrences(of: ",", with: ".") }
        guard let d = Double(t), d >= 0, d < 10_000_000 else { return nil }
        return d
    }

    static func zahlText(_ d: Double) -> String { String(format: "%.2f", d).replacingOccurrences(of: ".", with: ",") }
}
