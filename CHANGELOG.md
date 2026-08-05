# Changelog — PokéMarket Intelligence

Alle Versionen und Änderungen. Format: [Semantic Versioning](https://semver.org/lang/de/) — `MAJOR.MINOR.PATCH`

> Dieses Changelog wird bei jedem Deploy nach `main` aktualisiert.
> Die gleichen Informationen sind auch unter `/changelog` auf der Website sichtbar.

---

## [6.0.3] - 5. August 2026 · Eine Anzahl hat keine Nachkommastellen

### Behoben
- **„14.985,00 Karten · 155,00 Sets“** — der Tausenderpunkt aus v6.0.2 war richtig, der Formatierer falsch: `formatAmount` formatiert BETRAEGE und setzt deshalb zwei Nachkommastellen. Eine Anzahl mit Cent-Genauigkeit
- Neu: `formatCount` fuer Stueckzahlen. Beide Formatierer sind per Test voneinander abgegrenzt — waeren sie gleich, waere die Trennung wertlos

### Anmerkung
- Beide Fehler dieser Reihe (fehlender Tausenderpunkt, dann falsche Nachkommastellen) waren vorher vorhanden und unsichtbar: Bei 204 Karten faellt weder das eine noch das andere auf. Eine groessere Zahl deckt auf, was eine kleine verdeckt

---

## [6.0.2] - 5. August 2026 · Groessere Zahlen brauchen deutsche Schreibweise

### Behoben
- **„14985 Karten“** stand ohne Tausenderpunkt auf der Startseite. Bei 204 Karten war der Fehler nicht zu sehen — mit dem Gesamtbestand ist er es an sechs Stellen gleichzeitig. Alle laufen jetzt ueber `formatAmount` (Projektregel: jede sichtbare Zahl deutsch)
- **„Stichprobe“** als Beschriftung stimmte nicht mehr. Der Index rechnet seit v6.0.0 auf dem gesamten erfassten Bestand, nicht auf einer Auswahl — die Kachel heisst jetzt „Gemessene Karten“, der Bestandshinweis „im laufenden Bestand“
- Der Kommentar zur Abdeckungs-Kachel behauptete weiterhin, der Index rechne auf einer Stichprobe. Ein Kommentar, der die Gegenwart falsch beschreibt, ist schlimmer als keiner

---

## [6.0.1] - 5. August 2026 · Der neue Index kam nicht durch die eigene Qualitaetspruefung

### Behoben
- **Die Startseite zeigte „Keine Messung“ und einen Gedankenstrich statt einer Zahl** — direkt nach der Umstellung auf den Gesamtbestand, live sichtbar
- **Ursache:** Die Zeilen aus dem Kartenindex trugen weder `id` noch `imageUrl`, weil sie nur fuer Kennzahlen gedacht waren. `validateMarketData` — die Pruefung, durch die JEDE Kennzahl laeuft — verwirft aber Zeilen ohne Bild und behandelt jede weitere Zeile mit derselben (leeren) ID als Dublette. Von 19.690 Karten blieb damit genau EINE uebrig, und eine Karte reicht nicht fuer eine Aussage
- **Warum es der Index-Vergleich nicht gezeigt hat:** Er ruft `computePmi` direkt auf, ohne die Pruefung, die im Betrieb davorsteht. Gemessen wurde also ein anderer Weg als der ausgelieferte
- Beide Felder kommen jetzt mit. Der Name bleibt weg: Ihn prueft niemand, und er ist das mit Abstand groesste Feld

### Die Lehre, festgehalten als Pruefung
- Wer Daten fuer eine Kennzahl erzeugt, muss sie durch **dieselbe** Pruefung schicken, die sie spaeter durchlaufen — sonst prueft man etwas anderes, als man ausliefert. Fuenf neue Faelle halten das fest, darunter zwei, die die URSACHE beschreiben (ohne ID bleibt genau eine Zeile uebrig, ohne Bild keine)

---

## [6.0.0] - 5. August 2026 · Der Index rechnet auf dem ganzen Markt — als Median

Der CardBeacon Index steht ab sofort auf dem **gesamten erfassten Kartenbestand** statt auf einer Stichprobe, und er ist der **Median** statt eines preisgewichteten Mittels. Das ist die groesste Aenderung an der Kernaussage der Seite seit ihrem Bestehen — deshalb eine neue Hauptversion.

### Geaendert
- **Grundlage: 19.690 erfasste Karten aus 155 Sets statt 204 aus 15.** Die alte Stichprobe kam aus drei Seltenheits-Abfragen und bestand ausschliesslich aus den obersten Seltenheitsstufen („Special Illustration Rare", „Hyper Rare") — eine Marktaussage aus einem Prozent des Bestands, und aus dem unrepraesentativsten Prozent
- **Kennzahl: Median statt preisgewichtetem Mittel.** Gemessen auf dem Gesamtbestand: preisgewichtetes Mittel **+28,69 %**, Raender gestutzt **+26,15 %**, Gewichtsdeckel **+23,71 %**, **Median +3,50 %**. Die Verteilung ist stark rechtsschief (P90 +40 %, P99 +100 %, Maximum +1191 %); ein Mittelwert daraus ist rechnerisch richtig und als Satz ueber den Markt unbrauchbar
- **Karten unter zehn Cent gehen nicht in den Index.** Dort steht der Preis auf der untersten Cardmarket-Stufe — zwei auf drei Cent sind fuenfzig Prozent, ohne dass etwas geschehen ist. Ueber ALLE Karten war der Median deshalb exakt 0,00 %, ab zehn Cent +3,50 %. Die Karten bleiben such- und auffindbar wie alle anderen; sie tragen nur keine Marktaussage
- **Eine Grundlage statt vier.** `getMarketBasis()` ersetzt vier getrennte `getHomepageCards(250)`-Aufrufe (Tages-Cron, Studio-Route, `/api/market/pmi`, Marktkontext). Faellt der Bestand aus, greift die alte Stichprobe — aber sichtbar, ueber das Feld `quelle`
- **Anzeige und Kennzahl bleiben getrennt.** Bewegungslisten und Set-Rangliste brauchen Karten mit Namen und Bild und ziehen weiterhin die geholte Auswahl; Index und Marktbreite brauchen Messpunkte
- **Die Methodik-Seite erklaert die Umstellung** samt Zahlen und nennt die Preisgewichtung als das, was sie war: eine Entscheidung ueber den Aufbau des Index, nie eine Erkenntnis ueber den Markt

### Was ausdruecklich ausgeschlossen wurde
- **Veraltete oder anders gerechnete Werte im Bestand.** Fuer dieselben 250 Karten stimmen Live-Abruf und gespeicherter Wert in **250 von 250 Faellen exakt** ueberein (Abweichung 0,00 Prozentpunkte). Die hohen Werte kommen von ANDEREN Karten — alten und selten gehandelten, bei denen der Cardmarket-Trendpreis strukturell ueber dem 30-Tage-Schnitt liegt
- **Ausreisser als Erklaerung.** Stutzen und Deckeln aendern das Ergebnis kaum (+28,7 → +26,2 → +23,7). Es sind keine zehn Karten, sondern die ganze Verteilung

---

## [5.9.3] - 5. August 2026 · Derselbe Kartenbestand auf beiden Seiten

### Neu
- Der Index-Vergleich stellt jetzt **dieselben Karten-IDs** gegenueber: den Live-Trend aus der Kartendatenbank gegen den im Index gespeicherten Wert derselben Karte

### Warum das der entscheidende Test ist
- Stichprobe und Gesamtbestand unterscheiden sich um rund 29 Prozentpunkte. Dafuer gibt es genau zwei moegliche Erklaerungen, und sie fuehren zu gegensaetzlichen Schluessen: **verschiedene Karten** (dann ist die Zahl echt, misst aber etwas anderes als „der Markt") oder **verschiedene Werte fuer dieselbe Karte** (dann ist der gespeicherte Trend veraltet oder anders gerechnet — und darf ueberhaupt nichts tragen, egal mit welcher Formel)
- Trimmen und Deckeln hatten die Frage nicht beantwortet: +28,69 % roh, +26,15 % gestutzt, +23,71 % gedeckelt. Es sind also keine zehn Ausreisser, sondern die ganze Verteilung

---

## [5.9.2] - 5. August 2026 · Drei belastbare Alternativen zum heutigen Indexwert

### Neu
- Der Index-Vergleich rechnet zusaetzlich drei ausreisserfeste Varianten: **Median** (ungewichtet), **preisgewichtet mit gestutzten Raendern** (P1/P99) und **preisgewichtet mit Gewichtsdeckel** (keine Karte ueber 0,5 % des Gesamtgewichts) — fuer Stichprobe und Gesamtbestand gleichermassen

### Warum
- Der heutige Indexwert ist preisgewichtet und hat **keinerlei Ausreisserschutz**. Auf der gleichartigen Stichprobe faellt das nie auf, auf dem Gesamtbestand entscheidet es alles: **zehn Karten von 19.063 tragen rund 12 der 28,7 Prozentpunkte** — alle aus alten Sets (pop5, base1, ex7, ecard3), wo ein 30-Tage-Schnitt aus wenigen Verkaeufen entsteht und dreistellige Prozentwerte zeigen kann
- Der Median aller 19.063 gemessenen Trends liegt bei **0 %**. Die Spanne des Mittelwerts gegen den Median ist kein Detail, sondern die eigentliche Frage

---

## [5.9.1] - 5. August 2026 · Der Vergleich sagt auch, WOHER die Zahl kommt

### Neu
- Der Index-Vergleich liefert zusaetzlich die Verteilung der gemessenen Trends (Minimum, 1./10./50./90./99. Perzentil, Maximum, Anzahl ueber +100 %, ueber +1000 %, unter −50 %) und die zehn Karten mit dem groessten Beitrag zum gewichteten Mittel

### Warum
- Der erste Durchlauf ergab auf dem Gesamtbestand **+28,69 %** gegen **−0,19 %** auf der heutigen Stichprobe. Ein Unterschied von 29 Prozentpunkten ist kein Messergebnis, sondern eine Frage. Ohne die Aufschluesselung waere der Vergleich nur ein zweiter Wert gewesen, kein Argument

---

## [5.9.0] - 5. August 2026 · Entscheidungsgrundlage fuer die Index-Breite

### Neu
- **`GET /api/index-vergleich`** (passwortgeschuetzt wie `/monitoring`) rechnet CBI und Marktbreite doppelt: einmal auf der heutigen Stichprobe von rund 250 Karten, einmal auf dem gesamten erfassten Bestand — und zusaetzlich je Preisschwelle (alle · ab 0,10 € · 0,50 € · 1 € · 5 € · 20 €)

### Warum getrennt vom Angezeigten
- Die Route **aendert keine einzige oeffentliche Kennzahl.** Eine Marktaussage umzustellen, ohne vorher zu wissen, wie stark sie sich dadurch aendert, waere das Falscheste ueberhaupt — man wuerde eine andere Zahl ausliefern und sie fuer dieselbe halten
- Wird der Bestand nicht vollstaendig gelesen (Seitengrenze), steht das ausdruecklich in der Antwort. Eine Vergleichszahl, die selbst eine Behauptung ist, waere wertlos

---

## [5.8.1] - 5. August 2026 · Gleichnamige Treffer sind unterscheidbar

### Behoben
- **Folge der neuen Reihenfolge, an der Produktion nachgemessen:** „mew" liefert jetzt acht Karten, die alle „Mew" heissen — richtig sortiert, aber die zweite Zeile zeigte ENTWEDER den deutschen Namen ODER das Set. Bei einer Karte mit abweichendem deutschen Namen (Charizard/Glurak) waeren das acht optisch identische Zeilen gewesen, unterscheidbar nur am Preis. Das Set steht jetzt IMMER da; der deutsche Name kommt davor, wenn er abweicht

---

## [5.8.0] - 5. August 2026 · Die Suche zeigt die gemeinte Karte zuerst

### Behoben
- **Die Trefferliste war nach Preis sortiert, nicht nach Passgenauigkeit.** An der Produktion gemessen, Eingabe „mew": Platz 1 war „Mewtwo ★" (1599,66 €), Platz 4 und 5 waren „Team Rocket's Mewtwo ex" und „Rocket's Mewtwo ex" — und die Karte, die schlicht **Mew** heisst, stand auf Platz 6. Das war eine Liste der teuersten passenden Karten, keine Liste der gemeinten
- Sortiert wird jetzt zuerst nach Rang, dann nach Preis: exakter Name → Namensanfang → Wortanfang → irgendwo enthalten. Der Preis bleibt bewusst das zweite Kriterium — wer „charizard" tippt, will unter zwanzig Charizard-Karten zuerst die sehen, ueber die gesprochen wird
- **Die Wortgrenze wird ohne `\b` bestimmt.** Kartennamen sind voll mit `δ`, `★` und `é`; `\b` haelt die nicht fuer Buchstaben und haette „Mew δ" falsch eingestuft

### Geaendert
- Die Index-Abfrage holt das Fuenffache der angezeigten Menge (gedeckelt bei 200). Die Datenbank kann nur nach Preis sortieren — wer genau passt, entscheidet sich danach, und bei einem engen Fenster waere die beste Antwort gar nicht erst dabei. Nach aussen geht unveraendert nur die angeforderte Menge
- Die Rangfolge liegt als eigene, reine Funktion in `src/lib/such-relevanz.ts` und ist mit den echten Produktionsdaten aus dem Befund geprueft (12 Faelle), nicht nur gegen den Quelltext

---

## [5.7.0] - 5. August 2026 · Die Suche findet auch Sets

### Behoben
- **Ein Set-Name lief in eine Sackgasse.** Das Suchfeld heisst „Suche Karten, Sets, …", und die Startseite nennt Sets beim Namen („Black Bolt +6,7 %"). Wer das las und „black bolt" eintippte, bekam an der Produktion gemessen: 0 Vorschlaege, 3,7 s Ladezeit, dann „Keine Karten gefunden" — und darunter den Rat, es doch mit dem englischen Namen zu versuchen. Der Name WAR englisch; er gehoert nur zu einem Set und nicht zu einer Karte. Eine Suche, die etwas verspricht und dann ins Leere fuehrt, ist schlechter als eine, die nichts verspricht

### Neu
- **Set-Treffer im Vorschlagsfeld** — ueber den Karten, ausserhalb des Rollbereichs. Wer einen Set-Namen tippt, meint das Set, nicht die dreissig Karten daraus, die zufaellig denselben Namen im Set-Feld tragen
- **Set-Treffer auf der Suchseite**, mit Set-Bild statt nur als Text: Der Zweck des Blocks ist, dass jemand sein Set wiedererkennt. Findet die Suche nur Sets und keine Karte, steht das ausdruecklich da statt eines Leerzustands

### Geaendert
- **Die Set-Suche geht in den eigenen Kartenindex, nicht in eine neue Tabelle.** Die Set-Namen stehen bereits in jeder Zeile — eine zweite Tabelle waere eine zweite Stelle, an der etwas veralten kann
- **Karten und Sets werden nebeneinander gesucht**, nicht nacheinander; ein Ausfall der Set-Suche reisst die Kartenvorschlaege nicht mit
- **Bewusst ohne Kartenzahl am Set.** Sie liesse sich aus den geholten Zeilen zaehlen — aber nur innerhalb der Abfragegrenze. Bei einem grossen Set oder zwei gleichzeitigen Treffern waere sie zu niedrig, ohne dass man ihr das ansieht; die genaue Zahl steht einen Klick entfernt auf der Set-Seite
- Die Vorschlagsroute antwortet jetzt mit `{ cards, sets }` statt einer nackten Liste. Der Client vertraegt beide Formen — waehrend der ersten fuenf Minuten nach einer Auslieferung beantwortet der Zwischenspeicher noch die alte

---

## [5.6.2] - 4. August 2026 · Auch die Ladezustaende zeigen die Kopfleiste nur einmal

### Behoben
- **Derselbe Fehler wie v5.6.1, eine Ebene tiefer.** Die Lade-Umrisse liegen INNERHALB der Ladegrenze, die Navigation liegt seit v5.5.0 ausserhalb davon — sie verschwindet beim Navigieren gar nicht mehr. Das allgemeine Lade-Skelett rendert die Kopfleiste trotzdem ein zweites Mal, der Ladezustand der Suche zeichnete ein graues Band an ihrer Stelle. Beides entfernt
- **Der Lade-Umriss der Suche war mittig, die Suchseite ist linksbuendig.** Beim Erscheinen der Treffer sprang deshalb der ganze Seitenkopf nach links. Der Umriss bildet jetzt nach, was wirklich kommt: linksbuendig in `max-w-6xl`, danach Trefferzeilen in derselben Aufteilung wie die fertige Liste

### Geaendert
- Die Pruefung „das Lade-Skelett traegt die echte Navigation" (aus der Zeit, als es sie tragen MUSSTE) prueft jetzt das Gegenteil und nennt den Grund fuer die Umkehr. Der Befund dahinter — waehrend des Ladens muss die Seite bedienbar bleiben — gilt unveraendert, nur erfuellt ihn jetzt die Anwendungshuelle

---

## [5.6.1] - 4. August 2026 · Eine Kopfleiste statt zwei

### Behoben
- **Auf dem Telefon standen ZWEI identische Kopfleisten uebereinander** — auf jeder der achtzehn Seiten. Seit v5.5.0 bringt die Anwendungshuelle eine mit (unterhalb von 1024 px, wo die Seitenleiste weicht), jede Seite brachte weiterhin ihre eigene. Das kostete rund sechzig Pixel an der wertvollsten Stelle der Seite und sah aus wie ein Fehler, weil es einer war. Gefunden beim Nachmessen der Suche auf 390 Pixel, nicht durch einen Test — deshalb gibt es jetzt einen: `suche-oberflaeche.test.ts` bricht den Build, sobald eine Seite wieder ihre eigene Kopfleiste rendert

---

## [5.6.0] - 4. August 2026 · Suche: sauber dargestellt und spuerbar schneller

### Behoben
- **Das Vorschlagsfeld war 1015 Pixel hoch.** Gemessen auf 1536×900: 16 Treffer, jede Zeile gerendert, kein Deckel — die Liste lief unten aus dem Bild, und was darunter stand, sah niemand. Jetzt hoechstens acht Zeilen, gedeckelt auf `min(58vh, 22rem)` mit eigenem Rollbereich; die Trefferzahl darueber hinaus wird als „N weitere" benannt statt verschwiegen
- **Das Suchfeld hing sichtbar links neben allem anderen.** Die Kopfleiste stand bei 24 Pixeln Innenabstand, der Seiteninhalt darunter auf einem breiten Bildschirm bei 64. Beide nutzen jetzt dieselbe Staffel — Suchfeld und Ueberschrift beginnen nachgemessen bei exakt derselben Kante
- **460 Pixel Feldbreite in einer 1300 Pixel breiten Flaeche** liessen die Leiste als zwei Inseln mit Leere dazwischen lesen. Jetzt 640 — dieselbe Breite wie der Text der Startseite
- **Das eingebaute Leeren-Kreuz von `type="search"`** zeichnet Safari und Chrome als grauen Kreis, Firefox gar nicht — auf dem Mac sass es als fremder heller Fleck neben der violetten Schaltflaeche. Ersetzt durch ein eigenes, das ueberall gleich aussieht
- **Eine langsame frueher gestartete Abfrage konnte eine neuere ueberschreiben** — man tippt „charizard" und sieht die Treffer zu „chari". Laufende Abfragen werden jetzt abgebrochen, und eine Antwort, die den Abbruch ueberholt, wird verworfen

### Neu
- **Tastaturbedienung.** Pfeiltasten fuehren durch die Vorschlaege, die Eingabetaste oeffnet die ausgewaehlte Karte, danach faellt die Auswahl zurueck auf das Feld. Die ausgewaehlte Zeile bekommt einen violetten Balken — der reine Zeiger-Ton reicht nicht, wenn es keinen Zeiger gibt. `role="combobox"`, `aria-activedescendant` und `aria-selected` melden dasselbe an Hilfstechnik
- **Verlaengerungen eines bekannten Begriffs kommen ohne Netzweg.** Wer „char" getippt hat und „chari" ergaenzt, bekommt die Verfeinerung aus der bereits geholten Liste — gemessen 8 Zeilen sofort statt nach einer Netzrunde. Der echte Abruf laeuft parallel weiter; die Sofort-Antwort kann nur zu wenig zeigen, nie etwas Falsches
- **Die Vorschlagsroute deckelt, was sie herausgibt** (5 bis 20). Ohne Deckel waere `?n=5000` ein Weg, ueber sie die halbe Datenbank abzuziehen

### Geaendert
- **Wartezeit nach dem letzten Anschlag von 320 auf 140 ms.** Die ersten Vorschlaege standen gemessen nach 1876 ms, ein knappes Fuenftel davon war reines Warten. 140 ms liegen unter der Wahrnehmungsschwelle und buendeln trotzdem die Anschlaege innerhalb eines Wortes
- **Der Browser-Speicher der Suchtreffer hat eine Frist von fuenf Minuten.** In der Liste stehen Preise; der serverseitige Speicher ist bewusst an die Kartenseite gekoppelt, damit beide Seiten derselben Karte nie widersprechen. Ein unbefristeter Speicher im Browser haette genau diesen Widerspruch wieder eingefuehrt
- **Das Suchfeld bringt keine eigene Maximalbreite mehr mit** — sie stand im Widerspruch zu jedem Aufrufer, der eine andere vorgibt

---

## [5.5.0] - 4. August 2026 · Navigation ueberall, Abdeckung richtig gerechnet

### Behoben
- **„Abdeckung 1 %" verglich die falschen Groessen.** Dort stand die Index-Stichprobe (249) gegen den erfassten Bestand (19.690) — zwei INTERNE Zahlen, von denen die kleinere eine bewusste methodische Wahl ist: Der Index rechnet auf einer Stichprobe, nicht auf allem. Beide Zahlen waren richtig, die Aussage war falsch: Es las sich als „dieser Dienst kennt ein Prozent des Marktes". Jetzt steht dort der erfasste Bestand gegen die Gesamtzahl der Karten — die Frage, die jemand tatsaechlich hat, lautet „kennt ihr meine Karten?"
- **Die Seitenleiste gab es nur auf der Startseite** und verschwand, sobald man einen Reiter oeffnete. Navigation, die beim Navigieren weg ist, ist keine. Sie steht jetzt im Grundgeruest und gilt fuer alle siebzehn Seiten; die Kopfleiste uebernimmt weiterhin unterhalb von 1024 px

### Geaendert
- **Die Huelle holt ihre Daten selbst.** Vorher reichte die Startseite Datenstand und Bestand herein — siebzehn Seiten dieselben zwei Werte durchreichen zu lassen waeren siebzehn Gelegenheiten, es zu vergessen
- **Die `lg:hidden`-Regel fuer die Kopfleiste steht in der Kopfleiste**, nicht in jeder Seite

---

## [5.4.1] - 2. August 2026 · Kein Versprechen auf sprachspezifische Preise

### Behoben
- **Die Sprachwahl im Portfolio sagte „Preis wird von Cardmarket für diese Sprache abgerufen".** Das war eine Zusage, die niemand einlösen kann: Cardmarket vergibt derzeit gar keine API-Zugänge mehr („we are not accepting applications for API access at this time"). Jetzt steht dort, was tatsächlich passiert — die Sprache wird gespeichert, der Preis kommt aus der englischen Notierung, und der Grund steht dabei
- **Die Kartenseite sagte „Sprachspezifischer Preis nicht verfügbar — EN-Fallback".** Das liest sich wie eine vorübergehende Störung. Der Grund steht jetzt dabei

### Unverändert
- **Die Sprachwahl bleibt.** Sie gehört zur Position und ist für den eigenen Bestand eine Information — nur der Preis kommt bis auf Weiteres aus der englischen Notierung
- **Die Cardmarket-Anbindung bleibt im Code.** Sie ist fertig und wartet nur auf die vier `CARDMARKET_*`-Werte. Öffnet Cardmarket die Anträge wieder, genügt es, sie in Vercel einzutragen

---

## [5.4.0] - 2. August 2026 · Zubehoer im Text wird verlinkt — sparsam

### Neu
- **Erwaehnungen von Sleeves, Toploadern, Sammelalben und Aufbewahrungsboxen werden zu Kauflinks.** Umgesetzt als RENDER-Ebene, nicht im gespeicherten Text: Damit gilt die Regel rueckwirkend fuer alle bestehenden Guides, Artikel und Marktberichte und automatisch fuer jeden neuen — ohne dass ein einziger Beitrag umgeschrieben werden muss
- **„Nicht dominant" ist eine Zahl, keine Haltung:** hoechstens EIN Link je Zubehoerart und Beitrag (die erste Erwaehnung), hoechstens vier insgesamt, nur im Fliesstext. Ohne die erste Regel bekaeme ein Lagerungs-Guide, der zwoelfmal „Toploader" schreibt, zwoelf Links — und laese sich wie eine Anzeige
- **Kennzeichnung nach Recht** (`AffiliateNote`) auf Guides, Artikeln und Marktbericht — und NUR dort, wo auch wirklich ein Link steht. Ein Hinweis unter einem Text ohne Links waere eine Behauptung ueber etwas, das gar nicht da ist
- **Beide Generatoren wissen davon:** Sie sollen Zubehoer beim gaengigen Namen nennen, wo es sachlich hingehoert — aber KEIN Markup und keine Links schreiben, keine Marken, keine Preise, keine Kaufaufforderung. Ein Absatz, der Produkte aufzaehlt, ist Werbung und keine Analyse

### Hinweis
- Die Links zeigen weiterhin auf die generischen Fallbacks (Amazon-Suche, Dragon Shield). Sobald `NEXT_PUBLIC_TOPLOADER_AFFILIATE_URL` und die drei uebrigen in Vercel stehen, nutzt `AccessoryLink` sie automatisch — kein Code-Update noetig

---

## [5.3.0] - 2. August 2026 · Generierte Beitraege wiederholen sich nicht mehr

### Behoben
- **Fuenf von acht veroeffentlichten Beitraegen behandelten dieselbe Karte.** Gezaehlt auf der Seite: KW 31, 30.07., 16.07. und KW 28 drehten sich um Pikachu ex / Surging Sparks, KW 29 und KW 30 um dasselbe zweite Motiv. Zwei strukturelle Ursachen:
- **Derselbe Kandidatenpool.** Die Erzeugung bekam immer die sechs wertvollsten Karten der Stichprobe. Die aendern sich ueber Wochen kaum — und die auffaelligste Bewegung darin ist entsprechend oft dieselbe. Jetzt: breiterer Pool (30 statt 10) und eine Auswahl, die nach Datum deterministisch mischt statt nach Wert zu sortieren
- **Die letzten Titel wurden dem Modell als ANKNUEPFUNG gereicht** — woertlich „nur bei thematischem Bezug natuerlich darauf anspielen — kein Zwang". Gemeint war ein roter Faden, herausgekommen ist eine Endlosschleife. Jetzt stehen sie als Sperre im Prompt

