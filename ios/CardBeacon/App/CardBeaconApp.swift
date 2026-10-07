import SwiftUI

@main
struct CardBeaconApp: App {
    @StateObject private var merkliste = Merkliste()
    @StateObject private var portfolio = PortfolioSpeicher()
    @StateObject private var status = AppStatus()

    var body: some Scene {
        WindowGroup {
            HauptAnsicht()
                .environmentObject(merkliste)
                .environmentObject(portfolio)
                .environmentObject(status)
                .preferredColorScheme(.dark)
                .tint(Theme.akzent)
                .task { await status.pruefen() }
        }
    }
}

struct HauptAnsicht: View {
    @EnvironmentObject private var status: AppStatus

    var body: some View {
        if status.updateNoetig {
            UpdateHinweis()
        } else {
            TabView {
                MarktView()
                    .tabItem { Label("Markt", systemImage: "chart.line.uptrend.xyaxis") }
                SucheView()
                    .tabItem { Label("Suche", systemImage: "magnifyingglass") }
                LesenView()
                    .tabItem { Label("Lesen", systemImage: "book") }
                PortfolioView()
                    .tabItem { Label("Portfolio", systemImage: "briefcase") }
                MerklisteView()
                    .tabItem { Label("Merkliste", systemImage: "star") }
            }
        }
    }
}

/// Fragt beim Start, ob dieser Build noch unterstützt wird. Ein Ausfall der
/// Abfrage sperrt die App NICHT — sie läuft dann wie gewohnt weiter.
@MainActor
final class AppStatus: ObservableObject {
    @Published private(set) var updateNoetig = false

    func pruefen() async {
        guard let s = try? await APIClient.shared.status() else { return }
        let build = Int(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0") ?? 0
        updateNoetig = s.minAppBuild > build
    }
}

struct UpdateHinweis: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.down.app").font(.system(size: 48)).foregroundStyle(Theme.akzent)
            Text("Update erforderlich").font(.title2.bold())
            Text("Diese Version kann die aktuellen Marktdaten nicht mehr lesen. Bitte im App Store aktualisieren.")
                .multilineTextAlignment(.center).foregroundStyle(.secondary)
        }
        .padding(32)
    }
}
