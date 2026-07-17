# Projekt-Status — PokéMarket Intelligence

**Version:** `v2.8.1` · **Stand:** 17. Juli 2026 · **Branch:** `main`

Diese Datei ist unser gemeinsames Logbuch: Was ist entschieden, was ist gebaut, was ist offen.

> Versionsverlauf: siehe [CHANGELOG.md](./CHANGELOG.md) · Live auf der Website: `/changelog`

---

## Was gebaut ist (v2.7.2)

| Bereich | Status | Details |
|---|---|---|
| Startseite `/` | ✅ Fertig | Bloomberg/TradingView Dark Mode, PMI, Fear & Greed, Sparklines, Ticker · ISR 1h |
| Suche `/suche` | ✅ Fertig | Autocomplete (debounce 320ms), zentrale Filterung leerer Preview-Karten, Dark Dropdown |
| Marktbericht `/marktbericht` | ✅ Fertig | KI-Wochenanalyse, ISR 1h, Archiv `/marktbericht/archiv` + `/marktbericht/[week]` |
| Blog-Index `/artikel` | ✅ Fertig | Nur So/Do, echte Artikel-Titel, Teaser-Texte, ISR 1h |
| Tagesartikel `/artikel/[date]` | ✅ Fertig | Selbstheilend (on-demand-Generierung), ISR 24h, KI + Fallback, 404-Fix |
| Karten-Detail `/karten/[id]` | ✅ Fertig | Preis (EUR), Score, Preis-Chart, JSON-LD SEO, ISR 1h |
| Guides `/guides` | ✅ Fertig | 4 Guides, echte Kartenbilder + Booster-Pack-Artwork |
| Content Studio `/studio` | ✅ Fertig | HttpOnly-Cookie-Auth (timing-safe, fail-closed), 3 Tabs |
| Monitoring `/monitoring` | ✅ Fertig | Eigene Seite (mobil-freundlich), Auth-geschützt |
| Portfolio `/portfolio` | ✅ Fertig | Finance-App-Style, localStorage, SVG-Chart, Live-Preise, P&L an Zeitraum gekoppelt, EN/DE/JP/KR |
| Reels Studio | ✅ Fertig | Video-Upload → Preview → Trim → FFmpeg → Instagram-Publish |
| Design-System | ✅ Fertig | Einheitlicher Dark Mode über alle Seiten, in CLAUDE.md verankert |
| **Impressum & Datenschutz** | 🔴 **Platzhalter** | **Eckige Klammern = akutes Rechtsrisiko — echte Daten nötig!** |
| Wöchentlicher Cron (Mo 07:00) | ✅ Aktiv | Marktbericht + Newsletter-Draft, CRON_SECRET ✅ |
| Täglicher Cron (08:00 UTC) | ✅ Aktiv | Preis-Snapshots + Publish-Artikel (So/Do), verwaiste Crons entfernt |
| Supabase Preis-Snapshots | ✅ Aktiv | Sammelt täglich echte Daten seit Inbetriebnahme |
| i18n DE/EN | ✅ Fertig | Cookie-basiert, NavBar-Umschalter |
| SEO | ✅ Fertig | JSON-LD, Sitemap (inkl. Artikel/Guides/Berichte), robots.txt, OpenGraph |
| Tests | ✅ 73 grün | Vitest — Portfolio, Median, Card-Display, Artikel-Daten, Guides, Marktbericht |
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

---

*Zuletzt aktualisiert: v2.8.1 — 17. Juli 2026*
