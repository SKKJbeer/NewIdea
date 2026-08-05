# Projekt-Status — PokéMarket Intelligence

**Version:** `v6.0.2` · **Stand:** 5. August 2026 · **Branch:** `main`

Diese Datei ist unser gemeinsames Logbuch: Was ist entschieden, was ist gebaut, was ist offen.

> Versionsverlauf: siehe [CHANGELOG.md](./CHANGELOG.md) · Live auf der Website: `/changelog`

---

## Was gebaut ist (Stand v5.1.0)

| Bereich | Status | Details |
|---|---|---|
| Startseite `/` | ✅ Fertig | Bloomberg/TradingView Dark Mode, PMI, Fear & Greed, Sparklines, Ticker · ISR 1h |
| Suche `/suche` | ✅ Fertig | Karten UND Sets, nach Passgenauigkeit sortiert, Autocomplete (140 ms Wartezeit, laufende Abfragen abgebrochen, hoechstens 8 Zeilen mit Deckel, Tastaturbedienung), zentrale Filterung leerer Preview-Karten |
| Marktbericht `/marktbericht` | ⚠️ Nachziehen | v2.23.0 behebt Erzeugung + entfernt Platzhalter. Seit KW 26 kein echter Bericht — per `POST /api/market-report/generate` sofort erzeugen |
| Blog-Index `/artikel` | ✅ Fertig | Nur So/Do, echte Artikel-Titel, Teaser-Texte, ISR 1h |
| Artikel-Erzeugung | ⚠️ Nachziehen | v2.22.0 behebt die Ursache (Token-Limit). Bestehende 8 Beiträge sind noch Fallbacks — per `POST /api/articles/generate` neu erzeugen |
| Tagesartikel `/artikel/[date]` | ✅ Fertig | Selbstheilend (on-demand-Generierung), ISR 24h, KI + Fallback, 404-Fix |
| Karten-Detail `/karten/[id]` | ✅ Fertig | Preis (EUR), Score, Preis-Chart, JSON-LD SEO, ISR 1h |
| Guides `/guides` | ✅ Fertig | 4 Guides, echte Kartenbilder + Booster-Pack-Artwork |
| Content Studio `/studio` | ✅ Fertig | HttpOnly-Cookie-Auth (timing-safe, fail-closed), 3 Tabs |
| Monitoring `/monitoring` | ✅ Fertig | Eigene Seite (mobil-freundlich), Auth-geschützt |
| Portfolio `/portfolio` | ✅ Fertig | Finance-App-Style, localStorage, SVG-Chart, Live-Preise, P&L an Zeitraum gekoppelt, EN/DE/JP/KR |
| Reels Studio | ✅ Funktioniert | Auto-Reel lokal verifiziert (1080x1920, 23s, echte Marktdaten). Instagram-Auto-Publish wartet auf INSTAGRAM_ACCESS_TOKEN |
| Sicherheit | ✅ Durchgesehen | v2.35.0: 9 Befunde behoben, Sicherheits-Kopfzeilen (CSP, kein Einbetten), 74 Prüfungen halten sie geschlossen |
| Design-System | ✅ Fertig | Einheitlicher Dark Mode über alle Seiten, in CLAUDE.md verankert |
| Impressum & Datenschutz | ✅ Fertig | Echte Daten, § 5 DDG, Datenschutz beschreibt echten Datenfluss (cookielos) |
| Wöchentlicher Cron (Mo 07:00) | ✅ Aktiv | Marktbericht + Newsletter-Draft, CRON_SECRET ✅ |
| Täglicher Cron (08:00 UTC) | ✅ Aktiv | Preis-Snapshots + Publish-Artikel (So/Do), verwaiste Crons entfernt |
| Supabase Preis-Snapshots | ✅ Aktiv | Sammelt täglich echte Daten seit Inbetriebnahme |
| i18n DE/EN | ✅ Fertig | Cookie-basiert, NavBar-Umschalter |
| SEO | ✅ Fertig | JSON-LD, Sitemap (inkl. Artikel/Guides/Berichte), robots.txt, OpenGraph |
| Tests | ✅ 145 grün | Vitest — Portfolio, Median, Card-Display, Artikel-Daten, Guides, Marktbericht, Compliance, Merkliste, System-Health |
| Monitoring: Betriebszustand | ✅ Fertig | Echte Zeilenzahlen + Datenstände + Klartext-Fehler + Setup-SQL (`src/lib/system-health.ts`) |
| Guide-Pipeline | ⚠️ Prüfen | Diagnose eingebaut (v2.21.0) — Betriebszustand auf `/monitoring` öffnen, ggf. fehlende Tabelle per SQL anlegen, dann „Jetzt testen" |
| Newsletter-System (Beehiiv) | ⏸ Bereit | Code fertig — `BEEHIIV_API_KEY` noch nicht gesetzt |
| Social-Media (Buffer) | ⏸ Bereit | Code fertig — `BUFFER_ACCESS_TOKEN` noch nicht gesetzt |
| Affiliate-Links | ⚠️ Standard-URLs | Eigene Links in Vercel noch nicht eingetragen (0 € Provision aktiv) |

