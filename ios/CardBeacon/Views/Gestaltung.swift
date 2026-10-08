import SwiftUI

// GESTALTUNG — gemeinsame Bausteine für alle Lese- und Übersichtsflächen.
// Gleiche Idee wie <Prose>/<Reveal> auf der Website: Jeder Text bekommt dieselbe
// Anmutung, ohne dass die Texterzeugung davon wissen muss.

/// Drei Kartenbilder, leicht aufgefächert — visueller Anker für Kopfbereiche.
struct KartenFaecher: View {
    let bilder: [String]
    var breite: CGFloat = 96

    var body: some View {
        let gezeigt = Array(bilder.prefix(3))
        ZStack {
            ForEach(Array(gezeigt.enumerated()), id: \.offset) { i, bild in
                let mitte = Double(gezeigt.count - 1) / 2
                let versatz = Double(i) - mitte
                KartenBild(quelle: bild, breite: 256)
                    .frame(width: breite)
                    .shadow(color: .black.opacity(0.55), radius: 10, y: 6)
                    .rotationEffect(.degrees(versatz * 11))
                    .offset(x: versatz * breite * 0.55, y: abs(versatz) * 10)
                    .zIndex(i == gezeigt.count / 2 ? 1 : 0)
            }
        }
        .frame(height: breite * 88 / 63 + 24)
        .accessibilityHidden(true)
    }
}

/// Kopfbereich für Lese-Seiten: Verlauf, Lichtschein, Plakette, Titel, Kartenfächer.
struct LeseKopf: View {
    let plakette: String
    let symbol: String
    let titel: String
    var untertitel: String? = nil
    var bilder: [String] = []
    var farbe: Color = Theme.akzent

    var body: some View {
        VStack(spacing: 14) {
            if !bilder.isEmpty {
                KartenFaecher(bilder: bilder).padding(.top, 8)
            } else {
                Image(systemName: symbol)
                    .font(.system(size: 34, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 78, height: 78)
                    .background(LinearGradient(colors: [farbe, Theme.fuchsia], startPoint: .topLeading, endPoint: .bottomTrailing),
                                in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                    .shadow(color: farbe.opacity(0.5), radius: 18, y: 6)
                    .padding(.top, 12)
            }
            Label(plakette, systemImage: symbol)
                .font(.caption.weight(.bold))
                .padding(.horizontal, 10).padding(.vertical, 5)
                .background(farbe.opacity(0.14), in: Capsule())
                .overlay(Capsule().stroke(farbe.opacity(0.3)))
                .foregroundStyle(farbe)
            Text(titel)
                .font(.system(.title, design: .rounded).weight(.heavy))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            if let untertitel {
                Text(untertitel).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal)
        .padding(.bottom, 22)
        .background {
            ZStack {
                LinearGradient(colors: [Color(red: 0.06, green: 0.06, blue: 0.11), Theme.hintergrund], startPoint: .top, endPoint: .bottom)
                Circle().fill(farbe.opacity(0.35)).frame(width: 260).blur(radius: 90).offset(x: -90, y: -60)
                Circle().fill(Theme.fuchsia.opacity(0.22)).frame(width: 220).blur(radius: 90).offset(x: 110, y: 10)
            }
            .ignoresSafeArea(edges: .top)
        }
    }
}

/// Runde Plakette mit Zahl oder Symbol.
struct Medaillon: View {
    var nummer: Int? = nil
    var symbol: String? = nil

    var body: some View {
        Group {
            if let symbol { Image(systemName: symbol).font(.system(size: 15, weight: .bold)) }
            else { Text("\(nummer ?? 0)").font(.system(size: 15, weight: .heavy, design: .rounded)) }
        }
        .foregroundStyle(.white)
        .frame(width: 34, height: 34)
        .background(Theme.verlauf, in: Circle())
        .shadow(color: Theme.akzent.opacity(0.45), radius: 8, y: 3)
    }
}

/// Abschnitt als Karte: Verlaufsleiste, Medaillon, Überschrift, Text, optionaler Zusatz.
struct AbschnittKarte<Zusatz: View>: View {
    let nummer: Int
    var symbol: String? = nil
    let ueberschrift: String
    let text: String
    @ViewBuilder var zusatz: () -> Zusatz

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 12) {
                Medaillon(nummer: nummer, symbol: symbol)
                Text(ueberschrift).font(.system(.title3, design: .rounded).weight(.bold))
                    .fixedSize(horizontal: false, vertical: true)
            }
            Fliesstext(text: text)
            zusatz()
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.karte, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.rand))
        .overlay(alignment: .top) {
            Theme.verlauf.frame(height: 3).clipShape(Capsule()).padding(.horizontal, 22)
        }
        .einblenden()
    }
}

