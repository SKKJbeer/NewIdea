import SwiftUI
import Charts

/// Startseite der App — dieselben Bausteine wie cardbeacon.de: Index, Marktbreite,
/// Bewegungen, Set-Bewegung, Neuheiten, Wochenbericht.
struct MarktView: View {
    @State private var infoOffen = false

    var body: some View {
        NavigationStack {
            Laden(laden: { try await APIClient.shared.markt() }) { markt in
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        IndexHeld(markt: markt)
                        if let b = markt.breite { BreiteKachel(breite: b) }
                        Karussell(titel: "Aufwärts · 30 Tage", karten: markt.aufwaerts)
                        Karussell(titel: "Abwärts · 30 Tage", karten: markt.abwaerts)
                        if let sets = markt.setBewegung, !sets.isEmpty { SetBewegungKachel(sets: sets) }
                        if let n = markt.neuheiten { NeuheitenKachel(neuheiten: n) }
                        NavigationLink(value: LesenView.Ziel.bericht) {
                            HStack {
                                Image(systemName: "doc.text.magnifyingglass").font(.title2).foregroundStyle(Theme.akzent)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Marktbericht der Woche").font(.headline)
                                    Text("Marktlage, Trends, Neuheiten, Ausblick").font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(.secondary)
                            }
                            .kachel()
                        }
                        .buttonStyle(.plain)
                        PreisHinweis()
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                }
                .background(Theme.hintergrund)
            }
            .background(Theme.hintergrund)
            .navigationTitle("Markt")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { infoOffen = true } label: { Image(systemName: "info.circle") }
                        .accessibilityLabel("Info und Hinweise")
                }
            }
            .sheet(isPresented: $infoOffen) { InfoView() }
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
            .navigationDestination(for: SetTreffer.self) { SetView(set: $0) }
            .navigationDestination(for: LesenView.Ziel.self) { ziel in
                switch ziel {
                case .bericht: BerichtView()
                case .artikel(let d): ArtikelView(datum: d)
                case .guide(let s): GuideView(slug: s)
                }
            }
        }
    }
}

private struct IndexHeld: View {
    let markt: Markt

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Abschnittsmarke(text: "CardBeacon Index")
                Spacer()
                if let s = markt.datenStand { Text("Stand \(Format.tag(s))").font(.caption2).foregroundStyle(.secondary) }
            }
            if let index = markt.index {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text(Format.prozent(index.wert)).font(.system(size: 46, weight: .heavy).monospacedDigit())
                        .foregroundStyle(Theme.trendFarbe(index.wert))
                    if let v = markt.vorwoche {
                        let diff = index.wert - v.wert
                        Text("\(diff >= 0 ? "+" : "\u{2212}")\(Format.zahl(abs(diff)))\u{00A0}Pp. ggü. Vorwoche")
                            .font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                    }
                }
                Text("Median der \(index.fensterTage)-Tage-Bewegung über \(Format.anzahl(index.karten)) Karten aus \(index.sets) Sets")
                    .font(.caption).foregroundStyle(.secondary)
                EinfachErklaert(text: "Die typische Karte kostet gerade \(Format.zahl(abs(index.wert)))\u{00A0}% \(index.wert >= 0 ? "mehr" : "weniger") als im Schnitt der letzten \(index.fensterTage) Tage. Die Hälfte aller Karten liegt darüber, die andere Hälfte darunter.")
                let punkte = markt.indexVerlauf.compactMap { p in p.tag.map { (tag: $0, wert: p.wert) } }
                if punkte.count >= 2 {
                    Chart(punkte, id: \.tag) { p in
                        AreaMark(x: .value("Tag", p.tag), y: .value("Index", p.wert))
                            .foregroundStyle(LinearGradient(colors: [Theme.akzent.opacity(0.35), .clear], startPoint: .top, endPoint: .bottom))
                        LineMark(x: .value("Tag", p.tag), y: .value("Index", p.wert)).foregroundStyle(Theme.akzent)
                    }
                    .chartYAxis { AxisMarks(position: .trailing) }
                    .frame(height: 130)
                    Text("\(punkte.count) echte Tagesstände").font(.caption2).foregroundStyle(.secondary)
                }
            } else {
                Text("Kein aktueller Indexstand — er entsteht nur aus Preisen, die höchstens drei Tage alt sind.")
                    .font(.callout).foregroundStyle(.secondary)
            }
        }
        .kachel()
        .overlay(alignment: .top) {
            Theme.verlauf.frame(height: 3).clipShape(Capsule()).padding(.horizontal, 18)
        }
    }
}

private struct BreiteKachel: View {
    let breite: Markt.Breite

