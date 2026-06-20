# Changelog — PokéMarket Intelligence

Alle Versionen und Änderungen. Format: [Semantic Versioning](https://semver.org/lang/de/) — `MAJOR.MINOR.PATCH`

> Dieses Changelog wird bei jedem Merge nach `main` aktualisiert.
> Die gleichen Informationen sind auch unter `/changelog` auf der Website sichtbar.

---

## [0.4.0] — 2026-06-20

### Neu
- **`/marktbericht`** — Wöchentliche KI-Marktanalyse (ISR 7 Tage), Hero mit KW-Anzeige, AI-Bericht-Card, Stats-Streifen, CardGrid, AffiliateBar, Newsletter
- **`/artikel`** — Blog-Index der letzten 14 Tage; Featured-Card ("Heute neu") + 13 weitere als weiße Cards
- **`/artikel/[date]`** — Tagesbasierte ISR-Artikel (24h Cache); 7 Typen je Wochentag:
  - Mo: Marktanalyse · Di: Karte im Fokus · Mi: Strategie · Do: Set-Analyse · Fr: Ausblick · Sa: Guide · So: Rückblick
- **`src/lib/article-generator.ts`** — KI-Artikel-Generator, `DAY_TYPE` Map, `ARTICLE_META` (Label, Emoji, Farbe)
- **`src/lib/newsletter-template.ts`** — `buildNewsletterHtml()`: tabellenbasiertes HTML-E-Mail-Template
- **`src/app/actions.ts`** — Server Action `publishMarktbericht()` für ISR-Revalidierung auf Knopfdruck
- **`/api/publish`** — REST-Endpoint (POST, CRON_SECRET geschützt) für Marktbericht-Revalidierung
- **`/api/cron/daily`** — Täglicher Cron-Job 08:00: heute's Artikel vorwärmen + `/artikel` revalidieren
- Homepage: Blog-Teaser-Sektion (3 Karten: Marktanalyse, Karte im Fokus, Investment-Tipp)
- Studio: Veröffentlichen-Button mit Live-Feedback (Globe-Icon → "✓ Live!" → "Ansehen →")
- NavBar: Marktbericht, Blog, Newsletter (hidden sm:block) + Studio (immer sichtbar)

### Geändert
- `vercel.json` — Zweiter Cron `0 8 * * *` für tägliches Artikel-Vorwärmen
- `src/lib/ai-generator.ts` — Importiert `buildNewsletterHtml`, strukturiertes JSON-Parsing für Newsletter
- `src/app/studio/page.tsx` — `publishing`/`published` State + `publishMarktbericht()` Integration
- `src/components/NavBar.tsx` — 4 Links statt 1; Marktbericht + Blog + Newsletter + Studio
- `/api/cron/route.ts` — Revalidiert jetzt auch `/artikel` nach der Wochenpipeline

---

## [0.3.0] — 2026-06-20

### Neu
- Studio: Schritt-für-Schritt Fortschrittsanzeige während Generierung (3 Schritte pro Typ)
- Studio: Sekunden-Timer mit "bitte nicht neu laden"-Warnung nach 20 s
- Studio: Letzter Output bleibt bei Browser-Reload erhalten (localStorage)
- Studio: Zeitstempel "vor X Min" bei gespeichertem Output
- Studio: Kopieren- & Löschen-Buttons für generierte Inhalte
- Studio: Mobile-optimiertes Layout (2-Spalten-Grid für Action-Buttons)
- NavBar: Sticky, Logo mit Zap-Icon, direkter Studio-Link
- Homepage: Kompakterer Hero auf Mobil, Trust-Badges, zwei CTAs
- AffiliateBar: Horizontal scrollbar auf Mobil mit Snap-Scroll
- NewsletterSignup: Perk-Liste (3 Vorteile), gelber CTA-Button, animierter Erfolgsscreen

---

## [0.2.0] — 2026-06-20

### Neu
- **`/impressum`** — Impressum (§ 5 TMG) mit Platzhaltern für persönliche Daten
- **`/datenschutz`** — DSGVO-konforme Datenschutzerklärung (Vercel, Beehiiv, Pokémon TCG API, Affiliate)
- **`/karten/[id]`** — Karten-Detailseite: Bild, Marktpreis, Trend, Investment-Score-Balken, Preis-Details
- **`src/components/PriceChart.tsx`** — 30-Tage-Preis-Chart (recharts AreaChart, violet Gradient)
- `CardGrid`: Jede Karte verlinkt jetzt auf `/karten/[id]`
- Footer auf jeder Seite mit Impressum/Datenschutz-Links
- `.claude/hooks/session-start.sh` — Auto-`npm install` beim Start neuer Remote-Sessions

---

## [0.1.0] — 2026-06-20

### Erstveröffentlichung
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, Vercel-Deployment
- **`/`** — Startseite: Karten-Preis-Grid, Investment-Scores, AffiliateBar, NewsletterSignup
- **`/studio`** — Content-Steuerzentrale: Integrations-Status + On-Demand-Generierung (5 Content-Typen)
- **`/api/cron`** — Wöchentliche Pipeline (Montag 07:00): Marktbericht → Newsletter → Video → Social
- **`/api/generate`** — On-Demand-Content-Generierung für Studio-Vorschau
- **`/api/status`** — Live-Status aller Integrationen
- **`/api/newsletter`** — Beehiiv Newsletter-Anmeldung
- `src/lib/pokemon-api.ts` — Pokémon TCG API, Investment-Score-Berechnung
- `src/lib/ai-generator.ts` — Claude KI-Engine: Marktbericht, Newsletter, Video-Skript, Social-Posts
- `src/lib/newsletter.ts` — Beehiiv-Versand (Draft-Modus)
- `src/lib/video-pipeline.ts` — ElevenLabs Voice + Remotion Render-Pipeline
- `src/lib/social-media.ts` — Buffer Scheduling für Insta/TikTok/Twitter
- `src/components/CardGrid.tsx` — Karten-Raster mit Score-Badge und Trend-Anzeige
- `src/components/AffiliateBar.tsx` — Affiliate-Partner-Leiste (Cardmarket, Amazon, Trade Republic)
- `src/components/NewsletterSignup.tsx` — E-Mail-Anmeldeformular
- Remotion-Animationen: YouTube 16:9 + Shorts 9:16
- `ANLEITUNG.md`, `DEPLOYMENT.md`, `STATUS.md` — Projekt-Dokumentation