---

## Vercel Env-Variablen

| Variable | Status |
|---|---|
| `POKEMON_TCG_API_KEY` | ✅ Gesetzt |
| `ANTHROPIC_API_KEY` | ✅ Gesetzt |
| `CRON_SECRET` | ✅ Gesetzt |
| `SUPABASE_URL` | ✅ Gesetzt |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Gesetzt (rotieren falls noch nicht gemacht!) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Gesetzt |
| `STUDIO_PASSWORD` | ✅ Gesetzt |
| `ANTHROPIC_MODEL` | ⚪ Optional (überschreibt Model-ID, Default `claude-opus-4-8`) |
| `BEEHIIV_API_KEY` | ❌ Fehlt |
| `BEEHIIV_PUBLICATION_ID` | ❌ Fehlt |
| `NEXT_PUBLIC_CARDMARKET_URL` | ❌ Eigener Affiliate-Link fehlt |
| `NEXT_PUBLIC_AMAZON_URL` | ❌ Eigener Affiliate-Link fehlt |
| `NEXT_PUBLIC_TRADE_REPUBLIC_URL` | ❌ Eigener Affiliate-Link fehlt |
| `INSTAGRAM_ACCESS_TOKEN` | ❌ Fehlt — für Reels-Auto-Publish |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ❌ Fehlt — für Reels-Auto-Publish |
| `CARDMARKET_APP_TOKEN` | ❌ Fehlt — für sprachspezifische Preise (DE/JP/KR) |
| `CARDMARKET_APP_SECRET` | ❌ Fehlt — Cardmarket OAuth 1.0 |
| `CARDMARKET_USER_TOKEN` | ❌ Fehlt — Cardmarket OAuth 1.0 |
| `CARDMARKET_USER_SECRET` | ❌ Fehlt — Cardmarket OAuth 1.0 |

---

## Offene Aufgaben

### Priorität 1 — Rechtliches ✅ ERLEDIGT (v2.14.1)
- [x] **Impressum** `/impressum` — echte Daten eingetragen
- [x] **Datenschutz** `/datenschutz` — komplett neu, beschreibt echten Datenfluss

### Priorität 2 — Einnahmen aktivieren
- [ ] **Cardmarket-Affiliate** — eigenen Link in `NEXT_PUBLIC_CARDMARKET_URL` eintragen
- [ ] **Amazon PartnerNet** — Link in `NEXT_PUBLIC_AMAZON_URL` eintragen
- [ ] **Trade Republic** Affiliate — Link in `NEXT_PUBLIC_TRADE_REPUBLIC_URL` eintragen

### Priorität 3 — Newsletter live schalten
- [ ] Beehiiv-Account erstellen → https://beehiiv.com/
- [ ] `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` in Vercel eintragen

### Priorität 4 — Optionale Erweiterungen
- [ ] `ELEVENLABS_API_KEY` — Video-Vertonung aktivieren
- [ ] `BUFFER_ACCESS_TOKEN` — Social-Media-Planung aktivieren

---

## Unsere Entscheidungen (Logbuch)

1. **Projektrichtung:** Pokémon-Investment-Portal — wegen bestehender Content-Erfahrung + Community
2. **Maximale Automatisierung:** KI übernimmt Content-Erstellung, du steuerst & gibst frei
3. **Review-Modus als Standard:** Inhalte gehen erst als Entwurf raus
4. **Tech-Stack:** Next.js + Vercel + Claude + Remotion — 0–20 €/Monat Betriebskosten
5. **Preis-Quelle:** Cardmarket EUR via TCG-API (`tcgplayer.prices.cardmarket`)
6. **Preis-Historie:** NUR echte Daten — Supabase-Tages-Snapshots gemerged mit echten Cardmarket-Ankern. Keine Interpolation, keine Beispielkurve (seit v2.19.1 verboten und entfernt)
7. **Versionierung:** Jede Änderung bekommt eine Versionsnummer im Commit-Titel

---

---

## Versions-Log (22. Juni 2026)