    var body: some View {
        let anteil = breite.gesamt > 0 ? Double(breite.steigend) / Double(breite.gesamt) : 0
        VStack(alignment: .leading, spacing: 10) {
            Abschnittsmarke(text: "Marktbreite")
            Text("\(Format.zahl(anteil * 100, stellen: 0))\u{00A0}% der Karten im Plus").font(.title3.bold())
            GeometryReader { g in
                HStack(spacing: 2) {
                    Theme.aufwaerts.frame(width: g.size.width * anteil)
                    Theme.abwaerts
                }
                .clipShape(Capsule())
            }
            .frame(height: 10)
            HStack {
                Text("\(Format.anzahl(breite.steigend)) steigend").foregroundStyle(Theme.aufwaerts)
                Spacer()
                Text("\(Format.anzahl(breite.fallend)) fallend").foregroundStyle(Theme.abwaerts)
            }
            .font(.caption.monospacedDigit())
            Text("30-Tage-Bewegung aller gemessenen Karten").font(.caption2).foregroundStyle(.secondary)
        }
        .kachel()
    }
}

private struct Karussell: View {
    let titel: String
    let karten: [Karte]

    var body: some View {
        if !karten.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Abschnittsmarke(text: titel)
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(alignment: .top, spacing: 14) {
                        ForEach(karten) { k in
                            NavigationLink(value: k) { KartenKachel(karte: k) }.buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
}

private struct SetBewegungKachel: View {
    let sets: [Markt.SetBewegung]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Abschnittsmarke(text: "Set-Bewegung · Median 30 Tage")
            ForEach(Array(sets.prefix(4)) + Array(sets.suffix(min(3, max(0, sets.count - 4))))) { s in
                NavigationLink(value: SetTreffer(setCode: s.setCode, name: s.name)) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(s.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                            Text("\(s.karten) Karten\(s.datum.map { " · seit \(Format.tag($0))" } ?? "")")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(Format.prozent(s.median)).font(.subheadline.monospacedDigit().weight(.semibold))
                            .foregroundStyle(Theme.trendFarbe(s.median))
                    }
                }
                .buttonStyle(.plain)
                Divider().overlay(Theme.rand)
            }
        }
        .kachel()
    }
}

private struct NeuheitenKachel: View {
    let neuheiten: Markt.Neuheiten

    var body: some View {
        if !(neuheiten.neu.isEmpty && neuheiten.kommend.isEmpty && neuheiten.japan.isEmpty) {
            VStack(alignment: .leading, spacing: 12) {
                Abschnittsmarke(text: "Trends & Neuheiten")
                ForEach(neuheiten.neu) { s in
                    NavigationLink(value: SetTreffer(setCode: s.setCode, name: s.name)) {
                        zeile(logo: s.logo, titel: s.name, unter: "Neu · erschienen \(Format.tag(s.datum))", symbol: "sparkles")
                    }.buttonStyle(.plain)
                }
                ForEach(neuheiten.kommend) { s in
                    zeile(logo: s.logo, titel: s.name, unter: "Angekündigt · \(Format.tag(s.datum))", symbol: "calendar")
                }
                ForEach(neuheiten.japan.prefix(3)) { s in
                    zeile(logo: nil, titel: s.nameEn ?? s.name, unter: "In Japan zuerst · \(Format.tag(s.datum)) · \(s.karten) Karten", symbol: "globe.asia.australia")
                }
            }
            .kachel()
        }
    }

    private func zeile(logo: String?, titel: String, unter: String, symbol: String) -> some View {
        HStack(spacing: 12) {
            if logo != nil { SetLogo(url: logo, hoehe: 28).frame(width: 64) }
            else { Image(systemName: symbol).font(.title3).foregroundStyle(Theme.akzent).frame(width: 64) }
            VStack(alignment: .leading, spacing: 2) {
                Text(titel).font(.subheadline.weight(.semibold)).lineLimit(1)
                Text(unter).font(.caption2).foregroundStyle(.secondary)
            }
            Spacer()
        }
    }
}

/// Ein Satz für alle, die keine Marktbegriffe kennen — aufklappbar.
struct EinfachErklaert: View {
    let text: String
    @State private var offen = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button { withAnimation(.snappy) { offen.toggle() } } label: {
                Label("Einfach erklärt", systemImage: offen ? "chevron.up.circle.fill" : "questionmark.circle.fill")
                    .font(.caption.weight(.semibold)).foregroundStyle(Theme.akzent)
            }
            .buttonStyle(.plain)
            if offen {
                Text(text).font(.callout).fixedSize(horizontal: false, vertical: true)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
}
