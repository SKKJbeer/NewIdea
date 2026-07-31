# CardBeacon — Design-System

Ein Kartenbild bringt vier bis sechs kräftige Farben mit, ein Foliendruck noch
mehr. Eine Oberfläche, die dagegen anhält, gewinnt nicht — sie wird laut.
Deshalb gilt hier eine Arbeitsteilung:

> **Die Karten liefern die Farbe. CardBeacon liefert die Struktur.**

Alles Weitere folgt daraus.

---

## 1. Der wichtigste Grundsatz: weniger Behälter

Die Vorgängerfassung löste jedes Layoutproblem mit einem weiteren abgerundeten
Rechteck. Das Ergebnis war eine Seite aus zwei Dutzend Kacheln, die alle gleich
wichtig aussahen — und damit keine.

**Regel:** Ein Abschnitt bekommt nur dann eine eigene Fläche, wenn er sich
inhaltlich von seiner Umgebung abheben muss. Rangfolge der Mittel:

1. **Typografie** (Größe, Gewicht, Farbe)
2. **Abstand**
3. **Linie** (`border-t`, 1 px)
4. **Fläche** — erst wenn 1–3 nicht reichen

Drei gleich aussehende Kennzahl-Kacheln nebeneinander sind verboten. Eine
gemeinsame Fläche mit typografischer Trennung sagt dasselbe und ordnet dabei.

---

## 2. Typografie

Es gibt drei Rollen, nicht zehn Größen.

| Rolle | Klassen | Verwendung |
|---|---|---|
| Kennzahl groß | `text-5xl sm:text-7xl font-semibold tabular-nums tracking-tight` | Der Indexwert. Genau EINE pro Seite. |
| Kennzahl | `text-2xl font-semibold tabular-nums` | Zweitrangige Werte |
| Datenzeile | `text-[13px] tabular-nums` | Tabellen, Listen |
| Abschnittsmarke | `text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500` | Über jedem Abschnitt |
| Fließtext | `text-sm leading-relaxed text-slate-400` | Erklärungen |
| Beiwerk | `text-[11px] text-slate-600` | Datenstand, Stichprobe |

**`tabular-nums` ist Pflicht bei jeder Zahl**, die untereinander steht. Ohne sie
springen die Ziffern und eine Spalte liest sich nicht mehr von oben nach unten.

**Keine `font-black`.** Das war die Schriftstärke der Vorgängerfassung und
sieht nach Werbung aus. `font-semibold` trägt eine Kennzahl auch.

---

## 3. Abstände

Vier Werte, mehr nicht: **4 · 8 · 16 · 32** (Tailwind `1 / 2 / 4 / 8`).
Abschnittsabstand: `py-12 sm:py-16`. Zwischen Datenzeilen: `py-2.5`.

---

## 4. Radien

| Element | Radius |
|---|---|
| Flächen, Panels | `rounded-none` — Kanten |
| Eingabefelder, Knöpfe | `rounded-md` (6 px) |
| Kartenbilder | `rounded-sm` |
| Alles andere | kein Radius |

Die Vorgängerfassung nutzte durchgehend `rounded-2xl`. Große Radien lassen
Datenflächen nach Werbebanner aussehen; ein Terminal hat Kanten.
**`rounded-full` ist ausschließlich für Punkte erlaubt**, nie für Beschriftungen
— Pillen-Badges sind ausdrücklich untersagt.

---

## 5. Flächen

| Ebene | Farbe | Verwendung |
|---|---|---|
| Seite | `#08080b` | Hintergrund |
| Erhöht | `#0e0e13` | Nur wo eine Abgrenzung nötig ist |
| Linie | `#1c1c24` | Trennlinien, Rahmen |
| Linie betont | `#2a2a35` | Tabellenkopf |

Kein Verlauf als Flächenfüllung. Kein Schlagschatten. Kein Leuchten.

---

## 6. Zahlenzustände

| Zustand | Farbe | Zeichen |
|---|---|---|
| Positiv | `text-emerald-400` | `+` |
| Negativ | `text-rose-400` | `−` |
| Neutral / unverändert | `text-slate-400` | `±` |
| Nicht gemessen | `text-slate-600` | `—` |

**Farbe darf nie das einzige Signal sein.** Jede gerichtete Zahl trägt ihr
Vorzeichen. Das ist keine reine Barrierefreiheitsfrage: Auf einem Telefon in der
Sonne ist Rot gegen Grün auf dunklem Grund kaum zu unterscheiden.

`—` bedeutet **nicht gemessen** und ist nie durch `0,0 %` zu ersetzen. Eine
fehlende Messung ist keine Nullbewegung.

---

## 7. Tabellen und Datenzeilen

Das Standardmuster für Kartenlisten, Set-Listen, Bewegungen:

```
Kopfzeile:  text-[10px] uppercase tracking-[0.18em] text-slate-600, border-b
Zeile:      grid, items-center, py-2.5, border-b border-[#1c1c24]/60
Hover:      bg-white/[0.02]
Bild:       h-9 w-7 object-contain (Miniatur, nicht Blickfang)
Zahl:       text-right tabular-nums
```

Keine Zeile bekommt eine eigene Fläche. Keine Zeile bekommt einen Rahmen.
Die Trennlinie reicht.

---

## 8. Diagramme

- Eine Linie, 1,5 px, keine Fläche darunter außer bei sehr flachen Kurven
- Kein Raster außer einer Nulllinie, wo sie fachlich etwas bedeutet
- Achsen sparsam beschriftet: erster und letzter Punkt genügen oft
- Farbe folgt der Richtung des Gesamtzeitraums (emerald/rose)
- Unter zwei echten Messpunkten: **kein Diagramm**, sondern ein Satz

---

## 9. Ladezustände

**Kein Balken am oberen Rand.** Weder als Ladeanzeige noch als Lesefortschritt.
Ein Balken oben sagt „irgendwo passiert etwas" — genau das, was niemand braucht.

Stattdessen: Ein Platzhalter **an der Stelle, an der die Daten erscheinen**, mit
**derselben Höhe** wie der fertige Inhalt.

| Bereich | Platzhalter |
|---|---|
| Index-Diagramm | Fläche in Diagrammhöhe |
| Bewegungen | Zeilen-Platzhalter |
| Set-Markt | Balken-Platzhalter |
| Kartenseite | Bild + Kennzahlblock |
| Suche | Ergebniszeilen |

---

## 10. Bewegung

Erlaubt: Zahlen zählen hoch, Diagramme bauen sich einmal auf, Platzhalter
pulsieren dezent, Zustandswechsel unter 150 ms.

Untersagt: Federanimationen, schwebende Flächen, dauerhafte Bewegung (Ticker),
Leuchteffekte, Verläufe als Blickfang.

Bei `prefers-reduced-motion` ist alles sofort sichtbar — kein Inhalt darf hinter
einer Animation verborgen bleiben.

---

## 11. Mobil

Die mobile Fassung wird eigens entworfen, nicht gestapelt.

- Datenzeilen statt Kacheln
- Zahlen rechtsbündig, Beschriftung links
- Tippziele mindestens 44 px
- Der Indexwert bleibt auch auf 375 px die größte Zahl der Seite
- Keine waagerecht scrollenden Bereiche außer bei breiten Tabellen, und dort
  mit sichtbarem Hinweis

---

## 13. Die Sammler-Ebene

**Grundsatz: Daten zuerst. Artwork respektiert.**

Die erste Fassung war fachlich richtig und emotional tot — ein dunkles Terminal
mit Zahlen, austauschbar mit jedem Krypto-Dashboard. Sammeln ist aber keine
Tabellenkalkulation. Der Ausgleich ist bewusst schief gewichtet:

| Fläche | Intelligenz | Sammler-Emotion |
|---|---|---|
| Marktübersicht | 80 % | 20 % |
| Set-Seiten | 65 % | 35 % |
| Kartenseite | 60 % | 40 % |
| Sammlung | 50 % | 50 % |
| Research | 95 % | 5 % |

**Farbe kommt aus der Karte, nie aus der Oberfläche.** Die Oberfläche bleibt
dunkel und zurückhaltend; sie stellt die Karte aus, statt mit ihr zu
konkurrieren. Es gibt keine Markenpalette in Pokémon-Gelb.

### Ambient-Ton (`src/lib/collector.ts`)

Abgeleitet aus dem **Energietyp** der Karte — einer veröffentlichten
Eigenschaft, die in der Kartendatenbank steht. Bewusst NICHT aus einer
Farbanalyse des Kartenbilds: Die wäre teuer (Bild laden, dekodieren, Pixel
mitteln), unzuverlässig (Folie liefert je nach Kompression andere Mittelwerte)
und nicht prüfbar. Ohne Typ greift der Markenton — dort zeigt CardBeacon sich
selbst, statt eine Eigenschaft zu erfinden.

Alle Töne liegen bei **≤ 8 % Deckkraft**. Der Unterschied zwischen Feuer und
Wasser soll auffallen, wenn man zwei Karten nacheinander öffnet, nicht beim
ersten Blick auf eine.

### Folienschimmer (`.foil` in `globals.css`)

Ein Lichtstreifen, der **einmal** über das Kartenbild läuft, wenn der Zeiger
darauf liegt. Er läuft auf **jedem** Kartenbild.

1. Nur auf Zeiger/Fokus, nie von allein — dauernde Bewegung ist ein Werbebanner
2. Weiß, ≤ 16 % Deckkraft — kein Regenbogen, kein Schein-3D
3. Komplett im `prefers-reduced-motion`-Block: Wer Bewegung abbestellt, verliert
   keine Information

Diese drei sind keine Geschmacksfrage: Ohne sie wird aus einem Zitat des
physischen Objekts ein Werbebanner.