extension AbschnittKarte where Zusatz == EmptyView {
    init(nummer: Int, symbol: String? = nil, ueberschrift: String, text: String) {
        self.init(nummer: nummer, symbol: symbol, ueberschrift: ueberschrift, text: text) { EmptyView() }
    }
}

/// Sanftes Einblenden beim ersten Erscheinen (bei „Bewegung reduzieren" sofort sichtbar).
private struct Einblenden: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var ruhig
    @State private var sichtbar = false

    func body(content: Content) -> some View {
        content
            .opacity(ruhig || sichtbar ? 1 : 0)
            .offset(y: ruhig || sichtbar ? 0 : 14)
            .onAppear { withAnimation(.easeOut(duration: 0.45)) { sichtbar = true } }
    }
}

extension View {
    func einblenden() -> some View { modifier(Einblenden()) }
}

/// Karte aus einem Text: großes Bild, Name, Seltenheit, Preis mit Stand.
struct InhaltKarteKachel: View {
    let karte: InhaltKarte
    var stand: String? = nil
    var breite: CGFloat = 132
    @State private var gross = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button { gross = true } label: {
                KartenBild(quelle: karte.bild, breite: 384)
                    .frame(width: breite)
                    .shadow(color: .black.opacity(0.5), radius: 8, y: 4)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(karte.name) groß anzeigen")
            Text(karte.name).font(.caption.weight(.semibold)).lineLimit(2)
            if let s = karte.set ?? karte.seltenheit {
                Text(s).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            }
            if let preis = karte.preis {
                HStack(spacing: 5) {
                    Text(Format.euro(preis)).font(.caption.monospacedDigit().weight(.semibold))
                    if let t = karte.trend30 { TrendPille(wert: t) }
                }
                if let stand { Text("Stand \(stand)").font(.caption2).foregroundStyle(.tertiary) }
            }
        }
        .frame(width: breite, alignment: .leading)
        .fullScreenCover(isPresented: $gross) { KartenVollbild(bild: karte.bild, titel: karte.name) }
    }
}

/// „+12,3 %" als farbige Pille.
struct TrendPille: View {
    let wert: Double

    var body: some View {
        Text(Format.prozent(wert)).font(.caption2.monospacedDigit().weight(.bold))
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(Theme.trendFarbe(wert).opacity(0.15), in: Capsule())
            .foregroundStyle(Theme.trendFarbe(wert))
    }
}

/// Waagerechter Bildstreifen mit Überschrift.
struct KartenStreifen: View {
    let titel: String
    var symbol: String = "rectangle.portrait.on.rectangle.portrait.angled"
    let karten: [InhaltKarte]
    var stand: String? = nil

    var body: some View {
        if !karten.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Label(titel, systemImage: symbol).font(.headline).foregroundStyle(.primary)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: 14) {
                        ForEach(karten, id: \.schluessel) { InhaltKarteKachel(karte: $0, stand: stand) }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
}

/// Bewegungen als waagerechte Balken — Wert steht am Balken, kein Hover nötig (Stolperstelle 41).
struct TrendBalken: View {
    let titel: String
    let karten: [InhaltKarte]
    @State private var gefuellt = false

    var body: some View {
        let mitWert = karten.filter { $0.trend30 != nil }.prefix(6)
        let groesste = mitWert.map { abs($0.trend30 ?? 0) }.max() ?? 1
        if !mitWert.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Abschnittsmarke(text: titel)
                ForEach(Array(mitWert), id: \.schluessel) { k in
                    let wert = k.trend30 ?? 0
                    HStack(spacing: 10) {
                        KartenBild(quelle: k.bild, breite: 128).frame(width: 30)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(k.name).font(.caption.weight(.semibold)).lineLimit(1)
                            GeometryReader { g in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Theme.rand.opacity(0.5))
                                    Capsule()
                                        .fill(LinearGradient(colors: [Theme.trendFarbe(wert).opacity(0.6), Theme.trendFarbe(wert)],
                                                             startPoint: .leading, endPoint: .trailing))
                                        .frame(width: max(6, g.size.width * (gefuellt ? abs(wert) / groesste : 0)))
                                        .shadow(color: Theme.trendFarbe(wert).opacity(0.5), radius: 5)
                                }
                            }
                            .frame(height: 8)
                        }
                        Text(Format.prozent(wert)).font(.caption.monospacedDigit().weight(.bold))
                            .foregroundStyle(Theme.trendFarbe(wert)).frame(width: 70, alignment: .trailing)
                    }
                }
                Text("Preis gegen Ø 30 Tage, Stand des Berichts").font(.caption2).foregroundStyle(.secondary)
            }
            .kachel()
            .onAppear { withAnimation(.easeOut(duration: 0.8).delay(0.1)) { gefuellt = true } }
        }
    }
}