### Neu
- **`content-variety.ts`** — die eigentliche Absicherung liegt eine Ebene tiefer als der Prompt: Karten, deren Name oder Set in einem der letzten sechs Titel vorkommt, gehen gar nicht erst in die Kandidatenliste. Ein Modell, das man bittet, sich nicht zu wiederholen, tut es trotzdem; ueber ein Thema, das nicht in der Liste steht, kann es nicht schreiben
- **Beide Richtungen im Kandidatenkreis** — staerkste Auf- UND Abwaertsbewegung. Ein Beitrag nur mit Steigerungen waere eine Auswahl zugunsten guter Nachrichten
- **Deterministisch gemischt, nicht zufaellig:** derselbe Tag ergibt dieselbe Auswahl (sonst zeigte ein zweiter Seitenaufruf einen anderen Artikel), verschiedene Tage verschiedene
- **Reicht die Auswahl nicht, wird die Sperre gelockert** — und das steht im Log. Lieber ein Beitrag ueber eine bekannte Karte als keiner

### Unveraendert
- **Der Marktbericht bleibt, wie er ist.** Er nennt die tatsaechlich staerksten Bewegungen der Woche; dort Abwechslung zu erzwingen waere eine Faelschung. Die Guides waren nie betroffen — sie ziehen aus einer kuratierten Themen-Warteschlange

---

## [5.2.1] - 2. August 2026 · Monitoring zu Ende aufgeraeumt

### Behoben
- **Das Monitoring meldete beide Cron-Jobs als INAKTIV, waehrend sie liefen.** „aktiv" haengte an `NEXT_PUBLIC_SITE_URL` — und die zeigt auf eine nie verbundene Domain, ist also nicht gesetzt. Die Cron-Routen brauchen sie gar nicht: Sie nutzen `url.origin`, genau weil die Variable ins Leere zeigte. Eine Falschmeldung ist schlimmer als eine fehlende
- **Der Block „features" ist jetzt auch aus der API-Antwort raus**, nicht nur aus der Anzeige. Ein totes Feld stehen zu lassen waere genau die Drift gewesen, gegen die der Umbau war

### Geaendert
- **Die Workflow-Beschreibungen entsprechen wieder dem tatsaechlichen Ablauf.** Der taegliche Cron war mit „Speichert aktuelle Preise, waermt Cache auf" beschrieben — er stoesst inzwischen die flaechendeckende Erfassung an, schreibt den Indexstand fort, waermt die Suche vor und erzeugt Artikel und Guides
- **Drei Ablaeufe fehlten ganz** und stehen jetzt drin: die flaechendeckende Preiserfassung (der wichtigste ueberhaupt), die Artikel-Tage (So + Do) und die Guide-Tage (Di + Fr)
- **Der Gesamtwert oben zaehlt nur noch drei Bereiche** — Keys, Affiliate-Links, Rechtstexte

### Neu
- **`monitoring.test.ts`** haelt beides fest: kein dritter Aufzaehlblock, „aktiv" nicht an einer ungenutzten Adresse, jeder Cron aus `vercel.json` kommt vor, und der Betriebszustand zeigt die Erfassung als Arbeit statt als Zeitstempel

---

## [5.2.0] - 2. August 2026 · Das Portfolio zeigt immer einen Stand

### Behoben
- **Von sechs Positionen standen drei auf „Kein Marktpreis geladen".** Ursache: Der Abruf holte jede Karte einzeln bei der Kartendatenbank, und bei einem Fehlschlag fiel die Position komplett aus der Antwort. Die Quelle antwortet dokumentiert auf etwa jede dritte Anfrage mit einem Fehler (Stolperstelle 28) — bei sechs Karten traf es damit regelmaessig die Haelfte
- **Rueckfall auf den eigenen Kartenindex.** Er enthaelt dieselben 19.690 Karten samt Preis, liegt in unserer Datenbank und kann nicht aussetzen. In EINER Abfrage vorab geholt, nicht je gescheiterter Karte — sonst waere der Rueckfall langsamer als das, was er ersetzt

### Geaendert
- **Die Herkunft des Preises steht in der Zeile.** Kommt er aus dem Index, steht sein Datenstand daneben. Ein Preis vom Vortag ist brauchbar — er darf nur nicht aussehen wie einer von jetzt
- **„Abruf gescheitert" und „Karte hat keinen Preis" sind jetzt zwei verschiedene Saetze.** Vorher stand fuer beide „Kein Marktpreis geladen". Das eine behebt sich von selbst, das andere nie; wer das nicht unterscheiden kann, wartet auf etwas, das nicht kommt
- **Ein Index-Preis wird NICHT als heutiger Messpunkt zurueckgeschrieben** — er ist eine Kopie von gestern, und ihn als heutige Messung zu speichern waere eine erfundene Messung

---

## [5.1.1] - 2. August 2026 · Ein Aussetzer der Quelle beendet nicht mehr die Runde

### Behoben
- **Ein einzelner HTTP 500 der Kartendatenbank beendete die ganze Runde.** Live gemessen nach dem Deploy von 5.1.0: Der Durchlauf lief bis Seite 59 von 82 und blieb dort haengen, `letzterFehler: Request failed with status code 500`, im Minutentakt wiederholt. Die Quelle beantwortet dokumentiert etwa jede dritte Anfrage mit 500 (Stolperstelle 28) — mit `break` endete damit fast jede Runde nach wenigen Seiten
- **Dieselbe Seite wird jetzt bis zu dreimal in derselben Runde versucht**, mit wachsender Pause (2, 4, 6 Sekunden). Ein Aussetzer dauert Sekunden, nicht Minuten. Erst danach endet die Runde — der Zeiger bleibt auf der Seite stehen, die naechste Runde nimmt sie erneut

---

## [5.1.0] - 2. August 2026 · Die Karten werden wieder vollstaendig erfasst

### Behoben
- **Die flaechendeckende Preiserfassung kam taeglich nur bis 27 Prozent.** Gemessen am laufenden Betrieb: Seite 22 von 82, 5.242 von 20.479 Karten, seit neun Stunden ohne Bewegung, kein Fehler im Log. Von Hand angestossen lief sie anstandslos weiter (22 → 46 in drei Minuten) — der Mechanismus stimmte, es fehlte die Robustheit gegen EINE verlorene Uebergabe. Da der Durchlauf am naechsten Tag wieder bei Seite 1 beginnt, bekamen immer dieselben ersten ~5.000 Karten einen neuen Preis und rund 15.000 nie
- **Laengere Runden statt mehr Uebergaben:** 240 statt 45 Sekunden je Runde. Ein Tag braucht damit vier Uebergaben statt sechzehn — jede Uebergabe ist ein moeglicher Abrisspunkt, die kuerzeste Kette ist die zuverlaessigste
- **Die Uebergabe wird nachgeprueft:** acht Sekunden warten, Stand erneut lesen, und wenn der Seitenzeiger stillsteht, ein zweites Mal anstossen. Das Absenden allein beweist nicht, dass die naechste Runde laeuft — der Anstoss wird nach drei Sekunden abgebrochen, und ein abgebrochener Aufruf kann die gerade gestartete Funktion mitnehmen

### Geaendert
- **Das Monitoring zeigt die Erfassung als eigenen Punkt ganz oben** — mit Fortschrittsbalken, Seite von Seiten, Karten von Karten und der Zeit seit der letzten Bewegung. Bisher stand dort nur, dass die Zustandstabelle frisch sei; sie war das auch, waehrend der Durchlauf feststeckte. „Die Tabelle wurde heute angefasst" und „die Arbeit ist fertig" sind zwei verschiedene Aussagen
- **Drei verschiedene Stoerungen, drei verschiedene Saetze:** heute nicht gestartet · seit N Minuten stehengeblieben · laeuft gerade. Sie in einen Satz zu fassen waere bequem und wuerde die Ursache verschleiern
- **Der Abschnitt „Features" ist entfernt.** Er zaehlte auf, welche Funktionen konfiguriert sind — und sagte damit zum DRITTEN Mal dasselbe: „API-Keys" nennt die Konfiguration, „Betriebszustand" nennt die Ergebnisse. Jeder einzelne Eintrag war anderswo bereits beantwortet. Drei Darstellungen derselben Sache sind schlimmer als eine, weil sie auseinanderlaufen koennen

---

## [5.0.0] - 2. August 2026 · Der Hero ist die Identitaet, nicht ein Abschnitt

### Neu
- **Hero fuellt den ersten Bildschirm** (92 vh). Die Leere ist Teil der Gestaltung: Wer ankommt, soll ein paar Sekunden bleiben, bevor Zahlen kommen
- **Hierarchie wie vorgegeben** — Auszeichnung, sehr grosse Ueberschrift (bis 72 px), Erzaehlung auf 620 px Textbreite, uebergrosse Knoepfe (58 px, Pille), kleine Marktfakten
- **Hintergrund in sieben Ebenen**: tiefes Mitternachtsblau, grosse blaue Atmosphaere, grosse violette Atmosphaere, warmes goldenes Licht, feines holografisches Korn, zurueckhaltende diagonale Struktur, Drachen-Artwork. Licht statt Farbe — vier unsichtbare Quellen, kein Neon
- **Abdeckung als Kreisfortschritt** statt Balken: Ein Balken misst eine Menge, ein Ring einen Anteil an einem Ganzen
- **Stichprobe als Zeitstrahl**: Der Bestand ist nichts, was man vergleicht, sondern etwas, das ueber die Zeit entsteht

### Geaendert
- **Der Drache ist jetzt reine Kontur bei rund 3 Prozent**, ohne Fuellung und ohne Schatten, gross und teils ausserhalb des Bildausschnitts. Die Vorgaengerfassung war gefuellt und deutlich staerker — dadurch war sie Motiv statt Atmosphaere. Er soll beim ZWEITEN Hinsehen entdeckt werden
- **CBI-Panel** mit 30 px Radius, weicherem Glas, groesserer Typografie und weiteren Abstaenden; das Achsenraster deutlich zurueckgenommen
- **Mehr Weissraum ueberall** — Hero, Karten, Kennzahlen, Abschnitte, Listen. Drei Flaechenebenen, keine gestapelten dunklen Rechtecke

### Behoben
- **Die Fusszeile stand doppelt**: Das Grundgeruest rendert sie bereits fuer jede Seite, die Startseite setzte eine zweite darunter

---

## [4.17.0] - 2. August 2026 · Startseite nach geliefertem Entwurf

### Neu
- **Seitenleiste links** ab 1024 px (`AppSidebar`): Wortmarke, sieben Navigationspunkte, Datenstand-Karte und Bestandskarte. Darunter bleibt es bei der Kopfleiste — eine 236-px-Leiste neben 390 px Inhalt waere keine Navigation, sondern ein Rand
- **Kopfzeile mit Suchfeld** und runden Schaltflaechen zu Merkliste und Portfolio
- **Atmosphaere in sechs Ebenen** (`HeroAtmosphere`): Mitternachtsbasis, vier weit auseinander gesetzte Lichthoefe, diagonale Folienschlieren, die Gravur, Bloom und ruhig gesetzte Partikel — reines SVG und CSS
- **Graviertes Fabelwesen** (`mythic-art.ts`) als eigene Illustration: Schaedel, geoeffneter Rachen mit Zaehnen, Auge, vierteiliger Kamm, Hals, Energiefilamente und konzentrische Ringe. Konstruiert aus gesetzten Punkten, nicht nachgezeichnet
- **CBI-Panel als Glasflaeche** mit Verlaufskurve, Zustandsmarke und Achsenbeschriftung. Liegen weniger als zwei gespeicherte Tagesstaende vor, steht dort der Grund statt einer Linie
- **Vier Kennzahl-Karten** mit je eigener Mikro-Darstellung: Punktreihe, Temperaturskala mit Marke, Fortschritt, Materialstreifen
- **Drei-Panel-Reihe**: staerkste Bewegungen, Set-Markt mit Logos und tragender Karte, Marktbericht-Hinweis mit dem Bild der staerksten Karte
- **Schnellzugriff** mit fuenf Kacheln

### Geaendert
- **Ueberschrift „Heute im Pokémon Markt"** mit dem Verlauf des Entwurfs — Bernstein ueber Weiss in die Markenfarbe
- **Materialien statt Flaechen**: Lichtkante oben an jedem Panel, halbdurchlaessige Fuellung, weicher Hof ueber den Rand hinaus. Keine grossen Schatten — die stapeln Flaechen sichtbar