**Zurückgenommen:** Ursprünglich lief der Schimmer nur auf Karten mit
Folien-Seltenheit, mit der Begründung, er sei sonst bloße Dekoration. Am
laufenden Produkt nahm das niemand als Auskunft wahr — es sah nur aus, als
flimmerten manche Zeilen und andere nicht. Eine Regel, die niemand als Regel
wahrnimmt, ordnet nichts; sie erzeugt Ungleichmäßigkeit.

### Hintergrund (`CollectorBackdrop`)

Abstrakte Höhenlinien plus zwei weiche Lichthöfe, rund 3 % Deckkraft, nur im
Seitenkopf. Über die ganze Seite gezogen wird daraus Tapete.

**Kein nachgezeichnetes Pokémon-Artwork, keine Kreatur-Umrisse, keine Pokébälle
als Dekoration.** Die Formensprache kommt von Energie und Folie. Das ist nicht
nur eine Rechtsfrage: Ein angedeuteter Kreatur-Umriss im Hintergrund wäre genau
die Fan-Seiten-Anmutung, die dieses Produkt nicht haben soll.

### Kartenformat

Sammelkarten messen 63 × 88 mm — `aspect-[63/88]`, **nie** `3/4` oder `2/3`. Im
falschen Rahmen steht links und rechts leere Fläche, und das Bild sieht aus wie
eine Datei-Vorschau statt wie ein Objekt.

---

## 14. Markttemperatur statt Angst und Gier

„Angst" und „Gier" beschreiben Gefühle. Gemessen werden drei Preisgrößen.
Aus Preisen auf Gefühle zu schließen ist eine Behauptung, die die Daten nicht
hergeben — und „Extreme Gier" klingt wie eine Handlungsaufforderung.

Die Skala heißt **Temperatur** und läuft **Kalt → Abkühlend → Ruhig →
Anziehend → Heiß**. Ihre Farben sind Blau → Grau → Orange, nie eine Ampel:
Ein ruhiger Markt ist nicht schlechter als ein heißer. **Grün und Rot bleiben
ausschließlich der Richtung von Preisen vorbehalten** — sonst bedeuten dieselben
zwei Farben auf einer Seite zweierlei.

Die Rechnung ist unverändert. Geändert hat sich, wie das Ergebnis heißt.


---

## 15. Zwei Arten von Seiten — und warum sie verschieden aussehen dürfen

In diesem Projekt standen zwei Regeln nebeneinander, die sich widersprachen:
DESIGN.md verbietet „Verlaufsflächen hinter Überschriften", CLAUDE.md verlangt
für Lese-Flächen einen Kopf **mit** Ambient-Glow. Beim Vereinheitlichen der
Seitenköpfe wurde das sichtbar. Die Auflösung ist keine Formsache, sondern
folgt der Aufgabe der jeweiligen Seite:

| | **Datenflächen** | **Lese-Flächen** |
|---|---|---|
| Beispiele | Markt, Sets, Suche, Portfolio, Merkliste, Methodik, Marktbericht | Artikel, Guides |
| Aufgabe | vergleichen, einordnen | lesen, verweilen |
| Kopf | linksbündig, Abschnittsmarke, keine Fläche, keine Farbhervorhebung | Ambient-Glow, Icon-Medaillon, größere Typografie |
| Warum | Jedes Gestaltungselement im Kopf konkurriert mit den Zahlen darunter | Ein nüchterner Kopf über 1.500 Wörtern liest sich wie ein Formular |

**Die Grenze verläuft nicht nach Geschmack, sondern nach der Frage: Steht unter
dem Kopf eine Tabelle oder ein Text?** Bei einer Tabelle gewinnt Zurückhaltung,
bei einem Text gewinnt Einladung.

Wer eine dieser Seiten anfasst, ändert also nicht „den Kopf", sondern den Kopf
**ihrer Art**. Ein Artikel-Kopf im Datenflächen-Muster wäre genauso falsch wie
ein Leuchtfleck über der Marktübersicht.

**Ausgenommen:** `/changelog` ist eine Entwicklerhistorie mit `noindex` und
folgt keiner der beiden Regeln — dort ist die Form gleichgültig.

---

## 12. Was diese Oberfläche NICHT sein soll

Vor jedem neuen Bauteil eine Frage: **Könnte ein Bildschirmfoto davon für ein
beliebiges anderes Kartentool gehalten werden?**

Wenn ja, ist es noch nicht fertig. Konkret vermieden:

- Reihen identischer Kennzahl-Kacheln mit Symbol, Titel und Zahl
- Große abgerundete Suchfelder als Blickfang der Startseite
- Verlaufsflächen hinter Überschriften
- Pillen-Beschriftungen für alles
- Karten-Raster als Standardantwort auf jede Liste
- Dashboards, deren Abschnitte alle gleich wichtig aussehen
