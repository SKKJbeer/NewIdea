import SwiftUI

/// Marktbericht, Artikel und Guides — dieselben Texte wie auf cardbeacon.de, als Magazin.
struct LesenView: View {
    var body: some View {
        NavigationStack {
            Laden(laden: { try await APIClient.shared.inhalte() }) { inhalte in
                ScrollView {
                    VStack(alignment: .leading, spacing: 26) {
                        if let b = inhalte.bericht { BerichtTeaser(bericht: b) }

                        if !inhalte.artikel.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Rubrik(titel: "Artikel", text: "Marktanalysen sonntags und donnerstags")
                                if let erster = inhalte.artikel.first {
                                    NavigationLink(value: Ziel.artikel(erster.datum)) { ArtikelAufmacher(artikel: erster) }
                                        .buttonStyle(.plain)
                                }
                                ForEach(inhalte.artikel.dropFirst().prefix(12)) { a in
                                    NavigationLink(value: Ziel.artikel(a.datum)) { ArtikelZeile(artikel: a) }
                                        .buttonStyle(.plain)
                                }
                            }
                        }

                        if !inhalte.guides.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Rubrik(titel: "Guides", text: "Wissen für Einsteiger und Sammler")
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 14) {
                                        ForEach(inhalte.guides) { g in
                                            NavigationLink(value: Ziel.guide(g.slug)) { GuideKachel(guide: g) }
                                                .buttonStyle(.plain)
                                        }
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
            .background(Theme.hintergrund)
            .navigationTitle("Lesen")
            .navigationDestination(for: Ziel.self) { ziel in
                switch ziel {
                case .bericht: BerichtView()
                case .artikel(let datum): ArtikelView(datum: datum)
                case .guide(let slug): GuideView(slug: slug)
                }
            }
            .navigationDestination(for: Karte.self) { KarteView(karte: $0) }
            .navigationDestination(for: SetTreffer.self) { SetView(set: $0) }
        }
    }

    enum Ziel: Hashable {
        case bericht
        case artikel(String)
        case guide(String)
    }
}

// MARK: - Übersicht

private struct Rubrik: View {
    let titel: String
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(titel).font(.system(.title2, design: .rounded).weight(.heavy))
            Text(text).font(.caption).foregroundStyle(.secondary)
        }
    }
}

private struct BerichtTeaser: View {
    let bericht: Inhalte.Bericht

    var body: some View {
        NavigationLink(value: LesenView.Ziel.bericht) {
            HStack(alignment: .center, spacing: 8) {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Marktbericht", systemImage: "chart.bar.doc.horizontal.fill")
                        .font(.caption.weight(.bold)).foregroundStyle(.white.opacity(0.9))
                    Text("KW \(bericht.kw)").font(.system(size: 44, weight: .heavy, design: .rounded))
                    Text("Marktlage, Trends, Neuheiten und Ausblick").font(.subheadline.weight(.medium))
                        .foregroundStyle(.white.opacity(0.85))
                    Text("Woche ab \(Format.tag(bericht.woche))").font(.caption).foregroundStyle(.white.opacity(0.7))
                    Label("Jetzt lesen", systemImage: "arrow.right")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .background(.white.opacity(0.18), in: Capsule())
                        .padding(.top, 4)
                }
                Spacer(minLength: 0)
                if let bilder = bericht.bilder, !bilder.isEmpty {
                    KartenFaecher(bilder: bilder, breite: 62).frame(width: 130)
                }
            }
            .foregroundStyle(.white)
            .padding(20)
            .background {
                ZStack {
                    Theme.verlauf
                    Circle().fill(.white.opacity(0.12)).frame(width: 220).blur(radius: 40).offset(x: 120, y: -60)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
            .shadow(color: Theme.akzent.opacity(0.35), radius: 20, y: 10)
        }
        .buttonStyle(.plain)
    }
}

private struct ArtikelAufmacher: View {
    let artikel: Inhalte.ArtikelEintrag

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                LinearGradient(colors: [Theme.akzent.opacity(0.35), Theme.karte], startPoint: .top, endPoint: .bottom)
                if let bild = artikel.bild {
                    KartenBild(quelle: bild, breite: 640).frame(width: 300).blur(radius: 28).opacity(0.5)
                    KartenBild(quelle: bild, breite: 384).frame(width: 118).shadow(color: .black.opacity(0.6), radius: 14, y: 8)
                } else {
                    Image(systemName: InhaltSymbol.artikelTyp(artikel.typ)).font(.system(size: 52)).foregroundStyle(.white.opacity(0.85))
                }
            }
            .frame(height: 200)
            .clipped()
            VStack(alignment: .leading, spacing: 8) {
                Plakette(text: artikel.kategorie, symbol: InhaltSymbol.artikelTyp(artikel.typ))
                Text(artikel.titel).font(.system(.title3, design: .rounded).weight(.bold)).multilineTextAlignment(.leading)
                if let a = artikel.anreisser, !a.isEmpty {
                    Text(a).font(.callout).foregroundStyle(.secondary).lineLimit(3).multilineTextAlignment(.leading)
                }
                Text(Format.tag(artikel.datum)).font(.caption).foregroundStyle(.tertiary)
            }
            .padding(16)
        }
        .background(Theme.karte)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.rand))
    }
}