### Bewusst abweichend vom Entwurf
- **Keine Glocke mit Zaehler** („3" ungelesene Meldungen): Es gibt kein Benachrichtigungssystem, die Zahl waere erfunden
- **Kein Benutzerbild „JD"**: Es gibt keine angemeldete Person
- An ihrer Stelle stehen zwei Wege, die es wirklich gibt — Merkliste und Portfolio

### Behoben
- **Acht Pixel waagerechter Ueberlauf** auf dem Telefon: Der Lichthof des CBI-Panels reicht bewusst ueber dessen Rand hinaus und schob am Seitenrand die Seite. Jetzt `overflow-x-clip` auf dem Inhaltsbereich

---

## [4.16.0] - 2. August 2026 · Die Startseite erzaehlt, bevor sie misst

### Neu
- **Markt-Story als Einstieg** (`market-story.ts` + `MarketStoryBlock`): Schlagzeile, ein zusammenhaengender Absatz und drei Belege — vor jeder Kennzahl. Beispiel aus dem laufenden Betrieb: „Ruhig an der Oberflaeche, schwach darunter — Der Gesamtmarkt hat sich ueber 30 Tage kaum bewegt (−0,2 %, preisgewichtet). Getragen wird das von einer Minderheit: Nur 32 % der 204 gemessenen Karten notieren ueber ihrem Vergleichswert, 138 darunter."
- **Regelbasiert, nicht per Sprachmodell.** Jeder Halbsatz haengt an einer Zahl, die daneben steht. Prognosen, Ursachenbehauptungen und Empfehlungen sind ausgeschlossen und per Test abgesichert
- **Verteilung in fuenf benannten Baendern** statt acht namenloser Balken: Starker Rueckgang, Moderater Rueckgang, Unveraendert, Moderater Anstieg, Starker Anstieg — je mit Anzahl, Anteil, den geltenden Grenzen und einem Satz darunter, der die Form deutet
- **Sammler-Materialien in CSS**: Prismenverlauf, Folienraster, Energie-Trenner, Kartenrahmen mit Lichtkante, Seltenheits-Schein. Eigene Bildsprache, keine fremden Motive; jede Bewegung liegt im `prefers-reduced-motion`-Block
- **Sternfeld im Markt-Hintergrund** und **Folienraster in der Sammlung** — die Hintergrund-Modi unterscheiden sich jetzt im Material, nicht nur in der Deckkraft
- **Set-Logos in den Set-Markt-Zeilen** — ein Set-Name ist eine Zeichenkette, das Logo ist das, was jemand im Laden in der Hand hatte

### Geaendert
- **Der Index erklaert sich selbst.** Statt „Gemessene Bewegung ueber 30 Tage" steht dort, was gerechnet wird: „Durchschnittliche Preisbewegung ueber 30 Tage, nach Kartenwert gewichtet: Teure Karten zaehlen staerker" — mit Verweis auf die Methodik
- **Die Kennzahlen sind als Stuetze ausgewiesen** („Die Zahlen dahinter") statt als Einstieg
- **Abschnittsgrenzen als Energie-Trenner** statt grauer Linien

### Behoben
- **Die Deutung unter der Verteilung widersprach der Schlagzeile.** Bei 115 Karten im Minus gegen 52 im Plus stand dort „Gewinner und Verlierer halten sich ungefaehr die Waage". Ursache war eine feste 60-%-Marke, gemessen an der Gesamtzahl inklusive der unbewegten Karten — bei vielen unbewegten Karten kann keine Seite 60 % erreichen, obwohl eine doppelt so schwer wiegt. Verglichen werden jetzt die beiden Seiten miteinander

---

## [4.15.0] - 2. August 2026 · Sammler-Motive: die Grenze zu fremdem Material neu gezogen

### Neu
- **Aufgefaecherte Kartenumrisse im Grund** — fuenf Umrisse im echten Format 63:88, ungleichmaessig gedreht wie hingelegte Karten. Das direkteste Sammler-Zeichen, das ohne fremdes Material auskommt: Ein Format ist kein Werk
- **Eigene Elementzeichen je Energietyp** (`card-motifs.ts`): Flamme, Tropfen, Blatt, Blitz, Spirale, Mond, Zahnrad, Kristall, Stern, Ring. Selbst gezeichnet, NICHT die Symbole des Spiels — eine Flamme ist eine Flamme. Ohne bekannten Typ erscheint keins
- **Das Artwork einer Karte faerbt ihre eigene Seite.** Bisher kam die Raumfarbe aus dem Energietyp; damit sah jede Feuer-Karte gleich aus, obwohl ein Vulkan-Artwork und eine helle Illustration nichts gemeinsam haben. Jetzt liefert das Bild selbst die Farbe — stark unscharf, sehr gering deckend, nicht mehr als Bild erkennbar

### Geaendert
- **Die Regel „kein Pokemon-Material im Hintergrund" ist ersetzt.** Sie war leicht zu pruefen und liess das Produkt kuehler wirken, als es muss. An ihre Stelle tritt eine Unterscheidung: eigene Formen immer erlaubt; das Bild EINER Karte auf DEREN Seite erlaubt, weil es dort ohnehin in voller Groesse steht und Gegenstand der Auskunft ist; fremdes Artwork als Tapete beliebiger Seiten weiterhin verboten
- **Unveraendert ausgeschlossen bleiben** nachgezeichnete Charaktere, der Pokeball, die offizielle Kartenrueckseite und die offiziellen Energie-Symbole als Markenzeichen von CardBeacon. Sechs neue Tests halten genau diese Zeilen fest

### Behoben
- **Die neue Farbflaeche kostete 160 KB** und war damit das groesste Element der Kartenseite — fuer eine Flaeche, auf der bei 90 Pixel Unschaerfe nichts mehr zu erkennen ist. Ueber den Bildoptimierer winzig angefordert: 2,6 KB, optisch identisch. Die Bildlast der Kartenseite liegt damit bei 75 KB statt 234 KB

---

## [4.14.0] - 2. August 2026 · Sammler-Sichtebene: die Oberflaeche erkennt an, was hier gehandelt wird

### Neu
- **Umgebungs-Hintergrund in drei Ebenen** (`AmbientBackdrop`): radiale Lichthoefe, Hoehenlinien und eine eigene Linienkunst. Alles unter 5 Prozent Deckkraft, reines SVG und CSS — kein Bild, kein Video, keine dauerhafte Animation
- **Die Linienkunst ist eigenstaendig gezeichnet**, nicht nachgezeichnet: Boegen, Kanten, Energiebahnen. Sie darf an ein Fluegelwesen erinnern, stellt aber keines dar — ein erkennbarer Charakter im Hintergrund macht aus einem Marktprodukt eine Fanseite
- **Fuenf Modi statt eines Hintergrunds**: Markt, Karte, Set, Sammlung, Research. Research bekommt keine Linienkunst — hinter 1.500 Woertern ist jede Struktur eine Stoerung
- **Set-Seiten bekommen einen gezaehlten Farbton**: der haeufigste Energietyp der handelbaren Karten, mit Anteil und Anzahl daneben. Reicht die Datenlage nicht, bleibt es beim Markenton und die Seite behauptet nichts
- **Die Kartenseite faerbt den Raum** in der Farbe des Energietyps — eine Feuer-Karte fuehlt sich anders an als eine Wasser-Karte, ohne dass ein Bedienelement die Farbe wechselt

### Geaendert
- **Vier Kennzahlen im Marktkopf, vier eigene Signaturen** statt drei gleich aussehender Bloecke: Marktbreite als geteilter Balken, Temperatur als Position auf einer Skala, Stichprobe als abzaehlbare Punkte, Sets als gestapelte Ebenen. Jede zeigt ihren eigenen Wert, keine ist Schmuck
- **Grundton mit einem Stich ins Blaue** (`#070810`) statt beinahe reinem Schwarz — neutralschwarz nimmt jedem Kartenbild das Licht
- **„Marktuebersicht · Pokemon TCG"** statt „Erster Markt: Pokemon". Letzteres las sich wie eine Ankuendigung an Investoren; fuer jemanden, der sammelt, ist Pokemon nicht der erste Markt, sondern der Markt
- **Sets ohne Logo zeigen ihren Namen als Wortmarke** statt eines Platzhalter-Kaestchens. Die vier juengsten Sets fuehrten die Galerie mit leeren Kaesten an, obwohl die Seite nur ehrlich war

### Behoben
- **Waagerechtes Scrollen auf Telefon und Tablet.** Die Set-Logos kommen mit 400 Pixeln aus der Quelle und sprengten ihr Rasterfeld (88 Pixel Ueberlauf bei 320 px); die Mover-Listen brachen bei genau 768 Pixeln zweispaltig um und schoben die letzte Zahlenspalte 39 Pixel ueber den Rand. Geprueft bei 320, 375, 390, 430, 768, 1024 und 1440 Pixeln

---

## [4.13.0] - 31. Juli 2026 · Eigener Kartenindex — die Suche geht nicht mehr nach aussen

### Neu
- **Eigener Kartenindex in der Datenbank.** Jede Suche fragte bisher die Kartendatenbank von aussen: gemessen 6 bis 13 Sekunden beim ersten Aufruf eines Begriffs, mit zeitweise jedem zweiten Versuch als Fehler. Zwischenspeicher haben das gemildert — sie helfen aber erst ab dem ZWEITEN Aufruf, der erste Besucher zahlte weiterhin voll
- **Die Daten lagen laengst vor.** Der taegliche Preis-Durchlauf holt ohnehin JEDE Seite der Kartendatenbank (rund 20.500 Karten) und warf davon alles ausser dem Preis weg. Der Index behaelt den Rest: Name, deutscher Name, Set, Nummer, Seltenheit, Bild, Preis, Trend. Kein einziger zusaetzlicher Abruf
- **Die Suche fragt zuerst den Index**, der Abruf von aussen bleibt als Rueckfall — der Index kennt nicht jeden Begriff, vor allem nicht, solange der Durchlauf noch nicht durch ist
- **Studio-Route zum sofortigen Fuellen**, damit die Suche nicht bis zum naechsten Morgen langsam bleibt
- Der Datenstand des Index steht im Monitoring: Er ist eine Kopie, kein zweiter Wahrheitsanspruch

---

## [4.12.1] - 31. Juli 2026 · Das Studio ueberlebt eine abgelaufene Sitzung

### Behoben
- **Bei abgelaufener Studio-Sitzung erschien die weisse Browser-Seite „This page couldn't load"** statt der Anmeldung. `loadStatus()` uebernahm die Antwort ohne Statuspruefung; bei einer 401 landete `{ error: 'unauthorized' }` im Zustand, und `Object.entries(status.integrations)` warf. Wer nach einer Woche das Studio oeffnete, sah nicht „bitte anmelden", sondern gar nichts. Jetzt faellt die Seite bei 401 auf die Anmeldung zurueck; ein zweiter Riegel beim Rendern verhindert den Absturz auch bei unerwarteten Antworten
- **Die vier Vorschauen im Marktbild-Feld luden gleichzeitig** — vier PNGs mit je 1,4 Megapixeln, jedes aus einem eigenen Bildaufbau am Server. Sie laden jetzt einzeln auf Anforderung; das Herunterladen geht weiterhin ohne Vorschau

---

## [4.12.0] - 31. Juli 2026 · Marktbilder im Studio

### Neu
- **Die vier Marktbilder stehen jetzt im Studio** (Reels-Tab): Vorschau aller Vorlagen, Formatwahl zwischen Beitrag, Reel/Story und Teilen-Vorschau, Herunterladen mit sprechendem Dateinamen. Zuvor gab es sie nur unter einer Adresse, die man auswendig kennen musste — ein Werkzeug, das nur mit Vorwissen bedienbar ist, wird nicht benutzt
- **Kein Veroeffentlichen-Knopf, und das mit Absicht.** Der Schritt nach Instagram bleibt von Hand: Ein Bild, das automatisch hinausgeht, sieht sich niemand mehr an — und bei Inhalten, die Marktzahlen behaupten, ist der Blick davor der eigentliche Schutz

### Behoben
- **Die Formatmasse liegen jetzt in einer Datei ohne Abhaengigkeiten.** Importiert ein Client-Bauteil sie aus der Renderdatei, zieht es `next/og` und `fs/promises` ins Browser-Paket — der Bau bricht dann mit „module not found" ab, und zwar erst beim Buendeln, nicht bei der Typpruefung

---

## [4.11.1] - 31. Juli 2026 · Abgeschnittene Kennzahl im Marktbild

### Behoben
- **„204 Karten" lief im Marktbild aus dem Bild.** Die drei Kennzahlen standen mit festem Abstand nebeneinander; die dritte passte nicht mehr. Ein abgeschnittenes Wort in einem Beitrag, der geteilt wird, ist schlimmer als eine kleinere Schrift — die Spalten teilen sich die Breite jetzt gleichmaessig, und die Einheit steht in der Beschriftung statt im Wert
- **Die leere Bildmitte** ist weg: Der Kennzahlenblock sitzt am unteren Rand statt direkt unter der grossen Zahl

---

## [4.11.0] - 31. Juli 2026 · Markt-Geschichten als Bild

### Neu
- **Vier wiederverwendbare Marktbilder** in drei Formaten (Reel 1080×1920, Beitrag 1080×1350, Teilen-Vorschau 1200×630): staerkste Bewegung, Set gegen Set, Marktstand, Karte gegen Markt. Die Vorlagen kennen ihre Groesse nicht — das Format kommt von aussen, damit dieselbe Geschichte nicht dreimal existiert
- **Die Bilder nehmen KEINEN Text aus der Adresse entgegen.** Alle Zahlen und Namen stammen aus derselben Marktstichprobe wie die Startseite. Eine oeffentliche Adresse, die beliebigen Text im CardBeacon-Layout setzt, waere eine Flaeche, auf der jeder eine Behauptung erzeugen kann, die aussieht wie eine Messung von uns
- Reicht die Datenlage nicht, entsteht **kein Bild** statt eines Bildes mit erfundener Kennzahl

### Geaendert
- **Der Folienschimmer laeuft jetzt auf jedem Kartenbild.** Zuvor nur bei Folien-Seltenheiten — als Auskunft gedacht, in der Praxis aber nur als Ungleichmaessigkeit wahrgenommen. Die uebrigen Bedingungen bleiben: einmalig auf Zeigerkontakt, weiss statt bunt, vollstaendig abschaltbar ueber Reduced-Motion

### Behoben
- **Das erste gerenderte Marktbild zeigte einen anderen Indexstand als die Website** (+28,6 % gegen −0,2 %): Es rechnete sich seinen eigenen Index aus. Ein geteiltes Bild lebt laenger als der Moment, in dem es entstand — es liest jetzt denselben gespeicherten Tagesstand wie Kartenseiten und Suche

---

## [4.10.0] - 31. Juli 2026 · Ein Kopf-Muster je Seitenart

### Geaendert
- **Zehn Datenflaechen folgen jetzt demselben Kopf-Muster** — Marktbericht, Archiv, Einstieg, Set-Detail zusaetzlich zu den vier aus v4.9.0. Linksbuendig, Abschnittsmarke statt Pille, keine Verlaufsflaeche, keine Farbhervorhebung im Titel
- **Marktbericht:** Die drei Merkmal-Zeilen unter der Ueberschrift („Marktanalyse · Cardmarket-Preise · Woechentlich neu") sind entfallen. Sie behaupteten Eigenschaften, statt den Bericht zu zeigen. Der Zeitraum steht jetzt als Datenangabe neben der Abschnittsmarke
- **Set-Detail:** Der gelbe Vollflaechen-Kaufknopf ist gedeckt wie der Rest der Seite. Er war der lauteste Gegenstand der Seite und gehoert einer Nebenhandlung

### Neu
- **DESIGN.md §15 loest einen Widerspruch auf**, der beim Vereinheitlichen sichtbar wurde: DESIGN.md verbot Verlaufsflaechen hinter Ueberschriften, CLAUDE.md verlangte fuer Lese-Flaechen einen Kopf MIT Ambient-Glow. Die Grenze verlaeuft nicht nach Geschmack, sondern nach der Frage, ob unter dem Kopf eine Tabelle oder ein Text steht. Artikel- und Guide-Detailseiten behalten ihren Ambient-Kopf ausdruecklich — damit es niemand als Versaeumnis „repariert"

---

## [4.9.1] - 31. Juli 2026 · Wiederholungen haben ein Ende

### Behoben
- **Bei einem Ausfall der Kartendatenbank wartete die Suche bis zu 40 Sekunden.** Drei Wiederholungen mit je zwoelf Sekunden Zeitlimit plus Wartezeiten summieren sich; gemessen waren es 15 bis 18 Sekunden, waehrend die Quelle streikte. Jetzt gilt eine Gesamtfrist von neun Sekunden ueber ALLE Versuche — danach ist ein ehrliches „gerade nicht verfuegbar" die bessere Antwort als weiteres Warten. Die flaechendeckende Erfassung im Hintergrund ist ausgenommen: Dort ist Warten billiger als ein Loch in den Messpunkten

---

## [4.9.0] - 31. Juli 2026 · Suchfrist, Methodik, einheitliche Koepfe

### Geaendert
- **Die Frist des Such-Zwischenspeichers steigt von zehn Minuten auf eine Stunde.** Der erste Aufruf eines Begriffs kostet gemessen 6 bis 13 Sekunden, jeder weitere 0,3. Bei zehn Minuten zahlt ein gefragter Begriff diesen Preis bis zu 144-mal am Tag, bei einer Stunde 24-mal. **Nicht laenger:** Die Suchtreffer enthalten Preise, und die Kartenseite wird stuendlich neu erzeugt — waere die Suche laenger gueltig, koennten beide Seiten unterschiedliche Preise derselben Karte zeigen
- **Der Tages-Cron waermt die 20 gefragtesten Begriffe vor.** Sie kommen aus den Kartennamen der aktuellen Marktstichprobe, nicht aus einer Liste im Code: Was auf der Startseite steht, wird als Naechstes gesucht. Wirkt eine Stunde — das nimmt der ersten Stunde nach dem Datenabgleich die Spitze, mehr nicht

### Neu
- **Methodik: die Stufen der Markttemperatur sind dokumentiert** (Kalt 0–24 bis Heiss 75–100) samt der ausdruecklichen Feststellung, dass kalt nicht schlecht und heiss nicht gut heisst. Das Vokabular war in v4.4.0 eingefuehrt worden, ohne die Zuordnung offenzulegen — auf einer Seite, deren Zweck Offenlegung ist
- **Methodik: eigener Abschnitt zum Abstand zum Markt** — warum Prozentpunkte und nicht Prozent, warum nur gleiche Zeitraeume verglichen werden, und was der Abstand ausdruecklich NICHT sagt

### Behoben
- **Vier Seiten folgen jetzt dem gemeinsamen Kopf-Muster** (Analysen, Guides, Merkliste, Methodik): linksbuendig, Abschnittsmarke statt Pille, keine Verlaufsflaeche, keine Farbhervorhebung im Titel

---

## [4.8.0] - 31. Juli 2026 · Bildlast und Layout-Versatz

### Behoben
- **Die Startseite lud 2.211 KB an Bildern fuer ZWOELF Miniaturen von 26 Pixel Breite** — rund 184 KB pro Briefmarke. Ursache war kein Einzelfall, sondern ein Muster: Miniaturen und Set-Logos waren rohe Bild-Tags mit der Adresse des Zwischenspeicher-Proxys. Der Proxy speichert nur zwischen; er verkleinert nichts und wandelt kein Format um. Der Bildoptimierer kam nie zum Zug
  - Startseite: **2.596 KB → 453 KB**
  - `/sets`: **2.278 KB → 512 KB**
- **Layout-Versatz auf `/sets` lag bei 0,41** — dem Vierfachen der Grenze, ab der eine Seite als springend gilt. Set-Logos haben sehr unterschiedliche Seitenverhaeltnisse; ohne feste Masse wuchs die Zeile, sobald jedes Logo eintraf. Jetzt **0**
- **Die Wortmarke war nur 25 Pixel hoch anklickbar** (17 im Fuss) — als Verweis auf die Startseite eines der meistgenutzten Ziele ueberhaupt und zugleich das kleinste. Jetzt 44 Pixel

### Geprueft
- Ein `h1` je Seite, keine Ueberschriften-Spruenge, `lang="de"`, kein Bild ohne `alt`, kein Bedienelement ohne Namen — auf Start-, Karten-, Set- und Suchseite je in Desktop- und Telefonbreite gemessen

---

## [4.7.0] - 31. Juli 2026 · Die Suche wird schnell, der Set-Markt vollstaendig

### Behoben
- **Dieselbe Suche brauchte 7,1 s, 4,3 s und 15,7 s in drei Laeufen hintereinander.** Zwischen zwei identischen Anfragen wurde nichts wiederverwendet: Der vorhandene Zwischenspeicher liegt im Arbeitsspeicher einer Instanz, und auf Vercel beantwortet praktisch jede Anfrage eine andere. „Ist zwischengespeichert" heisst nicht „wird wiedergefunden"
- Suchtreffer liegen jetzt im geteilten Datenspeicher — instanzuebergreifend, zehn Minuten. **Leere Ergebnisse werden bewusst NICHT gespeichert:** Ein einzelner Aussetzer der Quelle waere sonst zehn Minuten lang als „keine Treffer" festgeschrieben, fuer alle Besucher gleichzeitig
- Auch die Vorschlaege beim Tippen nutzen ihn — sie sind der meistgenutzte Weg zur Kartendatenbank ueberhaupt

### Neu
- **Der Set-Markt zeigt den Abstand zum Index** in Prozentpunkten, mit demselben Massstab wie Karten und Suche
- **Die staerkste Bewegung je Set** steht in der Zeile. Sie beantwortet, was eine Set-Zeile sonst offen laesst: Traegt die Bewegung das ganze Set oder eine einzelne Karte? Ausgewaehlt nach BETRAG, nicht nach groesstem Gewinn — ein Set kann ebenso von einem Einbruch getragen sein. Als Text, nicht beim Ueberfahren: Auf einem Telefon gibt es kein Ueberfahren

---

## [4.6.0] - 31. Juli 2026 · Suche mit Marktbezug, Sammlungsansicht

### Neu
- **Suchergebnisse sind Zeilen statt Kacheln.** Wer sucht, will vergleichen — im Raster steht jede Zahl an einer anderen Stelle. Jede Zeile zeigt Kartenbild, Name, Set, Nummer, Seltenheit, Preis, 30-Tage-Bewegung und den Abstand zum Index
- **Der Indexwert kommt aus EINER Datenbankzeile**, nicht aus 250 nachgeladenen Karten. Genau dafuer wurde der taegliche Indexstand angelegt
- **Sammlungsansicht im Portfolio.** „Auswertung" beantwortet „wie steht mein Bestand", „Sammlung" beantwortet „was besitze ich eigentlich" — ruhige Galerie im echten Kartenformat, sortierbar nach Wert, Bewegung, Set und Zugang. Ein Klick fuehrt auf die Kartenseite und damit in den Marktkontext
- **`/suche` folgt jetzt dem gemeinsamen Seitenmuster** — ohne Pillen-Etikett, ohne zentrierte Werbeueberschrift, ohne Verlauf hinter der Ueberschrift. Die Seite hatte den Umbau nie mitgemacht

### Behoben
- **Das Kartenraster wies ungemessene Karten als „0,0 %" aus** (`trendPercent || 0`) — optisch nicht von einer wirklich unbewegten Karte zu unterscheiden. Betraf Marktbericht und Set-Detailseiten
- **Unerklaerte Bewertungszahl auf jeder Kachel entfernt** — eine farbcodierte Zahl von 0 bis 100 ohne ein Wort dazu liest sich als Kauf-Ampel. Der Wert steht weiterhin auf der Kartenseite, dort mit offengelegten Faktoren
- **Kartenbilder im echten Format 63:88** statt 3:4, und „N/A" durch einen Strich ersetzt

---

## [4.5.0] - 31. Juli 2026 · Bewegungen mit Marktbezug, Set-Bibliothek

### Neu
- **Die Bewegungen zeigen den Abstand zum Markt** in derselben Zeile. „+22,2 %" ist eine Zahl; „+22,4 Prozentpunkte ueber dem Markt" ist eine Aussage — und genau der Punkt, an dem sich CardBeacon von einer Preisliste unterscheidet. Die Spalte steht nur, wenn Karte UND Index gemessen sind
- **Rangnummern in den Bewegungen** — ohne Nummer ist eine Liste eine Aufzaehlung, mit Nummer eine Rangfolge
- **`/sets` ist eine Set-Bibliothek geworden:** Epochen-Filter aus dem echten `series`-Feld der Kartendatenbank, Sortierung nach Erscheinen, Bewegung, typischem Preis und Umfang, groessere Set-Logos als Blickfang. Sets ohne gemessene Bewegung wandern beim Sortieren ans Ende, statt mit einer gedachten Null in der Rangfolge zu stehen
- **`formatPp()`** in `format.ts` — Prozentpunkte sind eine eigene Einheit

### Behoben
- **„+55,9 % pp" in der Bewegungsspalte.** Der Wert wurde aus `formatPercent(x).replace(' %', '')` gebaut; `Intl` setzt vor das Prozentzeichen aber ein geschuetztes Leerzeichen (U+00A0), die Ersetzung lief ins Leere
- **„keine Stichprobe" neben einem gemessenen Medianpreis.** Ein Set kann eine Stichprobe haben und trotzdem keine gemessene BEWEGUNG — das sind drei Zustaende, nicht zwei

---

## [4.4.1] - 31. Juli 2026 · Drei Befunde aus der Sichtpruefung

### Behoben
- **Doppelte Klammer im wichtigsten Absatz der Startseite** — „(32 % im Plus (66 von 204))". Der Beleg brachte seine Klammern schon mit und bekam noch einmal welche
- **Auf dem Telefon quetschte sich die Verteilung neben den Indexwert.** Die Ueberschrift brach mitten im Wort um, die Achsenbeschriftung lag auf den Balken. Sie steht jetzt unter der Zahl statt daneben
- **Der Merklisten-Knopf war der lauteste Gegenstand der Kartenseite** — eine vollflaechig violette Schaltflaeche ueber die ganze Spaltenbreite, auffaelliger als das Kartenbild darueber. Die Karte ist der Blickfang; das Merken ist eine Nebenhandlung und sieht jetzt auch so aus

---

## [4.4.0] - 31. Juli 2026 · Die Sammler-Ebene

### Neu
- **Ambient-Ton aus dem Energietyp der Karte.** Hinter dem Kartenbild liegt ein sehr schwacher Schimmer in der Farbe ihres Typs — Feuer warm, Wasser kuehl, Psycho violett. Abgeleitet aus einer veroeffentlichten Eigenschaft der Karte, NICHT aus einer Farbanalyse des Bildes: Die waere teuer, unzuverlaessig und nicht pruefbar
- **Folienschimmer auf Karten, die auch wirklich glaenzen.** Ein Lichtstreifen laeuft einmal ueber das Bild, wenn der Zeiger darauf liegt — nur bei Folien-Seltenheiten, nie von allein, komplett abschaltbar ueber die Reduced-Motion-Einstellung
- **Hintergrund-Identitaet im Marktkopf:** abstrakte Hoehenlinien und zwei weiche Lichthoefe bei rund 3 % Deckkraft. Kein nachgezeichnetes Pokémon-Artwork, keine Kreatur-Umrisse
- **DESIGN.md um zwei Kapitel erweitert** (Sammler-Ebene, Markttemperatur) mit dem Mischungsverhaeltnis je Flaeche

### Geaendert
- **„Angst & Gier" heisst jetzt Markttemperatur** — Kalt, Abkuehlend, Ruhig, Anziehend, Heiss. Gemessen werden drei Preisgroessen, keine Gefuehle; „Extreme Gier" klang ausserdem wie eine Handlungsaufforderung. **Die Rechnung ist unveraendert**
- **Die Temperaturfarbe ist keine Ampel mehr** (Blau → Grau → Orange statt Rot → Gelb → Gruen). Ein ruhiger Markt ist nicht schlechter als ein heisser. Gruen und Rot bleiben ausschliesslich der Richtung von Preisen vorbehalten
- **Das Kartenbild auf der Detailseite steht im echten Kartenformat** (63:88 statt 3:4) und ohne grauen Kasten — es sah aus wie eine Datei-Vorschau statt wie ein Objekt

### Behoben
- **Der Marktbericht behauptete Ursachen, die die Daten nicht hergeben** („Der Grund liegt in der fruehen Set-Phase", „das Angebot deckt die Nachfrage", „bestaetigt, wo die Aufmerksamkeit liegt"). Gemessen werden Preise — Angebot, Nachfrage und Aufmerksamkeit nicht. Beobachtung und Deutung sind jetzt getrennt: Dieselbe Ueberlegung ist erlaubt, wenn sie als Deutung gekennzeichnet ist

---

## [4.3.1] - 31. Juli 2026 · Die letzten zwei Doppeltitel

### Behoben
- **Portfolio und Merkliste trugen die Marke weiterhin doppelt im Titel.** Beide sind Client-Komponenten, ihre Metadaten liegen im Layout daneben — die Pruefung sah nur `page.tsx` an und uebersah sie deshalb. Die Pruefung deckt jetzt beide Ablagen ab
- **Der Startseiten-Titel las sich fehlerhaft** („Marktanalyse fuer Sammelkarten fuer Pokémon-Karten") — zweimal „fuer" in dem Titel, der in jedem Suchergebnis steht

---

## [4.3.0] - 31. Juli 2026 · Eine Marke, ein Titelmuster, keine falschen Aussagen

### Behoben
- **Die Marke stand auf sechs Seiten doppelt im Titel** („… — CardBeacon | CardBeacon"). Das Root-Layout haengt sie an jeden Seitentitel an, und die Seiten schrieben sie zusaetzlich selbst
- **Die kanonische Adresse der Startseite zeigte auf `/index`** — eine Adresse, die es nicht gibt. Die geerbte relative Angabe loest auf der Wurzelroute so auf
- **`/sets/sv3pt5` meldete „Set nicht gefunden" fuer ein reales Set.** Bei einem Ausfall der Kartendatenbank gab die Listenabfrage eine leere Liste zurueck, und die Set-Seite leitete daraus „existiert nicht" ab — mit ISR blieb das stehen. Ein Ausfall der Quelle ist jetzt ein Ausfall, keine Aussage ueber den Bestand
- **`siteName` fehlte in den Teilen-Vorschauen** von Startseite, Kartenseiten und Guides: Setzt eine Seite eigene OpenGraph-Angaben, ersetzt Next das geerbte Objekt vollstaendig
- **Letzte sichtbare Altmarke entfernt** — die Changelog-Seite trug sie noch in Titel, Beschreibung und Einleitung

### Geaendert
- Acht neue Tests halten das fest: ein Titelmuster, keine doppelte Marke, eigene kanonische Adresse der Startseite, keine sichtbare Altmarke, Ausfall ≠ Fehlbestand

---

## [4.2.5] - 31. Juli 2026 · Kartenseiten geben nach einem Aussetzer nicht auf

### Behoben
- **„Karte nicht erreichbar", obwohl die Karte existiert.** Gemessen scheiterten drei von acht Kartenaufrufen an einem Serverfehler der Quelle — bei unveraenderter Anfrage. Ein einziger Wiederholungsversuch liess daraus rechnerisch jeden achten Aufruf scheitern, ausgerechnet auf der Seite, auf der Suche und Startseite landen. Jetzt vier Versuche mit wachsender Wartezeit; ein echtes 404 bleibt unveraendert eine sofortige Auskunft

---

## [4.2.4] - 31. Juli 2026 · Der Marktvergleich erscheint auf jeder Kartenseite

### Behoben
- **Nach dem Anlegen der Tabelle zeigte eine Kartenseite den Marktvergleich und eine andere nicht.** Der Zwischenspeicher im Arbeitsspeicher wurde auch mit einem Fehlergebnis befuellt, galt dann eine Stunde — und weil er VOR der Datenbankstufe geprueft wird, sah eine Instanz, die einmal zu wenig Daten hatte, den gespeicherten Tagesstand danach gar nicht mehr an. Zwischengespeichert wird jetzt nur, was auch eine Auskunft ist

---

## [4.2.3] - 31. Juli 2026 · Das Monitoring hat eine fehlende Tabelle uebersehen

### Behoben
- **Eine gar nicht vorhandene Tabelle wurde als „vorhanden, 0 Zeilen" gemeldet.** Die Zaehlabfrage fragt nur den Kopf der Antwort ab — auf eine fehlende Tabelle kommt dann zwar ein Fehlerstatus, aber ein leerer Antwortkoerper, und ohne Koerper gibt es keine Fehlermeldung zu lesen. Aus „nicht gezaehlt" wurde „null Zeilen". Geprueft wird jetzt zuerst mit einer Abfrage, deren Fehler tatsaechlich ankommt; „nicht gezaehlt" bleibt als solches sichtbar statt als Null
- **Der Indexstand konnte deshalb nirgends auffallen.** Das Anlegen der Tabelle stand seit v4.2.0 aus, das Monitoring meldete sie aber als in Ordnung — genau der stille Ausfall, den dieses Monitoring verhindern soll

### Geaendert
- **Das Anlege-SQL des Indexstands nutzt `DATE` statt `TIMESTAMPTZ`.** Der Index ist eine Tagesgroesse; als Zeitstempel gelesen waere die Altersberechnung des Standes still falsch geworden — und ein ungueltiges Datum besteht jede Altersgrenze, weil Vergleiche damit immer falsch ergeben
- **Wanderungsdatei `supabase/migrations/0004_market_index.sql`** ergaenzt, damit die Tabelle dort steht wo die anderen auch stehen

---

## [4.2.2] - 31. Juli 2026 · Der Schreibvorgang ist nachweisbar

### Behoben
- **Auch der zweite Anlauf lief nie.** Die oeffentliche Index-Schnittstelle ist beim Bauen vorgerendert — ihr Rumpf laeuft zur Laufzeit gar nicht, egal wie oft man sie aufruft. Damit sahen zwei Schreibstellen richtig aus und schrieben beide nichts

### Neu
- **Eine ausdruecklich dynamische Route zum Setzen und Nachsehen des Indexstands** (Studio-geschuetzt). Ihr Ergebnis steht in der Antwort — der Schreibvorgang ist damit pruefbar statt geglaubt, und nach einem Deployment laesst sich der erste Stand sofort setzen

---

## [4.2.1] - 31. Juli 2026 · Der Indexstand wird auch tatsaechlich geschrieben

### Behoben
- **Der in v4.2.0 eingefuehrte Schreibvorgang lief nie.** Er haengt an der Startseite — und die wird aus dem Zwischenspeicher ausgeliefert, ihre Funktion laeuft dann gar nicht. Nach dem Deployment blieb die Tabelle leer. Geschrieben wird jetzt zusaetzlich von der Index-Schnittstelle (die den Wert ohnehin berechnet) und vom Tages-Cron als verlaesslicher Untergrenze

---

## [4.2.0] - 31. Juli 2026 · Der Indexstand wird gespeichert statt nachgerechnet

### Neu
- **Taeglicher Indexstand in der Datenbank.** Der Marktkontext auf Kartenseiten liest jetzt EINE Zeile statt 250 Karten aus dem Netz zu holen. Der Index aendert sich einmal am Tag — ihn bei jedem Kartenaufruf neu auszurechnen war keine Genauigkeit, sondern Verschwendung
- **Damit beginnt eine echte Indexhistorie.** Der Marktkopf zeigt heute die Verteilung der Messwerte statt einer Kurve, weil es keine gespeicherten Tagesstaende gab. Ab jetzt sammeln sie sich an — eine spaetere Kurve wuerde auf Messungen beruhen, nicht auf Rueckrechnung
- Die Startseite schreibt den Stand NACH der Antwort; der Besucher wartet auf nichts

### Geaendert
- Ein gespeicherter Stand aelter als drei Tage gilt nicht als aktuell — dann wird wieder selbst gerechnet

---

## [4.1.0] - 31. Juli 2026 · Die Seite ist sofort da und sofort bedienbar

### Behoben
- **Waehrend des Ladens gab es keinen Weg zurueck.** Oben stand ein leerer Streifen statt der Navigation — kein Logo, kein Menue, kein Zurueck. Bei einer langsamen Seite ist das genau der Moment, in dem man weg will, und dann war sie eine Sackgasse. Das Lade-Skelett traegt jetzt die echte Navigation
- **Der Marktkontext blockierte die ganze Kartenseite.** Er holt den Set-Vergleich und den Indexstand; letzterer kostet auf einer kalt gestarteten Instanz mehrere Sekunden. Weil beides vor dem Rendern abgewartet wurde, warteten Kartenbild, Preis, Verlauf und Kaufknoepfe auf eine Zahl, die ganz unten steht. Der Abschnitt laedt jetzt getrennt und stroemt nach
- **Der Vergleich hat eine Obergrenze** von sechs Sekunden. Vorher konnten sich Zeitlimits und Wiederholungen im ungünstigsten Fall auf fast eine Minute summieren

### Messung
Zeit bis zum ersten sichtbaren Inhalt der Kartenseite: **3,5 s → 0,02–0,15 s**.

---

## [4.0.2] - 31. Juli 2026 · Die Suche haelt jetzt auch aus, wenn die Quelle streikt

Nachgemessen: Die Kartendatenbank antwortet auf DIESELBE Suchanfrage in zwei von drei Faellen mit HTTP 500. Wiederholungen allein reichen dagegen nicht.

### Behoben
- **Drei statt zwei Wiederholungen, mit steigender Wartezeit.** Bei gleichbleibender Wartezeit landen alle Versuche in derselben Stoerung
- **Erfolgreiche Suchergebnisse bleiben zehn Minuten verfuegbar.** Faellt die Quelle vollstaendig aus, erscheinen die zuletzt geholten echten Treffer statt eines Fehlerzustands — dieselben Karten, wenige Minuten alt

---

## [4.0.1] - 31. Juli 2026 · Suche und Kartenbilder

### Behoben
- **Die Suche gab bei einem Aussetzer der Kartendatenbank sofort auf.** Sie war der einzige Abruf ohne Wiederholungsversuch — ausgerechnet die Funktion, die immer funktionieren muss. Statt Ergebnissen erschien „Suche momentan nicht verfuegbar", obwohl die Karte existiert. Jetzt zwei Wiederholungen und ein groesseres Zeitlimit; dasselbe fuer die Karten einer Set-Seite
- **Kartenbilder blieben teilweise unsichtbar.** Das Bild startete durchsichtig und wurde erst beim Ladeereignis eingeblendet — ist es schon fertig, bevor die Seite im Browser aktiv wird, kommt dieses Ereignis nie. Die Karte blieb dann dauerhaft leer. Das Bild ist jetzt von Anfang an sichtbar, der Platzhalter liegt dahinter

---

## [4.0.0] - 31. Juli 2026 · CardBeacon

Das Produkt heisst jetzt CardBeacon - Marktanalyse fuer Sammelkarten. Pokemon
ist der erste unterstuetzte Markt, nicht mehr die Identitaet des Produkts.

### Neu
- **Marktkontext auf jeder Kartenseite.** Karte, ihr Set und der Index
  nebeneinander, alle drei ueber denselben 30-Tage-Zeitraum, dazu der Abstand
  zum Markt in Prozentpunkten. Fehlt eine Seite, entfaellt die Zeile - es wird
  nichts geschaetzt
- **Marktkommentar** aus festen Regeln: Jeder Satz haengt an einer Zahl, die
  daneben steht. Keine Prognose, keine Ursachenbehauptung, keine Empfehlung
- **Research** buendelt Marktbericht, Analysen, Guides und Methodik an einer Stelle
- **Verteilung der 30-Tage-Bewegung** im Marktkopf statt einer Indexkurve: Fuer
  eine Kurve fehlen gespeicherte Tagesstaende, und eine rueckgerechnete waere
  erfunden
- Design-System (`DESIGN.md`) und zentrale Marken-, Adress- und Gestaltungsmodule

### Geaendert
- **Startseite von zehn auf sechs Abschnitte.** Der laufende Ticker, die
  Trending-Tabelle und die doppelten Gewinner-/Verlierer-Listen sind entfallen -
  dieselbe Karte erschien darin bis zu dreimal
- **Navigation von acht auf fuenf Ziele:** Markt, Karten, Sets, Portfolio, Research
- **Der Index heisst CBI (CardBeacon Index).** Rechnung und Methodik unveraendert
- **Weniger Flaechen:** Abschnitte werden durch Linie und Abstand getrennt statt
  durch abgerundete Kacheln
- Der Balken am oberen Seitenrand ist entfallen; Ladezustaende stehen jetzt an
  der Stelle, an der die Daten erscheinen

### Behoben
- **Sets ohne gemessene Karte zeigten „0,0 %"**, als haetten sie sich nicht
  bewegt. Nicht gemessen ist keine Nullbewegung - dort steht jetzt ein Strich
- **Kanonische Adressen zeigten auf eine nie verbundene Domain.** Es wird keine
  Produktionsadresse mehr geraten (`src/lib/site.ts`)

---

## [3.3.5] - 31. Juli 2026 · Die groessere Stichprobe bekommt auch mehr Zeit

### Behoben
- **Die Startseite zeigte zeitweise 7 statt 204 auswertbarer Karten.** Mit v3.3.0 wurde die Stichprobe von 50 auf 250 Karten vergroessert, das Zeitlimit der Abfrage blieb aber bei 8 Sekunden. Eine 250-Karten-Seite braucht gemessen 9 bis 17 Sekunden — die Abfrage lief damit meistens ins Limit, und die Seite fiel auf den gespeicherten Marktbericht zurueck. Index und Set-Rangliste meldeten daraufhin korrekt „noch nicht genuegend Daten“, obwohl die Daten vorhanden waren

---

## [3.3.4] - 31. Juli 2026 · Labels sagen, was die Zahl ist

### Behoben
- **Die Set-Tabelle war mit „Ø Preis“ beschriftet, gerechnet wurde aber der Median.** Zwei verschiedene Aussagen ueber dieselbe Zahl. Die Spalte heisst jetzt „Medianpreis“; an der Berechnung aendert sich nichts
- **Der Markt-Ticker trug das Label „Live“** neben Zahlen aus einer taeglich aktualisierten Quelle. Er heisst jetzt „Marktbewegungen“
- **Die Methodik begruendete die Preisgewichtung des Index damit, dass teure Karten den Markt staerker bewegen.** Das ist eine Aussage ueber Marktbedeutung und Handelshaeufigkeit, fuer die es in den Daten keinen Beleg gibt. Die Erklaerung beschreibt jetzt, was die Gewichtung tut, ohne etwas ueber den Markt zu behaupten

### Neu
- `DOMAIN.md` — die Schritte fuer den Domainwechsel, von DNS bis Search Console. Am Code ist dafuer nichts zu aendern

---

## [3.3.3] - 30. Juli 2026 · Keine Null aus einer gescheiterten Zaehlung

### Behoben
- In der neuen Datenabdeckung stand kurzzeitig „0 Sets“: Der Abruf der Set-Zahl schlug fehl, der Auffang-Wert lieferte 0, und die 0 erschien als Messwert. Faellt die Zaehlung aus, entfaellt die Angabe - genau die Regel, die diese Anzeige durchsetzen soll

---

## [3.3.2] - 30. Juli 2026 · Index-Schnittstelle an die Startseite angeglichen

### Behoben
- Die oeffentliche Index-Schnittstelle wertete weiterhin 50 Karten aus, waehrend die Startseite 204 auswies - zwei verschiedene Zahlen fuer denselben Index. Beide ziehen jetzt dieselbe Menge

---

## [3.3.1] - 30. Juli 2026 · Nachtrag zur Sprachpruefung

### Behoben
- Die in v3.3.0 eingefuehrte Sprachpruefung schlug am eigenen Changelog-Eintrag an, der die Entfernung des Begriffs beschreibt. Der Verlauf ist jetzt ausgenommen - wie schon bei den uebrigen geprueften Begriffen

---

## [3.3.0] - 30. Juli 2026 · Datenbestand und Kennzahl sauber getrennt

### Behoben
- **„151 - staerkstes Set · 1 Karte im Datensatz“.** Ein Set mit einer einzigen Karte konnte die Rangliste anfuehren; der Durchschnitt einer Karte ist ihr Preis. Ein Set erscheint jetzt erst ab fuenf auswertbaren Karten, und gewertet wird der typische Kartenpreis (Median) statt des Mittelwerts - der bleibt sonst von einer teuren Einzelkarte bestimmt. Erfuellt kein Set die Schwelle, steht dort „Noch nicht genuegend Daten fuer ein belastbares Set-Ranking“
- **„50 Karten · 4 Sets“ las sich wie der gesamte Datenbestand**, war aber die Stichprobe einer einzelnen Kennzahl - und diese Zahl kam nicht aus der Datenlage, sondern aus einer Begrenzung im Code. Die Stichprobe umfasst jetzt 250 Karten aus 17 Sets
- **Der Marktbericht sah nur ein einziges Set.** Er zog 20 Karten aus einer Set-Abfrage, waehrend die Startseite eine andere Quelle nutzte - zwei Seiten, zwei Datengrundlagen. Beide nutzen jetzt dieselbe
- **Drei Routen trennten Gewinner und Verlierer noch nach der alten, fehlerhaften Regel** (dieselbe Liste zweimal sortiert, oben und unten abgeschnitten). Auf der Startseite war das seit v3.0.0 behoben, im Marktbericht lief es weiter
- **„Pokemon Kartenmarkt in Echtzeit“** stand direkt neben „taeglich aktualisiert“. Die Preisquelle liefert keinen Echtzeit-Stand; der Begriff ist ueberall entfernt

### Neu
- **Datenabdeckung getrennt ausgewiesen** - Karten, Sets und gespeicherte Preispunkte des gesamten Bestands, sichtbar neben den Kennzahlen, die jeweils nur die vollstaendig gemessenen Karten nutzen
- Eine heute neu erfasste Karte zaehlt sofort zur Abdeckung und erst mit echter Historie zu den 30-Tage-Kennzahlen. Es wird keine Entwicklung angedichtet

### Geaendert
- **„Investment-Scores“ heissen „Markt-Scores“, „Investor Insights“ heissen „Markt-Insights“.** Die Plattform analysiert einen Markt und beraet nicht bei Geldanlagen. Adressen bleiben unveraendert

---

## [3.2.6] — 30. Juli 2026 · Erfassung läuft ohne Abriss durch

### Behoben
- **Die Erfassung brach reproduzierbar nach fünf bis sechs Übergaben ab** — bei Seite 20, 32 und 49 von 82, jedes Mal ohne Fehlermeldung und ohne Logeintrag. Ursache: Die Arbeit war jeweils für den Zeitpunkt NACH der Antwort eingeplant, und diese Einplanung wurde im laufenden Betrieb nicht zuverlässig ausgeführt. Sie läuft jetzt innerhalb der Anfrage

---

## [3.2.5] — 30. Juli 2026 · Erfassung verliert keinen Fortschritt mehr

### Behoben
- **Der Stand wurde erst am Ende einer Runde gespeichert.** Wurde eine Runde vorzeitig beendet, war ihre gesamte Arbeit für den Seitenzeiger verloren — die Messpunkte standen zwar in der Datenbank, der nächste Anlauf begann aber wieder bei derselben Seite. Der Durchlauf kam so über Seite 32 von 82 nicht hinaus, ohne einen Fehler zu melden. Gespeichert wird jetzt nach jeder einzelnen Seite
- **Die Arbeitszeit je Runde liegt wieder klar unter der kleinsten Laufzeitgrenze.** Wird eine Runde abgeschnitten, stößt sie die nächste nicht mehr an und die Kette reißt

---

## [3.2.4] — 30. Juli 2026 · Kürzere Kette in der Preiserfassung

### Behoben
- **Die Erfassung blieb bei Seite 20 von 82 stehen, ohne einen Fehler zu melden.** Mit einer Minute je Runde brauchte ein Tag rund 40 Übergaben zwischen den Läufen, und jede davon ist ein möglicher Abrisspunkt. Eine Runde darf jetzt fünf Minuten arbeiten — damit bleiben etwa fünf Übergaben statt vierzig
- Der Anstoß der nächsten Runde wird nicht mehr zwischengespeichert

---

## [3.2.3] — 30. Juli 2026 · Erfassung überlebt einen Aussetzer der Kartendatenbank

### Behoben
- **Ein einzelner Abruffehler beendete den ganzen Durchlauf.** Die Fortsetzung war an ein fehlerfreies erstes Häppchen geknüpft — und die Kartendatenbank liefert regelmäßig Fehler. Im echten Lauf blieb die Erfassung dadurch dreimal hintereinander nach ein bis zwei von 82 Seiten stehen. Der Seitenzeiger steht nach einem Fehler ohnehin noch auf derselben Seite; die nächste Runde versucht sie erneut

---

## [3.2.2] — 30. Juli 2026 · Preiserfassung lief nach acht Seiten ins Leere

Im ersten echten Durchlauf blieb die Erfassung nach 8 von 82 Seiten stehen.

### Behoben
- **Der Folgeaufruf ging an die konfigurierte Adresse der künftigen eigenen Domain** — die noch nicht verbunden ist. Jede Fortsetzung lief damit ins Leere. Der Durchlauf ruft sich jetzt unter der Adresse auf, unter der er gerade selbst läuft; die ist zwangsläufig erreichbar
- **Ein abgerissener Anstoß war unsichtbar.** Im Stand blieb der letzte Abruffehler stehen, und der Stillstand sah aus wie ein langsamer Durchlauf. Der Abriss wird jetzt im Klartext vermerkt

---

## [3.2.1] — 30. Juli 2026 · Preiserfassung von Hand startbar

### Neu
- **Knopf im Monitoring, der die Erfassung sofort startet** statt bis zum nächsten Morgen zu warten. Der Stand (Seite, geprüfte Karten, geschriebene Messpunkte, letzter Fehler) steht daneben im Klartext

---

## [3.2.0] — 30. Juli 2026 · Preise werden für alle Karten erfasst

Bisher entstand die Preis-Historie fast nur dort, wo jemand geklickt hat: ein Messpunkt bei jedem Kartenaufruf plus ein täglicher Lauf über rund 80 Karten. Eine Karte, die niemand aufruft, bekam nie einen Wert — und verpasste Zeit lässt sich nicht nachholen, Preise von gestern gibt es nirgends zu kaufen.

### Neu
- **Flächendeckende Preiserfassung über die gesamte Kartendatenbank** (~20.500 Karten). Der Durchlauf arbeitet in Häppchen, merkt sich seinen Stand und setzt sich selbst fort, bis der Tag vollständig erfasst ist
- **Stand im Monitoring sichtbar** — Fortschritt, Datenstand und ein etwaiger Fehler im Klartext, statt nur im Log

### Geändert
- Gespeichert wird bei **Preisänderung** und zusätzlich mindestens **einmal pro Woche** je Karte. Zwischen zwei gleichen Preisen liegt eine gerade Linie — genau die zeichnet das Diagramm ohnehin, tägliche Wiederholungen derselben Zahl bringen keine zusätzliche Aussage
- Der Schnappschuss beim Kartenaufruf bleibt bestehen: Er erfasst genau die Karten, die gerade jemanden interessieren, sofort

---

## [3.1.4] — 30. Juli 2026 · Richtigstellung im Changelog

### Geändert
- **Der Eintrag zu v3.1.2 war zwischenzeitlich als Fehlschlag markiert.** Das war er nicht — die dort beschriebene Ursache stimmte, und die Anzeige funktionierte danach. Der Eintrag steht wieder korrekt; v3.1.3 löst dasselbe Problem lediglich unabhängig davon, wie gebaut wird

---

## [3.1.3] — 30. Juli 2026 · Versionsanzeige unabhängig vom Build-Befehl

### Behoben
- **Die Versionsanzeige in der Fußzeile hing an einer Umgebungsvariable, die nur beim Bauen über npm existiert.** Ein geänderter Build-Befehl hätte sie jederzeit wieder verstummen lassen — und genau das war zuvor über Monate der Fall, ohne dass es auffiel. Die Version steht jetzt als Konstante im Code (`src/lib/app-version.ts`); ein Test hält sie mit `package.json` zusammen und bricht den Build, wenn beim Versionssprung eine der beiden Stellen vergessen wird

### Geändert
- **Die Anzeige hängt nicht mehr davon ab, wie gebaut wird.** Bisher stammte der Wert aus `npm_package_version` — eine Variable, die nur existiert, wenn der Build über npm läuft. Als Konstante gilt das nicht mehr, und die Änderung am Build-Befehl aus v3.1.2 ist zurückgenommen; er ist wieder `next build`

---

## [3.1.2] — 30. Juli 2026 · Versionsanzeige in der Fußzeile

### Behoben
- **In der Fußzeile stand auf der Live-Seite ein nacktes „v" ohne Nummer.** Die Anzeige las `npm_package_version`, und diese Variable setzt ausschließlich npm beim Ausführen eines Skripts — der Build-Befehl lautete aber `next build` und lief an npm vorbei. Der Build lief daraufhin über `npm run vercel-build`, was die Anzeige tatsächlich wiederhergestellt hat. v3.1.3 ersetzt den Weg über die Umgebung durch eine Konstante, damit die Anzeige unabhängig vom Build-Befehl bleibt

---

## [3.1.1] — 30. Juli 2026 · Marktbreite: zwei Zahlen, eine Wahrheit

Auf der Startseite standen zwei verschiedene Marktbreiten gleichzeitig: die Kennzahlen-Kachel zeigte „16 % · 8/50 im Plus", die Erklärung zu Angst & Gier direkt darunter „16 von 50 Karten über ihrem 30-Tage-Schnitt" (32 %). Aufgefallen ist es beim Nachrechnen der Live-Werte gegen die Kartendatenbank.

### Behoben
- **Die Marktbreite war zu niedrig.** Als Zähler diente die Gewinnerliste der Anzeige — und die ist auf acht Einträge gekürzt. Sobald mehr als acht Karten gestiegen waren, blieb der Zähler auf 8 stehen, während der Nenner mit dem Datensatz weiterwuchs. Gezählt wird jetzt über den gesamten Datensatz
- **Kachel, Erklärtext und Angst & Gier rechnen aus derselben Quelle** (`marketBreadth`). Vorher gab es zwei Zählungen nebeneinander, von denen eine falsch war
- **Ein Aussetzer der Kartendatenbank konnte das gesamte Deployment verhindern.** Die Set-Übersicht ließ den Fehler bewusst durchschlagen — richtig zur Laufzeit, weil dann die zuletzt erfolgreiche Seite bestehen bleibt. Beim Erzeugen der Seiten gibt es aber keine solche Seite, und der Fehler brach den ganzen Vorgang ab, inklusive aller Änderungen, die mit Sets nichts zu tun haben. Aufgefallen ist es beim Bauen dieser Version

### Geändert
- **Karten ohne gemessenen Trend zählen nicht mehr als „nicht gestiegen".** Fehlt der 30-Tage-Schnitt der Preisquelle, steht der Trend rechnerisch auf 0 — das ist keine Messung, sondern eine Lücke. Solche Karten fließen jetzt in keine Trendkennzahl mehr ein (Marktbreite, Index, Angst & Gier)

---

## [3.1.0] — 30. Juli 2026 · QA-Durchlauf: Set-Logos, Tablet-Layout, Bedienbarkeit, Ladezeit

Systematischer Durchlauf über 14 Seiten in fünf Breiten (375 / 390 / 430 / 768 / 1280 Pixel). 129 Befunde zu Beginn, 0 am Ende.

### Behoben
- **Auf der Set-Übersicht blieben vier Logos leer.** Die Kartendatenbank liefert die Logos neuerer Sets von einem weiteren Host, der weder in der Bild-Weiterleitung noch in der Inhaltsrichtlinie stand — die Richtlinie stammt aus v2.35.0, der Fehler war also selbst verursacht. Der Host läuft jetzt über die eigene Bild-Weiterleitung; die Richtlinie bleibt unverändert eng
- **Auf Tablet-Breite (768 Pixel) ragte die Navigationsleiste 18 Pixel über den Rand** — waagerechtes Scrollen auf jeder Seite
- **Bedienelemente waren zu klein für einen Finger**: Sprachauswahl, Fußzeilen-Links, Ticker-Einträge, Partner-Links und alle „Alle …"-Verweise lagen bei 16 bis 22 Pixel Höhe. Jetzt durchgehend mindestens 32 Pixel, bei gleichen Abständen
- **Eine Karte mit genau 0 Prozent Veränderung wurde rot dargestellt** — im Ticker und im Kartenraster. Unverändert ist weder Gewinn noch Verlust
- **Portfolio und Merkliste hatten keinen Seitentitel und keine Beschreibung**, standen aber in der Sitemap

### Geändert
- **Die Karten-Detailseite lädt rund 29 Prozent weniger JavaScript** (659 auf 465 Kilobyte). Die Diagramm-Bibliothek wird nachgeladen statt mitgeliefert; ein gleich hoher Platzhalter hält das Layout ruhig
- **Einstieg ins Portfolio auf der Startseite.** Ohne ihn endete die Seite bei der Analyse — der letzte Schritt der Produktlogik fehlte

### Gemessen
Nach den Änderungen: keine Skriptfehler, keine fehlenden Bilder, kein waagerechtes Scrollen, keine leere Seite, kein Fehlerstatus. Layoutverschiebung 0 auf allen geprüften Seiten, erster sichtbarer Inhalt zwischen 136 und 220 Millisekunden.

---

## [3.0.0] — 30. Juli 2026 · Professionalisierung: Datenvertrauen, Karten-Detailseite, Portfolio-Auswertung, Methodik

Ein Sprint mit einem Ziel: aus dem MVP eine belastbare öffentliche Beta machen. Datenvertrauen vor Funktionsumfang.

### Behoben — Datenvertrauen
- **Die Rankings waren logisch falsch.** Gewinner und Verlierer entstanden aus derselben Liste, zweimal sortiert und jeweils oben abgeschnitten — ohne Vorzeichenfilter. Bei nur einer gestiegenen Karte standen unter „Top Gewinner" gefallene Karten, und dieselbe Karte konnte in beiden Listen stehen. Jetzt strikt getrennt, ohne künstliche Auffüllung
- **Der PMI wirkte belastbarer, als er war.** Unter 20 auswertbaren Karten wird kein Wert mehr ausgewiesen. Bei ausreichender Datenlage stehen Kartenzahl, Anzahl der Sets, Zeitraum und Datenstand an der Kennzahl
- **Angst &amp; Gier war nicht nachvollziehbar.** Der Wert entsteht jetzt aus drei offengelegten Teilwerten, die sich per Info-Knopf einzeln aufklappen lassen — die gewichtete Summe ergibt exakt den angezeigten Wert
- **Fehlerhafte Datensätze flossen unbemerkt in die Kennzahlen.** Vor jeder Berechnung werden fehlende Preise, doppelte Karten, unplausible Preise und absurde Trendwerte aussortiert und protokolliert
- **Eine Karte mit genau 0 % Veränderung wurde rot dargestellt** — unverändert ist weder Gewinn noch Verlust
- **Die Set-Übersicht konnte einen ganzen Tag als „nicht verfügbar" feststecken.** Der Abruf hatte weder Wiederholung noch Fehlerbehandlung, und die Seite wird 24 Stunden gecacht. Jetzt drei Versuche, echter Fehlerzustand mit Wiederholung und ein Ladezustand ohne Layoutsprung
- **Der Investment-Score war eine Kaufempfehlung.** Er vergab Punkte nach Preisstufen („über 100 € = +20") und beschriftete das Ergebnis mit „Starkes Investment" bzw. „Vorsicht geboten"

### Neu — Karten-Detailseite
- Wertentwicklung über 24H/7T/30T/90T/1J — aber nur für Zeiträume mit vorliegendem Messpunkt
- Marktkennzahlen: Höchstwert der Reihe, Abstand dazu, 30-Tage-Hoch und -Tief, Schwankungsbreite
- **PMI Score** aus vier offengelegten Faktoren (Momentum, Stabilität, Nachfrage, Datenlage). Der Preis fließt bewusst nicht ein — teuer bedeutet nicht besser
- Kartennummer sichtbar und im Seitentitel

### Neu — Portfolio
- Stärkste und schwächste Positionen, größte Posten, Aufteilung nach Set
- **Vergleich gegen den Markt**: eigene 30-Tage-Entwicklung gegen den PMI, Unterschied in Prozentpunkten. Erscheint nur, wenn beide Seiten eine belastbare Zahl haben

### Neu — Vertrauen
- **Methodik-Seite** unter `/methodik`: Preisquelle, Aktualisierung, Berechnung von Veränderungen, PMI, Angst &amp; Gier, PMI Score, Datenprüfung und die Grenzen der Datenlage. Die Schwellenwerte werden aus dem Code importiert, nicht abgetippt

### Suche
- Seltenheit in den Ergebnissen, Zeitraum-Bezug an der Veränderung

---

## [2.40.0] — 30. Juli 2026 · Startseite: Set-Bilder, Messbalken, Insights als Karten

### Behoben
- **In der Set-Tabelle fehlten die Bilder vollständig.** Vier Sets, kein einziges Bild — genau das, was die Regel „Boosterpack-Bild überall dort wo Karten erscheinen" verhindern soll. Jede Zeile zeigt jetzt ihr Set-Logo und führt per Klick zur Set-Seite

### Neu
- **Ø-Preis als Anteilsbalken** in jeder Set-Zeile. Eine Zahlenspalte lässt sich lesen, aber nicht vergleichen — der Balken macht daraus eine Rangfolge, die man auf einen Blick erfasst
- **PMI-Index mit Messbalken um die Nulllinie.** Ohne Maßstab ist eine Prozentzahl nur eine Zahl; mit ihm sieht man sofort, ob der Ausschlag klein oder groß ist
- **Marktbreite als geteilter Balken.** „16 von 50 im Plus" muss man umrechnen — als Balken ist das Verhältnis unmittelbar sichtbar
- **Investor Insights sind jetzt Karten statt Aufzählungspunkte**: Kartenbild bzw. Set-Logo, die Kennzahl groß und farbig, der Satz darunter. Verlinkt auf die jeweilige Karte oder das Set
- Alle neuen Balken bauen sich beim Hereinscrollen auf und stehen ohne JavaScript sofort vollständig da

---

## [2.39.0] — 30. Juli 2026 · Grafiken bauen sich auf, Guides-Kachel ohne kreuzende Linie

### Behoben
- **Eine Linie kreuzte die erste Guides-Kachel.** Die hervorgehobene Kachel war nur halbtransparent, und weil die Liste bewusst über den Kopfbereich ragt, schien dessen Unterkante mitten durch die Karte. Jetzt liegt eine deckende Fläche unter dem Verlauf

### Geändert
- **Alle Datengrafiken bauen sich beim Hereinscrollen auf.** Balken wachsen von null auf ihren Wert, Zeilen setzen versetzt ein, Kennzahlen zählen hoch. Eine Zahl, die fertig dasteht, wird überblättert — eine, die sich aufbaut, wird gelesen
- **Gestaltung deutlich aufgewertet**: Balken liegen in einer vertieften Spur, haben Farbverläufe, runde Enden und einen farbigen Schein; die Preisrangliste ist nummeriert und hat Hilfslinien als Maßstab; das Marktbild nennt, wie viele Karten im Plus liegen; die Kennzahlen-Kacheln haben einen Verlaufsrahmen und einen farbigen Akzent passend zu ihrem Wert
- **Der Endwert ist immer der echte Wert.** Das Hochzählen ist reine Darstellung — es endet exakt auf der gemessenen Zahl, nie auf einem gerundeten Zwischenschritt

### Technisch
- Die Sichtbarkeits-Erkennung liegt jetzt an einer Stelle (`useInView`) und wird von Einblendung, Balken und Kennzahlen gemeinsam genutzt
- Ohne JavaScript oder bei aktivierter Systemeinstellung „weniger Bewegung" steht sofort alles vollständig da — eine Grafik darf nie unsichtbar bleiben, nur weil eine Animation nicht laufen kann

---

## [2.38.0] — 30. Juli 2026 · Anschaulicher: neue Datengrafiken, Kartenbilder als Blickfang

### Behoben
- **Das Preisdiagramm färbte einen Kursanstieg grau.** Die Balkenfarbe kam aus der Akzentfarbe des Artikeltyps — beim Wochenrückblick ist das Grau. Darunter stand eine Legende, die für Aufwärtstrends Grün versprach. Steigend ist jetzt immer grün, fallend immer rot, und die Legende entfällt: Eine Grafik, die ihre Farben erklären muss, ist noch nicht fertig
- **Kartennamen wurden auf 13 Zeichen gekürzt** („Terapagos …"), weil senkrechte Balken keinen Platz für sie hatten. Die Balken liegen jetzt waagerecht — der Name hat die volle Zeilenbreite
- **Der Preis stand nur im Tooltip.** Auf einem Telefon gibt es kein Hover; der Wert steht jetzt am Balken
- **Unter jeder Karte stand dasselbe Set-Logo in voller Größe** — bei vier Karten aus einem Set viermal dasselbe Bild, das mehr Platz einnahm als die Karten. Stammen alle aus einem Set, steht das Logo einmal in der Kopfzeile
- **Der Marktbericht zeigte Listenlängen als Kennzahlen** („Top Gewinner: 6", „Marktbericht: Live") — Zahlen, die nichts über den Markt aussagen

### Neu
- **Kennzahlen-Kacheln** über Artikel und Marktbericht: stärkster Zuwachs, größter Rückgang, Preisspanne, Zahl der Karten — alles aus echten Marktdaten. Reicht die Datenlage nicht, erscheint der Block gar nicht
- **Marktbild-Grafik**: Veränderungen als Balken beidseits einer Nulllinie. Wer steigt, wer fällt und wie weit das auseinanderliegt, ist damit in einer Sekunde erfasst statt im Fließtext verstreut
- **Preisvergleich als Rangliste** mit Wert und Veränderung an jedem Balken
- **Kartenbilder sind der Blickfang**: volles Kartenformat, Rahmen und Tiefe statt einer festen Höhe
- Der Preisverlauf auf Kartenseiten färbt jetzt ebenfalls nach Richtung und zeigt bei dünner Datenlage die echten Messpunkte — alle Grafiken der Seite sprechen damit dieselbe Farbsprache

---

## [2.37.0] — 30. Juli 2026 · Portfolio: Zukäufe sind kein Gewinn, und die Kurve nutzt endlich alle Daten

Vollständige Durchsicht des Portfolios. Der Eindruck, hinter der Kurve steckten kaum Preisdaten, war berechtigt — und dabei kam ein Rechenfehler zum Vorschein, der schwerer wog als die Optik.

### Behoben
- **Zukäufe wurden als Wertsteigerung gezählt.** An einem echten Bestand wies der Jahreswert +636,90 € (+19,90 %) aus, während der tatsächliche Gewinn +216,90 € betrug. Die Differenz von exakt 420 € waren zwei später gekaufte Positionen. Wer nachkauft, hat dadurch nichts verdient — die Wertentwicklung ist jetzt um Zukäufe bereinigt, auch beim Ziehen über die Kurve
- **Das Portfolio nutzte nur einen Bruchteil der vorhandenen Preisdaten.** Es bekam ausschließlich die Cardmarket-Ankerpunkte — höchstens vier je Karte (Ø 30 Tage, Ø 7 Tage, Ø gestern, Trend). Für eine Karte waren das drei Punkte über ein ganzes Jahr. Die echten Tages-Snapshots, von denen zehntausende gespeichert sind, wurden nur auf der Karten-Detailseite eingemischt. Beide Quellen laufen jetzt über dieselbe Funktion
- **Positionen ohne geladenen Marktpreis zeigten „+0,00 € · 0,0 %"** — nicht zu unterscheiden von einer Karte, die sich wirklich nicht bewegt hat. Ein ausgefallener Abruf wird jetzt als solcher ausgewiesen

### Neu
- **Die Preise der Portfolio-Karten werden mitgeschrieben.** Bisher bauten genau die Karten, die jemanden interessieren, nie eine Tages-Historie auf: Sie stehen weder in den Top-Karten des täglichen Laufs, noch werden ihre Detailseiten zwangsläufig aufgerufen. Ab jetzt wächst die Historie mit jedem Portfolio-Aufruf
- **Die Kurve sagt, worauf sie beruht**: Zahl der echten Messpunkte im Zeitraum, Markierung der echten Punkte bei dünner Datenlage, Hinweis auf das Fortschreiben zwischen zwei Messungen. Zwischen zwei Messungen wird der zuletzt bekannte Preis weitergetragen — ohne diese Angabe liest sich eine Linie aus drei Werten wie eine lückenlose Aufzeichnung
- **Werteachse beschriftet** (höchster/niedrigster Wert des Zeitraums). Ohne Maßstab sieht eine Bewegung von 2 % genauso dramatisch aus wie eine von 60 %

---

## [2.36.0] — 30. Juli 2026 · Trade-Republic-Partnerlink aktiv

### Neu
- **Trade-Republic-Partnerlink eingesetzt.** Er steht als Standard im Code und bleibt per `NEXT_PUBLIC_TRADE_REPUBLIC_URL` überschreibbar — damit ist er sofort live, ohne dass in Vercel etwas gesetzt werden muss
- **Kennzeichnung an der Partner-Leiste.** Der Hinweis „Affiliate-Links — bei einem Abschluss erhält diese Seite eine Provision. Für dich ändert sich der Preis nicht." steht jetzt in der Komponente selbst, nicht in den einzelnen Seiten. So kann er beim Einbau an einer neuen Stelle nicht vergessen werden (Kennzeichnungspflicht)

### Behoben
- **Der Trade-Republic-Eintrag war ein klickbarer Link ohne Ziel** (`href="#"`, mangels hinterlegter Adresse). Sichtbar, aber wirkungslos — und damit auch ohne Provision
- **Ein Cardmarket-Link im Archiv-Hinweis** war weder gekennzeichnet noch an die Affiliate-Variable gekoppelt. Er wird jetzt automatisch monetarisiert, sobald der Cardmarket-Link vorliegt
- Eine neue Prüfung findet ab sofort jeden Partner-Link ohne `rel="sponsored"` — sie hat genau diese Stelle aufgedeckt

---

## [2.35.2] — 30. Juli 2026 · Die tatsächliche Ursache: eine Spalte, die es nicht gibt

Die in v2.35.1 eingebaute Fehlermeldung hat sofort geliefert: `Could not find the 'title' column of 'articles'`. Die Vermutung aus v2.35.1 (fehlender eindeutiger Index) war falsch — deshalb war es richtig, die echte Meldung sichtbar zu machen, statt zu raten.

### Behoben
- **Der Artikel-Speicher schrieb in eine Spalte, die die Tabelle nicht hat.** Der Titel wird nicht mehr doppelt abgelegt, sondern dort gelesen, wo er ohnehin steht — im gespeicherten Beitrag (`content->>title`). Kein SQL nötig, keine Migration
- Das Blog-Listing las dieselbe fehlende Spalte und bekam deshalb immer eine leere Liste zurück; ein Lesefehler wird jetzt protokolliert statt verschluckt

---

## [2.35.1] — 30. Juli 2026 · Artikel wurden nie gespeichert — und jeder Aufruf kostete neu

Beim Nachziehen der Inhalte aufgefallen: Zehn erfolgreich erzeugte Artikel, null gespeicherte Zeilen, keine einzige Fehlermeldung. Drei Abrufe derselben Artikelseite lieferten drei verschiedene Titel.

### Behoben
- **Das Speichern scheiterte still.** `saveArticle` gab nur `!error` zurück und verwarf die Ursache; die Aufrufer hingen ein `.catch()` an — das greift aber nur bei geworfenen Ausnahmen, und die Datenbankbibliothek wirft nicht, sondern liefert den Fehler zurück. Es gibt jetzt `{ ok, error }` mit der echten Meldung, und jeder Aufrufer wertet sie aus
- **Jeder Seitenaufruf erzeugte einen neuen Artikel.** Die Artikelseite heilt sich selbst: Fehlt der Beitrag, wird er erzeugt. Das ist richtig — aber der Route fehlte `generateStaticParams`, und ohne diese Funktion stuft Next.js sie als „bei jeder Anfrage neu rendern" ein. Die `revalidate`-Angabe darüber war wirkungslos. Zusammen mit dem stillen Speicherfehler bedeutete das: ein vollständiger KI-Aufruf pro Besucher und pro Crawler
- Die Auslöse-Route meldet jetzt `saved` und die Ursache, statt Erfolg zu behaupten

### Wichtig
Diese beiden Fehler zusammen sind die plausibelste Erklärung für das aufgebrauchte Guthaben — mehr noch als die offenen Endpunkte aus v2.34.0. Die Erfassung aus v2.34.0 macht so etwas ab sofort sichtbar.

---

## [2.35.0] — 30. Juli 2026 · Sicherheitsdurchsicht: neun Befunde geschlossen

Eine vollständige Durchsicht der Plattform aus Angreifersicht. Neun Befunde, alle behoben, jeder mit einer Prüfung abgesichert (74 neue Tests, insgesamt 521).

### Behoben
- **Fremder Code über strukturierte Daten (schwerwiegend).** Die Suchmaschinen-Daten wurden mit `JSON.stringify` in einen `<script>`-Block geschrieben — und `JSON.stringify` maskiert `</script>` nicht. Auf der Suchseite floss die Suchanfrage des Besuchers ungefiltert dort hinein: Ein präparierter Link hätte im Browser jedes Besuchers fremden Code ausgeführt. Fünf Seiten waren betroffen; alle laufen jetzt über `jsonLd()`
- **Offene Weiterleitung nach der Anmeldung (schwerwiegend).** Die Prüfung des Rücksprungziels ließ sich mit einem Rückstrich (`/\ziel`) und mit einem Tabulator umgehen — beides wandelt der Browser in eine fremde Adresse um. Ein Link auf die echte Domain hätte nach erfolgreicher Anmeldung auf einer fremden Seite geendet. Die Prüfung vergleicht jetzt die Herkunft der fertig aufgelösten Adresse
- **Newsletter-Vorlage setzte jeden Wert ungeprüft in HTML ein** — Kartennamen aus der externen Datenquelle, Texte aus der Generierung, sogar die Bildadresse direkt in ein `src`-Attribut. Alle Werte werden jetzt maskiert, Bildquellen nur noch von den bekannten Hosts und nur über https
- **Der Bild-Zwischenspeicher folgte Weiterleitungen blind.** Die Liste erlaubter Hosts galt damit nur für den ersten Sprung — eine Weiterleitung hätte den Server dazu gebracht, ein beliebiges internes Ziel abzurufen und nach außen zu geben. Jede Weiterleitung wird jetzt einzeln geprüft, höchstens drei
- **Zusätzliche FFmpeg-Optionen über die Schnittlänge.** Der Wert floss ungeprüft in die Kommandozeile; jetzt ist es eine Zahl mit Grenzen. Der Speicherpfad wird ebenfalls geprüft
- **Newsletter-Anmeldung ohne jede Begrenzung** — fünf Versuche je Adresse und Stunde, dazu eine echte Prüfung der E-Mail-Adresse statt nur „enthält ein @"
- **Next.js von 16.2.9 auf 16.2.12** — schließt neun Meldungen, darunter serverseitige Anfragefälschung in Server Actions und die Preisgabe interner Endpunkte
- **Ein KI-Aufruf fehlte in der Kostenerfassung** (Video-Bildunterschrift) und trug eine fest verdrahtete Modell-ID

### Neu
- **Sicherheits-Kopfzeilen auf jeder Antwort**: Inhaltsrichtlinie (CSP), `X-Frame-Options: DENY`, `nosniff`, Referrer- und Berechtigungsregeln. Das Studio ließ sich zuvor unsichtbar in eine fremde Seite einbetten — dort liegen Knöpfe, die veröffentlichen und Guthaben verbrauchen
- `src/lib/json-ld.ts`, `src/lib/safe-redirect.ts`, `src/lib/rate-limit.ts` — je eine Stelle für Maskierung, Weiterleitungsziele und Zugriffsgrenzen
- **74 neue Prüfungen** in `security.test.ts`, darunter dauerhafte Regeln: keine Seite darf wieder unmaskiertes JSON einbetten, neue Stellen mit rohem HTML fallen auf, die Kopfzeilen müssen vorhanden bleiben, Next.js darf nicht unter 16.2.12 fallen

### Bekannt und bewertet
`postcss` und `sharp` melden weiterhin Schwachstellen. Beide stecken innerhalb von Next.js selbst; die einzige von npm angebotene „Lösung" wäre ein Rückschritt auf Next.js 9. `postcss` läuft nur beim Bauen, `sharp` verarbeitet ausschließlich Bilder der beiden erlaubten Hosts. Ein erzwungenes Update läge außerhalb der von Next.js zugelassenen Fassung und könnte die Bildauslieferung in Produktion brechen — deshalb bewusst nicht erzwungen, sondern beobachtet.

---

## [2.34.0] — 2026-07-30 · Kostenerfassung — und der Grund für das leere Guthaben

### Behoben
- **Zwei Endpunkte lösten KI-Generierungen ohne jede Anmeldung aus.** `/api/market` war ein schlichter GET-Aufruf: jeder Crawler, Bot oder Scanner, der ihn fand, startete eine vollständige Marktanalyse — und damit einen der teuersten Aufrufe der Plattform. `/api/generate` war ebenso offen. Beide verlangen jetzt die Studio-Anmeldung
- Die Model-ID stand in `article-generator.ts` fest im Code statt zentral über die Umgebungsvariable (Code-Regel 7)

### Neu
- **KI-Verbrauch wird erfasst und im Monitoring ausgewiesen**: Aufrufe, Token und Kosten der letzten 30 Tage, gruppiert nach Zweck (Artikel, Guide, Marktbericht, Newsletter, Video, Social) — teuerster Zweck zuerst, dazu die Kosten von heute
- Auch **gescheiterte** Aufrufe werden erfasst. Ein Aufruf, der am Guthaben scheitert, kostet nichts — aber ohne seine Spur sieht es aus, als sei gar nichts passiert
- Ein Test verhindert die Wiederholung: Jede neue Route, die eine Generierung auslösen kann, muss einen Zugriffsschutz haben, sonst schlägt der Build fehl

### Wichtig
Die eingesetzte Modellklasse (Opus) kostet **5 $ je Million Eingabe- und 25 $ je Million Ausgabe-Token** — fünfmal so viel wie die kleinste Klasse. Ein einzelner Artikel liegt bei etwa 0,17 $. Sobald die Erfassung ein paar Tage läuft, steht im Monitoring, wohin das Geld tatsächlich fließt.

---

## [2.33.0] — 2026-07-30 · Ursache des Content-Ausfalls gefunden

### Behoben
- **Das „Live!" im Studio war eine reine Behauptung.** `publishMarktbericht()` rief ausschließlich die Cache-Erneuerung auf und speicherte **nichts** — die Funktion konnte gar nicht fehlschlagen, also war die Meldung immer grün. Auf der öffentlichen Seite stand derweil „Erster Bericht noch ausstehend". Jetzt wird der angezeigte Text tatsächlich gespeichert, durchläuft dasselbe Mindestmaß-Gate wie der Cron, und das echte Ergebnis steht im Klartext darunter
- Die Veröffentlichung prüft jetzt serverseitig die Anmeldung — eine Server-Action ist öffentlich erreichbar, auch wenn nur das Studio sie aufruft
- **Fehler der KI-Schnittstelle werden übersetzt.** Aus `400 {"type":"error",…}` wird „Das Guthaben der KI-Schnittstelle ist aufgebraucht" — mit dem Hinweis, wer was tun muss
- **Der Artikel-Auslöser nennt jetzt die Ursache.** Vorher meldete er nur „ist ein Ersatztext", was wie ein Programmfehler aussah
- Zwei weitere stumme `catch`-Blöcke beim Speichern von Artikeln beseitigt

### Wichtig
Marktbericht, Artikel und Guides scheitern derzeit **alle an derselben Ursache**: Das Anthropic-Guthaben ist aufgebraucht. Das ist kein Codefehler — nach dem Aufladen laufen alle drei sofort. Ab dieser Version sagen die Auslöser das auch so.

---

## [2.32.1] — 2026-07-29 · Anmeldung vorerst abgeschaltet

### Geändert
- **Die Anmeldeknöpfe erscheinen erst, wenn `NEXT_PUBLIC_PORTFOLIO_LOGIN=on` gesetzt ist.** Der Schalter ist bewusst von den Zugangsdaten getrennt: So lässt sich Supabase in Ruhe einrichten und prüfen, ohne dass Besucher schon eine halb fertige Anmeldung sehen
- Der Schalter ist opt-in — vergisst man ihn, erscheint ein Feature nicht, statt versehentlich zu erscheinen

### Behoben
- Vier Zeilen der Versionstabelle in `STATUS.md` waren zu einer verschmolzen

---

## [2.32.0] — 2026-07-29 · Portfolio-Konto: Anmeldung mit Google und Apple

### Neu
- **Portfolio dauerhaft speichern.** Wer sich anmeldet, findet sein Portfolio auf jedem Gerät wieder — bisher lag es ausschließlich im Speicher des jeweiligen Browsers und war beim Wechsel oder beim Leeren des Verlaufs weg
- **Anmeldung mit Google und Apple** über Supabase Auth
- **Sichtbarer Hinweis, wo die Daten liegen**: „Nur in diesem Browser gespeichert" bzw. „Im Konto gespeichert". Ohne diesen Hinweis hält man sein Portfolio für sicher, obwohl es das nicht ist
- Beim ersten Anmelden wird der vorhandene Browser-Bestand automatisch ins Konto übernommen — nichts geht verloren
- 45 neue Tests (409 insgesamt)

### Geändert
- Änderungen werden weiterhin **immer auch lokal** gespeichert. Ist das Konto gerade nicht erreichbar, bleibt der Browser der Rückfall — mit sichtbarem Hinweis statt stiller Datenverlust
- Nach dem Abmelden bleibt der lokale Bestand sichtbar; es verschwindet nichts vom Bildschirm

### Wichtig
- **Ohne Einrichtung ändert sich nichts.** Sind die Zugangsdaten nicht gesetzt, erscheinen keine Anmeldeknöpfe und das Portfolio arbeitet unverändert lokal
- Die Einrichtung braucht drei Schritte im Supabase-Dashboard, ein Google-OAuth-Konto und — für Apple — ein kostenpflichtiges Apple-Developer-Konto. Die Anleitung steht im Monitoring und in CLAUDE.md

---

## [2.31.0] — 2026-07-29 · Portfolio-Tests und Newsletter-Pflichten

### Neu
- **Portfolio tiefer abgesichert**: 33 zusätzliche Prüfungen für beschädigte gespeicherte Daten, Geschenke ohne Kaufpreis, Kaufdatum in der Zukunft, Jahres-Deckelung der Grafik und das Zusammenspiel aller Schritte von den Rohdaten bis zur gefilterten Kurve
- **Funktionstests der Portfolio-Preis-API** (18 Prüfungen): Sprachpreise, altes Anfrageformat, Kappung auf 50 Karten, und vor allem das Verhalten bei ausfallenden Kartenabrufen — eine kaputte Karte darf nicht das ganze Portfolio ohne Live-Preise dastehen lassen
- **Newsletter-Vorlage und Merkliste** erstmals getestet (29 Prüfungen)
- Insgesamt 364 statt 284 Tests

### Behoben
- **Beschädigte Portfolio-Daten führten zu „NaN" im Gesamtwert**: Die Normalisierung überschrieb ihre eigenen Vorgabewerte, sobald ein Feld ausdrücklich auf `undefined` oder `null` stand. Jedes Feld wird jetzt einzeln geprüft; ein Kaufpreis von 0 bleibt dabei erhalten
- **Newsletter ohne Affiliate-Kennzeichnung**: Die Kauflinks trugen kein `rel="sponsored"` — gesetzlich vorgeschrieben
- **Abmelden, Datenschutz und Impressum im Newsletter waren tote Links** (`href="#"`). Sie zeigen jetzt auf die echten Seiten — ein funktionierender Abmeldeweg ist Pflicht
- **Newsletter forderte zum Kauf auf** („Jetzt die besten Deals sichern") und enthielt Emojis; außerdem verlangte der Prompt ausdrücklich ein Emoji im Betreff
- **Der Newsletter war der einzige veröffentlichte Text ohne Inhalts- und Stilregeln** im Prompt
- **Beide Cardmarket-Aufrufe und drei Instagram-Aufrufe liefen ohne Zeitlimit** — die Regel dafür griff nicht, weil sie nur nach direkt notierten Adressen suchte und nicht nach `fetch(url, …)`
- Cardmarket-Sprachpreise verschluckten ihren Fehlergrund

---

## [2.30.0] — 2026-07-29 · Tiefere Tests: 135 neue Prüfungen, sieben gefundene Fehler

### Neu
- **Sieben neue Testdateien** decken bisher ungeprüfte Bereiche ab: Studio-Zugang, Preis-Wahrheitspflicht, Reel-Formate, Startseiten-Absicherung, Bild-Proxy, Übersetzungen und Kartennamen
- **Architektur-Regeln werden automatisch durchgesetzt**: Zahlenformat, Dark-Mode-Farben, Auth auf Inhalts-Auslösern, keine internen Fehlerdetails nach außen, kein stilles Verschlucken von Fehlern, Zeitlimit auf externen Aufrufen
- Ausnahmen von diesen Regeln werden im Quelltext begründet (`// toFixed erlaubt: …`), nicht in einer Liste im Test — die Begründung steht dort, wo sie beim Lesen gebraucht wird
- Insgesamt 284 statt 149 Tests

### Behoben
Die neuen Tests haben diese Fehler gefunden:
- **Preise und Prozentwerte an sechs Stellen wieder in englischer Schreibweise** — Kartenraster, Preis-Chart-Achse, Set-Gesamtwert, Marktbreite auf der Startseite, Reel-Vorschau im Studio sowie das Social-Vorschaubild
- **Newsletter-Preise und -Trends** liefen an der zentralen Formatierung vorbei
- **Prozentwerte konnten am Zeilenende umbrechen** — zwischen Zahl und `%` steht jetzt ein geschütztes Leerzeichen, genau wie beim €-Zeichen
- **Reel-Formate wechselten mitten in der Woche**: Die Wochenzählung lief ab dem 1. Januar statt ab Montag, dadurch konnten Montag und Freitag derselben Woche unterschiedliche Formate ergeben
- **Zwei API-Antworten gaben interne Fehlerdetails nach außen** (Pfade, Architektur)
- **Drei KI-Aufrufe verschluckten ihren Fehler stumm** und drei Token-Limits waren zu knapp bemessen — dasselbe Muster, das den wochenlangen Artikel-Ausfall verursacht hat
- **Die Monitoring-Seite rief die TCG-API ohne Zeitlimit auf** — ausgerechnet die Seite, die einen Ausfall anzeigen soll, konnte daran hängenbleiben
- **Studio und Reels-Studio hatten noch helle Boxen** aus der Zeit vor dem Dark Mode
- Ein Kommentar behauptete, der Preisverlauf werde interpoliert — seit v2.19.1 falsch und ein Widerspruch zur Preis-Wahrheitspflicht

---

## [2.29.0] — 2026-07-29 · Marktbericht und Artikel per Klick auslösen

### Neu
- **Zwei neue Auslöser im Monitoring** unter „Betriebszustand":
  - *Marktbericht (Wochenanalyse)* — erzeugt den Bericht der laufenden Woche sofort
  - *Artikel (Sonntag + Donnerstag)* — prüft die letzten acht Termine und ersetzt Ersatztexte durch echte Beiträge
- Jede Kachel meldet das Ergebnis im Klartext: Zeichenzahl, ausgewertete Karten, oder der konkrete Grund des Scheiterns

### Geändert
- Der Artikel-Lauf arbeitet die Termine einzeln ab und zeigt den Fortschritt — acht Generierungen in einem Server-Aufruf würden am Zeitlimit scheitern
- Bereits echte Artikel bleiben unangetastet; der Lauf ist damit gefahrlos wiederholbar
- Veröffentlichungstermine liegen jetzt in einem eigenen, abhängigkeitsfreien Modul (`publish-days.ts`) statt doppelt in Seite und Generator

### Warum
Marktbericht und Artikel ließen sich bisher **nur per Kommandozeile mit dem Studio-Passwort** auslösen. Genau deshalb blieb der Marktbericht nach dem Ausfall in KW 26 monatelang liegen: Es gab schlicht keinen Weg, ihn ohne Werkzeuge neu anzustoßen.

---

## [2.28.0] — 2026-07-29 · Reels mit Farbe: Kartenmotiv als Hintergrund

### Neu
- **Jedes Segment bekommt die Farbstimmung seiner Karte.** Das Kartenbild läuft zusätzlich als stark unscharfe, langsam wandernde Fläche im Hintergrund — der Text darüber bleibt pixelscharf. Eine Feuer-Karte gibt dem Bild Rot-Orange, eine Wasser-Karte Blau
- **Angedeutetes Sammel-Motiv** auf Haken-, Einordnungs- und Abspann-Bild: ein sehr großer, blasser Kreisumriss mit Mittelband, über den Bildrand hinauslaufend — Atmosphäre statt Dekoration
- **Verspielte Streuelemente**: schwebende Punkte und Ringe in der Segmentfarbe
- Karten liegen jetzt leicht geneigt statt exakt waagerecht, Neigungsrichtung wechselt je Platzierung
- Platzierungsziffer mit Farbverlauf in der Trendfarbe

### Geändert
- Haken, Einordnung und Abspann sind nicht mehr fast schwarz, sondern tragen die Farben der ersten Karte als abstrakte Farbfelder
- Abdunklung an Ober- und Unterkante der Kartenbilder — die Lesbarkeit hängt damit nicht mehr davon ab, wie hell eine Karte ist
- Fortschrittspunkte am unteren Rand aufgehellt (auf farbigem Grund waren sie unsichtbar)

### Behoben
- **Abspann zeigte eine doppelte Aussage**: Über der Formatzeile stand fest verdrahtet „Alle Preise", zusammen ergab das „Alle Preise / Preise täglich aktuell" — bei anderen Formaten sogar Unsinn wie „Alle Preise / Alle Sets auf der Seite". Der Vorspann ist entfallen, die Zeile kommt vollständig aus dem Format

---

## [2.27.0] — 2026-07-29 · Instagram-Konzept: vier Formate mit eigener Dramaturgie

### Neu
- **Vier Reel-Formate statt einem**, die sich automatisch nach Kalenderwoche abwechseln — niemand muss wöchentlich entscheiden, was gepostet wird:
  - *Stärkste Bewegungen* — der verlässliche Wochenrhythmus
  - *Preis-Check* — Quiz mit verdecktem Wert und Auflösung; fordert zum Mitraten in den Kommentaren auf
  - *Teuerste Karten eines Sets* — praktisch unbegrenzter Nachschub, ein Beitrag pro Set
  - *Preis gegen 30-Tage-Schnitt* — zeigt, wo der Markt gerade abweicht
- **Durchgängige Dramaturgie**: Haken zuerst (Frage oder Zahl), dann die Karten, dann eine Einordnung, Marke zuletzt. Reicht die Datenlage für ein Format nicht, wird automatisch das nächste genommen
- Format im Studio manuell wählbar; Bildunterschrift wird je Format passend erzeugt

### Geändert
- **Das Marken-Intro am Anfang ist entfallen.** Die ersten Sekunden entscheiden über die Reichweite — dort steht jetzt der Haken, die Marke steht am Schluss
- Neue Formate lassen sich künftig ergänzen, ohne die Videoerzeugung anzufassen

---

## [2.26.0] — 2026-07-29 · Reels im eigenen Look: lebendiger und hochwertiger

### Geändert
- **Reels komplett neu gestaltet** — im Terminal-Look der Plattform statt schlichter Textfolien:
  - Feines Raster im Hintergrund und zwei farbige Lichtquellen; die Stimmungsfarbe folgt der Trendrichtung, sodass steigende Karten grün und fallende rot leuchten — die Richtung ist erkennbar, bevor man die Zahl liest
  - Platzierung als große Ziffer („01 / 05"), Karte mit farbigem Ring und Schlagschatten
  - Der Trend ist jetzt die Hauptkennzahl: groß, farbig, mit Richtungspfeil. Der Marktwert sitzt als eigenes Feld darunter
  - Fortschrittsanzeige am unteren Rand zeigt, an welcher Stelle des Reels man ist
  - Intro und Abspann mit Verlaufsschrift und Akzentbalken

### Neu
- **Bewegung und Rhythmus**: langsames Heranfahren mit wechselnder Richtung je Abschnitt, weiche Blenden zwischen den Abschnitten statt harter Schnitte, dezente Randabdunklung für den Blickfokus

---

## [2.25.0] — 2026-07-29 · Instagram-Reels funktionieren erstmals

### Behoben
- **Die Reel-Erstellung konnte technisch nie funktionieren.** Die mitgelieferte Videosoftware enthält die Funktion zum Einblenden von Text schlicht nicht — der bisherige Aufbau legte aber jede einzelne Textzeile (Titel, Kartenname, Preis, Trend, Abspann) genau darüber. Jeder Versuch scheiterte, bevor auch nur ein Kartenbild verarbeitet wurde. Auch der frühere Schriftart-Fix lief deshalb ins Leere
- **Neuer Aufbau**: Die Bilder werden jetzt fertig gestaltet — mit derselben Technik, die auf der Seite schon die Social-Vorschaubilder erzeugt — und die Videosoftware fügt sie nur noch zusammen. Ein vollständiges Reel wurde damit erstmals erfolgreich erstellt (1080×1920, 23 Sekunden, aus echten Marktdaten)
- Dieselbe fehlende Funktion betraf den manuellen Reel-Schnitt; der dortige Schriftzug wurde entfernt

### Geändert
- Preise und Trends im Reel erscheinen jetzt in deutscher Schreibweise („79,88 €", „-13,8 %")

---

## [2.24.0] — 2026-07-29 · Gesamt-Audit: Preisdarstellung, Bilder, Ausfallsicherheit

### Behoben
- **Preise wurden im englischen Zahlenformat angezeigt** — „235.71 €" statt „235,71 €", bei teuren Karten sogar „4184.60 €" ohne Tausenderpunkt. Betroffen waren rund 15 Stellen quer über die Seite: Kartendetails, Suche, Kartenraster, Diagramme, Artikel, Startseite, Merkliste und Portfolio. Jetzt durchgehend deutsche Schreibweise mit Tausenderpunkt („4.184,60 €") aus einer zentralen Quelle
- **Die Boosterpack-Bilder existierten nicht mehr.** Die hinterlegte Bildquelle liefert für jedes geprüfte Set einen Fehler — bei jedem Kartenbild lief also eine zwecklose Anfrage, bevor auf das Set-Logo zurückgefallen wurde. Das Set-Logo ist jetzt die direkte Quelle, die Beschriftung entsprechend ehrlich
- **Die Startseite war leer** — ohne Karten, Trends und Preise. Ursache: Die Kartendatenbank antwortet zeitweise unzuverlässig; fiel sie genau beim Erzeugen der Seite aus, wurde die leere Fassung stundenlang ausgeliefert. Abrufe wiederholen jetzt automatisch und weichen auf andere Sets aus
- **Die Startseite errechnete aus fehlenden Daten trotzdem eine Marktstimmung** (Marktindex, Angst-und-Gier-Wert). Bei leerer Datenlage erscheint jetzt ein ehrlicher Hinweis statt erfundener Kennzahlen

### Geändert
- Zahlenformatierung liegt zentral in `src/lib/format.ts`; die zweite, abweichende Umsetzung im Portfolio wurde aufgelöst
- 12 neue Tests sichern die deutsche Schreibweise projektweit ab (145 gesamt)

---

## [2.23.0] — 2026-07-29 · Marktbericht: Platzhalter entfernt, Erzeugung repariert

### Behoben
- **Als Wochenanalyse stand ein Platzhalter online.** Der angezeigte Bericht bestand aus einem einzigen Wort und stammte aus Kalenderwoche 26 — seither wurde kein neuer Bericht mehr erzeugt, das Archiv blieb leer. Solche Platzhalter werden jetzt gar nicht mehr angezeigt und auch nicht mehr gespeichert
- **Der Wochen-Cron meldete Erfolg, ohne ihn zu prüfen**: Der Rückgabewert des Speichervorgangs wurde verworfen, ein fehlgeschlagenes Speichern sah deshalb wie ein Erfolg aus. Jetzt wird das Ergebnis geprüft und die Ursache im Klartext zurückgegeben
- **Ein Fehler im Newsletter-Schritt verhinderte den ganzen Bericht**: Alles lief in einem einzigen Fehler-Block. Bericht und Newsletter sind jetzt entkoppelt — der Bericht entsteht auch dann, wenn der Newsletter scheitert

### Neu
- **Qualitätsgate für den Marktbericht**: Ein zu kurzer Text wird nicht veröffentlicht. Lieber kein neuer Bericht als ein Platzhalter auf der Startseite
- **Bericht manuell erzeugen**: Ein geschützter Auslöser erstellt sofort einen echten Wochenbericht, statt bis Montag zu warten — mit Klartext-Rückmeldung im Fehlerfall
- 12 neue Tests (133 gesamt)

---

## [2.22.0] — 2026-07-27 · Echte Artikel statt Ausweichtexte

### Behoben
- **Kein einziger Blog-Beitrag wurde tatsächlich aus Marktdaten erstellt.** Das Token-Limit für die Texterzeugung war zu knapp bemessen (2.048), sodass die Antwort regelmäßig mitten im Satz abbrach, nicht mehr verarbeitet werden konnte und still auf einen allgemeinen Ausweichtext zurückfiel — bei jedem Beitrag. Limit deutlich erhöht; abgeschnittene Antworten werden jetzt ausdrücklich gemeldet statt als Formatfehler getarnt
- Dieselbe zu knappe Bemessung betraf **Guides und den Wochen-Marktbericht** — beide ebenfalls behoben
- **Fehlende Lesezeit**: Ältere gespeicherte Beiträge zeigten „Min Lektüre" ohne Zahl. Die Lesezeit wird jetzt bei Bedarf aus dem Text berechnet
- **Wochenrückblick-Ausweichtext behauptete Wochen-Beobachtungen**, die er nicht enthielt („Was diese Woche gezeigt hat" ohne einen einzigen Wochenwert). Neu als zeitlose Marktmuster-Erklärung formuliert — keine Schein-Aktualität mehr

### Geändert
- **Der Wochen-Marktbericht folgt jetzt denselben Inhalts- und Stilregeln wie die Artikel** (keine Kaufempfehlungen, keine Floskeln, keine erfundenen Zahlen) — bisher galten diese Regeln für ihn nicht. Außerdem ausführlicher und in Absätze gegliedert statt auf 150 Wörter begrenzt
- Fehlerursachen der Texterzeugung landen jetzt im Klartext im Protokoll statt verschluckt zu werden

### Neu
- **Beiträge nachträglich neu erzeugen**: Ein geschützter Auslöser ersetzt gespeicherte Ausweichtexte durch echte, datenbasierte Beiträge — nötig, weil bereits gespeicherte Beiträge sonst dauerhaft Ausweichtexte blieben
- 4 neue Tests (125 gesamt)

---

## [2.21.0] — 2026-07-27 · Betriebszustand sichtbar: Guide-Pipeline repariert

### Behoben
- **Die automatische Guide-Erzeugung lief unbemerkt ins Leere.** Zwölf vorbereitete Themen warteten in der Warteschlange, erzeugt wurde keines — der Speichervorgang scheiterte still und meldete den Grund an niemanden. Die Ursache wird jetzt im Klartext angezeigt statt verschluckt
- Fehlschläge der Guide-Erzeugung stehen jetzt vollständig in der Cron-Antwort (Ursache, betroffenes Thema, Regelverstöße) statt nur im Server-Log

### Neu
- **Betriebszustand im Monitoring** — zeigt erstmals, was tatsächlich passiert ist, statt nur ob Schlüssel gesetzt sind: Anzahl gespeicherter Preis-Schnappschüsse, Artikel, Guides und Marktberichte, jeweils mit Datenstand und Frische-Bewertung (aktuell / veraltet / leer)
- **Selbsterklärende Fehlerbehebung**: Fehlt eine Datenbank-Tabelle, zeigt das Monitoring die konkrete Fehlermeldung plus das fertige SQL zum Anlegen — kein Rätselraten mehr
- **„Jetzt testen"-Knopf für die Guide-Pipeline**: Eine Reparatur lässt sich sofort überprüfen, statt bis zum nächsten Guide-Tag (Dienstag/Freitag) zu warten
- 11 neue Tests für die Diagnose-Logik (121 gesamt)

---

## [2.20.0] — 2026-07-20 · Rich-Content: Guides & Berichte laden zum Lesen ein

### Neu
- **Gemeinsame Rich-Content-Render-Ebene** für alle Lese-Inhalte — dadurch wirkt auch jeder künftig automatisch generierte Beitrag lebendig, ohne Handarbeit:
  - `<Prose>`: verwandelt Rohtext in großzügig gesetzte Absätze mit Magazin-Initialbuchstaben, Aufzählungen mit Punkten und farblich hervorgehobenen Kennzahlen (Preise/Prozente)
  - `<Reveal>`: blendet Abschnitte beim Hereinscrollen sanft ein (respektiert „Reduced Motion", Text ist nie versteckt)
  - `<ReadingProgress>`: schmaler Lesefortschritts-Balken am oberen Rand

### Geändert
- **Guides komplett aufgewertet**: großes Icon-Medaillon im Header mit Ambient-Glow, Intro mit Initialbuchstaben, Abschnitte mit Farbverlauf-Akzent und nummerierten Medaillons, Kennzahlen hervorgehoben — statt nüchterner Absätze eine magazinartige Lektüre
- **Marktbericht**: der Berichtstext wird jetzt großzügig gesetzt (Initialbuchstabe, hervorgehobene Preise) statt als sterile Textwand; Header mit bewegtem Glow
- **Artikel**: Lesefortschritt, Intro mit Initialbuchstabe, sanft einblendende Abschnitte — konsistent zum neuen Content-Look

---

## [2.19.8] — 2026-07-20 · BUGFIX: Mobil-Navigation — fehlende Menüpunkte

### Behoben
- **Auf dem Handy fehlten die meisten Navigationspunkte** (u.a. Sets, Einsteiger, Marktbericht, Merkliste). Die Leiste zeigte mobil nur eine handverlesene Auswahl (Blog, Guides, Portfolio, Suche); alle übrigen Links waren fest auf Desktop-Breite ausgeblendet, ohne Menü, um sie zu erreichen
- **Fix**: Echtes aufklappbares Mobil-Menü (Hamburger) mit ALLEN Navigationspunkten. Öffnet als 2-spaltiges Raster unter der Leiste, schließt automatisch beim Seitenwechsel, aktiver Punkt hervorgehoben. Nichts ist mehr nur auf dem Desktop erreichbar

---

## [2.19.7] — 2026-07-20 · Set-Übersicht: professionelles Raster + verlässliche Logos

### Behoben
- **Kaputte Bild-Platzhalter auf der Set-Übersicht**: Bei Preview-/Zukunfts-Sets ohne Artwork (z.B. noch unveröffentlichte Erweiterungen) zeigte das Raster ein defektes Bild-Icon. Jetzt greift eine verlässliche Fallback-Kette (Booster-Pack → echtes Set-Logo aus der API → geratenes Logo → sauberer Platzhalter mit Icon) — nie wieder ein kaputtes Bild
- Das echte Logo aus der TCG-API (`set.images.logo`) wird jetzt direkt genutzt, statt die URL nur zu raten — deutlich mehr Sets zeigen ihr Logo

### Geändert
- **Set-Karten komplett neu gestaltet**: einheitliches Raster mit fester Logo-Fläche (alle Logos gleich groß, sauber zentriert, dezenter Zoom beim Hovern), klare Typo-Hierarchie und aufgeräumte Meta-Pillen für Erscheinungsdatum und Kartenzahl. Die Übersicht wirkt jetzt wie ein Katalog, nicht wie eine Liste

---

## [2.19.6] — 2026-07-20 · BUGFIX: Auto-Reel — FFmpeg-Binary fehlte im Bundle

### Behoben
- **Auto-Reel scheiterte mit `spawn .../ffmpeg-static/ffmpeg ENOENT`**. Ursache: Next.js hat die FFmpeg-Binary (aus `ffmpeg-static`) nicht ins serverlose Function-Bundle gepackt, weil sie nur über einen Laufzeit-Pfad geladen wird — im Bundle war sie schlicht nicht vorhanden
- **Fix**: Die Binary wird jetzt via `outputFileTracingIncludes` erzwungen mitgebündelt. Zusätzlich sorgt ein zentraler Helper (`ensureFfmpeg`) dafür, dass die Binary ausführbar ist — fehlt das Ausführbar-Bit auf dem read-only Bundle-Pfad, wird sie einmalig nach `/tmp` kopiert und dort ausführbar gemacht (verhindert den Folgefehler `EACCES`)
- Betrifft beide Video-Routen: Auto-Reel (`/api/video/auto-reel`) und den manuellen Reel-Schnitt (`/api/video/process`)

---

## [2.19.5] — 2026-07-20 · Diagnose: echte FFmpeg-Fehlerursache sichtbar

### Behoben / Diagnose
- Der Auto-Reel zeigte weiter „internal_error", weil die eigentliche FFmpeg-Ursache im stderr steckt — der bisher verworfen wurde. Jetzt wird der stderr eingefangen und die konkrete Meldung angezeigt (Studio ist passwortgeschützt). Damit lässt sich der Reel-Fehler jetzt exakt einordnen.

---

## [2.19.4] — 2026-07-20 · BUGFIX: Auto-Reel-Generierung (Schriftart fehlte)

### Behoben
- **Auto-Reel-Generierung im Studio schlug mit „internal_error" fehl**. Ursache: FFmpeg braucht für die Texteinblendungen (Titel, Kartenname, Preis, Trend) eine Schriftdatei — und Vercels serverlose Umgebung hat keine System-Schriftarten. Jede Texteinblendung scheiterte, das Rendering brach ab
- **Fix**: Eine frei lizenzierte Schriftart (Liberation Sans) wird jetzt mitgeliefert und in alle Texteinblendungen fest eingebunden — sowohl im Auto-Reel als auch im manuellen Reel-Schnitt
- Die Fehlermeldung im Studio zeigt bei Problemen jetzt die echte Ursache statt eines generischen Hinweises (der Endpunkt ist passwortgeschützt)

---

## [2.19.3] — 2026-07-19 · UI: Einsteiger-Banner & Karten-Detailseite aufgeräumt

### Behoben
- **Einsteiger-Banner auf der Startseite** überlappte mit dem Dashboard (Negativabstand) — jetzt sauber eingepasst

### Geändert
- **Karten-Detailseite professioneller**: Die Funktion steht jetzt im Vordergrund. „Auf die Merkliste" ist die primäre Aktion (klarer Button ganz oben), die Kauf-Links (Cardmarket, Amazon) sind zu dezenten, kleineren Sekundär-Buttons zusammengefasst — die Seite wirkt wie ein Werkzeug, nicht wie eine Verkaufsseite

---

## [2.19.2] — 2026-07-19 · Preis-Transparenz: passt jetzt zu Cardmarket

### Neu
- **Cardmarket-Preisaufschlüsselung auf jeder Kartenseite** — genau wie im Original: Preis-Trend (Marktwert), Günstigstes Angebot (ab), Ø Verkaufspreis, Ø 30 Tage. Damit gibt es keinen Widerspruch mehr: Wer auf Cardmarket „ab 8,95 €" sieht, findet dieselbe Zahl auch bei uns — sauber eingeordnet neben dem Marktwert
- **Datenstand sichtbar**: Jede Karte zeigt, von wann die Cardmarket-Daten stammen. Bei älteren Daten (>45 Tage) ein klarer Hinweis, aktuelle Preise direkt auf Cardmarket zu prüfen

### Behoben
- **Ausreißer-Schutz**: Ein einzelnes Fake-/Ausreißer-Listing (z.B. ein absurder Tagespreis) verzerrt weder den angezeigten Preis noch den Verlauf mehr — der „Ø gestern"-Wert wird nur übernommen, wenn er plausibel ist

### Hinweis zur Preisquelle
Die Preise stammen aus der öffentlichen Pokémon-TCG-Datenbank (Cardmarket-Daten). Der angezeigte Marktpreis ist der Cardmarket-Trend (fairer Marktwert bei gutem Zustand) — nicht das billigste Einzelangebot, das oft schlechteren Zustand oder eine andere Sprache betrifft. Tagesaktuelle, sprachspezifische Live-Preise sind mit eigenen Cardmarket-API-Zugängen möglich.

---

## [2.19.1] — 2026-07-19 · Preise: saubere, echte Verläufe (kein „linear" mehr)

### Behoben
- **Preisverläufe sahen oft künstlich linear aus**: Die Kurve wurde aus wenigen Cardmarket-Eckwerten linear interpoliert (30 gerade Zwischenpunkte), und die Chart-Achse ignorierte die echten Datumsabstände — dadurch wirkten alle Verläufe wie gerade Linien
- **Fix — nur noch echte Daten**:
  - Der Chart nutzt jetzt eine echte Zeit-Achse: die Abstände sind proportional zur tatsächlichen Zeit (ein Monat ist breiter als ein Tag)
  - Der Verlauf besteht aus echten Punkten: täglich gespeicherte Preise + echte Cardmarket-Durchschnitte (Ø 30 / 7 / 1 Tage & Trend) — keine erfundenen Zwischenwerte mehr
  - Echte Tagespreise werden jetzt bei jedem Kartenaufruf gespeichert — der Verlauf jeder angesehenen Karte wird Tag für Tag genauer
  - Die synthetische Beispiel-/Zufallskurve wurde komplett entfernt. Liegen zu wenige echte Datenpunkte vor, zeigt die Karte nur den aktuellen Preis mit dem Hinweis, dass der Verlauf aufgebaut wird
- Trend-Prozentwert richtet sich nach den echten Daten (aus den Tagespreisen, wenn vorhanden)
- Kleiner Darstellungsfehler behoben (heller Chart-Raster auf dunklem Grund)

---

## [2.19.0] — 2026-07-19 · Einsteiger-Seite & Einsteiger-Freundlichkeit

### Neu
- **Neue Einsteiger-Seite `/einsteiger`**: Ein freundlicher Startpunkt ohne Trading-Jargon — „Was sind deine Pokémon-Karten wert?" mit großer Suche, 3-Schritte-Onboarding (Wert prüfen → Grundlagen lernen → Sammlung im Blick), kuratierte ikonische Karten (Glurak, Pikachu, Nachtara VMAX u.a. — alle API-verifiziert) und die Einsteiger-Guides
- **„Neu hier?"-Einstieg auf der Startseite**: dezenter Banner über dem Markt-Dashboard, der Neulinge abholt, ohne Fortgeschrittene zu stören
- **Einstieg überall verlinkt**: NavBar (erster Punkt), Footer und Sitemap

### Warum
Die Startseite wirkt mit Marktindex und Trend-Charts auf reine Einsteiger schnell wie „nur für Investoren". Die neue Seite gibt ihnen einen einladenden, verständlichen Weg hinein — passend zum Level-Mix aus v2.18.0.

---

## [2.18.1] — 2026-07-19 · Social-Sharing: dynamische Vorschaubilder (OG-Images)

### Neu
- **Dynamische Vorschaubilder für geteilte Links** (Open Graph / Twitter): Wird ein Link auf WhatsApp, Discord, X oder Facebook geteilt, erscheint jetzt ein attraktives Vorschaubild statt nacktem Text
  - **Karten**: Kartenmotiv + Name + aktueller Marktpreis
  - **Artikel**: Titel + Leitkarte + Level-Badge
  - **Startseite**: Branding + Claim
- Automatisch in die Meta-Tags verdrahtet — jeder geteilte Link (auch aus den Auto-Reels) sieht ab jetzt hochwertig aus

---

## [2.18.0] — 2026-07-19 · Content-System: professioneller, moderner, mit Einsteiger-Mix

### Neu
- **Modernes bild-reiches Artikel-Layout**: Jeder Artikel öffnet mit einem Hero-Bild der Leitkarte (großes Kartenmotiv mit Farbschimmer und leichter Neigung) — visuell einladend statt reiner Textwüste
- **Einsteiger/Profi-Mix sichtbar**: Jeder Artikel trägt ein Level (Einstieg / Fortgeschritten / Profi) als farbigen Badge — in der Übersicht und auf der Detailseite. So finden auch Neulinge sofort passende Beiträge
- **„Weiterlesen"-Sektion**: Am Ende jedes Artikels führen verwandte Beiträge weiter — natürliche Verknüpfung zwischen den Inhalten, gut für Verweildauer und SEO

### Geändert
- **Autoren-Upgrade der Text-Erstellung**: Die Generierung schreibt jetzt als professioneller Content-Creator — starker Einstieg (Hook), klarer Bezug zur aktuellen Marktlage, Neulinge werden abgeholt ohne Fortgeschrittene zu langweilen, roter Faden von Anfang bis Ende
- **Kontinuität**: Bei der Erstellung fließen die Titel der letzten Beiträge ein — thematisch passende Artikel können natürlich aneinander anknüpfen (kein Zwang)
- Schreibstil-Anleitung (`/schreibstil`) um einen Content-Creator-Teil erweitert (Hook, Relevanz, Einsteiger-Mix, Anknüpfen, bildhafte Darstellung)

---

## [2.17.3] — 2026-07-19 · Artikel-Caching robuster + neutralere Außendarstellung

### Behoben
- **Artikel wurden bei jedem Aufruf neu erzeugt, wenn die Generierung auf den Vorlagen-Text zurückfiel** (statt der KI-Fassung). Ursache: Fallback-Artikel wurden nicht gespeichert. Jetzt wird jeder Artikel nach der ersten Erzeugung dauerhaft in Supabase abgelegt — jede Datumsseite wird nur EINMAL erzeugt, danach sofort aus dem Speicher bedient (kein Ladebildschirm mehr für Folgebesucher)

### Geändert
- **Neutralere Außendarstellung**: Der Ladehinweis nennt keine „erste Generierung" mehr; auf Artikel- und Marktbericht-Seiten wurden „KI-/automatisch generiert"-Formulierungen durch sachliche Begriffe ersetzt (Marktanalyse, Marktbericht). Die rechtlichen Hinweise (keine Anlageberatung, Markenhinweis, Preise ohne Gewähr) bleiben unverändert erhalten

---

## [2.17.2] — 2026-07-19 · BUGFIX: Startseite ohne Trends/Marktdaten

### Behoben
- **Startseite zeigte keine Trends/Mover mehr** (leere Gewinner-/Verlierer-Listen). Ursache: Fällt der TCG-API-Abruf beim Generieren der Seite aus (Rate-Limit/Timeout — z.B. während eines Deploys), wurde die leere Seite per ISR bis zu 1 Stunde gecacht
- **Fix**: Neue robuste Datenquelle `getHomepageCards()` — bei leerem/fehlgeschlagenem Live-Abruf greift ein Fallback auf den letzten in Supabase gespeicherten Marktbericht (echte Karten mit Bild + Trend, vom Wochen-Cron befüllt). Lieber leicht ältere echte Daten als eine leere Startseite
- Regel in CLAUDE.md verankert (Stolperstelle 19)

---

## [2.17.1] — 2026-07-19 · BUGFIX: Kartenbilder luden nicht (Proxy ≠ next/image)

### Behoben
- **Kartenbilder blieben leer (grauer Platzhalter)** — auf der Karten-Detailseite, im Such-Dropdown und im Artikel-Highlight. Ursache: Der in v2.15.0 eingeführte Bild-Proxy (`/api/img`) wurde auch bei `next/image`-Komponenten eingesetzt, aber der Next-Image-Optimizer lehnt lokale Proxy-URLs mit verschachteltem Query mit HTTP 400 ab
- **Fix**: `cachedImg()` (Proxy) nur noch bei einfachen `<img>`-Tags; `next/image`-Komponenten laden wieder die rohe Upstream-URL (in `remotePatterns`, Optimizer-Cache 31 Tage). Der Proxy bleibt für alle `<img>`-Stellen aktiv (Robustheit gegen API-Ausfälle)
- Regel in CLAUDE.md verankert (Stolperstelle 18)

---

## [2.17.0] — 2026-07-19 · Auto-Reel: Social-Media-Videos direkt aus Marktdaten

### Neu
- **Auto-Reel-Generator** (`/studio` → Reels-Tab): Ein Klick rendert ohne jedes Videomaterial ein fertiges Hochformat-Reel (1080×1920) aus den Live-Marktdaten — Intro mit Branding, ein Segment pro Top-Mover-Karte (Kartenbild mit sanftem Zoom, Name, Preis, Wochen-Trend), Outro mit Call-to-Action zur Website
- **Reichweiten-Rückkanal**: Jede automatisch erzeugte Caption endet mit dem Website-Link inkl. UTM-Parametern (`utm_source=instagram&utm_medium=reel`) — Social-Traffic wird in Vercel Analytics messbar dem Kanal zugeordnet
- **Ein-Klick-Workflow**: Generieren → Vorschau → Caption bearbeiten → Herunterladen oder direkt auf Instagram posten (nutzt die bestehende Instagram-Graph-API-Route). Ohne Instagram-Keys: Download-Weg mit Hinweis
- Reel-Rendering via FFmpeg (ffmpeg-static), Segmente einzeln gerendert und per concat-Demuxer verlustfrei zusammengefügt; Ergebnis landet in Supabase Storage unter `auto-reels/`

### Technik
- `src/lib/reel-generator.ts` — Rendering-Pipeline + Caption-Builder mit UTM-Link
- `src/app/api/video/auto-reel/route.ts` — Studio-authentifizierte Render-Route (maxDuration 300s)
- `src/components/AutoReelPanel.tsx` — Studio-Panel mit Vorschau, editierbarer Caption, Publish

---

## [2.16.0] — 2026-07-19 · SEO-Ausbau, Lucide-Icons statt Emojis, Kartenbild-Korrekturen

### Behoben
- **7 von 9 hardcodierten Karten-IDs zeigten falsche Karten** (per TCG-API verifiziert): „Charizard ex SIR (151)" zeigte Alakazam ex (3×), „Pikachu ex" zeigte Mew ex, „Pokéball Gold" eine Psycho-Energie, „Charizard V (Celebrations)" Palkia, „Charizard ex (Paldea Evolved)" Farigiraf — alle IDs korrigiert bzw. Einträge auf real existierende Karten umgestellt
- **Erfundene Karten aus Artikeln entfernt**: „Mewtu ex SIR", „Pikachu ex SIR" und „Evoli ex SIR" existieren im 151-Set nicht (die echten SIRs: Bisaflor, Glurak, Turtok, Simsala, Zapdos + 2 Trainer), „Shining Pikachu" existiert gar nicht (→ Shining Mew), „Oinkologne/Arcanine ex SIR (Paldea Evolved)" existieren nicht (→ Meowscarada ex SIR, Iono SIR)
- **SEO-Canonical-Bug**: Das Root-Layout deklarierte die Homepage als Canonical für ALLE Unterseiten — jetzt löst jede Seite auf ihre eigene URL auf

### Geändert
- **Emojis komplett entfernt — nur noch Lucide-Icons**: Content-Datenmodelle nutzen Icon-Keys mit zentraler `<ContentIcon>`-Komponente; Sentiment-Ampel, Empty-States, Monitoring, Bild-Fallbacks und alle Überschriften/Tips auf professionelle Icons umgestellt. Emoji-Verbot gilt jetzt in ALLEN Content-Feldern (Test + Laufzeit-Gate), Regel in CLAUDE.md verankert
- KI-Prompts (Artikel + Guides) verbieten Emojis explizit

### Neu
- **JSON-LD Article-Schema** auf Artikel- und Guide-Seiten (strukturierte Daten für Google)
- **Top-40-Karten in der Sitemap** — die wertvollsten Karten-Detailseiten als Such-Einstiege
- CLAUDE.md-Pflichtregel: Jede hardcodierte Karten-ID muss per TCG-API gegen den Text verifiziert werden

---

## [2.15.0] — 2026-07-18 · Bild-Robustheit: Caching-Proxy macht Bilder API-unabhängig

### Neu
- **Bild-Caching-Proxy `/api/img`**: Alle Kartenbilder, Set-Logos und Booster-Artworks laufen jetzt über einen eigenen Proxy. Vercels CDN cacht jede Antwort 30 Tage und bedient bei Ausfall der externen Bild-Hosts bis zu 1 Jahr aus dem Stale-Cache (`stale-if-error`) — ein einmal gesehenes Bild verschwindet praktisch nie wieder, auch wenn die TCG-API down oder rate-limitiert ist
- **`cachedImg()`-Helper** (`src/lib/cached-image.ts`): eine zentrale Stelle, die externe Bild-URLs auf den Proxy umschreibt — strikte Host-Allowlist (images.pokemontcg.io, assets.pokemon.com), kein offener Proxy

### Geändert
- Alle Bild-Konsumenten auf den Proxy umgestellt: Kartenbilder (CardImage), Booster-Packs (BoosterPackImage), Such-Vorschläge, Artikel-Galerie + Highlights, Guide-Karten, Portfolio (Zeilen, Suche, Edit-Modal), Merkliste, Startseiten-Listen
- `next/image`-Optimizer-Cache auf 31 Tage erhöht (`minimumCacheTTL`) — deutlich weniger Origin-Zugriffe auf externe Bild-Hosts

---

## [2.14.2] — 2026-07-18 · 404-Bug auf Karten-Seiten behoben (API-Fehler ≠ nicht gefunden)

### Behoben
- **Karten-Klicks führten zu 404, obwohl die Karten existieren**: `fetchCardById` behandelte JEDEN API-Fehler (Timeout, Rate-Limit) als "Karte existiert nicht" → `notFound()`. Durch das Build-Vorrendern (v2.12.0) wurden diese 404s bei API-Ausfällen während des Builds sogar fest ins CDN gebacken
- **Fix dreiteilig**: (1) `fetchCardById` gibt `null` nur noch bei echtem HTTP 404, transiente Fehler bekommen einen Retry und werden dann geworfen; (2) Karten- und Set-Seiten zeigen bei API-Fehlern eine "Daten gerade nicht erreichbar"-Seite mit Retry-Button statt 404; (3) Build-Vorrendern für Karten/Sets entfernt — On-Demand + ISR + Loading-Skeleton ist robuster
- Regel in CLAUDE.md verankert (Stolperstelle 16): API-Fehler niemals als notFound behandeln

---

## [2.14.1] — 2026-07-18 · Impressum & Datenschutz: rechtssicher mit echten Daten

### Geändert
- **Impressum** mit echten Betreiberdaten befüllt, auf § 5 DDG aktualisiert (löste 2024 das TMG ab), Haftungs-, Affiliate- und Markenhinweis ergänzt
- **Datenschutzerklärung komplett neu geschrieben** — beschreibt jetzt den echten Datenfluss: Vercel Hosting + cookieloses Web Analytics, technisch notwendige Speicherungen (Sprach-Cookie, Portfolio/Merkliste nur lokal im Browser), externe Kartenbilder, Affiliate-Links, Betroffenenrechte inkl. zuständiger Aufsichtsbehörde (LfDI BW)
- Veraltete Abschnitte entfernt (Newsletter existiert nicht mehr, "keine Analysedienste" stimmte seit Vercel Analytics nicht mehr)

---

## [2.14.0] — 2026-07-18 · Phase 0: Vercel Analytics + globaler Site-Footer

### Neu
- **Vercel Analytics eingebaut** (`@vercel/analytics`): Ab jetzt werden Besucher, Seitenaufrufe und Referrer gemessen — die Grundlage für alle weiteren Produktentscheidungen. Aktivierung: im Vercel-Dashboard unter Projekt → Analytics einmal einschalten
- **Globaler Site-Footer** auf jeder Seite: Navigation in vier Gruppen (Markt / Wissen / Tools / Rechtliches), Marken-Block, Disclaimer-Zeile, Versionsnummer — bessere interne Verlinkung (SEO) und einheitlicher Seitenabschluss

### Geändert
- Duplizierte Impressum/Datenschutz-Link-Zeilen aus 7 Seiten-Footern entfernt — Legal-Links leben jetzt nur noch im globalen Footer; die inhaltsspezifischen Disclaimer-Boxen bleiben

---

## [2.13.0] — 2026-07-18 · Automatisierte Guide-Pipeline mit Qualitäts-Gate

### Neu
- **Guide-Generierung automatisiert**: Der Daily-Cron generiert dienstags + freitags den nächsten Evergreen-Guide aus einer kuratierten Themen-Warteschlange (12 Themen nach echter Sammler-Such-Intention: Karten verkaufen, Sammlung bewerten, Erstauflage erkennen, PSA vs. CGC, Zustandsstufen, japanische Karten, Eltern-Guide u.a.)
- **Hartes Qualitäts-Gate**: Jeder generierte Guide läuft durch dieselben Regeln wie die Build-Tests (keine Preiszahlen, keine Kaufempfehlungen, keine Ich-Form, keine KI-Floskeln, kein Emoji im Fließtext). Verstoß = Guide wird NICHT gespeichert
- **Geteilte Regel-Quelle** (`content-rules.ts`): Build-Tests und Laufzeit-Gate nutzen exakt dieselben Regexe — keine Drift möglich
- `/guides` + Sitemap führen statische und generierte Guides zusammen; Supabase-Tabelle `generated_guides`
- 10 neue Tests (109 gesamt)

### Hinweis
- Einmalig in Supabase anzulegen: Tabelle `generated_guides` (SQL in CLAUDE.md)

---

## [2.12.0] — 2026-07-18 · Vorrendern + Bild-Shimmer: keine Erstbesucher-Wartezeit mehr

### Neu
- **Build-Vorrendern statt On-Demand**: Die 12 neuesten Set-Seiten und die Top-20-Karten (die von der Startseite verlinkten) werden beim Deploy fertig gebaut — kein Besucher wartet mehr auf den ersten Server-Render, die Seiten kommen direkt aus dem CDN. Ältere Karten/Sets rendern weiterhin on-demand und werden dann gecacht
- **Bild-Shimmer**: Kartenbilder haben jetzt einen grau leuchtenden, animierten Platzhalter, bis das Bild geladen ist — dann blendet es weich ein (CardGrid, Karten-Detailseite). Kein hartes Aufpoppen mehr
- Lade-Skeletons nutzen denselben Shimmer-Effekt — durchgängiger Look

---

## [2.11.1] — 2026-07-18 · Performance & Feedback: kein "totes" Klicken mehr

### Behoben
- **Sofortiges Feedback bei jeder Navigation**: Beim Klick auf eine Karte, ein Set oder einen Artikel passierte sichtbar nichts, bis der Server fertig gerendert hatte (TCG-API bis 8s, Artikel-Generierung länger) — die Seite wirkte eingefroren. Jetzt erscheint sofort ein Lade-Skeleton der Zielseite: globale Loading-Boundary für alle Routen + formgetreue Skeletons für Karten-Detail, Set-Seiten und Artikel (mit Hinweis bei Erstgenerierung)
- **Fehlende Timeouts in Suche & Karten-Detail**: `searchCards` und `fetchCardById` hatten als einzige TCG-Calls kein 8s-Timeout — eine zähe API konnte diese Seiten unbegrenzt blockieren
- **Tap-Feedback**: Karten-Kacheln und Startseiten-Zeilen reagieren jetzt sichtbar auf Druck (scale/Hintergrund), bevor die Navigation greift — wichtig auf Mobile

---

## [2.11.0] — 2026-07-17 · Portfolio-Chart auf Finance-App-Niveau (Trade-Republic-Pattern)

### Neu
- **Scrubbing mit Header-Kopplung**: Beim Ziehen über den Chart zeigt die große Zahl oben den Wert am Finger, darunter die Veränderung vom Zeitraum-Start bis zu diesem Punkt und das Datum — wie bei Trade Republic. Loslassen springt zurück auf den Live-Wert
- **Baseline-Referenzlinie**: Der Startwert des gewählten Zeitraums erscheint als gestrichelte Linie im Chart — die Kurve ist relativ dazu grün/rot
- **Scrub-Dimmen**: Beim Ziehen bleibt nur der Bereich links vom Finger farbig, der Rest dimmt ab — der betrachtete Zeitpunkt ist sofort erkennbar
- **Live-Punkt pulsiert** dezent am aktuellen Wert

### Geändert
- Tooltip-Kästchen entfernt — der Wert wandert in den Header, am Crosshair bleibt nur ein dezentes Datums-Label (aufgeräumter, mobile-freundlicher)
- Zeitraum-Wechsel setzt den Scrub-Zustand zurück

---

## [2.10.1] — 2026-07-17 · Portfolio-Chart: lückenlose Tagesserie statt Sprung-Kurve

### Behoben
- **Einbrüche in der Performance-Kurve**: Karten trugen nur an Tagen mit eigenem History-Punkt zum Portfoliowert bei — an allen anderen Tagen fehlte ihr Wert in der Summe, die Kurve sackte ab und sprang wieder hoch. Jetzt lückenlose Tagesserie mit Carry-Forward: Jede Karte zählt an jedem Besitztag mit ihrem letzten bekannten Preis
- **Kurvenende = Kopfzahl**: Der letzte Chart-Punkt nutzt jetzt den Live-Preis — die Kurve endet exakt auf dem oben angezeigten Gesamtwert (vorher: gestriger History-Wert, Endpunkt und Anzeige wichen ab)
- **Zeitraum-Filter nach echten Tagen**: "1W" filtert jetzt nach Datum statt nach den letzten 7 Datenpunkten (bei lückenhaften Daten zeigte "1W" sonst Monate)
- Serie auf 365 Tage begrenzt, mindestens 2 Punkte fürs Rendering, 12 Chart-Tests angepasst/ergänzt

---

## [2.10.0] — 2026-07-17 · Merkliste + Bild-Text-Kopplung in Artikeln

### Neu
- **Merkliste `/merkliste`**: Karten beobachten ohne Login — auf jeder Karten-Detailseite gibt es jetzt „Auf die Merkliste". Die Liste zeigt den aktuellen Preis und die Veränderung (absolut + Prozent) seit dem Vormerk-Zeitpunkt. Lokal gespeichert (localStorage), Live-Preise mit Fehler-Hinweis bei API-Ausfall
- **NavBar**: „Merkliste"-Link (Desktop)

### Behoben
- **Kartenbilder passen jetzt immer zum Text**: Artikel zeigten teils Karten, die im Text gar nicht vorkamen (Text über Glurak, Bild von Pikachu). Ursache: Die Galerie wurde mit beliebigen Trending-Karten aufgefüllt. Jetzt erscheint eine Karte nur noch, wenn ihr Name (deutsch ODER englisch — Glurak/Charizard) im Artikeltext steht. Auffüll-Logik komplett entfernt, mit Regressions-Tests
- **Statische Artikel**: zwei Highlight-Boxen ohne Textbezug angeglichen (Karte im Text ergänzt bzw. Box entfernt)

---

## [2.9.0] — 2026-07-17 · Set-Landingpages: SEO-Einstiege für jedes TCG-Set

### Neu
- **`/sets`** — Übersicht der 24 aktuellsten Pokémon-TCG-Sets mit Boosterpack-Bild, Serie, Erscheinungsdatum und Kartenanzahl (ISR 24h)
- **`/sets/[setCode]`** — Landingpage pro Set: alle handelbaren Karten nach Marktwert sortiert (CardGrid), Boosterpack-Hero, Gesamtwert, Kauf-Button (Affiliate-Pattern mit Env-Fallback), JSON-LD ItemList, Canonical-URL
- **NavBar**: "Sets"-Link (Desktop)
- **Sitemap**: alle Set-Seiten enthalten — jede ist ein Google-Einstieg für "[Setname] Karten Preise"

### Sicherheit/Robustheit
- **`isValidSetCode()`**: Set-Codes aus der URL werden validiert, bevor sie in die TCG-Query interpoliert werden (Lucene-Injection-Schutz) — mit Tests
- **`fetchCardsBySet` + `fetchRecentSets`**: 8s-Timeout ergänzt

---

## [2.8.1] — 2026-07-17 · Schreibstil-System: Texte klingen menschlich, nicht nach KI

### Neu
- **Schreibstil-Anleitung** (`.claude/commands/schreibstil.md`, Skill `/schreibstil`): 12 verbotene KI-Muster mit Vorher/Nachher-Beispielen (Floskel-Opener, aufgeblasene Adjektive, Meta-Kommentare, Symmetrie-Zwang, gleichförmiger Satzrhythmus u.a.) + Faktendichte-Test + Commit-Checkliste
- **`STYLE_RULES` im KI-Prompt**: Jeder Artikel-Generierungs-Prompt bekommt die Stilregeln in Kurzform — direkter Fakteneinstieg, variierende Satzlängen, keine Füllsätze, keine verbotenen Adjektive
- **KI-Floskel-Blockliste im Compliance-Test**: „atemberaubend", „hier ein Überblick", „Fazit:", „zusammenfassend" etc. + Emoji-Verbot im Fließtext — Verstöße lassen `npm test` fehlschlagen

### Geändert
- **CLAUDE.md**: Schreibstil-Sektion mit den 8 wichtigsten Verboten verankert
- **Fallback-Artikel**: zwei „Hier ein Überblick"-Floskeln durch direkte Fakteneinstiege ersetzt (vom neuen Test gefunden)

---

## [2.8.0] — 2026-07-17 · Inhaltlicher Komplett-Review: Wahrheitspflicht & Neutralität erzwungen

### Geändert (Content — absolute Priorität)
- **`static-articles.ts` komplett bereinigt**: Alle hardcodierten Preiszahlen aus Fließtext und keyPoints entfernt, erfundene Markt-Events gestrichen (u.a. eine fiktive Wochen-Preisbewegung, "Jahreshoch"-Behauptungen, erfundene Social-Media-Spikes), alle impliziten Kaufempfehlungen neutralisiert ("beste Kaufchance", "zahlt morgen mehr als heute")
- **10 unerreichbare statische Artikel gelöscht**: Artikel auf Mo/Di/Mi/Fr/Sa-Daten waren seit der So/Do-Regel tote 404-Inhalte
- **`fallbackArticle` bereinigt**: Budget-Aufteilungs-Ratschläge (60/30/10), Renditeversprechen ("100–200 % in 3–5 Jahren"), erfundene Druckraten (1:120) und fiktive Preisverläufe entfernt — jetzt reine Marktstruktur-Analyse
- **`guides.ts` bereinigt**: "Wer 3–5 Jahre wartet, hat fast immer Gewinn gemacht" und ähnliche Renditeversprechen entfernt, Kauf-Timing-Tipps neutralisiert, Preiszahlen durch qualitative Formulierungen ersetzt, Investment-Framing zu Marktwissen-Framing
- **KI-Prompt gehärtet**: `CONTENT_RULES` werden jedem Generierungs-Prompt vorangestellt — Zahlen nur aus gelieferten Daten, keine erfundenen Events/Druckraten/Illustratoren, keine Anlageberatung, keine Ich-Form, nur echte Quellen-URLs

### Neu
- **Compliance-Test-Suite** (`content-compliance.test.ts`): erzwingt maschinell — keine Preiszahlen im Fließtext, keine Ich-Form, kein Persona-Name, kein Kaufempfehlungs-Vokabular, statische Artikel nur an So/Do, isStatic-Pflicht. Verstöße lassen `npm test` fehlschlagen

### Geändert (Design & Usability)
- **`/changelog`, `/impressum`, `/datenschutz`**: von Light auf das Dark-Design-System umgestellt
- **Studio, Monitoring, ReelsStudio**: Admin-Bereich ebenfalls vollständig auf Dark-Tokens
- **PriceChart/PortfolioChart-Tooltips + AffiliateBar**: auf Design-Tokens vereinheitlicht
- **Tote Komponenten gelöscht**: MoverList, MarketSummary, NewsletterSignup (nirgends mehr verwendet)
- **Artikel-Hinweistext korrigiert**: "täglich um 08:00 Uhr" → "sonntags und donnerstags" (stimmte seit der So/Do-Regel nicht mehr)

---

## [2.7.3] — 2026-06-28 · Technisches Aufräumen: Crons, Sitemap, ISR

### Behoben
- **Verwaiste Cron-Jobs entfernt**: `weekly-article` (Mittwoch) generierte Artikel mit unerreichbarem Datum (kein Publish-Tag → 404); `weekly-recap` (Montag) war redundant zum Daily-Cron. Beide Routen + vercel.json-Einträge entfernt — Artikelgenerierung läuft jetzt sauber nur über den Daily-Cron (So/Do) + selbstheilende Seite

### Geändert
- **Sitemap erweitert**: Enthält jetzt Guides, Artikel (Publish-Daten + gespeicherte), Marktbericht-Archiv und alle Wochenberichte — bessere Crawlbarkeit der wertvollsten Seiten
- **Karten-Detailseite auf ISR (1h)**: Statt bei jedem Request neu zu rendern — reduziert TCG-API-Last (429-Risiko) und redundante Preis-Snapshots (höchstens 1×/h pro Karte)
- **STATUS.md aktualisiert**: „Was gebaut ist" auf echten Stand (v2.7.2) gebracht, Versions-Log ergänzt, Env-Tabelle korrigiert

---

## [2.7.2] — 2026-06-28 · Suche: keine leeren Karten ohne Bild/Preis mehr

### Behoben
- **Leere Platzhalter-Karten in Suche & Ergebnissen**: Unveröffentlichte/Preview-Karten aus der TCG-Datenbank (künftige Sets ohne Bild und Preis, z.B. „Ascended Heroes") werden zentral herausgefiltert — angezeigt werden nur handelbare Karten mit echtem Marktpreis und Bild
- Filter sitzt an einer einzigen Stelle (`mapAndFilter` / `isDisplayableCard`) und wirkt auf Suche, Suggestions, Trending, Set- und Top-Value-Listen gleichzeitig
- **Such-Dropdown auf Dark Mode umgestellt**: war noch weiß (Bloomberg/TradingView-Design jetzt durchgängig)

### Geändert
- `displayPrice()`-Helper als Single Source für den UI-Marktpreis (entfernt duplizierte Preis-Logik an 5 Stellen)
- 8 neue Tests (73 gesamt)

---

## [2.7.1] — 2026-06-28 · Artikel-Generierung: Selbstheilung + 404-Fix

### Behoben
- **404 auf der heutigen Artikel-Seite vor 12:00 UTC**: Der Future-Guard verglich das mit `T12:00:00` geparste Datum gegen `now` — vor Mittag (UTC) lag „heute" damit in der Zukunft → fälschlich 404. Jetzt reiner Datums-String-Vergleich (timezone-konsistent)
- **„Artikel noch nicht verfügbar" trotz Publish-Day**: `/artikel/[date]` generiert den Artikel jetzt on-demand, wenn der Cron ihn (noch) nicht erzeugt hat — die Seite ist selbstheilend und liefert auch ohne erfolgreichen Cron Inhalt (mit Fallback-Artikel selbst ohne API-Key)
- **Cron revalidiert jetzt auch die Detailseite**: Nach Generierung wird `/artikel/[date]` revalidiert (nicht nur das Listing) — keine 24h-stehenbleibende Leer-Version mehr
- **Publish-Day-Check vereinheitlicht**: `getArticleType(today)` ist Single Source of Truth — kein Auseinanderlaufen von Wochentag-Check und Artikeltyp an Zeitzonen-Grenzen

---

## [2.7.0] — 2026-06-24 · Code-Review: Sicherheit, Robustheit & Architektur

### Behoben (Sicherheit)
- **Timing-safe Auth**: Session-Token-Vergleich nutzt jetzt `crypto.timingSafeEqual` statt `===` (verhindert Timing-Oracle)
- **Fail-closed in Production**: Fehlt `STUDIO_PASSWORD` in Prod, ist der Zugang gesperrt statt offen (Dev bleibt offen)
- **Keine Fehler-Leaks**: API-Error-Responses geben keine Stacktraces/internen Details mehr zurück (nur `internal_error` + Server-Log)
- **Such-Sanitisierung**: Lucene/TCG-Query-Metazeichen werden aus Nutzereingaben entfernt (Query-Injection verhindert)

### Behoben (Robustheit)
- **Median statt Minimum**: Cardmarket-Preise nutzen jetzt den Median — ein einzelnes Fake-/Cent-Listing verfälscht nicht mehr den Portfoliowert
- **Fetch-Timeouts**: Externe TCG/Cardmarket-Abrufe in der Preis-Route haben jetzt 8s-Timeout (kein Hängen bis Vercel-Hardlimit)
- **Model-ID per Env**: Anthropic-Model über `ANTHROPIC_MODEL` überschreibbar (zentral, kein verstreuter String)

### Behoben (Portfolio-Frontend)
- **Sprachwechsel lädt Preise neu**: `useEffect` reagiert jetzt auf alle preisrelevanten Felder (fetchKey statt `.length`) — kein stale-data mehr beim Edit
- **Fehler-Hinweis bei Preisabruf**: Schlägt der Live-Preis-Abruf fehl, sieht der Nutzer einen Hinweis statt stiller Kaufpreise
- **LangPicker dark**: Inaktive Sprach-Buttons nutzen jetzt Dark-Tokens (vorher hellgrau auf dunklem Grund)
- **Trend-Farbe vereinheitlicht**: Sparkline-Rot auf `#fb7185` angeglichen (Design-System-Token)

### Geändert
- **CLAUDE.md**: Neue Sektion "Code-Qualität & Architektur-Regeln" mit 10 verbindlichen Regeln + Commit-Checkliste
- **Neuer `/code-review`-Skill**: Strukturiertes Review entlang der projektspezifischen Regeln
- **Tests**: 6 neue Median-Tests (65 gesamt)

---

## [2.6.2] — 2026-06-24 · Portfolio: P&L an Zeitraum gekoppelt

### Neu
- **P&L-Anzeige gekoppelt**: Die Gewinn/Verlust-Zahlen oben folgen jetzt dem gewählten Zeitraum (1D / 1W / 1M / 3M / 1Y)
- Wechsel von 1M auf 1D → oben steht z. B. "+5,20 € (+1,1%) · 1 Tag · Start 465,52 €"
- Bei unzureichenden Verlaufsdaten (nur 1 Datenpunkt): Fallback auf "seit Kauf"
- Linienfarbe des Charts passt sich ebenfalls dem gewählten Zeitraum an

---

## [2.6.1] — 2026-06-24 · Portfolio Dark Mode + Preis-Bug-Fix

### Geändert
- **Portfolio `/portfolio`**: Vollständig auf Bloomberg/TradingView-Dark-Palette umgestellt (`#0a0a0f`, `#13131e`, Violet-Akzente)
- **LangPicker**: Aktiver Button jetzt `violet`, nicht mehr schwarz
- **AddCardModal + EditCardModal**: Dunkler Modal-Hintergrund (`bg-[#13131e]`), dunkle Inputs, CTA-Button Violet
- **ResetDialog**: Dunkler Hintergrund, `rose`-Farben

### Behoben
- **Kaufpreis darf nicht negativ werden**: `onChange` strippt führendes Minuszeichen — iOS/Android können in `type="number"` trotz `min={0}` Minuswerte eingeben; das ist jetzt blockiert

---

## [2.6.0] — 2026-06-23 · Einheitliches Dark Mode Design auf allen Seiten

### Geändert
- **Global Dark Mode**: Bloomberg/TradingView-Design-System auf alle Seiten und Komponenten ausgerollt
- **NavBar**: Dunkle Variante (`#0d0d18`, Violet-Akzente), Disclaimer-Bar oben, aktive Links `text-violet-400`
- **CardGrid**: Dunkle Karten-Panels (`bg-[#13131e]`, `border-[#2a2a3a]`), Hover `border-violet-500/30`
- **SearchResultsLang**: Dunkle Texte und Alert-Boxen
- **ArticleCardGallery**: Dunkle Panels, Recharts-Tooltip angepasst
- **CardLangPrice**: Dunkle Preisdarstellung, `text-white` für Hauptpreis
- **Suche (`/suche`)**: Vollständig dunkel, violette Akzentfarbe im Header
- **Suche Loading Skeleton**: Dunkel mit passenden Skeleton-Farben
- **Artikel-Index (`/artikel`)**: Dunkel, heute-Karte mit Violet-Gradient
- **Artikel-Detail (`/artikel/[date]`)**: Dunkel, Archiv-Disclaimer amber, Key-Points violet
- **Karten-Detail (`/karten/[id]`)**: Dunkel + NavBar ergänzt (fehlte vorher)
- **Guides-Index (`/guides`)**: Dunkel, Featured-Guide mit Violet-Gradient
- **Guide-Detail (`/guides/[slug]`)**: Dunkel, COLOR-Map entfernt, Tip-Boxen violet
- **Marktbericht (`/marktbericht`)**: Dunkel, Statistik-Panels, Archiv-Liste
- **Marktbericht-Detail (`/marktbericht/[week]`)**: Dunkel
- **Marktbericht-Archiv (`/marktbericht/archiv`)**: Dunkel, KW-Badge violet
- **CLAUDE.md**: Design-Token-Tabelle, Code-Patterns und Verbotsliste dauerhaft verankert

---

## [2.5.4] — 2026-06-23 · Newsletter global deaktiviert

### Entfernt
- **Newsletter-Anmeldeformular** komplett von allen Nutzer-sichtbaren Seiten entfernt
- `src/app/guides/[slug]/page.tsx`: `<section id="newsletter">` mit `<NewsletterSignup />` entfernt
- `src/app/marktbericht/page.tsx`: Newsletter-Sektion entfernt
- `src/app/marktbericht/[week]/page.tsx`: Newsletter-Sektion entfernt
- Entsprechende `import`-Zeilen (`NewsletterSignup`, ungenutzter `Suspense`) bereinigt

---

## [2.5.3] — 2026-06-23 · Datenintegrität: Guides + Fallback-Preise + CLAUDE.md-Absicherung

### Geändert
- **`guides.ts`**: Erfundene "2003 für 5€ → 1.000€"-Behauptung durch qualitative Formulierung ersetzt
- **`guides.ts`**: Spezifische "300€ / 80€"-Preisangabe durch qualitative Beschreibung ersetzt
- **`article-generator.ts` fallbackArticle**: Hardcodierte "80–90€", "120–150€", "250–350€" aus Fließtext entfernt
- **`static-articles.ts`**: Unverifizierten Illustratoren-Attribution (Mitsuhiro Arita für Umbreon VMAX) entfernt
- **`CLAUDE.md`**: 6 neue absolute Verbote in "Content-Wahrheitspflicht" verankert — mit Begründung, Beispielen, Checkliste

---

## [2.5.2] — 2026-06-23 · Datenintegrität: Archiv-Disclaimer, Persona-Bereinigung

### Neu
- **Archiv-Disclaimer Banner** auf allen statischen/Fallback-Artikeln — gelber Hinweis "Archiv-Beitrag: Preisangaben können veraltet sein"
- **`isStatic` Flag** auf `Article`-Interface — kennzeichnet statische und Fallback-Artikel für UI-Differenzierung

### Geändert
- **Persona-Bereinigung** in allen statischen Artikeln — alle "Ich"-Formulierungen entfernt (CLAUDE.md-Regel: kein Persona-Name, keine Ich-Perspektive)
- **Erfundene Preistrajektorie entfernt** — Umbreon VMAX Alt Art Artikel (2026-06-09): spezifisch erfundene Zahlenreihe 80→58→75→95→100-115→120-140€ durch qualitative Beschreibung ersetzt
- **Unverifizierten Anspruch entfernt** — Shining Pikachu "neue Höchstpreise über 200€ für PSA-10" war unbelegt → durch allgemeine Marktbeobachtung ersetzt
- **Kaufempfehlungs-Titel bereinigt** — "Jetzt kaufen, was andere übersehen" → neutrale Formulierung
- **"Ich nenne den Namen nicht"** → neutrale Formulierung ohne Persona
- **Fallback-Artikel** (ohne API-Key) ebenfalls als `isStatic: true` markiert + Preis-Hardcodes entfernt

---

## [2.5.1] — 2026-06-23 · Sprachauswahl für Kartenpreise (Suche + Karten-Detail)

### Neu
- **Sprachauswahl EN/DE/JP/KR** in der Suche (`/suche`) — Sprachpicker erscheint bei Suchergebnissen, bei Umschaltung werden Cardmarket-Preise für die gewählte Kartensprache geladen
- **Sprachauswahl EN/DE/JP/KR** auf der Karten-Detailseite (`/karten/[id]`) — Picker über dem Preis, Preis wird live per API aktualisiert
- **Preisbeschriftung DE/JP/KR** im Kartengitter — kleines Sprach-Badge neben dem Preis wenn nicht EN
- **Fallback-Hinweis** wenn Cardmarket OAuth nicht konfiguriert ist — erklärt welche Env-Vars fehlen
- **Erfolgshinweis** wenn sprachspezifische Preise geladen wurden

### Infrastruktur (bereits vorhanden, jetzt sichtbar genutzt)
- `cardmarket-api.ts` → `fetchCMLanguagePrice(cardName, language)` — Cardmarket OAuth 1.0
- `/api/portfolio/prices` → POST-Endpoint mit `{id, language, name}` pro Karte, liefert `priceLanguage` zurück
- `CardLanguage` type in `portfolio.ts` — `'EN' | 'DE' | 'JP' | 'KR'`

---

## [2.5.0] — 2026-06-23 · Startseite Redesign: Bloomberg/TradingView-Style Dark Mode

### Neu
- **Komplett neues Homepage-Design** im Bloomberg Terminal / TradingView / CoinMarketCap Stil
- **Dark Mode als Standard** (`bg-[#0a0a0f]`/`#13131e`) — schwarz-anthrazit Hintergrund auf der Startseite
- **Hero-Bereich** neu: "Pokémon Kartenmarkt in Echtzeit" Headline mit violettem Akzent + Search-Bar
- **Ticker Strip** — horizontaler Scroll mit echten Echtzeit-Preisen und Trends aller Top-Mover
- **4 KPI-Karten:** PMI (gewichteter Marktindex), Marktbreite (% im Plus), Marktstimmung (Bullish/Neutral/Bearish), Fear & Greed Index (0-100)
- **Fear & Greed Meter** — visueller Gradient-Balken aus echten Breadth- und Momentum-Daten
- **Inline SVG Sparklines** — serverseitig gerenderte Mini-Charts (grün/rot) in Gewinner/Verlierer-Listen
- **Top Gewinner & Verlierer** — zwei Spalten mit Kartenbild, Sparkline, Preis, 30T-Trend
- **Trending Karten Tabelle** — CoinMarketCap-Stil: Rang, Bild, Name, Set, Seltenheit, Preis, 30T%
- **Investor Insights** — 4 automatisch generierte Datenpunkte aus echten API-Daten (kein erfundener Content)
- **Top Sets Tabelle** — aggregiert nach Set-Code: Ø Preis, Ø Trend, Anzahl Karten
- **Alle Metriken aus echten Cardmarket-Daten** — PMI, Breadth, F&G sind abgeleitet, nicht erfunden

### Geändert
- Startseite vollständig neugestaltet — alle früheren Sektionen ersetzt durch neues Dark-Mode-Design
- Blog-Teaser aktualisiert auf korrekten Publish-Plan (Sonntags/Donnerstags statt täglich)
- Guides-Teaser zeigt jetzt alle 4 Guides (vorher 2)
- Footer-Farben angepasst für Dark Mode (amber-Disclaimer mit reduzierter Opazität)
- Changelog-Link im Footer ergänzt

---

## [2.4.5] — 2026-06-23 · Blog: Nur Sonntags + Donnerstags, 404-Fix, Newsletter entfernt

### Geändert
- **Blog-Veröffentlichungsplan:** Artikel erscheinen nur noch an Sonntag (Wochenrückblick) und Donnerstag (rotierender Artikel: Markt / Karte im Fokus / Strategie / Set-Analyse / Ausblick / Guide)
- **Blog-Listing `/artikel`:** Zeigt nur noch So/Do-Einträge — kein täglicher Content mehr
- **Blog-Header:** Text geändert von "Täglich neuer KI-Content" auf "Sonntags + Donnerstags"
- **"Heute neu"-Badge:** Erscheint nur noch wenn heute tatsächlich ein Publish-Day (So/Do) ist
- **Cron:** Artikel werden nur noch an So/Do generiert — an anderen Tagen übersprungen

### Behoben
- **404-Fix:** `/artikel/[date]` gibt jetzt echten 404 wenn Datum kein Sonntag oder Donnerstag ist — kein "Artikel nicht verfügbar"-Zombie-State mehr
- **Newsletter entfernt** aus der Artikel-Detailseite (war noch vorhanden, jetzt weg)

### Verankert
- `CLAUDE.md` enthält jetzt die Pflicht-Regel: Blog nur So/Do — nie ohne explizite Freigabe ändern

---

## [2.4.4] — 2026-06-23 · Startseite: Error-Box entfernt, Newsletter deaktiviert

### Behoben
- **Error-Box dauerhaft entfernt:** Die gelbe "Kartendaten nicht verfügbar"-Box wird nie mehr angezeigt — bei API-Ausfall zeigt die Startseite einfach weniger (kein Karten-Bereich), aber läuft weiter
- **Graceful Degradation:** Alle Karten-Sektionen waren schon bedingt (`cards.length > 0`) — der `error`-State war unnötig und irreführend (der API-Key ist gesetzt; die Box erschien bei Timeouts/Rate-Limiting)

### Entfernt
- **Newsletter-Sektion** auf der Startseite ausgeblendet — `NewsletterSignup` und `Suspense`-Import entfernt (Funktion ist vorbereitet, aber noch nicht aktiviert)

---

## [2.4.3] — 2026-06-23 · BUGFIX: iOS-Zoom unterdrückt, Mobile-Layout kompakter

### Behoben
- **iOS-Zoom-Bug behoben:** Alle `<input>`-Felder in beiden Modals jetzt `font-size: 16px` auf Mobile — iOS Safari zoomt nicht mehr automatisch rein wenn ein Textfeld angetippt wird
- **Delete-Button auf Mobile versteckt:** `hidden sm:block` — war `opacity-0 shrink-0`, also unsichtbar aber trotzdem ~30px breit → hat die Holdings-Zeile gequetscht
- **Metadaten-Zeile mit `truncate`** gesichert — bei langen Kaufpreisen + Datum kein Überlauf mehr

---

## [2.4.2] — 2026-06-23 · BUGFIX: Mobile Modals vollständig — Vollbild-Overlay, safe-area, kein dvh mehr

### Behoben
- **AddCardModal + EditCardModal:** Bottom-Sheet-Architektur durch Vollbild-Overlay ersetzt — kein `dvh`/`vh` mehr, kein Header der bei offener Tastatur aus dem Viewport fliegt
- **EditCardModal:** Gleiche mobile Architektur wie AddCardModal — `absolute inset-0 flex flex-col`, Desktop `sm:static sm:rounded-3xl`
- **Header:** `env(safe-area-inset-top)` via `paddingTop: 'max(1.25rem, ...)'` für iPhone Notch / Dynamic Island
- **Drag-Handle entfernt:** Kein Wisch-Indikator mehr, der bei Vollbild-Overlay keinen Sinn ergibt
- **Safe-area-bottom:** `max(24px, env(safe-area-inset-bottom))` Spacer am Ende beider Modals

---

## [2.4.1] — 2026-06-22 · BUGFIX: Mobile Suche — Nested Scroll entfernt, Sticky Search, bessere Touch-Targets

### Behoben
- Mobile: Nested-Scroll-Problem entfernt — Vorschlagsliste hatte eigenes `overflow-y-auto` innerhalb des Modal-Scrolls → führte auf iOS zu Scrollsperren und ruckeligem Verhalten
- Mobile: `-mx-1` negative Margin auf Vorschlagsliste entfernt → verhinderte horizontales Clipping auf schmalen Screens
- Modal-Body: `overflow-x-hidden` + `WebkitOverflowScrolling: touch` für iOS-Momentum-Scroll
- Suchfeld jetzt `sticky top-0` im Modal → bleibt beim Scrollen der Ergebnisse sichtbar
- Vorschlag-Buttons: `min-height: 60px`, `rounded-md` Thumbnail-Container, `px-3` Innenabstand
- Preis-Spalte: `min-w-[56px]` damit sie bei langen Kartennamen nicht gequetscht wird
- Kartennamen in Vorschlägen: 2-zeilig (max) statt hard truncate — voller Name lesbar auf Mobile
- Formularfelder bei ausgewählter Karte: eigener `px-5 pt-2 pb-5`-Block nach dem Scroll-Bereich

### Neu
- Leerstand-States mit erklärendem Untertext ("Versuche einen anderen Suchbegriff")
- CLAUDE.md: Pflicht-Kommunikation nach Deploy (Changelog-Summary + GitHub-SHA-Bestätigung) fest verankert

---

## [2.4.0] — 2026-06-22 · Portfolio Premium-UI: Clean-Look, Segmented Control, Badges

### Neu
- Segmented-Control-Pills für Zeitraum (1D/1W/1M/3M/1Y) — iOS-Stil mit weißem aktiven Pill auf grauem Track
- Sprach-Badge `[EN]` als kleines, dezentes Chip-Element in der Positions-Liste (kein Emoji + Freitext mehr)
- Karten-Thumbnails mit `rounded-md overflow-hidden`-Container — einheitliches Seitenverhältnis

### Geändert
- Farbpalette: Violett vollständig entfernt — einheitliches Farbkonzept: Grau-900 als primäre Akzentfarbe, Grün/Rot nur für finanzielle Daten
- Chart: Y-Achsen-Labels entfernt (shortEur max/min) — cleaner, moderner Look ohne ablenkende Overlay-Texte
- Chart: Linienstärke auf 2px reduziert, Gradient-Opacity auf 0.18 — subtiler, professioneller
- Hero-Bereich: Mehr vertikales Breathing-Room für den Haupt-Portfoliowert (46px Schrift, mehr mb)
- P&L-Zeile: Ohne TrendingUp/Down-Icon — reine Zahlen wie bei Trade Republic
- `+ Karte`-Button → `+ Position` als dunkles Pill (`bg-gray-900 rounded-full`)
- Positionen-Beschriftung: `1× · 64,76 € · 22.06.26` als kompakte, lesbare Metadaten-Zeile
- Alle Formular-Labels: `uppercase tracking-wider` für einheitliches Premium-Formular-Styling
- Focus-States: `focus:border-gray-900 focus:ring-1 focus:ring-gray-200` statt Violett
- Modal-Karten-Preview: `bg-gray-50` statt `bg-violet-50`
- LangPicker-Aktiv-State: `bg-gray-900 text-white border-gray-900` statt Violett

---

## [2.3.0] — 2026-06-22 · Chart-Redesign (Custom SVG), Mobile-Modal-Fix, Portfolio-Tests

### Neu
- Custom SVG Chart (`src/components/PortfolioChart.tsx`) — kein Recharts, cubic-bezier-Linie, Gradient-Fill, Dot am letzten Punkt, Mouse+Touch-Crosshair, Tooltip-Flip
- `src/lib/portfolio.ts` — alle Portfolio-Business-Logic als pure Functions (kein React, keine Server-Deps, vollständig testbar)
- 59 Vitest-Tests (`src/__tests__/portfolio.test.ts`) — `normalizeHolding`, `livePriceOf`, `computePnl`, `computeChartData` (inkl. injizierbares `today`), `filterByRange`, `formatEur`, `shortEur`, `setCodeFromId`
- Portfolio-Modal: `dvh`-Viewport-Einheit für Keyboard-bewusste Modal-Höhe auf Mobile (`min(85dvh, calc(100vh - 32px))`)
- Suchfeld im Modal: `type="search"`, `enterKeyHint="search"`, `autoComplete="off"`, `autoCorrect="off"`, `spellCheck={false}`
- Touch-Targets für Suchergebnis-Buttons: `minHeight: 56px` (>44px Apple-HIG)

### Geändert
- Recharts vollständig entfernt — Performance und Bundle-Größe verbessert
- `overscroll-contain` auf Modal-Scroll-Bereichen — verhindert Scroll-Kette auf iOS
- Preisfeld: `inputMode="decimal"` — zeigt Nummern-Tastatur auf Mobile
- `active:`-Tailwind-States für haptisches Feedback auf Touch

### Behoben
- Mobile: Modal wurde vom Keyboard überdeckt (dvh-Fix)
- Mobile: Suchfeld zeigte keine korrekten Ergebnisse durch fehlende Input-Attribute

---

## [2.2.0] — 2026-06-22 · Sprachspezifische Preise: EN / DE / JP / KR

### Neu
- Cardmarket OAuth 1.0 API-Client (`src/lib/cardmarket-api.ts`) — liefert sprachspezifische Marktpreise (Median EX+) für EN, DE, JP, KR
- Sprachauswahl beim Hinzufügen und Bearbeiten jeder Karte (4 Flaggen-Buttons: 🇬🇧 EN · 🇩🇪 DE · 🇯🇵 JP · 🇰🇷 KR)
- Sprach-Flag-Badge auf jedem Karten-Bild in der Holdings-Liste
- Sprachname in der Karten-Infozeile (z.B. „3× · à 45,00 € · 15.06.26 · Japanisch")
- `/api/portfolio/prices` akzeptiert jetzt `{ cards: [{id, language, name}] }` — ruft bei EN Cardmarket EUR (wie bisher), bei DE/JP/KR echten Cardmarket-Preis für diese Sprache
- Graceful Fallback: ohne `CARDMARKET_*` Env-Variablen weiter Cardmarket EUR für EN-Karten
- Bestehende localStorage-Daten werden auf `language: 'EN'` normalisiert (rückwärtskompatibel)

### Geändert
- `PortfolioHolding` Interface: neues Pflichtfeld `language: CardLanguage`
- Portfolio Price API: Legacy `{ cardIds }` Format weiterhin unterstützt (rückwärtskompatibel)

---

## [2.1.7] — 2026-06-22 · Portfolio-Chart: sofortige Anzeige, keine Animation

### Behoben
- Chart-Animation deaktiviert (`isAnimationActive={false}`) — reagiert jetzt sofort statt 1–2 Sek. Verzögerung bei jedem Update
- Chart zeigt sofort eine flache Linie (Kaufpreis-Fallback) bevor die API antwortet — kein leerer Zustand mehr
- `RANGE_DAYS` aus der Render-Funktion verschoben (Modul-Konstante) — kein unnötiges Neu-Erstellen bei jedem Render

---

## [2.1.6] — 2026-06-22 · Bugfix: Versionsnummer im Footer

### Behoben
- Footer zeigte keine Version — `NEXT_PUBLIC_APP_VERSION` (nicht gesetzt) ersetzt durch `npm_package_version` (von npm beim Build automatisch gesetzt)

---

## [2.1.5] — 2026-06-22 · Portfolio: NavBar + Suche 20 Ergebnisse

### Neu
- NavBar im Portfolio auf allen Zuständen (Empty-State + Hauptseite) — Nutzer nicht mehr eingeschlossen
- Suche im Karte-hinzufügen-Modal zeigt jetzt bis zu 20 Ergebnisse (vorher 6)
- Ergebniszähler „X Karten gefunden" über der Liste
- Suggestions-Liste scrollbar (max-h-72) — alle Ergebnisse erreichbar ohne Modal zu vergrößern

### Behoben
- `searchCards(q, 6)` in `/api/search/suggestions` → `searchCards(q, 20)`

---

## [2.1.4] — 2026-06-22 · Lückenlose Release-Dokumentation

### Neu
- `CHANGELOG.md`: vollständige Historie v0.1.0 → v2.1.3
- `/changelog`-Seite: alle 20 Versionen mit `fixed`-Badge (Wrench-Icon, orange)
- `CLAUDE.md`: Release-Notes-Pflicht als eigener Abschnitt — 3 Dateien müssen synchron sein

---

## [2.1.3] — 2026-06-22 · Portfolio: Edit-Modal, Chart-Fix, Y-Achse, Zeitbereiche

### Neu
- Karten-Edit via Klick auf die Zeile → `EditCardModal` (Anzahl, Kaufpreis, Kaufdatum editierbar; "Karte entfernen" im Modal)
- Y-Achse mit €-Werten im Gesamtchart (auto-skaliert, 4 Ticks; ≥1000 als `1.2k`)
- 5 Zeitbereiche: 1D · 1W · 1M · 3M · 1Y (immer sichtbar, nicht nur wenn Chart-Daten vorliegen)

### Geändert
- Inline-Qty-Controls aus Holdings-Zeile entfernt; zeigt kompakt `3× · à 45,00 € · 15.06.26`
- Trash-Button in der Zeile stoppt Event-Propagation (öffnet kein Modal mehr)

### Behoben
- Chart startete 30 Tage in der Vergangenheit — Preishistorie zählt jetzt erst ab `purchaseDate`

---

## [2.1.2] — 2026-06-22 · Portfolio: Reset-Button mit Bestätigungs-Dialog

### Neu
- Trash-Icon neben Add-Button öffnet Confirmation-Modal mit Positionsanzahl und Warnung
- `resetPortfolio()` leert localStorage + State; Klick auf Backdrop schließt ohne Aktion

---

## [2.1.1] — 2026-06-22 · Portfolio: Kaufdatum

### Neu
- Pflichtfeld „Kaufdatum" im Karte-hinzufügen-Modal (default: heute, max: heute)
- `purchaseDate` in `PortfolioHolding` gespeichert und in der Positions-Liste angezeigt

---

## [2.1.0] — 2026-06-22 · Portfolio-Tracker (Finance-App-Style)

### Neu
- **`/portfolio`** — localStorage-basierter Karten-Portfolio-Tracker ohne Login
- Finance-App-UI: großer Gesamtwert, grün/rot P&L, Recharts AreaChart mit dynamischem Gradient
- Zeitraumauswahl 1W / 1M — Chart aggregiert Cardmarket-Preishistorie aller Positionen
- Positionen-Liste sortiert nach Wert, jede Zeile: Karten-Thumbnail + BoosterPackImage + Qty-Controls + P&L
- Karte-hinzufügen-Modal: Suche (debounced 320ms), Quantity, Kaufpreis, Gesamteinstand-Vorschau
- Duplikat-Erkennung: zweite Zugabe erhöht Menge statt doppelten Eintrag
- **`/api/portfolio/prices`** — Batch-Preisabruf via `Promise.allSettled` (TCG API, 5min Cache)
- NavBar: „Portfolio"-Link (Desktop + Mobile) mit BarChart3-Icon

---

## [2.0.1] — 2026-06-22 · Reels: Video-Preview + Custom Cut-Position

### Neu
- Lokales Video-Preview sofort nach Datei-Auswahl (`URL.createObjectURL`, kein Upload nötig)
- Trim-Schritt: vollständige Wiedergabe des Originalvideos zum Scrubben
- „Aktuelle Position übernehmen" — liest `videoRef.currentTime` → befüllt Start-Zeitfeld (mm:ss Anzeige)
- Manuelles Start-Zeit-Eingabefeld (Sekunden)

### Geändert
- FFmpeg: Pre-Input-Seek (`-ss {start}`) + `-t {duration}` wenn startTime gesetzt; Fallback auf `-sseof` (von Ende)
- Description-Feld in den Trim-Schritt verschoben

---

## [2.0.0] — 2026-06-22 · Instagram Reels Pipeline

### Neu
- **`/api/video/upload-url`** — signierte Supabase Upload-URL (umgeht Vercel 4MB Body-Limit)
- **`/api/video/process`** — FFmpeg: letzte N Sekunden schneiden, 9:16-Crop, Branding-Overlay, Caption via Claude Haiku
- **`/api/video/publish-instagram`** — 3-Schritt Meta Graph API: Container erstellen → Polling → Publish
- **`ReelsStudio`** — Upload → Fortschritt → Trim-Slider → Verarbeiten → Vorschau + Caption-Edit → Instagram-Publish
- Studio: Tab „Reels ⚡" mit ReelsStudio-Komponente

---

## [0.9.6] — 2026-06-21 · Server-Auth via HttpOnly-Cookie

### Neu
- **`/api/studio-auth`** — POST setzt HttpOnly-Cookie (SHA-256 von `STUDIO_PASSWORD`), DELETE löscht es
- **`/api/monitoring`** + **`/api/status`** — prüfen `studio_session`-Cookie serverseitig, 401 wenn fehlt
- **`/monitoring`** — eigene Seite (mobil-freundlich) mit gleichem Auth-Gate wie /studio

### Geändert
- Cookie: 7 Tage Laufzeit, `HttpOnly`, `Secure` (Prod), `SameSite=Strict`

---

## [0.9.5] — 2026-06-21 · Booster-Pack-Artwork + Blog-Listing

### Neu
- `BoosterPackImage`: lädt Produktbilder von `assets.pokemon.com` CDN; Fallback auf Set-Logo
- Blog-Listing zeigt echte Artikel-Titel statt generischer Typenbezeichnungen

---

## [0.9.4] — 2026-06-21 · Studio: Skills & Workflows

### Neu
- Monitoring-Seite: „Skills & Workflows"-Tab liest automatisch `.claude/commands/` aus

---

## [0.9.3] — 2026-06-21 · Booster-Set-Logo unter allen Karten

### Neu
- `BoosterPackImage` unter Karten in Artikeln und Guides (CLAUDE.md-Pflicht umgesetzt)

---

## [0.9.2] — 2026-06-21 · ArticleCardGallery + Guide-Kartenbilder

### Neu
- `ArticleCardGallery`: Recharts-Preischart in Artikel-Karten-Sektionen

### Behoben
- Guide-Karten zeigen echte Bilder statt 🃏-Emoji-Placeholder

---

## [0.9.1] — 2026-06-21 · NavBar-Hotfix

### Behoben
- Bottom-Tab-Bar entfernt (zerstörte Layout auf Mobil) — zurück zur Single-Top-Bar

---

## [0.9.0] — 2026-06-21 · Blog-Fallback-Artikel

### Neu
- Fallback-Artikel mit echtem Marktanalyse-Inhalt (kein Persona-Name, keine Kaufempfehlungen, Quellen-Links)

---

## [0.8.0] — 2026-06-21 · Artikel-Bilder + Booster-Set-Logos in Guides

### Neu
- `FeaturedCards`-Komponente: echte Karten-Thumbnails in Artikel-Sektionen
- `ArticleGallery`: Bild-Galeriesektion in Artikeln
- Booster-Set-Logos in Guide-Karten (via `BoosterPackImage`)

---

## [0.5.3] — 2026-06-21 · CSS-Fix + Homepage Static/ISR

### Behoben
- `<head>`-Tag aus `layout.tsx` entfernt (Next.js injiziert CSS selbst — zweites `<head>` blockiert das)
- Homepage wieder `○ Static` / ISR — `cookies()` aus Server-Component entfernt, Sprachumschaltung nur im Client

### Geändert
- Alle externen Bilder via `next/image` mit `remotePatterns` in `next.config.ts` konfiguriert

---

## [0.5.2] — 2026-06-21 · BUGFIX: Style-Verlust durch JSON-Import

### Behoben
- `import x from './package.json'` in `next.config.ts` crashte Vercels Turbopack-Build → kein CSS
- Fix: `process.env.npm_package_version` (npm setzt das bei jedem Build automatisch)

---

## [0.5.1] — 2026-06-21 · Dokumentation

### Neu
- `CLAUDE.md` — dauerhaftes Arbeitsgedächtnis für Claude Code (Deploy-Prozess, Regeln, Architektur)
- `STATUS.md` — Projektlogbuch mit offenen Aufgaben und Versionshistorie

---

## [0.5.0] — 2026-06-21 · i18n, Autocomplete, SEO

### Neu
- i18n DE/EN via `lang`-Cookie — NavBar-Umschalter
- Suche-Autocomplete: `/api/search/suggestions` mit debounce 320ms + Loading-Spinner
- Loading-Skeleton auf Suchergebnisseite
- SEO: JSON-LD (Product+Offer auf Karten-Detail, ItemList auf Suche), Sitemap, robots.txt, OpenGraph
- Version im Footer aus `process.env.npm_package_version`

---

## [0.4.0] — 2026-06-20 · Marktbericht & Blog

### Neu
- **`/marktbericht`** — Wöchentliche KI-Marktanalyse (ISR 7 Tage), Hero mit KW-Anzeige, AI-Bericht-Card, Stats-Streifen, CardGrid, AffiliateBar, Newsletter
- **`/artikel`** — Blog-Index der letzten 14 Tage; Featured-Card ("Heute neu") + 13 weitere als weiße Cards
- **`/artikel/[date]`** — Tagesbasierte ISR-Artikel (24h Cache); 7 Typen je Wochentag
- **`src/lib/article-generator.ts`** — KI-Artikel-Generator
- **`src/lib/newsletter-template.ts`** — `buildNewsletterHtml()`: tabellenbasiertes HTML-E-Mail-Template
- **`/api/cron/daily`** — Täglicher Cron-Job 08:00: Artikel vorwärmen & `/artikel` revalidieren
- Studio: Veröffentlichen-Button mit Live-Feedback

### Geändert
- `vercel.json` — Zweiter Cron `0 8 * * *` für tägliches Artikel-Vorwärmen
- NavBar: Marktbericht + Blog + Newsletter + Studio

---

## [0.3.0] — 2026-06-20 · Mobile & Studio-Überarbeitung

### Neu
- Studio: Schritt-für-Schritt Fortschrittsanzeige, Sekunden-Timer, localStorage-Persistenz, Kopieren/Löschen
- NavBar: Sticky mit Logo und Studio-Link
- AffiliateBar: Snap-Scroll auf Mobil
- NewsletterSignup: Perk-Liste & gelber CTA-Button

---

## [0.2.0] — 2026-06-20 · Rechtliches & Karten-Details

### Neu
- **`/impressum`** — Impressum (§ 5 TMG)
- **`/datenschutz`** — DSGVO-konforme Datenschutzerklärung
- **`/karten/[id]`** — Karten-Detailseite mit Investment-Score & Preis-Details
- `PriceChart`-Komponente — 30-Tage-Verlauf (Recharts AreaChart)

### Geändert
- `CardGrid`: Jede Karte verlinkt auf `/karten/[id]`
- Footer: Impressum/Datenschutz-Links

---

## [0.1.0] — 2026-06-20 · Erstveröffentlichung

### Neu
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, Vercel-Deployment
- **`/`** — Startseite: Karten-Preis-Grid, Investment-Scores, AffiliateBar, NewsletterSignup
- **`/studio`** — Content-Steuerzentrale: 5 Content-Typen, On-Demand-Generierung
- **`/api/cron`** — Wöchentliche Pipeline (Montag 07:00)
- Pokémon TCG API Integration
- Beehiiv Newsletter-System
- Remotion Video-Animationen (YouTube 16:9 + Shorts 9:16)
- Affiliate-Links: Cardmarket, Amazon, Trade Republic
