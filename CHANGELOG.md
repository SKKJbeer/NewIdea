# Changelog — PokéMarket Intelligence

Alle Versionen und Änderungen. Format: [Semantic Versioning](https://semver.org/lang/de/) — `MAJOR.MINOR.PATCH`

> Dieses Changelog wird bei jedem Deploy nach `main` aktualisiert.
> Die gleichen Informationen sind auch unter `/changelog` auf der Website sichtbar.

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
