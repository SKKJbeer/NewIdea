# App Store — Texte und Vorgaben (Entwurf, Stand 08.10.2026)

Für die Einreichung in App Store Connect. Alles hier beschreibt, was die App heute tatsächlich
kann (Build 119). Keine Zahlen, die sich ändern, ohne Datum.

## Name und Untertitel

- **Name (30 Zeichen):** `CardBeacon – TCG Marktpreise` (so angelegt; „Pokémon" bewusst nicht im
  Namen — Review-Richtlinie 5.2.1, fremde Marke)
- **Untertitel (30):** `Sammelkarten-Preise täglich`

## Werbetext (170 Zeichen, jederzeit änderbar)

> Cardmarket-Preise vom Vortag für rund 19.000 Sammelkarten, dein Portfolio auf dem Gerät und ein
> Marktbericht mit Kartenbildern — kostenlos, ohne Anmeldung.

## Beschreibung

> CardBeacon zeigt, was Sammelkarten gerade wert sind — mit dem Cardmarket-Preis-Trend vom Vortag,
> nicht mit Werten von vor Monaten.
>
> MARKT
> • CardBeacon Index: die typische Preisbewegung über alle erfassten Karten
> • Aufwärts und abwärts: die auffälligsten Bewegungen der letzten 30 Tage
> • Set-Bewegung, neue Sets, angekündigte Sets und was in Japan schon erschienen ist
>
> KARTEN
> • Suche über rund 19.000 Karten und alle Sets
> • Preis-Trend, günstigstes Angebot, Ø Verkauf und Ø 30 Tage
> • Preisverlauf aus echten Tageswerten — ohne geschätzte Kurven
> • Japanische und koreanische Preise, wenn die Karte eindeutig zugeordnet ist
>
> PORTFOLIO
> • Karten mit Menge, Kaufpreis und Datum erfassen
> • Depotwert, Gewinn und Verlust, Aufteilung nach Set
> • Bleibt auf deinem Gerät — kein Konto nötig
>
> LESEN
> • Wöchentlicher Marktbericht, Artikel und Guides für Einsteiger und Sammler
>
> Inoffizielle Fan-App. Keine Anlageberatung. Preise ohne Gewähr.

## Schlüsselwörter (100 Zeichen, kommagetrennt, ohne Leerzeichen)

`sammelkarten,tcg,cardmarket,kartenpreise,portfolio,glurak,trading card,karten wert,sammler,booster`

Markennamen Dritter (Pokémon) NICHT in die Schlüsselwörter — Ablehnungsrisiko nach 5.2.1.

## Kategorie, Alter, Datenschutz

- Primär: **Nachschlagewerke** (so im Projekt gesetzt), sekundär: Finanzen ist NICHT passend
  (keine Anlageberatung).
- Altersfreigabe: 4+ (keine Käufe in der App, keine Nutzerinhalte). Kauf-Links öffnen den Browser.
- Datenschutz-Angaben: **Keine Daten erfasst** — Portfolio und Merkliste liegen nur auf dem Gerät,
  die App sendet keine Kennungen. Datenschutz-URL: https://cardbeacon.de/datenschutz
- Support-URL: https://cardbeacon.de/impressum

## Bildschirmfotos (6,9" und 6,5")

Reihenfolge nach dem, was zuerst überzeugt:
1. Markt (Index mit Kurve, Karussell)
2. Kartenseite (großes Bild, Preis, Verlauf)
3. Portfolio (Depotwert, Aufteilung)
4. Marktbericht (Kopf mit Kartenfächer, Balken)
5. Suche (Set-Raster)

Aufnehmen im Simulator über den CI-Lauf ist möglich (Workflow-Schritt `xcrun simctl io booted
screenshot`) — offen, bis die öffentliche Testphase steht.
