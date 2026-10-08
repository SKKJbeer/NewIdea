# CardBeacon für iOS — Architektur und Fahrplan

Stand: 6. Oktober 2026 · Bundle-ID `de.cardbeacon.app` · Mindestversion iOS 17

## Entscheidungen

| Frage | Entscheidung | Begründung |
|---|---|---|
| Technik | **Native SwiftUI-App** | Apple lehnt reine Web-Hüllen ab (Richtlinie 4.2 „Minimum Functionality"). Native Listen, Suche, Swift Charts und lokale Merkliste sind der Mehrwert gegenüber der Website. Kein Fremd-Framework (React Native/Flutter) = keine zweite Abhängigkeitskette |
| Datenquelle | **Eigene, versionierte Schnittstelle `/api/v1`** | EINE Preis-Pipeline für Website und App (Kartenindex, Tagesdurchlauf, Qualitätsschranken). Die App rechnet nichts selbst aus |
| Formatstabilität | Felder nur ergänzen, nie umbenennen; `status.minAppBuild` | Eine installierte App lässt sich nicht zurückrollen. Bricht das Format doch, erzwingt die App ein Update statt still Falsches zu zeigen |
| Wahrheitspflicht | Jeder Preis trägt `preisStand` + `frisch` | Ein alter Preis darf nie wie ein heutiger aussehen — gleiche Regel wie auf der Seite |
| Bilder | Über den eigenen Bild-Proxy `/api/img` | Verkleinert, ein Jahr im CDN, Ersatzquelle TCGdex |
| Konto | Keins (Merkliste lokal, UserDefaults) | Kein Login = keine Datenschutz-Angaben zu Kontodaten, kein „Sign in with Apple"-Zwang, schnellere Prüfung |
| Projektdatei | XcodeGen (`ios/project.yml`), keine `.xcodeproj` im Repo | Projektdateien erzeugen Konflikte; die Quelle ist eine lesbare YAML |
| Build & Auslieferung | GitHub Actions (macOS-Runner), Signatur über App-Store-Connect-API-Schlüssel | Kein Mac nötig, wiederholbar, Schlüssel nur als Repository-Secret |

## Schnittstelle `/api/v1` (nur lesend, ohne Anmeldung)

| Pfad | Inhalt | Quelle |
|---|---|---|
| `GET /api/v1/status` | `api`, `minAppBuild`, `datenStand` | Kartenindex |
| `GET /api/v1/markt` | CardBeacon Index (≤ 3 Tage), Indexreihe, Aufwärts/Abwärts (nur frische Preise ≥ 2 €); seit v6.25.0 `breite`, `vorwoche`, `setBewegung`, `neuheiten` | `market_index`, Tagesstand der 500 wertvollsten Karten, `ladeMarktLage()` |
| `GET /api/v1/suche?q=` | Karten + Sets | Kartenindex (kein langsamer Fremdabruf) |
| `GET /api/v1/karten/:id` | Karte, Cardmarket-Aufschlüsselung, echte Tageswerte (90 Tage); seit v6.25.0 `sprachen` (JP/KR oder Grund) und `setInfo`; seit v6.26.0 `kaufen` (Cardmarket genau/Suche, Amazon) | Index + TCGdex (Vortag) + `price_snapshots` + `sprachpreiseFuerKarte` |
| `GET /api/v1/sets` | Alle Sets, neueste zuerst, mit Logo und Serie | `ladeSetListe` (mit gesicherter Liste) |
| `GET /api/v1/sets/:setCode` | Alle Karten eines Sets | Kartenindex |
| `GET /api/v1/inhalte` | Neuester Marktbericht, Artikel (So/Do), alle Guides | `market_reports`, `articles`, Guides |
| `GET /api/v1/marktbericht[?woche=]` · `/artikel/:datum` · `/guides/:slug` | Volltexte; `archiv` = Zahlen evtl. veraltet; erzeugt nie. Seit v6.27.0 Karten mit Bild (`aufwaerts`/`wertvollste`, `karten`, `abschnitte[].karte`/`.karten`), Preise = Stand des Textes | wie Website |
| `GET /api/v1/preise?ids=` | Aktuelle Preise für bis zu 100 Karten, `fehlend` = ohne Eintrag | Kartenindex |
| `GET /api/v1/verlauf?ids=&tage=` | Echte Tageswerte je Karte (max. 365 Tage), in Gruppen < 1.000 Zeilen abgefragt | `price_snapshots` |

Antworten: `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600, stale-if-error=86400`.
Fehler ohne Details (`503 nicht-verfuegbar`). Suche: 120 Anfragen/Min je Adresse.
Datenformen und Regeln: `src/lib/app-api.ts`, Tests: `src/__tests__/app-api.test.ts`.

## App-Aufbau (`ios/CardBeacon`)

- `API/` — `APIClient` (async/await, 15 s Zeitgrenze, HTTP-Cache), `Modelle` (Codable, spiegelt `app-api.ts`)
- `Views/` — Markt, Suche (Sets + Karten, 300 ms Pause), Kartendetail (Preisblock mit Aufschlüsselung, Verlauf erst ab 2 echten Punkten), Set, Merkliste, Info (Hinweise, Datenschutz)
- `Util/` — `Format` (deutsche Zahlen, geschütztes Leerzeichen), `Theme` (Design-Token der Seite), `Merkliste`
- `Resources/` — App-Icon (1024 px, ohne Alpha), `PrivacyInfo.xcprivacy` (kein Tracking, UserDefaults-Grund CA92.1)

## Was nur der Nutzer tun kann

1. **App in App Store Connect anlegen** (Meine Apps → + → Neue App): Plattform iOS, Name z. B. „CardBeacon – TCG Marktpreise", Sprache Deutsch, Bundle-ID `de.cardbeacon.app` (wird beim ersten Build mit Admin-Schlüssel registriert oder vorher unter Certificates, Identifiers & Profiles angelegt). Apple erlaubt das Anlegen des App-Eintrags nicht über die Schnittstelle.
2. **Vier Repository-Secrets** in `SKKJbeer/NewIdea`: `APPLE_TEAM_ID`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_P8` (Schlüssel mit Rolle **Admin**, sonst scheitert die Cloud-Signatur). Dieselben Werte wie in den anderen App-Projekten — Übertragung wie bei den Cloudflare-Secrets.
3. Für die Prüfung: Datenschutz-Angaben in App Store Connect („Keine Daten erfasst"), Altersfreigabe, Screenshots (6,9"), Support-URL `https://cardbeacon.de/impressum`, Datenschutz-URL `https://cardbeacon.de/datenschutz`.

## Website und App parallel

Beide laufen unabhängig nebeneinander aus EINEM Backend: Die Website bleibt unverändert auf Vercel, die App liest dieselben Daten über `/api/v1`. Ein Website-Deploy ändert nichts an installierten Apps (stabiles Format), ein App-Build ändert nichts an der Website (eigener Workflow, nur bei Änderungen unter `ios/`).

## Prüfungsrisiken (App Review) und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| 4.2 Mindestfunktion (Web-Hülle) | Native Ansichten, Suche, Diagramme, Merkliste — kein WebView |
| 5.2.1 Geistiges Eigentum („Pokémon") | Markenname nicht im App-Namen; Hinweis „Inoffizielle Fan-App" + Markeninhaber in der Info-Ansicht; Kartenbilder nur als Referenz zu Preisdaten |
| 3.1.1 / Finanzen | Keine Käufe, keine Anlageberatung (Hinweis unter jedem Preisblock) |
| 5.1.1 Datenschutz | Kein Konto, kein Tracking, Datenschutz-Manifest |

## Fahrplan

| Phase | Inhalt | Stand |
|---|---|---|
| 0 | API v1, SwiftUI-App, CI-Build + Tests auf dem Simulator | erledigt (v6.22.0) |
| 1 | TestFlight: jede iOS-Änderung auf main baut, signiert per API (Zertifikat + Profil je Lauf, danach gelöscht) und lädt einen neuen Build hoch | erledigt — erster Build 112 am 07.10.2026 |
| 2 | Store-Eintrag (Screenshots, Texte), Einreichung zur Prüfung | danach |
| 3 | Preisalarme per Push (APNs) für gemerkte Karten — braucht Geräte-Token-Ablage und einen Cron | geplant |
| 4 | Portfolio in der App (lokal, Depotwert, G/V, Verlauf aus echten Tageswerten) | erledigt (v6.23.0); Abgleich mit dem Konto-Portfolio der Seite folgt |
