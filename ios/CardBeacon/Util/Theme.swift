import SwiftUI

/// Farben der Website (Bloomberg-/TradingView-Stil, siehe CLAUDE.md → Design-Token).
enum Theme {
    static let hintergrund = Color(red: 0x0a / 255, green: 0x0a / 255, blue: 0x0f / 255)
    static let karte = Color(red: 0x13 / 255, green: 0x13 / 255, blue: 0x1e / 255)
    static let rand = Color(red: 0x2a / 255, green: 0x2a / 255, blue: 0x3a / 255)
    static let akzent = Color(red: 0xa7 / 255, green: 0x8b / 255, blue: 0xfa / 255)   // violet-400
    static let aufwaerts = Color(red: 0x34 / 255, green: 0xd3 / 255, blue: 0x99 / 255) // emerald-400
    static let abwaerts = Color(red: 0xfb / 255, green: 0x71 / 255, blue: 0x85 / 255)  // rose-400
    static let warnung = Color(red: 0xfb / 255, green: 0xbf / 255, blue: 0x24 / 255)   // amber-400

    /// Steigend grün, fallend rot — überall gleich (Stolperstelle 41).
    static func trendFarbe(_ wert: Double?) -> Color {
        guard let wert, wert != 0 else { return .secondary }
        return wert > 0 ? aufwaerts : abwaerts
    }
}