private struct ArtikelZeile: View {
    let artikel: Inhalte.ArtikelEintrag

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Group {
                if let bild = artikel.bild {
                    KartenBild(quelle: bild, breite: 256).frame(width: 56)
                } else {
                    Image(systemName: InhaltSymbol.artikelTyp(artikel.typ)).font(.title3).foregroundStyle(Theme.akzent)
                        .frame(width: 56, height: 78)
                        .background(Theme.akzent.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
                }
            }
            VStack(alignment: .leading, spacing: 5) {
                Text(artikel.kategorie.uppercased()).font(.caption2.weight(.bold)).tracking(0.8).foregroundStyle(Theme.akzent)
                Text(artikel.titel).font(.subheadline.weight(.semibold)).lineLimit(3).multilineTextAlignment(.leading)
                Text(Format.tag(artikel.datum)).font(.caption2).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Theme.karte, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.rand))
    }
}

private struct GuideKachel: View {
    let guide: Inhalte.GuideEintrag

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack(alignment: .bottomTrailing) {
                LinearGradient(colors: [Theme.akzent.opacity(0.55), Theme.fuchsia.opacity(0.35)], startPoint: .topLeading, endPoint: .bottomTrailing)
                Image(systemName: InhaltSymbol.fuer(guide.icon))
                    .font(.system(size: 40, weight: .semibold)).foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                if let bild = guide.bild {
                    KartenBild(quelle: bild, breite: 256).frame(width: 44).rotationEffect(.degrees(8))
                        .shadow(radius: 6).padding(10)
                }
            }
            .frame(height: 110)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            if let badge = guide.badge { Plakette(text: badge, symbol: "tag.fill") }
            Text(guide.titel).font(.subheadline.weight(.bold)).lineLimit(3).multilineTextAlignment(.leading)
            Spacer(minLength: 0)
            Label("\(guide.lesezeit) Min. Lesezeit", systemImage: "clock").font(.caption2).foregroundStyle(.secondary)
        }
        .padding(12)
        .frame(width: 210, height: 290, alignment: .topLeading)
        .background(Theme.karte, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.rand))
    }
}

private struct Plakette: View {
    let text: String
    let symbol: String

    var body: some View {
        Label(text, systemImage: symbol)
            .font(.caption2.weight(.bold))
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(Theme.akzent.opacity(0.14), in: Capsule())
            .foregroundStyle(Theme.akzent)
    }
}

// MARK: - Marktbericht

