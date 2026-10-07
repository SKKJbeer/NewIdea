import SwiftUI

struct SucheView: View {
    @State private var begriff = ""
    @State private var ergebnis: Suchergebnis?
    @State private var fehler: String?
    @State private var laedt = false
    @State private var sets: [SetEintrag] = []
    @State private var setsFehler: String?

    var body: some View {
        NavigationStack {
            Group {
                if begriff.trimmingCharacters(in: .whitespaces).count >= 2 { treffer } else { setUebersicht }
            }
            .background(Theme.hintergrund)
            .navigationTitle("Suche")
            .searchable(text: $begriff, placement: .navigationBarDrawer(displayMode: .always), prompt: "Karte oder Set")
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .task(id: begriff) { await suchen() }
            .task { await setsLaden() }
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
            .navigationDestination(for: SetTreffer.self) { SetView(set: $0) }
        }
    }

    private var treffer: some View {
        List {
            if let fehler {
                Label(fehler, systemImage: "exclamationmark.triangle").foregroundStyle(Theme.warnung).listRowBackground(Theme.karte)
            }
            if let ergebnis {
                if !ergebnis.sets.isEmpty {
                    Section {
                        ForEach(ergebnis.sets) { s in
                            NavigationLink(value: s) {
                                HStack(spacing: 12) {
                                    SetLogo(url: sets.first { $0.setCode == s.setCode }?.logo, hoehe: 26).frame(width: 60)
                                    Text(s.name).font(.subheadline.weight(.semibold))
                                }
                            }
                            .listRowBackground(Theme.karte)
                        }
                    } header: { Abschnittsmarke(text: "Sets") }
                }
                Section {
                    if ergebnis.karten.isEmpty {
                        Text("Keine Karten für „\(begriff)“ gefunden. Tipp: englischer Kartenname (z. B. „Charizard“).")
                            .font(.callout).foregroundStyle(.secondary)
                    }
                    ForEach(ergebnis.karten) { k in
                        NavigationLink(value: k) { KartenZeile(karte: k) }.listRowBackground(Theme.karte)
                    }
                } header: { Abschnittsmarke(text: "Karten") }
            }
        }
        .dunkleListe()
        .overlay { if laedt && ergebnis == nil { ProgressView() } }
    }

    /// Ohne Suchbegriff: alle Sets, neueste zuerst — wie /sets auf der Website.
    private var setUebersicht: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if let setsFehler {
                    Label(setsFehler, systemImage: "exclamationmark.triangle").font(.callout).foregroundStyle(Theme.warnung)
                        .kachel(innen: 12)
                }
                if sets.isEmpty && setsFehler == nil {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                }
                ForEach(gruppiert, id: \.serie) { gruppe in
                    Abschnittsmarke(text: gruppe.serie).padding(.top, 6)
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 12)], spacing: 12) {
                        ForEach(gruppe.sets) { s in
                            NavigationLink(value: s.alsTreffer) { SetKachel(set: s) }.buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding()
        }
        .refreshable { await setsLaden() }
    }

    /// Serien in der Reihenfolge ihres neuesten Sets.
    private var gruppiert: [(serie: String, sets: [SetEintrag])] {
        var reihenfolge: [String] = []
        var nachSerie: [String: [SetEintrag]] = [:]
        for s in sets {
            let serie = s.serie.isEmpty ? "Weitere" : s.serie
            if nachSerie[serie] == nil { reihenfolge.append(serie) }
            nachSerie[serie, default: []].append(s)
        }
        return reihenfolge.map { ($0, nachSerie[$0] ?? []) }
    }

    private func setsLaden() async {
        do {
            sets = try await APIClient.shared.sets().sets
            setsFehler = nil
        } catch {
            if sets.isEmpty { setsFehler = (error as? LocalizedError)?.errorDescription ?? "Sets konnten nicht geladen werden." }
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

private struct SetKachel: View {
    let set: SetEintrag

    var body: some View {
        VStack(spacing: 8) {
            SetLogo(url: set.logo, hoehe: 46).frame(maxWidth: .infinity).padding(.top, 4)
            Text(set.name).font(.caption.weight(.semibold)).lineLimit(2).multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
            Text([set.datum.map { Format.tag($0) }, set.karten > 0 ? "\(Format.anzahl(set.karten)) Karten" : nil]
                    .compactMap { $0 }.joined(separator: " · "))
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, minHeight: 120)
        .background(Theme.karte, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.rand))
    }
}

struct SetView: View {
    let set: SetTreffer
    @State private var sortierung: Sortierung = .preis

    enum Sortierung: String, CaseIterable { case preis = "Preis", bewegung = "Bewegung", nummer = "Nummer" }

    var body: some View {
        Laden(laden: { try await APIClient.shared.setKarten(set.setCode) }) { detail in
            List {
                Section {
                    VStack(spacing: 10) {
                        Text(detail.name).font(.title3.bold())
                        let mitPreis = detail.karten.filter { $0.preis != nil }
                        Text("\(Format.anzahl(detail.karten.count)) Karten · \(Format.anzahl(mitPreis.count)) mit Preis · Summe Einzelpreise \(Format.euro(mitPreis.reduce(0) { $0 + ($1.preis ?? 0) }))")
                            .font(.caption.monospacedDigit()).foregroundStyle(.secondary).multilineTextAlignment(.center)
                        Picker("Sortierung", selection: $sortierung) {
                            ForEach(Sortierung.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                        }
                        .pickerStyle(.segmented)
                    }
                    .frame(maxWidth: .infinity)
                    .listRowBackground(Color.clear)
                }
                Section {
                    ForEach(sortiert(detail.karten)) { k in
                        NavigationLink(value: k) { KartenZeile(karte: k) }.listRowBackground(Theme.karte)
                    }
                }
                Section { PreisHinweis() }.listRowBackground(Color.clear)
            }
            .dunkleListe()
        }
        .background(Theme.hintergrund)
        .navigationTitle(set.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sortiert(_ karten: [Karte]) -> [Karte] {
        switch sortierung {
        case .preis: return karten.sorted { ($0.preis ?? -1) > ($1.preis ?? -1) }
        case .bewegung: return karten.sorted { ($0.trend30 ?? -.infinity) > ($1.trend30 ?? -.infinity) }
        case .nummer:
            return karten.sorted {
                let a = Int($0.nummer?.filter(\.isNumber) ?? "") ?? .max, b = Int($1.nummer?.filter(\.isNumber) ?? "") ?? .max
                return a == b ? ($0.nummer ?? "") < ($1.nummer ?? "") : a < b
            }
        }
    }
}
