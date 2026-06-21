# Projekt-Status — PokéMarket Intelligence

**Version:** `v0.5.0` · **Stand:** 21. Juni 2026 · **Branch:** `main`

Diese Datei ist unser gemeinsames Logbuch: Was ist entschieden, was ist gebaut, was ist offen.

> Versionsverlauf: siehe [CHANGELOG.md](./CHANGELOG.md) · Live auf der Website: `/changelog`

---

## Was in welcher Version gebaut wurde

| Version | Datum | Inhalt |
|---|---|---|
| v0.1.0 | 20.06.2026 | Grundsystem: Homepage, Studio, Cron-Pipeline, KI-Engine, Newsletter, Video |
| v0.2.0 | 20.06.2026 | Impressum, Datenschutz, Karten-Detailseiten, Preis-Chart |
| v0.3.0 | 20.06.2026 | Mobile-Optimierung, Studio-Überarbeitung (localStorage, Timer, Fortschritt) |
| v0.4.0 | 20.06.2026 | Marktbericht, Blog, täglicher Cron, Artikel-Generator, Newsletter-Template |
| v0.4.x | 20.06.2026 | Echte Cardmarket-Preise (EUR), deutsche Namen (839), Supabase-Preisverlauf, Startseiten-Redesign, MoverList-Komponente |
| v0.5.0 | 21.06.2026 | i18n DE/EN, Autocomplete-Suche, Loading-Skeleton, SEO (JSON-LD, Sitemap, robots.txt), Version im Footer |

---

## Aktueller Stand (v0.4.0)

| Bereich | Status | Details |
|---|---|---|
| Startseite `/` | ✅ Fertig | Kartenpreise, Investment-Scores, Blog-Teaser, Newsletter |
| Marktbericht `/marktbericht` | ✅ Fertig | KI-Wochenanalyse, ISR 7 Tage |
| Blog-Index `/artikel` | ✅ Fertig | 14 Tage, Featured-Card, ISR 1h |
| Tagesartikel `/artikel/[date]` | ✅ Fertig | 7 Typen, ISR 24h, KI-generiert |
| Karten-Detail `/karten/[id]` | ✅ Fertig | Preis, Score, Chart |
| Content Studio `/studio` | ✅ Fertig | Generierung, localStorage, Timer, Veröffentlichen-Button |
| Impressum & Datenschutz | ✅ Fertig (Platzhalter) | Echte Daten noch eintragen! |
| Wöchentlicher Cron (Mo 07:00) | ✅ Fertig (Code) | Braucht API-Keys in Vercel |
| Täglicher Cron (08:00) | ✅ Fertig (Code) | Braucht `NEXT_PUBLIC_SITE_URL` in Vercel |
| Newsletter-System (Beehiiv) | ✅ Fertig (Code) | Braucht `BEEHIIV_API_KEY` |
| Video-Pipeline (Remotion) | ✅ Fertig (Code) | Braucht `ELEVENLABS_API_KEY` |
| Social-Media (Buffer) | ✅ Fertig (Code) | Braucht `BUFFER_ACCESS_TOKEN` |
| Affiliate-Links | ✅ Fertig (Code) | Eigene Links in Vercel-Env eintragen |

---

## Offene Aufgaben — von dir abzuarbeiten

### Priorität 1 — Damit der tägliche Cron läuft

- [ ] **`NEXT_PUBLIC_SITE_URL`** in Vercel eintragen (z. B. `https://newidea.vercel.app`)
  → Ohne diesen Wert wärmt der tägliche Cron `localhost:3000` vor — nutzlos

### Priorität 2 — Rechtliches (in Deutschland Pflicht!)

- [ ] **Impressum** `/impressum` — eckige Klammern mit echten Daten ersetzen
- [ ] **Datenschutz** `/datenschutz` — eckige Klammern mit echten Daten ersetzen

### Priorität 3 — Newsletter live schalten

- [ ] **Beehiiv-Account** erstellen → https://beehiiv.com/
- [ ] `BEEHIIV_API_KEY` in Vercel eintragen
- [ ] `BEEHIIV_PUBLICATION_ID` in Vercel eintragen

### Priorität 4 — Affiliate-Einnahmen aktivieren

- [ ] **Cardmarket-Affiliate** anmelden → eigenen Link in `NEXT_PUBLIC_CARDMARKET_URL` eintragen
- [ ] **Amazon PartnerNet** anmelden → Link in `NEXT_PUBLIC_AMAZON_URL` eintragen
- [ ] **Trade Republic** Affiliate → Link in `NEXT_PUBLIC_TRADE_REPUBLIC_URL` eintragen

### Priorität 5 — Optionale Erweiterungen

- [ ] `ELEVENLABS_API_KEY` — Video-Vertonung aktivieren
- [ ] `BUFFER_ACCESS_TOKEN` — Social-Media-Planung aktivieren
- [ ] YouTube-Kanal erstellen + YouTube Data API einrichten

---

## Unsere Entscheidungen (Logbuch)

1. **Projektrichtung:** Pokémon-Investment-Portal — wegen bestehender Content-Erfahrung + Community
2. **Maximale Automatisierung:** KI übernimmt Content-Erstellung, du steuerst & gibst frei
3. **Review-Modus als Standard:** Inhalte gehen erst als Entwurf raus
4. **Tech-Stack:** Next.js + Vercel + Claude + Remotion — 0–20 €/Monat Betriebskosten
5. **ISR statt Datenbank:** Artikel sind datums-basiert, kein DB-Setup nötig
6. **Versionierung:** Jede Änderung bekommt eine Versionsnummer im CHANGELOG + /changelog
7. **Einkommensziel:** 100–500 €/Monat in 6–12 Monaten

---

## Backlog (geplante Features)

- [ ] Echte Preis-Datenbank (Supabase) statt simulierter Trends
- [ ] Auto-Publish-Modus (ohne deinen Klick)
- [ ] Analytics-Dashboard (Einnahmen, Klicks, Conversions)
- [ ] Paid-Newsletter-Tier (5–9 €/Monat Premium-Analysen)
- [ ] YouTube-Thumbnail-Generator
- [ ] A/B-Tests für Betreffzeilen
- [ ] Mehr Affiliate-Partner (eBay, lokale Kartenshops)

---

## Fahrplan

| Zeitraum | Ziel | Erwartetes Einkommen |
|---|---|---|
| Monat 1–2 | Setup, erste Inhalte, online gehen | 0 € |
| Monat 3–4 | Erste Abonnenten, erste Affiliate-Klicks | 10–50 € |
| Monat 5–6 | 50–200 Newsletter-Abos, YouTube wächst | 100–300 € |
| Monat 7–12 | Skalierung, AdSense aktiv | 300–800 € |

---

*Zuletzt aktualisiert: v0.5.0 — 21. Juni 2026*