struct BerichtView: View {
    var body: some View {
        Laden(laden: { try await APIClient.shared.marktbericht() }) { b in
            let teile = Fliesstext.abschnitte(b.text)
            let aufwaerts = b.aufwaerts ?? []
            let wertvollste = b.wertvollste ?? []
            let stand = Format.tag(b.erstellt)
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    LeseKopf(plakette: "Marktbericht · KW \(b.kw)", symbol: "chart.bar.doc.horizontal.fill",
                             titel: "Der Markt in KW \(b.kw)", untertitel: "Woche ab \(Format.tag(b.woche))",
                             bilder: (aufwaerts + wertvollste).map(\.bild))
                    VStack(alignment: .leading, spacing: 18) {
                        if b.archiv { ArchivHinweis() }
                        if !teile.vorwort.isEmpty { Fliesstext(text: teile.vorwort, lead: true) }
                        ForEach(Array(teile.abschnitte.enumerated()), id: \.offset) { i, a in
                            AbschnittKarte(nummer: i + 1, symbol: InhaltSymbol.berichtAbschnitt(a.titel), ueberschrift: a.titel, text: a.text) {
                                let t = a.titel.lowercased()
                                if t.contains("trend") {
                                    TrendBalken(titel: "Stärkste Aufwärtsbewegungen", karten: aufwaerts)
                                } else if t.contains("marktlage") {
                                    KartenStreifen(titel: "Wertvollste Karten", symbol: "crown.fill", karten: wertvollste, stand: stand)
                                }
                            }
                        }
                        if !teile.abschnitte.contains(where: { $0.titel.lowercased().contains("trend") }) {
                            TrendBalken(titel: "Stärkste Aufwärtsbewegungen", karten: aufwaerts)
                        }
                        KartenStreifen(titel: "Karten aus dem Bericht", karten: aufwaerts, stand: stand)
                        WeiterLink(url: b.url)
                        PreisHinweis()
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                }
            }
            .background(Theme.hintergrund)
            .toolbar { TeilenToolbar(url: b.url, titel: "Pokémon-Marktbericht KW \(b.kw)") }
        }
        .background(Theme.hintergrund)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Artikel

struct ArtikelView: View {
    let datum: String

    var body: some View {
        Laden(laden: { try await APIClient.shared.artikel(datum) }) { a in
            let karten = a.karten ?? []
            let stand = Format.tag(a.datum)
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    LeseKopf(plakette: a.kategorie, symbol: InhaltSymbol.artikelTyp(a.typ), titel: a.titel,
                             untertitel: "\(Format.tag(a.datum)) · \(a.lesezeit) Min. Lesezeit", bilder: karten.map(\.bild))
                    VStack(alignment: .leading, spacing: 18) {
                        if a.archiv { ArchivHinweis() }
                        Fliesstext(text: a.intro, lead: true)
                        ForEach(Array(a.abschnitte.enumerated()), id: \.offset) { i, s in
                            AbschnittKarte(nummer: i + 1, ueberschrift: s.ueberschrift, text: s.text) {
                                if let k = s.karte { HervorgehobeneKarte(karte: k, stand: stand) }
                            }
                        }
                        KartenStreifen(titel: "Karten im Artikel", karten: karten, stand: stand)
                        KernpunkteKarte(punkte: a.kernpunkte)
                        if !a.quellen.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Abschnittsmarke(text: "Quellen")
                                ForEach(a.quellen, id: \.self) { q in
                                    if let u = URL(string: q.url) {
                                        Link(destination: u) { Label(q.label, systemImage: "link") }.font(.callout)
                                    }
                                }
                            }
                            .kachel()
                        }
                        WeiterLink(url: a.url)
                        PreisHinweis()
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                }
            }
            .background(Theme.hintergrund)
            .toolbar { TeilenToolbar(url: a.url, titel: a.titel) }
        }
        .background(Theme.hintergrund)
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Karte eines Abschnitts: Bild links, Angaben rechts.
private struct HervorgehobeneKarte: View {
    let karte: InhaltKarte
    let stand: String
    @State private var gross = false

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            Button { gross = true } label: {
                KartenBild(quelle: karte.bild, breite: 384).frame(width: 84).shadow(color: .black.opacity(0.5), radius: 8, y: 4)
            }
            .buttonStyle(.plain)
            VStack(alignment: .leading, spacing: 5) {
                Text(karte.name).font(.subheadline.weight(.bold))
                if let s = karte.set { Text(s).font(.caption).foregroundStyle(.secondary) }
                if let r = karte.seltenheit { Text(r).font(.caption2).foregroundStyle(Theme.akzent) }
                if let p = karte.preis {
                    HStack(spacing: 6) {
                        Text(Format.euro(p)).font(.callout.monospacedDigit().weight(.semibold))
                        if let t = karte.trend30 { TrendPille(wert: t) }
                    }
                    Text("Stand \(stand)").font(.caption2).foregroundStyle(.tertiary)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Theme.hintergrund.opacity(0.6), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .fullScreenCover(isPresented: $gross) { KartenVollbild(bild: karte.bild, titel: karte.name) }
    }
}

// MARK: - Guide

struct GuideView: View {
    let slug: String

