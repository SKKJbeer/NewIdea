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
        XCTAssertEqual(PositionFormularInhalt.zahl("12,50"), 12.5)
        XCTAssertEqual(PositionFormularInhalt.zahl("1.234,5"), 1234.5)
        XCTAssertNil(PositionFormularInhalt.zahl("abc"))
        XCTAssertEqual(PositionFormularInhalt.zahl("12.50"), 12.5)
        XCTAssertEqual(PositionFormularInhalt.zahlText(12.5), "12,50")
    }

    func testSpitzenNurMitPreisUndNachVorzeichen() {
        let p = [pos("a", 1, 10, "2026-10-01"), pos("b", 1, 10, "2026-10-01"), pos("c", 1, 10, "2026-10-01"), pos("d", 1, 0, "2026-10-01")]
        let s = PortfolioRechnung.spitzen(p, preise: ["a": 15, "b": 5, "c": 10, "d": 99])
        XCTAssertEqual(s.gewinner.map(\.position.karteId), ["a"])
        XCTAssertEqual(s.verlierer.map(\.position.karteId), ["b"])  // c unverändert, d ohne Kaufpreis
    }

    func testAufteilungNachSet() {
        let p = [pos("sv1-1", 1, 10, "2026-10-01"), pos("sv1-2", 2, 10, "2026-10-01"), pos("base1-4", 1, 10, "2026-10-01")]
        let a = PortfolioRechnung.aufteilung(p, preise: ["sv1-1": 10, "sv1-2": 10, "base1-4": 70])
        XCTAssertEqual(a.map(\.setCode), ["base1", "sv1"])
        XCTAssertEqual(a[0].anteil, 70, accuracy: 0.001)
        XCTAssertEqual(a[1].karten, 3)
    }

    func testAlteEintraegeOhneSetCodeLesbar() throws {
        let alt = #"[{"id":"6F9619FF-8B86-D011-B42D-00C04FC964FF","karteId":"sv1-1","name":"X","set":"S","bild":"","menge":1,"kaufpreis":5,"kaufdatum":0}]"#
        let p = try JSONDecoder().decode([Position].self, from: Data(alt.utf8))
        XCTAssertNil(p[0].setCode)
        XCTAssertEqual(p[0].setSchluessel, "sv1")
    }
}
