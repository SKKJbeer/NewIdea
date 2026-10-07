import Foundation

enum APIFehler: LocalizedError {
    case nichtGefunden
    case zuViele
    case server(Int)
    case netz

    var errorDescription: String? {
        switch self {
        case .nichtGefunden: return "Nicht gefunden."
        case .zuViele: return "Zu viele Anfragen — bitte kurz warten."
        case .server: return "Die Marktdaten sind gerade nicht erreichbar."
        case .netz: return "Keine Verbindung zum Internet."
        }
    }
}

/// Zugriff auf https://cardbeacon.de/api/v1 — nur lesend, ohne Konto.
final class APIClient {
    static let shared = APIClient()

    let basis: URL
    private let session: URLSession
    private let decoder = JSONDecoder()

    init(basis: URL = URL(string: "https://cardbeacon.de")!, session: URLSession? = nil) {
        self.basis = basis
        if let session {
            self.session = session
        } else {
            let konfig = URLSessionConfiguration.default
            konfig.timeoutIntervalForRequest = 15
            konfig.requestCachePolicy = .useProtocolCachePolicy
            konfig.urlCache = URLCache(memoryCapacity: 8 << 20, diskCapacity: 64 << 20)
            self.session = URLSession(configuration: konfig)
        }
    }

    func status() async throws -> Status { try await hole("api/v1/status") }
    func markt() async throws -> Markt { try await hole("api/v1/markt") }
    func suche(_ begriff: String) async throws -> Suchergebnis {
        try await hole("api/v1/suche", query: [URLQueryItem(name: "q", value: begriff)])
    }
    func karte(_ id: String) async throws -> KartenDetail { try await hole("api/v1/karten/\(pfadTeil(id))") }
    func setKarten(_ code: String) async throws -> SetDetail { try await hole("api/v1/sets/\(pfadTeil(code))") }
    func preise(_ ids: [String]) async throws -> PreisAntwort {
        try await hole("api/v1/preise", query: [URLQueryItem(name: "ids", value: ids.joined(separator: ","))])
    }
    func verlauf(_ ids: [String], tage: Int) async throws -> VerlaufAntwort {
        try await hole("api/v1/verlauf", query: [URLQueryItem(name: "ids", value: ids.joined(separator: ",")),
                                                 URLQueryItem(name: "tage", value: String(tage))])
    }

    /// Kartenbild über den eigenen Bild-Proxy: verkleinert, ein Jahr im CDN, mit Ersatzquelle.
    func bildURL(_ quelle: String, breite: Int) -> URL? {
        var teile = URLComponents(url: basis.appendingPathComponent("api/img"), resolvingAgainstBaseURL: false)
        teile?.queryItems = [URLQueryItem(name: "u", value: quelle), URLQueryItem(name: "w", value: String(breite))]
        return teile?.url
    }

    private func pfadTeil(_ s: String) -> String {
        s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed.subtracting(CharacterSet(charactersIn: "/"))) ?? s
    }

    private func hole<T: Decodable>(_ pfad: String, query: [URLQueryItem] = []) async throws -> T {
        var teile = URLComponents(url: basis.appendingPathComponent(pfad), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { teile.queryItems = query }
        var anfrage = URLRequest(url: teile.url!)
        anfrage.setValue("application/json", forHTTPHeaderField: "Accept")
        let daten: Data
        let antwort: URLResponse
        do {
            (daten, antwort) = try await session.data(for: anfrage)
        } catch {
            throw APIFehler.netz
        }
        let code = (antwort as? HTTPURLResponse)?.statusCode ?? 0
        switch code {
        case 200: return try decoder.decode(T.self, from: daten)
        case 404: throw APIFehler.nichtGefunden
        case 429: throw APIFehler.zuViele
        default: throw APIFehler.server(code)
        }
    }
}