    var body: some View {
        Laden(laden: { try await APIClient.shared.guide(slug) }) { g in
            let bilder = g.abschnitte.flatMap { $0.karten ?? [] }.map(\.bild)
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    LeseKopf(plakette: g.badge ?? "Guide", symbol: InhaltSymbol.fuer(g.icon), titel: g.titel,
                             untertitel: "\(g.lesezeit) Min. Lesezeit", bilder: bilder)
                    VStack(alignment: .leading, spacing: 18) {
                        Fliesstext(text: g.intro, lead: true)
                        ForEach(Array(g.abschnitte.enumerated()), id: \.offset) { i, s in
                            AbschnittKarte(nummer: i + 1, ueberschrift: s.ueberschrift, text: s.text) {
                                if let tipp = s.tipp { TippKasten(text: tipp) }
                                if let karten = s.karten, !karten.isEmpty {
                                    ForEach(karten, id: \.schluessel) { k in BeispielKarte(karte: k) }
                                }
                            }
                        }
                        KernpunkteKarte(punkte: g.kernpunkte)
                        WeiterLink(url: g.url)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                }
            }
            .background(Theme.hintergrund)
            .toolbar { TeilenToolbar(url: g.url, titel: g.titel) }
        }
        .background(Theme.hintergrund)
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Beispielkarte im Guide: Bild, Name, Seltenheit, warum sie hier steht.
private struct BeispielKarte: View {
    let karte: InhaltKarte
    @State private var gross = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Button { gross = true } label: { KartenBild(quelle: karte.bild, breite: 256).frame(width: 60) }
                .buttonStyle(.plain)
            VStack(alignment: .leading, spacing: 4) {
                Text(karte.name).font(.subheadline.weight(.bold))
                if let r = karte.seltenheit {
                    Text(r).font(.caption2.weight(.bold)).padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Theme.akzent.opacity(0.14), in: Capsule()).foregroundStyle(Theme.akzent)
                }
                if let w = karte.warum { Text(w).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true) }
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .background(Theme.hintergrund.opacity(0.6), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .fullScreenCover(isPresented: $gross) { KartenVollbild(bild: karte.bild, titel: karte.name) }
    }
}

// MARK: - Text

/// Absätze aus Rohtext; `## ` = Zwischenüberschrift, `- ` = Aufzählung.
/// Kennzahlen (€, %, Pp.) werden hervorgehoben — steigend grün, fallend rot.
struct Fliesstext: View {
    let text: String
    var lead = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(Self.bloecke(text).enumerated()), id: \.offset) { i, b in
                switch b {
                case .ueberschrift(let t):
                    Text(t).font(.system(.headline, design: .rounded)).padding(.top, 4)
                case .punkt(let t):
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Circle().fill(Theme.akzent).frame(width: 6, height: 6).offset(y: -2)
                        Text(Self.hervorgehoben(t)).font(.body).lineSpacing(4)
                    }
                case .absatz(let t):
                    Text(Self.hervorgehoben(t))
                        .font(lead && i == 0 ? .system(.title3, design: .serif) : .body)
                        .foregroundStyle(lead && i == 0 ? Color.primary : Color.primary.opacity(0.88))
                        .lineSpacing(lead && i == 0 ? 6 : 5)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .fixedSize(horizontal: false, vertical: true)
    }