| Version | Highlights |
|---|---|
| v2.0.0 | Instagram Reels Pipeline (FFmpeg + Studio Reels-Tab) |
| v2.0.1 | Reels: lokales Video-Preview + benutzerdefinierter Cut-Zeitpunkt |
| v2.1.0 | Portfolio-Tracker (Finance-App-Style, localStorage, Live-Preise, Chart) |
| v2.1.1 | Portfolio: Kaufdatum beim Hinzufügen |
| v2.1.2 | Portfolio: Reset-Button mit Bestätigungs-Dialog |
| v2.1.3 | Portfolio: Edit-Modal, Chart-Fix (purchaseDate), Y-Achse, 5 Zeitbereiche |
| v2.1.4 | Lückenlose Release-Dokumentation (CHANGELOG.md, /changelog-Seite, CLAUDE.md) |
| v2.1.5 | Portfolio NavBar überall + Suche 20 Ergebnisse statt 6 |
| v2.1.6 | Bugfix: Versionsnummer im Footer (falsche env var) |
| v2.2.0 | Sprachspezifische Preise EN/DE/JP/KR via Cardmarket OAuth API |
| v2.1.7 | Portfolio-Chart: sofortige Anzeige + Animation deaktiviert |
| fix | Vercel `buildCommand: next build` — behebt Deployment-Blockade seit v1.9.0 |
| v2.4.2 | Mobile Modals: Vollbild-Overlay, safe-area-inset-top, kein dvh mehr |
| v2.4.3 | iOS-Zoom-Bug behoben (font-size 16px), Delete-Button auf Mobile versteckt |
| v2.4.4 | Error-Box entfernt (graceful degradation), Newsletter auf Startseite deaktiviert |
| v2.4.5 | Blog: nur So/Do, 404 für andere Tage, Newsletter aus Artikelseite entfernt |
| v2.5.0 | Startseite Redesign: Bloomberg/TradingView Dark Mode, PMI, Fear & Greed, Sparklines, Ticker |
| v2.5.1 | Sprachauswahl EN/DE/JP/KR für Kartenpreise in Suche + Karten-Detail |
| v2.5.2 | Datenintegrität: Archiv-Disclaimer, Persona-Bereinigung, erfundene Daten entfernt |
| v2.5.3 | Guides + Fallback-Preise bereinigt, CLAUDE.md-Regeln permanent verankert |
| v2.5.4 | Newsletter-Formular global von allen Seiten entfernt (Guides, Marktbericht, Wochenberichte) |
| v2.6.0 | Einheitliches Dark Mode Design auf allen Seiten + Komponenten, in CLAUDE.md verankert |
| v2.6.1 | Portfolio Dark Mode + negativer Kaufpreis blockiert |
| v2.6.2 | Portfolio: P&L-Anzeige an Zeitraum-Selektor gekoppelt |
| v2.7.0 | Code-Review: timing-safe Auth, fail-closed, keine Fehler-Leaks, Median-Preise, Fetch-Timeouts |
| v2.7.1 | Artikel-Seite selbstheilend (on-demand) + 404-Fix vor 12:00 UTC |
| v2.7.2 | Suche filtert leere Preview-Karten zentral; Such-Dropdown dark |
| v2.7.3 | Technisches Aufräumen: verwaiste Crons entfernt, Sitemap erweitert, Karten-Detail ISR, STATUS aktuell |
| v2.8.0 | Inhaltlicher Komplett-Review: Wahrheitspflicht & Neutralität erzwungen, Compliance-Tests, Admin-Bereich dark |
| v2.8.1 | Schreibstil-System: Anleitung gegen KI-Klang, STYLE_RULES im Prompt, Floskel-Blockliste im Test |
| v2.9.0 | Set-Landingpages /sets + /sets/[setCode]: SEO-Einstiege, NavBar-Link, Sitemap, Injection-Schutz |
| v2.10.0 | Merkliste (Karten beobachten, Δ seit Vormerkung) + Bild-Text-Kopplung in Artikeln erzwungen |
| v2.10.1 | Portfolio-Chart: lückenlose Tagesserie (Carry-Forward), Kurvenende = Live-Gesamtwert, Filter nach Tagen |
| v2.11.0 | Portfolio-Chart Finance-App-Niveau: Scrubbing mit Header-Kopplung, Baseline, Scrub-Dimmen, Puls-Punkt |
| v2.11.1 | Performance & Feedback: Loading-Skeletons für alle Routen, fehlende API-Timeouts, Tap-Feedback |
| v2.12.0 | Build-Vorrendern (12 Sets + Top-20-Karten) + Shimmer-Bildplatzhalter mit weichem Einblenden |
| v2.13.0 | Automatisierte Guide-Pipeline: 12-Themen-Queue, Di+Fr-Cron, Qualitäts-Gate, generated_guides-Tabelle |
| v2.14.0 | Phase 0: Vercel Analytics (Messung!) + globaler Site-Footer mit Navigation, Legal-Links entdoppelt |
| v2.14.1 | Impressum & Datenschutz rechtssicher: echte Daten, § 5 DDG, Datenschutz für echten Datenfluss |
| v2.14.2 | 404-Bug behoben: API-Fehler nie mehr als notFound, ApiErrorState mit Retry, Build-Vorrendern entfernt |
| v2.15.0 | Bild-Robustheit: Caching-Proxy /api/img (stale-if-error bis 1 Jahr), cachedImg()-Helper, alle Bild-Konsumenten umgestellt |
| v2.16.0 | SEO-Ausbau (Canonical-Fix, JSON-LD, Sitemap-Karten), Lucide-Icons statt Emojis überall, 7 falsche Karten-IDs korrigiert + erfundene Karten entfernt |
| v2.17.0 | Auto-Reel-Generator: Social-Media-Videos direkt aus Marktdaten (FFmpeg), Caption mit UTM-Link, Ein-Klick-Publish im Studio |
| v2.17.1 | BUGFIX: Kartenbilder luden nicht — Proxy war nicht mit next/image-Optimizer kompatibel, cachedImg nur noch bei plain img |
| v2.17.2 | BUGFIX: Startseite ohne Trends — getHomepageCards mit Fallback auf letzten Supabase-Marktbericht, verhindert leer-gecachte Startseite |
| v2.17.3 | Artikel-Fallbacks werden persistiert (kein Regenerieren pro Aufruf); KI-/Auto-Generierungs-Hinweise auf Content-Seiten neutralisiert (Legal bleibt) |
| v2.18.0 | Content-System: Content-Creator-Prompt, Hero-Bild + Level-Badge (Einsteiger/Profi-Mix), Weiterlesen-Verknüpfung, Kontinuität über letzte Titel |
| v2.18.1 | Social-Sharing: dynamische OG-Vorschaubilder (Karten mit Preis, Artikel mit Leitkarte, Startseite) via next/og |
| v2.19.0 | Einsteiger-Seite /einsteiger (Onboarding, ikonische Karten, Guides) + „Neu hier?"-Banner auf Startseite + NavBar/Footer/Sitemap |
| v2.19.1 | Preise: echte Zeit-Achse + nur echte Datenpunkte (Snapshots + Cardmarket-Anker), record-on-view, synthetische Kurve entfernt — kein „linear" mehr |
| v2.19.2 | Preis-Transparenz: Cardmarket-Aufschlüsselung (Trend/ab/Ø) + Datenstand auf Kartenseite, Ausreißer-Schutz — passt zu Cardmarket |
| v2.19.3 | UI: Einsteiger-Banner-Überlappung behoben; Kartenseite professioneller (Merken primär, Kauf-Links dezent/klein) |
| v2.19.4 | BUGFIX: Auto-Reel — Schriftart (Liberation Sans) mitgeliefert, drawtext-fontfile gesetzt; Vercel hat keine System-Fonts |
| v2.19.5 | Diagnose: echte FFmpeg-Fehlerursache (stderr) im Auto-Reel sichtbar statt leerer Fehlermeldung |
| v2.19.6 | BUGFIX: Auto-Reel — FFmpeg-Binary via outputFileTracingIncludes ins Bundle gezwungen (spawn ENOENT behoben) + robust ausführbar gemacht |
| v2.19.7 | Set-Übersicht neu gestaltet (einheitliches Logo-Raster, Meta-Pillen); echtes API-Logo + Fallback-Kette bis Icon-Platzhalter — keine kaputten Bilder mehr |
| v2.19.8 | BUGFIX: Mobil-Navigation — echtes Hamburger-Menü mit allen Links; vorher fehlten mobil Sets/Einsteiger/Marktbericht/Merkliste |
| v2.20.0 | Rich-Content-Render-Ebene (Prose/Reveal/ReadingProgress): Guides, Marktbericht & Artikel magazinartig — Initialbuchstaben, Kennzahl-Highlights, Scroll-Einblendung; gilt automatisch für generierten Content |