/// „Das Wichtigste" — Häkchenliste auf getönter Fläche.
struct KernpunkteKarte: View {
    let punkte: [String]

    var body: some View {
        if !punkte.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Label("Das Wichtigste in Kürze", systemImage: "checklist").font(.headline)
                ForEach(punkte, id: \.self) { p in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.aufwaerts)
                        Text(p).font(.callout).fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(LinearGradient(colors: [Theme.akzent.opacity(0.16), Theme.fuchsia.opacity(0.08)],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
                        in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.akzent.opacity(0.3)))
            .einblenden()
        }
    }
}

/// Tipp-Kasten mit Glühbirne.
struct TippKasten: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "lightbulb.fill").foregroundStyle(Theme.warnung)
            Text(text).font(.callout).fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.warnung.opacity(0.08), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.warnung.opacity(0.25)))
    }
}

/// Karte im Vollbild, zum Heranzoomen (Zwei-Finger-Geste).
struct KartenVollbild: View {
    let bild: String
    let titel: String
    @Environment(\.dismiss) private var schliessen
    @State private var zoom: CGFloat = 1

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            KartenBild(quelle: bild, breite: 1024)
                .padding(24)
                .scaleEffect(zoom)
                .gesture(MagnificationGesture().onChanged { zoom = min(max($0, 1), 4) }.onEnded { _ in withAnimation(.spring) { zoom = 1 } })
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .accessibilityLabel(titel)
            Button { schliessen() } label: {
                Image(systemName: "xmark.circle.fill").font(.title).symbolRenderingMode(.hierarchical).foregroundStyle(.white)
            }
            .padding()
            .accessibilityLabel("Schließen")
        }
        .onTapGesture { if zoom == 1 { schliessen() } }
    }
}

/// Symbol passend zum Lucide-Schlüssel eines Guides (Website: ContentIcon).
enum InhaltSymbol {
    static func fuer(_ schluessel: String?) -> String {
        switch schluessel ?? "" {
        case "rocket": return "paperplane.fill"
        case "clock": return "clock.fill"
        case "coins": return "eurosign.circle.fill"
        case "folder": return "folder.fill"
        case "gem": return "diamond.fill"
        case "map": return "map.fill"
        case "medal": return "medal.fill"
        case "microscope": return "magnifyingglass.circle.fill"
        case "package": return "shippingbox.fill"
        case "refresh": return "arrow.triangle.2.circlepath"
        case "scale": return "scalemass.fill"
        case "search": return "magnifyingglass"
        case "shield": return "shield.lefthalf.filled"
        case "sparkles": return "sparkles"
        case "trophy": return "trophy.fill"
        case "users": return "person.2.fill"
        default: return "book.closed.fill"
        }
    }

    /// Abschnitte des Marktberichts.
    static func berichtAbschnitt(_ ueberschrift: String) -> String? {
        let t = ueberschrift.lowercased()
        if t.contains("marktlage") { return "chart.bar.xaxis" }
        if t.contains("trend") { return "flame.fill" }
        if t.contains("neuheit") { return "sparkles" }
        if t.contains("ausblick") { return "binoculars.fill" }
        return nil
    }

    static func artikelTyp(_ typ: String) -> String {
        switch typ {
        case "rueckblick": return "calendar"
        case "markt": return "chart.line.uptrend.xyaxis"
        case "karte": return "rectangle.portrait.fill"
        case "strategie": return "lightbulb.fill"
        case "set": return "square.stack.3d.up.fill"
        case "ausblick": return "binoculars.fill"
        case "guide": return "book.fill"
        default: return "newspaper.fill"
        }
    }
}
