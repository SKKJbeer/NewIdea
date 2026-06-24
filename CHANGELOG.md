# Changelog — PokéMarket Intelligence

Alle Versionen und Änderungen. Format: [Semantic Versioning](https://semver.org/lang/de/) — `MAJOR.MINOR.PATCH`

> Dieses Changelog wird bei jedem Deploy nach `main` aktualisiert.
> Die gleichen Informationen sind auch unter `/changelog` auf der Website sichtbar.

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