    enum Block: Equatable { case ueberschrift(String), punkt(String), absatz(String) }

    static func bloecke(_ text: String) -> [Block] {
        var aus: [Block] = []
        var absatz: [String] = []
        func abschliessen() {
            if !absatz.isEmpty { aus.append(.absatz(absatz.joined(separator: " "))); absatz = [] }
        }
        for roh in text.components(separatedBy: "\n") {
            let z = roh.trimmingCharacters(in: .whitespaces)
            if z.isEmpty { abschliessen() }
            else if z.hasPrefix("## ") { abschliessen(); aus.append(.ueberschrift(String(z.dropFirst(3)))) }
            else if z.hasPrefix("- ") || z.hasPrefix("• ") { abschliessen(); aus.append(.punkt(String(z.dropFirst(2)))) }
            else { absatz.append(z) }
        }
        abschliessen()
        return aus
    }

    /// Teilt einen Text an `## `-Überschriften: Vorwort + Abschnitte.
    static func abschnitte(_ text: String) -> (vorwort: String, abschnitte: [(titel: String, text: String)]) {
        var vorwort: [String] = []
        var teile: [(titel: String, text: String)] = []
        for zeile in text.components(separatedBy: "\n") {
            let z = zeile.trimmingCharacters(in: .whitespaces)
            if z.hasPrefix("## ") {
                teile.append((String(z.dropFirst(3)).trimmingCharacters(in: .whitespaces), ""))
            } else if let letzter = teile.indices.last {
                teile[letzter].text += zeile + "\n"
            } else {
                vorwort.append(zeile)
            }
        }
        return (vorwort.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines),
                teile.map { ($0.titel, $0.text.trimmingCharacters(in: .whitespacesAndNewlines)) })
    }

    private static let kennzahl = try? NSRegularExpression(
        pattern: "[+\\-\u{2212}]?\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?\\s?(?:%|€|Pp\\.)")

    /// Kennzahlen fett und farbig: „+" grün, „-"/„−" rot, sonst Akzent.
    static func hervorgehoben(_ t: String) -> AttributedString {
        var a = AttributedString(t)
        guard let muster = kennzahl else { return a }
        for m in muster.matches(in: t, range: NSRange(t.startIndex..., in: t)) {
            guard let r = Range(m.range, in: t), let ar = Range(r, in: a) else { continue }
            let treffer = t[r]
            a[ar].font = .body.weight(.bold)
            a[ar].foregroundColor = treffer.hasPrefix("+") ? Theme.aufwaerts
                : (treffer.hasPrefix("-") || treffer.hasPrefix("\u{2212}")) ? Theme.abwaerts : Theme.akzent
        }
        return a
    }
}

private struct ArchivHinweis: View {
    var body: some View {
        Label("Archiv: Zahlen in diesem Text können veraltet sein. Aktuelle Preise stehen auf den Kartenseiten.", systemImage: "clock")
            .font(.caption).foregroundStyle(Theme.warnung)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.warnung.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }
}

private struct WeiterLink: View {
    let url: String

    var body: some View {
        if let u = URL(string: url) {
            Link(destination: u) { Label("Auf cardbeacon.de öffnen", systemImage: "safari") }.font(.callout).padding(.top, 6)
        }
    }
}

/// Teilen-Knopf oben rechts; die Adresse trägt die Herkunft „app" für die Reichweitenmessung.
struct TeilenToolbar: ToolbarContent {
    let url: String
    let titel: String

    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            if let ziel = Self.mitHerkunft(url) {
                ShareLink(item: ziel, subject: Text(titel)) { Image(systemName: "square.and.arrow.up") }
            }
        }
    }

    static func mitHerkunft(_ url: String) -> URL? {
        guard var teile = URLComponents(string: url) else { return nil }
        teile.queryItems = (teile.queryItems ?? []) + [URLQueryItem(name: "utm_source", value: "app"),
                                                        URLQueryItem(name: "utm_medium", value: "teilen")]
        return teile.url
    }
}