| v2.21.0 | Betriebszustand im Monitoring (echte Zeilen/Datenstände/Klartext-Fehler + Setup-SQL); Guide-Pipeline-Diagnose: stiller Speicherfehler wird gemeldet, „Jetzt testen"-Auslöser |
| v6.0.2 | Kartenzahlen deutsch formatiert („14985“ ohne Tausenderpunkt) und „Stichprobe“ als Beschriftung ersetzt |
| v6.0.1 | Index-Zeilen fielen durch die eigene Qualitaetspruefung (keine ID, kein Bild) — die Startseite zeigte „Keine Messung“ |
| v6.0.0 | Der Index rechnet auf dem ganzen Bestand (19.690 statt 204 Karten) und ist der Median statt eines preisgewichteten Mittels — auf dem Gesamtbestand ergab das Mittel +28,7 %, der Median +3,5 % |
| v5.9.3 | Index-Vergleich stellt dieselben Karten-IDs gegenueber (live vs. gespeichert) — der entscheidende Test fuer die 29-Prozentpunkte-Luecke |
| v5.9.2 | Drei ausreisserfeste Index-Varianten zum Vergleich (Median, gestutzt, Gewichtsdeckel) — zehn Karten trugen 12 von 28,7 Prozentpunkten |
| v5.9.1 | Index-Vergleich zeigt auch Trend-Verteilung und groesste Einzelbeitraege — Anlass: +28,69 % Gesamtbestand gegen −0,19 % Stichprobe |
| v5.9.0 | Passwortgeschuetzter Index-Vergleich: CBI und Marktbreite auf Stichprobe vs. Gesamtbestand, je Preisschwelle — Entscheidungsgrundlage, keine Aenderung am Angezeigten |
| v5.8.1 | Gleichnamige Treffer sind unterscheidbar — das Set steht jetzt in jeder Zeile, nicht wahlweise der deutsche Name |
| v5.8.0 | Die Suche zeigt die gemeinte Karte zuerst — sortiert nach Rang statt nur nach Preis („mew" ergab vorher Mewtwo auf Platz 1, Mew auf Platz 6) |
| v5.7.0 | Die Suche findet auch Sets — ein Set-Name („black bolt") lief vorher in „Keine Karten gefunden", obwohl das Feld Sets verspricht |
| v5.6.2 | Auch die Ladezustaende zeigten die Kopfleiste doppelt — Skelett und Such-Umriss bereinigt; der Umriss der Suche war mittig statt linksbuendig |
| v5.6.1 | Auf dem Telefon standen zwei identische Kopfleisten uebereinander — die Huelle brachte seit v5.5.0 eine mit, die achtzehn Seiten weiterhin ihre eigene |
| v5.6.0 | Suche: Vorschlagsfeld gedeckelt (war 1015 px hoch), Feld an den Seiteninhalt ausgerichtet und auf 640 px verbreitert, Wartezeit 320 → 140 ms, laufende Abfragen werden abgebrochen, Tastaturbedienung, Verlaengerungen bekannter Begriffe ohne Netzweg |
| v5.5.0 | Seitenleiste auf allen siebzehn Seiten statt nur auf der Startseite; „Abdeckung 1 %" verglich zwei interne Zahlen — jetzt erfasste Karten gegen alle Karten |
| v5.4.1 | Sprachwahl im Portfolio versprach Cardmarket-Preise je Sprache — Cardmarket vergibt derzeit keine API-Zugaenge; jetzt steht dort der Grund |
| v5.4.0 | Zubehoer im Fliesstext (Sleeves, Toploader, Sammelalben, Boxen) wird zu Kauflinks — auf der Render-Ebene, damit auch bestehende Beitraege erfasst sind; hoechstens vier je Beitrag |
| v5.3.0 | Inhalte wiederholen sich nicht mehr: Sperrfrist ueber die letzten sechs Veroeffentlichungen, Themenwahl deterministisch aus dem Datum statt zufaellig |
| v5.2.1 | Monitoring vollstaendig aufgeraeumt: Ergebnisse statt Konfiguration, keine dreifach erzaehlten Zustaende |
| v5.2.0 | Portfolio zeigt immer einen Stand: Rueckfall auf den eigenen Kartenindex statt leerer Positionen |
| v5.1.0 | Preiserfassung lief taeglich nur bis 27 % — laengere Runden, nachgeprueft Uebergabe, Fortschritt im Monitoring sichtbar; dreifach erzaehlte „Features" entfernt |
| v5.0.0 | Hero fuellt den ersten Bildschirm (92 vh), Hintergrund in sieben Ebenen, Drache nur als Kontur bei 3 %, Kennzahlen mit eigener Persoenlichkeit, mehr Weissraum ueberall |
| v4.17.0 | Startseite nach geliefertem Entwurf: Seitenleiste, Kopfzeile, Glas-Panels, gravierte Eigenillustration, Kennzahl-Karten, Drei-Panel-Reihe, Schnellzugriff |
| v4.16.0 | Startseite erzaehlt zuerst: Markt-Story ueber den Zahlen, Verteilung in fuenf benannten Baendern mit Deutung, Sammler-Materialien (Prisma, Folie, Energie-Trenner) |
| v4.15.0 | Sammler-Motive: Kartenfaecher und eigene Elementzeichen im Grund, Kartenbild als Raumfarbe auf der eigenen Seite; Grenze zu fremdem Material neu gezogen |
| v4.14.0 | Sammler-Sichtebene: Umgebungs-Hintergrund in drei Ebenen, gezaehlter Set-Farbton, vier eigene Kennzahl-Signaturen, kein waagerechtes Scrollen mehr |
| v4.13.0 | Eigener Kartenindex: Suche aus der eigenen Datenbank statt von aussen |
| v4.12.1 | Studio stuerzt bei abgelaufener Sitzung nicht mehr ab; Vorschauen laden einzeln |
| v4.12.0 | Marktbilder im Studio: Vorschau, Formatwahl, Herunterladen |
| v4.11.1 | Marktbild: abgeschnittene Kennzahl und leere Mitte behoben |
| v4.11.0 | Vier Marktbilder in drei Formaten aus echten Daten; Folienschimmer auf allen Karten |
| v4.10.0 | Ein Kopf-Muster je Seitenart; DESIGN.md §15 klaert Datenflaeche gegen Lese-Flaeche |
| v4.9.1 | Gesamtfrist 9 s fuer die Suche — kein 40-Sekunden-Warten mehr bei Quellenausfall |
| v4.9.0 | Suchfrist 1 h + Vorwaermen im Cron, Methodik um Temperatur und Prozentpunkte ergaenzt |
| v4.8.0 | Bildlast 2.596→453 KB, Layout-Versatz 0,41→0, Trefferflaechen 44 px |
| v4.7.0 | Geteilter Zwischenspeicher fuer Suchtreffer, Set-Markt mit Indexbezug und tragender Karte |
| v4.6.0 | Suche als Ergebnisliste mit Marktbezug, Sammlungsansicht im Portfolio |
| v4.5.0 | Bewegungen mit Abstand zum Markt (pp), Set-Bibliothek mit echten Epochen-Filtern |
| v4.4.1 | Sichtpruefung: doppelte Klammer, Mobil-Verteilung, Merklisten-Knopf gedeckt |
| v4.4.0 | Sammler-Ebene: Ambient-Ton aus dem Energietyp, Folienschimmer, Hintergrund-Identitaet, Markttemperatur |
| v4.3.1 | Doppeltitel in Portfolio/Merkliste behoben, Startseiten-Titel korrigiert |
| v4.3.0 | Markenkonsistenz-Audit: ein Titelmuster, kanonische Adresse der Startseite, Ausfall ≠ Fehlbestand |
| v4.2.5 | Kartenabruf mit vier Versuchen — „nicht erreichbar" trotz existierender Karte behoben |
| v4.2.4 | Marktvergleich auf jeder Kartenseite — Zwischenspeicher hielt kein Fehlergebnis mehr fest |
| v4.2.3 | Monitoring erkennt fehlende Tabellen wieder — eine HEAD-Abfrage meldete sie als „vorhanden, 0 Zeilen" |
| v4.2.2 | Indexstand von Hand setzbar und nachweisbar — dynamische Studio-Route |
| v4.2.1 | Indexstand wird auch geschrieben, wenn die Startseite aus dem Zwischenspeicher kommt |
| v4.2.0 | Taeglicher Indexstand gespeichert — Kartenseiten lesen eine Zeile statt 250 Karten; Beginn der Indexhistorie |
| v4.1.0 | Kartenseite sofort sichtbar und bedienbar — Navigation im Lade-Skelett, Marktkontext stroemt nach |
| v4.0.2 | Suche haelt Ausfaelle der Quelle aus — Wiederholungen mit steigender Wartezeit plus Ergebnis-Zwischenspeicher |
| v4.0.1 | Suche mit Wiederholungsversuch · Kartenbilder haengen nicht mehr an einem Ladeereignis |
| v4.0.0 | CardBeacon: Umbenennung, neue Informationsarchitektur, Marktkontext auf Kartenseiten, Design-System |
| v3.3.5 | Zeitlimit der Kartenabfrage an die groessere Stichprobe angepasst — Startseite fiel sonst auf 7 Karten zurueck |
| v3.3.4 | Labels an die Berechnung angeglichen (Medianpreis, Marktbewegungen) · PMI-Begruendung ohne Behauptung ueber den Markt · DOMAIN.md |
| v3.3.3 | Keine Null aus einer gescheiterten Zaehlung in der Datenabdeckung |
| v3.3.2 | Index-Schnittstelle an die Stichprobe der Startseite angeglichen |
| v3.3.1 | Nachtrag: Sprachpruefung nimmt den Verlauf aus |
| v3.3.0 | Datenabdeckung von der Kennzahl-Stichprobe getrennt · Set-Ranking mit Mindest-Stichprobe · Marktbericht an dieselbe Quelle angeschlossen |
| v3.2.6 | Erfassung läuft ohne Abriss durch — Arbeit in der Anfrage statt danach |
| v3.2.5 | Erfassung sichert den Stand nach jeder Seite — vorzeitig beendete Runden verloren vorher ihren ganzen Fortschritt |
| v3.2.4 | Kürzere Kette in der Preiserfassung — statt 40 Übergaben pro Tag nur noch etwa fünf |
| v3.2.3 | Erfassung überlebt einen Aussetzer der Kartendatenbank — ein Abruffehler beendete vorher den ganzen Durchlauf |
| v3.2.2 | Preiserfassung blieb nach 8 von 82 Seiten stehen — Folgeaufruf ging an die noch nicht verbundene Domain |
| v3.2.1 | Preiserfassung von Hand startbar (Monitoring) |
| v3.2.0 | Flächendeckende Preiserfassung über alle ~20.500 Karten — in Häppchen, mit gemerktem Stand und Selbstfortsetzung |
| v3.1.4 | Richtigstellung im Changelog — v3.1.2 war kein Fehlschlag |
| v3.1.3 | Fußzeile zeigt eine Versionsnummer — Konstante statt Umgebungsvariable, per Test an package.json gekoppelt |
| v3.1.2 | Versionsanzeige über den Build-Befehl wiederhergestellt |
| v3.1.1 | Marktbreite aus einer Quelle — die Kachel zählte die auf acht gekürzte Anzeige-Liste, die Erklärung darunter den ganzen Datensatz |
| v3.1.0 | QA über 14 Seiten × 5 Breiten: Set-Logos, Tablet-Overflow, Tippziele, 29 % weniger JS auf der Kartenseite |
| v3.0.0 | Professionalisierung: Ranking-Logik, PMI-Belastbarkeit, Angst&Gier nachvollziehbar, Datenprüfung, Karten-Detailseite, Portfolio-Auswertung, /methodik |
| v2.40.0 | Startseite: Set-Bilder in der Tabelle, Messbalken bei PMI/Marktbreite, Insights als Karten |
| v2.39.0 | Grafiken bauen sich beim Scrollen auf, aufgewertete Gestaltung, kreuzende Linie auf /guides behoben |
| v2.38.0 | Datengrafiken überarbeitet (semantische Farben, waagerechte Balken, Marktbild), Kennzahlen-Kacheln, Kartenbilder als Blickfang |
| v2.37.0 | Portfolio: Zukäufe aus der Wertentwicklung herausgerechnet, Tages-Snapshots eingemischt, Datenlage sichtbar |
| v2.36.0 | Trade-Republic-Partnerlink aktiv, Kennzeichnung in der Partner-Leiste, toter Link behoben |
| v2.35.2 | Echte Ursache: Artikel-Speicher schrieb in eine nicht existierende title-Spalte |
| v2.35.1 | Artikel-Speicherung scheiterte still + Artikelseite war nicht zwischengespeichert (ein KI-Aufruf pro Seitenaufruf) |
| v2.35.0 | Sicherheitsdurchsicht: 9 Befunde geschlossen (XSS über strukturierte Daten, offene Weiterleitung, Newsletter-HTML, SSRF im Bild-Proxy, FFmpeg-Optionen, fehlende Kopfzeilen, Next.js 16.2.12) · 74 neue Tests |
| v2.34.0 | KOSTENFUND: /api/market (GET!) und /api/generate loesten KI-Generierungen OHNE Auth aus — jeder Crawler konnte Guthaben verbrennen. Beide abgesichert + Regel-Test gegen Wiederholung. Neu: ai-usage.ts erfasst jeden Aufruf (Zweck, Modell, Token, Kosten, auch Fehlschlaege), Auswertung im Monitoring nach Zweck. Model-ID in article-generator zentralisiert. 447 Tests |
| v2.33.0 | URSACHE Content-Ausfall: Anthropic-Guthaben aufgebraucht (live verifiziert, alle drei Endpunkte). BUGFIX publishMarktbericht war ein No-Op mit garantiertem Erfolg -> Studio zeigte immer "Live!", oeffentliche Seite leer. Jetzt echtes saveMarketReport + Mindestmass-Gate + Auth-Pruefung + Klartext-Ergebnis. ai-error.ts uebersetzt KI-Fehler; Artikel-Route nennt die Ursache; 2 stumme catch beim Speichern beseitigt. 428 Tests |
| v2.32.0 | Portfolio-Konto via Supabase Auth (Google + Apple): supabase-auth.ts, /auth/callback (nur relative Weiterleitung), /api/portfolio/sync (GET/PUT, Nutzerpruefung), portfolio-sync.ts (idempotente Zusammenfuehrung, Stueckzahlen nie addieren), AccountBar mit sichtbarem Speicherort. Tabelle portfolio_holdings mit RLS im Monitoring-Setup-SQL. 409 Tests |
| v2.31.0 | Portfolio-Tests (portfolio-edge 33, portfolio-api 18 Funktionstests der Preis-Route, newsletter-watchlist 29) — 364 Tests. Behoben: normalizeHolding erzeugte NaN bei null/undefined-Feldern; Newsletter ohne rel=sponsored, mit toten Footer-Links, Kaufaufforderung und Emojis, ohne CONTENT_RULES im Prompt; 5 fetch-Aufrufe (Cardmarket, Instagram) ohne Timeout — Regel war zu eng gefasst |
| v2.30.0 | Test-Offensive: 284 statt 149 Tests (7 neue Dateien: studio-auth, price-truth, reel-concepts, homepage-data, cached-image, i18n-names, code-rules). Gefundene Fehler behoben: 6× englisches Zahlenformat zurück, Newsletter an format.ts vorbei, Prozent-Umbruch (NBSP), Reel-Rotation wechselte mitten in der Woche, 2× String(error) nach außen, 3× stilles catch + zu knappe Token-Limits, Monitoring-fetch ohne Timeout, helle Boxen im Studio |
| v2.29.0 | Monitoring-Auslöser für Marktbericht + Artikel (bisher nur per curl mit Studio-Passwort — Grund für den monatelangen Bericht-Ausfall); Artikel-Lauf clientseitig über die letzten 8 Termine, ersetzt nur Ersatztexte; `publish-days.ts` als einzige Quelle der Veröffentlichungstermine |
| v2.28.0 | Reel-Optik: Kartenbild als unscharfe, wandernde Hintergrundebene (FFmpeg-Zweilagen-Komposition, Unschärfe in kleiner Auflösung gerechnet) — jedes Segment in der Farbe SEINER Karte; angedeutetes Sammel-Motiv + Streuelemente; geneigte Karte, Verlaufs-Ziffer, Ober-/Unterkanten-Abdunklung; BUGFIX doppelte Abspann-Aussage |
| v2.27.0 | Instagram-Konzept: 4 Formate (top-mover, preis-check, teuerste-im-set, dreissig-tage) mit Wochen-Rotation + Dramaturgie (Haken zuerst, Einordnung, Marke zuletzt) in reel-concepts.ts; Generator formatunabhängig |
| v2.26.0 | Reel-Design im Plattform-Look: Raster + trendfarbige Lichtstimmung, Rang-Ziffer, Karten-Ring, Trend als Hauptkennzahl mit SVG-Pfeil, Fortschrittspunkte, Blenden + Vignette + wechselnder Zoom-Versatz |
| v2.25.0 | BUGFIX Reels: ffmpeg-static hat KEINEN drawtext-Filter (486 Filter, keiner davon) — jede Textzeile lief darüber, Reel konnte nie entstehen. Umbau auf fertig gerenderte Bilder via next/og; erstes Reel erfolgreich erzeugt |
| v2.24.0 | GESAMT-AUDIT: Preisformat deutschlandweit falsch (toFixed statt Intl) an ~15 Stellen → zentrale format.ts; Boosterpack-CDN komplett 404 → Set-Logo als Primärquelle; TCG-API-Retry (leere Startseite, Stolperstelle 19); Startseite erfand Sentiment ohne Daten → ApiErrorState |
| v2.23.0 | BUGFIX Marktbericht: Platzhalter („test") seit KW 26 live, Cron meldete Erfolg ohne Prüfung, Newsletter-Fehler riss den Bericht mit. Qualitätsgate + Anzeige-Filter + manueller Auslöser + entkoppelter Cron |
| v2.22.0 | BUGFIX Content: max_tokens zu knapp (2048) → jede KI-Antwort abgeschnitten → stiller Fallback bei ALLEN Artikeln. Erhöht + stop_reason-Prüfung + Klartext-Logging; Marktbericht bekommt Content-/Style-Rules; Lesezeit-Fallback; Rückblick-Fallback ehrlich zeitlos; Nach-Generierungs-Endpoint |

---

## Offene Befunde aus dem Gesamt-Review (27.07.2026)

Vollständige Analyse siehe Chat-Verlauf. Kernbefund: Das Produkt ist gebaut, aber mehrere
Wertschöpfungsketten sind nicht zu Ende verdrahtet.

| # | Befund | Status |
|---|---|---|
| 1 | **Domain**: `pokemarketintelligence.com` löst nicht auf (HTTP 000), Seite lebt auf `new-idea-livid.vercel.app`. Alle 107 Sitemap-URLs, robots.txt, Canonicals und OG-Bilder zeigen auf die tote Domain → für Google unsichtbar | Bewusst zurückgestellt bis Go-Live |
| 2 | **Canonical-Bug**: Startseite meldet `/index` statt `/` (Next.js-Eigenheit bei relativem `'./'`) | Offen — mit Befund 1 erledigen |
| 3 | **Reel-Link tot**: Caption-URL nutzt dieselbe Variable → auch manuell gepostete Reels führen ins Leere | Offen — mit Befund 1 erledigt |
| 4 | **Affiliate**: 26 Kauflink-Stellen ohne eigene Tracking-ID → 0 € Provision unabhängig vom Traffic | Offen (deine Aktion: Links beantragen) |
| 5 | **Keine E-Mail-Erfassung**: Newsletter-Formular seit v2.5.4 global entfernt → jeder Besucher ist ein Einmalbesuch | Offen |
| 8 | **Kein echter Inhalt live**: Marktbericht nie erzeugt, alle Artikel sind Ersatztexte, 0 von 12 Guides erstellt | **Ursache gefunden (30.07.): Anthropic-Guthaben aufgebraucht.** Live verifiziert an allen drei Endpunkten. Deine Aktion: aufladen, danach die drei Klicks im Monitoring |
| 9 | **Portfolio-Konto gebaut, aber abgeschaltet**: Code vollständig (v2.32.0), Anmeldung per `NEXT_PUBLIC_PORTFOLIO_LOGIN=on` freizuschalten | Bewusst zurückgestellt |
| 6 | **Guide-Pipeline**: 12 Themen warten, 0 erzeugt | Diagnose eingebaut (v2.21.0) — Ursache jetzt sichtbar |
| 7 | **Blindflug im Monitoring**: prüfte nur Konfiguration, nicht Ergebnisse | ✅ Behoben (v2.21.0) |

---

*Zuletzt aktualisiert: v3.3.0 — 30. Juli 2026*
