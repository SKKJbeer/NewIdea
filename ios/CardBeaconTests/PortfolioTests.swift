import XCTest
@testable import CardBeacon

final class PortfolioTests: XCTestCase {
    private func tag(_ s: String) -> Date { Format.isoTag(s)! }
    private func pos(_ id: String, _ menge: Int, _ preis: Double, _ kauf: String) -> Position {
        Position(karteId: id, name: id, set: "S", bild: "", menge: menge, kaufpreis: preis, kaufdatum: tag(kauf))
    }

    func testOhnePreisZaehltNichtAlsNull() {
        let s = PortfolioRechnung.stand([pos("a", 2, 10, "2026-10-01"), pos("b", 1, 50, "2026-10-01")], preise: ["a": 15])
        XCTAssertEqual(s.wert, 30)
        XCTAssertEqual(s.investiertMitPreis, 20)
        XCTAssertEqual(s.investiertGesamt, 70)
        XCTAssertEqual(s.ohnePreis, 1)
        XCTAssertEqual(s.gewinn, 10)
        XCTAssertEqual(s.gewinnProzent!, 50, accuracy: 0.001)
    }

    func testVerlaufNurAnVollstaendigenTagen() {
        let p = [pos("a", 1, 10, "2026-10-01"), pos("b", 1, 10, "2026-10-01")]
        let v = PortfolioRechnung.verlauf(p, tageswerte: [
            "a": [Verlaufspunkt(datum: "2026-10-02", preis: 11), Verlaufspunkt(datum: "2026-10-03", preis: 12)],
            "b": [Verlaufspunkt(datum: "2026-10-03", preis: 20)],
        ])
        XCTAssertEqual(v.map(\.wert), [32])  // 02.10. fehlt b → kein Punkt
    }

    func testZukaufIstKeinGewinn() {
        let p = [pos("a", 1, 100, "2026-10-01"), pos("b", 1, 50, "2026-10-05")]
        let v = PortfolioRechnung.verlauf(p, tageswerte: [
            "a": [Verlaufspunkt(datum: "2026-10-02", preis: 100), Verlaufspunkt(datum: "2026-10-06", preis: 100)],
            "b": [Verlaufspunkt(datum: "2026-10-06", preis: 50)],
        ])
        XCTAssertEqual(v.map(\.wert), [100, 150])
        let e = PortfolioRechnung.entwicklung(v, positionen: p)!
        XCTAssertEqual(e.betrag, 0, accuracy: 0.001)
    }

    func testPreisEingabe() {
        XCTAssertEqual(PositionFormular.zahl("12,50"), 12.5)
        XCTAssertEqual(PositionFormular.zahl("1.234,5"), 1234.5)
        XCTAssertNil(PositionFormular.zahl("abc"))
        XCTAssertEqual(PositionFormular.zahlText(12.5), "12,50")
    }
}
