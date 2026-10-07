import SwiftUI

/// Marktbericht, Artikel und Guides — dieselben Texte wie auf cardbeacon.de.
struct LesenView: View {
    var body: some View {
        NavigationStack {
            Laden(laden: { try await APIClient.shared.inhalte() }) { inhalte in
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        if let b = inhalte.bericht {
                            NavigationLink(value: Ziel.bericht) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Label("Marktbericht", systemImage: "chart.bar.doc.horizontal")
                                        .font(.caption.weight(.bold)).foregroundStyle(.white.opacity(0.85))
                                    Text("KW \(b.kw)").font(.system(size: 34, weight: .heavy, design: .rounded))
                                    Text("Marktlage, Trends, Neuheiten und Ausblick — Woche ab \(Format.tag(b.woche))")
                                        .font(.subheadline).foregroundStyle(.white.opacity(0.85))
                                    HStack { Spacer(); Image(systemName: "arrow.right.circle.fill").font(.title2) }
                                }
                                .foregroundStyle(.white)
                                .padding(18)
                                .background(Theme.verlauf, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                        if !inhalte.artikel.isEmpty {
                            Abschnittsmarke(text: "Artikel")
                            VStack(spacing: 0) {
                                ForEach(inhalte.artikel) { a in
                                    NavigationLink(value: Ziel.artikel(a.datum)) {
                                        eintrag(symbol: "newspaper", titel: a.titel, zeile: "\(a.kategorie) · \(Format.tag(a.datum))")
                                    }
                                    .buttonStyle(.plain)
                                    if a.id != inhalte.artikel.last?.id { Divider().overlay(Theme.rand) }
                                }
                            }
                            .kachel(innen: 12)
                        }
                        if !inhalte.guides.isEmpty {
                            Abschnittsmarke(text: "Guides")
                            VStack(spacing: 0) {
                                ForEach(inhalte.guides) { g in
                                    NavigationLink(value: Ziel.guide(g.slug)) {
                                        eintrag(symbol: "book.closed", titel: g.titel,
                                                zeile: "\(g.lesezeit) Min. Lesezeit", text: g.beschreibung)
                                    }
                                    .buttonStyle(.plain)
                                    if g.id != inhalte.guides.last?.id { Divider().overlay(Theme.rand) }
                                }
                            }
                            .kachel(innen: 12)
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
        }
    }

    private func eintrag(symbol: String, titel: String, zeile: String, text: String? = nil) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol).foregroundStyle(Theme.akzent).frame(width: 34, height: 34)
                .background(Theme.akzent.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 3) {
                Text(titel).font(.subheadline.weight(.semibold)).lineLimit(2).multilineTextAlignment(.leading)
                if let text, !text.isEmpty {
                    Text(text).font(.caption).foregroundStyle(.secondary).lineLimit(2).multilineTextAlignment(.leading)
                }
                Text(zeile).font(.caption2).foregroundStyle(.secondary)
            }
            Spacer(minLength: 4)
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary).padding(.top, 10)
        }
        .padding(.vertical, 10)
        .contentShape(Rectangle())
    }

    enum Ziel: Hashable {
        case bericht
        case artikel(String)
        case guide(String)
    }
}

struct BerichtView: View {
    var body: some View {
        Laden(laden: { try await APIClient.shared.marktbericht() }) { b in
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Marktbericht KW \(b.kw)").font(.title2.bold())
                    Text("Woche ab \(Format.tag(b.woche))").font(.caption).foregroundStyle(.secondary)
                    if b.archiv { ArchivHinweis() }
                    Fliesstext(text: b.text)
                    WeiterLink(url: b.url)
                    PreisHinweis()
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ArtikelView: View {
    let datum: String

    var body: some View {
        Laden(laden: { try await APIClient.shared.artikel(datum) }) { a in
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("\(a.kategorie) · \(Format.tag(a.datum)) · \(a.lesezeit) Min.").font(.caption).foregroundStyle(Theme.akzent)
                    Text(a.titel).font(.title2.bold())
                    if a.archiv { ArchivHinweis() }
                    Fliesstext(text: a.intro)
                    ForEach(a.abschnitte, id: \.self) { s in
                        Text(s.ueberschrift).font(.headline).padding(.top, 6)
                        Fliesstext(text: s.text)
                    }
                    Kernpunkte(punkte: a.kernpunkte)
                    if !a.quellen.isEmpty {
                        Text("Quellen").font(.headline).padding(.top, 6)
                        ForEach(a.quellen, id: \.self) { q in
                            if let u = URL(string: q.url) { Link(q.label, destination: u).font(.callout) }
                        }
                    }
                    WeiterLink(url: a.url)
                    PreisHinweis()
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct GuideView: View {
    let slug: String

    var body: some View {
        Laden(laden: { try await APIClient.shared.guide(slug) }) { g in
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Guide · \(g.lesezeit) Min.").font(.caption).foregroundStyle(Theme.akzent)
                    Text(g.titel).font(.title2.bold())
                    Fliesstext(text: g.intro)
                    ForEach(g.abschnitte, id: \.self) { s in
                        Text(s.ueberschrift).font(.headline).padding(.top, 6)
                        Fliesstext(text: s.text)
                        if let tipp = s.tipp {
                            Label(tipp, systemImage: "lightbulb")
                                .font(.callout)
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Theme.akzent.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    Kernpunkte(punkte: g.kernpunkte)
                    WeiterLink(url: g.url)
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Absätze aus Rohtext; Zeilen mit `## ` werden Zwischenüberschriften, `- ` Aufzählungen.
struct Fliesstext: View {
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(Self.bloecke(text).enumerated()), id: \.offset) { _, b in
                switch b {
                case .ueberschrift(let t): Text(t).font(.headline).padding(.top, 6)
                case .punkt(let t): HStack(alignment: .firstTextBaseline, spacing: 8) { Text("•"); Text(t) }.font(.body)
                case .absatz(let t): Text(t).font(.body).lineSpacing(3)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
}

private struct Kernpunkte: View {
    let punkte: [String]

    var body: some View {
        if !punkte.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Das Wichtigste").font(.headline)
                ForEach(punkte, id: \.self) { p in
                    Label(p, systemImage: "checkmark.circle").font(.callout)
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.karte, in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.rand))
        }
    }
}

private struct ArchivHinweis: View {
    var body: some View {
        Label("Archiv: Zahlen in diesem Text können veraltet sein. Aktuelle Preise stehen auf den Kartenseiten.", systemImage: "clock")
            .font(.caption).foregroundStyle(Theme.warnung)
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
