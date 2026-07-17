# Schreibstil-Anleitung — PokéMarket Intelligence

Verbindliche Anleitung für ALLE Texte der Plattform (Artikel, Guides, Rückblicke, UI-Texte,
KI-Prompts). Ziel: Texte klingen wie von einem nüchternen Marktbeobachter geschrieben —
nicht wie KI-generierter Content. Nüchtern, faktendicht, mit eigenem Rhythmus.

**Warum das wichtig ist:** Leser erkennen KI-Klang sofort und springen ab. Eine Plattform,
deren Texte nach Template klingen, verliert Glaubwürdigkeit — egal wie gut die Daten sind.

---

## Teil 1 — Die 12 KI-Muster, die verboten sind

### 1. Floskel-Opener
**KI-Klang:** „In der heutigen Zeit...", „Tauchen wir ein in die Welt der...", „Hier ein Überblick zu..."
**Stattdessen:** Direkt mit dem Fakt oder der Beobachtung anfangen.
> ❌ „Hier ein Überblick zu den wichtigsten Entwicklungen."
> ✅ „Evolving Skies ist seit vier Jahren aus dem Druck. Die Alt Arts steigen trotzdem."

### 2. Aufgeblasene Adjektive
**Verboten:** atemberaubend, revolutionär, bahnbrechend, faszinierend, episch, unglaublich, spektakulär.
**Stattdessen:** Das konkrete Detail nennen, das den Eindruck erzeugt.
> ❌ „ein atemberaubendes Artwork"
> ✅ „ein vollflächiges Artwork mit schlafendem Trainer in Mondlandschaft — im TCG selten"

### 3. Meta-Kommentare über den eigenen Text
**KI-Klang:** „In diesem Artikel erfährst du...", „Zusammenfassend lässt sich sagen...", „Fazit:"
**Stattdessen:** Einfach weglassen. Der Text spricht für sich.

### 4. Symmetrie-Zwang
KI produziert immer drei gleichlange Punkte, drei gleichförmige Absätze, parallele Satzanfänge.
**Stattdessen:** Ungleichgewicht zulassen. Ein wichtiger Punkt darf 4 Sätze bekommen, ein
Nebenpunkt einen halben. Zwei Beispiele sind ok, fünf auch — nicht immer drei.

### 5. Gleichförmiger Satzrhythmus
KI-Sätze sind 15–25 Wörter lang, immer. Menschen variieren.
**Stattdessen:** Kurze Sätze einstreuen. Drei Wörter reichen manchmal. Dann wieder ein längerer
Satz, der einen Zusammenhang ausführt und Kontext liefert.

### 6. Doppelpunkt-Konstruktionen als Dauerstruktur
**KI-Klang:** „Das Ergebnis: ...", „Der Grund: ...", „Wichtig: ..." in jedem zweiten Absatz.
**Stattdessen:** Maximal eine solche Konstruktion pro Text. Sonst ausformulieren.

### 7. Gedankenstrich-Inflation
Ein „—" pro Absatz ist Stilmittel. Drei sind ein KI-Fingerabdruck.

### 8. „Nicht nur X, sondern auch Y"
Einmal pro Text maximal. KI nutzt es dreimal pro Abschnitt.

### 9. Rhetorische Fragen als Gliederung
**KI-Klang:** „Warum ist das so? Weil...", „Was bedeutet das für Sammler?"
**Stattdessen:** Höchstens eine rhetorische Frage pro Text — oder keine.

### 10. Zusammenfassungs-Schlusssätze
KI beendet jeden Absatz mit einer Wiederholung des Absatzinhalts („Das zeigt, wie wichtig X ist.").
**Stattdessen:** Absatz endet mit dem letzten Fakt. Punkt.

### 11. Emoji im Fließtext
Emojis nur als visuelle Anker in Überschriften und Tip-Boxen (bestehende Struktur).
Nie im Fließtext, nie mehrere pro Überschrift.

### 12. Generische Metaphern
**Verboten:** „Der Markt schläft nie", „Achterbahnfahrt der Preise", „Goldgräberstimmung".
**Stattdessen:** Beschreiben, was tatsächlich passiert ist.

---

## Teil 2 — Wie stattdessen schreiben (nüchtern + faktendicht)

### Der Faktendichte-Test
Jeder Satz muss mindestens eine dieser Fragen beantworten: **Was? Wann? Wie viel? Warum? Woher belegt?**
Ein Satz, der keine davon beantwortet, ist Füllmaterial — streichen.
> ❌ „Das 151-Set ist bei Sammlern äußerst beliebt und erfreut sich großer Nachfrage."
> ✅ „Das 151-Set enthält alle 151 Original-Pokémon aus Rot & Blau (1996) — als einziges modernes Set."

### Konkret schlägt generisch
Namen, Sets, Jahreszahlen, Mechanismen. Wo eine Zahl aus echten Daten verfügbar ist, die Zahl.
Wo nicht: den Mechanismus beschreiben, nie eine Zahl erfinden (→ Content-Wahrheitspflicht).

### Urteil beim Leser lassen
Der Text liefert Beobachtung und Einordnung. Nie Bewertung im Superlativ, nie Handlungsaufforderung.
> ❌ „Ein Pflichttermin für jeden Sammler."
> ✅ „Das Angebot auf Cardmarket sinkt seit Produktionsende."

### Einstiege, die funktionieren
1. **Mit dem stärksten Fakt:** „Evolving Skies wird seit 2022 nicht mehr gedruckt."
2. **Mit einer Beobachtung:** „Die Turniersaison verschiebt gerade die Nachfrage."
3. **Mit einem Kontrast:** „Alle reden über 151. Die Bewegung passiert woanders."
Nie mit einer Definition, nie mit einer Begrüßung, nie mit einem Panorama („Der Pokémon-Markt ist vielfältig").

### Sprachregeln
- **Aktiv statt Passiv:** „Der Cron speichert Preise" statt „Preise werden gespeichert"
- **Verben statt Substantivierungen:** „Preise steigen" statt „Preissteigerungen sind zu verzeichnen"
- **Deutsche Direktheit:** kurze Hauptsätze, wenig Schachtelung
- **Fachbegriffe beim ersten Auftreten in Klammern erklären** (bestehende Regel, bleibt)

---

## Teil 3 — Durchsetzung

1. **Maschinell:** `content-compliance.test.ts` enthält eine Floskel-Blockliste (atemberaubend,
   revolutionär, „hier ein überblick", „fazit:", „zusammenfassend" u.a.) + Emoji-Verbot im
   Fließtext. Verstoß = Test rot = kein Deploy.
2. **KI-Generierung:** `STYLE_RULES` in `src/lib/article-generator.ts` werden jedem Prompt
   vorangestellt — die KI bekommt diese Anleitung in Kurzform.
3. **Manuell vor jedem Content-Commit:**
   - [ ] Erster Satz = Fakt/Beobachtung/Kontrast, keine Floskel?
   - [ ] Jeder Satz besteht den Faktendichte-Test?
   - [ ] Satzlängen variieren (mindestens ein Satz unter 6 Wörtern)?
   - [ ] Max. 1 Doppelpunkt-Konstruktion, max. 1 rhetorische Frage, „—" sparsam?
   - [ ] Kein Absatz endet mit einer Selbst-Zusammenfassung?
   - [ ] Emojis nur in Überschriften/Tips?
