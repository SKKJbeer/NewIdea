# Changelog — PokéMarket Intelligence

Alle Versionen und Änderungen. Format: [Semantic Versioning](https://semver.org/lang/de/) — `MAJOR.MINOR.PATCH`

> Dieses Changelog wird bei jedem Deploy nach `main` aktualisiert.
> Die gleichen Informationen sind auch unter `/changelog` auf der Website sichtbar.

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
