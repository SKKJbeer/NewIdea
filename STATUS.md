# Projekt-Status — PokéMarket Intelligence

**Version:** `v2.4.4` · **Stand:** 23. Juni 2026 · **Branch:** `main`

Diese Datei ist unser gemeinsames Logbuch: Was ist entschieden, was ist gebaut, was ist offen.

> Versionsverlauf: siehe [CHANGELOG.md](./CHANGELOG.md) · Live auf der Website: `/changelog`

---

## Was gebaut ist (v2.1.0)

| Bereich | Status | Details |
|---|---|---|
| Startseite `/` | ✅ Fertig | Kartenpreise, Investment-Scores, Blog-Teaser, Newsletter · ISR 1h |
| Suche `/suche` | ✅ Fertig | Autocomplete (debounce 320ms), Ergebnisliste mit Preisen |
| Marktbericht `/marktbericht` | ✅ Fertig | KI-Wochenanalyse, ISR 7 Tage |
| Blog-Index `/artikel` | ✅ Fertig | 14 Tage, echte Artikel-Titel, Teaser-Texte, ISR 1h |
| Tagesartikel `/artikel/[date]` | ✅ Fertig | 7 Typen, ISR 24h, KI-generiert + Marco-Fallback |
| Karten-Detail `/karten/[id]` | ✅ Fertig | Preis (EUR), Score, Preis-Chart, JSON-LD SEO |
| Guides `/guides` | ✅ Fertig | 4 Guides, echte Kartenbilder + Booster-Pack-Artwork |
| Content Studio `/studio` | ✅ Fertig | HttpOnly-Cookie-Auth, 3 Tabs: Content / Monitoring / Reels |
| Monitoring `/monitoring` | ✅ Fertig | Eigene Seite (mobil-freundlich), Auth-geschützt |
| **Portfolio `/portfolio`** | ✅ Fertig | Finance-App-Style Tracker: localStorage, Custom SVG Chart, Live-Preise, P&L, EN/DE/JP/KR |
| **Reels Studio** | ✅ **Neu** | Video-Upload → Preview → Trim → FFmpeg → Instagram-Publish |
| Impressum & Datenschutz | ⚠️ Platzhalter | Eckige Klammern noch ersetzen! |
| Wöchentlicher Cron (Mo 07:00) | ✅ Aktiv | CRON_SECRET ✅ gesetzt |
| Täglicher Cron (08:00 UTC) | ✅ Aktiv | Speichert Preis-Snapshots in Supabase |
| Supabase Preis-Snapshots | ✅ Aktiv | Sammelt täglich echte Daten seit Inbetriebnahme |
| i18n DE/EN | ✅ Fertig | Cookie-basiert, NavBar-Umschalter |
| SEO | ✅ Fertig | JSON-LD, Sitemap, robots.txt, OpenGraph |
| Newsletter-System (Beehiiv) | ⏸ Bereit | Code fertig — `BEEHIIV_API_KEY` noch nicht gesetzt |
| Social-Media (Buffer) | ⏸ Bereit | Code fertig — `BUFFER_ACCESS_TOKEN` noch nicht gesetzt |
| Affiliate-Links | ⚠️ Standard-URLs | Eigene Links in Vercel noch nicht eingetragen |

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

### Priorität 1 — Rechtliches (Pflicht in Deutschland!)
- [ ] **Impressum** `/impressum` — alle `[Platzhalter]` mit echten Daten ersetzen
- [ ] **Datenschutz** `/datenschutz` — alle `[Platzhalter]` mit echten Daten ersetzen

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
6. **Preis-Historie:** Supabase-Snapshots (täglich) → Cardmarket-Interpolation → Beispielkurve
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

---

*Zuletzt aktualisiert: v2.2.0 — 22. Juni 2026*
