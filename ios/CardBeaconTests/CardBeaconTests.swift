import XCTest
@testable import CardBeacon

final class ModelleTests: XCTestCase {
    func testKarteDekodiertMitFehlendenWerten() throws {
        let json = """
        {"id":"sv3pt5-199","name":"Charizard ex","nameDe":null,"set":"151","setCode":"sv3pt5","nummer":"199",
         "seltenheit":"SIR","bild":"https://images.pokemontcg.io/sv3pt5/199.png","preis":null,"trend30":null,
         "preisStand":null,"frisch":false,"url":"https://cardbeacon.de/karten/sv3pt5-199","neuesFeld":42}
        """.data(using: .utf8)!
        let k = try JSONDecoder().decode(Karte.self, from: json)
        XCTAssertNil(k.preis)
        XCTAssertEqual(k.anzeigeName, "Charizard ex")
        XCTAssertFalse(k.frisch)
    }

    func testMarktOhneIndex() throws {
        let json = #"{"index":null,"indexVerlauf":[],"aufwaerts":[],"abwaerts":[],"datenStand":null}"#.data(using: .utf8)!
        let m = try JSONDecoder().decode(Markt.self, from: json)
        XCTAssertNil(m.index)
    }
}

final class FormatTests: XCTestCase {
    func testEuroDeutsch() {
        XCTAssertEqual(Format.euro(1234.5), "1.234,50\u{00A0}€")
        XCTAssertEqual(Format.euro(nil), "—")
    }

    func testProzentMitVorzeichen() {
        XCTAssertEqual(Format.prozent(4.25), "+4,3\u{00A0}%")
        XCTAssertEqual(Format.prozent(-3.1), "\u{2212}3,1\u{00A0}%")
        XCTAssertEqual(Format.prozent(nil), "—")
    }

    func testTag() {
        XCTAssertEqual(Format.tag("2026-10-05"), "05.10.2026")
        XCTAssertEqual(Format.tag(nil), "unbekannt")
    }
}
