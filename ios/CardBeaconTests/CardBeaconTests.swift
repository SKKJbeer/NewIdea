import XCTest
import SwiftUI
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

final class FliesstextTests: XCTestCase {
    func testBloecke() {
        let b = Fliesstext.bloecke("## Marktlage\nZeile eins\nZeile zwei\n\n- Punkt\n## Ausblick\nText")
        XCTAssertEqual(b, [.ueberschrift("Marktlage"), .absatz("Zeile eins Zeile zwei"), .punkt("Punkt"), .ueberschrift("Ausblick"), .absatz("Text")])
    }
}

final class LeseTests: XCTestCase {
    func testAbschnitteMitVorwort() {
        let t = Fliesstext.abschnitte("Einleitung\n\n## Marktlage\nA\nB\n## Ausblick\nC")
        XCTAssertEqual(t.vorwort, "Einleitung")
        XCTAssertEqual(t.abschnitte.map(\.titel), ["Marktlage", "Ausblick"])
        XCTAssertEqual(t.abschnitte[0].text, "A\nB")
    }

    func testKennzahlenWerdenHervorgehoben() {
        let a = Fliesstext.hervorgehoben("Index +2,6\u{00A0}% bei 1.234,50\u{00A0}€")
        XCTAssertEqual(String(a.characters), "Index +2,6\u{00A0}% bei 1.234,50\u{00A0}€")
        let fett = a.runs.filter { $0[AttributeScopes.SwiftUIAttributes.FontAttribute.self] != nil }.count
        XCTAssertEqual(fett, 2)
    }

    func testSymbole() {
        XCTAssertEqual(InhaltSymbol.berichtAbschnitt("Trends"), "flame.fill")
        XCTAssertEqual(InhaltSymbol.fuer("unbekannt"), "book.closed.fill")
    }
}
