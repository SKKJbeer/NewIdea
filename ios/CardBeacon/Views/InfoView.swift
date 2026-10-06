import SwiftUI

struct InfoView: View {
    private var version: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?"
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?"
        return "\(v) (\(b))"
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Daten") {
                    Text("Preise: Cardmarket-Preis-Trend in EUR, täglich aktualisiert (Stand Vortag). Jede Zahl zeigt ihren Datenstand; ältere Stände sind gekennzeichnet.")
                    Link("Methodik", destination: URL(string: "https://cardbeacon.de/methodik")!)
                }
                Section("Hinweise") {
                    Text("Keine Anlageberatung. Preise ohne Gewähr.")
                    Text("Inoffizielle Fan-App. Pokémon und alle zugehörigen Namen sind Marken von Nintendo, Creatures Inc. und GAME FREAK inc. Diese App steht in keiner Verbindung zu ihnen.")
                }
                Section("Datenschutz") {
                    Text("Kein Konto, keine Werbung, kein Tracking. Die Merkliste bleibt auf diesem Gerät.")
                    Link("Datenschutzerklärung", destination: URL(string: "https://cardbeacon.de/datenschutz")!)
                    Link("Impressum", destination: URL(string: "https://cardbeacon.de/impressum")!)
                }
                Section {
                    Text("Version \(version)").foregroundStyle(.secondary)
                }
            }
            .font(.callout)
            .navigationTitle("Info")
        }
    }
}
