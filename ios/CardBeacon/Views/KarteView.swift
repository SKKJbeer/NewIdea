import SwiftUI
import Charts

struct KarteView: View {
    let karte: Karte
    @EnvironmentObject private var merkliste: Merkliste
    @EnvironmentObject private var portfolio: PortfolioSpeicher
    @State private var neuePosition: Position?
    @State private var marktwert: Double?

    var body: some View {
        Laden(laden: { try await APIClient.shared.karte(karte.id) }) { d in
            ScrollView {
                VStack(spacing: 18) {
                    ZStack {
                        Circle().fill(Theme.verlauf).frame(width: 220, height: 220).blur(radius: 70).opacity(0.45)
                        KartenBild(quelle: d.bild, breite: 640).frame(maxWidth: 250)
                            .shadow(color: .black.opacity(0.6), radius: 18, y: 10)
                    }
                    .padding(.top, 6)

                    VStack(spacing: 4) {
                        Text(d.nameDe ?? d.name).font(.title2.bold()).multilineTextAlignment(.center)
                        if d.nameDe != nil { Text(d.name).font(.subheadline).foregroundStyle(.secondary) }
                        Text([d.set, d.nummer.map { "#\($0)" }, d.seltenheit].compactMap { $0 }.joined(separator: " · "))
                            .font(.caption).foregroundStyle(.secondary)
                    }

                    HStack(spacing: 10) {
                        let imPortfolio = portfolio.kartenIds.contains(d.id)
                        AktionsKnopf(titel: imPortfolio ? "Weiterer Kauf" : "Zum Portfolio", symbol: "briefcase.fill") {
                            neuePosition = Position.neu(aus: d.alsKarte)
                        }
                        AktionsKnopf(titel: merkliste.enthaelt(d.id) ? "Gemerkt" : "Merken",
                                     symbol: merkliste.enthaelt(d.id) ? "star.fill" : "star",
                                     aktiv: merkliste.enthaelt(d.id)) {
                            merkliste.umschalten(d.alsKarte)
                        }
                    }
                    .sensoryFeedback(.selection, trigger: merkliste.enthaelt(d.id))

                    PreisBlock(d: d)
                    if let sprachen = d.sprachen, !sprachen.isEmpty { SprachBlock(sprachen: sprachen) }
                    VerlaufBlock(punkte: d.verlauf)
                    if let s = d.setInfo { SetBlock(set: s) }
                    if let k = d.kaufen { KaufBlock(links: k) }

                    if let link = URL(string: d.url) {
                        Link(destination: link) { Label("Auf cardbeacon.de öffnen", systemImage: "safari") }
                            .font(.callout)
                    }
                    PreisHinweis()
                }
                .padding()
            }
            .background(Theme.hintergrund)
            .onAppear { merkliste.aktualisieren(d.alsKarte); marktwert = d.preis }
            .toolbar {
                if let link = URL(string: d.url) {
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLink(item: link, subject: Text(d.nameDe ?? d.name)) { Image(systemName: "square.and.arrow.up") }
                    }
                }
            }
        }
        .background(Theme.hintergrund)
        .sheet(item: $neuePosition) { p in PositionFormular(position: p, aktuellerPreis: marktwert ?? karte.preis) }
        .navigationTitle(karte.anzeigeName)
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// JP/KR sind bei Cardmarket eigene Produkte — Preis nur bei eindeutiger Zuordnung, sonst der Grund.
private struct SprachBlock: View {
    let sprachen: [Sprachpreis]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Abschnittsmarke(text: "Andere Sprachen")
            ForEach(sprachen) { s in
                HStack(alignment: .top) {
                    Text(s.sprache == "JP" ? "🇯🇵 Japanisch" : "🇰🇷 Koreanisch").font(.callout.weight(.semibold))
                    Spacer()
                    if s.ok {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(Format.euro(s.trend)).font(.callout.monospacedDigit().weight(.semibold))
                            Text("ab \(Format.euro(s.ab)) · Ø 30 T. \(Format.euro(s.durchschnitt30))")
                                .font(.caption2.monospacedDigit()).foregroundStyle(.secondary)
                        }
                    } else {
                        Text("—").font(.callout).foregroundStyle(.secondary)
                    }
                }
                if s.ok, let g = s.gegenstueck {
                    Text("\(g.name) · \(g.set)\(s.stand.map { " · Stand \(Format.tag($0))" } ?? "")")
                        .font(.caption2).foregroundStyle(.secondary)
                } else if let grund = s.grund {
                    Text(grund).font(.caption2).foregroundStyle(.secondary)
                }
                if s.id != sprachen.last?.id { Divider().overlay(Theme.rand) }
            }
            Text("Englisch, Deutsch, Französisch, Italienisch, Spanisch und Portugiesisch sind bei Cardmarket ein Produkt — der Preis oben gilt für alle.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .kachel()
    }
}

/// Dezente Kauf-Links mit Pflichtkennzeichnung.
private struct KaufBlock: View {
    let links: KaufLinks

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                knopf(links.cardmarketGenau ? "Cardmarket" : "Cardmarket-Suche", symbol: "cart", ziel: links.cardmarket)
                knopf("Amazon", symbol: "shippingbox", ziel: links.amazonKarte)
                knopf("Booster", symbol: "gift", ziel: links.amazonBooster)
            }
            Text(links.cardmarketGenau ? "* Affiliate-Links · Cardmarket öffnet genau diese Karte" : "* Affiliate-Links")
                .font(.caption2).foregroundStyle(.tertiary)
        }
    }

    @ViewBuilder private func knopf(_ titel: String, symbol: String, ziel: String) -> some View {
        if let url = URL(string: ziel) {
            Link(destination: url) {
                Label(titel, systemImage: symbol)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .background(Theme.karteHover, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(Theme.rand))
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct SetBlock: View {
    let set: SetEintrag

    var body: some View {
        NavigationLink(value: set.alsTreffer) {
            HStack(spacing: 14) {
                SetLogo(url: set.logo, hoehe: 44).frame(width: 96)
                VStack(alignment: .leading, spacing: 3) {
                    Abschnittsmarke(text: "Aus diesem Set")
                    Text(set.name).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                    Text([set.serie.isEmpty ? nil : set.serie, set.datum.map { Format.tag($0) },
                          set.karten > 0 ? "\(Format.anzahl(set.karten)) Karten" : nil].compactMap { $0 }.joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(.secondary)
            }
            .kachel()
        }
        .buttonStyle(.plain)
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
        .kachel()
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
        .kachel()
    }
}
