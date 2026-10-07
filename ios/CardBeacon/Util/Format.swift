import Foundation

/// Deutsche Zahlen- und Datumsformate — dieselben Regeln wie src/lib/format.ts:
/// Komma als Dezimaltrennzeichen, Punkt bei Tausendern, Zahl und Einheit mit
/// geschütztem Leerzeichen (nie umbrechen).
enum Format {
    private static let euroF: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.numberStyle = .currency
        f.currencyCode = "EUR"
        f.roundingMode = .halfUp
        return f
    }()

    private static let prozentF: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.numberStyle = .decimal
        f.minimumFractionDigits = 1
        f.maximumFractionDigits = 1
        // Halb aufwärts wie Intl auf der Website (4,25 → 4,3), nicht kaufmännisch-gerade.
        f.roundingMode = .halfUp
        return f
    }()

    private static let tagF: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let anzeigeTagF: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "dd.MM.yyyy"
        return f
    }()

    /// „1.234,56 €" — `nil` wird zu „—", nie zu 0.
    static func euro(_ wert: Double?) -> String {
        guard let wert else { return "—" }
        return (euroF.string(from: NSNumber(value: wert)) ?? "—").replacingOccurrences(of: " ", with: "\u{00A0}")
    }

    /// „+4,2 %" bzw. „−3,1 %" — `nil` wird zu „—".
    static func prozent(_ wert: Double?) -> String {
        guard let wert else { return "—" }
        let zahl = prozentF.string(from: NSNumber(value: abs(wert))) ?? "—"
        let vorzeichen = wert > 0 ? "+" : (wert < 0 ? "\u{2212}" : "")
        return "\(vorzeichen)\(zahl)\u{00A0}%"
    }

    /// „1.234" — Stückzahlen ohne Nachkommastellen.
    static func anzahl(_ wert: Int) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.numberStyle = .decimal
        return f.string(from: NSNumber(value: wert)) ?? String(wert)
    }

    /// „12,3" — Zahl mit fester Stellenzahl, halb aufwärts.
    static func zahl(_ wert: Double, stellen: Int = 1) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.numberStyle = .decimal
        f.minimumFractionDigits = stellen
        f.maximumFractionDigits = stellen
        f.roundingMode = .halfUp
        return f.string(from: NSNumber(value: wert)) ?? String(wert)
    }

    static func isoTag(_ s: String) -> Date? { tagF.date(from: String(s.prefix(10))) }

    /// „2026-10-05" aus einem Datum (UTC).
    static func isoText(_ d: Date) -> String { tagF.string(from: d) }

    /// „05.10.2026" aus „2026-10-05"; unlesbar → „unbekannt".
    static func tag(_ s: String?) -> String {
        guard let s, let d = isoTag(s) else { return "unbekannt" }
        return anzeigeTagF.string(from: d)
    }
}
