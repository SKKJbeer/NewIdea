import SwiftUI

/// Kartenbild über den eigenen Bild-Proxy, mit Platzhalter statt kaputtem Bild.
struct KartenBild: View {
    let quelle: String
    let breite: Int

    var body: some View {
        AsyncImage(url: APIClient.shared.bildURL(quelle, breite: breite)) { phase in
            switch phase {
            case .success(let bild):
                bild.resizable().aspectRatio(63.0 / 88.0, contentMode: .fit)
            case .failure:
                platzhalter(Image(systemName: "photo"))
            default:
                platzhalter(ProgressView())
            }
        }
        .aspectRatio(63.0 / 88.0, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: breite > 200 ? 12 : 4))
    }

    private func platzhalter<V: View>(_ inhalt: V) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4).fill(Theme.karte)
            inhalt.foregroundStyle(.secondary)
        }
    }
}

/// Eine Zeile in Listen: Bild, Name, Set, Preis, 30-Tage-Bewegung.
/// Ein Preis, der nicht frisch ist, trägt sichtbar sein Datum.
struct KartenZeile: View {
    let karte: Karte

    var body: some View {
        HStack(spacing: 12) {
            KartenBild(quelle: karte.bild, breite: 128).frame(width: 44)
            VStack(alignment: .leading, spacing: 3) {
                Text(karte.anzeigeName).font(.subheadline.weight(.semibold)).lineLimit(1)
                Text([karte.set, karte.nummer.map { "#\($0)" }].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption).foregroundStyle(.secondary).lineLimit(1)
                if !karte.frisch {
                    Label("Stand \(Format.tag(karte.preisStand))", systemImage: "clock")
                        .font(.caption2).foregroundStyle(Theme.warnung)
                }
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 3) {
                Text(Format.euro(karte.preis)).font(.subheadline.monospacedDigit().weight(.semibold))
                Text(Format.prozent(karte.trend30)).font(.caption.monospacedDigit())
                    .foregroundStyle(Theme.trendFarbe(karte.trend30))
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }
}

/// Lädt einmal beim Erscheinen; zeigt Laden, Fehler mit „Erneut versuchen" oder den Inhalt.
struct Laden<Wert, Inhalt: View>: View {
    let laden: () async throws -> Wert
    @ViewBuilder let inhalt: (Wert) -> Inhalt

    @State private var wert: Wert?
    @State private var fehler: String?

    var body: some View {
        Group {
            if let wert {
                inhalt(wert)
            } else if let fehler {
                ContentUnavailableView {
                    Label("Nicht geladen", systemImage: "wifi.exclamationmark")
                } description: {
                    Text(fehler)
                } actions: {
                    Button("Erneut versuchen") { Task { await holen() } }
                }
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task { if wert == nil { await holen() } }
        .refreshable { await holen() }
    }

    private func holen() async {
        do {
            wert = try await laden()
            fehler = nil
        } catch {
            fehler = (error as? LocalizedError)?.errorDescription ?? "Unbekannter Fehler."
        }
    }
}

/// Pflichthinweis unter Preisangaben.
struct PreisHinweis: View {
    var body: some View {
        Text("Cardmarket-Preise in EUR, Stand Vortag, ohne Gewähr. Keine Anlageberatung.")
            .font(.caption2).foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .center)
            .multilineTextAlignment(.center)
    }
}

/// Set-Logo über den Bild-Proxy; ohne Logo ein ruhiger Platzhalter.
struct SetLogo: View {
    let url: String?
    var hoehe: CGFloat = 36

    var body: some View {
        Group {
            if let url, let u = APIClient.shared.bildURL(url, breite: 256) {
                AsyncImage(url: u) { phase in
                    if case .success(let bild) = phase { bild.resizable().scaledToFit() }
                    else { Image(systemName: "square.stack.3d.up").foregroundStyle(.secondary) }
                }
            } else {
                Image(systemName: "square.stack.3d.up").foregroundStyle(.secondary)
            }
        }
        .frame(height: hoehe)
    }
}

/// Hochformat-Kachel für Karussells: Bild, Name, Preis, Bewegung.
struct KartenKachel: View {
    let karte: Karte

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            KartenBild(quelle: karte.bild, breite: 256)
                .frame(width: 118)
                .shadow(color: .black.opacity(0.5), radius: 8, y: 4)
            Text(karte.anzeigeName).font(.caption.weight(.semibold)).lineLimit(1)
            Text(karte.set).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            HStack(spacing: 6) {
                Text(Format.euro(karte.preis)).font(.caption.monospacedDigit().weight(.semibold))
                Text(Format.prozent(karte.trend30)).font(.caption2.monospacedDigit().weight(.bold))
                    .padding(.horizontal, 5).padding(.vertical, 2)
                    .background(Theme.trendFarbe(karte.trend30).opacity(0.15), in: Capsule())
                    .foregroundStyle(Theme.trendFarbe(karte.trend30))
            }
        }
        .frame(width: 118, alignment: .leading)
    }
}

/// Großer Aktionsknopf (Merken, Portfolio).
struct AktionsKnopf: View {
    let titel: String
    let symbol: String
    var aktiv = false
    let aktion: () -> Void

    var body: some View {
        Button(action: aktion) {
            Label(titel, systemImage: symbol)
                .font(.subheadline.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(aktiv ? AnyShapeStyle(Theme.akzent.opacity(0.18)) : AnyShapeStyle(Theme.verlauf),
                            in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .foregroundStyle(aktiv ? Theme.akzent : .white)
        }
        .buttonStyle(.plain)
    }
}
